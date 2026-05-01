import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Block, BlockType } from '../../../core/models/shelf.model';
import { BlockContainerComponent } from '../block-container/block-container.component';
import { SlashPaletteComponent } from '../slash-palette/slash-palette.component';

@Component({
  selector: 'lore-block-list',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, BlockContainerComponent, SlashPaletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="block-list"
      cdkDropList
      [cdkDropListData]="blocks()"
      (cdkDropListDropped)="onDrop($event)"
      aria-roledescription="sortable block list"
    >
      @for (block of blocks(); track block.id; let i = $index) {
        <div class="block-row" cdkDrag [cdkDragData]="block">
          <lore-block-container
            [block]="block"
            [index]="i"
            [readOnly]="readOnly()"
            (blockChanged)="blockChanged.emit($event)"
            (blockDeleted)="blockDeleted.emit($event)"
            (addBlockAfter)="onAddBlock($event)"
            (duplicateRequested)="duplicateRequested.emit($event)"
          />
        </div>
      }

      <!-- Empty state -->
      @if (blocks().length === 0 && !readOnly()) {
        <div class="empty-state" (click)="onAddBlock({ afterIndex: -1 })">
          <span class="material-symbols-outlined">add_circle_outline</span>
          <p>Click to add your first block, or type <kbd>/</kbd> to open the block picker</p>
        </div>
      }
    </div>

    <!-- Slash palette -->
    @if (paletteOpen()) {
      <div class="palette-overlay" (click)="closePalette()">
        <div class="palette-anchor" (click)="$event.stopPropagation()">
          <lore-slash-palette
            [afterIndex]="paletteAfterIndex()"
            (selected)="onPaletteSelect($event)"
            (dismissed)="closePalette()"
          />
        </div>
      </div>
    }
  `,
  styles: [`
    .block-list { display: flex; flex-direction: column; gap: var(--lore-space-4); }
    .block-row { position: relative; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 120px; border: 2px dashed var(--lore-color-border);
      border-radius: var(--lore-radius-lg); cursor: pointer; color: var(--lore-color-text-muted);
      gap: var(--lore-space-8); padding: var(--lore-space-24);
      transition: all 120ms;
      &:hover { border-color: var(--lore-color-accent); background: var(--lore-color-accent-subtle); }
      .material-symbols-outlined { font-size: 32px; }
      p { margin: 0; font-size: var(--lore-font-size-md); text-align: center; }
      kbd { background: var(--lore-color-bg-surface-2); border: 1px solid var(--lore-color-border); border-radius: 4px; padding: 1px 5px; font-size: 12px; }
    }
    .palette-overlay {
      position: fixed; inset: 0; z-index: 100;
    }
    .palette-anchor {
      position: absolute;
    }
    /* CDK drag styles */
    .cdk-drag-preview {
      opacity: 0.85;
      box-shadow: var(--lore-shadow-lg);
      border-radius: var(--lore-radius-md);
      background: var(--lore-color-bg-surface);
    }
    .cdk-drag-placeholder { opacity: 0.3; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0,0,0.2,1); }
    .block-list.cdk-drop-list-dragging .block-row:not(.cdk-drag-placeholder) {
      transition: transform 200ms cubic-bezier(0,0,0.2,1);
    }
  `]
})
export class BlockListComponent {
  blocks = input.required<Block[]>();
  readOnly = input(false);

  blockChanged = output<Block>();
  blockDeleted = output<string>();
  blockAdded = output<{ type: BlockType; afterIndex: number }>();
  blockReordered = output<{ fromIndex: number; toIndex: number }>();
  duplicateRequested = output<string>();

  paletteOpen = signal(false);
  paletteAfterIndex = signal(0);

  onDrop(event: CdkDragDrop<Block[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.blockReordered.emit({ fromIndex: event.previousIndex, toIndex: event.currentIndex });
  }

  onAddBlock(event: { afterIndex: number; type?: BlockType }): void {
    if (event.type) {
      this.blockAdded.emit({ type: event.type, afterIndex: event.afterIndex });
    } else {
      this.paletteAfterIndex.set(event.afterIndex);
      this.paletteOpen.set(true);
    }
  }

  onPaletteSelect(event: { type: BlockType; afterIndex: number }): void {
    this.blockAdded.emit(event);
    this.closePalette();
  }

  closePalette(): void {
    this.paletteOpen.set(false);
  }
}
