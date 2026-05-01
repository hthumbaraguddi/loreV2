import { Component, signal, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShelfService } from '../../../core/services/shelf.service';
import { Note, NoteType, NoteRef } from '../../../core/models/shelf.model';
import { CanvasBackgroundComponent } from '../canvas-background/canvas-background.component';

/**
 * PaperCanvasComponent
 * Hosts note content with canvas background
 */
@Component({
  selector: 'lore-paper-canvas',
  standalone: true,
  imports: [CommonModule, CanvasBackgroundComponent],
  templateUrl: './paper-canvas.component.html',
  styleUrl: './paper-canvas.component.scss'
})
export class PaperCanvasComponent {
  private shelfService = inject(ShelfService);

  // Inputs
  note = input.required<NoteRef>();
  backgroundStyle = input<'plain' | 'dot' | 'square' | 'lined'>('plain');
  readOnly = input<boolean>(false);

  // Outputs
  blockAdded = output<{ type: string; afterIndex: number }>();
  blockRemoved = output<{ blockId: string }>();
  blockReordered = output<{ blockId: string; newIndex: number }>();
  noteChanged = output<Partial<Note>>();

  // Internal state signals
  blocks = signal<any[]>([]); // Will be replaced with Block[] type
  focusedBlockId = signal<string | null>(null);
  addMenuIndex = signal<number | null>(null);
  isDirty = signal<boolean>(false);

  // Computed signals
  fullNote = computed(() => {
    const noteRef = this.note();
    // Get the full note from the service
    const fullNote = this.shelfService.getNote(noteRef.id);
    // If we can't find the full note, create a minimal Note from the NoteRef
    if (!fullNote) {
      return {
        ...noteRef,
        content: '',
        tags: [],
        status: 'draft' as any,
        blocks: [],
        linkedNoteIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as Note;
    }
    return fullNote;
  });

  noteTypeIcon = computed(() => {
    const type = this.fullNote().type as NoteType;
    const icons: Record<NoteType, string> = {
      [NoteType.Research]: 'science',
      [NoteType.Journal]: 'book',
      [NoteType.Task]: 'check_circle',
      [NoteType.Idea]: 'lightbulb',
      [NoteType.Reference]: 'description',
      [NoteType.HTML]: 'code'
    };
    return icons[type] || 'description';
  });

  noteTypeColor = computed(() => {
    const type = this.fullNote().type as NoteType;
    const colors: Record<NoteType, string> = {
      [NoteType.Research]: 'var(--lore-color-note-research)',
      [NoteType.Journal]: 'var(--lore-color-note-journal)',
      [NoteType.Task]: 'var(--lore-color-note-task)',
      [NoteType.Idea]: 'var(--lore-color-note-idea)',
      [NoteType.Reference]: 'var(--lore-color-note-reference)',
      [NoteType.HTML]: 'var(--lore-color-note-html)'
    };
    return colors[type] || 'var(--lore-color-text-muted)';
  });

  constructor() {
    // Initialize blocks from note
    this.blocks.set(this.fullNote().blocks || []);
  }

  // ═══════════════════════════════════════════════════════════
  // BLOCK MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Add a new block
   */
  addBlock(type: string, afterIndex: number): void {
    this.blockAdded.emit({ type, afterIndex });
    this.isDirty.set(true);
  }

  /**
   * Remove a block
   */
  removeBlock(blockId: string): void {
    this.blockRemoved.emit({ blockId });
    this.isDirty.set(true);
  }

  /**
   * Reorder blocks
   */
  reorderBlock(blockId: string, newIndex: number): void {
    this.blockReordered.emit({ blockId, newIndex });
    this.isDirty.set(true);
  }

  /**
   * Update note content
   */
  updateNoteContent(content: string): void {
    const note = this.fullNote();
    this.shelfService.updateNote(note.id, { content });
    this.isDirty.set(true);
  }

  /**
   * Save note
   */
  saveNote(): void {
    this.isDirty.set(false);
    // Note is already saved via shelf service update
  }

  // ═══════════════════════════════════════════════════════════
  // UI INTERACTIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Show add block menu
   */
  showAddMenu(index: number): void {
    this.addMenuIndex.set(index);
  }

  /**
   * Hide add block menu
   */
  hideAddMenu(): void {
    this.addMenuIndex.set(null);
  }

  /**
   * Set focused block
   */
  setFocusedBlock(blockId: string | null): void {
    this.focusedBlockId.set(blockId);
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get relative time
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return this.formatDate(date);
  }

  /**
   * Track by block ID
   */
  trackByBlockId(index: number, block: any): string {
    return block.id || index.toString();
  }
}