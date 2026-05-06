import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ShelfService } from '../../core/services/shelf.service';
import { LayoutService } from '../../core/services/layout.service';
import { EditorService } from '../../core/services/editor.service';
import { Shelf, Notebook, Note, NoteType, NoteRef } from '../../core/models/shelf.model';
import { ContextMenuComponent, ContextMenuTarget, ContextMenuAction } from './components/context-menu/context-menu.component';
import { VersionHistoryComponent } from '../version-history/version-history.component';

/**
 * SidebarComponent
 * Main sidebar with three-level hierarchy: Shelf → Notebook → Note
 * Supports expanded/compact view modes and search
 */
@Component({
  selector: 'lore-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, ContextMenuComponent, DragDropModule, VersionHistoryComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private shelfService = inject(ShelfService);
  private layoutService = inject(LayoutService);
  private editorService = inject(EditorService);

  // Signals
  shelves = this.shelfService.shelves;
  searchQuery = signal('');
  viewMode = signal<'expanded' | 'compact'>('expanded');
  expandedShelves = signal<Set<string>>(new Set());
  expandedNotebooks = signal<Set<string>>(new Set());
  activeNoteId = signal<string | null>(null);
  
  // Context menu state
  contextMenuOpen = signal(false);
  contextMenuTarget = signal<ContextMenuTarget | null>(null);
  contextMenuPosition = signal<{ x: number; y: number } | null>(null);
  
  // Version history state
  versionHistoryOpen = signal(false);
  versionHistoryNote = signal<Note | null>(null);
  
  // Inline editing state
  renamingId = signal<string | null>(null);
  renamingValue = signal('');
  
  // Keyboard navigation state
  focusedItemId = signal<string | null>(null);
  focusedItemType = signal<'shelf' | 'notebook' | 'note' | null>(null);
  draggingNoteId = signal<string | null>(null);

  // Computed
  filteredShelves = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.shelves();

    // Filter shelves, notebooks, and notes based on search query
    return this.shelves()
      .map(shelf => ({
        ...shelf,
        notebooks: shelf.notebooks
          .map(notebook => ({
            ...notebook,
            notes: notebook.notes.filter(note =>
              note.title.toLowerCase().includes(query) ||
              note.preview?.toLowerCase().includes(query) ||
              note.tags.some(tag => tag.toLowerCase().includes(query))
            )
          }))
          .filter(notebook =>
            notebook.name.toLowerCase().includes(query) ||
            notebook.notes.length > 0
          )
      }))
      .filter(shelf =>
        shelf.name.toLowerCase().includes(query) ||
        shelf.notebooks.length > 0
      );
  });

  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];

    return this.shelfService.searchNotes(query);
  });

  isSearching = computed(() => this.searchQuery().trim().length > 0);

  constructor() {
    // Initialize with first shelf and notebook expanded
    const shelves = this.shelves();
    if (shelves.length > 0) {
      this.expandedShelves.set(new Set([shelves[0].id]));
      if (shelves[0].notebooks.length > 0) {
        this.expandedNotebooks.set(new Set([shelves[0].notebooks[0].id]));
        // Set first note as active
        if (shelves[0].notebooks[0].notes.length > 0) {
          this.activeNoteId.set(shelves[0].notebooks[0].notes[0].id);
        }
      }
    }
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
  }

  /**
   * Set up global keyboard event listeners
   */
  private setupKeyboardNavigation(): void {
    // Note: In a real app, this would be in ngOnInit/ngOnDestroy
    // For now, we'll handle it in the component
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════════════════

  setViewMode(mode: 'expanded' | 'compact'): void {
    this.viewMode.set(mode);
  }

  isExpanded(): boolean {
    return this.viewMode() === 'expanded';
  }

  // ═══════════════════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════════════════

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  // ═══════════════════════════════════════════════════════════
  // SHELF OPERATIONS
  // ═══════════════════════════════════════════════════════════

  toggleShelf(shelfId: string): void {
    const expanded = this.expandedShelves();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(shelfId)) {
      newExpanded.delete(shelfId);
    } else {
      newExpanded.add(shelfId);
    }
    
    this.expandedShelves.set(newExpanded);
  }

  createNewShelf(): void {
    const shelf = this.shelfService.createShelf('New Shelf', '#7C3AED', '📚');
    if (shelf) {
      // Expand the new shelf
      const expanded = this.expandedShelves();
      const newExpanded = new Set(expanded);
      newExpanded.add(shelf.id);
      this.expandedShelves.set(newExpanded);
      
      // Start renaming the new shelf
      setTimeout(() => {
        this.renamingId.set(shelf.id);
        this.renamingValue.set(shelf.name);
      }, 100);
    }
  }

  createNewNotebookInShelf(shelfId: string, event: Event): void {
    event.stopPropagation();
    
    const notebook = this.shelfService.createNotebook(shelfId, 'New Notebook', '📔');
    if (notebook) {
      // Expand the shelf to show the new notebook
      const expanded = this.expandedShelves();
      const newExpanded = new Set(expanded);
      newExpanded.add(shelfId);
      this.expandedShelves.set(newExpanded);
      
      // Start renaming the new notebook
      setTimeout(() => {
        this.renamingId.set(notebook.id);
        this.renamingValue.set(notebook.name);
      }, 100);
    }
  }

  createNewNoteInNotebook(notebookId: string, event: Event): void {
    event.stopPropagation();
    
    const note = this.shelfService.createNote(notebookId, 'New Note', NoteType.Idea);
    if (note) {
      // Expand the notebook to show the new note
      const expanded = this.expandedNotebooks();
      const newExpanded = new Set(expanded);
      newExpanded.add(notebookId);
      this.expandedNotebooks.set(newExpanded);
      
      // Set as active note and open in editor
      this.activeNoteId.set(note.id);
      this.editorService.openNoteInPane(note.id);
    }
  }

  isShelfExpanded(shelfId: string): boolean {
    return this.expandedShelves().has(shelfId);
  }

  // ═══════════════════════════════════════════════════════════
  // NOTEBOOK OPERATIONS
  // ═══════════════════════════════════════════════════════════

  toggleNotebook(notebookId: string): void {
    const expanded = this.expandedNotebooks();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(notebookId)) {
      newExpanded.delete(notebookId);
    } else {
      newExpanded.add(notebookId);
    }
    
    this.expandedNotebooks.set(newExpanded);
  }

  isNotebookExpanded(notebookId: string): boolean {
    return this.expandedNotebooks().has(notebookId);
  }

  onNotebookClick(notebookId: string): void {
    // Navigate to notes view with notebook filter
    this.editorService.setNotebookFilter(notebookId);
  }

  onShelfClick(shelfId: string): void {
    // Navigate to notes view with shelf filter
    this.editorService.setShelfFilter(shelfId);
  }

  // ═══════════════════════════════════════════════════════════
  // NOTE OPERATIONS
  // ═══════════════════════════════════════════════════════════

  onNoteClick(noteId: string): void {
    this.activeNoteId.set(noteId);
    
    // Open note in editor
    this.editorService.openNoteInPane(noteId);
  }

  isNoteActive(noteId: string): boolean {
    return this.activeNoteId() === noteId;
  }

  // ═══════════════════════════════════════════════════════════
  // DRAG TO EDITOR (native HTML5 drag — separate from CDK reorder)
  // ═══════════════════════════════════════════════════════════

  onNoteDragStart(event: DragEvent, note: Note): void {
    if (!event.dataTransfer) return;

    const noteRef: NoteRef = {
      id: note.id,
      notebookId: note.notebookId,
      title: note.title,
      type: note.type,
      preview: note.preview,
      updatedAt: note.updatedAt
    };

    event.dataTransfer.setData('application/lore-note', JSON.stringify(noteRef));
    event.dataTransfer.effectAllowed = 'copy';
    this.draggingNoteId.set(note.id);
  }

  onNoteDragEnd(): void {
    this.draggingNoteId.set(null);
  }

  isNoteDragging(noteId: string): boolean {
    return this.draggingNoteId() === noteId;
  }

  // ═══════════════════════════════════════════════════════════
  // CONTEXT MENU (Placeholder for Phase 2 completion)
  // ═══════════════════════════════════════════════════════════

  onShelfContextMenu(event: MouseEvent, shelf: Shelf): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenuTarget.set({
      type: 'shelf',
      id: shelf.id,
      name: shelf.name
    });
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.contextMenuOpen.set(true);
  }

  onNotebookContextMenu(event: MouseEvent, notebook: Notebook): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenuTarget.set({
      type: 'notebook',
      id: notebook.id,
      name: notebook.name
    });
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.contextMenuOpen.set(true);
  }

  onNoteContextMenu(event: MouseEvent, note: Note): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenuTarget.set({
      type: 'note',
      id: note.id,
      name: note.title
    });
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.contextMenuOpen.set(true);
  }

  onContextMenuAction(action: ContextMenuAction): void {
    console.log('Context menu action:', action);
    
    switch (action.type) {
      case 'open':
        this.handleOpenAction(action.target);
        break;
      case 'rename':
        this.startRename(action.target);
        break;
      case 'new-notebook':
        this.handleNewNotebook(action.target);
        break;
      case 'new-note':
        this.handleNewNote(action.target);
        break;
      case 'change-color':
        this.handleChangeColor(action.target);
        break;
      case 'delete':
        this.handleDelete(action.target);
        break;
      case 'version-history':
        this.handleVersionHistory(action.target);
        break;
    }
  }

  onContextMenuClosed(): void {
    this.contextMenuOpen.set(false);
    this.contextMenuTarget.set(null);
    this.contextMenuPosition.set(null);
  }

  private handleOpenAction(target: ContextMenuTarget): void {
    if (target.type === 'shelf') {
      this.toggleShelf(target.id);
    } else if (target.type === 'notebook') {
      this.onNotebookClick(target.id);
    } else if (target.type === 'note') {
      this.onNoteClick(target.id);
    }
  }

  private handleNewNotebook(target: ContextMenuTarget): void {
    if (target.type !== 'shelf') return;
    
    const notebook = this.shelfService.createNotebook(target.id, 'New Notebook', '📔');
    if (notebook) {
      // Expand the shelf to show the new notebook
      const expanded = this.expandedShelves();
      const newExpanded = new Set(expanded);
      newExpanded.add(target.id);
      this.expandedShelves.set(newExpanded);
      
      // Start renaming the new notebook
      setTimeout(() => {
        this.renamingId.set(notebook.id);
        this.renamingValue.set(notebook.name);
      }, 100);
    }
  }

  private handleNewNote(target: ContextMenuTarget): void {
    let notebookId: string | undefined;
    
    if (target.type === 'notebook') {
      notebookId = target.id;
    } else if (target.type === 'shelf') {
      // Find first notebook in shelf
      const shelf = this.shelfService.getShelf(target.id);
      notebookId = shelf?.notebooks[0]?.id;
    } else if (target.type === 'note') {
      // Find notebook containing this note
      const note = this.shelfService.getNote(target.id);
      notebookId = note?.notebookId;
    }
    
    if (notebookId) {
      const note = this.shelfService.createNote(notebookId, 'New Note', NoteType.Idea);
      if (note) {
        // Expand the notebook to show the new note
        const expanded = this.expandedNotebooks();
        const newExpanded = new Set(expanded);
        newExpanded.add(notebookId);
        this.expandedNotebooks.set(newExpanded);
        
        // Set as active note
        this.activeNoteId.set(note.id);
      }
    }
  }

  private handleChangeColor(target: ContextMenuTarget): void {
    if (target.type !== 'shelf') return;
    
    // Cycle through predefined colors
    const colors = ['#7C3AED', '#D97706', '#0F766E', '#BE185D', '#1D4ED8', '#15803D'];
    const shelf = this.shelfService.getShelf(target.id);
    if (!shelf) return;
    
    const currentIndex = colors.indexOf(shelf.color);
    const nextIndex = (currentIndex + 1) % colors.length;
    
    this.shelfService.updateShelf(target.id, { color: colors[nextIndex] });
  }

  private handleDelete(target: ContextMenuTarget): void {
    const confirmed = confirm(`Delete ${target.type} "${target.name}"?`);
    if (!confirmed) return;
    
    if (target.type === 'shelf') {
      this.shelfService.deleteShelf(target.id);
    } else if (target.type === 'notebook') {
      this.shelfService.deleteNotebook(target.id);
    } else if (target.type === 'note') {
      this.shelfService.deleteNote(target.id);
      if (this.activeNoteId() === target.id) {
        this.activeNoteId.set(null);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // INLINE EDITING
  // ═══════════════════════════════════════════════════════════

  startRename(target: ContextMenuTarget): void {
    this.renamingId.set(target.id);
    this.renamingValue.set(target.name);
  }

  isRenaming(id: string): boolean {
    return this.renamingId() === id;
  }

  onRenameInput(value: string): void {
    this.renamingValue.set(value);
  }

  commitRename(): void {
    const id = this.renamingId();
    const value = this.renamingValue().trim();
    
    if (!id || !value) {
      this.cancelRename();
      return;
    }

    const target = this.contextMenuTarget();
    if (!target) {
      // Try to determine type from shelves/notebooks
      const shelf = this.shelfService.getShelf(id);
      if (shelf) {
        this.shelfService.updateShelf(id, { name: value });
      } else {
        const notebook = this.shelfService.getNotebook(id);
        if (notebook) {
          this.shelfService.updateNotebook(id, { name: value });
        } else {
          const note = this.shelfService.getNote(id);
          if (note) {
            this.shelfService.updateNote(id, { title: value });
          }
        }
      }
    } else {
      if (target.type === 'shelf') {
        this.shelfService.updateShelf(id, { name: value });
      } else if (target.type === 'notebook') {
        this.shelfService.updateNotebook(id, { name: value });
      } else if (target.type === 'note') {
        this.shelfService.updateNote(id, { title: value });
      }
    }

    this.cancelRename();
  }

  cancelRename(): void {
    this.renamingId.set(null);
    this.renamingValue.set('');
  }

  onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelRename();
    }
    event.stopPropagation();
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  getNoteCount(shelf: Shelf): number {
    return shelf.notebooks.reduce((total, nb) => total + nb.notes.length, 0);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    const month = noteDate.toLocaleString('default', { month: 'short' });
    const day = noteDate.getDate();
    return `${month} ${day}`;
  }

  trackByShelfId(index: number, shelf: Shelf): string {
    return shelf.id;
  }

  trackByNotebookId(index: number, notebook: Notebook): string {
    return notebook.id;
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }

  // ═══════════════════════════════════════════════════════════
  // DRAG & DROP REORDERING
  // ═══════════════════════════════════════════════════════════

  /**
   * Handle shelf reordering
   */
  onShelfDrop(event: CdkDragDrop<Shelf[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const shelves = [...this.shelves()];
    moveItemInArray(shelves, event.previousIndex, event.currentIndex);

    // Update order property and persist
    const shelfIds = shelves.map(s => s.id);
    this.shelfService.reorderShelves(shelfIds);
  }

  /**
   * Handle notebook reordering within a shelf
   */
  onNotebookDrop(event: CdkDragDrop<Notebook[]>, shelfId: string): void {
    if (event.previousIndex === event.currentIndex) return;

    const shelf = this.shelfService.getShelf(shelfId);
    if (!shelf) return;

    const notebooks = [...shelf.notebooks];
    moveItemInArray(notebooks, event.previousIndex, event.currentIndex);

    // Update order property and persist
    const notebookIds = notebooks.map(nb => nb.id);
    this.shelfService.reorderNotebooks(shelfId, notebookIds);
  }

  /**
   * Handle note reordering within a notebook
   */
  onNoteDrop(event: CdkDragDrop<Note[]>, notebookId: string): void {
    if (event.previousIndex === event.currentIndex) return;

    const notebook = this.shelfService.getNotebook(notebookId);
    if (!notebook) return;

    const notes = [...notebook.notes];
    moveItemInArray(notes, event.previousIndex, event.currentIndex);

    // Update order property and persist
    const noteIds = notes.map(n => n.id);
    this.shelfService.reorderNotes(notebookId, noteIds);
  }

  // ═══════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Handle keyboard events for navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    // Don't handle if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key;
    const focusedId = this.focusedItemId();
    const focusedType = this.focusedItemType();

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp();
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (focusedId && focusedType) {
          this.expandItem(focusedId, focusedType);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (focusedId && focusedType) {
          this.collapseItem(focusedId, focusedType);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedId && focusedType) {
          this.activateItem(focusedId, focusedType);
        }
        break;
      case 'F2':
        event.preventDefault();
        if (focusedId && focusedType && (focusedType === 'shelf' || focusedType === 'notebook')) {
          this.startRenameById(focusedId, focusedType);
        }
        break;
      case 'Delete':
        event.preventDefault();
        if (focusedId && focusedType) {
          this.deleteItemById(focusedId, focusedType);
        }
        break;
    }
  }

  /**
   * Get all visible items in order (for navigation)
   */
  private getVisibleItems(): Array<{ id: string; type: 'shelf' | 'notebook' | 'note' }> {
    const items: Array<{ id: string; type: 'shelf' | 'notebook' | 'note' }> = [];
    
    for (const shelf of this.filteredShelves()) {
      items.push({ id: shelf.id, type: 'shelf' });
      
      if (this.isShelfExpanded(shelf.id)) {
        for (const notebook of shelf.notebooks) {
          items.push({ id: notebook.id, type: 'notebook' });
          
          if (this.isNotebookExpanded(notebook.id)) {
            for (const note of notebook.notes) {
              items.push({ id: note.id, type: 'note' });
            }
          }
        }
      }
    }
    
    return items;
  }

  /**
   * Navigate to next item
   */
  private navigateDown(): void {
    const items = this.getVisibleItems();
    if (items.length === 0) return;

    const currentId = this.focusedItemId();
    
    if (!currentId) {
      // Focus first item
      this.focusedItemId.set(items[0].id);
      this.focusedItemType.set(items[0].type);
      return;
    }

    const currentIndex = items.findIndex(item => item.id === currentId);
    if (currentIndex === -1 || currentIndex === items.length - 1) return;

    const nextItem = items[currentIndex + 1];
    this.focusedItemId.set(nextItem.id);
    this.focusedItemType.set(nextItem.type);
  }

  /**
   * Navigate to previous item
   */
  private navigateUp(): void {
    const items = this.getVisibleItems();
    if (items.length === 0) return;

    const currentId = this.focusedItemId();
    
    if (!currentId) {
      // Focus last item
      const lastItem = items[items.length - 1];
      this.focusedItemId.set(lastItem.id);
      this.focusedItemType.set(lastItem.type);
      return;
    }

    const currentIndex = items.findIndex(item => item.id === currentId);
    if (currentIndex <= 0) return;

    const prevItem = items[currentIndex - 1];
    this.focusedItemId.set(prevItem.id);
    this.focusedItemType.set(prevItem.type);
  }

  /**
   * Expand item (shelf or notebook)
   */
  private expandItem(id: string, type: 'shelf' | 'notebook' | 'note'): void {
    if (type === 'shelf') {
      const expanded = this.expandedShelves();
      if (!expanded.has(id)) {
        const newExpanded = new Set(expanded);
        newExpanded.add(id);
        this.expandedShelves.set(newExpanded);
      }
    } else if (type === 'notebook') {
      const expanded = this.expandedNotebooks();
      if (!expanded.has(id)) {
        const newExpanded = new Set(expanded);
        newExpanded.add(id);
        this.expandedNotebooks.set(newExpanded);
      }
    }
  }

  /**
   * Collapse item (shelf or notebook)
   */
  private collapseItem(id: string, type: 'shelf' | 'notebook' | 'note'): void {
    if (type === 'shelf') {
      const expanded = this.expandedShelves();
      if (expanded.has(id)) {
        const newExpanded = new Set(expanded);
        newExpanded.delete(id);
        this.expandedShelves.set(newExpanded);
      }
    } else if (type === 'notebook') {
      const expanded = this.expandedNotebooks();
      if (expanded.has(id)) {
        const newExpanded = new Set(expanded);
        newExpanded.delete(id);
        this.expandedNotebooks.set(newExpanded);
      }
    }
  }

  /**
   * Activate item (open note, open notebook, or toggle shelf)
   */
  private activateItem(id: string, type: 'shelf' | 'notebook' | 'note'): void {
    if (type === 'shelf') {
      this.toggleShelf(id);
    } else if (type === 'notebook') {
      this.onNotebookClick(id);
    } else if (type === 'note') {
      this.onNoteClick(id);
    }
  }

  /**
   * Start rename by ID
   */
  private startRenameById(id: string, type: 'shelf' | 'notebook'): void {
    let name = '';
    
    if (type === 'shelf') {
      const shelf = this.shelfService.getShelf(id);
      name = shelf?.name || '';
    } else if (type === 'notebook') {
      const notebook = this.shelfService.getNotebook(id);
      name = notebook?.name || '';
    }
    
    this.startRename({ type, id, name });
  }

  /**
   * Delete item by ID
   */
  private deleteItemById(id: string, type: 'shelf' | 'notebook' | 'note'): void {
    let name = '';
    
    if (type === 'shelf') {
      const shelf = this.shelfService.getShelf(id);
      name = shelf?.name || '';
    } else if (type === 'notebook') {
      const notebook = this.shelfService.getNotebook(id);
      name = notebook?.name || '';
    } else if (type === 'note') {
      const note = this.shelfService.getNote(id);
      name = note?.title || '';
    }
    
    this.handleDelete({ type, id, name });
  }

  /**
   * Check if item is focused
   */
  isFocused(id: string): boolean {
    return this.focusedItemId() === id;
  }

  /**
   * Set focus on item (for click events)
   */
  setFocus(id: string, type: 'shelf' | 'notebook' | 'note'): void {
    this.focusedItemId.set(id);
    this.focusedItemType.set(type);
  }

  // ═══════════════════════════════════════════════════════════
  // VERSION HISTORY
  // ═══════════════════════════════════════════════════════════

  /**
   * Handle version history action
   */
  private handleVersionHistory(target: ContextMenuTarget): void {
    if (target.type !== 'note') return;
    
    const note = this.shelfService.getNote(target.id);
    if (note) {
      this.versionHistoryNote.set(note);
      this.versionHistoryOpen.set(true);
    }
  }

  /**
   * Close version history modal
   */
  closeVersionHistory(): void {
    this.versionHistoryOpen.set(false);
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
}
