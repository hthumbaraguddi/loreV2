import { Injectable, inject } from '@angular/core';
import { Block, BlockType } from '../models/shelf.model';
import { ShelfService } from './shelf.service';

/**
 * BlockService
 * CRUD operations for blocks within a note.
 * Delegates persistence to ShelfService.
 */
@Injectable({ providedIn: 'root' })
export class BlockService {
  private shelfService = inject(ShelfService);

  // ─── CREATE ────────────────────────────────────────────────

  createBlock(
    noteId: string,
    type: BlockType,
    afterIndex: number,
    content = ''
  ): Block | null {
    const note = this.shelfService.getNote(noteId);
    if (!note) return null;

    const newBlock: Block = {
      id: this.generateId(),
      type,
      content: content || this.defaultContent(type),
      metadata: this.defaultMetadata(type),
      order: afterIndex + 1,
      createdAt: new Date()
    };

    const blocks = [...note.blocks];
    blocks.splice(afterIndex + 1, 0, newBlock);
    this.reindex(blocks);

    this.shelfService.updateNote(noteId, { blocks });
    return newBlock;
  }

  // ─── UPDATE ────────────────────────────────────────────────

  updateBlock(noteId: string, blockId: string, patch: Partial<Block>): boolean {
    const note = this.shelfService.getNote(noteId);
    if (!note) return false;

    const idx = note.blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return false;

    const blocks = note.blocks.map((b, i) =>
      i === idx ? { ...b, ...patch } : b
    );
    this.shelfService.updateNote(noteId, { blocks });
    return true;
  }

  // ─── DELETE ────────────────────────────────────────────────

  deleteBlock(noteId: string, blockId: string): boolean {
    const note = this.shelfService.getNote(noteId);
    if (!note) return false;

    const blocks = note.blocks.filter(b => b.id !== blockId);
    this.reindex(blocks);
    this.shelfService.updateNote(noteId, { blocks });
    return true;
  }

  // ─── REORDER ───────────────────────────────────────────────

  reorderBlocks(noteId: string, fromIndex: number, toIndex: number): boolean {
    const note = this.shelfService.getNote(noteId);
    if (!note) return false;

    const blocks = [...note.blocks];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    this.reindex(blocks);
    this.shelfService.updateNote(noteId, { blocks });
    return true;
  }

  // ─── DUPLICATE ─────────────────────────────────────────────

  duplicateBlock(noteId: string, blockId: string): Block | null {
    const note = this.shelfService.getNote(noteId);
    if (!note) return null;

    const idx = note.blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return null;

    const original = note.blocks[idx];
    const copy: Block = {
      ...original,
      id: this.generateId(),
      createdAt: new Date()
    };

    const blocks = [...note.blocks];
    blocks.splice(idx + 1, 0, copy);
    this.reindex(blocks);
    this.shelfService.updateNote(noteId, { blocks });
    return copy;
  }

  // ─── HELPERS ───────────────────────────────────────────────

  private reindex(blocks: Block[]): void {
    blocks.forEach((b, i) => (b.order = i));
  }

  private generateId(): string {
    return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  private defaultContent(type: BlockType): string {
    const map: Partial<Record<BlockType, string>> = {
      [BlockType.Hypothesis]: 'We hypothesise that…',
      [BlockType.Conclusion]: 'In conclusion…',
      [BlockType.Note]: '',
      [BlockType.Warning]: 'Warning: ',
      [BlockType.Quote]: '',
      [BlockType.KeyDifferences]: '',
      [BlockType.KeyFindings]: '',
      [BlockType.Checklist]: '',
      [BlockType.Table]: '',
      [BlockType.Code]: '',
      [BlockType.Image]: '',
      [BlockType.Divider]: '',
      [BlockType.AskAI]: ''
    };
    return map[type] ?? '';
  }

  private defaultMetadata(type: BlockType): Record<string, any> {
    if (type === BlockType.Code) return { language: 'typescript' };
    if (type === BlockType.Checklist) return { items: [] };
    if (type === BlockType.Table) return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    if (type === BlockType.AskAI) return { provider: 'anthropic' };
    return {};
  }
}
