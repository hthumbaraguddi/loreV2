/**
 * Property-Based Test: Hierarchy Referential Integrity
 *
 * Property 1: Hierarchy Referential Integrity (Invariant)
 * FOR ALL states persisted by DataService, every Notebook's `shelfId` SHALL
 * reference an id that exists in the shelves array, every Section SHALL belong
 * to a Notebook that exists in the notebooks array, and every Note SHALL belong
 * to a Section within a Notebook.
 *
 * Validates: Requirements 2.1, 2.5, 2.6, 2.7
 */

import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { AppState } from '../models';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Assert the full referential integrity invariant on a given state. */
function assertReferentialIntegrity(state: AppState, context: string): void {
  const shelfIds = new Set(state.shelves.map(s => s.id));

  for (const nb of state.notebooks) {
    expect(shelfIds.has(nb.shelfId))
      .withContext(`${context}: notebook "${nb.name}" (id=${nb.id}) has shelfId="${nb.shelfId}" which does not exist in shelves`)
      .toBeTrue();
  }

  for (const nb of state.notebooks) {
    for (const sec of nb.sections) {
      // Section belongs to a notebook that exists — guaranteed by being nested inside nb
      for (const note of sec.notes) {
        // Note belongs to a section within a notebook — guaranteed by nesting
        expect(typeof note.id).withContext(`${context}: note id should be a string`).toBe('string');
      }
    }
  }
}

