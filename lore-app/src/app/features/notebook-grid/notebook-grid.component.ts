import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShelfService } from '../../core/services/shelf.service';
import { Note, NoteType } from '../../core/models/shelf.model';
import { EditorService } from '../../core/services/editor.service';

/**
 * NotebookGridComponent
 * Displays a grid of notes when no panes are open
 * Based on v8 mock design
 */
@Component({
  selector: 'lore-notebook-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notebook-grid.component.html',
  styleUrl: './notebook-grid.component.scss'
})
export class NotebookGridComponent {
  private shelfService = inject(ShelfService);
  private editorService = inject(EditorService);

  // Signals
  activeTab = signal<'all' | 'recent' | 'favorites' | 'ai'>('all');
  layoutMode = signal<'grid' | 'list'>('grid');
  selectedTags = signal<string[]>([]);
  sortBy = signal<'updated' | 'created' | 'title'>('updated');

  // Computed signals
  notebooks = this.shelfService.notebooks;
  
  // Get current filters
  shelfFilter = this.editorService.shelfFilter;
  notebookFilter = this.editorService.notebookFilter;
  
  // Get filtered shelf or notebook name for display
  filterContext = computed(() => {
    const shelfId = this.shelfFilter();
    const notebookId = this.notebookFilter();
    
    if (notebookId) {
      const notebook = this.shelfService.getNotebook(notebookId);
      return {
        type: 'notebook' as const,
        name: notebook?.name || 'Unknown Notebook',
        icon: notebook?.icon || '📔'
      };
    }
    
    if (shelfId) {
      const shelf = this.shelfService.getShelf(shelfId);
      return {
        type: 'shelf' as const,
        name: shelf?.name || 'Unknown Shelf',
        color: shelf?.color || '#7C3AED'
      };
    }
    
    return null;
  });
  
  notes = computed(() => {
    const shelfId = this.shelfFilter();
    const notebookId = this.notebookFilter();
    const tab = this.activeTab();
    const tags = this.selectedTags();
    const sort = this.sortBy();

    // Get notes based on filter
    let allNotes: Note[];
    
    if (notebookId) {
      // Filter by notebook
      const notebook = this.shelfService.getNotebook(notebookId);
      allNotes = notebook ? [...notebook.notes] : [];
    } else if (shelfId) {
      // Filter by shelf
      const shelf = this.shelfService.getShelf(shelfId);
      allNotes = shelf 
        ? shelf.notebooks.flatMap(nb => nb.notes)
        : [];
    } else {
      // All notes
      allNotes = this.shelfService.getAllNotes();
    }

    // Filter by tab
    let filtered = [...allNotes];
    if (tab === 'recent') {
      filtered.sort((a: Note, b: Note) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      filtered = filtered.slice(0, 20); // Show only recent 20
    } else if (tab === 'favorites') {
      filtered = filtered.filter((note: Note) => note.tags.includes('favorite'));
    } else if (tab === 'ai') {
      filtered = filtered.filter((note: Note) => note.blocks.some((block: any) => block.type === 'ai'));
    }

    // Filter by tags
    if (tags.length > 0) {
      filtered = filtered.filter((note: Note) => 
        note.tags.some((tag: string) => tags.includes(tag))
      );
    }

    // Sort
    if (sort === 'updated') {
      filtered.sort((a: Note, b: Note) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sort === 'created') {
      filtered.sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'title') {
      filtered.sort((a: Note, b: Note) => a.title.localeCompare(b.title));
    }

    return filtered;
  });

  // Stats
  stats = computed(() => {
    const allNotes = this.shelfService.getAllNotes();
    return {
      total: allNotes.length,
      recent: allNotes.filter((n: Note) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(n.updatedAt) > weekAgo;
      }).length,
      ai: allNotes.filter((n: Note) => n.blocks.some((b: any) => b.type === 'ai')).length,
      favorites: allNotes.filter((n: Note) => n.tags.includes('favorite')).length
    };
  });

  // All tags
  allTags = computed(() => {
    const notes = this.shelfService.getAllNotes();
    const tagMap = new Map<string, number>();
    
    notes.forEach((note: Note) => {
      note.tags.forEach((tag: string) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  });

  // ═══════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Open note in editor
   */
  openNote(noteId: string): void {
    this.editorService.openNoteInPane(noteId, 0);
  }

  /**
   * Create new note
   */
  createNewNote(): void {
    const notebookId = this.notebookFilter() || this.notebooks()[0]?.id;
    if (notebookId) {
      const note = this.shelfService.createNote(notebookId, 'New Note', NoteType.Idea);
      if (note) {
        this.openNote(note.id);
      }
    }
  }

  /**
   * Clear filters and return to all notes view
   */
  clearFilters(): void {
    this.editorService.clearFilters();
  }

  /**
   * Toggle tag selection
   */
  toggleTag(tag: string): void {
    const tags = this.selectedTags();
    if (tags.includes(tag)) {
      this.selectedTags.set(tags.filter(t => t !== tag));
    } else {
      this.selectedTags.set([...tags, tag]);
    }
  }

  /**
   * Set active tab
   */
  setTab(tab: 'all' | 'recent' | 'favorites' | 'ai'): void {
    this.activeTab.set(tab);
  }

  /**
   * Toggle layout mode
   */
  toggleLayout(): void {
    this.layoutMode.set(this.layoutMode() === 'grid' ? 'list' : 'grid');
  }

  /**
   * Set sort option
   */
  setSort(sort: 'updated' | 'created' | 'title'): void {
    this.sortBy.set(sort);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get badge color based on note type
   */
  getBadgeColor(type: string): string {
    switch (type) {
      case 'research': return 'badge-research';
      case 'journal': return 'badge-journal';
      case 'task': return 'badge-task';
      case 'idea': return 'badge-idea';
      case 'reference': return 'badge-reference';
      case 'html': return 'badge-html';
      default: return 'badge-reference';
    }
  }

  /**
   * Get badge label based on note type
   */
  getBadgeLabel(type: string): string {
    switch (type) {
      case 'research': return 'Research';
      case 'journal': return 'Journal';
      case 'task': return 'Task';
      case 'idea': return 'Idea';
      case 'reference': return 'Reference';
      case 'html': return 'HTML';
      default: return 'Note';
    }
  }

  /**
   * Get AI block count for a note
   */
  getAICount(note: Note): number {
    // Count AI blocks
    return note.blocks.filter((block: any) => block.type === 'ai').length;
  }

  /**
   * Track by note ID
   */
  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }
}