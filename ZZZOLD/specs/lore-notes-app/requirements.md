# Requirements Document

## Introduction

Lore is a personal knowledge-management and note-taking application built in Angular 17+. It is a pixel-perfect port of the working HTML prototype located at `Prototype/lore_v2.html`. The application organises notes in a four-level hierarchy (Shelf → Notebook → Section → Note), supports six built-in structured note templates, a custom template builder, full import/export, four visual themes, and local authentication — all persisted in `localStorage` for Phase 1. The app is deployed as a static site on Azure Static Web Apps at zero hosting cost.

---

## Glossary

- **App**: The Lore Angular single-page application.
- **Auth_Service**: The Angular service responsible for local username/password authentication.
- **Data_Service**: The Angular service that owns all application state and persists it to `localStorage`.
- **Export_Import_Service**: The Angular service that serialises and deserialises shelves, notebooks, and templates to/from JSON files.
- **Template_Service**: The Angular service that manages built-in and custom template definitions.
- **Shelf**: A top-level grouping container with `{ id, name, icon, open }`.
- **Notebook**: A second-level container belonging to one Shelf, with `{ id, name, icon, shelfId, sections[] }`.
- **Section**: A third-level grouping within a Notebook, with `{ id, title, subtitle, color, notes[] }`.
- **Note**: A leaf record within a Section, with `{ id, title, templateId, data: {}, _collapsed, createdAt, updatedAt }`.
- **Built-in_Template**: One of the six predefined note templates shipped with the App.
- **Custom_Template**: A user-defined template stored in `localStorage`, with `{ id, name, icon, color, fields[] }`.
- **Template_Field**: A single field definition within a Custom_Template, with `{ id, type, label, placeholder, required, options? }`.
- **Section_Color**: One of eight named colour schemes (purple, teal, blue, amber, coral, green, pink, gray), each providing `{ bg, text, border, dot }` values.
- **Theme**: One of four visual themes (default, light, dark, warm) applied via CSS custom properties on the `<html>` element's `data-theme` attribute.
- **Edit_Panel**: The slide-in right-side panel used to create or edit a Note.
- **Settings_Panel**: The slide-in right-side panel for application preferences and profile management.
- **Sidebar**: The left navigation panel displaying the Shelf/Notebook hierarchy.
- **Topbar**: The horizontal bar at the top of the main content area showing breadcrumb, search, and action buttons.
- **SVG_Icon_System**: The inline SVG icon library sourced from `Prototype/lore-icons-v2.html` (698 icons).

---

## Requirements

### Requirement 1: Local Authentication

**User Story:** As a user, I want to register and sign in with a local username and password, so that my notes are private and tied to my account on this device.

#### Acceptance Criteria

1. THE Auth_Service SHALL store user credentials as `{ username, password: btoa(plaintext), name, data: {} }` in `localStorage` under the key `lore_users`.
2. WHEN a user submits the registration form with a unique username (≥ 3 characters) and password (≥ 6 characters), THE Auth_Service SHALL create the account and immediately sign the user in.
3. IF a registration username is already taken, THEN THE Auth_Service SHALL display the error message "Username taken" without creating an account.
4. IF a registration form field (name, username, or password) is empty, THEN THE Auth_Service SHALL display the error message "Fill all fields".
5. IF a username is fewer than 3 characters, THEN THE Auth_Service SHALL display the error message "Username: min 3 chars".
6. IF a password is fewer than 6 characters, THEN THE Auth_Service SHALL display the error message "Password: min 6 chars".
7. WHEN a user submits the sign-in form with a valid username and matching password, THE Auth_Service SHALL restore the user's saved data and display the main App.
8. IF a sign-in username does not exist, THEN THE Auth_Service SHALL display the error message "Username not found".
9. IF a sign-in password does not match the stored credential, THEN THE Auth_Service SHALL display the error message "Wrong password".
10. WHEN a user clicks "Sign out", THE Auth_Service SHALL clear the current session, persist the `lore_cu` key as an empty string in `localStorage`, and return the user to the login screen.
11. THE App SHALL persist the last signed-in username in `localStorage` under the key `lore_cu` so that the session can be restored on page reload.

---

### Requirement 2: Four-Level Hierarchy Management

**User Story:** As a user, I want to organise my notes into Shelves, Notebooks, Sections, and Notes, so that I can keep different areas of my life cleanly separated.

#### Acceptance Criteria