/** Pick a random element from an array; returns undefined if empty. */
function pick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('DataService — Property 1: Hierarchy Referential Integrity', () => {
  let service: DataService;
  let localStorageStore: Record<string, string>;
  const TEST_USER = 'test_user';

  beforeEach(() => {
    localStorageStore = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) =>
      localStorageStore[key] ?? null
    );
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageStore[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
    service.setCurrentUser(TEST_USER);
  });

  // ── 1. Basic add: every notebook.shelfId exists in shelves ─────────────────

  it('should maintain referential integrity after adding shelves, notebooks, sections, and notes', () => {
    const shelf1 = service.addShelf('Fiction', '📚');
    const shelf2 = service.addShelf('Work', '💼');

    const nb1 = service.addNotebook('Sci-Fi', '🚀', shelf1.id);
    const nb2 = service.addNotebook('Fantasy', '🧙', shelf1.id);
    const nb3 = service.addNotebook('Projects', '📋', shelf2.id);

    const sec1 = service.addSection(nb1.id, 'Characters', '', 'purple');
    const sec2 = service.addSection(nb2.id, 'World Building', '', 'teal');
    service.addSection(nb3.id, 'Sprint 1', '', 'blue');

    service.addNote(nb1.id, sec1.id, 'Hero', 'research', {});
    service.addNote(nb2.id, sec2.id, 'Magic System', 'journal', {});

    assertReferentialIntegrity(service.getState(), 'after adding entities');
  });

  // ── 2. Delete shelf: no notebooks remain with that shelfId ─────────────────

  it('should remove all notebooks belonging to a deleted shelf', () => {
    const shelf = service.addShelf('Temp Shelf', '🗑️');
    service.addNotebook('NB-A', '📓', shelf.id);
    service.addNotebook('NB-B', '📓', shelf.id);

    service.deleteShelf(shelf.id);

    const state = service.getState();
    const orphans = state.notebooks.filter(nb => nb.shelfId === shelf.id);
    expect(orphans.length)
      .withContext('no notebooks should remain with the deleted shelfId')
      .toBe(0);

    assertReferentialIntegrity(state, 'after deleting shelf');
  });

  // ── 3. Delete notebook: no orphaned sections/notes remain ──────────────────

  it('should remove all sections and notes when a notebook is deleted', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Section', '', 'amber');
    service.addNote(nb.id, sec.id, 'Note 1', 'research', {});
    service.addNote(nb.id, sec.id, 'Note 2', 'journal', {});

    service.deleteNotebook(nb.id);

    const state = service.getState();
    const deletedNb = state.notebooks.find(n => n.id === nb.id);
    expect(deletedNb)
      .withContext('deleted notebook should not exist in state')
      .toBeUndefined();

    assertReferentialIntegrity(state, 'after deleting notebook');
  });

  // ── 4. Delete section: no orphaned notes remain ────────────────────────────

  it('should remove all notes when a section is deleted', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Section', '', 'green');
    service.addNote(nb.id, sec.id, 'Note A', 'research', {});
    service.addNote(nb.id, sec.id, 'Note B', 'research', {});

    service.deleteSection(nb.id, sec.id);

    const state = service.getState();
    const notebook = state.notebooks.find(n => n.id === nb.id)!;
    const deletedSec = notebook.sections.find(s => s.id === sec.id);
    expect(deletedSec)
      .withContext('deleted section should not exist in notebook')
      .toBeUndefined();

    assertReferentialIntegrity(state, 'after deleting section');
  });

  // ── 5. Invariant holds after multiple sequential mutations ─────────────────

  it('should maintain referential integrity across a sequence of add/delete operations', () => {
    // Build up a structure
    const shelfA = service.addShelf('Alpha', '🅰️');
    const shelfB = service.addShelf('Beta', '🅱️');
    const nb1 = service.addNotebook('NB-1', '1️⃣', shelfA.id);
    const nb2 = service.addNotebook('NB-2', '2️⃣', shelfA.id);
    const nb3 = service.addNotebook('NB-3', '3️⃣', shelfB.id);
    const sec1 = service.addSection(nb1.id, 'S1', '', 'purple');
    const sec2 = service.addSection(nb2.id, 'S2', '', 'coral');
    service.addSection(nb3.id, 'S3', '', 'pink');
    service.addNote(nb1.id, sec1.id, 'Note-1', 'research', {});
    service.addNote(nb2.id, sec2.id, 'Note-2', 'journal', {});

    assertReferentialIntegrity(service.getState(), 'step 1: initial build');

    // Delete a notebook — its sections/notes should vanish
    service.deleteNotebook(nb2.id);
    assertReferentialIntegrity(service.getState(), 'step 2: after deleteNotebook(nb2)');

    // Add more notebooks to the remaining shelves
    const nb4 = service.addNotebook('NB-4', '4️⃣', shelfA.id);
    const sec4 = service.addSection(nb4.id, 'S4', '', 'teal');
    service.addNote(nb4.id, sec4.id, 'Note-4', 'scrum', {});
    assertReferentialIntegrity(service.getState(), 'step 3: after adding nb4');

    // Delete shelfA — nb1 and nb4 should be removed
    service.deleteShelf(shelfA.id);
    const stateAfterShelfDelete = service.getState();
    const orphans = stateAfterShelfDelete.notebooks.filter(nb => nb.shelfId === shelfA.id);
    expect(orphans.length)
      .withContext('no notebooks should reference deleted shelfA')
      .toBe(0);
    assertReferentialIntegrity(stateAfterShelfDelete, 'step 4: after deleteShelf(shelfA)');

    // Only shelfB and nb3 should remain
    expect(stateAfterShelfDelete.shelves.length).toBe(1);
    expect(stateAfterShelfDelete.notebooks.length).toBe(1);
    expect(stateAfterShelfDelete.notebooks[0].id).toBe(nb3.id);
  });

  // ── 6. Property test: random-like sequences of operations ─────────────────

  it('should maintain referential integrity across 50 random-like mutation sequences', () => {
    const ITERATIONS = 50;

    // Seed names for variety
    const shelfNames = ['Shelf-A', 'Shelf-B', 'Shelf-C', 'Shelf-D'];
    const nbNames = ['NB-1', 'NB-2', 'NB-3', 'NB-4', 'NB-5'];
    const secNames = ['Sec-X', 'Sec-Y', 'Sec-Z'];
    const colors = ['purple', 'teal', 'blue', 'amber', 'coral', 'green', 'pink', 'gray'];
    const templateIds = ['research', 'journal', 'finance', 'scrum', 'watchlist', 'investing'];

    for (let i = 0; i < ITERATIONS; i++) {
      const op = Math.random();
      const state = service.getState();

      if (op < 0.15) {
        // Add a shelf
        const name = shelfNames[Math.floor(Math.random() * shelfNames.length)];
        service.addShelf(name, '📚');

      } else if (op < 0.30) {
        // Add a notebook to a random shelf
        const shelf = pick(state.shelves);
        if (shelf) {
          const name = nbNames[Math.floor(Math.random() * nbNames.length)];
          service.addNotebook(name, '📓', shelf.id);
        }

      } else if (op < 0.45) {
        // Add a section to a random notebook
        const nb = pick(state.notebooks);
        if (nb) {
          const title = secNames[Math.floor(Math.random() * secNames.length)];
          const color = colors[Math.floor(Math.random() * colors.length)];
          service.addSection(nb.id, title, '', color);
        }

      } else if (op < 0.60) {
        // Add a note to a random section in a random notebook
        const nb = pick(state.notebooks);
        if (nb && nb.sections.length > 0) {
          const sec = pick(nb.sections)!;
          const templateId = templateIds[Math.floor(Math.random() * templateIds.length)];
          service.addNote(nb.id, sec.id, `Note-${i}`, templateId, {});
        }

      } else if (op < 0.70) {
        // Delete a random shelf (cascade)
        const shelf = pick(state.shelves);
        if (shelf) {
          service.deleteShelf(shelf.id);
        }

      } else if (op < 0.80) {
        // Delete a random notebook (cascade)
        const nb = pick(state.notebooks);
        if (nb) {
          service.deleteNotebook(nb.id);
        }

      } else if (op < 0.90) {
        // Delete a random section (cascade)
        const nb = pick(state.notebooks);
        if (nb && nb.sections.length > 0) {
          const sec = pick(nb.sections)!;
          service.deleteSection(nb.id, sec.id);
        }

      } else {
        // Delete a random note
        const nb = pick(state.notebooks);
        if (nb) {
          const sec = pick(nb.sections);
          if (sec && sec.notes.length > 0) {
            const note = pick(sec.notes)!;
            service.deleteNote(nb.id, sec.id, note.id);
          }
        }
      }

      // Assert invariant after every single operation
      assertReferentialIntegrity(
        service.getState(),
        `iteration ${i} (op=${op.toFixed(2)})`
      );
    }
  });

  // ── 7. Invariant survives save/load round-trip ─────────────────────────────

  it('should maintain referential integrity after save and reload', () => {
    const shelf = service.addShelf('Persisted Shelf', '💾');
    const nb = service.addNotebook('Persisted NB', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Persisted Section', '', 'blue');
    service.addNote(nb.id, sec.id, 'Persisted Note', 'research', {});

    // Simulate reload: create a fresh service instance and load from the same localStorage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(DataService);
    freshService.setCurrentUser(TEST_USER);
    freshService.loadAll(TEST_USER);

    assertReferentialIntegrity(freshService.getState(), 'after save/load round-trip');

    const loadedState = freshService.getState();
    expect(loadedState.shelves.length).toBe(1);
    expect(loadedState.notebooks.length).toBe(1);
    expect(loadedState.notebooks[0].shelfId).toBe(shelf.id);
  });
});

