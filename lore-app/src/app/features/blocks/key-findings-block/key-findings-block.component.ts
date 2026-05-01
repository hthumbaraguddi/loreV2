import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-key-findings-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-findings">
      <div class="blk-findings-lbl">Key Findings</div>
      @for (item of items(); track $index) {
        <div class="fi-row">
          <div class="fi-num">{{ $index + 1 }}</div>
          <div
            class="fi-inp"
            [contentEditable]="!readOnly()"
            (input)="onInput($event, $index)"
            (keydown.enter)="addItem($index, $event)"
            (keydown.backspace)="onBackspace($event, $index)"
            [innerHTML]="item"
            [attr.data-placeholder]="'Finding ' + ($index + 1) + '…'"
          ></div>
        </div>
      }
      @if (!readOnly()) {
        <button class="fi-add" (click)="addItem(items().length - 1)">+ Add finding</button>
      }
    </div>
  `,
  styles: [`
    .blk-findings {
      background: var(--lore-primitive-purple-50);
      border: 1px solid var(--lore-primitive-purple-200);
      border-radius: var(--lore-radius-md);
      padding: 13px;
    }
    .blk-findings-lbl {
      font-size: 9.5px; font-weight: 600; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--lore-primitive-purple-600);
      font-family: 'JetBrains Mono', monospace; margin-bottom: 9px;
    }
    .fi-row {
      display: flex; gap: 8px; padding: 5px 0;
      border-bottom: 1px solid var(--lore-color-border-default);
      &:last-of-type { border-bottom: none; }
    }
    .fi-num {
      width: 17px; height: 17px; border-radius: 50%;
      background: var(--lore-color-bg-canvas);
      border: 1px solid var(--lore-color-border-strong);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-family: 'JetBrains Mono', monospace;
      color: var(--lore-color-text-faint); flex-shrink: 0; margin-top: 2px;
    }
    .fi-inp {
      border: none; background: transparent; outline: none;
      font-family: 'Lora', serif; font-size: 13.5px;
      color: var(--lore-color-text-muted); width: 100%; min-height: 20px;
      &:empty::before { content: attr(data-placeholder); color: var(--lore-color-text-faint); }
    }
    .fi-add {
      margin-top: 8px; padding: 4px 0; border: none; background: transparent;
      font-size: 11px; color: var(--lore-color-text-faint); cursor: pointer;
      &:hover { color: var(--lore-primitive-purple-600); }
    }
  `]
})
export class KeyFindingsBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; content: string }>();

  items = signal<string[]>(['', '']);

  ngOnInit(): void {
    try {
      const parsed = JSON.parse(this.block().content || '[]');
      this.items.set(Array.isArray(parsed) && parsed.length ? parsed : ['', '']);
    } catch { this.items.set(['', '']); }
  }

  onInput(e: Event, index: number): void {
    const items = this.items().map((v, i) => i === index ? (e.target as HTMLElement).innerHTML : v);
    this.items.set(items);
    this.emit();
  }

  addItem(afterIndex: number, e?: Event): void {
    e?.preventDefault();
    const items = [...this.items()];
    items.splice(afterIndex + 1, 0, '');
    this.items.set(items);
    this.emit();
  }

  onBackspace(e: Event, index: number): void {
    const el = e.target as HTMLElement;
    if (el.textContent === '' && this.items().length > 1) {
      e.preventDefault();
      const items = [...this.items()];
      items.splice(index, 1);
      this.items.set(items);
      this.emit();
    }
  }

  private emit(): void {
    this.changed.emit({ blockId: this.block().id, content: JSON.stringify(this.items()) });
  }
}
