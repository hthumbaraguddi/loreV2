import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockType } from '../../../core/models/shelf.model';

export const BLOCK_TYPE_MENU: { type: BlockType; label: string; icon: string }[] = [
  { type: BlockType.Note,           label: 'Note / Insight',   icon: 'edit_note' },
  { type: BlockType.Hypothesis,     label: 'Hypothesis',       icon: 'psychology' },
  { type: BlockType.Conclusion,     label: 'Conclusion',       icon: 'check_circle' },
  { type: BlockType.Warning,        label: 'Warning',          icon: 'warning' },
  { type: BlockType.Quote,          label: 'Quote',            icon: 'format_quote' },
  { type: BlockType.KeyFindings,    label: 'Key Findings',     icon: 'lightbulb' },
  { type: BlockType.KeyDifferences, label: 'Key Differences',  icon: 'compare_arrows' },
  { type: BlockType.Checklist,      label: 'Checklist',        icon: 'checklist' },
  { type: BlockType.Code,           label: 'Code',             icon: 'code' },
  { type: BlockType.Table,          label: 'Table',            icon: 'table_chart' },
  { type: BlockType.Image,          label: 'Image',            icon: 'image' },
  { type: BlockType.Divider,        label: 'Divider',          icon: 'horizontal_rule' },
  { type: BlockType.AskClaude,      label: 'Ask Claude',       icon: 'auto_awesome' },
  { type: BlockType.AskGPT,         label: 'Ask GPT',          icon: 'smart_toy' },
];

@Component({
  selector: 'lore-block-toolbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="block-toolbar" role="toolbar" aria-label="Block actions" [class.visible]="visible()">
      <button class="tb-btn" (click)="addAboveRequested.emit()" title="Add block above" aria-label="Add block above">
        <span class="material-symbols-outlined">add_circle</span>
      </button>
      <button class="tb-btn" (click)="duplicateRequested.emit()" title="Duplicate" aria-label="Duplicate block">
        <span class="material-symbols-outlined">content_copy</span>
      </button>
      <button class="tb-btn type-btn" (click)="toggleTypePicker()" title="Change type" aria-label="Change block type">
        <span class="material-symbols-outlined">swap_horiz</span>
      </button>
      <button class="tb-btn" (click)="commentRequested.emit()" title="Comment" aria-label="Add comment">
        <span class="material-symbols-outlined">chat_bubble_outline</span>
        @if (commentCount() > 0) {
          <span class="comment-badge">{{ commentCount() }}</span>
        }
      </button>
      <div class="tb-sep"></div>
      <button class="tb-btn danger" (click)="deleteRequested.emit()" title="Delete block" aria-label="Delete block">
        <span class="material-symbols-outlined">delete_outline</span>
      </button>

      <!-- Type picker popover -->
      @if (typePickerOpen()) {
        <div class="type-picker" role="menu">
          @for (item of blockTypes; track item.type) {
            <button
              class="type-item"
              role="menuitem"
              (click)="selectType(item.type)"
              [class.active]="item.type === blockType()"
            >
              <span class="material-symbols-outlined">{{ item.icon }}</span>
              {{ item.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { position: absolute; top: -40px; left: 0; z-index: 10; }
    .block-toolbar {
      display: flex; align-items: center; gap: 2px;
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      padding: 3px; box-shadow: var(--lore-shadow-md);
      opacity: 0; pointer-events: none;
      transform: scale(0.95) translateY(4px);
      transition: opacity 120ms, transform 120ms;
      &.visible { opacity: 1; pointer-events: all; transform: scale(1) translateY(0); }
    }
    .tb-btn {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; border-radius: var(--lore-radius-sm);
      color: var(--lore-color-text-muted); cursor: pointer; position: relative;
      &:hover { background: var(--lore-color-bg-surface-2); color: var(--lore-color-text-default); }
      &.danger:hover { background: rgba(239,68,68,0.1); color: #EF4444; }
      .material-symbols-outlined { font-size: 16px; }
    }
    .comment-badge {
      position: absolute; top: 2px; right: 2px; width: 12px; height: 12px;
      background: var(--lore-color-accent); color: white; border-radius: 50%;
      font-size: 8px; display: flex; align-items: center; justify-content: center;
    }
    .tb-sep { width: 1px; height: 16px; background: var(--lore-color-border); margin: 0 2px; }
    .type-picker {
      position: absolute; top: calc(100% + 4px); left: 0;
      background: var(--lore-color-bg-surface); border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md); box-shadow: var(--lore-shadow-lg);
      padding: 4px; min-width: 180px; z-index: 20;
      display: grid; grid-template-columns: 1fr 1fr;
    }
    .type-item {
      display: flex; align-items: center; gap: var(--lore-space-8);
      padding: var(--lore-space-6) var(--lore-space-10); border: none;
      background: transparent; border-radius: var(--lore-radius-sm);
      font-size: var(--lore-font-size-sm); color: var(--lore-color-text-default);
      cursor: pointer; text-align: left; white-space: nowrap;
      &:hover { background: var(--lore-color-bg-surface-2); }
      &.active { background: var(--lore-color-accent-subtle); color: var(--lore-color-accent); }
      .material-symbols-outlined { font-size: 16px; color: var(--lore-color-text-muted); }
    }
  `]
})
export class BlockToolbarComponent {
  blockType = input.required<BlockType>();
  visible = input(false);
  commentCount = input(0);

  deleteRequested = output<void>();
  duplicateRequested = output<void>();
  typeChangeRequested = output<BlockType>();
  commentRequested = output<void>();
  addAboveRequested = output<void>();
  addBelowRequested = output<void>();

  typePickerOpen = signal(false);
  blockTypes = BLOCK_TYPE_MENU;

  toggleTypePicker(): void {
    this.typePickerOpen.update(v => !v);
  }

  selectType(type: BlockType): void {
    this.typePickerOpen.set(false);
    this.typeChangeRequested.emit(type);
  }
}