/**
 * Property-Based Test: Cascade Delete Completeness
 *
 * Property 9: Cascade Delete Completeness (Invariant)
 * FOR ALL Shelf deletions, after DataService processes the deletion, no Notebook
 * with the deleted Shelf's id as `shelfId` SHALL remain in the notebooks array,
 * and no Section or Note that belonged to those Notebooks SHALL remain in any
 * Section's `notes` array.
 *
 * Validates: Requirements 2.5, 2.6, 2.7
 */
describe('DataService — Property 9: Cascade Delete Completeness', () => {
  let service: DataService;
  let localStorageStore: Record<string, string>;
  const TEST_USER = 'cascade_test_user';

  beforeEach(() => {
    localStorageStore = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) =>
      localStorageStore[key] ?? null
    );
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageStore[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
    service.setCurrentUser(TEST_USER);
  });

  // ── 1. deleteShelf: no notebooks remain with that shelfId, sections/notes gone ──

  it('should remove all notebooks, sections, and notes when a shelf is deleted', () => {
    const shelf = service.addShelf('Doomed Shelf', '🗑️');
    const nb1 = service.addNotebook('NB-1', '📓', shelf.id);
    const nb2 = service.addNotebook('NB-2', '📓', shelf.id);
    const sec1 = service.addSection(nb1.id, 'Section A', '', 'purple');
    const sec2 = service.addSection(nb2.id, 'Section B', '', 'teal');
    service.addNote(nb1.id, sec1.id, 'Note 1', 'research', {});
    service.addNote(nb1.id, sec1.id, 'Note 2', 'journal', {});
    service.addNote(nb2.id, sec2.id, 'Note 3', 'finance', {});

    service.deleteShelf(shelf.id);

    const state = service.getState();

    // No notebooks with the deleted shelfId
    const remainingNotebooks = state.notebooks.filter(nb => nb.shelfId === shelf.id);
    expect(remainingNotebooks.length)
      .withContext('no notebooks should remain with the deleted shelfId')
      .toBe(0);

    // The specific notebooks are gone
    expect(state.notebooks.find(nb => nb.id === nb1.id))
      .withContext('nb1 should be removed')
      .toBeUndefined();
    expect(state.notebooks.find(nb => nb.id === nb2.id))
      .withContext('nb2 should be removed')
      .toBeUndefined();

    // All sections and notes within those notebooks are gone (notebooks are gone, so sections/notes are implicitly gone)
    for (const nb of state.notebooks) {
      for (const sec of nb.sections) {
        expect(sec.id).not.toBe(sec1.id);
        expect(sec.id).not.toBe(sec2.id);
        for (const note of sec.notes) {
          expect(['Note 1', 'Note 2', 'Note 3']).not.toContain(note.title);
        }
      }
    }
  });

  // ── 2. deleteNotebook: notebook gone, all its sections and notes gone ──────

  it('should remove the notebook and all its sections and notes when a notebook is deleted', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Target Notebook', '📓', shelf.id);
    const otherNb = service.addNotebook('Other Notebook', '📓', shelf.id);

    const sec1 = service.addSection(nb.id, 'Section 1', '', 'blue');
    const sec2 = service.addSection(nb.id, 'Section 2', '', 'amber');
    service.addSection(otherNb.id, 'Other Section', '', 'green');

    service.addNote(nb.id, sec1.id, 'Note A', 'research', {});
    service.addNote(nb.id, sec1.id, 'Note B', 'journal', {});
    service.addNote(nb.id, sec2.id, 'Note C', 'scrum', {});

    service.deleteNotebook(nb.id);

    const state = service.getState();

    // Notebook is gone
    expect(state.notebooks.find(n => n.id === nb.id))
      .withContext('deleted notebook should not exist')
      .toBeUndefined();

    // Other notebook is unaffected
    const other = state.notebooks.find(n => n.id === otherNb.id);
    expect(other).withContext('other notebook should still exist').toBeDefined();
    expect(other!.sections.length).withContext('other notebook sections intact').toBe(1);

    // Sections sec1 and sec2 are gone (they were inside the deleted notebook)
    for (const remainingNb of state.notebooks) {
      for (const sec of remainingNb.sections) {
        expect(sec.id).not.toBe(sec1.id);
        expect(sec.id).not.toBe(sec2.id);
      }
    }
  });

  // ── 3. deleteSection: section gone, all its notes gone ────────────────────

  it('should remove the section and all its notes when a section is deleted', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const targetSec = service.addSection(nb.id, 'Target Section', '', 'coral');
    const otherSec = service.addSection(nb.id, 'Other Section', '', 'pink');

    service.addNote(nb.id, targetSec.id, 'Note X', 'research', {});
    service.addNote(nb.id, targetSec.id, 'Note Y', 'finance', {});
    service.addNote(nb.id, otherSec.id, 'Note Z', 'journal', {});

    service.deleteSection(nb.id, targetSec.id);

    const state = service.getState();
    const notebook = state.notebooks.find(n => n.id === nb.id)!;

    // Target section is gone
    expect(notebook.sections.find(s => s.id === targetSec.id))
      .withContext('deleted section should not exist in notebook')
      .toBeUndefined();

    // Other section and its note are unaffected
    const other = notebook.sections.find(s => s.id === otherSec.id);
    expect(other).withContext('other section should still exist').toBeDefined();
    expect(other!.notes.length).withContext('other section notes intact').toBe(1);
    expect(other!.notes[0].title).toBe('Note Z');

    // Notes X and Y are gone (their section is gone)
    for (const sec of notebook.sections) {
      for (const note of sec.notes) {
        expect(note.title).not.toBe('Note X');
        expect(note.title).not.toBe('Note Y');
      }
    }
  });

  // ── 4. Property test: complex hierarchy, delete each shelf one by one ──────

  it('should maintain cascade delete completeness across a complex multi-shelf hierarchy', () => {
    // Build a complex hierarchy: 4 shelves, each with 2-3 notebooks,
    // each notebook with 2 sections, each section with 2 notes
    const shelfCount = 4;
    const shelves = Array.from({ length: shelfCount }, (_, i) =>
      service.addShelf(`Shelf-${i}`, '📚')
    );

    const notebooksByShelf: Record<string, string[]> = {};
    for (const shelf of shelves) {
      notebooksByShelf[shelf.id] = [];
      const nbCount = 2 + (shelves.indexOf(shelf) % 2); // 2 or 3 notebooks
      for (let n = 0; n < nbCount; n++) {
        const nb = service.addNotebook(`NB-${shelf.id}-${n}`, '📓', shelf.id);
        notebooksByShelf[shelf.id].push(nb.id);

        for (let s = 0; s < 2; s++) {
          const sec = service.addSection(nb.id, `Sec-${n}-${s}`, '', 'purple');
          service.addNote(nb.id, sec.id, `Note-${n}-${s}-0`, 'research', {});
          service.addNote(nb.id, sec.id, `Note-${n}-${s}-1`, 'journal', {});
        }
      }
    }

    // Verify initial state has all shelves
    expect(service.getState().shelves.length).toBe(shelfCount);

    // Delete each shelf one by one and verify completeness after each deletion
    for (const shelf of shelves) {
      const shelfId = shelf.id;
      const expectedNotebookIds = new Set(notebooksByShelf[shelfId]);

      service.deleteShelf(shelfId);

      const state = service.getState();

      // No notebooks with the deleted shelfId remain
      const orphanedNotebooks = state.notebooks.filter(nb => nb.shelfId === shelfId);
      expect(orphanedNotebooks.length)
        .withContext(`after deleting shelf ${shelfId}: no notebooks should have shelfId=${shelfId}`)
        .toBe(0);

      // None of the specific notebook ids from this shelf remain
      for (const nbId of expectedNotebookIds) {
        expect(state.notebooks.find(nb => nb.id === nbId))
          .withContext(`after deleting shelf ${shelfId}: notebook ${nbId} should be gone`)
          .toBeUndefined();
      }

      // All remaining notebooks still have valid shelfIds (referential integrity)
      const remainingShelfIds = new Set(state.shelves.map(s => s.id));
      for (const nb of state.notebooks) {
        expect(remainingShelfIds.has(nb.shelfId))
          .withContext(`notebook ${nb.id} shelfId=${nb.shelfId} must reference an existing shelf`)
          .toBeTrue();
      }
    }

    // After deleting all shelves, no notebooks should remain
    const finalState = service.getState();
    expect(finalState.shelves.length).withContext('all shelves deleted').toBe(0);
    expect(finalState.notebooks.length).withContext('all notebooks cascade-deleted').toBe(0);
  });
});

