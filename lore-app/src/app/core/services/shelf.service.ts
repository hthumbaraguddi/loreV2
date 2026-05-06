import { Injectable, signal, computed, inject } from '@angular/core';
import { Shelf, Notebook, Note, NoteType, NoteStatus, BlockType } from '../models/shelf.model';
import { LocalStorageService } from './local-storage.service';
import { VersioningService } from './versioning.service';
import { VersionTrigger } from '../models/version.model';

/**
 * ShelfService
 * Manages the three-tier hierarchy: Shelves → Notebooks → Notes
 * Uses Angular signals for reactive state management
 * Integrated with versioning system
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
  notebooks = computed(() => {
    const allNotebooks: Notebook[] = [];
    for (const shelf of this.shelvesSignal()) {
      allNotebooks.push(...shelf.notebooks);
    }
    return allNotebooks;
  });
  totalNotes = computed(() => {
    return this.shelvesSignal().reduce((total, shelf) => {
      return total + shelf.notebooks.reduce((nbTotal, nb) => nbTotal + nb.notes.length, 0);
    }, 0);
  });

  private versioningService = inject(VersioningService);

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

  /**
   * Restore note from a version
   */
  restoreNoteFromVersion(noteId: string, versionId: string): boolean {
    const note = this.getNote(noteId);
    if (!note) return false;

    const snapshot = this.versioningService.restoreVersion(note, versionId);
    if (!snapshot) return false;

    // Update the note with the restored snapshot
    return this.updateNote(noteId, {
      title: snapshot.title,
      type: snapshot.type as NoteType,
      content: snapshot.content,
      preview: snapshot.preview,
      tags: snapshot.tags,
      status: snapshot.status as NoteStatus,
      blocks: snapshot.blocks,
      linkedNoteIds: snapshot.linkedNoteIds
    });
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
    content: string = '',
    blocks: any[] = []
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
        blocks: blocks.length > 0 ? blocks : [],
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
      
      // Create initial version for the new note
      this.versioningService.createInitialVersion(created);
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
   * Get all notes across all shelves and notebooks
   */
  getAllNotes(): Note[] {
    const results: Note[] = [];
    
    for (const shelf of this.shelvesSignal()) {
      for (const notebook of shelf.notebooks) {
        results.push(...notebook.notes);
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
                content: `## Overview

The Transformer architecture (Vaswani et al., 2017) replaced recurrence with self-attention, enabling full parallelisation during training.

## Core Components

**Multi-Head Attention**
Runs h parallel attention heads, each learning different relationship patterns. Output is concatenated and projected:
  MultiHead(Q,K,V) = Concat(head_1,...,head_h) · W^O

**Positional Encoding**
Since attention is permutation-invariant, position is injected via sinusoidal encodings added to token embeddings. Learned positional embeddings (GPT-style) are now more common.

**Feed-Forward Sublayer**
Two linear layers with a ReLU/GELU in between, applied position-wise. Typically 4× the model dimension.

## Key Tradeoffs

| Aspect | Transformer | RNN/LSTM |
|---|---|---|
| Parallelism | Full | Sequential |
| Long-range deps | O(1) path length | O(n) path length |
| Memory | O(n²) attention | O(n) hidden state |
| Training speed | Fast | Slow |

## Open Questions
- Flash Attention reduces memory from O(n²) to O(n) — worth adopting for all new work?
- RoPE vs ALiBi vs learned positional embeddings for long-context models?`,
                preview: 'The Transformer architecture replaced recurrence with self-attention, enabling full parallelisation. Core components: multi-head attention, positional encoding, feed-forward sublayer.',
                tags: ['transformers', 'attention', 'architecture'],
                status: NoteStatus.InProgress,
                blocks: [
                  {
                    id: 'blk_1',
                    type: BlockType.Hypothesis,
                    content: 'We hypothesise that Flash Attention + GQA will become the standard for all production LLMs by 2027.',
                    order: 0,
                    createdAt: new Date('2026-03-16')
                  },
                  {
                    id: 'blk_2',
                    type: BlockType.KeyDifferences,
                    content: 'Transformer vs RNN/LSTM',
                    metadata: {
                      columns: ['Transformer', 'RNN/LSTM'],
                      rows: [
                        ['Full parallelism', 'Sequential'],
                        ['O(1) path length', 'O(n) path length'],
                        ['O(n²) memory', 'O(n) hidden state']
                      ]
                    },
                    order: 1,
                    createdAt: new Date('2026-03-16')
                  },
                  {
                    id: 'blk_3',
                    type: BlockType.Code,
                    content: 'def scaled_dot_product_attention(Q, K, V, mask=None):\n    d_k = K.shape[-1]\n    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    attention = torch.softmax(scores, dim=-1)\n    return torch.matmul(attention, V)',
                    metadata: { language: 'python' },
                    order: 2,
                    createdAt: new Date('2026-03-16')
                  },
                  {
                    id: 'blk_4',
                    type: BlockType.AskAI,
                    content: 'Explain the tradeoffs between different attention mechanisms for long-context models.',
                    metadata: { provider: 'anthropic', responses: [] },
                    order: 3,
                    createdAt: new Date('2026-03-16')
                  }
                ],
                linkedNoteIds: ['note_2'],
                createdAt: new Date('2026-03-16'),
                updatedAt: new Date('2026-03-16')
              },
              {
                id: 'note_2',
                notebookId: 'nb_1',
                title: 'Attention Mechanisms Survey',
                type: NoteType.Research,
                content: `## Attention Variants

### Scaled Dot-Product (Vanilla)
  Attention(Q,K,V) = softmax(QK^T / √d_k) · V

Complexity: O(n²d). Works well up to ~4k tokens.

### Sparse Attention (Longformer, BigBird)
Each token attends to a local window + a few global tokens. Reduces complexity to O(n·w) where w is window size. Good for documents.

### Flash Attention (Dao et al., 2022)
Reorders computation to avoid materialising the full n×n attention matrix. Same output as vanilla but O(n) memory. Now standard in most serious implementations.

### Multi-Query Attention (MQA)
All heads share a single K and V projection. Dramatically reduces KV-cache size at inference — critical for serving large models.

### Grouped-Query Attention (GQA)
Compromise between MHA and MQA: groups of heads share K/V. Used in Llama 2/3, Mistral.

## Recommendation
For new projects: Flash Attention + GQA is the current best practice. MHA is only worth it for small research models where interpretability matters.`,
                preview: 'Survey of attention variants: scaled dot-product, sparse (Longformer), Flash Attention, Multi-Query, and Grouped-Query. Flash Attention + GQA is current best practice.',
                tags: ['attention', 'survey', 'flash-attention'],
                status: NoteStatus.InProgress,
                blocks: [],
                linkedNoteIds: ['note_1'],
                createdAt: new Date('2026-03-18'),
                updatedAt: new Date('2026-03-18')
              },
              {
                id: 'note_3',
                notebookId: 'nb_1',
                title: 'BERT vs GPT Analysis',
                type: NoteType.Idea,
                content: `## The Core Difference

BERT is bidirectional (encoder-only, masked LM). GPT is autoregressive (decoder-only, causal LM). This single architectural choice drives almost every downstream difference.

## Enterprise Use Case Mapping

| Use Case | Winner | Why |
|---|---|---|
| Classification / NER | BERT | Bidirectional context = better representations |
| Semantic search / embeddings | BERT variants | Sentence-BERT, E5, BGE all encoder-based |
| Text generation | GPT | Autoregressive is the only option |
| RAG retrieval | BERT | Embedding quality matters more than generation |
| RAG generation | GPT | Obvious |
| Code completion | GPT | Needs to predict next token |
| Document Q&A | Either | Depends on pipeline design |

## Practical Takeaway

Most enterprise pipelines need both:
- A BERT-family model for retrieval/embedding (e5-large, BGE-M3)
- A GPT-family model for generation (GPT-4o, Claude 3.5, Llama 3)

The "BERT vs GPT" framing is mostly academic now — production systems use both.`,
                preview: 'BERT (bidirectional encoder) vs GPT (autoregressive decoder). Most enterprise pipelines need both: BERT for retrieval/embeddings, GPT for generation.',
                tags: ['bert', 'gpt', 'enterprise'],
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
                content: `## Why Hybrid?

Pure dense retrieval misses exact keyword matches. Pure BM25 misses semantic similarity. Hybrid combines both.

## Architecture

1. **BM25 (sparse)** — Elasticsearch / OpenSearch. Fast, exact, handles rare terms well.
2. **Dense (vector)** — FAISS / Pinecone / Weaviate. Semantic similarity via embeddings.
3. **Reciprocal Rank Fusion (RRF)** — Merge ranked lists without needing score normalisation:
   RRF(d) = Σ 1/(k + rank_i(d))   where k=60 is standard

## Cross-Encoder Re-ranking

After retrieving top-k candidates (e.g. 50), run a cross-encoder to re-score:
- Cross-encoders see both query and document together → much higher accuracy
- Too slow for full corpus, perfect for re-ranking a small candidate set
- Good models: ms-marco-MiniLM-L-6-v2, bge-reranker-large

## Recommended Pipeline

Query → [BM25 top-50 + Dense top-50] → RRF merge → Cross-encoder re-rank top-10 → LLM`,
                preview: 'Hybrid retrieval combines BM25 (sparse) and dense vectors, merged via Reciprocal Rank Fusion. Cross-encoder re-ranking on top-50 candidates before passing to LLM.',
                tags: ['rag', 'retrieval', 'hybrid', 'reranking'],
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
                content: `## Problem

LLM context windows are large but not infinite. Stuffing everything in degrades quality and increases cost. Need a principled approach.

## Token Budget Framework

For a 128k context model, rough allocation:
- System prompt: ~2k tokens
- Retrieved chunks: ~60k tokens (top-10 × ~6k each)
- Conversation history: ~20k tokens
- Output buffer: ~8k tokens
- Safety margin: ~38k tokens

## Strategies

### 1. Sliding Window
Keep the last N tokens of conversation. Simple but loses early context.

### 2. Summarisation
Periodically summarise older turns into a compressed memory. Loses detail but preserves gist.

### 3. Selective Retrieval
Store all history in a vector DB, retrieve relevant turns per query. Best quality, most complex.

### 4. Hierarchical Chunking
Index documents at multiple granularities (sentence, paragraph, section). Retrieve at the right level.

## Action Items
- [ ] Benchmark sliding window vs retrieval on our Q&A eval set
- [ ] Implement token counting middleware in the API layer
- [ ] Set up cost alerts when context > 50k tokens per request`,
                preview: 'Token budgeting framework for 128k context models. Strategies: sliding window, summarisation, selective retrieval, hierarchical chunking.',
                tags: ['context', 'llm', 'tokens', 'cost'],
                status: NoteStatus.Draft,
                blocks: [],
                linkedNoteIds: ['note_4'],
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
                content: `## April 28, 2026 — Monday

**Energy:** 4/5  
**Focus blocks:** 3 × 90 min  
**Mood:** Focused, slightly anxious about the demo

---

### What I did

- Shipped the Lore sidebar drag-and-drop feature. Took longer than expected because Angular CDK and native HTML5 drag events conflict — had to strip CDK from note items and use native dragstart/drop.
- Deployed to Azure Static Web Apps. Build pipeline green on first try (rare).
- Reviewed the Phase 3 component spec. Editor foundation is cleaner than I thought.

### What went well

The CDK conflict fix was actually a good architectural decision — native drag is simpler and more composable. Should have done it from the start.

### What didn't go well

Lost 45 minutes debugging a TypeScript strict-mode error that turned out to be a missing NoteRef import. Need to be more systematic about checking imports first.

### Tomorrow

- Start Phase 4 block system
- Write the Hypothesis and Conclusion block components
- Set up the slash command palette skeleton`,
                preview: 'Shipped Lore sidebar drag-and-drop. Deployed to Azure. Reviewed Phase 3 component spec. Lost 45 min on a missing import.',
                tags: ['work', 'productivity', 'lore'],
                status: NoteStatus.Done,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-04-28'),
                updatedAt: new Date('2026-04-28')
              },
              {
                id: 'note_7',
                notebookId: 'nb_3',
                title: 'Weekly Review · Week 17',
                type: NoteType.Journal,
                content: `## Week of April 21–27, 2026

### Wins 🏆
- Completed Phase 2 (Sidebar) and Phase 3 (Editor Foundation) of Lore
- Gym: 6/6 sessions. Deadlift PR: 140kg
- Finished draft of "Why RAG beats fine-tuning for enterprise" blog post
- Read 180 pages of Gödel, Escher, Bach

### Misses ❌
- Didn't finish the equity research note I planned
- Skipped Sunday planning session — felt it in Monday's scattered start

### Numbers
| Metric | Target | Actual |
|---|---|---|
| Deep work hours | 20h | 22h |
| Gym sessions | 5 | 6 |
| Pages read | 100 | 180 |
| Blog posts drafted | 1 | 1 |

### Theme for next week
**Depth over breadth.** Resist the urge to start new things. Finish Phase 4 blocks before touching anything else.

### One thing I'd tell past-me
The CDK drag conflict would have been obvious if you'd read the Angular docs first. RTFM.`,
                preview: 'Week 17 review. Completed Phase 2 & 3 of Lore. Gym 6/6. Deadlift PR 140kg. Blog post drafted. Theme: depth over breadth.',
                tags: ['review', 'weekly', 'reflection'],
                status: NoteStatus.Done,
                blocks: [],
                linkedNoteIds: [],
                createdAt: new Date('2026-04-27'),
                updatedAt: new Date('2026-04-27')
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
                content: `## Concept

A linear algebra book that teaches through story, then formalises with math, then implements in Python, then visualises with Manim. Inspired by 3Blue1Brown's "Essence of Linear Algebra" series.

## Chapter Outline

### Part 1: Foundations
1. **What is a vector?** — Arrow in space → column of numbers → abstract element of a vector space
2. **Linear combinations** — The geometry of span
3. **Linear transformations** — Functions that preserve structure
4. **Matrix multiplication** — Composition of transformations

### Part 2: The Core Theorems
5. **Determinants** — How much does a transformation scale area/volume?
6. **Eigenvalues & Eigenvectors** — The "skeleton" of a transformation
7. **Diagonalisation** — Simplifying repeated transformations
8. **SVD** — The most important decomposition in applied math

### Part 3: Applications
9. **PCA** — Dimensionality reduction via eigenvectors
10. **Least squares** — Solving overdetermined systems
11. **PageRank** — Eigenvectors in the wild
12. **Neural networks** — Linear algebra is all you need (almost)

## Format per Chapter
- Opening story / intuition (500 words)
- Formal definition + proof
- Python implementation (NumPy)
- Manim animation script
- Exercises (3 computational, 1 proof, 1 open-ended)

## Next Steps
- [ ] Write Chapter 1 draft
- [ ] Set up Manim environment
- [ ] Find a technical reviewer`,
                preview: 'Linear algebra book: story → math → Python → Manim. 3B1B-style. 12 chapters covering vectors through SVD and applications in PCA, least squares, PageRank, neural nets.',
                tags: ['book', 'linear-algebra', 'manim', 'education'],
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
                content: `## Regulatory Framework

**SEBI LODR** (Listing Obligations and Disclosure Requirements)
- Quarterly results within 45 days of quarter end
- Annual report within 60 days of AGM
- Material events disclosed within 24 hours

**BRSR** (Business Responsibility and Sustainability Report)
- Mandatory for top 1000 listed companies by market cap
- Covers ESG metrics: energy, water, GHG emissions, employee welfare
- Key for institutional investors doing ESG screening

## Valuation Metrics

### Quality Filters (must pass all)
- ROIC > WACC (value creation test)
- Debt/Equity < 1.0 (financial stability)
- Promoter pledge < 10% (governance)
- Operating cash flow positive for 3 of last 5 years

### Fraud Detection: Beneish M-Score
8-variable model. Score > -1.78 suggests possible manipulation.

Key variables:
- DSRI: Days Sales Receivable Index (rising = red flag)
- GMI: Gross Margin Index (declining = pressure to manipulate)
- AQI: Asset Quality Index (rising = capitalising expenses)
- SGI: Sales Growth Index (high growth = incentive to manipulate)
- DEPI: Depreciation Index (declining = extending asset lives)

### Valuation
- P/E relative to sector median and 5-year own history
- EV/EBITDA for capital-intensive businesses
- P/B for banks and NBFCs (target < 2× for value)
- DCF with 3 scenarios (bear/base/bull) — use WACC = Rf + β(Rm-Rf) + size premium

## Watchlist Criteria
1. ROIC > 15% consistently
2. Revenue CAGR > 15% over 5 years
3. Promoter holding > 50% (skin in the game)
4. Free cash flow yield > 3%
5. No related-party transaction red flags`,
                preview: 'Indian equity framework: SEBI LODR, BRSR compliance, quality filters (ROIC > WACC), Beneish M-Score fraud detection, valuation via P/E, EV/EBITDA, DCF.',
                tags: ['equity', 'framework', 'sebi', 'valuation', 'india'],
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
