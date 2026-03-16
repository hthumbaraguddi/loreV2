# Design Document — Lore Notes App

## Overview

Lore is a pixel-perfect Angular 17+ port of the working HTML prototype at `Prototype/lore_v2.html`. It is a single-page, client-side-only note-taking application with no backend. All data is persisted in `localStorage`. The app organises notes in a four-level hierarchy (Shelf → Notebook → Section → Note), supports six built-in structured templates plus a custom template builder, full import/export, four visual themes, and local username/password authentication.

The app is deployed as a static site on Azure Static Web Apps (free tier) at `thumbaraguddi.in/lore`, with a base href of `/lore/`.

### Key Design Decisions

- **No NgModules**: All components are standalone, using `imports: []` arrays directly.
- **No external UI libraries**: All styling is pure SCSS ported from the prototype's CSS custom properties.
- **Template rendering via `[innerHTML]`**: The six built-in templates and the dynamic custom template engine produce HTML strings (as in the prototype). Angular's `DomSanitizer.bypassSecurityTrustHtml` is used to render them safely. This is an intentional trade-off to preserve pixel-perfect fidelity with the prototype without rewriting every template as Angular components.
- **Single BehaviorSubject state**: `DataService` holds one `AppState` object as a `BehaviorSubject<AppState>`. All mutations go through `DataService` methods, which call `saveAll()` after every change.
- **Event delegation for form interactions**: Because template forms are rendered as HTML strings via `[innerHTML]`, interactive elements (add-row buttons, remove buttons) use global helper functions exposed on `window` — the same pattern as the prototype. These are registered in `AppComponent.ngOnInit()`.

---

## Architecture

### High-Level Structure

```
src/
├── app/
│   ├── app.component.ts          # Root: login/app visibility, global window helpers
│   ├── components/
│   │   ├── login/                # LoginComponent
│   │   ├── sidebar/              # SidebarComponent
│   │   ├── topbar/               # TopbarComponent
│   │   ├── content-area/         # ContentAreaComponent
│   │   ├── note-card/            # NoteCardComponent
│   │   ├── edit-panel/           # EditPanelComponent
│   │   ├── settings-panel/       # SettingsPanelComponent
│   │   ├── lore-icon/            # LoreIconComponent
│   │   └── modals/
│   │       ├── shelf-modal/
│   │       ├── notebook-modal/
│   │       ├── section-modal/
│   │       ├── template-browser-modal/
│   │       └── template-builder-modal/
│   └── services/
│       ├── auth.service.ts
│       ├── data.service.ts
│       ├── template.service.ts
│       └── export-import.service.ts
├── assets/
│   └── icons.svg                 # SVG sprite (698 icons from lore-icons-v2.html)
└── styles.scss                   # Global styles: all CSS custom properties from prototype
```

### Component Tree

```
AppComponent
├── LoginComponent          (shown when not authenticated)
└── [app shell]             (shown when authenticated)
    ├── SidebarComponent
    ├── [main area]
    │   ├── TopbarComponent
    │   └── ContentAreaComponent
    │       └── NoteCardComponent (×N)
    ├── EditPanelComponent
    ├── SettingsPanelComponent
    └── [modals, rendered via *ngIf]
        ├── ShelfModalComponent
        ├── NotebookModalComponent
        ├── SectionModalComponent
        ├── TemplateBrowserModalComponent
        └── TemplateBuilderModalComponent
```

### Data Flow

```
User Action → Component → DataService.mutate() → BehaviorSubject.next(newState) → saveAll() → localStorage
                                                        ↓
                                              Components re-render via async pipe
```

---

## Components and Interfaces

### AppComponent

**Selector**: `app-root`  
**Responsibilities**:
- Reads `lore_cu` from `localStorage` on init; if a valid session exists, shows the app shell, otherwise shows `LoginComponent`.
- Applies the saved theme (`data-theme` attribute on `<html>`) and font size (`--fs` CSS variable) before first render.
- Registers global `window` helper functions used by template form HTML strings: `addRow`, `addLinkRow`, `addAmtRow`, `addWatchRow`, `addActionRow`, `addTickerRow`, `addTradeRow`, `addChecklistRow`.
- Subscribes to `AuthService.isLoggedIn$` to toggle login/app visibility.

### LoginComponent

**Selector**: `app-login`  
**Template**: Full-screen overlay matching the prototype's `#loginScreen` exactly.  
**Responsibilities**:
- Manages sign-in / register tab state.
- Calls `AuthService.login()` or `AuthService.register()`.
- Displays error messages returned by `AuthService`.

