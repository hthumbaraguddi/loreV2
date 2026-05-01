import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Block } from '../../../core/models/shelf.model';

const LANGUAGES = ['typescript', 'javascript', 'python', 'rust', 'go', 'sql', 'bash', 'json', 'yaml', 'html', 'css'];

@Component({
  selector: 'lore-code-block',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-code">
      <div class="blk-code-lang">
        @if (!readOnly()) {
          <select [ngModel]="language()" (ngModelChange)="setLanguage($event)">
            @for (lang of languages; track lang) {
              <option [value]="lang">{{ lang }}</option>
            }
          </select>
        } @else {
          {{ language() }}
        }
        <button class="copy-btn" (click)="copy()" title="Copy">
          {{ copied() ? '✓ copied' : 'copy' }}
        </button>
      </div>
      <textarea
        class="code-textarea"
        [value]="block().content"
        (input)="onInput($event)"
        [readOnly]="readOnly()"
        [placeholder]="'// ' + language() + ' code…'"
        rows="4"
        spellcheck="false"
        autocorrect="off"
        autocapitalize="off"
      ></textarea>
    </div>
  `,
  styles: [`
    .blk-code {
      background: #0F0C1A; border-radius: var(--lore-radius-md);
      padding: 12px 14px;
    }
    .blk-code-lang {
      font-size: 10px; color: rgba(255,255,255,0.3);
      font-family: 'JetBrains Mono', monospace; margin-bottom: 5px;
      display: flex; align-items: center; gap: 8px;
      select {
        background: transparent; border: none; outline: none;
        font-family: 'JetBrains Mono', monospace; font-size: 10px;
        color: rgba(255,255,255,0.3); cursor: pointer;
        option { background: #1a1729; color: white; }
      }
    }
    .copy-btn {
      margin-left: auto; background: transparent; border: none;
      font-size: 10px; color: rgba(255,255,255,0.3); cursor: pointer;
      font-family: 'JetBrains Mono', monospace;
      &:hover { color: rgba(255,255,255,0.6); }
    }
    .code-textarea {
      width: 100%; border: none; background: transparent; outline: none;
      font-family: 'JetBrains Mono', monospace; font-size: 13px;
      color: #C4B5FD; line-height: 1.6; resize: none;
      &::placeholder { color: rgba(255,255,255,0.15); }
    }
  `]
})
export class CodeBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; content: string; metadata?: Record<string, any> }>();

  languages = LANGUAGES;
  language = signal('typescript');
  copied = signal(false);

  ngOnInit(): void {
    this.language.set(this.block().metadata?.['language'] ?? 'typescript');
  }

  onInput(e: Event): void {
    this.changed.emit({ blockId: this.block().id, content: (e.target as HTMLTextAreaElement).value });
  }

  setLanguage(lang: string): void {
    this.language.set(lang);
    this.changed.emit({ blockId: this.block().id, content: this.block().content, metadata: { language: lang } });
  }

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.block().content);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
