import { Injectable, signal, computed } from '@angular/core';
import { Note, NoteRef } from '../models/shelf.model';
import { ShelfService } from './shelf.service';

/**
 * EditorService
 * Manages editor state, active notes, and pane configuration
 */
@Injectable({
  providedIn: 'root'
})
export class EditorService {
  // Signals
  private activeNotesSignal = signal<(NoteRef | null)[]>([null, null, null]); // Up to 3 notes
  paneCount = signal<1 | 2 | 3>(1);
  activePane = signal<number>(0);
  
  // Filter signals
  private shelfFilterSignal = signal<string | null>(null);
  private notebookFilterSignal = signal<string | null>(null);
  
  // Computed signals
  activeNotes = this.activeNotesSignal.asReadonly();
  hasActiveNotes = computed(() => this.activeNotes().some(note => note !== null));
  shelfFilter = this.shelfFilterSignal.asReadonly();
  notebookFilter = this.notebookFilterSignal.asReadonly();

  constructor(private shelfService: ShelfService) {}

  // ═══════════════════════════════════════════════════════════
  // NOTE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Open a note in a specific pane
   */
  openNoteInPane(noteId: string, paneIndex: number = 0): void {
    const note = this.shelfService.getNote(noteId);
    if (!note) return;

    const noteRef: NoteRef = {
      id: note.id,
      notebookId: note.notebookId,
      title: note.title,
      type: note.type,
      preview: note.preview,
      updatedAt: note.updatedAt
    };

    const notes = [...this.activeNotes()];
    
    // Ensure paneIndex is within bounds
    if (paneIndex < 0 || paneIndex >= 3) return;
    
    // Update the note at the specified pane
    notes[paneIndex] = noteRef;
    
    // If opening in a pane beyond current count, increase pane count
    if (paneIndex >= this.paneCount()) {
      this.paneCount.set(Math.min(3, paneIndex + 1) as 1 | 2 | 3);
    }
    
    this.activeNotesSignal.set(notes);
    this.activePane.set(paneIndex);
  }

  /**
   * Close note in a pane
   */
  closeNoteInPane(paneIndex: number): void {
    const notes = [...this.activeNotes()];
    if (paneIndex < 0 || paneIndex >= notes.length) return;
    
    // Remove the note at this index and compact the array
    notes.splice(paneIndex, 1);
    
    // Add null at the end to maintain array length of 3
    notes.push(null);
    
    this.activeNotesSignal.set(notes);
    
    // Reduce pane count
    const currentCount = this.paneCount();
    if (currentCount > 1) {
      this.paneCount.set((currentCount - 1) as 1 | 2 | 3);
    }
    
    // Adjust active pane if needed
    if (this.activePane() >= paneIndex && this.activePane() > 0) {
      this.activePane.set(this.activePane() - 1);
    }
  }

  /**
   * Close all notes
   */
  closeAllNotes(): void {
    this.activeNotesSignal.set([null, null, null]);
    this.paneCount.set(1);
    this.activePane.set(0);
  }

  /**
   * Get active note in current pane
   */
  getActiveNote(): NoteRef | null {
    return this.activeNotes()[this.activePane()];
  }

  /**
   * Get note by pane index
   */
  getNoteByPaneIndex(paneIndex: number): NoteRef | null {
    return this.activeNotes()[paneIndex];
  }

  // ═══════════════════════════════════════════════════════════
  // PANE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Set pane count
   */
  setPaneCount(count: 1 | 2 | 3): void {
    this.paneCount.set(count);
    
    // Adjust active notes array if needed
    const notes = [...this.activeNotes()];
    if (count < notes.length) {
      // Truncate extra notes
      const truncated = notes.slice(0, count);
      this.activeNotesSignal.set([...truncated, ...Array(3 - count).fill(null)]);
    }
    
    // Ensure active pane is within bounds
    if (this.activePane() >= count) {
      this.activePane.set(count - 1);
    }
  }

  /**
   * Set active pane
   */
  setActivePane(index: number): void {
    if (index < 0 || index >= this.paneCount()) return;
    this.activePane.set(index);
  }

  /**
   * Optimize pane count based on active notes
   */
  private optimizePaneCount(): void {
    const notes = this.activeNotes();
    
    // Find the highest index with an active note
    let highestActiveIndex = -1;
    for (let i = 0; i < notes.length; i++) {
      if (notes[i] !== null) {
        highestActiveIndex = i;
      }
    }
    
    // Set pane count to accommodate all active notes
    const optimalCount = Math.max(1, highestActiveIndex + 1) as 1 | 2 | 3;
    if (optimalCount !== this.paneCount()) {
      this.paneCount.set(optimalCount);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if a note is open in any pane
   */
  isNoteOpen(noteId: string): boolean {
    return this.activeNotes().some(note => note?.id === noteId);
  }

  /**
   * Get pane index where a note is open
   */
  getPaneIndexForNote(noteId: string): number | null {
    const notes = this.activeNotes();
    for (let i = 0; i < notes.length; i++) {
      if (notes[i]?.id === noteId) {
        return i;
      }
    }
    return null;
  }

  /**
   * Move note to different pane
   */
  moveNoteToPane(noteId: string, targetPaneIndex: number): void {
    const sourcePaneIndex = this.getPaneIndexForNote(noteId);
    if (sourcePaneIndex === null || sourcePaneIndex === targetPaneIndex) return;

    const notes = [...this.activeNotes()];
    const note = notes[sourcePaneIndex];
    
    notes[sourcePaneIndex] = null;
    notes[targetPaneIndex] = note;
    
    this.activeNotesSignal.set(notes);
    this.activePane.set(targetPaneIndex);
    
    // Ensure pane count accommodates the target pane
    if (targetPaneIndex >= this.paneCount()) {
      this.paneCount.set(Math.min(3, targetPaneIndex + 1) as 1 | 2 | 3);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FILTER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Set shelf filter (shows all notes in a shelf)
   */
  setShelfFilter(shelfId: string | null): void {
    this.shelfFilterSignal.set(shelfId);
    this.notebookFilterSignal.set(null); // Clear notebook filter
    this.closeAllNotes(); // Close all open notes to show grid
  }

  /**
   * Set notebook filter (shows all notes in a notebook)
   */
  setNotebookFilter(notebookId: string | null): void {
    this.notebookFilterSignal.set(notebookId);
    this.shelfFilterSignal.set(null); // Clear shelf filter
    this.closeAllNotes(); // Close all open notes to show grid
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.shelfFilterSignal.set(null);
    this.notebookFilterSignal.set(null);
  }
}