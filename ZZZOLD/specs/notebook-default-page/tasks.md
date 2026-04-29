# Implementation Plan: Notebook Default Page

## Overview

Two focused code changes: modify `DataService.addNotebook()` to auto-create a default "Page" section (with a `skipDefaultSection` escape hatch for `seedDemoData()`), and update `AppComponent.onNotebookSaved()` to set the new notebook as active after creation. New unit and property-based tests are added to the existing `data.service.spec.ts` file.

## Tasks

- [x] 1. Modify `DataService.addNotebook()` to auto-create a default section
  - Add optional `skipDefaultSection?: boolean` parameter to the method signature
  - When `skipDefaultSection` is falsy (default), build a `Section` object with `title: 'Page'`, `subtitle: ''`, `color: 'purple'`, `notes: []`, and a fresh `uid()` id, and include it in `sections: [defaultSection]` when constructing the `Notebook`
  - When `skipDefaultSection` is `true`, keep `sections: []` (existing behavior)
  - The state update and `saveAll()` call remain a single atomic operation — no structural changes to the mutation pattern
  - Update the `seedDemoData()` call to `addNotebook(...)` to pass `skipDefaultSection: true`
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.1, 3.2_

  - [ ]* 1.1 Write property test: Property 1 — New Notebook Always Has a Default Section
    - **Property 1: New Notebook Always Has a Default Section**
    - For 100 random (name, icon, shelfId) combinations, assert `sections.length === 1`, `sections[0].title === 'Page'`, `sections[0].subtitle === ''`, `sections[0].color === 'purple'`, `sections[0].notes.length === 0`
    - **Validates: Requirements 1.1, 1.5**

  - [ ]* 1.2 Write property test: Property 2 — Default Section Has a Unique ID
    - **Property 2: Default Section Has a Unique ID**
    - Call `addNotebook()` 100 times; collect all default section `id` values and assert they form a set of 100 distinct non-empty strings
    - **Validates: Requirements 1.4**

  - [ ]* 1.3 Write property test: Property 3 — Notebook Creation Is Atomic
    - **Property 3: Notebook Creation Is Atomic — Section Present in State Immediately**
    - After each `addNotebook()` call, synchronously read `getState()` and assert the returned notebook is already present with its default section — no intermediate state without the section
    - **Validates: Requirements 1.2, 4.1**

  - [ ]* 1.4 Write unit test: `seedDemoData()` sections are unchanged
    - Call `seedDemoData()` and assert the demo notebook contains exactly the expected sections (Research, Journal, Finance, Standups, Watchlist, Investing) with no extra "Page" section
    - _Requirements: 3.1, 3.2_

  - [ ]* 1.5 Write unit test: `addNotebook()` calls `saveAll` exactly once
    - Spy on `saveAll`; call `addNotebook()` once; verify `saveAll` was called exactly once
    - _Requirements: 4.1_

- [x] 2. Modify `AppComponent.onNotebookSaved()` to activate the new notebook
  - In the `else` branch (new notebook, not edit), capture the `Notebook` returned by `addNotebook()` and immediately call `this.data.setActiveNotebook(notebook.id)`
  - The edit branch (`updateNotebook`) is unchanged
  - _Requirements: 1.3_

  - [ ]* 2.1 Write unit test: `onNotebookSaved()` sets active notebook after creation
    - Spy on `data.addNotebook` and `data.setActiveNotebook`; call `onNotebookSaved({ name, icon, shelfId })`; assert `setActiveNotebook` was called with the id returned by `addNotebook`
    - _Requirements: 1.3_

  - [ ]* 2.2 Write unit test: `onNotebookSaved()` does not set active notebook on edit
    - Set `editingNotebook` to an existing notebook; call `onNotebookSaved`; assert `setActiveNotebook` was NOT called
    - _Requirements: 2.2_

- [x] 3. Checkpoint — Ensure all tests pass
  - Run `ng test --watch=false` (or `npx karma start --single-run`) inside `lore-app/` and confirm all existing and new tests pass. Ask the user if any failures arise.

- [x] 4. Verify persistence and non-interference paths
  - [x] 4.1 Write property test: Property 4 — Persistence Round-Trip Preserves Default Section
    - **Property 4: Persistence Round-Trip Preserves Default Section**
    - For 100 iterations: call `addNotebook()`, then `saveAll()`, then reload into a fresh `DataService` via `loadAll()`; assert the restored notebook has a section with the same `id`, `title`, `subtitle`, `color`, and `notes` as the original
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 4.2 Write property test: Property 5 — `updateNotebook()` Does Not Modify Sections
    - **Property 5: `updateNotebook()` Does Not Modify Sections**
    - For 100 random new-name/icon pairs, call `updateNotebook()` on a notebook that already has its default section; assert `sections` array is identical (same ids, titles, subtitles, colors, notes) before and after
    - **Validates: Requirements 2.2**

  - [ ]* 4.3 Write property test: Property 6 — `loadAll()` Does Not Mutate Sections
    - **Property 6: `loadAll()` Does Not Mutate Sections**
    - Persist a state containing notebooks with N sections each; call `loadAll()` in a fresh service; assert each notebook still has exactly N sections
    - **Validates: Requirements 2.1**

  - [ ]* 4.4 Write unit test: `appendNotebook()` import path is unaffected
    - Call `appendNotebook()` with a pre-built notebook that has known sections; assert no "Page" section was added
    - _Requirements: 2.3_

- [x] 5. Final checkpoint — Ensure all tests pass
  - Run the full test suite one more time and confirm everything is green. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests follow the existing `describe` block pattern in `data.service.spec.ts` with a property header comment
- The `skipDefaultSection` flag is the only API surface change; all callers other than `seedDemoData()` use the default (omit the flag)
