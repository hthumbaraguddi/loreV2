import {
  Component, input, output, signal, computed,
  ChangeDetectionStrategy, inject, DestroyRef, HostListener, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Block } from '../../../core/models/shelf.model';
import { AIResponseData } from '../../../core/models/ai.model';
import { AIService } from '../../../core/services/ai.service';
import { ApiKeyManagerService } from '../../../core/services/api-key-manager.service';
import { PROVIDER_MAP, PROVIDER_REGISTRY, ProviderDefinition } from '../../../core/config/provider-registry';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'lore-ask-ai-block',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-ai-response">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="blk-ai-hdr">
        <div class="blk-ai-logo" [style.background]="providerColor()">
          {{ providerInitial() }}
        </div>

        <!-- Provider picker -->
        <div class="blk-ai-provider-wrap">
          <button
            class="blk-ai-provider-btn"
            (click)="toggleProviderPicker()"
            [disabled]="loading()"
            title="Switch AI provider"
            aria-haspopup="listbox"
            [attr.aria-expanded]="providerPickerOpen()"
          >
            <span class="provider-name">{{ providerName() }}</span>
            <span class="material-symbols-outlined picker-chevron">expand_more</span>
          </button>

          @if (providerPickerOpen()) {
            <div class="provider-dropdown" role="listbox" aria-label="Select AI provider">
              @for (p of allProviders; track p.id) {
                <button
                  class="provider-option"
                  role="option"
                  [class.active]="p.id === activeProvider()"
                  [class.unconfigured]="!keyManager.hasKey(p.id)"
                  (click)="selectProvider(p.id)"
                >
                  <span class="opt-dot" [style.background]="providerColorFor(p.id)"></span>
                  <span class="opt-name">{{ p.displayName }}</span>
                  @if (!keyManager.hasKey(p.id)) {
                    <span class="opt-badge">no key</span>
                  } @else {
                    <span class="opt-badge configured">ready</span>
                  }
                </button>
              }
            </div>
          }
        </div>

        <div class="blk-ai-status" [class.streaming]="loading()">
          <span class="status-dot"></span>
          {{ loading() ? 'Streaming…' : 'Ready' }}
        </div>
      </div>

      <!-- No API key warning -->
      @if (!hasApiKey()) {
        <div class="blk-ai-no-key" role="alert">
          <span class="material-symbols-outlined">key_off</span>
          <span>No API key configured for {{ providerName() }}.</span>
          <a class="blk-ai-settings-link" routerLink="/settings" fragment="ai-providers">
            Add key in Settings →
          </a>
        </div>
      }

      <!-- Prompt input -->
      <textarea
        class="blk-ai-prompt"
        [value]="prompt()"
        (input)="onPromptInput($event)"
        (keydown)="onKeyDown($event)"
        [readOnly]="readOnly() || loading()"
        [disabled]="!hasApiKey()"
        rows="3"
        [placeholder]="hasApiKey() ? 'Ask ' + providerName() + ' about this note… (⌘↵ to submit)' : 'Configure an API key to use this block'"
      ></textarea>

      <!-- Error state -->
      @if (error()) {
        <div class="blk-ai-error" role="alert">
          <span class="material-symbols-outlined">error_outline</span>
          <span>{{ error() }}</span>
          @if (isAuthError()) {
            <a class="blk-ai-settings-link" routerLink="/settings" fragment="ai-providers">
              Check API key →
            </a>
          }
        </div>
      }

      <!-- Response area -->
      @if (currentResponse()) {
        <div class="blk-ai-resp-area">
          <!-- Streaming: plain text for performance; complete: rendered markdown -->
          @if (loading()) {
            <div class="blk-ai-text streaming-text">
              {{ currentResponse()!.content }}<span class="cursor"></span>
            </div>
          } @else {
            <div
              class="blk-ai-text markdown-body"
              [innerHTML]="currentResponse()!.content | markdown"
            ></div>
          }

          <!-- Response meta -->
          <div class="blk-ai-resp-meta">
            <span class="resp-timestamp">{{ currentResponse()!.timestamp | date:'short' }}</span>
            <span class="resp-model">{{ currentResponse()!.model }}</span>
            @if (currentResponse()!.tokensUsed) {
              <span class="resp-tokens">{{ currentResponse()!.tokensUsed }} tokens</span>
            }
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
          <button class="blk-ai-run" (click)="run()" [disabled]="!prompt().trim() || !hasApiKey()">
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

    /* ── Header ─────────────────────────────────────────────────────── */
    .blk-ai-hdr {
      display: flex; align-items: center; gap: 7px; margin-bottom: 10px;
    }
    .blk-ai-logo {
      width: 20px; height: 20px; border-radius: 5px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white;
    }

    /* Provider picker */
    .blk-ai-provider-wrap { position: relative; }
    .blk-ai-provider-btn {
      display: flex; align-items: center; gap: 3px;
      background: transparent; border: none; cursor: pointer; padding: 2px 4px;
      border-radius: var(--lore-radius-sm);
      font-size: 12px; font-weight: 600; color: var(--lore-primitive-purple-600);
      font-family: 'JetBrains Mono', monospace; transition: background 0.1s;
      &:hover:not(:disabled) { background: var(--lore-primitive-purple-100); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .picker-chevron { font-size: 14px; }
    .provider-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      box-shadow: var(--lore-shadow-lg);
      padding: 4px; min-width: 200px;
    }
    .provider-option {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 7px 10px; border: none; background: transparent;
      border-radius: var(--lore-radius-sm); cursor: pointer; text-align: left;
      font-size: 13px; color: var(--lore-color-text-default); transition: background 0.1s;
      &:hover { background: var(--lore-color-accent-subtle); }
      &.active { background: var(--lore-color-accent-subtle); color: var(--lore-color-accent); }
      &.unconfigured { opacity: 0.65; }
    }
    .opt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .opt-name { flex: 1; font-size: 13px; }
    .opt-badge {
      font-size: 10px; font-family: 'JetBrains Mono', monospace;
      padding: 1px 5px; border-radius: 3px;
      background: rgba(239,68,68,0.1); color: #DC2626;
      &.configured { background: rgba(16,163,127,0.1); color: #059669; }
    }

    /* Status pill */
    .blk-ai-status {
      margin-left: auto; font-size: 10.5px; color: var(--lore-primitive-green-700);
      background: var(--lore-primitive-green-50); padding: 2px 8px;
      border-radius: 3px; font-family: 'JetBrains Mono', monospace;
      display: flex; align-items: center; gap: 4px;
      &.streaming { color: var(--lore-primitive-purple-700); background: var(--lore-primitive-purple-100); }
    }
    .status-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--lore-primitive-green-600); animation: pulse 2s infinite;
      .streaming & { background: var(--lore-primitive-purple-600); }
    }
    /* No API key warning */
    .blk-ai-no-key {
      margin-bottom: 8px; padding: 8px 12px;
      background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3);
      border-radius: var(--lore-radius-md); color: #92400E;
      font-size: 13px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      .material-symbols-outlined { font-size: 16px; color: #D97706; flex-shrink: 0; }
    }
    .blk-ai-settings-link {
      color: var(--lore-primitive-purple-600); text-decoration: none; font-weight: 500;
      font-size: 12px; white-space: nowrap;
      &:hover { text-decoration: underline; }
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
      &:disabled { opacity: 0.5; cursor: not-allowed; background: var(--lore-color-bg-surface); }
    }
    .blk-ai-error {
      margin-top: 8px; padding: 8px 12px;
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
      border-radius: var(--lore-radius-md); color: #DC2626;
      font-size: 13px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      .material-symbols-outlined { font-size: 16px; flex-shrink: 0; }
    }
    .blk-ai-resp-area {
      margin-top: 10px; padding: 10px 12px;
      background: var(--lore-color-bg-canvas);
      border: 1px solid var(--lore-primitive-purple-200);
      border-radius: var(--lore-radius-md);
    }
    /* Plain text during streaming */
    .blk-ai-text {
      font-size: 14px; color: var(--lore-color-text-muted);
      line-height: 1.75; font-family: 'Lora', serif;
    }
    .streaming-text { white-space: pre-wrap; }
    /* Markdown rendered output */
    .markdown-body {
      ::ng-deep {
        p { margin: 0 0 0.75em; &:last-child { margin-bottom: 0; } }
        h1, h2, h3 {
          font-family: 'DM Sans', sans-serif; font-weight: 600;
          color: var(--lore-color-text-default); margin: 0.9em 0 0.4em;
          &:first-child { margin-top: 0; }
        }
        h1 { font-size: 1.15em; }
        h2 { font-size: 1.05em; }
        h3 { font-size: 0.97em; }
        strong { font-weight: 600; color: var(--lore-color-text-default); }
        em { font-style: italic; }
        code {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          background: var(--lore-primitive-purple-100);
          color: var(--lore-primitive-purple-700);
          padding: 1px 5px; border-radius: 3px;
        }
        pre {
          background: var(--lore-color-bg-surface); border: 1px solid var(--lore-color-border);
          border-radius: var(--lore-radius-md); padding: 10px 12px;
          overflow-x: auto; margin: 0.6em 0;
          code {
            background: none; color: var(--lore-color-text-default);
            padding: 0; font-size: 12.5px; line-height: 1.6;
          }
        }
        ul, ol { padding-left: 1.4em; margin: 0.5em 0; }
        li { margin: 0.2em 0; }
        blockquote {
          border-left: 3px solid var(--lore-primitive-purple-300);
          margin: 0.6em 0; padding: 4px 12px;
          color: var(--lore-color-text-muted); font-style: italic;
        }
        hr { border: none; border-top: 1px solid var(--lore-color-border); margin: 0.8em 0; }
        a { color: var(--lore-primitive-purple-600); text-decoration: none;
          &:hover { text-decoration: underline; } }
      }
    }
    .blk-ai-resp-meta {
      margin-top: 8px; display: flex; gap: 8px; align-items: center;
      border-top: 1px solid var(--lore-color-border); padding-top: 6px;
    }
    .resp-timestamp, .resp-model, .resp-tokens {
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
export class AskAiBlockComponent implements OnInit {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  block    = input.required<Block>();
  readOnly = input(false);
  changed  = output<{ blockId: string; content: string; metadata?: Record<string, any> }>();

  // ── DI ───────────────────────────────────────────────────────────────────
  private readonly aiService  = inject(AIService);
  readonly keyManager         = inject(ApiKeyManagerService);
  private readonly destroyRef = inject(DestroyRef);

  // ── All providers from registry ───────────────────────────────────────────
  readonly allProviders: ProviderDefinition[] = PROVIDER_REGISTRY;

  // ── Signals ───────────────────────────────────────────────────────────────
  /** Active provider ID — read from block.metadata.provider on init */
  activeProvider     = signal<string>('anthropic');
  providerPickerOpen = signal(false);
  prompt             = signal('');
  responses          = signal<AIResponseData[]>([]);
  currentIndex       = signal(0);
  loading            = signal(false);
  error              = signal<string | null>(null);
  currentRequestId   = signal<string | null>(null);
  copied             = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  currentResponse = computed(() => this.responses()[this.currentIndex()] ?? null);
  hasPrevious     = computed(() => this.currentIndex() > 0);
  hasNext         = computed(() => this.currentIndex() < this.responses().length - 1);
  providerName    = computed(() => PROVIDER_MAP.get(this.activeProvider())?.displayName ?? this.activeProvider());
  providerInitial = computed(() => this.providerName().charAt(0).toUpperCase());
  hasApiKey       = computed(() => this.keyManager.hasKey(this.activeProvider()));
  isAuthError     = computed(() => {
    const e = this.error();
    return e ? /401|403|unauthorized|invalid.*key|api key/i.test(e) : false;
  });
  providerColor = computed(() => this.providerColorFor(this.activeProvider()));

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const meta = this.block().metadata ?? {};
    if (meta['provider']) {
      this.activeProvider.set(meta['provider'] as string);
    }
    if (this.block().content) {
      this.prompt.set(this.block().content);
    }
    const saved = meta['responses'] as AIResponseData[] | undefined;
    if (saved?.length) {
      this.responses.set(saved);
      this.currentIndex.set(saved.length - 1);
    }
  }

  // ── Provider picker ───────────────────────────────────────────────────────
  toggleProviderPicker(): void {
    this.providerPickerOpen.update(v => !v);
  }

  selectProvider(id: string): void {
    this.activeProvider.set(id);
    this.providerPickerOpen.set(false);
    this.error.set(null);
    this._emitMetadataChange();
  }

  providerColorFor(id: string): string {
    switch (id) {
      case 'anthropic': return 'var(--lore-primitive-purple-600)';
      case 'openai':    return '#10A37F';
      case 'google':    return '#4285F4';
      case 'groq':      return '#F55036';
      default:          return 'var(--lore-primitive-purple-600)';
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!this.loading() && this.prompt().trim()) this.run();
    }
    if (event.key === 'Escape' && this.providerPickerOpen()) {
      this.providerPickerOpen.set(false);
    }
  }

  // ── Close picker on outside click ─────────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.providerPickerOpen() && !target.closest('.blk-ai-provider-wrap')) {
      this.providerPickerOpen.set(false);
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
    if (this.hasPrevious()) this.currentIndex.update(i => i - 1);
  }

  nextResponse(): void {
    if (this.hasNext()) this.currentIndex.update(i => i + 1);
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private _submitPrompt(promptText: string): void {
    this.loading.set(true);
    this.error.set(null);

    const requestId = crypto.randomUUID();
    const providerDef = PROVIDER_MAP.get(this.activeProvider());
    const newEntry: AIResponseData = {
      id: requestId,
      prompt: promptText,
      content: '',
      providerId: this.activeProvider(),
      model: providerDef?.defaultModel ?? '',
      timestamp: new Date(),
    };

    this.responses.update(list => [...list, newEntry]);
    this.currentIndex.set(this.responses().length - 1);
    this.currentRequestId.set(requestId);

    this.aiService
      .sendPrompt(this.activeProvider(), promptText)
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
            this.responses.update(list =>
              list.map(r => r.id === requestId ? { ...r, content: r.content + chunk.delta } : r)
            );
          }
          if (chunk.isComplete) {
            this.loading.set(false);
            this.currentRequestId.set(null);
            this._emitMetadataChange();
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
      list.map(r => r.id === id ? { ...r, content: content || r.content, error: errorMsg } : r)
    );
  }

  /** Persist provider choice + response history into block metadata */
  private _emitMetadataChange(): void {
    this.changed.emit({
      blockId: this.block().id,
      content: this.prompt(),
      metadata: {
        ...(this.block().metadata ?? {}),
        provider: this.activeProvider(),
        responses: this.responses(),
      }
    });
  }
}