1. THE Data_Service SHALL enforce the invariant that every Notebook references a valid Shelf id, every Section belongs to exactly one Notebook, and every Note belongs to exactly one Section.
2. WHEN a user creates a Shelf with a name and icon, THE Data_Service SHALL assign a unique id and add the Shelf to the shelves array.
3. WHEN a user creates a Notebook with a name, icon, and target Shelf, THE Data_Service SHALL assign a unique id and add the Notebook to the notebooks array with the correct `shelfId`.
4. WHEN a user creates a Section with a title, optional subtitle, and one of the eight Section_Colors, THE Data_Service SHALL assign a unique id and append the Section to the active Notebook's `sections` array.
5. WHEN a user deletes a Shelf, THE Data_Service SHALL also delete all Notebooks belonging to that Shelf and all Sections and Notes within those Notebooks.
6. WHEN a user deletes a Notebook, THE Data_Service SHALL also delete all Sections and Notes within that Notebook.
7. WHEN a user deletes a Section, THE Data_Service SHALL also delete all Notes within that Section.
8. THE Sidebar SHALL display Shelves as collapsible groups; WHEN a Shelf is collapsed, THE Sidebar SHALL hide all Notebooks belonging to that Shelf.
9. WHEN a user clicks a Notebook in the Sidebar, THE App SHALL set that Notebook as the active Notebook and display its Sections and Notes in the main content area.
10. THE Topbar SHALL display a breadcrumb showing the active Shelf name and active Notebook name.

---

### Requirement 3: Note Creation and Editing

**User Story:** As a user, I want to create and edit notes using structured templates, so that each note captures exactly the right information for its purpose.

#### Acceptance Criteria

1. WHEN a user opens the Edit_Panel for a new Note, THE Edit_Panel SHALL display a template picker showing all Built-in_Templates and Custom_Templates.
2. WHEN a user selects a template in the Edit_Panel, THE Edit_Panel SHALL render the form fields defined by that template.
3. WHEN a user saves a Note, THE Data_Service SHALL store the note's `data` object as returned by the active template's `readForm()` function, set `updatedAt` to the current timestamp, and persist to `localStorage`.
4. WHEN a user opens the Edit_Panel for an existing Note, THE Edit_Panel SHALL pre-populate all form fields with the Note's saved `data`.
5. WHEN a user deletes a Note from the Edit_Panel, THE Data_Service SHALL remove the Note from its parent Section's `notes` array and persist to `localStorage`.
6. THE Note_Card SHALL display the Note's rendered view using the template's `renderCard()` output, styled with the parent Section's Section_Color.
7. WHEN a user clicks the Note_Card header, THE Note_Card SHALL toggle between collapsed (header only) and expanded (header + body) states.
8. THE Note_Card SHALL display the template name and icon as a pill badge in the card header.
9. WHEN a Note is created, THE Data_Service SHALL set `createdAt` to the current Unix timestamp in milliseconds.

---

### Requirement 4: Six Built-in Templates

**User Story:** As a user, I want six purpose-built note templates, so that I can capture research, finances, watchlists, journal entries, standups, and investment notes with the right structure.

#### Acceptance Criteria

1. THE Template_Service SHALL provide a Research Notes template (id: `research`) with fields: `domain`, `status` (in-progress/completed/on-hold), `hypothesis`, `methodology`, `findings[]`, `references[{text, url}]`, `conclusion`, `tags[]`.
2. THE Template_Service SHALL provide a Financial Log template (id: `finance`) with fields: `period`, `periodType` (Monthly/Weekly/Quarterly/Annual), `insight`, `income[{label, amount}]`, `expenses[{label, amount}]`, `savingsGoal`, `tags[]`.
3. THE Template_Service SHALL provide a What to Watch template (id: `watchlist`) with fields: `weekend`, `mood`, `items[{title, type, platform, rating, watched}]`, `pick`, `notes`, `tags[]`.
4. THE Template_Service SHALL provide a Daily Journal template (id: `journal`) with fields: `date`, `mood`, `energy` (1–5), `intention`, `gratitude[]` (exactly 3 slots), `wins`, `challenges`, `tomorrowFocus`, `tags[]`.
5. THE Template_Service SHALL provide a Scrum Standup template (id: `scrum`) with fields: `sprint`, `date`, `attendees`, `sprintGoal`, `yesterday[]`, `today[]`, `blockers[]`, `actionItems[{task, owner}]`, `tags[]`.
6. THE Template_Service SHALL provide an Investment Notes template (id: `investing`) with fields: `weekOf`, `sentiment` (bull/bear/neut/vol), `watchlist[{ticker, price, dir, thesis}]`, `trades[{ticker, action, price, qty, notes}]`, `catalysts[]`, `portfolioNotes`, `nextWeekFocus`, `tags[]`.
7. WHEN a Financial Log note contains income and expense entries, THE Note_Card SHALL compute and display the net surplus or deficit as `totalIncome − totalExpenses`.
8. WHEN a Financial Log note has a net surplus, THE Note_Card SHALL render the net value with the `fin-net-pos` style; WHEN it has a deficit, THE Note_Card SHALL render it with the `fin-net-neg` style.
9. WHEN a What to Watch note item has `watched: true`, THE Note_Card SHALL render that item with the `seen` CSS class (strikethrough title, reduced opacity).
10. WHEN a Daily Journal note has an `energy` value between 1 and 5, THE Note_Card SHALL render that many filled pip indicators and the remainder as empty pips.
11. WHEN a Scrum Standup note has no blockers, THE Note_Card SHALL display "✓ No blockers" in the blockers column.
12. WHEN an Investment Notes watchlist entry has `dir: 'up'`, THE Note_Card SHALL apply the `tk-up` style; WHEN `dir: 'down'`, the `tk-down` style; WHEN `dir: 'flat'`, the `tk-flat` style.

