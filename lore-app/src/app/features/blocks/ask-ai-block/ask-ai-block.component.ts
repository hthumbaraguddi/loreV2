import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-ask-ai-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-ai-response">
      <!-- Header -->
      <div class="blk-ai-hdr">
        <div class="blk-ai-logo" [class.claude]="model() === 'claude'" [class.gpt]="model() === 'gpt'">
          {{ model() === 'claude' ? 'C' : 'G' }}
        </div>
        <span class="blk-ai-model">
          Ask {{ model() === 'claude' ? 'Claude' : 'GPT' }} — Live API
        </span>
        <div class="blk-ai-status" [class.connected]="true">
          <span class="status-dot"></span>
          Connected
        </div>
      </div>

      <!-- Prompt input -->
      <textarea
        class="blk-ai-prompt"
        [value]="block().content"
        (input)="onInput($event)"
        [readOnly]="readOnly() || loading()"
        rows="3"
        [placeholder]="'Ask ' + (model() === \'claude\' ? \'Claude\' : \'GPT\') + \' about this note…\'"
      ></textarea>

      <!-- Response -->
      @if (response()) {
        <div class="blk-ai-resp-area">
          <div class="blk-ai-text">
            {{ response() }}
            @if (loading()) { <span class="cursor"></span> }
          </div>
        </div>
      }

      <!-- Footer actions -->
      <div class="blk-ai-footer">
        <button class="blk-ai-run" (click)="run()" [disabled]="loading()">
          @if (loading()) {
            <span class="thinking-dot"></span> Thinking…
          } @else {
            ✦ Ask {{ model() === 'claude' ? 'Claude' : 'GPT' }}
          }
        </button>
        @if (response()) {
          <button class="blk-ai-btn" (click)="clearResponse()">Clear</button>
        }
        <span class="blk-ai-meta">Note context sent automatically</span>
      </div>
    </div>
  `,
  styles: [`
    .blk-ai-response {
      background: var(--lore-primitive-purple-50);
      border: 1px solid var(--lore-primitive-purple-200);
      border-radius: var(--lore-radius-lg);   /* r-lg = 12px — matches mock's rounded edges */
      padding: 13px;
    }
    .blk-ai-hdr {
      display: flex; align-items: center; gap: 7px; margin-bottom: 10px;
    }
    .blk-ai-logo {
      width: 20px; height: 20px; border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: white; flex-shrink: 0;
      &.claude { background: var(--lore-primitive-purple-600); }
      &.gpt { background: #10A37F; }
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
    }
    .status-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--lore-primitive-green-600);
      animation: pulse 2s infinite;
    }
    .blk-ai-prompt {
      width: 100%; border: 1px solid var(--lore-primitive-purple-200);
      background: var(--lore-color-bg-canvas);
      border-radius: var(--lore-radius-md); padding: 9px 11px;
      font-family: 'Lora', serif; font-size: 14px;
      color: var(--lore-color-text-muted); outline: none; resize: none;
      &::placeholder { color: var(--lore-color-text-faint); font-style: italic; }
      &:focus { border-color: var(--lore-primitive-purple-400); }
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
    .cursor {
      display: inline-block; width: 2px; height: 1em;
      background: var(--lore-primitive-purple-600); margin-left: 2px;
      vertical-align: text-bottom; animation: blink 0.7s infinite;
    }
    .blk-ai-footer {
      margin-top: 9px; display: flex; gap: 5px; align-items: center;
    }
    .blk-ai-run {
      font-size: 12px; font-weight: 500;
      background: var(--lore-primitive-purple-600); color: white;
      border: none; border-radius: var(--lore-radius-sm);
      padding: 5px 12px; cursor: pointer; display: flex; align-items: center; gap: 5px;
      transition: background 0.12s;
      &:hover:not(:disabled) { background: var(--lore-primitive-purple-700); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .blk-ai-btn {
      font-size: 11px; color: var(--lore-color-text-faint);
      border: 1px solid var(--lore-color-border-strong);
      background: var(--lore-color-bg-canvas);
      border-radius: 5px; padding: 3px 8px; cursor: pointer;
      font-family: 'DM Sans', sans-serif; transition: 0.12s;
      &:hover { color: var(--lore-primitive-purple-600); border-color: var(--lore-primitive-purple-300); }
    }
    .blk-ai-meta {
      font-size: 11px; color: var(--lore-color-text-faint);
      margin-left: auto; font-family: 'JetBrains Mono', monospace;
    }
    .thinking-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: white; animation: pulse 1s infinite; display: inline-block;
    }
    @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  `]
})
export class AskAiBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  model = input<'claude' | 'gpt'>('claude');
  changed = output<{ blockId: string; content: string }>();

  loading = signal(false);
  response = signal('');

  ngOnInit(): void {
    this.response.set(this.block().metadata?.['response'] ?? '');
  }

  onInput(e: Event): void {
    this.changed.emit({ blockId: this.block().id, content: (e.target as HTMLTextAreaElement).value });
  }

  run(): void {
    // AI integration wired in Phase 6
    this.loading.set(true);
    setTimeout(() => {
      this.response.set('AI integration coming in Phase 6. Connect your API key in Settings → AI Providers to enable live responses.');
      this.loading.set(false);
    }, 800);
  }

  clearResponse(): void {
    this.response.set('');
  }
}