/**
 * Property-Based Test: localStorage Persistence Round-Trip
 *
 * Property 5: localStorage Persistence Round-Trip (Round-Trip)
 * FOR ALL application states, calling `saveAll()` followed by `loadAll()` SHALL
 * produce a state object that is deeply equal to the original state (same shelves,
 * notebooks, sections, notes, themes, custom templates).
 *
 * Validates: Requirements 10.1, 10.2, 10.3
 */
describe('DataService — Property 5: localStorage Persistence Round-Trip', () => {
  let service: DataService;
  let localStorageStore: Record<string, string>;
  const TEST_USER = 'roundtrip_test_user';

  beforeEach(() => {
    localStorageStore = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) =>
      localStorageStore[key] ?? null
    );
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageStore[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
    service.setCurrentUser(TEST_USER);
  });

  /** Create a fresh DataService that reads from the same localStorageStore. */
  function createFreshService(): DataService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(DataService);
    fresh.setCurrentUser(TEST_USER);
    fresh.loadAll(TEST_USER);
    return fresh;
  }

  // ── 1. Basic round-trip ───────────────────────────────────────────────────

  it('should produce a deeply equal state after saveAll + loadAll (basic)', () => {
    const shelf = service.addShelf('My Shelf', '📚');
    const nb = service.addNotebook('My Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'My Section', 'subtitle', 'purple');
    service.addNote(nb.id, sec.id, 'My Note', 'research', { domain: 'science' });

    const originalState = service.getState();
    service.saveAll(TEST_USER);

    const freshService = createFreshService();
    const restoredState = freshService.getState();

    expect(JSON.stringify(restoredState)).toBe(JSON.stringify(originalState));
  });

  // ── 2. Round-trip with theme and fontSize ─────────────────────────────────

  it('should preserve theme and fontSize across saveAll + loadAll', () => {
    // Manually set theme and fontSize via state mutation
    const s = service.getState();
    service['state$'].next({ ...s, theme: 'dark', fontSize: 15 });
    service.saveAll(TEST_USER);

    const freshService = createFreshService();
    const restoredState = freshService.getState();

    expect(restoredState.theme).toBe('dark');
    expect(restoredState.fontSize).toBe(15);
    expect(JSON.stringify(restoredState)).toBe(JSON.stringify(service.getState()));
  });

  // ── 3. Round-trip with complex hierarchy ──────────────────────────────────

  it('should preserve a complex multi-shelf hierarchy across saveAll + loadAll', () => {
    const shelf1 = service.addShelf('Work', '💼');
    const shelf2 = service.addShelf('Personal', '🏠');

    const nb1 = service.addNotebook('Projects', '📋', shelf1.id);
    const nb2 = service.addNotebook('Research', '🔬', shelf1.id);
    const nb3 = service.addNotebook('Journal', '📔', shelf2.id);

    const sec1 = service.addSection(nb1.id, 'Sprint 1', 'Q1', 'blue');
    const sec2 = service.addSection(nb1.id, 'Sprint 2', 'Q2', 'teal');
    const sec3 = service.addSection(nb2.id, 'Papers', '', 'amber');
    const sec4 = service.addSection(nb3.id, 'Daily', '', 'coral');

    service.addNote(nb1.id, sec1.id, 'Task A', 'scrum', { sprint: '1', yesterday: ['done'] });
    service.addNote(nb1.id, sec1.id, 'Task B', 'scrum', { sprint: '1', today: ['wip'] });
    service.addNote(nb1.id, sec2.id, 'Task C', 'scrum', { sprint: '2' });
    service.addNote(nb2.id, sec3.id, 'Paper 1', 'research', { domain: 'ML', status: 'in-progress' });
    service.addNote(nb3.id, sec4.id, 'Entry 1', 'journal', { mood: 'happy', energy: 4 });

    const originalState = service.getState();
    service.saveAll(TEST_USER);

    const freshService = createFreshService();
    const restoredState = freshService.getState();

    expect(JSON.stringify(restoredState)).toBe(JSON.stringify(originalState));
    expect(restoredState.shelves.length).toBe(2);
    expect(restoredState.notebooks.length).toBe(3);
  });

  // ── 4. Round-trip with empty state ────────────────────────────────────────

  it('should preserve an empty state across saveAll + loadAll', () => {
    // State is empty by default — just save and reload
    const originalState = service.getState();
    service.saveAll(TEST_USER);

    const freshService = createFreshService();
    const restoredState = freshService.getState();

    expect(JSON.stringify(restoredState)).toBe(JSON.stringify(originalState));
    expect(restoredState.shelves.length).toBe(0);
    expect(restoredState.notebooks.length).toBe(0);
  });

  // ── 5. Property test: multiple random states each round-trip correctly ────

  it('should round-trip correctly across 30 randomly constructed states', () => {
    /**
     * **Validates: Requirements 10.1, 10.2, 10.3**
     *
     * For each iteration we build a fresh state, save it, reload it into a new
     * service instance, and assert deep equality via JSON.stringify.
     */
    const ITERATIONS = 30;
    const themes = ['default', 'light', 'dark', 'warm'];
    const fontSizes = [13, 14, 15];
    const colors = ['purple', 'teal', 'blue', 'amber', 'coral', 'green', 'pink', 'gray'];
    const templateIds = ['research', 'journal', 'finance', 'scrum', 'watchlist', 'investing'];

    for (let i = 0; i < ITERATIONS; i++) {
      // Reset to a clean state for each iteration
      localStorageStore = {};
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      service = TestBed.inject(DataService);
      service.setCurrentUser(TEST_USER);

      // Build a random-ish state
      const shelfCount = 1 + (i % 3); // 1–3 shelves
      const shelves = Array.from({ length: shelfCount }, (_, si) =>
        service.addShelf(`Shelf-${i}-${si}`, '📚')
      );

      for (const shelf of shelves) {
        const nbCount = 1 + (i % 2); // 1–2 notebooks per shelf
        for (let ni = 0; ni < nbCount; ni++) {
          const nb = service.addNotebook(`NB-${i}-${ni}`, '📓', shelf.id);
          const secCount = 1 + (ni % 2); // 1–2 sections per notebook
          for (let si2 = 0; si2 < secCount; si2++) {
            const color = colors[(i + si2) % colors.length];
            const sec = service.addSection(nb.id, `Sec-${i}-${si2}`, '', color);
            const noteCount = 1 + (si2 % 2); // 1–2 notes per section
            for (let nti = 0; nti < noteCount; nti++) {
              const templateId = templateIds[(i + nti) % templateIds.length];
              service.addNote(nb.id, sec.id, `Note-${i}-${nti}`, templateId, { tag: `iter-${i}` });
            }
          }
        }
      }

      // Apply a theme and fontSize variation
      const currentState = service.getState();
      const theme = themes[i % themes.length];
      const fontSize = fontSizes[i % fontSizes.length];
      service['state$'].next({ ...currentState, theme, fontSize });
      service.saveAll(TEST_USER);

      const originalState = service.getState();

      // Load into a fresh service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(DataService);
      freshService.setCurrentUser(TEST_USER);
      freshService.loadAll(TEST_USER);

      const restoredState = freshService.getState();

      expect(JSON.stringify(restoredState))
        .withContext(`iteration ${i}: round-trip state mismatch`)
        .toBe(JSON.stringify(originalState));
    }
  });
});

