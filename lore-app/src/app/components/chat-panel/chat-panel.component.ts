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
import { AnthropicService, AI_PROVIDERS } from '../../services/anthropic.service';
import { DataService } from '../../services/data.service';

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  renderedHtml?: SafeHtml;
  streaming?: boolean;
  saved?: boolean;
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
  @Input() initialPrompt = '';

  @Output() closed = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);
  readonly anthropic = inject(AnthropicService);
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

  get providerLabel(): string {
    const pid = this.anthropic.getProviderId();
    const provider = AI_PROVIDERS.find(p => p.id === pid);
    return provider ? `Ask ${provider.name}` : 'Ask AI';
  }

  get assistantLabel(): string {
    const pid = this.anthropic.getProviderId();
    const provider = AI_PROVIDERS.find(p => p.id === pid);
    return provider?.name ?? 'AI';
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
      this.errorMessage = '';
    }
    if (changes['initialPrompt'] && this.initialPrompt) {
      this.inputText = this.initialPrompt;
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
        this.errorMessage = 'Could not reach the AI provider — check your connection';
      } else if (code === 'STREAM_INTERRUPTED') {
        assistantEntry.content += '\n\n*Response was cut short.*';
      } else if (code.startsWith('API_ERROR:')) {
        const status = code.split(':')[1];
        this.errorMessage = `API error (HTTP ${status}) — check the browser console for details`;
      } else {
        console.error('[ChatPanel] Unexpected error:', err);
        this.errorMessage = 'Something went wrong — check the browser console for details';
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
      const userMsg = this.entries.slice(0, this.sectionPickerEntryIndex)
        .reverse().find(e => e.role === 'user');
      const markdown = userMsg
        ? `**Question:** ${userMsg.content}\n\n---\n\n${entry.content}`
        : entry.content;
      const title = this.extractTitle(entry.content);
      this.data.addNote(notebookId, sectionId, title, 'rich', { markdown });
      entry.saved = true;
      this.data.showToast('✓ Saved as note');
    } else {
      const markdown = this.entries.map(e =>
        e.role === 'user'
          ? `**You:** ${e.content}`
          : `**${this.assistantLabel}:** ${e.content}`
      ).join('\n\n---\n\n');
      const firstUser = this.entries.find(e => e.role === 'user');
      const title = firstUser ? this.extractTitle(firstUser.content) : 'Chat Conversation';
      this.data.addNote(notebookId, sectionId, title, 'rich', { markdown });
      // Mark all assistant entries as saved
      this.entries.forEach(e => { if (e.role === 'assistant') e.saved = true; });
      this.data.showToast('✓ Conversation saved as note');
    }
    this.cdr.detectChanges();
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