### SidebarComponent

**Selector**: `app-sidebar`  
**Input**: `state: AppState`  
**Output**: `notebookSelected`, `shelfToggled`, `addShelf`, `addNotebook`, `editShelf`, `editNotebook`, `openSettings`, `openTemplates`, `openTemplateBuilder`, `openImportTemplate`  
**Responsibilities**:
- Renders the shelf/notebook hierarchy from `AppState`.
- Emits events for all user interactions; does not mutate state directly.
- Handles sidebar collapse/expand toggle (calls `DataService.toggleSidebar()`).

### TopbarComponent

**Selector**: `app-topbar`  
**Input**: `activeShelfName: string`, `activeNotebookName: string`, `activeNotebookIcon: string`, `hasActiveNotebook: boolean`  
**Output**: `searchChanged: EventEmitter<string>`, `addSection`, `addNote`  
**Responsibilities**:
- Renders breadcrumb, search input, "+ Section" and "+ Note" buttons.
- Emits search query changes with debounce (300ms).

### ContentAreaComponent

**Selector**: `app-content-area`  
**Input**: `notebook: Notebook | null`, `searchQuery: string`, `colors: SectionColorMap`  
**Output**: `editNote`, `deleteNote`, `addNote`, `editSection`, `deleteSection`  
**Responsibilities**:
- Renders the notebook progress bar, section dividers, note cards, and empty states.
- Passes search query to `NoteCardComponent` for highlight rendering.
- Shows search results banner when query is active.

### NoteCardComponent

**Selector**: `app-note-card`  
**Input**: `note: Note`, `section: Section`, `color: SectionColor`, `searchQuery: string`, `templates: TemplateDefinition[]`  
**Output**: `edit`, `delete`  
**Responsibilities**:
- Renders the card header (badge, title, template pill, action buttons, chevron).
- Renders the card body using `[innerHTML]` bound to `template.renderCard(note, color, highlightFn)`.
- Manages collapsed/expanded state by calling `DataService.toggleNoteCollapse(noteId)`.
- The `highlightFn` wraps matched substrings in `<mark class="hl">`.

### EditPanelComponent

**Selector**: `app-edit-panel`  
**Input**: `note: Note | null`, `sectionId: string | null`, `templates: TemplateDefinition[]`  
**Output**: `saved`, `deleted`, `closed`  
**Responsibilities**:
- Renders the slide-in panel with template picker and form.
- Template picker chips are rendered from `TemplateService.getTemplates()`.
- Form body is rendered via `[innerHTML]` bound to `template.buildForm(note?.data)`.
- On save, calls `template.readForm()` to extract data, then emits `saved` with the note payload.
- Slide-in animation via CSS `transform: translateX(100%)` → `translateX(0)` on `.open` class.

### SettingsPanelComponent

**Selector**: `app-settings-panel`  
**Input**: `state: AppState`, `customTemplates: CustomTemplate[]`  
**Output**: `closed`, `themeChanged`, `fontSizeChanged`, `nameChanged`, `templateDeleted`, `templateEdited`, `templateExported`, `logout`  
**Responsibilities**:
- Renders profile, appearance (theme grid, font size), custom templates list, and about sections.
- Emits events for all user actions; does not mutate state directly.

### LoreIconComponent

**Selector**: `lore-icon`  
**Input**: `name: string`, `size?: number`  
**Template**:
```html
<svg [attr.width]="size || 16" [attr.height]="size || 16">
  <use [attr.href]="'/lore/assets/icons.svg#' + name"></use>
</svg>
```
**Note**: The prototype uses emoji for icons in the sidebar and template chips. The `LoreIconComponent` is used for the SVG sprite icons (search, chevrons, edit, delete, settings, etc.) extracted from `lore-icons-v2.html`.

### Modal Components

All modals follow the same pattern:
- Rendered conditionally via `*ngIf` in `AppComponent`.
- Shown/hidden by toggling a CSS class `.show` on the overlay `div.ov`.
- Emit `saved` and `cancelled` outputs.

| Component | Modal ID in prototype | Purpose |
|---|---|---|
| `ShelfModalComponent` | `shMod` | Create/edit/delete shelf |
| `NotebookModalComponent` | `nbMod` | Create/edit/delete notebook |
| `SectionModalComponent` | `secMod` | Create/edit/delete section with color picker |
| `TemplateBrowserModalComponent` | `tplMod` | Browse all templates |
| `TemplateBuilderModalComponent` | `tplBuilderMod` | Build/edit custom templates |
