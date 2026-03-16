# Implementation Plan: Lore Notes App

## Overview

Pixel-perfect Angular 17+ port of `Prototype/lore_v2.html`. All components are standalone, state lives in a single `BehaviorSubject<AppState>` in `DataService`, and everything persists to `localStorage`. No external UI libraries; all styles are pure SCSS ported from the prototype.

## Tasks

- [x] 1. Bootstrap Angular project and global infrastructure
  - Run `ng new lore-app --standalone --routing=false --style=scss`
  - Set `"baseHref": "/lore/"` in `angular.json` build options
  - Create `staticwebapp.config.json` at project root with navigation fallback to `index.html`
  - Port all CSS custom properties, theme rules, reset, and shared utility classes from the prototype into `src/styles.scss`
  - Extract the 698-icon SVG sprite from `Prototype/lore-icons-v2.html` and save as `src/assets/icons.svg`
  - _Requirements: 8.1, 8.6, 11.1, 11.2, 11.6, 11.7_

- [x] 2. Define core TypeScript interfaces and shared types
  - [x] 2.1 Create `src/app/models/index.ts` with interfaces: `Shelf`, `Notebook`, `Section`, `Note`, `SectionColor`, `SectionColorMap`, `CustomTemplate`, `TemplateField`, `AppState`, `UserRecord`
    - Include all fields from the requirements glossary
    - Define the eight `SectionColor` constant objects (`purple`, `teal`, `blue`, `amber`, `coral`, `green`, `pink`, `gray`) with `bg`, `text`, `border`, `dot` values matching the prototype exactly
    - _Requirements: 2.1, 12.1, 12.2_
  - [x] 2.2 Write property test for unique ID generation
    - **Property 10: Unique ID Generation**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 3. Implement `AuthService`
  - [x] 3.1 Create `src/app/services/auth.service.ts`
    - Implement `register(name, username, password)`: validate fields (name/username/password non-empty, username ≥ 3 chars, password ≥ 6 chars, username unique), store `{ username, password: btoa(plain), name, data: {} }` in `lore_users`, auto sign-in on success
    - Implement `login(username, password)`: look up user, verify `btoa(password)` match, restore user data, set `lore_cu`
    - Implement `logout()`: clear session, persist `lore_cu` as empty string
    - Expose `isLoggedIn$: BehaviorSubject<boolean>` and `currentUser$`
    - Return typed error strings matching requirements exactly ("Fill all fields", "Username: min 3 chars", etc.)
    - _Requirements: 1.1–1.11_
  - [x] 3.2 Write unit tests for `AuthService` validation rules
    - Test each error message path (empty fields, short username, short password, duplicate username, wrong password, unknown username)
    - _Requirements: 1.2–1.9_

- [x] 4. Implement `DataService`
  - [x] 4.1 Create `src/app/services/data.service.ts` with `BehaviorSubject<AppState>` state
    - Implement `uid()` generating unique IDs
    - Implement `loadAll()`: read `lore_users` from `localStorage`, restore state for current user; handle missing/quota errors with error toast
    - Implement `saveAll()`: serialise full `AppState` into `S.users[username].data` under `lore_users`; catch quota errors
    - _Requirements: 10.1–10.4_
  - [x] 4.2 Implement hierarchy mutation methods
    - `addShelf`, `updateShelf`, `deleteShelf` (cascade delete notebooks → sections → notes)
    - `addNotebook`, `updateNotebook`, `deleteNotebook` (cascade delete sections → notes)
    - `addSection`, `updateSection`, `deleteSection` (cascade delete notes)
    - `addNote`, `updateNote`, `deleteNote`
    - `toggleNoteCollapse(noteId)`, `toggleSidebar()`, `setActiveNotebook(id)`
    - Each method calls `saveAll()` after mutation
    - _Requirements: 2.1–2.10, 10.1_
  - [x] 4.3 Write property test for hierarchy referential integrity
    - **Property 1: Hierarchy Referential Integrity**
    - **Validates: Requirements 2.1, 2.5, 2.6, 2.7**
  - [x] 4.4 Write property test for cascade delete completeness
    - **Property 9: Cascade Delete Completeness**
    - **Validates: Requirements 2.5, 2.6, 2.7**
  - [x] 4.5 Write property test for localStorage persistence round-trip
    - **Property 5: localStorage Persistence Round-Trip**
    - **Validates: Requirements 10.1, 10.2, 10.3**
  - [x] 4.6 Write property test for note collapse toggle idempotence
    - **Property 8: Note Collapse Toggle Idempotence**
    - **Validates: Requirements 3.7**