---

### Requirement 5: Custom Template Builder

**User Story:** As a user, I want to build my own note templates with custom fields, so that I can capture information that the built-in templates don't cover.

#### Acceptance Criteria

1. THE Template_Service SHALL support Custom_Templates with the following field types: `text`, `textarea`, `date`, `select`, `rating`, `list`, `checklist`.
2. WHEN a user creates a Custom_Template with a name, icon, color, and at least one field, THE Template_Service SHALL assign a unique id and persist the template to `localStorage`.
3. WHEN a user edits an existing Custom_Template, THE Template_Service SHALL update the stored definition and re-render any open Note_Cards using that template.
4. WHEN a user deletes a Custom_Template, THE Template_Service SHALL remove it from `localStorage`; existing Notes that referenced the deleted template SHALL continue to display their saved `data` using a fallback renderer.
5. THE Template_Builder SHALL allow the user to add, reorder (drag-and-drop), and remove fields within a Custom_Template.
6. WHEN a `select` field is defined, THE Template_Builder SHALL allow the user to specify a comma-separated list of option values.
7. WHEN a user exports a Custom_Template, THE Export_Import_Service SHALL produce a JSON file containing the full Custom_Template definition.
8. WHEN a user imports a Custom_Template from a valid JSON file, THE Export_Import_Service SHALL add the template to `localStorage` and make it immediately available in the template picker.
9. IF an imported template JSON is malformed or missing required fields (`id`, `name`, `fields`), THEN THE Export_Import_Service SHALL display an error toast and reject the import.

---

### Requirement 6: Export and Import

**User Story:** As a user, I want to export and import my Shelves and Notebooks as JSON files, so that I can back up my data and transfer it between devices.

#### Acceptance Criteria

1. WHEN a user exports a Shelf, THE Export_Import_Service SHALL produce a JSON file containing the Shelf object, all its Notebooks, all Sections within those Notebooks, and all Notes within those Sections.
2. WHEN a user exports a Notebook, THE Export_Import_Service SHALL produce a JSON file containing the Notebook object, all its Sections, and all Notes within those Sections.
3. WHEN a user imports a Shelf JSON file, THE Export_Import_Service SHALL assign new unique ids to all imported entities (Shelf, Notebooks, Sections, Notes) to avoid id collisions, then append the Shelf to the existing shelves array.
4. WHEN a user imports a Notebook JSON file, THE Export_Import_Service SHALL assign new unique ids to all imported entities, prompt the user to select a target Shelf, and append the Notebook to that Shelf.
5. IF an imported JSON file is missing required top-level fields or has an unrecognised structure, THEN THE Export_Import_Service SHALL display an error toast and reject the import without modifying application state.
6. THE Export_Import_Service SHALL trigger a browser file download for all export operations, with a filename derived from the exported entity's name and the current date (e.g., `shelf-work-2026-03-14.json`).

---

### Requirement 7: Full-Text Search

**User Story:** As a user, I want to search all notes in the active Notebook, so that I can quickly find information without manually browsing sections.

#### Acceptance Criteria

