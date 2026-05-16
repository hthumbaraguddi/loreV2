import { Component, signal, computed, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { EditorService } from '../../../core/services/editor.service';
import { LayoutService } from '../../../core/services/layout.service';
import { NoteRef } from '../../../core/models/shelf.model';
import { PaneComponent } from '../pane/pane.component';
import { NotebookGridComponent } from '../../notebook-grid/notebook-grid.component';

interface Breadcrumb {
  shelf: string;
  notebook: string;
  note: string;
}

/**
 * SplitEditorComponent
 * Manages 1/2/3 pane layout with draggable resize dividers
 */
@Component({
  selector: 'lore-split-editor',
  standalone: true,
  imports: [CommonModule, DragDropModule, PaneComponent, NotebookGridComponent],
  templateUrl: './split-editor.component.html',
  styleUrl: './split-editor.component.scss'
})
export class SplitEditorComponent {
  private editorService = inject(EditorService);
  private layoutService = inject(LayoutService);

  // Computed signals from editor service
  paneCount = this.editorService.paneCount;
  activePane = this.editorService.activePane;
  activeNotes = this.editorService.activeNotes;

  // Layout state
  focusMode = this.layoutService.zenMode;

  // Internal state signals
  paneWidths = signal<number[]>([100]);
  draggingDivider = signal<number | null>(null);
  dragStartX = signal<number>(0);
  dragStartWidths = signal<number[]>([]);

  // Computed signals
  panes = computed(() => {
    const count = this.paneCount();
    const notes = this.activeNotes();
    const widths = this.paneWidths();
    
    // Ensure we have the right number of widths
    let actualWidths: number[];
    if (widths.length !== count) {
      // Recalculate widths if count doesn't match
      if (count === 1) {
        actualWidths = [100];
      } else if (count === 2) {
        actualWidths = [50, 50];
      } else {
        actualWidths = [33.33, 33.33, 33.34];
      }
    } else {
      actualWidths = widths;
    }
    
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      noteRef: notes[i] || null,
      width: actualWidths[i]
    }));
  });

  // Check if we should show notes grid (no active notes)
  showNotesGrid = computed(() => {
    return !this.editorService.hasActiveNotes();
  });

  // Breadcrumb navigation
  currentBreadcrumb = computed<Breadcrumb | null>(() => {
    const notes = this.activeNotes();
    const activePaneIndex = this.activePane();
    const activeNote = notes[activePaneIndex];

    if (!activeNote) {
      return null;
    }

    // TODO: Get actual shelf and notebook names from the note
    // For now, return placeholder data
    return {
      shelf: 'AI & Machine Learning',
      notebook: 'Transformers',
      note: activeNote.title || 'Untitled Note'
    };
  });

  constructor() {
    // Initialize pane widths based on count
    this.updatePaneWidths();
    
    // Watch for pane count changes and update widths
    // This ensures widths update when panes are closed
    effect(() => {
      const count = this.paneCount();
      this.updatePaneWidths();
    });
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
    // The editor service will automatically:
    // 1. Remove the note from the pane
    // 2. Compact the remaining panes
    // 3. Reduce the pane count
    // 4. Update widths via the paneCount signal
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

  // ═══════════════════════════════════════════════════════════
  // TOOLBAR ACTIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Toggle focus mode (zen mode)
   */
  toggleFocusMode(): void {
    this.layoutService.toggleZen();
  }

  /**
   * Open canvas background picker
   */
  openCanvasPicker(): void {
    // TODO: Implement canvas picker modal
    console.log('Canvas picker coming soon');
  }

  /**
   * Save all notes
   */
  saveNotes(): void {
    // TODO: Implement save functionality
    console.log('Saving notes...');
  }

  /**
   * Navigate to shelf view
   */
  navigateToShelf(): void {
    // TODO: Implement navigation to shelf
    console.log('Navigate to shelf');
  }

  /**
   * Open Ask AI panel
   */
  openAskAI(): void {
    // TODO: Implement Ask AI functionality
    console.log('Opening Ask AI...');
  }

  /**
   * Open templates modal
   */
  openTemplates(): void {
    // TODO: Implement templates modal
    console.log('Opening templates modal...');
  }

  /**
   * Toggle context panel
   */
  toggleContextPanel(): void {
    this.layoutService.toggleRightPanel('context-panel');
  }
}