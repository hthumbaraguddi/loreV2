import { Component, signal, input, output, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteRef, Note } from '../../../core/models/shelf.model';
import { PaperCanvasComponent } from '../paper-canvas/paper-canvas.component';
import { ShelfService } from '../../../core/services/shelf.service';
import { VersionHistoryComponent } from '../../version-history/version-history.component';

/**
 * PaneComponent
 * Individual editor pane that can host a note
 */
@Component({
  selector: 'lore-pane',
  standalone: true,
  imports: [CommonModule, PaperCanvasComponent, VersionHistoryComponent],
  templateUrl: './pane.component.html',
  styleUrl: './pane.component.scss'
})
export class PaneComponent {
  private shelfService = inject(ShelfService);
  
  // Inputs
  noteRef = input<NoteRef | null>(null);
  active = input<boolean>(false);
  index = input<number>(0);
  totalPanes = input<number>(1);

  // Outputs
  focused = output<number>();
  closeRequested = output<number>();
  noteDropped = output<{ paneIndex: number; noteRef: NoteRef }>();

  // Internal state signals
  dragOver = signal<boolean>(false);
  
  // Version history state
  showVersionHistory = signal(false);
  versionHistoryNote = signal<Note | null>(null);

  // ═══════════════════════════════════════════════════════════
  // COMPUTED PROPERTIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if close button should be visible
   * Only show close button when there are 2 or more panes
   */
  showCloseButton(): boolean {
    return this.totalPanes() > 1;
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Handle pane click to focus
   */
  onPaneClick(): void {
    this.focused.emit(this.index());
  }

  /**
   * Handle close button click
   */
  onCloseClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeRequested.emit(this.index());
  }

  /**
   * Handle canvas button click
   */
  onCanvasClick(event: MouseEvent): void {
    event.stopPropagation();
    // TODO: Open canvas picker for this pane
    console.log('Canvas picker for pane', this.index());
  }

  /**
   * Handle panel button click
   */
  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
    // TODO: Open panel options for this pane
    console.log('Panel options for pane', this.index());
  }

  /**
   * Handle history button click
   */
  onHistoryClick(event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.noteRef();
    if (!ref) return;
    
    const note = this.shelfService.getNote(ref.id);
    if (note) {
      this.versionHistoryNote.set(note);
      this.showVersionHistory.set(true);
    }
  }

  /**
   * Close version history modal
   */
  closeVersionHistory(): void {
    this.showVersionHistory.set(false);
    this.versionHistoryNote.set(null);
  }

  /**
   * Handle version restore
   */
  onVersionRestore(versionId: string): void {
    const note = this.versionHistoryNote();
    if (!note) return;

    const success = this.shelfService.restoreNoteFromVersion(note.id, versionId);
    if (success) {
      console.log('Note restored successfully');
      this.closeVersionHistory();
    } else {
      console.error('Failed to restore note');
    }
  }

  /**
   * Handle drag over for drop zone
   */
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.isNoteDrag(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.dragOver.set(true);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  }

  /**
   * Handle drag leave — only clear when leaving the pane entirely
   */
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (!this.isNoteDrag(event)) return;
    // relatedTarget is the element being entered; if it's inside this host, ignore
    const related = event.relatedTarget as Node | null;
    const host = (event.currentTarget as HTMLElement);
    if (related && host.contains(related)) return;
    this.dragOver.set(false);
  }

  /**
   * Handle drop
   */
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (!this.isNoteDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    try {
      const noteData = event.dataTransfer?.getData('application/lore-note');
      if (noteData) {
        const noteRef = JSON.parse(noteData) as NoteRef;
        this.noteDropped.emit({ paneIndex: this.index(), noteRef });
      }
    } catch (error) {
      console.error('Failed to parse dropped note:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if drag event is carrying a note.
   * We check for our custom MIME type; during dragover only 'types' is available.
   */
  private isNoteDrag(event: DragEvent): boolean {
    return event.dataTransfer?.types.includes('application/lore-note') ?? false;
  }

  /**
   * Get note type icon
   */
  getNoteTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'research': 'science',
      'journal': 'book',
      'task': 'check_circle',
      'idea': 'lightbulb',
      'reference': 'description',
      'html': 'code'
    };
    return icons[type] || 'description';
  }

  /**
   * Get note type color
   */
  getNoteTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'research': 'var(--lore-color-note-research)',
      'journal': 'var(--lore-color-note-journal)',
      'task': 'var(--lore-color-note-task)',
      'idea': 'var(--lore-color-note-idea)',
      'reference': 'var(--lore-color-note-reference)',
      'html': 'var(--lore-color-note-html)'
    };
    return colors[type] || 'var(--lore-color-text-muted)';
  }

  /**
   * Get breadcrumb trail
   */
  getBreadcrumbTrail(): string {
    // In a real app, this would fetch shelf and notebook names
    // For now, return placeholder
    const noteRef = this.noteRef();
    if (!noteRef) return '';
    
    return 'AI & Machine Learning › Transformers';
  }
}