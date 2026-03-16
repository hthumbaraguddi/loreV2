/**
 * ExportImportService — Property-Based Tests
 *
 * Property 2: Shelf Export/Import Round-Trip
 * Property 3: Notebook Export/Import Round-Trip
 * Property 4: Custom Template Export/Import Round-Trip
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 5.7, 5.8
 */

import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { ExportImportService } from './export-import.service';
import { DataService } from './data.service';
import { Shelf, Notebook, Section, Note, CustomTemplate, TemplateField } from '../models';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const arbId: fc.Arbitrary<string> = fc.ulid();

const arbNote: fc.Arbitrary<Note> = fc.record({
  id: arbId,
  title: fc.string({ minLength: 1, maxLength: 40 }),
  templateId: fc.constantFrom('research', 'finance', 'journal', 'scrum', 'watchlist', 'investing'),
  data: fc.record({ tag: fc.string() }),
  _collapsed: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  updatedAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
});

const arbSection: fc.Arbitrary<Section> = fc.record({
  id: arbId,
  title: fc.string({ minLength: 1, maxLength: 40 }),
  subtitle: fc.string({ maxLength: 40 }),
  color: fc.constantFrom('purple', 'teal', 'blue', 'amber', 'coral', 'green', 'pink', 'gray'),
  notes: fc.array(arbNote, { minLength: 0, maxLength: 3 }),
});

const arbNotebook: fc.Arbitrary<Notebook> = fc.record({
  id: arbId,
  name: fc.string({ minLength: 1, maxLength: 40 }),
  icon: fc.constantFrom('📓', '📔', '📒', '📕'),
  shelfId: arbId,
  sections: fc.array(arbSection, { minLength: 0, maxLength: 3 }),
});

const arbShelf: fc.Arbitrary<Shelf> = fc.record({
  id: arbId,
  name: fc.string({ minLength: 1, maxLength: 40 }),
  icon: fc.constantFrom('📚', '💼', '🏠', '🔬'),
  open: fc.boolean(),
});

const arbTemplateField: fc.Arbitrary<TemplateField> = fc.record({
  id: arbId,
  type: fc.constantFrom('text', 'textarea', 'date', 'select', 'rating', 'list', 'checklist'),
  label: fc.string({ minLength: 1, maxLength: 30 }),
  placeholder: fc.string({ maxLength: 40 }),
  required: fc.boolean(),
  options: fc.option(
    fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
    { nil: undefined }
  ),
});

const arbCustomTemplate: fc.Arbitrary<CustomTemplate> = fc.record({
  id: arbId,
  name: fc.string({ minLength: 1, maxLength: 40 }),
  icon: fc.constantFrom('📝', '🗒️', '📋', '🗂️'),
  color: fc.constantFrom('purple', 'teal', 'blue', 'amber'),
  fields: fc.array(arbTemplateField, { minLength: 1, maxLength: 5 }),
});

// ── Structural equivalence helpers ────────────────────────────────────────────

function notesEquivalent(a: Note, b: Note): boolean {
  return (
    a.title === b.title &&
    a.templateId === b.templateId &&
    JSON.stringify(a.data) === JSON.stringify(b.data) &&
    a._collapsed === b._collapsed &&
    a.createdAt === b.createdAt &&
    a.updatedAt === b.updatedAt
  );
}

function sectionsEquivalent(a: Section, b: Section): boolean {
  if (a.title !== b.title) return false;
  if (a.subtitle !== b.subtitle) return false;
  if (a.color !== b.color) return false;
  if (a.notes.length !== b.notes.length) return false;
  return a.notes.every((n, i) => notesEquivalent(n, b.notes[i]));
}

function notebooksEquivalent(a: Notebook, b: Notebook): boolean {
  if (a.name !== b.name) return false;
  if (a.icon !== b.icon) return false;
  if (a.sections.length !== b.sections.length) return false;
  return a.sections.every((s, i) => sectionsEquivalent(s, b.sections[i]));
}

// ── Property 2: Shelf Export/Import Round-Trip ────────────────────────────────