- [x] 5. Checkpoint — Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `TemplateService` — built-in templates
  - [x] 6.1 Create `src/app/services/template.service.ts` with `TemplateDefinition` interface (`id`, `name`, `icon`, `color`, `buildForm(data?)`, `readForm()`, `renderCard(note, color, highlightFn)`)
  - [x] 6.2 Implement the Research Notes template (`id: 'research'`)
    - Fields: `domain`, `status`, `hypothesis`, `methodology`, `findings[]`, `references[{text,url}]`, `conclusion`, `tags[]`
    - `buildForm` returns HTML string matching prototype form layout
    - `renderCard` returns HTML string matching prototype card layout with `rs-*` CSS classes
    - _Requirements: 4.1_
  - [x] 6.3 Implement the Financial Log template (`id: 'finance'`)
    - Fields: `period`, `periodType`, `insight`, `income[{label,amount}]`, `expenses[{label,amount}]`, `savingsGoal`, `tags[]`
    - `renderCard` computes `net = sum(income) − sum(expenses)`, applies `fin-net-pos` / `fin-net-neg` / `fin-net-zero` class
    - _Requirements: 4.2, 4.7, 4.8_
  - [x] 6.4 Write property test for Financial Log net calculation
    - **Property 7: Financial Log Net Calculation**
    - **Validates: Requirements 4.7, 4.8**
  - [x] 6.5 Implement the What to Watch template (`id: 'watchlist'`)
    - Fields: `weekend`, `mood`, `items[{title,type,platform,rating,watched}]`, `pick`, `notes`, `tags[]`
    - `renderCard` applies `seen` class to items where `watched: true`
    - _Requirements: 4.3, 4.9_
  - [x] 6.6 Implement the Daily Journal template (`id: 'journal'`)
    - Fields: `date`, `mood`, `energy` (1–5), `intention`, `gratitude[]` (3 slots), `wins`, `challenges`, `tomorrowFocus`, `tags[]`
    - `renderCard` renders filled/empty pip indicators for energy value
    - _Requirements: 4.4, 4.10_
  - [x] 6.7 Implement the Scrum Standup template (`id: 'scrum'`)
    - Fields: `sprint`, `date`, `attendees`, `sprintGoal`, `yesterday[]`, `today[]`, `blockers[]`, `actionItems[{task,owner}]`, `tags[]`
    - `renderCard` shows "✓ No blockers" when `blockers` array is empty
    - _Requirements: 4.5, 4.11_
  - [x] 6.8 Implement the Investment Notes template (`id: 'investing'`)
    - Fields: `weekOf`, `sentiment`, `watchlist[{ticker,price,dir,thesis}]`, `trades[{ticker,action,price,qty,notes}]`, `catalysts[]`, `portfolioNotes`, `nextWeekFocus`, `tags[]`
    - `renderCard` applies `tk-up` / `tk-down` / `tk-flat` classes based on `dir` value
    - _Requirements: 4.6, 4.12_
  - [x] 6.9 Implement custom template support in `TemplateService`
    - `getCustomTemplates()`: load from `localStorage`
    - `saveCustomTemplate(t)`, `deleteCustomTemplate(id)`: persist to `localStorage`
    - `buildFormForCustom(template, data?)` and `renderCardForCustom(template, note, color, highlightFn)` covering all field types: `text`, `textarea`, `date`, `select`, `rating`, `list`, `checklist`
    - Fallback renderer for notes whose template has been deleted
    - _Requirements: 5.1–5.4_

