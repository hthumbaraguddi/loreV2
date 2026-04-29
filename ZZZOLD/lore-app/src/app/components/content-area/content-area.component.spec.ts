/**
 * Property-Based Test: Search Result Subset
 *
 * Property 6: Search Result Subset (Metamorphic)
 * FOR ALL search queries Q applied to a Notebook with N notes, the set of
 * matching notes returned SHALL be a subset of all N notes; a more specific
 * query Q' (where Q is a prefix of Q') SHALL return a result set that is a
 * subset of the result set for Q.
 *
 * Pattern: Metamorphic — results(Q') ⊆ results(Q) when Q is a prefix of Q'.
 *
 * **Validates: Requirements 7.2, 7.6**
 */

import * as fc from 'fast-check';
import { noteMatchesQuery, filterNotes } from './content-area.component';
import { Note, Notebook, Section } from '../../models';

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Generate a printable ASCII string (avoids control chars that complicate matching). */
const printableString = fc.string({ minLength: 0, maxLength: 30 }).filter(s => !/[\x00-\x1f]/.test(s));

/** Generate a non-empty printable string. */
const nonEmptyPrintable = printableString.filter(s => s.length > 0);

/** Generate a Note with a title and simple string data values. */
const noteArb: fc.Arbitrary<Note> = fc.record({
  id: fc.uuid(),
  title: printableString,
  templateId: fc.constantFrom('research', 'journal', 'finance', 'scrum'),
  data: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
    printableString
  ),
  _collapsed: fc.boolean(),
  createdAt: fc.integer({ min: 0 }),
  updatedAt: fc.integer({ min: 0 }),
});

/** Generate a Section with 0–5 notes. */
const sectionArb: fc.Arbitrary<Section> = fc.record({
  id: fc.uuid(),
  title: printableString,
  subtitle: printableString,
  color: fc.constantFrom('purple', 'teal', 'blue', 'amber', 'coral', 'green', 'pink', 'gray'),
  notes: fc.array(noteArb, { minLength: 0, maxLength: 5 }),
});

/** Generate a Notebook with 1–3 sections. */
const notebookArb: fc.Arbitrary<Notebook> = fc.record({
  id: fc.uuid(),
  name: printableString,
  icon: fc.constant('📓'),
  shelfId: fc.uuid(),
  sections: fc.array(sectionArb, { minLength: 1, maxLength: 3 }),
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ContentAreaComponent — Property 6: Search Result Subset', () => {

  // ── 1. Results are always a subset of all notes ───────────────────────────

  it('filterNotes(Q) ⊆ all notes in notebook for any query Q', () => {
    fc.assert(
      fc.property(notebookArb, nonEmptyPrintable, (notebook, query) => {
        const allNotes = notebook.sections.flatMap(s => s.notes);
        const allNoteIds = new Set(allNotes.map(n => n.id));

        const results = filterNotes(notebook, query);

        for (const note of results) {
          expect(allNoteIds.has(note.id))
            .withContext(`result note id=${note.id} must be in the notebook`)
            .toBeTrue();
        }
      }),
      { numRuns: 200 }
    );
  });

  // ── 2. Monotonicity: results(Q') ⊆ results(Q) when Q is a prefix of Q' ───

  it('results(Q + suffix) ⊆ results(Q) for any non-empty suffix', () => {
    /**
     * **Validates: Requirements 7.2, 7.6**
     *
     * For any query Q and any non-empty suffix S, the results for Q+S must be
     * a subset of the results for Q. This is the core metamorphic property:
     * making a query more specific can only reduce (never increase) the result set.
     */
    let checked = 0;
    fc.assert(
      fc.property(
        notebookArb,
        nonEmptyPrintable,
        nonEmptyPrintable,
        (notebook, baseQuery, suffix) => {
          const extendedQuery = baseQuery + suffix;

          const baseResults = filterNotes(notebook, baseQuery);
          const extendedResults = filterNotes(notebook, extendedQuery);

          const baseIds = new Set(baseResults.map(n => n.id));

          // Extended results must be a subset of base results
          for (const note of extendedResults) {
            expect(baseIds.has(note.id))
              .withContext(
                `note "${note.title}" matched extended query "${extendedQuery}" ` +
                `but not base query "${baseQuery}" — violates subset property`
              )
              .toBeTrue();
          }

          // Extended result count must be ≤ base result count
          expect(extendedResults.length)
            .withContext(`|results("${extendedQuery}")| must be ≤ |results("${baseQuery}")|`)
            .toBeLessThanOrEqual(baseResults.length);

          checked++;
        }
      ),
      { numRuns: 300 }
    );
    expect(checked).toBe(300);
  });

  // ── 3. Empty query returns all notes ─────────────────────────────────────

  it('filterNotes with empty query returns all notes', () => {
    fc.assert(
      fc.property(notebookArb, (notebook) => {
        const allNotes = notebook.sections.flatMap(s => s.notes);
        const results = filterNotes(notebook, '');
        expect(results.length).toBe(allNotes.length);
      }),
      { numRuns: 100 }
    );
  });

  // ── 4. noteMatchesQuery is case-insensitive ───────────────────────────────

  it('noteMatchesQuery matches regardless of case', () => {
    fc.assert(
      fc.property(noteArb, nonEmptyPrintable, (note, query) => {
        const lowerResult = noteMatchesQuery(note, query.toLowerCase());
        const upperResult = noteMatchesQuery(note, query.toUpperCase());
        expect(lowerResult).toBe(upperResult);
      }),
      { numRuns: 200 }
    );
  });

  // ── 5. A note always matches a query that is a substring of its title ─────

  it('a note always matches a query that is a substring of its title', () => {
    fc.assert(
      fc.property(noteArb, (note) => {
        if (!note.title) return; // skip empty titles
        // Take a substring of the title as the query
        const start = 0;
        const end = Math.max(1, Math.floor(note.title.length / 2));
        const subQuery = note.title.slice(start, end);
        if (!subQuery) return;
        expect(noteMatchesQuery(note, subQuery)).toBeTrue();
      }),
      { numRuns: 200 }
    );
  });

  // ── 6. Result count is monotonically non-increasing as query grows ────────

  it('result count is non-increasing as query is extended character by character', () => {
    fc.assert(
      fc.property(notebookArb, nonEmptyPrintable, (notebook, query) => {
        let prevCount = filterNotes(notebook, '').length;

        for (let i = 1; i <= query.length; i++) {
          const partial = query.slice(0, i);
          const count = filterNotes(notebook, partial).length;
          expect(count)
            .withContext(
              `count for "${partial}" (${count}) should be ≤ count for "${query.slice(0, i - 1)}" (${prevCount})`
            )
            .toBeLessThanOrEqual(prevCount);
          prevCount = count;
        }
      }),
      { numRuns: 200 }
    );
  });
});
