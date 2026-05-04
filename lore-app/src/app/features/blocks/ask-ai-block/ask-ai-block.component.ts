import {
  Component, input, output, signal, computed,
  ChangeDetectionStrategy, inject, DestroyRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Block } from '../../../core/models/shelf.model';
import { AIResponseData } from '../../../core/models/ai.model';
import { AIService } from '../../../core/services/ai.service';
import { PROVIDER_MAP } from '../../../core/config/provider-registry';

@Component({
  selector: 'lore-ask-ai-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-ai-response">
      <!-- Header -->
      <div class="blk-ai-hdr">
        <div class="blk-ai-logo" [style.background]="providerColor()">
          {{ providerInitial() }}
        </div>
        <span class="blk-ai-model">
          Ask {{ providerName() }}
        </span>
        <div class="blk-ai-status" [class.connected]="!loading()" [class.streaming]="loading()">
          <span class="status-dot"></span>
          {{ loading() ? 'Streaming…' : 'Ready' }}
        </div>
      </div>

      <!-- Prompt input -->
      <textarea
        class="blk-ai-prompt"
        [value]="prompt()"
        (input)="onPromptInput($event)"
        (keydown)="onKeyDown($event)"
        [readOnly]="readOnly() || loading()"
        rows="3"
        [placeholder]="'Ask ' + providerName() + ' about this note… (⌘↵ to submit)'"
      ></textarea>

      <!-- Error state -->
      @if (error()) {
        <div class="blk-ai-error" role="alert">
          <span class="material-symbols-outlined">error_outline</span>
          {{ error() }}
        </div>
      }

      <!-- Response area -->
      @if (currentResponse()) {
        <div class="blk-ai-resp-area">
          <div class="blk-ai-text">
            {{ currentResponse()!.content }}
            @if (loading()) { <span class="cursor"></span> }
          </div>

          <!-- Response meta -->
          <div class="blk-ai-resp-meta">
            <span class="resp-timestamp">{{ currentResponse()!.timestamp | date:'short' }}</span>
            <span class="resp-model">{{ currentResponse()!.model }}</span>
          </div>
        </div>
      }

      <!-- Footer actions -->
      <div class="blk-ai-footer">
        <!-- Submit / Cancel -->
        @if (loading()) {
          <button class="blk-ai-run cancel" (click)="cancelRequest()">
            <span class="material-symbols-outlined">stop_circle</span> Cancel
          </button>
        } @else {
          <button class="blk-ai-run" (click)="run()" [disabled]="!prompt().trim()">
            ✦ Ask {{ providerName() }}
          </button>
        }

        <!-- Regenerate -->
        @if (currentResponse() && !loading()) {
          <button class="blk-ai-btn" (click)="regenerate()" title="Regenerate response">
            <span class="material-symbols-outlined">refresh</span>
          </button>
        }

        <!-- Copy -->
        @if (currentResponse() && !loading()) {
          <button class="blk-ai-btn" (click)="copyResponse()" title="Copy response">
            <span class="material-symbols-outlined">{{ copied() ? 'check' : 'content_copy' }}</span>
          </button>
        }

        <!-- History navigation -->
        @if (responses().length > 1) {
          <div class="blk-ai-nav" role="group" aria-label="Response history">
            <button
              class="blk-ai-btn nav-btn"
              (click)="previousResponse()"
              [disabled]="!hasPrevious()"
              title="Previous response"
              aria-label="Previous response"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="nav-counter" aria-live="polite">
              {{ currentIndex() + 1 }} / {{ responses().length }}
            </span>
            <button
              class="blk-ai-btn nav-btn"
              (click)="nextResponse()"
              [disabled]="!hasNext()"
              title="Next response"
              aria-label="Next response"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        }

        <span class="blk-ai-meta">Note context sent automatically</span>
      </div>
    </div>
  `,
  styles: [`
    .blk-ai-response {
      background: var(--lore-primitive-purple-50);
      border: 1px solid var(--lore-primitive-purple-200);
      border-radius: var(--lore-radius-lg);
      padding: 13px;
    }
    .blk-ai-hdr {
      display: flex; align-items: center; gap: 7px; margin-bottom: 10px;
    }
    .blk-ai-logo {
      width: 20px; height: 20px; border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .blk-ai-model {
      font-size: 12px; font-weight: 600; color: var(--lore-primitive-purple-600);
      font-family: 'JetBrains Mono', monospace;
    }
    .blk-ai-status {
      margin-left: auto; font-size: 10.5px; color: var(--lore-primitive-green-700);
      background: var(--lore-primitive-green-50); padding: 2px 8px;
      border-radius: 3px; font-family: 'JetBrains Mono', monospace;
      display: flex; align-items: center; gap: 4px;
      &.streaming {
        color: var(--lore-primitive-purple-700);
        background: var(--lore-primitive-purple-100);
      }
    }
    .status-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--lore-primitive-green-600);
      animation: pulse 2s infinite;
      .streaming & { background: var(--lore-primitive-purple-600); }
    }
    .blk-ai-prompt {
      width: 100%; border: 1px solid var(--lore-primitive-purple-200);
      background: var(--lore-color-bg-canvas);
      border-radius: var(--lore-radius-md); padding: 9px 11px;
      font-family: 'Lora', serif; font-size: 14px;
      color: var(--lore-color-text-muted); outline: none; resize: none;
      box-sizing: border-box;
      &::placeholder { color: var(--lore-color-text-faint); font-style: italic; }
      &:focus { border-color: var(--lore-primitive-purple-400); }
    }
    .blk-ai-error {
      margin-top: 8px; padding: 8px 12px;
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--lore-radius-md); color: #DC2626;
      font-size: 13px; display: flex; align-items: center; gap: 6px;
      .material-symbols-outlined { font-size: 16px; }
    }
    .blk-ai-resp-area {
      margin-top: 10px; padding: 10px 12px;
      background: var(--lore-color-bg-canvas);
      border: 1px solid var(--lore-primitive-purple-200);
      border-radius: var(--lore-radius-md);
    }
    .blk-ai-text {
      font-size: 14px; color: var(--lore-color-text-muted);
      line-height: 1.75; font-family: 'Lora', serif; white-space: pre-wrap;
    }
    .blk-ai-resp-meta {
      margin-top: 8px; display: flex; gap: 8px; align-items: center;
      border-top: 1px solid var(--lore-color-border); padding-top: 6px;
    }
    .resp-timestamp, .resp-model {
      font-size: 10px; color: var(--lore-color-text-faint);
      font-family: 'JetBrains Mono', monospace;
    }
    .cursor {
      display: inline-block; width: 2px; height: 1em;
      background: var(--lore-primitive-purple-600); margin-left: 2px;
      vertical-align: text-bottom; animation: blink 0.7s infinite;
    }
    .blk-ai-footer {
      margin-top: 9px; display: flex; gap: 5px; align-items: center; flex-wrap: wrap;
    }
    .blk-ai-run {
      font-size: 12px; font-weight: 500;
      background: var(--lore-primitive-purple-600); color: white;
      border: none; border-radius: var(--lore-radius-sm);
      padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 5px;
      transition: background 0.12s;
      &:hover:not(:disabled) { background: var(--lore-primitive-purple-700); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &.cancel { background: #DC2626; &:hover { background: #B91C1C; } }
      .material-symbols-outlined { font-size: 14px; }
    }
    .blk-ai-btn {
      font-size: 11px; color: var(--lore-color-text-faint);
      border: 1px solid var(--lore-color-border-strong);
      background: var(--lore-color-bg-canvas);
      border-radius: 5px; padding: 3px 8px; cursor: pointer;
      font-family: 'DM Sans', sans-serif; transition: 0.12s;
      display: flex; align-items: center; gap: 3px;
      &:hover:not(:disabled) { color: var(--lore-primitive-purple-600); border-color: var(--lore-primitive-purple-300); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      .material-symbols-outlined { font-size: 14px; }
    }
    .blk-ai-nav {
      display: flex; align-items: center; gap: 2px;
    }
    .nav-btn { padding: 3px 4px; }
    .nav-counter {
      font-size: 11px; color: var(--lore-color-text-faint);
      font-family: 'JetBrains Mono', monospace; min-width: 36px; text-align: center;
    }
    .blk-ai-meta {
      font-size: 11px; color: var(--lore-color-text-faint);
      margin-left: auto; font-family: 'JetBrains Mono', monospace;
    }
    @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  `]
})
export class AskAiBlockComponent {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  block    = input.required<Block>();
  provider = input<string>('anthropic');
  readOnly = input(false);
  changed  = output<{ blockId: string; content: string }>();

  // ── DI ───────────────────────────────────────────────────────────────────
  private readonly aiService  = inject(AIService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Signals ───────────────────────────────────────────────────────────────
  prompt           = signal('');
  responses        = signal<AIResponseData[]>([]);
  currentIndex     = signal(0);
  loading          = signal(false);
  error            = signal<string | null>(null);
  currentRequestId = signal<string | null>(null);
  copied           = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  currentResponse = computed(() => this.responses()[this.currentIndex()] ?? null);
  hasPrevious     = computed(() => this.currentIndex() > 0);
  hasNext         = computed(() => this.currentIndex() < this.responses().length - 1);
  providerName    = computed(() => PROVIDER_MAP.get(this.provider())?.displayName ?? this.provider());

  /** Single initial letter for the logo badge */
  providerInitial = computed(() => this.providerName().charAt(0).toUpperCase());

  /** Brand colour per provider */
  providerColor = computed(() => {
    switch (this.provider()) {
      case 'anthropic': return 'var(--lore-primitive-purple-600)';
      case 'openai':    return '#10A37F';
      case 'google':    return '#4285F4';
      case 'groq':      return '#F55036';
      default:          return 'var(--lore-primitive-purple-600)';
    }
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Seed prompt from block content if present
    if (this.block().content) {
      this.prompt.set(this.block().content);
    }
    // Restore persisted responses from block metadata
    const saved = this.block().metadata?.['responses'] as AIResponseData[] | undefined;
    if (saved?.length) {
      this.responses.set(saved);
      this.currentIndex.set(saved.length - 1);
    }
  }

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!this.loading() && this.prompt().trim()) {
        this.run();
      }
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  onPromptInput(e: Event): void {
    const value = (e.target as HTMLTextAreaElement).value;
    this.prompt.set(value);
    this.changed.emit({ blockId: this.block().id, content: value });
  }

  // ── Core actions ──────────────────────────────────────────────────────────

  run(): void {
    const promptText = this.prompt().trim();
    if (!promptText || this.loading()) return;

    this._submitPrompt(promptText);
  }

  regenerate(): void {
    const last = this.currentResponse();
    if (!last || this.loading()) return;
    this._submitPrompt(last.prompt);
  }

  cancelRequest(): void {
    const id = this.currentRequestId();
    if (id) {
      this.aiService.cancelRequest(id);
      this.currentRequestId.set(null);
    }
    this.loading.set(false);
  }

  copyResponse(): void {
    const content = this.currentResponse()?.content;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  previousResponse(): void {
    if (this.hasPrevious()) {
      this.currentIndex.update(i => i - 1);
    }
  }

  nextResponse(): void {
    if (this.hasNext()) {
      this.currentIndex.update(i => i + 1);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _submitPrompt(promptText: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Create a placeholder response entry for streaming into
    const requestId = crypto.randomUUID();
    const providerDef = PROVIDER_MAP.get(this.provider());
    const newEntry: AIResponseData = {
      id: requestId,
      prompt: promptText,
      content: '',
      providerId: this.provider(),
      model: providerDef?.defaultModel ?? '',
      timestamp: new Date(),
    };

    // Append to history and navigate to the new entry
    this.responses.update(list => [...list, newEntry]);
    this.currentIndex.set(this.responses().length - 1);
    this.currentRequestId.set(requestId);

    this.aiService
      .sendPrompt(this.provider(), promptText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: chunk => {
          if (chunk.error) {
            this.error.set(chunk.error);
            this._finaliseEntry(requestId, '', chunk.error);
            this.loading.set(false);
            this.currentRequestId.set(null);
            return;
          }

          if (chunk.delta) {
            // Accumulate delta into the current response entry
            this.responses.update(list =>
              list.map(r =>
                r.id === requestId
                  ? { ...r, content: r.content + chunk.delta }
                  : r
              )
            );
          }

          if (chunk.isComplete) {
            this.loading.set(false);
            this.currentRequestId.set(null);
          }
        },
        error: err => {
          const msg = err instanceof Error ? err.message : String(err);
          this.error.set(msg);
          this._finaliseEntry(requestId, '', msg);
          this.loading.set(false);
          this.currentRequestId.set(null);
        },
        complete: () => {
          this.loading.set(false);
          this.currentRequestId.set(null);
        }
      });
  }

  private _finaliseEntry(id: string, content: string, errorMsg?: string): void {
    this.responses.update(list =>
      list.map(r =>
        r.id === id
          ? { ...r, content: content || r.content, error: errorMsg }
          : r
      )
    );
  }
}
