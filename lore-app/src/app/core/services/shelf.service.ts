import { Injectable, signal, computed } from '@angular/core';
import { Shelf, Notebook, Note, NoteType, NoteStatus } from '../models/shelf.model';
import { LocalStorageService } from './local-storage.service';

/**
 * ShelfService
 * Manages the three-tier hierarchy: Shelves → Notebooks → Notes
 * Uses Angular signals for reactive state management
 */
@Injectable({
  providedIn: 'root'
})
export class ShelfService {
  private readonly STORAGE_KEY = 'shelves';
  
  // Signals
  private shelvesSignal = signal<Shelf[]>([]);
  
  // Public computed signals
  shelves = this.shelvesSignal.asReadonly();
  totalNotes = computed(() => {
    return this.shelvesSignal().reduce((total, shelf) => {
      return total + shelf.notebooks.reduce((nbTotal, nb) => nbTotal + nb.notes.length, 0);
    }, 0);
  });

  constructor(private localStorage: LocalStorageService) {
    this.loadFromStorage();
  }

  // ═══════════════════════════════════════════════════════════
  // SHELF CRUD
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new shelf
   */
  createShelf(name: string, color: string = '#7C3AED', icon?: string): Shelf {
    const shelves = this.shelvesSignal();
    const newShelf: Shelf = {
      id: this.generateId(),
      name,
      color,
      icon,
      notebooks: [],
      order: shelves.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.shelvesSignal.set([...shelves, newShelf]);
    this.saveToStorage();
    return newShelf;
  }

  /**
   * Update shelf
   */
  updateShelf(shelfId: string, updates: Partial<Shelf>): boolean {
    const shelves = this.shelvesSignal();
    const index = shelves.findIndex(s => s.id === shelfId);
    
    if (index === -1) return false;

    const updatedShelf = {
      ...shelves[index],
      ...updates,
      updatedAt: new Date()
    };

    const newShelves = [...shelves];
    newShelves[index] = updatedShelf;
    this.shelvesSignal.set(newShelves);
    this.saveToStorage();
    return true;
  }

  /**
   * Delete shelf
   */
  deleteShelf(shelfId: string): boolean {
    const shelves = this.shelvesSignal();
    const filtered = shelves.filter(s => s.id !== shelfId);
    
    if (filtered.length === shelves.length) return false;

    this.shelvesSignal.set(filtered);
    this.saveToStorage();
    return true;
  }

  /**
   * Reorder shelves
   */
  reorderShelves(shelfIds: string[]): boolean {
    const shelves = this.shelvesSignal();
    const reordered = shelfIds
      .map(id => shelves.find(s => s.id === id))
      .filter((s): s is Shelf => s !== undefined)
      .map((shelf, index) => ({ ...shelf, order: index }));

    this.shelvesSignal.set(reordered);
    this.saveToStorage();
    return true;
  }

  /**
   * Get shelf by ID
   */
  getShelf(shelfId: string): Shelf | undefined {
    return this.shelvesSignal().find(s => s.id === shelfId);
  }

  // ═══════════════════════════════════════════════════════════
  // NOTEBOOK CRUD
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new notebook
   */
  createNotebook(shelfId: string, name: string, icon: string = '📔'): Notebook | null {
    const shelves = this.shelvesSignal();
    const shelfIndex = shelves.findIndex(s => s.id === shelfId);
    
    if (shelfIndex === -1) return null;

    const shelf = shelves[shelfIndex];
    const newNotebook: Notebook = {
      id: this.generateId(),
      shelfId,
      name,
      icon,
      notes: [],
      order: shelf.notebooks.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedShelf = {
      ...shelf,
      notebooks: [...shelf.notebooks, newNotebook],
      updatedAt: new Date()
    };

    const newShelves = [...shelves];
    newShelves[shelfIndex] = updatedShelf;
    this.shelvesSignal.set(newShelves);
    this.saveToStorage();
    return newNotebook;
  }

  /**
   * Update notebook
   */
  updateNotebook(notebookId: string, updates: Partial<Notebook>): boolean {
    const shelves = this.shelvesSignal();
    let updated = false;

    const newShelves = shelves.map(shelf => {
      const nbIndex = shelf.notebooks.findIndex(nb => nb.id === notebookId);
      if (nbIndex === -1) return shelf;

      const updatedNotebook = {
        ...shelf.notebooks[nbIndex],
        ...updates,
        updatedAt: new Date()
      };

      const newNotebooks = [...shelf.notebooks];
      newNotebooks[nbIndex] = updatedNotebook;
      updated = true;

      return {
        ...shelf,
        notebooks: newNotebooks,
        updatedAt: new Date()
      };
    });

    if (updated) {
      this.shelvesSignal.set(newShelves);
      this.saveToStorage();
    }

    return updated;
  }

  /**
   * Delete notebook
   */
  deleteNotebook(notebookId: string): boolean {
    const shelves = this.shelvesSignal();
    let deleted = false;

    const newShelves = shelves.map(shelf => {
      const filtered = shelf.notebooks.filter(nb => nb.id !== notebookId);
      if (filtered.length < shelf.notebooks.length) {
        deleted = true;
        return {
          ...shelf,
          notebooks: filtered,
          updatedAt: new Date()
        };
      }
      return shelf;
    });

    if (deleted) {
      this.shelvesSignal.set(newShelves);
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * Get notebook by ID
   */
  getNotebook(notebookId: string): Notebook | undefined {
    for (const shelf of this.shelvesSignal()) {
      const notebook = shelf.notebooks.find(nb => nb.id === notebookId);
      if (notebook) return notebook;
    }
    return undefined;
  }

  /**
   * Reorder notebooks within a shelf
   */
  reorderNotebooks(shelfId: string, notebookIds: string[]): boolean {
    const shelves = this.shelvesSignal();
    const shelfIndex = shelves.findIndex(s => s.id === shelfId);
    
    if (shelfIndex === -1) return false;

    const shelf = shelves[shelfIndex];
    const reordered = notebookIds
      .map(id => shelf.notebooks.find(nb => nb.id === id))
      .filter((nb): nb is Notebook => nb !== undefined)
      .map((nb, index) => ({ ...nb, order: index }));

    const updatedShelf = {
      ...shelf,
      notebooks: reordered,
      updatedAt: new Date()
    };

    const newShelves = [...shelves];
    newShelves[shelfIndex] = updatedShelf;
    this.shelvesSignal.set(newShelves);
    this.saveToStorage();
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // NOTE CRUD
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new note
   */
  createNote(
    notebookId: string,
    title: string,
    type: NoteType = NoteType.Idea,
    content: string = ''
  ): Note | null {
    const shelves = this.shelvesSignal();
    let created: Note | null = null;

    const newShelves = shelves.map(shelf => {
      const nbIndex = shelf.notebooks.findIndex(nb => nb.id === notebookId);
      if (nbIndex === -1) return shelf;

      const notebook = shelf.notebooks[nbIndex];
      const newNote: Note = {
        id: this.generateId(),
        notebookId,
        title,
        type,
        content,
        preview: this.generatePreview(content),
        tags: [],
        status: NoteStatus.Draft,
        blocks: [],
        linkedNoteIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      created = newNote;

      const updatedNotebook = {
        ...notebook,
        notes: [newNote, ...notebook.notes], // Add to top
        updatedAt: new Date()
      };

      const newNotebooks = [...shelf.notebooks];
      newNotebooks[nbIndex] = updatedNotebook;

      return {
        ...shelf,
        notebooks: newNotebooks,
        updatedAt: new Date()
      };
    });

    if (created) {
      this.shelvesSignal.set(newShelves);
      this.saveToStorage();
    }

    return created;
  }

  /**
   * Update note
   */
  updateNote(noteId: string, updates: Partial<Note>): boolean {
    const shelves = this.shelvesSignal();
    let updated = false;

    const newShelves = shelves.map(shelf => {
      const notebooks = shelf.notebooks.map(notebook => {
        const noteIndex = notebook.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return notebook;

        const updatedNote = {
          ...notebook.notes[noteIndex],
          ...updates,
          preview: updates.content ? this.generatePreview(updates.content) : notebook.notes[noteIndex].preview,
          updatedAt: new Date()
        };

        const newNotes = [...notebook.notes];
        newNotes[noteIndex] = updatedNote;
        updated = true;

        return {
          ...notebook,
          notes: newNotes,
          updatedAt: new Date()
        };
      });

      if (updated) {
        return {
          ...shelf,
          notebooks,
          updatedAt: new Date()
        };
      }
      return shelf;
    });

    if (updated) {
      this.shelvesSignal.set(newShelves);
      this.saveToStorage();
    }

    return updated;
  }

  /**
   * Delete note
   */
  deleteNote(noteId: string): boolean {
    const shelves = this.shelvesSignal();
    let deleted = false;

    const newShelves = shelves.map(shelf => {
      const notebooks = shelf.notebooks.map(notebook => {
        const filtered = notebook.notes.filter(n => n.id !== noteId);
        if (filtered.length < notebook.notes.length) {
          deleted = true;
          return {
            ...notebook,
            notes: filtered,
            updatedAt: new Date()
          };
        }
        return notebook;
      });

      if (deleted) {
        return {
          ...shelf,
          notebooks,
          updatedAt: new Date()
        };
      }
      return shelf;
    });

    if (deleted) {
      this.shelvesSignal.set(newShelves);
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * Get note by ID
   */
  getNote(noteId: string): Note | undefined {
    for (const shelf of this.shelvesSignal()) {
      for (const notebook of shelf.notebooks) {
        const note = notebook.notes.find(n => n.id === noteId);
        if (note) return note;
      }
    }
    return undefined;
  }

  /**
   * Search notes
   */
  searchNotes(query: string): Note[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: Note[] = [];

    for (const shelf of this.shelvesSignal()) {
      for (const notebook of shelf.notebooks) {
        for (const note of notebook.notes) {
          if (
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            note.preview?.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          ) {
            results.push(note);
          }
        }
      }
    }

    return results;
  }

  /**
   * Reorder notes within a notebook
   */
  reorderNotes(notebookId: string, noteIds: string[]): boolean {
    const shelves = this.shelvesSignal();
    let updated = false;

    const newShelves = shelves.map(shelf => {
      const nbIndex = shelf.notebooks.findIndex(nb => nb.id === notebookId);
      if (nbIndex === -1) return shelf;

      const notebook = shelf.notebooks[nbIndex];
      const reordered = noteIds
        .map(id => notebook.notes.find(n => n.id === id))
        .filter((n): n is Note => n !== undefined);

      const updatedNotebook = {
        ...notebook,
        notes: reordered,
        updatedAt: new Date()
      };

      const newNotebooks = [...shelf.notebooks];
      newNotebooks[nbIndex] = updatedNotebook;
      updated = true;

      return {
        ...shelf,
        notebooks: newNotebooks,
        updatedAt: new Date()
      };
    });

    if (updated) {
      this.shelvesSignal.set(newShelves);
      this.saveToStorage();
    }

    return updated;
  }

  // ═══════════════════════════════════════════════════════════
  // STORAGE & UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Load shelves from localStorage
   */
  private loadFromStorage(): void {
    const stored = this.localStorage.getItem<Shelf[]>(this.STORAGE_KEY);
    
    if (stored && stored.length > 0) {
      // Convert date strings back to Date objects
      const shelves = stored.map(shelf => ({
        ...shelf,
        createdAt: new Date(shelf.createdAt),
        updatedAt: new Date(shelf.updatedAt),
        notebooks: shelf.notebooks.map(nb => ({
          ...nb,
          createdAt: new Date(nb.createdAt),
          updatedAt: new Date(nb.updatedAt),
          notes: nb.notes.map(note => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt)
          }))
        }))
      }));
      this.shelvesSignal.set(shelves);
    } else {
      // Initialize with seed data
      this.initializeSeedData();
    }
  }

  /**
   * Save shelves to localStorage
   */
  private saveToStorage(): void {
    this.localStorage.setItem(this.STORAGE_KEY, this.shelvesSignal());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate preview text from content
   */
  private generatePreview(content: string, maxLength: number = 120): string {
    const stripped = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return stripped.length > maxLength
      ? stripped.substring(0, maxLength) + '…'
      : stripped;
  }

  /**
   * Initialize with seed data for development
   */
  private initializeSeedData(): void {
    const seedShelves: Shelf[] = [
      {
        id: 'shelf_1',
        name: 'AI & Machine Learning',
        color: '#7C3AED',
        notebooks: [
          {
            id: 'nb_1',
            shelfId: 'shelf_1',
            name: 'Transformers',
            icon: '📔',
            notes: [
              {
                id: 'note_1',
                notebookId: 'nb_1',
                title: 'Transformer Architecture Deep Dive',
                type: NoteType.Research,
                content: 'Attention mechanisms, positional encodings, multi-head attention tradeoffs.',
                preview: 'Attention mechanisms, positional encodings, multi-head attention tradeoffs.',
                tags: ['transformers', 'attention'],
                status: NoteStatus.InProgress,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-16'),
                updatedAt: new Date('2026-03-16')
              },
              {
                id: 'note_2',
                notebookId: 'nb_1',
                title: 'Attention Mechanisms Survey',
                type: NoteType.Research,
                content: 'Scaled dot-product, sparse, local, and flash attention variants compared.',
                preview: 'Scaled dot-product, sparse, local, and flash attention variants compared.',
                tags: ['attention', 'survey'],
                status: NoteStatus.InProgress,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-18'),
                updatedAt: new Date('2026-03-18')
              },
              {
                id: 'note_3',
                notebookId: 'nb_1',
                title: 'BERT vs GPT Analysis',
                type: NoteType.Idea,
                content: 'Bidirectional vs autoregressive — enterprise use case comparison.',
                preview: 'Bidirectional vs autoregressive — enterprise use case comparison.',
                tags: ['bert', 'gpt'],
                status: NoteStatus.Draft,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-22'),
                updatedAt: new Date('2026-03-22')
              }
            ],
            order: 0,
            createdAt: new Date('2026-03-01'),
            updatedAt: new Date('2026-03-22')
          },
          {
            id: 'nb_2',
            shelfId: 'shelf_1',
            name: 'RAG Patterns',
            icon: '📗',
            notes: [
              {
                id: 'note_4',
                notebookId: 'nb_2',
                title: 'Hybrid Retrieval Strategies',
                type: NoteType.Research,
                content: 'BM25 + dense vectors, cross-encoder re-ranking.',
                preview: 'BM25 + dense vectors, cross-encoder re-ranking.',
                tags: ['rag', 'retrieval'],
                status: NoteStatus.InProgress,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-20'),
                updatedAt: new Date('2026-03-20')
              },
              {
                id: 'note_5',
                notebookId: 'nb_2',
                title: 'Context Window Management',
                type: NoteType.Task,
                content: 'Token budgeting strategies for long-context LLM calls.',
                preview: 'Token budgeting strategies for long-context LLM calls.',
                tags: ['context', 'llm'],
                status: NoteStatus.Draft,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-25'),
                updatedAt: new Date('2026-03-25')
              }
            ],
            order: 1,
            createdAt: new Date('2026-03-01'),
            updatedAt: new Date('2026-03-25')
          }
        ],
        order: 0,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-25')
      },
      {
        id: 'shelf_2',
        name: 'Personal',
        color: '#D97706',
        notebooks: [
          {
            id: 'nb_3',
            shelfId: 'shelf_2',
            name: 'Daily Journal',
            icon: '📒',
            notes: [
              {
                id: 'note_6',
                notebookId: 'nb_3',
                title: 'Monday — Deep Work Session',
                type: NoteType.Journal,
                content: 'Shipped Lore demo. Azure deployed. Energy 4/5.',
                preview: 'Shipped Lore demo. Azure deployed. Energy 4/5.',
                tags: ['work', 'productivity'],
                status: NoteStatus.Done,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-16'),
                updatedAt: new Date('2026-03-16')
              },
              {
                id: 'note_7',
                notebookId: 'nb_3',
                title: 'Weekly Review · Week 12',
                type: NoteType.Journal,
                content: 'Roadmap milestones hit, gym 6/6, two blog posts drafted.',
                preview: 'Roadmap milestones hit, gym 6/6, two blog posts drafted.',
                tags: ['review', 'weekly'],
                status: NoteStatus.Done,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-03-22'),
                updatedAt: new Date('2026-03-22')
              }
            ],
            order: 0,
            createdAt: new Date('2026-03-01'),
            updatedAt: new Date('2026-03-22')
          },
          {
            id: 'nb_4',
            shelfId: 'shelf_2',
            name: 'Linear Algebra Book',
            icon: '📐',
            notes: [
              {
                id: 'note_8',
                notebookId: 'nb_4',
                title: 'Chapter Structure & Outline',
                type: NoteType.Idea,
                content: 'Story → Math → Python → Manim. 3B1B-style.',
                preview: 'Story → Math → Python → Manim. 3B1B-style.',
                tags: ['book', 'outline'],
                status: NoteStatus.Draft,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-04-05'),
                updatedAt: new Date('2026-04-05')
              }
            ],
            order: 1,
            createdAt: new Date('2026-04-01'),
            updatedAt: new Date('2026-04-05')
          }
        ],
        order: 1,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-04-05')
      },
      {
        id: 'shelf_3',
        name: 'Work & Finance',
        color: '#0F766E',
        notebooks: [
          {
            id: 'nb_5',
            shelfId: 'shelf_3',
            name: 'Equity Research',
            icon: '📊',
            notes: [
              {
                id: 'note_9',
                notebookId: 'nb_5',
                title: 'Indian Equity Framework',
                type: NoteType.Reference,
                content: 'BRSR, SEBI LODR, Beneish M-Score, ROIC vs WACC.',
                preview: 'BRSR, SEBI LODR, Beneish M-Score, ROIC vs WACC.',
                tags: ['equity', 'framework'],
                status: NoteStatus.Done,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-02-10'),
                updatedAt: new Date('2026-02-10')
              }
            ],
            order: 0,
            createdAt: new Date('2026-02-01'),
            updatedAt: new Date('2026-02-10')
          }
        ],
        order: 2,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-10')
      }
    ];

    this.shelvesSignal.set(seedShelves);
    this.saveToStorage();
  }

  /**
   * Reset to seed data (for development/testing)
   */
  resetToSeedData(): void {
    this.localStorage.removeItem(this.STORAGE_KEY);
    this.initializeSeedData();
  }
}
