import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ChatMessage } from '../../models';
import { AnthropicService } from '../../services/anthropic.service';
import { DataService } from '../../services/data.service';

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  renderedHtml?: SafeHtml;
  streaming?: boolean;
}

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.scss'],
})
export class ChatPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() activeNotebookId: string | null = null;

  @Output() closed = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);
  private anthropic = inject(AnthropicService);
  private data = inject(DataService);
  private cdr = inject(ChangeDetectorRef);

  entries: ChatEntry[] = [];
  inputText = '';
  isStreaming = false;
  errorMessage = '';

  // Section picker state
  showSectionPicker = false;
  sectionPickerEntryIndex = -1;
  sectionPickerMode: 'single' | 'conversation' = 'single';

  get hasApiKey(): boolean {
    return !!this.anthropic.getApiKey();
  }

  get notebooks() {
    return this.data.getState().notebooks;
  }

  get sections() {
    if (!this.activeNotebookId) return [];
    const nb = this.data.getState().notebooks.find(n => n.id === this.activeNotebookId);
    return nb?.sections ?? [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && !this.isOpen) {
      // Panel closed — reset error
      this.errorMessage = '';
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  async onSend(): Promise<void> {
    const text = this.inputText.trim();
    if (!text || this.isStreaming) return;

    this.inputText = '';
    this.errorMessage = '';

    // Add user message
    this.entries.push({ role: 'user', content: text });

    // Add empty assistant entry for streaming
    const assistantEntry: ChatEntry = { role: 'assistant', content: '', streaming: true };
    this.entries.push(assistantEntry);
    this.isStreaming = true;

    // Build messages array for API
    const messages: ChatMessage[] = this.entries
      .filter(e => !e.streaming || e.content)
      .slice(0, -1) // exclude the empty streaming entry
      .map(e => ({ role: e.role, content: e.content }));
    messages.push({ role: 'user', content: text });

    try {
      await this.anthropic.sendMessage(messages, (chunk) => {
        assistantEntry.content += chunk;
        assistantEntry.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(
          marked.parse(assistantEntry.content) as string
        );
        this.cdr.detectChanges();
      });
    } catch (err: any) {
      const code = err?.message ?? '';
      if (code === 'INVALID_KEY') {
        this.errorMessage = 'Invalid API key — check Settings';
      } else if (code === 'RATE_LIMITED') {
        this.errorMessage = 'Rate limit reached — try again shortly';
      } else if (code === 'NETWORK_ERROR') {
        this.errorMessage = 'Could not reach Anthropic — check your connection';
      } else if (code === 'STREAM_INTERRUPTED') {
        assistantEntry.content += '\n\n*Response was cut short.*';
      } else {
        this.errorMessage = 'Something went wrong — please try again';
      }
    } finally {
      assistantEntry.streaming = false;
      assistantEntry.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(
        marked.parse(assistantEntry.content) as string
      );
      this.isStreaming = false;
      this.cdr.detectChanges();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onSaveResponse(index: number): void {
    this.sectionPickerEntryIndex = index;
    this.sectionPickerMode = 'single';
    this.showSectionPicker = true;
  }

  onSaveConversation(): void {
    this.sectionPickerMode = 'conversation';
    this.showSectionPicker = true;
  }

  onSectionSelected(notebookId: string, sectionId: string): void {
    this.showSectionPicker = false;

    if (this.sectionPickerMode === 'single') {
      const entry = this.entries[this.sectionPickerEntryIndex];
      if (!entry) return;
      // Find the preceding user message as context
      const userMsg = this.entries.slice(0, this.sectionPickerEntryIndex)
        .reverse().find(e => e.role === 'user');
      const markdown = userMsg
        ? `**Question:** ${userMsg.content}\n\n---\n\n${entry.content}`
        : entry.content;
      const title = this.extractTitle(entry.content);
      this.data.addNote(notebookId, sectionId, title, 'rich', { markdown });
      this.data.showToast('✓ Saved as note');
    } else {
      // Save full conversation
      const markdown = this.entries.map(e =>
        e.role === 'user'
          ? `**You:** ${e.content}`
          : `**Claude:** ${e.content}`
      ).join('\n\n---\n\n');
      const firstUser = this.entries.find(e => e.role === 'user');
      const title = firstUser ? this.extractTitle(firstUser.content) : 'Chat Conversation';
      this.data.addNote(notebookId, sectionId, title, 'rich', { markdown });
      this.data.showToast('✓ Conversation saved as note');
    }
  }

  onSectionPickerCancelled(): void {
    this.showSectionPicker = false;
  }

  clearChat(): void {
    this.entries = [];
    this.errorMessage = '';
  }

  private extractTitle(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    if (!lines.length) return 'Chat Note';
    const first = lines[0].replace(/^#+\s*/, '').trim();
    return first.substring(0, 80) || 'Chat Note';
  }
}
