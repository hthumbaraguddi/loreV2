import { Component, input, output, signal, computed, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlockType } from '../../../core/models/shelf.model';
import { BLOCK_TYPE_MENU } from '../block-toolbar/block-toolbar.component';

@Component({
  selector: 'lore-slash-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="slash-palette" role="listbox" aria-label="Block type picker">
      <div class="palette-search">
        <span class="material-symbols-outlined">search</span>
        <input
          #searchInput
          type="text"
          placeholder="Search block types…"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          (keydown)="onKeydown($event)"
          autofocus
        />
      </div>
      <div class="palette-list">
        @for (item of filtered(); track item.type; let i = $index) {
          <button
            class="palette-item"
            role="option"
            [class.highlighted]="i === activeIndex()"
            (click)="select(item.type)"
            (mouseenter)="activeIndex.set(i)"
          >
            <span class="item-icon material-symbols-outlined">{{ item.icon }}</span>
            <span class="item-label">{{ item.label }}</span>
          </button>
        }
        @if (filtered().length === 0) {
          <div class="palette-empty">No block types match "{{ query() }}"</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .slash-palette {
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-lg);
      box-shadow: var(--lore-shadow-lg);
      width: 240px; overflow: hidden;
    }
    .palette-search {
      display: flex; align-items: center; gap: var(--lore-space-8);
      padding: var(--lore-space-10) var(--lore-space-12);
      border-bottom: 1px solid var(--lore-color-border);
      .material-symbols-outlined { font-size: 16px; color: var(--lore-color-text-muted); flex-shrink: 0; }
      input {
        flex: 1; border: none; background: transparent; outline: none;
        font-size: var(--lore-font-size-sm); color: var(--lore-color-text-default);
        &::placeholder { color: var(--lore-color-text-muted-2); }
      }
    }
    .palette-list { max-height: 280px; overflow-y: auto; padding: 4px; }
    .palette-item {
      display: flex; align-items: center; gap: var(--lore-space-10);
      width: 100%; padding: var(--lore-space-8) var(--lore-space-10);
      border: none; background: transparent; border-radius: var(--lore-radius-sm);
      font-size: var(--lore-font-size-sm); color: var(--lore-color-text-default);
      cursor: pointer; text-align: left;
      &.highlighted, &:hover { background: var(--lore-color-accent-subtle); color: var(--lore-color-accent); }
    }
    .item-icon { font-size: 18px; color: var(--lore-color-text-muted); flex-shrink: 0; }
    .palette-item.highlighted .item-icon, .palette-item:hover .item-icon { color: var(--lore-color-accent); }
    .palette-empty { padding: var(--lore-space-16); text-align: center; color: var(--lore-color-text-muted); font-size: var(--lore-font-size-sm); }
  `]
})
export class SlashPaletteComponent {
  afterIndex = input(0);
  selected = output<{ type: BlockType; afterIndex: number }>();
  dismissed = output<void>();

  query = signal('');
  activeIndex = signal(0);

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    return q ? BLOCK_TYPE_MENU.filter(b => b.label.toLowerCase().includes(q)) : BLOCK_TYPE_MENU;
  });

  @HostListener('document:keydown.escape')
  onEscape(): void { this.dismissed.emit(); }

  onKeydown(e: KeyboardEvent): void {
    const len = this.filtered().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.activeIndex.update(i => (i + 1) % len); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.activeIndex.update(i => (i - 1 + len) % len); }
    else if (e.key === 'Enter') { e.preventDefault(); const item = this.filtered()[this.activeIndex()]; if (item) this.select(item.type); }
    else if (e.key === 'Escape') { this.dismissed.emit(); }
  }

  select(type: BlockType): void {
    this.selected.emit({ type, afterIndex: this.afterIndex() });
  }
}