/**
 * Property-Based Test: Note Collapse Toggle Idempotence
 *
 * Property 8: Note Collapse Toggle Idempotence (Idempotence)
 * FOR ALL Note_Cards, toggling the collapsed state twice SHALL return the
 * Note_Card to its original `_collapsed` value.
 *
 * Pattern: toggle(toggle(state)) === state
 *
 * Validates: Requirements 3.7
 */
describe('DataService — Property 8: Note Collapse Toggle Idempotence', () => {
  let service: DataService;
  let localStorageStore: Record<string, string>;
  const TEST_USER = 'toggle_test_user';

  beforeEach(() => {
    localStorageStore = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) =>
      localStorageStore[key] ?? null
    );
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageStore[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
    service.setCurrentUser(TEST_USER);
  });

  /** Helper: find a note by id within the current state. */
  function findNote(notebookId: string, sectionId: string, noteId: string): import('../models').Note | undefined {
    const state = service.getState();
    const nb = state.notebooks.find(n => n.id === notebookId);
    if (!nb) return undefined;
    const sec = nb.sections.find(s => s.id === sectionId);
    if (!sec) return undefined;
    return sec.notes.find(n => n.id === noteId);
  }

  // ── 1. Toggle twice from initial state (false → true → false) ─────────────

  it('should return to original _collapsed=false after toggling twice from initial state', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Section', '', 'purple');
    const note = service.addNote(nb.id, sec.id, 'My Note', 'research', {});

    // Initial state: _collapsed is false
    expect(findNote(nb.id, sec.id, note.id)!._collapsed)
      .withContext('initial _collapsed should be false')
      .toBeFalse();

    // First toggle: false → true
    service.toggleNoteCollapse(nb.id, sec.id, note.id);
    expect(findNote(nb.id, sec.id, note.id)!._collapsed)
      .withContext('after first toggle _collapsed should be true')
      .toBeTrue();

    // Second toggle: true → false (back to original)
    service.toggleNoteCollapse(nb.id, sec.id, note.id);
    expect(findNote(nb.id, sec.id, note.id)!._collapsed)
      .withContext('after second toggle _collapsed should be false (original value)')
      .toBeFalse();
  });

  // ── 2. Toggle twice from collapsed state (true → false → true) ────────────

  it('should return to original _collapsed=true after toggling twice from collapsed state', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Section', '', 'teal');
    const note = service.addNote(nb.id, sec.id, 'Collapsed Note', 'journal', {});

    // Set _collapsed to true first via one toggle
    service.toggleNoteCollapse(nb.id, sec.id, note.id);
    expect(findNote(nb.id, sec.id, note.id)!._collapsed)
      .withContext('note should be collapsed before the double-toggle test')
      .toBeTrue();

    // First toggle: true → false
    service.toggleNoteCollapse(nb.id, sec.id, note.id);
    expect(findNote(nb.id, sec.id, note.id)!._collapsed)
      .withContext('after first toggle _collapsed should be false')
      .toBeFalse();

    // Second toggle: false → true (back to original collapsed state)
    service.toggleNoteCollapse(nb.id, sec.id, note.id);
    expect(findNote(nb.id, sec.id, note.id)!._collapsed)
      .withContext('after second toggle _collapsed should be true (original value)')
      .toBeTrue();
  });

  // ── 3. Property test: N notes with random initial _collapsed values ────────

  it('should restore original _collapsed value after toggling twice for N notes with random initial states', () => {
    /**
     * **Validates: Requirements 3.7**
     *
     * For each note with a randomly assigned initial _collapsed value,
     * toggle(toggle(_collapsed)) === _collapsed must hold.
     */
    const N = 50;
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Section', '', 'blue');

    // Create N notes, each with a random initial _collapsed value
    const noteIds: string[] = [];
    const initialCollapsedValues: boolean[] = [];

    for (let i = 0; i < N; i++) {
      const note = service.addNote(nb.id, sec.id, `Note-${i}`, 'research', {});
      noteIds.push(note.id);

      // Randomly set _collapsed to true for ~half the notes
      const shouldCollapse = Math.random() < 0.5;
      initialCollapsedValues.push(shouldCollapse);
      if (shouldCollapse) {
        service.toggleNoteCollapse(nb.id, sec.id, note.id);
      }
    }

    // Verify initial values were set correctly
    for (let i = 0; i < N; i++) {
      const current = findNote(nb.id, sec.id, noteIds[i])!._collapsed;
      expect(current)
        .withContext(`note ${i}: initial _collapsed should be ${initialCollapsedValues[i]}`)
        .toBe(initialCollapsedValues[i]);
    }

    // Toggle each note twice and verify it returns to its original value
    for (let i = 0; i < N; i++) {
      service.toggleNoteCollapse(nb.id, sec.id, noteIds[i]);
      service.toggleNoteCollapse(nb.id, sec.id, noteIds[i]);

      const afterDoubleToggle = findNote(nb.id, sec.id, noteIds[i])!._collapsed;
      expect(afterDoubleToggle)
        .withContext(`note ${i}: toggle(toggle(${initialCollapsedValues[i]})) should equal ${initialCollapsedValues[i]}`)
        .toBe(initialCollapsedValues[i]);
    }
  });

  // ── 4. Single toggle changes the value (not idempotent for single toggle) ──

  it('should change _collapsed value on a single toggle (single toggle is NOT idempotent)', () => {
    const shelf = service.addShelf('Shelf', '📚');
    const nb = service.addNotebook('Notebook', '📓', shelf.id);
    const sec = service.addSection(nb.id, 'Section', '', 'amber');
    const note = service.addNote(nb.id, sec.id, 'Note', 'research', {});

    const before = findNote(nb.id, sec.id, note.id)!._collapsed;

    service.toggleNoteCollapse(nb.id, sec.id, note.id);

    const after = findNote(nb.id, sec.id, note.id)!._collapsed;

    expect(after)
      .withContext('a single toggle must change the _collapsed value')
      .not.toBe(before);

    expect(after).toBe(!before);
  });
});
