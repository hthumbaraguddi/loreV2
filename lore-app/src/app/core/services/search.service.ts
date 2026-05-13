import { Injectable, signal, computed, inject } from '@angular/core';
import { ShelfService } from './shelf.service';
import { Note } from '../models/shelf.model';

export interface SearchIndex {
  notes: Map<string, { title: string; content: string; tags: string[] }>;
  lastIndexed: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private shelfService = inject(ShelfService);

  // Search state
  isOpen = signal(false);
  recentSearches = signal<string[]>([]);
  searchHistory = signal<Array<{ query: string; timestamp: Date; resultCount: number }>>([]);

  // Search index for faster lookups
  private searchIndex = signal<SearchIndex | null>(null);

  // Computed values
  hasRecentSearches = computed(() => this.recentSearches().length > 0);

  /**
   * Opens the global search overlay
   */
  openSearch(): void {
    this.isOpen.set(true);
  }

  /**
   * Closes the global search overlay
   */
  closeSearch(): void {
    this.isOpen.set(false);
  }

  /**
   * Toggles the global search overlay
   */
  toggleSearch(): void {
    this.isOpen.update(v => !v);
  }

  /**
   * Adds a search query to recent searches
   */
  addRecentSearch(query: string): void {
    if (!query.trim()) return;

    const recent = this.recentSearches();
    const filtered = recent.filter(s => s !== query);
    const updated = [query, ...filtered].slice(0, 10); // Keep last 10 searches
    this.recentSearches.set(updated);
    this.saveToStorage();
  }

  /**
   * Records a search in history
   */
  recordSearch(query: string, resultCount: number): void {
    const history = this.searchHistory();
    const updated = [
      { query, timestamp: new Date(), resultCount },
      ...history
    ].slice(0, 50); // Keep last 50 searches
    this.searchHistory.set(updated);
    this.addRecentSearch(query);
  }

  /**
   * Clears recent searches
   */
  clearRecentSearches(): void {
    this.recentSearches.set([]);
    this.saveToStorage();
  }

  /**
   * Builds search index for faster lookups
   */
  buildIndex(): void {
    const notes = this.shelfService.getAllNotes();
    const noteIndex = new Map<string, { title: string; content: string; tags: string[] }>();

    notes.forEach(note => {
      noteIndex.set(note.id, {
        title: note.title || '',
        content: note.content || '',
        tags: note.tags || []
      });
    });

    this.searchIndex.set({
      notes: noteIndex,
      lastIndexed: new Date()
    });
  }

  /**
   * Performs a full-text search across all notes
   */
  searchNotes(query: string): Note[] {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const notes = this.shelfService.getAllNotes();

    // Score-based search
    const results = notes.map(note => {
      let score = 0;
      const title = (note.title || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      const tags = (note.tags || []).map(t => t.toLowerCase());

      // Title match (highest priority)
      if (title.includes(q)) {
        score += 10;
        if (title.startsWith(q)) score += 5;
      }

      // Tag match (high priority)
      if (tags.some(t => t.includes(q))) {
        score += 7;
      }

      // Content match (lower priority)
      if (content.includes(q)) {
        score += 3;
        // Count occurrences for better ranking
        const matches = content.split(q).length - 1;
        score += Math.min(matches, 5);
      }

      return { note, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ note }) => note);

    this.recordSearch(query, results.length);
    return results;
  }

  /**
   * Searches for tags matching query
   */
  searchTags(query: string): Array<{ name: string; count: number }> {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const tagCounts = new Map<string, number>();
    const notes = this.shelfService.getAllNotes();

    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (tag.toLowerCase().includes(q)) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      }
    });

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Gets all unique tags with counts
   */
  getAllTags(): Array<{ name: string; count: number }> {
    const tagCounts = new Map<string, number>();
    const notes = this.shelfService.getAllNotes();

    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Searches for notebooks matching query
   */
  searchNotebooks(query: string): Array<{ id: string; name: string; shelfName: string; noteCount: number }> {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results: Array<{ id: string; name: string; shelfName: string; noteCount: number }> = [];
    const shelves = this.shelfService.shelves();

    shelves.forEach(shelf => {
      shelf.notebooks.forEach(notebook => {
        if (notebook.name.toLowerCase().includes(q)) {
          results.push({
            id: notebook.id,
            name: notebook.name,
            shelfName: shelf.name,
            noteCount: notebook.notes.length
          });
        }
      });
    });

    return results;
  }

  /**
   * Highlights search matches in text
   */
  highlightMatches(text: string, query: string): string {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escapes special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Loads recent searches from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('lore-recent-searches');
      if (stored) {
        const searches = JSON.parse(stored);
        this.recentSearches.set(searches);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }

  /**
   * Saves recent searches to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('lore-recent-searches', JSON.stringify(this.recentSearches()));
    } catch (e) {
      console.error('Failed to save recent searches', e);
    }
  }
}