1. WHEN the search input in the Topbar is empty, THE App SHALL display all Sections and Notes in the active Notebook without filtering.
2. WHEN a user types a search query, THE App SHALL filter the displayed Notes to those whose `title` or any string value within `data` contains the query string (case-insensitive).
3. WHEN search results are active, THE App SHALL display a banner showing the number of matching notes and a "Clear" button.
4. WHEN a user clicks "Clear" in the search banner, THE App SHALL reset the search input and restore the full unfiltered view.
5. WHEN a search query matches text within a Note's rendered content, THE App SHALL highlight the matching substring using the `hl` CSS class.
6. WHEN a search query returns zero results, THE App SHALL display an empty state message indicating no notes were found.

---

### Requirement 8: Themes and Appearance

**User Story:** As a user, I want to switch between four visual themes and adjust font size, so that the app looks the way I prefer.

#### Acceptance Criteria

1. THE App SHALL support four Themes: `default`, `light`, `dark`, and `warm`, each defined as a complete set of CSS custom properties matching the prototype exactly.
2. WHEN a user selects a Theme in the Settings_Panel, THE App SHALL set the `data-theme` attribute on the `<html>` element to the selected theme name and persist the selection to `localStorage`.
3. THE App SHALL support font sizes of 13px, 14px, and 15px, controlled via the `--fs` CSS custom property.
4. WHEN a user selects a font size in the Settings_Panel, THE App SHALL update the `--fs` CSS custom property on the `<html>` element and persist the selection to `localStorage`.
5. WHEN the App loads, THE App SHALL restore the last saved Theme and font size from `localStorage` before rendering any content.
6. THE App SHALL use the SVG_Icon_System for all iconography; no external icon libraries SHALL be used.

---

### Requirement 9: Settings Panel

**User Story:** As a user, I want a settings panel where I can manage my profile, themes, templates, and account, so that I can customise the app without leaving the main view.

#### Acceptance Criteria

1. WHEN a user clicks the settings icon in the Sidebar footer, THE Settings_Panel SHALL slide in from the right side of the screen.
2. THE Settings_Panel SHALL contain sections for: Profile (display name), Appearance (theme grid, font size), Custom Templates (list with edit/delete/export actions), and About.
3. WHEN a user updates their display name in the Settings_Panel, THE Data_Service SHALL persist the new name and update the Sidebar avatar and workspace name immediately.
4. WHEN a user clicks "Delete" on a Custom_Template in the Settings_Panel, THE Template_Service SHALL remove the template after confirmation.
5. WHEN a user clicks "Sign out" in the Settings_Panel, THE Auth_Service SHALL execute the logout flow defined in Requirement 1, Criterion 10.

---

### Requirement 10: Data Persistence

**User Story:** As a user, I want all my data to be automatically saved, so that I never lose notes when I close or refresh the browser.

#### Acceptance Criteria

1. THE Data_Service SHALL call `saveAll()` after every state-mutating operation (create, update, delete of any entity; theme change; font size change; sidebar open/close state).
2. THE Data_Service SHALL persist the complete application state for the current user under `S.users[username].data` in `localStorage` as a single JSON blob under the key `lore_users`.
3. WHEN the App initialises, THE Data_Service SHALL call `loadAll()` to restore state from `localStorage` before rendering.
4. IF `localStorage` is unavailable or throws a quota error, THEN THE Data_Service SHALL display an error toast and continue operating in-memory without crashing.

---

### Requirement 11: Angular Architecture

**User Story:** As a developer, I want the app built with Angular 17+ standalone components and a clean service layer, so that the codebase is maintainable and ready for future Google Drive integration.

#### Acceptance Criteria

1. THE App SHALL be an Angular 17+ project using standalone components (no NgModules).
2. THE App SHALL use SCSS for all styles, with prototype CSS custom properties ported as-is into a global `styles.scss`.
3. THE App SHALL implement the following services: `DataService`, `AuthService`, `TemplateService`, `ExportImportService`.
4. THE App SHALL implement the following components: `AppComponent`, `SidebarComponent`, `TopbarComponent`, `NoteCardComponent`, `EditPanelComponent`, `SettingsPanelComponent`, and modal components for Shelf, Notebook, Section, Template Browser, and Template Builder.
5. THE App SHALL use no external UI component libraries; all UI SHALL be implemented with pure CSS from the prototype.
6. THE App SHALL include an `staticwebapp.config.json` file at the project root configured for Azure Static Web Apps deployment with a navigation fallback to `index.html`.
7. WHERE the base href is configured as `/lore/`, THE App SHALL serve correctly from the `thumbaraguddi.in/lore` subpath.

---

### Requirement 12: Section Color System

