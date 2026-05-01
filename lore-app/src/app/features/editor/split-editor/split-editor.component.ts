import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { EditorService } from '../../../core/services/editor.service';
import { NoteRef } from '../../../core/models/shelf.model';
import { PaneComponent } from '../pane/pane.component';

/**
 * SplitEditorComponent
 * Manages 1/2/3 pane layout with draggable resize dividers
 */
@Component({
  selector: 'lore-split-editor',
  standalone: true,
  imports: [CommonModule, DragDropModule, PaneComponent],
  templateUrl: './split-editor.component.html',
  styleUrl: './split-editor.component.scss'
})
export class SplitEditorComponent {
  private editorService = inject(EditorService);

  // Computed signals from editor service
  paneCount = this.editorService.paneCount;
  activePane = this.editorService.activePane;
  activeNotes = this.editorService.activeNotes;

  // Internal state signals
  paneWidths = signal<number[]>([100]);
  draggingDivider = signal<number | null>(null);
  dragStartX = signal<number>(0);
  dragStartWidths = signal<number[]>([]);

  // Computed signals
  panes = computed(() => {
    const count = this.paneCount();
    const notes = this.activeNotes();
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      noteRef: notes[i] || null,
      width: this.paneWidths()[i] || 100 / count
    }));
  });

  constructor() {
    // Initialize pane widths based on count
    this.updatePaneWidths();
  }

  /**
   * Update pane widths when pane count changes
   */
  private updatePaneWidths(): void {
    const count = this.paneCount();
    if (count === 1) {
      this.paneWidths.set([100]);
    } else if (count === 2) {
      this.paneWidths.set([50, 50]);
    } else if (count === 3) {
      this.paneWidths.set([33.33, 33.33, 33.34]);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PANE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Set pane count (1, 2, or 3)
   */
  setPaneCount(count: 1 | 2 | 3): void {
    this.editorService.setPaneCount(count);
    this.updatePaneWidths();
  }

  /**
   * Set active pane
   */
  setActivePane(index: number): void {
    this.editorService.setActivePane(index);
  }

  /**
   * Handle pane focus
   */
  onPaneFocused(index: number): void {
    this.setActivePane(index);
  }

  /**
   * Handle pane close request
   */
  onPaneCloseRequested(index: number): void {
    // Close note in this pane
    this.editorService.closeNoteInPane(index);
  }

  /**
   * Handle note dropped into pane
   */
  onNoteDropped(event: { paneIndex: number; noteRef: NoteRef }): void {
    this.editorService.openNoteInPane(event.noteRef.id, event.paneIndex);
    this.setActivePane(event.paneIndex);
  }

  // ═══════════════════════════════════════════════════════════
  // RESIZE DIVIDERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Start dragging a divider
   */
  startDividerDrag(event: MouseEvent, dividerIndex: number): void {
    event.preventDefault();
    
    this.draggingDivider.set(dividerIndex);
    this.dragStartX.set(event.clientX);
    this.dragStartWidths.set([...this.paneWidths()]);
    
    // Add global event listeners
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Handle mouse move during drag
   */
  private handleMouseMove(event: MouseEvent): void {
    const dividerIndex = this.draggingDivider();
    if (dividerIndex === null) return;
    
    const deltaX = event.clientX - this.dragStartX();
    const containerWidth = this.getContainerWidth();
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    const startWidths = this.dragStartWidths();
    const newWidths = [...startWidths];
    
    // Adjust widths of the two panes adjacent to the divider
    const leftPaneIndex = dividerIndex;
    const rightPaneIndex = dividerIndex + 1;
    
    // Ensure minimum width of 20% for each pane
    const minWidth = 20;
    
    // Calculate new widths
    const leftNewWidth = Math.max(minWidth, Math.min(80, startWidths[leftPaneIndex] + deltaPercent));
    const rightNewWidth = Math.max(minWidth, Math.min(80, startWidths[rightPaneIndex] - deltaPercent));
    
    // Update widths
    newWidths[leftPaneIndex] = leftNewWidth;
    newWidths[rightPaneIndex] = rightNewWidth;
    
    // Normalize to ensure sum is 100%
    const total = newWidths.reduce((sum, width) => sum + width, 0);
    const normalizedWidths = newWidths.map(width => (width / total) * 100);
    
    this.paneWidths.set(normalizedWidths);
  }

  /**
   * Handle mouse up to end drag
   */
  private handleMouseUp(): void {
    this.draggingDivider.set(null);
    this.dragStartX.set(0);
    this.dragStartWidths.set([]);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Get container width in pixels
   */
  private getContainerWidth(): number {
    // In a real app, this would get the actual container width
    // For now, we'll assume 1000px as a reasonable default
    return 1000;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if pane is active
   */
  isPaneActive(index: number): boolean {
    return this.activePane() === index;
  }

  /**
   * Get pane width style
   */
  getPaneWidthStyle(index: number): { width: string } {
    const widths = this.paneWidths();
    if (index >= widths.length) return { width: '100%' };
    
    return { width: `${widths[index]}%` };
  }

  /**
   * Get divider position style
   */
  getDividerStyle(index: number): { left: string } {
    const widths = this.paneWidths();
    let position = 0;
    
    for (let i = 0; i <= index; i++) {
      position += widths[i] || 0;
    }
    
    return { left: `${position}%` };
  }

  /**
   * Track by pane index
   */
  trackByPaneIndex(index: number): number {
    return index;
  }
}