/**
 * Property 2: Shelf Export/Import Round-Trip
 *
 * FOR ALL Shelf objects with valid Notebooks, Sections, and Notes,
 * THE Export_Import_Service SHALL produce a JSON export such that importing
 * that JSON produces a Shelf with structurally equivalent content (same names,
 * template ids, and data fields), differing only in newly assigned ids.
 *
 * **Validates: Requirements 6.1, 6.3**
 */
describe('ExportImportService — Property 2: Shelf Export/Import Round-Trip', () => {
  let svc: ExportImportService;
  let data: DataService;
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = {};
    TestBed.configureTestingModule({});

    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageStore[key] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => { localStorageStore[key] = value; });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => { delete localStorageStore[key]; });

    data = TestBed.inject(DataService);
    data.setCurrentUser('test_user');
    svc = TestBed.inject(ExportImportService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('import(export(shelf)) produces structurally equivalent shelf differing only in ids', () => {
    /**
     * **Validates: Requirements 6.1, 6.3**
     */
    fc.assert(
      fc.property(
        arbShelf,
        fc.array(arbNotebook, { minLength: 0, maxLength: 3 }),
        (shelf: Shelf, notebooks: Notebook[]) => {
          // Reset state for each run
          localStorageStore = {};
          data['state$'].next({ shelves: [], notebooks: [], activeNotebookId: null, sidebarCollapsed: false, theme: 'default', fontSize: 14 });

          // Seed state with the shelf and its notebooks (fix shelfId references)
          const linkedNotebooks = notebooks.map(nb => ({ ...nb, shelfId: shelf.id }));
          data['state$'].next({ ...data.getState(), shelves: [shelf], notebooks: linkedNotebooks });

          // Build the export payload (mirrors what exportShelf produces)
          const exportPayload = {
            _type: 'shelf' as const,
            shelf,
            notebooks: linkedNotebooks.map(nb => ({ _type: 'notebook' as const, notebook: nb })),
          };

          // Import the payload
          const newShelfId = svc.importShelf(exportPayload);
          const newState = data.getState();

          // The new shelf should exist with a different id
          const importedShelf = newState.shelves.find(s => s.id === newShelfId);
          expect(importedShelf).withContext('imported shelf must exist').toBeDefined();
          expect(importedShelf!.id).withContext('shelf id must be reassigned').not.toBe(shelf.id);
          expect(importedShelf!.name).withContext('shelf name preserved').toBe(shelf.name);
          expect(importedShelf!.icon).withContext('shelf icon preserved').toBe(shelf.icon);

          // The imported notebooks should be structurally equivalent
          const importedNotebooks = newState.notebooks.filter(nb => nb.shelfId === newShelfId);
          expect(importedNotebooks.length).withContext('notebook count preserved').toBe(linkedNotebooks.length);

          for (let i = 0; i < linkedNotebooks.length; i++) {
            const orig = linkedNotebooks[i];
            const imported = importedNotebooks[i];
            expect(notebooksEquivalent(orig, imported)).withContext(`notebook[${i}] structurally equivalent`).toBeTrue();
            expect(imported.id).withContext(`notebook[${i}] id must be reassigned`).not.toBe(orig.id);
            expect(imported.shelfId).withContext(`notebook[${i}] shelfId must point to new shelf`).toBe(newShelfId);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('imported shelf has all new ids (no id collisions with original)', () => {
    const shelf: Shelf = { id: 'shelf-orig', name: 'My Shelf', icon: '📚', open: true };
    const section: Section = {
      id: 'sec-orig',
      title: 'Section 1',
      subtitle: '',
      color: 'purple',
      notes: [
        { id: 'note-orig', title: 'Note 1', templateId: 'research', data: {}, _collapsed: false, createdAt: 1000, updatedAt: 2000 },
      ],
    };
    const notebook: Notebook = { id: 'nb-orig', name: 'Notebook 1', icon: '📓', shelfId: shelf.id, sections: [section] };

    const state = data.getState();
    data['state$'].next({ ...state, shelves: [shelf], notebooks: [notebook] });

    const exportPayload = {
      _type: 'shelf' as const,
      shelf,
      notebooks: [{ _type: 'notebook' as const, notebook }],
    };

    const newShelfId = svc.importShelf(exportPayload);
    const newState = data.getState();

    const importedShelf = newState.shelves.find(s => s.id === newShelfId)!;
    const importedNb = newState.notebooks.find(nb => nb.shelfId === newShelfId)!;
    const importedSec = importedNb.sections[0];
    const importedNote = importedSec.notes[0];

    expect(importedShelf.id).not.toBe('shelf-orig');
    expect(importedNb.id).not.toBe('nb-orig');
    expect(importedSec.id).not.toBe('sec-orig');
    expect(importedNote.id).not.toBe('note-orig');

    // Content preserved
    expect(importedShelf.name).toBe('My Shelf');
    expect(importedNb.name).toBe('Notebook 1');
    expect(importedSec.title).toBe('Section 1');
    expect(importedNote.title).toBe('Note 1');
  });

  it('rejects malformed shelf JSON with error toast', () => {
    spyOn(data, 'showToast');

    expect(() => svc.importShelf({ _type: 'shelf', shelf: null, notebooks: [] })).toThrow();
    expect(data.showToast).toHaveBeenCalled();

    expect(() => svc.importShelf({ _type: 'notebook', notebook: {} })).toThrow();
    expect(() => svc.importShelf(null)).toThrow();
    expect(() => svc.importShelf('not an object')).toThrow();
  });
});

// ── Property 3: Notebook Export/Import Round-Trip ─────────────────────────────

/**
 * Property 3: Notebook Export/Import Round-Trip
 *
 * FOR ALL Notebook objects with valid Sections and Notes,
 * THE Export_Import_Service SHALL produce a JSON export such that importing
 * that JSON produces a Notebook with structurally equivalent content,
 * differing only in newly assigned ids.
 *
 * **Validates: Requirements 6.2, 6.4**
 */
describe('ExportImportService — Property 3: Notebook Export/Import Round-Trip', () => {
  let svc: ExportImportService;
  let data: DataService;
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = {};
    TestBed.configureTestingModule({});

    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageStore[key] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => { localStorageStore[key] = value; });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => { delete localStorageStore[key]; });

    data = TestBed.inject(DataService);
    data.setCurrentUser('test_user');
    svc = TestBed.inject(ExportImportService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('import(export(notebook)) produces structurally equivalent notebook differing only in ids', () => {
    /**
     * **Validates: Requirements 6.2, 6.4**
     */
    const targetShelfId = 'target-shelf-id';

    fc.assert(
      fc.property(
        arbNotebook,
        (notebook: Notebook) => {
          // Reset state for each run
          localStorageStore = {};
          data['state$'].next({ shelves: [], notebooks: [], activeNotebookId: null, sidebarCollapsed: false, theme: 'default', fontSize: 14 });

          // Seed a shelf so the target exists
          const shelf: Shelf = { id: targetShelfId, name: 'Target Shelf', icon: '📚', open: true };
          data['state$'].next({ ...data.getState(), shelves: [shelf], notebooks: [] });

          const exportPayload = { _type: 'notebook' as const, notebook };
          const newNbId = svc.importNotebook(exportPayload, targetShelfId);

          const newState = data.getState();
          const importedNb = newState.notebooks.find(nb => nb.id === newNbId);
          expect(importedNb).withContext('imported notebook must exist').toBeDefined();
          expect(importedNb!.id).withContext('notebook id must be reassigned').not.toBe(notebook.id);
          expect(importedNb!.shelfId).withContext('shelfId must be target').toBe(targetShelfId);
          expect(notebooksEquivalent(notebook, importedNb!)).withContext('notebook structurally equivalent').toBeTrue();

          // All section and note ids must differ
          for (let si = 0; si < notebook.sections.length; si++) {
            const origSec = notebook.sections[si];
            const impSec = importedNb!.sections[si];
            expect(impSec.id).withContext(`section[${si}] id must be reassigned`).not.toBe(origSec.id);
            for (let ni = 0; ni < origSec.notes.length; ni++) {
              expect(impSec.notes[ni].id).withContext(`note[${si}][${ni}] id must be reassigned`).not.toBe(origSec.notes[ni].id);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('rejects malformed notebook JSON with error toast', () => {
    spyOn(data, 'showToast');

    expect(() => svc.importNotebook({ _type: 'notebook', notebook: null }, 'shelf-1')).toThrow();
    expect(data.showToast).toHaveBeenCalled();

    expect(() => svc.importNotebook({ _type: 'shelf', shelf: {} }, 'shelf-1')).toThrow();
    expect(() => svc.importNotebook(null, 'shelf-1')).toThrow();
  });
});

// ── Property 4: Custom Template Export/Import Round-Trip ──────────────────────

/**
 * Property 4: Custom Template Export/Import Round-Trip
 *
 * FOR ALL Custom_Template objects, THE Export_Import_Service SHALL produce a
 * JSON export such that importing that JSON produces a Custom_Template with
 * identical `name`, `icon`, `color`, and `fields` arrays.
 *
 * **Validates: Requirements 5.7, 5.8**
 */
describe('ExportImportService — Property 4: Custom Template Export/Import Round-Trip', () => {
  let svc: ExportImportService;
  let data: DataService;
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = {};
    TestBed.configureTestingModule({});

    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageStore[key] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => { localStorageStore[key] = value; });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => { delete localStorageStore[key]; });

    data = TestBed.inject(DataService);
    data.setCurrentUser('test_user');
    svc = TestBed.inject(ExportImportService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('import(export(template)) produces template with identical name, icon, color, and fields', () => {
    /**
     * **Validates: Requirements 5.7, 5.8**
     */
    fc.assert(
      fc.property(arbCustomTemplate, (template: CustomTemplate) => {
        // Reset localStorage for each run
        localStorageStore = {};

        const exportPayload = { _type: 'template' as const, template };
        const returnedId = svc.importTemplate(exportPayload);

        // Verify the template was stored in localStorage
        const raw = localStorageStore['lore_custom_templates'];
        expect(raw).withContext('lore_custom_templates must be set in localStorage').toBeDefined();
        const stored: CustomTemplate[] = JSON.parse(raw);
        const importedTemplate = stored.find(t => t.id === returnedId);
        expect(importedTemplate).withContext('imported template must be findable by id').toBeDefined();

        // Exact equality for name, icon, color, fields
        expect(importedTemplate!.name).withContext('name preserved').toBe(template.name);
        expect(importedTemplate!.icon).withContext('icon preserved').toBe(template.icon);
        expect(importedTemplate!.color).withContext('color preserved').toBe(template.color);
        expect(JSON.stringify(importedTemplate!.fields)).withContext('fields preserved').toBe(JSON.stringify(template.fields));
      }),
      { numRuns: 100 }
    );
  });

  it('imported template id is preserved (same as original)', () => {
    const template: CustomTemplate = {
      id: 'my-template-id',
      name: 'My Template',
      icon: '📝',
      color: 'teal',
      fields: [
        { id: 'f1', type: 'text', label: 'Title', placeholder: 'Enter title', required: true },
      ],
    };

    const exportPayload = { _type: 'template' as const, template };
    const returnedId = svc.importTemplate(exportPayload);

    expect(returnedId).toBe('my-template-id');

    const raw = localStorageStore['lore_custom_templates'];
    const stored: CustomTemplate[] = JSON.parse(raw);
    expect(stored.find(t => t.id === 'my-template-id')).toBeDefined();
  });

  it('rejects malformed template JSON with error toast', () => {
    spyOn(data, 'showToast');

    // Missing fields array
    expect(() => svc.importTemplate({ _type: 'template', template: { id: 'x', name: 'x' } })).toThrow();
    expect(data.showToast).toHaveBeenCalled();

    // Wrong _type
    expect(() => svc.importTemplate({ _type: 'shelf', shelf: {} })).toThrow();

    // null
    expect(() => svc.importTemplate(null)).toThrow();

    // Missing id
    expect(() => svc.importTemplate({ _type: 'template', template: { name: 'no-id', fields: [] } })).toThrow();
  });
});
