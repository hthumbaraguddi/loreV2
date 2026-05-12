import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Block, BlockType } from '../../../core/models/shelf.model';
import { BlockContainerComponent } from '../block-container/block-container.component';
import { SlashPaletteComponent } from '../slash-palette/slash-palette.component';

@Component({
  selector: 'lore-block-list',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    BlockContainerComponent,
    SlashPaletteComponent,
  ],
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
            [noteId]="noteId()"
            [index]="i"
            [readOnly]="readOnly()"
            (blockChanged)="blockChanged.emit($event)"
            (blockDeleted)="blockDeleted.emit($event)"
            (addBlockAfter)="onAddBlock($event)"
            (duplicateRequested)="duplicateRequested.emit($event)"
          />
        </div>
      }
    </div>

    <!-- Slash palette -->
    @if (paletteOpen()) {
      <div class="palette-overlay" (click)="closePalette()">
        <div
          class="palette-anchor"
          (click)="$event.stopPropagation()"
          [style.position]="'fixed'"
          [style.left.px]="palettePosition().x"
          [style.top.px]="palettePosition().y"
        >
          <lore-slash-palette
            [afterIndex]="paletteAfterIndex()"
            (selected)="onPaletteSelect($event)"
            (dismissed)="closePalette()"
          />
        </div>
      </div>
    }
  `,
  styles: [
    `
      .block-list {
        display: flex;
        flex-direction: column;
        gap: var(--lore-space-4);
      }
      .block-row {
        position: relative;
      }
      .palette-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
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
      .cdk-drag-placeholder {
        opacity: 0.3;
      }
      .cdk-drag-animating {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
      .block-list.cdk-drop-list-dragging .block-row:not(.cdk-drag-placeholder) {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class BlockListComponent {
  blocks = input.required<Block[]>();
  noteId = input.required<string>();
  readOnly = input(false);

  blockChanged = output<Block>();
  blockDeleted = output<string>();
  blockAdded = output<{ type: BlockType; afterIndex: number }>();
  blockReordered = output<{ fromIndex: number; toIndex: number }>();
  duplicateRequested = output<string>();

  paletteOpen = signal(false);
  paletteAfterIndex = signal(0);
  palettePosition = signal({ x: 0, y: 0 });

  onDrop(event: CdkDragDrop<Block[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.blockReordered.emit({
      fromIndex: event.previousIndex,
      toIndex: event.currentIndex,
    });
  }

  onAddBlock(event: {
    afterIndex: number;
    type?: BlockType;
    clickPosition?: { x: number; y: number };
  }): void {
    if (event.type) {
      this.blockAdded.emit({ type: event.type, afterIndex: event.afterIndex });
    } else {
      this.paletteAfterIndex.set(event.afterIndex);
      if (event.clickPosition) {
        this.palettePosition.set(event.clickPosition);
      } else {
        // Default position if no click position provided
        this.palettePosition.set({ x: 100, y: 100 });
      }
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