**User Story:** As a user, I want to assign one of eight colours to each Section, so that I can visually distinguish different topics at a glance.

#### Acceptance Criteria

1. THE App SHALL provide exactly eight Section_Colors: `purple`, `teal`, `blue`, `amber`, `coral`, `green`, `pink`, and `gray`.
2. THE App SHALL define each Section_Color as an object with exactly four properties: `bg`, `text`, `border`, and `dot`, matching the prototype values exactly.
3. WHEN a Section is rendered, THE App SHALL apply the Section's Section_Color to the section divider, note card badges, and template-specific accent elements.
4. WHEN a user creates or edits a Section, THE Section_Modal SHALL display all eight Section_Colors as selectable swatches.

---

## Correctness Properties for Property-Based Testing

### Property 1: Hierarchy Referential Integrity (Invariant)

FOR ALL states persisted by THE Data_Service, every Notebook's `shelfId` SHALL reference an id that exists in the shelves array, every Section SHALL belong to a Notebook that exists in the notebooks array, and every Note SHALL belong to a Section within a Notebook.

*Pattern: Invariant — structural integrity is preserved after every mutation.*

---

### Property 2: Shelf Export/Import Round-Trip (Round-Trip)

FOR ALL Shelf objects with valid Notebooks, Sections, and Notes, THE Export_Import_Service SHALL produce a JSON export such that importing that JSON produces a Shelf with structurally equivalent content (same names, template ids, and data fields), differing only in newly assigned ids.

*Pattern: Round-Trip — `import(export(shelf))` ≅ `shelf` (modulo id reassignment).*

---

### Property 3: Notebook Export/Import Round-Trip (Round-Trip)

FOR ALL Notebook objects with valid Sections and Notes, THE Export_Import_Service SHALL produce a JSON export such that importing that JSON produces a Notebook with structurally equivalent content, differing only in newly assigned ids.

*Pattern: Round-Trip — `import(export(notebook))` ≅ `notebook` (modulo id reassignment).*

---

### Property 4: Custom Template Export/Import Round-Trip (Round-Trip)

FOR ALL Custom_Template objects, THE Export_Import_Service SHALL produce a JSON export such that importing that JSON produces a Custom_Template with identical `name`, `icon`, `color`, and `fields` arrays.

*Pattern: Round-Trip — `import(export(template))` === `template` (exact equality, ids preserved).*

---

### Property 5: localStorage Persistence Round-Trip (Round-Trip)

FOR ALL application states, calling `saveAll()` followed by `loadAll()` SHALL produce a state object that is deeply equal to the original state (same shelves, notebooks, sections, notes, themes, custom templates).

*Pattern: Round-Trip — `loadAll(saveAll(state))` === `state`.*

---

### Property 6: Search Result Subset (Metamorphic)

FOR ALL search queries Q applied to a Notebook with N notes, the set of matching notes returned by THE App SHALL be a subset of all N notes; a more specific query Q' (where Q is a prefix of Q') SHALL return a result set that is a subset of the result set for Q.

*Pattern: Metamorphic — `results(Q') ⊆ results(Q)` when `Q` is a prefix of `Q'`.*

---

### Property 7: Financial Log Net Calculation (Invariant)

FOR ALL Financial Log notes where income entries and expense entries are non-empty, THE Note_Card SHALL compute `net = sum(income[].amount) − sum(expenses[].amount)`, and the displayed net value SHALL equal this computed value for any combination of income and expense entries.

*Pattern: Invariant — arithmetic correctness is preserved regardless of the number or order of entries.*

---

### Property 8: Note Collapse Toggle Idempotence (Idempotence)

FOR ALL Note_Cards, toggling the collapsed state twice SHALL return the Note_Card to its original `_collapsed` value.

*Pattern: Idempotence — `toggle(toggle(state)) === state`.*

---

### Property 9: Cascade Delete Completeness (Invariant)

FOR ALL Shelf deletions, after THE Data_Service processes the deletion, no Notebook with the deleted Shelf's id as `shelfId` SHALL remain in the notebooks array, and no Section or Note that belonged to those Notebooks SHALL remain in any Section's `notes` array.

*Pattern: Invariant — referential integrity is maintained after cascade delete.*

---

### Property 10: Unique ID Generation (Invariant)

FOR ALL calls to the `uid()` function across a session, THE Data_Service SHALL produce values that are unique within the current session's entity collections (shelves, notebooks, sections, notes, custom templates).

*Pattern: Invariant — no two live entities share the same id.*