- [x] 7. Implement `ExportImportService`
  - [x] 7.1 Create `src/app/services/export-import.service.ts`
    - `exportShelf(shelf)`: serialise shelf + all notebooks/sections/notes → trigger browser download with filename `shelf-{name}-{date}.json`
    - `exportNotebook(notebook)`: serialise notebook + sections/notes → download `notebook-{name}-{date}.json`
    - `exportTemplate(template)`: serialise custom template → download `template-{name}-{date}.json`
    - _Requirements: 6.1, 6.2, 6.6, 5.7_
  - [x] 7.2 Implement import methods
    - `importShelf(json)`: validate structure, reassign all ids, append to shelves array
    - `importNotebook(json, targetShelfId)`: validate, reassign ids, append to target shelf
    - `importTemplate(json)`: validate required fields (`id`, `name`, `fields`), add to `localStorage`
    - Display error toast and reject on malformed input
    - _Requirements: 6.3, 6.4, 6.5, 5.8, 5.9_
  - [x] 7.3 Write property test for Shelf export/import round-trip
    - **Property 2: Shelf Export/Import Round-Trip**
    - **Validates: Requirements 6.1, 6.3**
  - [x] 7.4 Write property test for Notebook export/import round-trip
    - **Property 3: Notebook Export/Import Round-Trip**
    - **Validates: Requirements 6.2, 6.4**
  - [x] 7.5 Write property test for Custom Template export/import round-trip
    - **Property 4: Custom Template Export/Import Round-Trip**
    - **Validates: Requirements 5.7, 5.8**

- [x] 8. Checkpoint — Ensure all service and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement `LoreIconComponent` and `LoginComponent`
  - [x] 9.1 Create `src/app/components/lore-icon/lore-icon.component.ts`
    - Inputs: `name: string`, `size?: number`
    - Template: `<svg><use [attr.href]="'/lore/assets/icons.svg#' + name"></use></svg>`
    - _Requirements: 8.6_
  - [x] 9.2 Create `src/app/components/login/login.component.ts`
    - Full-screen overlay matching prototype `#loginScreen` HTML/CSS exactly
    - Sign-in / register tab toggle
    - Calls `AuthService.login()` / `AuthService.register()`, displays returned error strings
    - _Requirements: 1.1–1.11_

- [x] 10. Implement `AppComponent` root shell
  - Read `lore_cu` on init; show `LoginComponent` or app shell accordingly
  - Apply saved theme (`data-theme` on `<html>`) and font size (`--fs`) before first render
  - Register global `window` helper functions: `addRow`, `addLinkRow`, `addAmtRow`, `addWatchRow`, `addActionRow`, `addTickerRow`, `addTradeRow`, `addChecklistRow`
  - Subscribe to `AuthService.isLoggedIn$` to toggle views
  - _Requirements: 8.5, 11.1, 11.4_

- [x] 11. Implement `SidebarComponent`
  - Render shelf/notebook hierarchy from `AppState` using `*ngFor`
  - Collapsible shelf groups (toggle `open` flag via `DataService.toggleShelf()`)
  - Active notebook highlight using `nb-itm.active` class
  - Sidebar collapse/expand toggle button (`.btn-tsb`)
  - Emit all events: `notebookSelected`, `addShelf`, `addNotebook`, `editShelf`, `editNotebook`, `openSettings`, `openTemplates`, `openTemplateBuilder`, `openImportTemplate`
  - Sidebar footer: user avatar, display name, settings cog button
  - _Requirements: 2.8, 2.9, 9.1, 11.4_

- [x] 12. Implement `TopbarComponent`
  - Breadcrumb showing active shelf name and notebook name
  - Search input with 300ms debounce emitting `searchChanged`
  - "+ Section" and "+ Note" buttons emitting `addSection` / `addNote`
  - _Requirements: 2.10, 7.1–7.6, 11.4_

