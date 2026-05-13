import { Component, signal, output, input, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PromptSubmission {
  prompt: string;
}

@Component({
  selector: 'lore-ai-mention-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mention-prompt" [style.left.px]="position().x" [style.top.px]="position().y">
      <div class="mention-prompt-header">
        <div class="provider-badge" [style.background-color]="getProviderColor()">
          {{ providerName().charAt(0) }}
        </div>
        <span class="mention-prompt-title">Ask {{ providerName() }}</span>
        @if (isLoading()) {
          <div class="loading-spinner"></div>
        }
      </div>
      <div class="mention-prompt-input-wrapper">
        <textarea
          #promptInput
          class="mention-prompt-input"
          [(ngModel)]="promptText"
          [placeholder]="'Ask ' + providerName() + '...'"
          [disabled]="isLoading()"
          (keydown)="onKeyDown($event)"
          rows="2"
        ></textarea>
      </div>
      <div class="mention-prompt-footer">
        <span class="mention-prompt-hint">Enter Send • Esc Cancel</span>
      </div>
    </div>
  `,
  styles: [`
    .mention-prompt {
      position: fixed;
      z-index: 1000;
      background: var(--bg-secondary, #252525);
      border: 1px solid var(--border-color, #333);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 320px;
      max-width: 480px;
      overflow: hidden;
    }

    .mention-prompt-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color, #333);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .provider-badge {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .mention-prompt-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary, #fff);
      flex: 1;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--border-color, #333);
      border-top-color: var(--accent-color, #7C3AED);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .mention-prompt-input-wrapper {
      padding: 12px 16px;
    }

    .mention-prompt-input {
      width: 100%;
      background: var(--bg-primary, #1a1a1a);
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 13px;
      color: var(--text-primary, #fff);
      font-family: inherit;
      resize: vertical;
      min-height: 60px;
      max-height: 200px;
    }

    .mention-prompt-input:focus {
      outline: none;
      border-color: var(--accent-color, #7C3AED);
    }

    .mention-prompt-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .mention-prompt-footer {
      padding: 8px 16px;
      border-top: 1px solid var(--border-color, #333);
      background: var(--bg-primary, #1a1a1a);
    }

    .mention-prompt-hint {
      font-size: 11px;
      color: var(--text-secondary, #999);
    }
  `]
})
export class AiMentionPromptComponent implements AfterViewInit {
  @ViewChild('promptInput') promptInput?: ElementRef<HTMLTextAreaElement>;

  // Inputs
  readonly position = input.required<{ x: number; y: number }>();
  readonly providerName = input.required<string>();
  readonly providerId = input.required<string>();
  readonly isLoading = input<boolean>(false);

  // Outputs
  readonly promptSubmitted = output<PromptSubmission>();
  readonly cancelled = output<void>();

  // State
  promptText = signal<string>('');

  ngAfterViewInit(): void {
    // Auto-focus the input
    setTimeout(() => {
      this.promptInput?.nativeElement.focus();
    }, 100);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  submit(): void {
    const text = this.promptText().trim();
    if (text && !this.isLoading()) {
      this.promptSubmitted.emit({ prompt: text });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  getProviderColor(): string {
    switch (this.providerId()) {
      case 'anthropic': return '#7C3AED';
      case 'openai': return '#10A37F';
      case 'google': return '#4285F4';
      case 'groq': return '#F55036';
      default: return '#7C3AED';
    }
  }
}
