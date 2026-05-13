import {
  Component, signal, computed, inject, DestroyRef,
  ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AIService } from '../../core/services/ai.service';
import { ApiKeyManagerService } from '../../core/services/api-key-manager.service';
import { AiBehaviourService } from '../../core/services/ai-behaviour.service';
import { LayoutService } from '../../core/services/layout.service';
import { ChatHistoryService } from '../../core/services/chat-history.service';
import { PROVIDER_REGISTRY, PROVIDER_MAP } from '../../core/config/provider-registry';
import { BlockService } from '../../core/services/block.service';
import { EditorService } from '../../core/services/editor.service';
import { ShelfService } from '../../core/services/shelf.service';
import { BlockType } from '../../core/models/shelf.model';

// ── Types (exported so ChatHistoryService can import them) ────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  providerId: string;
  model: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'lore-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent implements AfterViewChecked {

  // ── DI ───────────────────────────────────────────────────────────────────
  readonly aiService       = inject(AIService);
  readonly keyManager      = inject(ApiKeyManagerService);
  readonly aiBehaviour     = inject(AiBehaviourService);
  readonly layoutService   = inject(LayoutService);
  readonly history         = inject(ChatHistoryService);
  readonly blockService    = inject(BlockService);
  readonly editorService   = inject(EditorService);
  readonly shelfService    = inject(ShelfService);
  private readonly destroyRef = inject(DestroyRef);

  // ── View refs ─────────────────────────────────────────────────────────────
  @ViewChild('messagesEnd') messagesEnd?: ElementRef<HTMLDivElement>;
  @ViewChild('promptInput') promptInput?: ElementRef<HTMLTextAreaElement>;

  // ── Registry ──────────────────────────────────────────────────────────────
  readonly providerRegistry = PROVIDER_REGISTRY;

  // ── Local UI signals (not persisted) ─────────────────────────────────────

  /** Currently selected provider ID (initialized from AiBehaviourService) */
  readonly selectedProviderId = signal<string>(
    this.aiBehaviour.defaultProvider() || PROVIDER_REGISTRY[0]?.id || 'anthropic'
  );

  /** Currently selected model ID (defaults to provider default) */
  readonly selectedModelId = signal<string>('');

  /** Current prompt text */
  readonly promptText = signal<string>('');

  /** Whether a request is in flight */
  readonly isStreaming = signal<boolean>(false);

  /** Active request ID for cancellation */
  readonly activeRequestId = signal<string | null>(null);

  /** Whether to auto-scroll to bottom */
  private _shouldScrollToBottom = false;

  // ── Delegated signals from history service ────────────────────────────────

  readonly sessions        = this.history.sessions;
  readonly activeSessionId = this.history.activeSessionId;

  // ── Computed ──────────────────────────────────────────────────────────────

  /** The active session object */
  readonly activeSession = computed<ChatSession | null>(() => {
    const id = this.activeSessionId();
    return this.sessions().find(s => s.id === id) ?? null;
  });

  /** Messages in the active session */
  readonly messages = computed<ChatMessage[]>(() =>
    this.activeSession()?.messages ?? []
  );

  /** The selected provider definition */
  readonly selectedProvider = computed(() =>
    PROVIDER_MAP.get(this.selectedProviderId()) ?? null
  );

  /** Available models for the selected provider */
  readonly availableModels = computed(() =>
    this.selectedProvider()?.availableModels ?? []
  );

  /** Effective model ID (selected or provider default) */
  readonly effectiveModel = computed(() =>
    this.selectedModelId() || (this.selectedProvider()?.defaultModel ?? '')
  );

  /** Whether the selected provider has a key configured */
  readonly hasKey = computed(() =>
    this.keyManager.hasKey(this.selectedProviderId())
  );

  /** Whether the send button should be enabled */
  readonly canSend = computed(() =>
    this.hasKey() &&
    this.promptText().trim().length > 0 &&
    !this.isStreaming()
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngAfterViewChecked(): void {
    if (this._shouldScrollToBottom) {
      this._scrollToBottom();
      this._shouldScrollToBottom = false;
    }
  }

  // ── Session management ────────────────────────────────────────────────────

  newSession(): void {
    this.history.createSession(this.selectedProviderId());
    this._shouldScrollToBottom = true;
  }

  selectSession(id: string): void {
    this.history.setActiveSession(id);
    this._shouldScrollToBottom = true;
  }

  deleteSession(id: string, event: Event): void {
    event.stopPropagation();
    this.history.deleteSession(id);
  }

  // ── Provider / model selection ────────────────────────────────────────────

  onProviderChange(id: string): void {
    this.selectedProviderId.set(id);
    this.selectedModelId.set('');
  }

  onModelChange(id: string): void {
    this.selectedModelId.set(id);
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (this.canSend()) {
        this.sendMessage();
      }
    }
  }

  sendMessage(): void {
    const text = this.promptText().trim();
    if (!text || this.isStreaming()) return;

    // Ensure there's an active session
    if (!this.activeSessionId()) {
      this.history.createSession(this.selectedProviderId());
    }

    const sessionId = this.activeSessionId()!;
    const providerId = this.selectedProviderId();
    const model = this.effectiveModel();

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      providerId,
      model,
      timestamp: new Date(),
    };
    this.history.appendMessage(sessionId, userMsg);
    this.promptText.set('');
    this._shouldScrollToBottom = true;

    // Add placeholder assistant message for streaming
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      providerId,
      model,
      timestamp: new Date(),
      isStreaming: true,
    };
    this.history.appendMessage(sessionId, assistantMsg);
    this.isStreaming.set(true);

    // Update session title from first user message
    this._maybeUpdateTitle(sessionId, text);

    // Build system prompt with context from AI Behaviour settings
    const activeNoteRef = this.editorService.getActiveNote();
    let noteContext = '';
    
    if (activeNoteRef && this.aiBehaviour.includeNoteContext()) {
      const fullNote = this.shelfService.getNote(activeNoteRef.id);
      if (fullNote) {
        // Combine note title, content, and blocks
        noteContext = `# ${fullNote.title}\n\n${fullNote.content}`;
        
        // Add block content if any
        if (fullNote.blocks && fullNote.blocks.length > 0) {
          const blockContent = fullNote.blocks
            .map(block => block.content)
            .filter(Boolean)
            .join('\n\n');
          if (blockContent) {
            noteContext += `\n\n${blockContent}`;
          }
        }
      }
    }
    
    // Get profile bio context (would come from profile service in real implementation)
    const bioContext = 'Enterprise AI consultant. Working across SAP BTP, ServiceNow Now Assist, Salesforce Einstein. Focus on RAG, LLM fine-tuning, prompt engineering for enterprise workflows.';
    
    const systemPrompt = this.aiBehaviour.buildSystemPrompt(
      this.aiBehaviour.includeBioContext() ? bioContext : undefined,
      noteContext || undefined
    );

    // Get request options from AI Behaviour settings
    const options = {
      model,
      ...this.aiBehaviour.getRequestOptions(),
      systemPrompt: systemPrompt || undefined,
    };

    // Stream the response
    this.aiService
      .sendPrompt(providerId, text, options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: chunk => {
          if (chunk.error) {
            this.history.patchMessage(sessionId, assistantMsgId, {
              error: chunk.error,
              isStreaming: false,
            });
            this.isStreaming.set(false);
            this.activeRequestId.set(null);
            return;
          }

          if (chunk.delta) {
            this.history.appendDelta(sessionId, assistantMsgId, chunk.delta);
            this._shouldScrollToBottom = true;
          }

          if (chunk.isComplete) {
            this.history.patchMessage(sessionId, assistantMsgId, { isStreaming: false });
            this.history.persistNow(); // flush full streamed content to localStorage
            this.isStreaming.set(false);
            this.activeRequestId.set(null);
          }
        },
        error: err => {
          const msg = err instanceof Error ? err.message : String(err);
          this.history.patchMessage(sessionId, assistantMsgId, {
            error: msg,
            isStreaming: false,
          });
          this.isStreaming.set(false);
          this.activeRequestId.set(null);
        },
        complete: () => {
          this.history.patchMessage(sessionId, assistantMsgId, { isStreaming: false });
          this.history.persistNow();
          this.isStreaming.set(false);
          this.activeRequestId.set(null);
        },
      });
  }

  cancelStreaming(): void {
    const id = this.activeRequestId();
    if (id) {
      this.aiService.cancelRequest(id);
      this.activeRequestId.set(null);
    }
    this.isStreaming.set(false);

    // Mark the last assistant message as no longer streaming and persist
    const session = this.activeSession();
    if (session) {
      const last = [...session.messages].reverse().find(m => m.role === 'assistant');
      if (last) {
        this.history.patchMessage(session.id, last.id, { isStreaming: false });
        this.history.persistNow();
      }
    }
  }

  copyMessage(content: string): void {
    navigator.clipboard.writeText(content).catch(() => {
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  }

  close(): void {
    this.layoutService.closeRightPanel();
  }

  saveAsBlock(content: string): void {
    const activeNote = this.editorService.getActiveNote();
    if (!activeNote) {
      console.warn('No active note open — open a note first to save AI responses as blocks.');
      return;
    }

    const noteId = activeNote.id;
    const note = this.shelfService.getNote(noteId);
    const afterIndex = note?.blocks?.length ? note.blocks.length - 1 : -1;

    this.blockService.createBlock(
      noteId,
      BlockType.Note,
      afterIndex,
      content
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _maybeUpdateTitle(sessionId: string, firstUserText: string): void {
    const session = this.sessions().find(s => s.id === sessionId);
    // Only auto-title on the very first user message
    if (session && session.messages.filter(m => m.role === 'user').length === 1) {
      const title = firstUserText.slice(0, 40) + (firstUserText.length > 40 ? '…' : '');
      this.history.updateTitle(sessionId, title);
    }
  }

  private _scrollToBottom(): void {
    this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  providerColor(providerId: string): string {
    switch (providerId) {
      case 'anthropic': return 'var(--lore-primitive-purple-600)';
      case 'openai':    return '#10A37F';
      case 'google':    return '#4285F4';
      case 'groq':      return '#F55036';
      default:          return 'var(--lore-primitive-purple-600)';
    }
  }

  providerInitial(providerId: string): string {
    return (PROVIDER_MAP.get(providerId)?.displayName ?? providerId).charAt(0).toUpperCase();
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
