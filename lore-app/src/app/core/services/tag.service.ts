import { Injectable, signal, computed, inject } from '@angular/core';
import { ShelfService } from './shelf.service';
import { Note } from '../models/shelf.model';

export interface TagInfo {
  name: string;
  count: number;
  notes: Note[];
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private shelfService = inject(ShelfService);

  // Tag state
  selectedTags = signal<string[]>([]);
  tagColors = signal<Map<string, string>>(new Map());

  // Computed values
  allTags = computed(() => {
    const tagMap = new Map<string, Note[]>();
    const notes = this.shelfService.getAllNotes();

    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(note);
        });
      }
    });

    const tags: TagInfo[] = [];
    tagMap.forEach((notes, name) => {
      tags.push({
        name,
        count: notes.length,
        notes,
        color: this.tagColors().get(name)
      });
    });

    return tags.sort((a, b) => b.count - a.count);
  });

  recentTags = computed(() => {
    return this.allTags().slice(0, 10);
  });

  /**
   * Gets all tags with their counts
   */
  getTags(): TagInfo[] {
    return this.allTags();
  }

  /**
   * Gets notes for a specific tag
   */
  getNotesByTag(tag: string): Note[] {
    return this.allTags().find(t => t.name === tag)?.notes || [];
  }

  /**
   * Adds a tag to a note
   */
  addTagToNote(note: Note, tag: string): void {
    if (!note.tags) {
      note.tags = [];
    }
    if (!note.tags.includes(tag)) {
      note.tags.push(tag);
      this.shelfService.updateNote(note.id, { tags: note.tags });
    }
  }

  /**
   * Removes a tag from a note
   */
  removeTagFromNote(note: Note, tag: string): void {
    if (note.tags) {
      const index = note.tags.indexOf(tag);
      if (index > -1) {
        note.tags.splice(index, 1);
        this.shelfService.updateNote(note.id, { tags: note.tags });
      }
    }
  }

  /**
   * Renames a tag across all notes
   */
  renameTag(oldName: string, newName: string): void {
    const tagInfo = this.allTags().find(t => t.name === oldName);
    if (tagInfo) {
      tagInfo.notes.forEach(note => {
        const index = note.tags?.indexOf(oldName) ?? -1;
        if (index > -1) {
          note.tags![index] = newName;
          this.shelfService.updateNote(note.id, { tags: note.tags });
        }
      });
    }
  }

  /**
   * Deletes a tag from all notes
   */
  deleteTag(tag: string): void {
    const tagInfo = this.allTags().find(t => t.name === tag);
    if (tagInfo) {
      tagInfo.notes.forEach(note => {
        if (note.tags) {
          note.tags = note.tags.filter(t => t !== tag);
          this.shelfService.updateNote(note.id, { tags: note.tags });
        }
      });
    }
  }

  /**
   * Sets the color for a tag
   */
  setTagColor(tag: string, color: string): void {
    const colors = new Map(this.tagColors());
    colors.set(tag, color);
    this.tagColors.set(colors);
    this.saveTagColors();
  }

  /**
   * Gets the color for a tag
   */
  getTagColor(tag: string): string | undefined {
    return this.tagColors().get(tag);
  }

  /**
   * Filters tags by query
   */
  searchTags(query: string): TagInfo[] {
    if (!query.trim()) return this.allTags();

    const q = query.toLowerCase();
    return this.allTags().filter(tag =>
      tag.name.toLowerCase().includes(q)
    );
  }

  /**
   * Gets tags for autocomplete
   */
  getTagSuggestions(query: string, exclude: string[] = []): string[] {
    const q = query.toLowerCase();
    return this.allTags()
      .filter(tag =>
        tag.name.toLowerCase().includes(q) &&
        !exclude.includes(tag.name)
      )
      .slice(0, 10)
      .map(t => t.name);
  }

  /**
   * Toggles tag selection
   */
  toggleTagSelection(tag: string): void {
    const selected = this.selectedTags();
    if (selected.includes(tag)) {
      this.selectedTags.set(selected.filter(t => t !== tag));
    } else {
      this.selectedTags.set([...selected, tag]);
    }
  }

  /**
   * Clears tag selection
   */
  clearTagSelection(): void {
    this.selectedTags.set([]);
  }

  /**
   * Saves tag colors to localStorage
   */
  private saveTagColors(): void {
    try {
      const colors = Object.fromEntries(this.tagColors());
      localStorage.setItem('lore-tag-colors', JSON.stringify(colors));
    } catch (e) {
      console.error('Failed to save tag colors', e);
    }
  }

  /**
   * Loads tag colors from localStorage
   */
  loadTagColors(): void {
    try {
      const stored = localStorage.getItem('lore-tag-colors');
      if (stored) {
        const colors = JSON.parse(stored);
        this.tagColors.set(new Map(Object.entries(colors)));
      }
    } catch (e) {
      console.error('Failed to load tag colors', e);
    }
  }
}
