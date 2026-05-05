import {
  Component, input, output, signal, computed,
  ChangeDetectionStrategy, HostListener, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Block, BlockType } from '../../../core/models/shelf.model';
import { BlockToolbarComponent } from '../block-toolbar/block-toolbar.component';
import { HypothesisBlockComponent } from '../hypothesis-block/hypothesis-block.component';
import { ConclusionBlockComponent } from '../conclusion-block/conclusion-block.component';
import { NoteInsightBlockComponent } from '../note-insight-block/note-insight-block.component';
import { WarningBlockComponent } from '../warning-block/warning-block.component';
import { QuoteBlockComponent } from '../quote-block/quote-block.component';
import { KeyFindingsBlockComponent } from '../key-findings-block/key-findings-block.component';
import { KeyDifferencesBlockComponent } from '../key-differences-block/key-differences-block.component';
import { ChecklistBlockComponent } from '../checklist-block/checklist-block.component';
import { CodeBlockComponent } from '../code-block/code-block.component';
import { DividerBlockComponent } from '../divider-block/divider-block.component';
import { ImageBlockComponent } from '../image-block/image-block.component';
import { AskAiBlockComponent } from '../ask-ai-block/ask-ai-block.component';

@Component({
  selector: 'lore-block-container',
  standalone: true,
  imports: [
    CommonModule, CdkDrag, CdkDragHandle,
    BlockToolbarComponent,
    HypothesisBlockComponent, ConclusionBlockComponent, NoteInsightBlockComponent,
    WarningBlockComponent, QuoteBlockComponent, KeyFindingsBlockComponent,
    KeyDifferencesBlockComponent, ChecklistBlockComponent, CodeBlockComponent,
    DividerBlockComponent, ImageBlockComponent, AskAiBlockComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="block-container"
      [class.focused]="focused()"
      [attr.aria-label]="block().type + ' block, position ' + index()"
      role="group"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)"
      (focusin)="focused.set(true)"
      (focusout)="focused.set(false)"
    >
      <!-- Drag handle -->
      <div class="block-handle" cdkDragHandle [class.visible]="hovered() || focused()" aria-label="Drag to reorder block">
        <svg viewBox="0 0 10 16" fill="currentColor" width="10" height="16">
          <circle cx="2" cy="2" r="1.2"/><circle cx="2" cy="6" r="1.2"/><circle cx="2" cy="10" r="1.2"/><circle cx="2" cy="14" r="1.2"/>
          <circle cx="7" cy="2" r="1.2"/><circle cx="7" cy="6" r="1.2"/><circle cx="7" cy="10" r="1.2"/><circle cx="7" cy="14" r="1.2"/>
        </svg>
      </div>

      <!-- Floating toolbar -->
      <lore-block-toolbar
        [blockType]="block().type"
        [visible]="hovered() || focused()"
        (deleteRequested)="blockDeleted.emit(block().id)"
        (duplicateRequested)="duplicateRequested.emit(block().id)"
        (addAboveRequested)="onAddAboveFromToolbar($event)"
        (typeChangeRequested)="onTypeChange($event)"
      />

      <!-- Block content -->
      <div class="block-inner">
        @switch (block().type) {
          @case (BlockType.Hypothesis) {
            <lore-hypothesis-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Conclusion) {
            <lore-conclusion-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Note) {
            <lore-note-insight-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Warning) {
            <lore-warning-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Quote) {
            <lore-quote-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.KeyFindings) {
            <lore-key-findings-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.KeyDifferences) {
            <lore-key-differences-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Checklist) {
            <lore-checklist-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Code) {
            <lore-code-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Image) {
            <lore-image-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @case (BlockType.Divider) {
            <lore-divider-block [block]="block()" [readOnly]="readOnly()" />
          }
          @case (BlockType.AskAI) {
            <lore-ask-ai-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
          @default {
            <lore-note-insight-block [block]="block()" [readOnly]="readOnly()" (changed)="onChanged($event)" />
          }
        }
      </div>

      <!-- Add block below button (shows on hover) -->
      @if (!readOnly() && (hovered() || focused())) {
        <button 
          #addBelowButton
          class="add-below" 
          (click)="onAddBelowClick($event)" 
          title="Add block below (⌘Enter)"
        >
          <span class="material-symbols-outlined">add</span>
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }
    .block-container {
      display: flex; align-items: flex-start; gap: var(--lore-space-8);
      padding: var(--lore-space-4) 0; position: relative;
      border-radius: var(--lore-radius-md);
      transition: background 80ms;
      &.focused { background: var(--lore-color-accent-subtle); }
    }
    .block-handle {
      width: 20px; flex-shrink: 0; display: flex; align-items: flex-start;
      padding-top: 6px; cursor: grab; color: var(--lore-color-text-muted);
      opacity: 0; transition: opacity 120ms;
      &.visible { opacity: 1; }
      &:active { cursor: grabbing; }
    }
    .block-inner { flex: 1; min-width: 0; }
    .add-below {
      position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%);
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--lore-color-accent); color: var(--lore-color-on-accent);
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: var(--lore-shadow-sm); z-index: 5;
      .material-symbols-outlined { font-size: 16px; }
      &:hover { transform: translateX(-50%) scale(1.1); }
    }
  `]
})
export class BlockContainerComponent {
  block = input.required<Block>();
  index = input.required<number>();
  readOnly = input(false);

  blockChanged = output<Block>();
  blockDeleted = output<string>();
  addBlockAfter = output<{ afterIndex: number; type?: BlockType; clickPosition?: { x: number; y: number } }>();
  duplicateRequested = output<string>();
  focusedBlock = output<string>();

  BlockType = BlockType;
  hovered = signal(false);
  focused = signal(false);

  @ViewChild('addBelowButton') addBelowButton?: ElementRef<HTMLButtonElement>;

  onChanged(event: { blockId: string; content?: string; metadata?: Record<string, any> }): void {
    this.blockChanged.emit({
      ...this.block(),
      content: event.content ?? this.block().content,
      metadata: event.metadata ?? this.block().metadata
    });
  }

  onTypeChange(type: BlockType): void {
    this.blockChanged.emit({ ...this.block(), type });
  }

  onAddBelowClick(event: MouseEvent): void {
    if (this.addBelowButton?.nativeElement) {
      const rect = this.addBelowButton.nativeElement.getBoundingClientRect();
      const clickPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.addBlockAfter.emit({ 
        afterIndex: this.index(), 
        clickPosition 
      });
    } else {
      // Fallback to just emitting the index
      this.addBlockAfter.emit({ afterIndex: this.index() });
    }
  }

  onAddAboveFromToolbar(event: { clickPosition: { x: number; y: number } }): void {
    this.addBlockAfter.emit({ 
      afterIndex: this.index() - 1,
      clickPosition: event.clickPosition
    });
  }


}