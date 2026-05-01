import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../core/models/shelf.model';

interface CheckItem { text: string; checked: boolean; }

@Component({
  selector: 'lore-checklist-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="blk-checklist">
      @for (item of items(); track $index) {
        <div class="ck-row">
          <div
            class="ck-box"
            [class.checked]="item.checked"
            (click)="toggle($index)"
            role="checkbox"
            [attr.aria-checked]="item.checked"
          ></div>
          <div
            class="ck-txt"
            [class.done]="item.checked"
            [contentEditable]="!readOnly()"
            (input)="onInput($event, $index)"
            (keydown.enter)="addItem($index, $event)"
            (keydown.backspace)="onBackspace($event, $index)"
            [innerHTML]="item.text"
            [attr.data-placeholder]="'Task ' + ($index + 1) + '…'"
          ></div>
        </div>
      }
      @if (!readOnly()) {
        <button class="ck-add" (click)="addItem(items().length - 1)">+ Add item</button>
      }
    </div>
  `,
  styles: [`
    .blk-checklist { display: flex; flex-direction: column; }
    .ck-row {
      display: flex; align-items: center; gap: 8px; padding: 5px 0;
      border-bottom: 1px solid var(--lore-color-border-default);
      &:last-of-type { border-bottom: none; }
    }
    .ck-box {
      width: 16px; height: 16px; border-radius: 4px;
      border: 1.5px solid var(--lore-primitive-blue-600);
      cursor: pointer; flex-shrink: 0; transition: all 0.12s;
      &.checked { background: var(--lore-primitive-blue-600); border-color: var(--lore-primitive-blue-600); position: relative;
        &::after { content: '✓'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 700; }
      }
    }
    .ck-txt {
      flex: 1; border: none; background: transparent; outline: none;
      font-family: 'Lora', serif; font-size: 14px; color: var(--lore-color-text-muted);
      min-height: 20px; line-height: 1.5;
      &.done { text-decoration: line-through; color: var(--lore-color-text-faint); }
      &:empty::before { content: attr(data-placeholder); color: var(--lore-color-text-faint); }
    }
    .ck-add {
      margin-top: 6px; padding: 4px 0; border: none; background: transparent;
      font-size: 11px; color: var(--lore-color-text-faint); cursor: pointer; text-align: left;
      &:hover { color: var(--lore-primitive-blue-600); }
    }
  `]
})
export class ChecklistBlockComponent {
  block = input.required<Block>();
  readOnly = input(false);
  changed = output<{ blockId: string; content: string }>();

  items = signal<CheckItem[]>([{ text: '', checked: false }]);

  ngOnInit(): void {
    try {
      const parsed = JSON.parse(this.block().content || '[]');
      this.items.set(Array.isArray(parsed) && parsed.length ? parsed : [{ text: '', checked: false }]);
    } catch { this.items.set([{ text: '', checked: false }]); }
  }

  toggle(index: number): void {
    this.items.set(this.items().map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
    this.emit();
  }

  onInput(e: Event, index: number): void {
    this.items.set(this.items().map((item, i) => i === index ? { ...item, text: (e.target as HTMLElement).innerHTML } : item));
    this.emit();
  }

  addItem(afterIndex: number, e?: Event): void {
    e?.preventDefault();
    const items = [...this.items()];
    items.splice(afterIndex + 1, 0, { text: '', checked: false });
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