- [x] 13. Implement `NoteCardComponent`
  - Card header: section badge (with `SectionColor` styles), title, template pill, edit/delete buttons, chevron
  - Card body rendered via `[innerHTML]` bound to `template.renderCard(note, color, highlightFn)`; use `DomSanitizer.bypassSecurityTrustHtml`
  - Collapsed/expanded toggle calling `DataService.toggleNoteCollapse(noteId)`
  - `highlightFn` wraps query matches in `<mark class="hl">`
  - Emit `edit` and `delete` outputs
  - _Requirements: 3.6, 3.7, 3.8, 7.5, 12.3_

- [x] 14. Implement `ContentAreaComponent`
  - Notebook progress bar (`.nb-prog`) with per-section colour segments
  - Section dividers with title, subtitle, colour dot, edit/delete/add-note buttons
  - Render `NoteCardComponent` for each note, passing `searchQuery`
  - Search results banner (`.sbanner`) showing match count and "Clear" button
  - Empty states for no notebook selected and no notes found
  - _Requirements: 7.1–7.6, 12.3, 11.4_
  - [x] 14.1 Write property test for search result subset
    - **Property 6: Search Result Subset**
    - **Validates: Requirements 7.2, 7.6**

- [x] 15. Implement `EditPanelComponent`
  - Slide-in panel (`transform: translateX(100%)` → `translateX(0)` on `.open`)
  - Template picker chips from `TemplateService.getTemplates()`; selected chip gets `.sel` class
  - Form body rendered via `[innerHTML]` bound to `template.buildForm(note?.data)`
  - On save: call `template.readForm()`, emit `saved` with note payload; `DataService` sets `createdAt`/`updatedAt`
  - Delete button emits `deleted`; close button emits `closed`
  - Pre-populate form fields when editing an existing note
  - _Requirements: 3.1–3.5, 3.9_

- [x] 16. Implement modal components
  - [x] 16.1 `ShelfModalComponent`: name input, emoji icon picker, create/edit/delete actions
    - _Requirements: 2.2, 2.5_
  - [x] 16.2 `NotebookModalComponent`: name input, emoji icon picker, shelf selector, create/edit/delete actions
    - _Requirements: 2.3, 2.6_
  - [x] 16.3 `SectionModalComponent`: title, subtitle inputs, eight-colour swatch picker, create/edit/delete actions
    - _Requirements: 2.4, 2.7, 12.4_
  - [x] 16.4 `TemplateBrowserModalComponent`: grid of all built-in and custom template chips
    - _Requirements: 3.1_
  - [x] 16.5 `TemplateBuilderModalComponent`: name, icon, color inputs; dynamic field list with add/remove/reorder (drag-and-drop); `select` field option input; save/cancel actions
    - _Requirements: 5.1–5.6_

- [x] 17. Implement `SettingsPanelComponent`
  - Slide-in panel matching prototype `#spanel` layout
  - Profile section: display name input calling `DataService` on change
  - Appearance section: 2×2 theme grid (default/light/dark/warm) and font-size selector (13/14/15px)
  - Custom templates list with edit, delete (with confirmation), and export actions
  - About section
  - Sign out button calling `AuthService.logout()`
  - _Requirements: 8.1–8.5, 9.1–9.5_

- [x] 18. Wire `AppComponent` — connect all components and services
  - Declare all standalone components in `AppComponent` imports array
  - Bind `DataService.state$` via `async` pipe; pass slices to child components as inputs
  - Handle all child component output events: open/close modals, call `DataService` mutations, call `ExportImportService`
  - Implement theme and font-size change handlers (update `<html>` attributes, call `DataService.saveAll()`)
  - Implement import file-picker trigger and pass file to `ExportImportService`
  - _Requirements: 8.2, 8.4, 10.1, 11.3, 11.4_

- [x] 19. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
`