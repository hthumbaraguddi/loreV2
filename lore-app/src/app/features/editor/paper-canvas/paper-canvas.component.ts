import { Component, signal, input, output, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShelfService } from '../../../core/services/shelf.service';
import { BlockService } from '../../../core/services/block.service';
import { Note, NoteType, NoteRef, Block, BlockType } from '../../../core/models/shelf.model';
import { CanvasBackgroundComponent } from '../canvas-background/canvas-background.component';
import { BlockListComponent } from '../../blocks/block-list/block-list.component';

@Component({
  selector: 'lore-paper-canvas',
  standalone: true,
  imports: [CommonModule, CanvasBackgroundComponent, BlockListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paper-canvas.component.html',
  styleUrl: './paper-canvas.component.scss'
})
export class PaperCanvasComponent {
  private shelfService = inject(ShelfService);
  private blockService = inject(BlockService);

  note = input.required<NoteRef>();
  backgroundStyle = input<'plain' | 'dot' | 'square' | 'lined'>('plain');
  readOnly = input<boolean>(false);

  // Resolved full note
  fullNote = computed(() => {
    const ref = this.note();
    const full = this.shelfService.getNote(ref.id);
    if (!full) {
      return {
        ...ref, content: '', tags: [], status: 'draft' as any,
        blocks: [], linkedNoteIds: [], createdAt: new Date(), updatedAt: new Date()
      } as Note;
    }
    return full;
  });

  blocks = computed(() => this.fullNote().blocks ?? []);

  noteTypeIcon = computed(() => {
    const icons: Record<NoteType, string> = {
      [NoteType.Research]: 'science', [NoteType.Journal]: 'book',
      [NoteType.Task]: 'check_circle', [NoteType.Idea]: 'lightbulb',
      [NoteType.Reference]: 'description', [NoteType.HTML]: 'code'
    };
    return icons[this.fullNote().type as NoteType] ?? 'description';
  });

  noteTypeColor = computed(() => {
    const colors: Record<NoteType, string> = {
      [NoteType.Research]: 'var(--lore-color-note-research)',
      [NoteType.Journal]: 'var(--lore-color-note-journal)',
      [NoteType.Task]: 'var(--lore-color-note-task)',
      [NoteType.Idea]: 'var(--lore-color-note-idea)',
      [NoteType.Reference]: 'var(--lore-color-note-reference)',
      [NoteType.HTML]: 'var(--lore-color-note-html)'
    };
    return colors[this.fullNote().type as NoteType] ?? 'var(--lore-color-text-muted)';
  });

  // ─── Block handlers ────────────────────────────────────────

  onBlockAdded(event: { type: BlockType; afterIndex: number }): void {
    this.blockService.createBlock(this.fullNote().id, event.type, event.afterIndex);
  }

  onBlockChanged(block: Block): void {
    this.blockService.updateBlock(this.fullNote().id, block.id, block);
  }

  onBlockDeleted(blockId: string): void {
    this.blockService.deleteBlock(this.fullNote().id, blockId);
  }

  onBlockReordered(event: { fromIndex: number; toIndex: number }): void {
    this.blockService.reorderBlocks(this.fullNote().id, event.fromIndex, event.toIndex);
  }

  onDuplicateBlock(blockId: string): void {
    this.blockService.duplicateBlock(this.fullNote().id, blockId);
  }

  // ─── Note body handler ─────────────────────────────────────

  onNoteBodyInput(event: Event): void {
    const content = (event.target as HTMLTextAreaElement).value;
    this.shelfService.updateNote(this.fullNote().id, { content });
  }

  // ─── Insert block shortcuts ────────────────────────────────

  insertBlock(type: string): void {
    const blockType = this.stringToBlockType(type);
    if (blockType) {
      // Add block at the end (after all existing blocks)
      const afterIndex = this.blocks().length - 1;
      this.blockService.createBlock(this.fullNote().id, blockType, afterIndex);
    }
  }

  private stringToBlockType(type: string): BlockType | null {
    const typeMap: Record<string, BlockType> = {
      'hypothesis': BlockType.Hypothesis,
      'conclusion': BlockType.Conclusion,
      'key-differences': BlockType.KeyDifferences,
      'key-findings': BlockType.KeyFindings,
      'code': BlockType.Code,
      'ask-claude': BlockType.AskClaude,
      'ask-gpt': BlockType.AskGPT,
      'note': BlockType.Note,
      'warning': BlockType.Warning,
      'quote': BlockType.Quote,
      'checklist': BlockType.Checklist,
      'image': BlockType.Image,
      'divider': BlockType.Divider
    };
    return typeMap[type] || null;
  }

  // ─── Utilities ─────────────────────────────────────────────

  getRelativeTime(date: Date): string {
    const diff = Math.ceil(Math.abs(Date.now() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
