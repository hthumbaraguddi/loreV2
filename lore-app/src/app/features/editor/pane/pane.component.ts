import { Component, signal, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteRef } from '../../../core/models/shelf.model';
import { PaperCanvasComponent } from '../paper-canvas/paper-canvas.component';

/**
 * PaneComponent
 * Individual editor pane that can host a note
 */
@Component({
  selector: 'lore-pane',
  standalone: true,
  imports: [CommonModule, PaperCanvasComponent],
  templateUrl: './pane.component.html',
  styleUrl: './pane.component.scss'
})
export class PaneComponent {
  // Inputs
  noteRef = input<NoteRef | null>(null);
  active = input<boolean>(false);
  index = input<number>(0);

  // Outputs
  focused = output<number>();
  closeRequested = output<number>();
  noteDropped = output<{ paneIndex: number; noteRef: NoteRef }>();

  // Internal state signals
  dragOver = signal<boolean>(false);

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
   * Handle drag over for drop zone
   */
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.isNoteDrag(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.dragOver.set(true);
      
      // Set drop effect
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  }

  /**
   * Handle drag leave
   */
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (this.isNoteDrag(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.dragOver.set(false);
    }
  }

  /**
   * Handle drop
   */
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.isNoteDrag(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.dragOver.set(false);
      
      try {
        const noteData = event.dataTransfer?.getData('application/json');
        if (noteData) {
          const noteRef = JSON.parse(noteData) as NoteRef;
          this.noteDropped.emit({ paneIndex: this.index(), noteRef });
        }
      } catch (error) {
        console.error('Failed to parse dropped note:', error);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if drag event contains a note
   */
  private isNoteDrag(event: DragEvent): boolean {
    return event.dataTransfer?.types.includes('application/json') || false;
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