# Lore App — Component Specification Document

> **Version:** 1.0 | **Angular:** 17+ Standalone | **Generated for:** Design, Engineering & QA

---

## Table of Contents

1. [Shell & Navigation](#shell--navigation)
2. [Editor](#editor)
3. [Block System](#block-system)
4. [Linking & Tags](#linking--tags)
5. [Right Panel](#right-panel)
6. [Comments](#comments)
7. [AI Features](#ai-features)
8. [Prompt Library](#prompt-library)
9. [Scheduled Runs](#scheduled-runs)
10. [HTML Notes](#html-notes)
11. [Overlays & Global UI](#overlays--global-ui)
12. [Settings](#settings)
13. [Template Builder](#template-builder)

---

## Design Token Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#7C3AED` | Primary interactive accent |
| `--font-heading` | `Lora` | Note titles, headings |
| `--font-body` | `DM Sans` | Body copy, UI labels |
| `--font-mono` | `JetBrains Mono` | Code blocks, monospace |
| `--color-surface` | Varies (light/dark) | Panel backgrounds |
| `--color-border` | Varies | Dividers, outlines |
| `--radius-card` | `8px` | Card border-radius |
| `--shadow-panel` | Varies | Elevated panel shadow |

---

## Shell & Navigation

---

### AppShell

**Selector:** `lore-app-shell`
**File:** `src/app/shell/app-shell/app-shell.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `config` | `AppShellConfig` | `defaultConfig` | No | Global layout configuration (sidebar width, pane count, etc.) |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `layoutChanged` | `LayoutChangeEvent` | Emitted when any major layout region changes (sidebar open/close, pane count) |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `sidebarOpen` | `Signal<boolean>` | `true` | Whether the collapsible sidebar is visible |
| `rightPanelOpen` | `Signal<boolean>` | `false` | Whether the right context panel is open |
| `zenMode` | `Signal<boolean>` | `false` | Zen/focus mode hides all chrome except editor |
| `darkMode` | `Signal<boolean>` | `false` | Drives `dark` class on host element |
| `activePane` | `Signal<number>` | `0` | Index of the currently focused editor pane |

#### Template Summary

AppShell is the root layout host. It renders three named layout regions: a `<lore-nav-rail>` pinned to the left edge, a `<lore-sidebar>` collapsible panel next to the rail, and a main content area that contains `<lore-split-editor>`. The right side hosts `<lore-right-panel>` which slides in/out. `<lore-ai-chat-sidebar>` and `<lore-search-overlay>` are conditionally projected via `@if` and portal rendering. `<lore-quick-capture-modal>` and `<lore-keyboard-cheatsheet>` are rendered as overlay outlets at the shell level. The host element carries `class.dark` and `class.zen` bindings driven by signals.

#### SCSS / Tailwind Strategy

Uses CSS Grid with named areas: `"rail sidebar editor rightpanel"`. Rail is fixed `56px` wide. Sidebar width is driven by `--sidebar-width` custom property (default `260px`), animated via `transition: width 240ms ease`. Host binding `[class.dark]="darkMode()"` enables the dark token cascade. `[class.zen]="zenMode()"` hides rail, sidebar, and right panel via `display: none` on those grid areas.

#### Accessibility

- ARIA role: `main` on the editor region; `complementary` on sidebar and right panel
- `aria-expanded` on the sidebar toggle button
- `aria-live="polite"` region for toast/notification announcements
- Keyboard interaction map:
  - `⌘⇧D` → toggle dark mode
  - `⌘J` → open Quick Capture modal
  - `⌘K` → open Search overlay
  - `?` → open Keyboard Cheatsheet
  - `Escape` → dismiss any open overlay; exit Zen mode
- Focus management: When Zen mode activates, focus is trapped inside the editor region. When modals open, focus moves to the modal's first focusable element.

#### Unit Test Checklist

- [ ] Shell renders all four layout regions (rail, sidebar, editor, right panel) by default
- [ ] `sidebarOpen` signal toggles sidebar visibility and emits `layoutChanged`
- [ ] Zen mode signal hides rail, sidebar, and right panel via host class binding
- [ ] Dark mode signal applies `dark` class to host
- [ ] `⌘K` keydown triggers `SearchOverlay` rendering
- [ ] `⌘J` keydown triggers `QuickCaptureModal` rendering
- [ ] `?` keydown triggers `KeyboardCheatsheet` rendering
- [ ] Right panel opens when `rightPanelOpen` signal becomes `true`

#### Storybook Story Outline

- **Default** — sidebar open, single pane, light mode, no overlays
- **Dark Mode** — same layout with dark token cascade active
- **Zen Mode** — only editor visible, all chrome hidden
- **Split Panes (3)** — three-pane layout with right panel open
- **All Overlays** — search overlay rendered over full shell

---

### NavRail

**Selector:** `lore-nav-rail`
**File:** `src/app/shell/nav-rail/nav-rail.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `activeSection` | `NavSection` | `'notes'` | No | Currently active top-level section |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `sectionChanged` | `NavSection` | Emitted when user clicks a rail icon |
| `quickCaptureRequested` | `void` | Emitted when FAB (⌘J) is clicked |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `hovered` | `Signal<NavSection \| null>` | `null` | Which icon is hovered (for tooltip display) |

#### Template Summary

Renders a fixed-width vertical strip (`56px`) with icon buttons for each top-level section: Notes, AI Chat, Prompt Library, Knowledge Graph, Settings. A profile avatar sits at the bottom. A floating action button (FAB) for Quick Capture is anchored above the avatar. Each icon button has a tooltip rendered via `cdkOverlayOrigin` that appears on hover.

#### SCSS / Tailwind Strategy

Host uses `display: flex; flex-direction: column; align-items: center`. Active icon gets `background: var(--color-accent); border-radius: 12px`. Tooltip uses absolute positioning with `z-index: var(--z-tooltip)`. Hover state transitions `background` over `150ms`.

#### Accessibility

- ARIA role: `navigation` with `aria-label="Main navigation"`
- Each icon button has `aria-label` matching section name and `aria-current="page"` when active
- Keyboard interaction map:
  - `Tab` → cycle through icon buttons
  - `Enter` / `Space` → activate section
  - `Arrow Up` / `Arrow Down` → move between rail items

#### Unit Test Checklist

- [ ] Renders correct number of nav items for defined sections
- [ ] Active section icon has `aria-current="page"` attribute
- [ ] Clicking an icon emits `sectionChanged` with correct section identifier
- [ ] FAB click emits `quickCaptureRequested`
- [ ] Tooltip renders on hover with correct label text
- [ ] Arrow key navigation cycles through items without leaving rail

#### Storybook Story Outline

- **Default** — Notes section active
- **AI Chat Active** — AI Chat section highlighted
- **Hovering** — tooltip visible over Knowledge Graph icon

---

### Sidebar

**Selector:** `lore-sidebar`
**File:** `src/app/shell/sidebar/sidebar.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `open` | `Signal<boolean>` | — | Yes | Controls collapsed/expanded state |
| `width` | `number` | `260` | No | Panel width in px when expanded |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `toggleRequested` | `void` | User clicked the collapse handle |
| `noteSelected` | `NoteRef` | User clicked a note in the tree |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `searchQuery` | `Signal<string>` | `''` | Filter query for the tree |
| `activeShelfId` | `Signal<string \| null>` | `null` | Currently selected shelf |

#### Template Summary

The sidebar contains a search/filter input at the top, followed by `<lore-shelf-tree>` which renders the full Shelf → Notebook → Notes hierarchy. A collapse toggle handle (`<button>`) is anchored to the right edge. When `open` is false, the sidebar collapses to `0px` width with content hidden via `overflow: hidden`. The search input filters the tree in real-time via the `searchQuery` signal passed down to ShelfTree.

#### SCSS / Tailwind Strategy

`width` transitions via CSS: `transition: width 240ms cubic-bezier(0.4,0,0.2,1)`. When collapsed, `width: 0; overflow: hidden`. Host uses `--sidebar-width` custom property. The toggle handle uses `position: absolute; right: -12px` to sit on the sidebar edge.

#### Accessibility

- ARIA role: `complementary` with `aria-label="Notes sidebar"`
- `aria-expanded` on the sidebar root element reflecting `open` state
- Collapse handle: `aria-label="Collapse sidebar"` / `"Expand sidebar"` toggled dynamically
- Keyboard interaction map:
  - `Tab` → focus search input, then tree items
  - `Escape` → collapses sidebar if expanded

#### Unit Test Checklist

- [ ] Sidebar width is 0 when `open` signal is false
- [ ] Toggle button emits `toggleRequested` on click
- [ ] Search input updates `searchQuery` signal on keystroke
- [ ] `noteSelected` propagates from ShelfTree child event
- [ ] `aria-expanded` reflects `open` state correctly
- [ ] Collapse handle label changes between "Collapse" and "Expand"

#### Storybook Story Outline

- **Expanded** — full width with populated shelf tree
- **Collapsed** — zero-width, content clipped
- **Filtering** — search query filters visible tree nodes
- **Empty State** — no shelves created yet

---

### ShelfTree

**Selector:** `lore-shelf-tree`
**File:** `src/app/features/notes/shelf-tree/shelf-tree.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `shelves` | `Shelf[]` | `[]` | Yes | Full shelf data with nested notebooks and notes |
| `filterQuery` | `string` | `''` | No | Current search string to highlight/filter nodes |
| `activeNoteId` | `string \| null` | `null` | No | ID of the currently open note (for selection highlight) |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `noteSelected` | `NoteRef` | User clicked a note item |
| `shelfCreated` | `string` | User submitted a new shelf name |
| `shelfRenamed` | `{id: string; name: string}` | Inline rename confirmed |
| `shelfDeleted` | `string` | Shelf delete confirmed via context menu |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `expandedShelves` | `Signal<Set<string>>` | `new Set()` | IDs of expanded shelf nodes |
| `expandedNotebooks` | `Signal<Set<string>>` | `new Set()` | IDs of expanded notebook nodes |
| `renamingId` | `Signal<string \| null>` | `null` | ID of node currently in inline rename |
| `contextMenuTarget` | `Signal<TreeNode \| null>` | `null` | Node whose context menu is open |

#### Template Summary

Renders a recursive tree using `@for` over `shelves`. Each shelf renders a `<lore-notebook-group>` which in turn renders `<lore-note-item>` leaves. A context menu (CDK overlay) appears on right-click or `⋮` button click. Inline rename replaces the label with an `<input>` when `renamingId` matches. Nodes matching `filterQuery` are highlighted; non-matching nodes are hidden.

#### SCSS / Tailwind Strategy

Tree indentation uses `padding-left: calc(var(--tree-depth) * 16px)`. Hover states use `background: var(--color-hover)`. Active note uses `background: var(--color-accent-subtle); color: var(--color-accent)`. Context menu is a floating card with `box-shadow: var(--shadow-panel)`.

#### Accessibility

- ARIA role: `tree` on the root `<ul>`; each shelf/notebook is `treeitem` with `aria-expanded`; note leaves are `treeitem` with `aria-selected`
- Keyboard interaction map:
  - `Arrow Down` / `Arrow Up` → navigate between visible tree items
  - `Arrow Right` → expand collapsed node
  - `Arrow Left` → collapse expanded node or move to parent
  - `Enter` → open selected note
  - `F2` → trigger inline rename on focused node
  - `Delete` → trigger delete confirmation on focused node
  - `Escape` → cancel inline rename or close context menu

#### Unit Test Checklist

- [ ] Shelves with no notebooks render with expand arrow but empty children
- [ ] Clicking expand arrow toggles `expandedShelves` set
- [ ] `filterQuery` hides non-matching nodes and highlights matching text
- [ ] Inline rename input appears when `renamingId` matches node id
- [ ] Confirming rename emits `shelfRenamed` with correct id and name
- [ ] Right-click opens context menu positioned near the target node
- [ ] Active note id applies correct aria-selected and highlight class

#### Storybook Story Outline

- **Default** — three shelves, two expanded, one note selected
- **Filtered** — query "research" showing only matching notes highlighted
- **Inline Rename** — one shelf node in rename mode
- **Empty** — no shelves, shows empty state prompt

---

### NotebookGroup

**Selector:** `lore-notebook-group`
**File:** `src/app/features/notes/notebook-group/notebook-group.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `notebook` | `Notebook` | — | Yes | Notebook data with nested notes array |
| `expanded` | `boolean` | `false` | No | Whether notebook is currently expanded |
| `activeNoteId` | `string \| null` | `null` | No | Currently active note id for selection state |
| `depth` | `number` | `1` | No | Tree depth for indentation calculation |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `toggleExpanded` | `string` | Emits notebook id when expand toggle is clicked |
| `noteSelected` | `NoteRef` | Bubbles note selection from child NoteItems |
| `contextMenuRequested` | `{target: Notebook; event: MouseEvent}` | Right-click on notebook header |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `noteCount` | `Signal<number>` | `computed` | Derived count of notes in this notebook |

#### Template Summary

Renders a collapsible notebook header row with icon, name, and note count badge. When `expanded` is true, renders a `<ul>` of `<lore-note-item>` components. A `+` add-note button appears on header hover. The expand toggle is an animated chevron icon that rotates 90° when expanded.

#### SCSS / Tailwind Strategy

Header height is `32px`. Chevron rotation is CSS `transform: rotate(90deg)` with `transition: transform 200ms`. Note count badge uses `background: var(--color-surface-2); border-radius: 999px; padding: 0 6px; font-size: 11px`.

#### Accessibility

- ARIA role: `group` on the notebook container; header is `button` with `aria-expanded`
- `aria-label` includes notebook name and note count
- Keyboard interaction map:
  - `Enter` / `Space` → toggle expanded
  - `Arrow Right` → expand if collapsed
  - `Arrow Left` → collapse if expanded

#### Unit Test Checklist

- [ ] Note count badge shows correct number from `notebook.notes.length`
- [ ] Toggle click emits `toggleExpanded` with notebook id
- [ ] `expanded=false` hides note list (not rendered or `display:none`)
- [ ] Add-note button visible on hover, emits correct event
- [ ] Context menu emitted on right-click of header
- [ ] Chevron icon has 90-degree rotation when expanded

#### Storybook Story Outline

- **Collapsed** — notebook with 5 notes, collapsed
- **Expanded** — notebook with 5 notes, expanded showing NoteItems
- **Active Note** — one NoteItem highlighted as active
- **Empty Notebook** — no notes, shows empty placeholder

---

### NoteItem

**Selector:** `lore-note-item`
**File:** `src/app/features/notes/note-item/note-item.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `note` | `NoteRef` | — | Yes | Note reference with id, title, type, updatedAt |
| `active` | `boolean` | `false` | No | Whether this note is currently open |
| `depth` | `number` | `2` | No | Tree depth for indentation |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `selected` | `NoteRef` | User clicked this note |
| `contextMenuRequested` | `{note: NoteRef; event: MouseEvent}` | Right-click request |
| `dragStarted` | `NoteRef` | Note drag initiated (for reordering) |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `hovered` | `Signal<boolean>` | `false` | Hover state for action buttons |

#### Template Summary

A single tree leaf row rendering: a note-type icon (Research, Journal, Task, Idea, Reference, HTML), the note title truncated to one line, and a relative timestamp. On hover, a `⋮` context menu button appears. The row is draggable for reordering within the notebook. Active state applies an accent background strip.

#### SCSS / Tailwind Strategy

Row height `28px`. Title uses `text-overflow: ellipsis; white-space: nowrap; overflow: hidden`. Note type icons are `16px` SVG sprites colored with `var(--note-type-color-[type])`. Dragging state applies `opacity: 0.5` with a drag ghost.

#### Accessibility

- ARIA role: `treeitem` with `aria-selected` reflecting `active` input
- `aria-label`: `"[NoteTitle], [NoteType] note, last edited [relative time]"`
- Keyboard interaction map:
  - `Enter` → emit `selected`
  - `F2` → request inline rename (bubbles to ShelfTree)
  - `Delete` → request delete confirmation

#### Unit Test Checklist

- [ ] Correct note-type icon renders for each of the 6 note types
- [ ] `active=true` applies accent background class
- [ ] Title truncates with ellipsis when overflowing row width
- [ ] Click emits `selected` with the full `NoteRef` object
- [ ] Context menu button only visible when `hovered` signal is true
- [ ] `aria-selected` reflects `active` input binding

#### Storybook Story Outline

- **Default** — Research note, not active
- **Active** — Task note, active state
- **All Types** — one row per note type in a list
- **Long Title** — title truncation with ellipsis visible

---

## Editor

---

### SplitEditor

**Selector:** `lore-split-editor`
**File:** `src/app/features/editor/split-editor/split-editor.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `paneCount` | `1 \| 2 \| 3` | `1` | No | Number of editor panes to display |
| `paneNotes` | `NoteRef[]` | `[]` | No | Notes assigned to each pane (index-matched) |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `paneCountChanged` | `number` | User changed pane count via toolbar |
| `activePaneChanged` | `number` | User focused a different pane |
| `noteOpenedInPane` | `{paneIndex: number; noteRef: NoteRef}` | Note dropped or selected into a pane |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `activePane` | `Signal<number>` | `0` | Index of the focused pane |
| `paneWidths` | `Signal<number[]>` | `[100]` | Percentage widths for each pane (sum = 100) |
| `draggingDivider` | `Signal<number \| null>` | `null` | Index of the divider being dragged to resize |

#### Template Summary

Renders a horizontal flex container where each `<lore-pane>` occupies `paneWidths[i]%` of the available width. Between panes, a draggable resize divider is rendered. A pane count selector toolbar sits above the editor area with 1/2/3 buttons. When a note is dragged from the sidebar onto a pane, the target pane highlights. Pane resizing is handled via `mousedown` on the divider and `mousemove`/`mouseup` on the document.

#### SCSS / Tailwind Strategy

Flex container with `gap: 0`. Dividers are `4px` wide with `cursor: col-resize`. Active pane has a `2px` accent bottom border on its header. Resize interaction updates `paneWidths` signal which drives inline `style.width` bindings.

#### Accessibility

- ARIA role: `group` on each pane with `aria-label="Editor pane [n]"`
- Dividers: `role="separator"` with `aria-orientation="vertical"` and `aria-valuenow` for width percentage
- Keyboard interaction map:
  - `Tab` → move focus between panes
  - `⌘1` / `⌘2` / `⌘3` → switch pane count
  - `Escape` → close current pane (collapse to fewer panes)

#### Unit Test Checklist

- [ ] Renders correct number of Pane components for `paneCount` 1, 2, and 3
- [ ] Divider drag updates `paneWidths` signal proportionally
- [ ] Clicking outside all panes does not change `activePane`
- [ ] `activePaneChanged` emits when a pane receives focus
- [ ] `noteOpenedInPane` emits correct index and ref on drop
- [ ] Pane count selector buttons emit `paneCountChanged`
- [ ] Pane widths always sum to 100 after any resize operation

#### Storybook Story Outline

- **Single Pane** — one pane with a note loaded
- **Two Panes** — equal-width split, different notes
- **Three Panes** — three-way split
- **Empty Pane** — pane with no note showing drop zone

---

### Pane

**Selector:** `lore-pane`
**File:** `src/app/features/editor/pane/pane.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `noteRef` | `NoteRef \| null` | `null` | No | The note currently displayed in this pane |
| `active` | `boolean` | `false` | No | Whether this pane is the active/focused one |
| `index` | `number` | `0` | Yes | Pane index for identification |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `focused` | `number` | Pane index when this pane receives focus |
| `closeRequested` | `number` | Pane index when user clicks close button |
| `noteDropped` | `{paneIndex: number; noteRef: NoteRef}` | Note dragged into this pane |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `dragOver` | `Signal<boolean>` | `false` | Whether a drag is currently over this pane |

#### Template Summary

A pane renders a header bar with the note title, note type icon, and a close button. Below the header sits `<lore-paper-canvas>` which hosts the actual block editor. When `noteRef` is null, the pane shows a drop zone with "Drop a note here or open from sidebar" prompt. The pane header also has a breadcrumb trail showing Shelf › Notebook › Note.

#### SCSS / Tailwind Strategy

Host: `display: flex; flex-direction: column; height: 100%; overflow: hidden`. Header: `height: 48px; border-bottom: 1px solid var(--color-border)`. Drop zone: dashed border with `var(--color-accent)`, activated via `dragOver` signal.

#### Accessibility

- ARIA role: `region` with `aria-label="[NoteTitle] editor pane"`
- `aria-selected` on pane header tab when active
- Keyboard interaction map:
  - `Tab` → focus enters pane content
  - `Escape` → emit `closeRequested`

#### Unit Test Checklist

- [ ] Pane shows empty drop zone when `noteRef` is null
- [ ] Pane renders PaperCanvas when `noteRef` is provided
- [ ] `dragOver` signal triggers dashed border styling
- [ ] `focused` emits pane index on click anywhere in pane
- [ ] `noteDropped` emits on valid note dragdrop event
- [ ] Close button emits `closeRequested` with correct index

#### Storybook Story Outline

- **With Note** — pane showing a loaded note in PaperCanvas
- **Empty / Drop Zone** — pane with no note
- **Active** — pane with active accent indicator
- **Drag Over** — visual state when dragging a note over pane

---

### PaperCanvas

**Selector:** `lore-paper-canvas`
**File:** `src/app/features/editor/paper-canvas/paper-canvas.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `note` | `Note` | — | Yes | Full note object with blocks array |
| `backgroundStyle` | `CanvasBackground` | `'plain'` | No | Canvas background: `plain`, `dot`, `square`, `lined` |
| `readOnly` | `boolean` | `false` | No | If true, all editing interactions are disabled |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `blockAdded` | `{type: BlockType; afterIndex: number}` | New block inserted |
| `blockRemoved` | `{blockId: string}` | Block deleted |
| `blockReordered` | `{blockId: string; newIndex: number}` | Block dragged to new position |
| `noteChanged` | `NotePatch` | Debounced emission when note content changes |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `blocks` | `Signal<Block[]>` | `[]` | Local copy of note's block list |
| `focusedBlockId` | `Signal<string \| null>` | `null` | Currently focused block ID |
| `addMenuIndex` | `Signal<number \| null>` | `null` | Index at which block-add popover is open |
| `isDirty` | `Signal<boolean>` | `false` | Whether unsaved changes exist |

#### Template Summary

The canvas is a scrollable vertical list of `<lore-block-container>` components, one per block. A `+` add-block button appears between blocks on hover, opening a block type picker popover. Drag handles on the left of each block enable reordering via CDK DragDrop. The `<lore-canvas-background>` component is rendered as an absolutely-positioned underlay. A save status indicator (Saved / Unsaved) appears in the canvas footer.

#### SCSS / Tailwind Strategy

Canvas: `padding: 48px 64px; max-width: 820px; margin: 0 auto`. Block list: `display: flex; flex-direction: column; gap: 8px`. Add button: `opacity: 0` transitions to `opacity: 1` on parent row hover. Canvas background is `position: absolute; inset: 0; z-index: 0; pointer-events: none`.

#### Accessibility

- ARIA role: `document` with `aria-label="Note editor"`
- CdkDropList region is announced as `aria-roledescription="sortable block list"`
- Keyboard interaction map:
  - `Tab` → move between blocks
  - `⌘Enter` → insert new block below focused block
  - `Backspace` (on empty block) → delete block and merge
  - `⌘Z` / `⌘⇧Z` → undo / redo
  - `⌘S` → force save

#### Unit Test Checklist

- [ ] Renders correct number of BlockContainer components for `note.blocks`
- [ ] `blockAdded` emits with correct type and index on block picker selection
- [ ] `blockRemoved` emits when block delete is confirmed
- [ ] `blockReordered` emits after CDK drag-drop sequence completes
- [ ] `isDirty` signal becomes true after any block content change
- [ ] `noteChanged` debounce prevents rapid repeated emissions
- [ ] `readOnly=true` disables all interactive elements on blocks
- [ ] Add-block button only visible on row hover

#### Storybook Story Outline

- **Default** — note with 4 mixed block types
- **Read Only** — same note, no interactive controls
- **Dot Grid Background** — note with dot grid canvas
- **Empty Note** — no blocks, shows empty-state prompt
- **Dirty State** — unsaved indicator visible

---

### CanvasBackground

**Selector:** `lore-canvas-background`
**File:** `src/app/features/editor/canvas-background/canvas-background.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `style` | `CanvasBackground` | `'plain'` | Yes | One of: `plain`, `dot`, `square`, `lined` |
| `color` | `string` | `'var(--color-grid)'` | No | Grid/dot line color |
| `spacing` | `number` | `24` | No | Grid spacing in pixels |

#### Outputs

*None*

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `patternId` | `Signal<string>` | `computed` | Unique SVG pattern id derived from style+spacing |

#### Template Summary

Renders an `<svg>` element that fills its container absolutely. For `dot` style, renders an SVG `<pattern>` with `<circle>` elements. For `square`, uses `<path>` for grid lines. For `lined`, horizontal rules only. `plain` renders nothing (transparent). The SVG uses `preserveAspectRatio="none"` and `width="100%" height="100%"`.

#### SCSS / Tailwind Strategy

Host: `position: absolute; inset: 0; pointer-events: none; z-index: 0`. SVG fills host completely. Pattern colors use `var(--color-grid)` which resolves differently in light/dark modes.

#### Accessibility

- ARIA role: `presentation` (decorative — hidden from screen readers)
- `aria-hidden="true"` on the SVG element

#### Unit Test Checklist

- [ ] `style='plain'` renders no visible SVG content
- [ ] `style='dot'` renders SVG with circle pattern elements
- [ ] `style='square'` renders SVG with grid path elements
- [ ] `style='lined'` renders SVG with horizontal line elements
- [ ] Changing `spacing` updates SVG pattern dimensions
- [ ] Component is `aria-hidden` in all style variants

#### Storybook Story Outline

- **Plain** — transparent background
- **Dot Grid** — default spacing
- **Square Grid** — default spacing
- **Lined** — default spacing
- **Custom Spacing** — dense 12px dot grid

---

## Block System

---

### BlockContainer

**Selector:** `lore-block-container`
**File:** `src/app/features/blocks/block-container/block-container.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `Block` | — | Yes | Block data object with `type` discriminant |
| `index` | `number` | — | Yes | Block position in the canvas |
| `focused` | `boolean` | `false` | No | Whether this block is currently focused |
| `readOnly` | `boolean` | `false` | No | Disable all editing interactions |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `blockChanged` | `Block` | Updated block data after any edit |
| `blockDeleted` | `string` | Block id when delete is requested |
| `addBlockAfter` | `{afterIndex: number; type?: BlockType}` | Request to insert a block |
| `focused` | `string` | Block id when this block receives focus |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `toolbarVisible` | `Signal<boolean>` | `false` | Whether the BlockToolbar is shown |
| `commentsPanelOpen` | `Signal<boolean>` | `false` | Whether inline comments panel is open |

#### Template Summary

BlockContainer is the universal block wrapper. It uses an `@switch` on `block.type` to dynamically render one of the 14 block type components: `HypothesisBlock`, `ConclusionBlock`, `NoteInsightBlock`, `WarningBlock`, `QuoteBlock`, `KeyDifferencesBlock`, `KeyFindingsBlock`, `ChecklistBlock`, `TableBlock`, `CodeBlock`, `ImageBlock`, `DividerBlock`, `AskClaudeBlock`, `AskGptBlock`. Surrounding the inner block is: a `<lore-block-handle>` drag anchor on the left, a `<lore-block-toolbar>` that appears on focus/hover above the block, and a comment indicator badge. The container catches all child block change events and re-emits as `blockChanged`.

#### SCSS / Tailwind Strategy

Container: `position: relative; display: flex; align-items: flex-start; gap: 8px`. Handle sits in a `width: 24px` left gutter. Block toolbar is `position: absolute; top: -36px; left: 0; z-index: var(--z-toolbar)`. Focused state: `outline: 2px solid var(--color-accent-subtle); border-radius: var(--radius-card)`.

#### Accessibility

- ARIA role: `group` with `aria-label="[BlockType] block, position [index]"`
- `aria-grabbed` on the drag handle when dragging
- Focus is managed so tabbing into BlockContainer focuses the first interactive element of the inner block
- Keyboard interaction map:
  - `Tab` → enter block content
  - `Escape` → blur block, show toolbar
  - `⌘⇧↑` / `⌘⇧↓` → move block up/down (accessibility reorder)
  - `Backspace` (on empty) → request block deletion

#### Unit Test Checklist

- [ ] Renders `HypothesisBlock` when `block.type === 'hypothesis'`
- [ ] Renders `ConclusionBlock` when `block.type === 'conclusion'`
- [ ] Renders `NoteInsightBlock` when `block.type === 'note-insight'`
- [ ] Renders `WarningBlock` when `block.type === 'warning'`
- [ ] Renders `QuoteBlock` when `block.type === 'quote'`
- [ ] Renders `KeyDifferencesBlock` when `block.type === 'key-differences'`
- [ ] Renders `KeyFindingsBlock` when `block.type === 'key-findings'`
- [ ] Renders `ChecklistBlock` when `block.type === 'checklist'`
- [ ] Renders `TableBlock` when `block.type === 'table'`
- [ ] Renders `CodeBlock` when `block.type === 'code'`
- [ ] Renders `ImageBlock` when `block.type === 'image'`
- [ ] Renders `DividerBlock` when `block.type === 'divider'`
- [ ] Renders `AskClaudeBlock` when `block.type === 'ask-claude'`
- [ ] Renders `AskGptBlock` when `block.type === 'ask-gpt'`
- [ ] `toolbarVisible` becomes true on block focus
- [ ] `blockDeleted` emits on toolbar delete action

#### Storybook Story Outline

- **All Types** — one BlockContainer per block type, stacked
- **Focused** — single block in focused state with toolbar visible
- **Read Only** — block with all interactions disabled
- **With Comments** — block with comment count badge

---

### BlockToolbar

**Selector:** `lore-block-toolbar`
**File:** `src/app/features/blocks/block-toolbar/block-toolbar.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `blockType` | `BlockType` | — | Yes | Current block type (for type-switch action) |
| `visible` | `boolean` | `false` | No | Controls toolbar show/hide |
| `hasComments` | `boolean` | `false` | No | Whether comment icon shows count indicator |
| `commentCount` | `number` | `0` | No | Number of comments on this block |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `deleteRequested` | `void` | Delete button clicked |
| `duplicateRequested` | `void` | Duplicate button clicked |
| `typeChangeRequested` | `BlockType` | User selected a different block type |
| `commentRequested` | `void` | Comment icon clicked |
| `addAboveRequested` | `void` | Insert block above |
| `addBelowRequested` | `void` | Insert block below |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `typePickerOpen` | `Signal<boolean>` | `false` | Block type picker popover state |

#### Template Summary

A horizontal pill-shaped floating toolbar containing icon buttons: Add Above, Add Below, Duplicate, Change Type, Comment, Delete. The Change Type button opens a popover with all 14 block types listed. Toolbar animates in with a `scale(0.9) → scale(1)` + `opacity` transition when `visible` becomes true.

#### SCSS / Tailwind Strategy

Toolbar: `display: flex; gap: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 4px; box-shadow: var(--shadow-panel)`. Buttons: `width: 28px; height: 28px; border-radius: 6px`. Type picker popover: `min-width: 200px` floating below the change-type button.

#### Accessibility

- ARIA role: `toolbar` with `aria-label="Block actions"`
- Each button has descriptive `aria-label`
- Type picker: `role="menu"` with `role="menuitem"` children
- Keyboard interaction map:
  - `Arrow Left` / `Arrow Right` → navigate between toolbar buttons
  - `Enter` / `Space` → activate focused button
  - `Escape` → close type picker or dismiss toolbar

#### Unit Test Checklist

- [ ] Toolbar renders all 6 action buttons
- [ ] `deleteRequested` emits on delete button click
- [ ] `typeChangeRequested` emits selected type from picker
- [ ] Type picker opens on change-type button click and closes on Escape
- [ ] Comment button shows badge when `commentCount > 0`
- [ ] `visible=false` applies hidden styling

#### Storybook Story Outline

- **Default** — all buttons visible, no comments
- **With Comments** — comment button shows count badge
- **Type Picker Open** — type picker popover visible

---

### BlockHandle

**Selector:** `lore-block-handle`
**File:** `src/app/features/blocks/block-handle/block-handle.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `blockId` | `string` | — | Yes | ID of the associated block |
| `disabled` | `boolean` | `false` | No | Disables drag when in read-only mode |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `dragStarted` | `string` | Block id when drag begins |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `dragging` | `Signal<boolean>` | `false` | Whether a drag is currently in progress |
| `hovered` | `Signal<boolean>` | `false` | Whether handle is hovered |

#### Template Summary

A `24×24px` area rendering a `⠿` (six-dot grid) drag icon. The icon is invisible until the parent BlockContainer is hovered, at which point it fades in. Uses Angular CDK `cdkDragHandle` directive integration.

#### SCSS / Tailwind Strategy

Host: `opacity: 0; transition: opacity 150ms`. Parent hover makes it `opacity: 1`. Cursor: `grab`; during drag: `grabbing`. Icon color: `var(--color-text-tertiary)`.

#### Accessibility

- ARIA role: `button` with `aria-label="Drag to reorder block"`
- `aria-grabbed` reflects `dragging` state
- Keyboard reorder is handled at BlockContainer level (not via this handle)

#### Unit Test Checklist

- [ ] Handle is invisible when parent is not hovered
- [ ] Handle becomes visible on parent hover
- [ ] `dragStarted` emits block id on CDK drag initiation
- [ ] `disabled=true` prevents drag and shows not-allowed cursor
- [ ] `aria-grabbed` toggles correctly during drag lifecycle

#### Storybook Story Outline

- **Default** — handle invisible
- **Hovered** — handle visible with grab cursor
- **Dragging** — handle in active drag state

---

### HypothesisBlock

**Selector:** `lore-hypothesis-block`
**File:** `src/app/features/blocks/hypothesis-block/hypothesis-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `HypothesisBlockData` | — | Yes | Block data: `{id, statement, confidence, evidence}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `HypothesisBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<HypothesisBlockData>` | `input value` | Local editable copy |
| `confidenceLabel` | `Signal<string>` | `computed` | Human label for confidence level |

#### Template Summary

A visually distinct card with a purple `💡 Hypothesis` header badge, an editable rich-text `statement` field, a confidence slider (Low / Medium / High), and an optional `evidence` notes field. The card has a left accent border in the hypothesis color token.

#### SCSS / Tailwind Strategy

Card: `border-left: 4px solid var(--color-hypothesis); background: var(--color-hypothesis-subtle); border-radius: var(--radius-card); padding: 16px`. Header badge: `background: var(--color-hypothesis); color: white; border-radius: 4px; font-size: 12px`.

#### Accessibility

- ARIA role: `group` with `aria-label="Hypothesis block"`
- Confidence slider: `role="slider"` with `aria-valuenow`, `aria-valuemin="1"`, `aria-valuemax="3"`
- Keyboard interaction map:
  - `Tab` → move between statement, confidence, evidence fields
  - `Arrow Left` / `Arrow Right` on slider → decrease/increase confidence

#### Unit Test Checklist

- [ ] Renders statement text in editable contenteditable div
- [ ] Confidence slider reflects initial block confidence value
- [ ] Editing statement emits `changed` with updated statement
- [ ] Changing confidence emits `changed` with new confidence value
- [ ] `readOnly=true` makes statement and evidence non-editable

#### Storybook Story Outline

- **Default** — populated hypothesis with medium confidence
- **Low Confidence** — red indicator
- **High Confidence** — green indicator
- **Read Only** — static display mode

---

### ConclusionBlock

**Selector:** `lore-conclusion-block`
**File:** `src/app/features/blocks/conclusion-block/conclusion-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `ConclusionBlockData` | — | Yes | Block data: `{id, summary, supportingPoints, strength}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `ConclusionBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<ConclusionBlockData>` | `input value` | Local editable copy |

#### Template Summary

A green-accented card with a `✓ Conclusion` header badge, a rich-text `summary` field, a bulleted list of `supportingPoints` (editable, add/remove items), and a `strength` rating (Weak / Moderate / Strong). Left accent border uses the conclusion color token.

#### SCSS / Tailwind Strategy

Card: `border-left: 4px solid var(--color-conclusion); background: var(--color-conclusion-subtle)`. Supporting points use a custom `<ul>` with `list-style: none` and `+` add-item button at the bottom.

#### Accessibility

- ARIA role: `group` with `aria-label="Conclusion block"`
- Supporting points list: `role="list"`, each item `role="listitem"` with delete button `aria-label="Remove supporting point"`
- Keyboard interaction map:
  - `Enter` in last supporting point → add new point
  - `Backspace` on empty point → remove it

#### Unit Test Checklist

- [ ] Renders all supporting points from block data
- [ ] Adding a supporting point updates `localBlock` and emits `changed`
- [ ] Removing a supporting point emits `changed` with updated array
- [ ] Strength rating changes emit `changed`
- [ ] `readOnly=true` hides add/remove controls

#### Storybook Story Outline

- **Default** — two supporting points, moderate strength
- **Strong** — three points, strong rating
- **Read Only** — static display

---

### NoteInsightBlock

**Selector:** `lore-note-insight-block`
**File:** `src/app/features/blocks/note-insight-block/note-insight-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `NoteInsightBlockData` | — | Yes | Block data: `{id, content, tags}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `NoteInsightBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<NoteInsightBlockData>` | `input value` | Local editable copy |

#### Template Summary

A neutral-accent card labeled `📝 Note / Insight` with a full rich-text content area. Below the content, a `<lore-tag-input>` allows associating tags with the insight. Minimalist styling, suitable as the general-purpose block type.

#### SCSS / Tailwind Strategy

Card: `border-left: 4px solid var(--color-insight); background: var(--color-surface)`. Content area uses `font-family: var(--font-body); line-height: 1.6`.

#### Accessibility

- ARIA role: `group` with `aria-label="Note / Insight block"`
- Content area: `role="textbox"` with `aria-multiline="true"`

#### Unit Test Checklist

- [ ] Content area is editable and emits `changed` on input
- [ ] Tags from block data render as TagChip components
- [ ] Adding a tag via TagInput emits `changed` with updated tags array
- [ ] `readOnly=true` disables content area and tag input
- [ ] Empty content area shows placeholder text

#### Storybook Story Outline

- **Default** — insight with two tags
- **Empty** — no content, placeholder visible
- **Read Only** — static display

---

### WarningBlock

**Selector:** `lore-warning-block`
**File:** `src/app/features/blocks/warning-block/warning-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `WarningBlockData` | — | Yes | Block data: `{id, message, severity}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `WarningBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<WarningBlockData>` | `input value` | Local editable copy |

#### Template Summary

An amber/red-accented card with a `⚠ Warning` header badge and severity selector (Info / Warning / Critical). The `message` field is a single-rich-text area. Severity drives the accent color: info=blue, warning=amber, critical=red.

#### SCSS / Tailwind Strategy

Card background and border-left color driven by severity: `--color-warning-info`, `--color-warning-warn`, `--color-warning-critical`. Icon is an SVG warning triangle.

#### Accessibility

- ARIA role: `group` with `aria-label="Warning block, severity: [severity]"`
- Severity selector: `role="radiogroup"` with `role="radio"` options

#### Unit Test Checklist

- [ ] Info severity applies blue accent
- [ ] Warning severity applies amber accent
- [ ] Critical severity applies red accent
- [ ] Message edit emits `changed`
- [ ] Severity change emits `changed` with new severity

#### Storybook Story Outline

- **Info** — blue variant
- **Warning** — amber variant
- **Critical** — red variant
- **Read Only** — static display

---

### QuoteBlock

**Selector:** `lore-quote-block`
**File:** `src/app/features/blocks/quote-block/quote-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `QuoteBlockData` | — | Yes | Block data: `{id, quote, attribution, source}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `QuoteBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<QuoteBlockData>` | `input value` | Local editable copy |

#### Template Summary

A classic blockquote style with a large left quotation mark glyph (rendered as `::before` pseudo-element), an italic `quote` text area, and below it a `— attribution, source` line rendered in muted text. Source can optionally be a URL that renders as an external link.

#### SCSS / Tailwind Strategy

`blockquote` element styled with `border-left: 4px solid var(--color-accent); padding-left: 24px`. Attribution: `font-style: normal; color: var(--color-text-secondary); font-size: 0.875rem`. Large quote glyph: `font-size: 4rem; line-height: 0; color: var(--color-accent-subtle)`.

#### Accessibility

- ARIA role: `group` with `aria-label="Quote block"`
- Quote text: `blockquote` element semantically

#### Unit Test Checklist

- [ ] Quote text rendered in italic style
- [ ] Attribution and source render below quote
- [ ] Source URL rendered as external `<a>` link when present
- [ ] Editing quote text emits `changed`
- [ ] `readOnly=true` makes fields non-editable

#### Storybook Story Outline

- **With Attribution** — quote with author and source
- **Without Attribution** — bare quote
- **With URL Source** — clickable source link

---

### KeyDifferencesBlock

**Selector:** `lore-key-differences-block`
**File:** `src/app/features/blocks/key-differences-block/key-differences-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `KeyDifferencesBlockData` | — | Yes | Block data: `{id, title, columns: DiffColumn[]}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `KeyDifferencesBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<KeyDifferencesBlockData>` | `input value` | Local copy |

#### Template Summary

A comparison table card with a `⇄ Key Differences` header badge. Columns (`DiffColumn[]` with `label` and `points[]`) are rendered side-by-side. Each column has an editable label header and a list of bullet points. An "Add column" button and "Add point" per-column button allow expansion. Column count max is 4.

#### SCSS / Tailwind Strategy

Grid: `display: grid; grid-template-columns: repeat([n], 1fr); gap: 16px`. Column headers: `font-weight: 600; border-bottom: 2px solid var(--color-border)`. Bullet points: `list-style: disc; padding-left: 16px`.

#### Accessibility

- ARIA role: `group` with `aria-label="Key Differences block"`
- Column grid: `role="table"` with `role="columnheader"` per column

#### Unit Test Checklist

- [ ] Renders correct number of columns from block data
- [ ] Adding a column emits `changed` with new column
- [ ] Adding a point to a column emits `changed`
- [ ] Column label edit emits `changed`
- [ ] Maximum 4 columns enforced (add-column button disabled at 4)

#### Storybook Story Outline

- **Two Columns** — default comparison
- **Four Columns** — maximum columns
- **Read Only** — static comparison table

---

### KeyFindingsBlock

**Selector:** `lore-key-findings-block`
**File:** `src/app/features/blocks/key-findings-block/key-findings-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `KeyFindingsBlockData` | — | Yes | Block data: `{id, title, findings: Finding[]}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `KeyFindingsBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `localBlock` | `Signal<KeyFindingsBlockData>` | `input value` | Local copy |

#### Template Summary

A `🔍 Key Findings` card with a numbered or bulleted list of `Finding` objects, each with a `text` and optional `importance` level (High/Medium/Low). An importance indicator dot is shown beside each finding. "Add finding" button appends a new empty item at the bottom.

#### SCSS / Tailwind Strategy

Findings list: `counter-reset: findings; list-style: none`. Each item: `counter-increment: findings` with `::before` showing the counter. Importance colors: High=`var(--color-critical)`, Medium=`var(--color-warning)`, Low=`var(--color-info)`.

#### Accessibility

- ARIA role: `group` with `aria-label="Key Findings block"`
- List: `role="list"`, items `role="listitem"`

#### Unit Test Checklist

- [ ] All findings from block data are rendered
- [ ] Importance dot colors match importance level
- [ ] Adding a finding emits `changed` with appended finding
- [ ] Removing a finding emits `changed` with filtered array
- [ ] Finding text edit emits `changed`

#### Storybook Story Outline

- **Default** — three findings with mixed importance
- **Single Finding** — minimal state
- **Read Only** — static list

---

### ChecklistBlock

**Selector:** `lore-checklist-block`
**File:** `src/app/features/blocks/checklist-block/checklist-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `ChecklistBlockData` | — | Yes | Block data: `{id, title, items: CheckItem[]}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `ChecklistBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `completionRate` | `Signal<number>` | `computed` | Percentage of checked items |

#### Template Summary

A `☑ Checklist` header with a progress bar showing `completionRate`. Items render as styled checkboxes with editable label text. Completed items show strikethrough text. "Add item" button appends a new unchecked item. Items are reorderable via drag handle.

#### SCSS / Tailwind Strategy

Progress bar: `height: 4px; background: var(--color-surface-2); border-radius: 2px`. Fill: `background: var(--color-accent); transition: width 300ms`. Completed item text: `text-decoration: line-through; color: var(--color-text-secondary)`.

#### Accessibility

- ARIA role: `group` with `aria-label="Checklist block"`
- Each checkbox: native `<input type="checkbox">` with associated `<label>`
- Progress bar: `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`

#### Unit Test Checklist

- [ ] Renders all checklist items from block data
- [ ] Checking an item updates `completionRate` signal
- [ ] Progress bar width matches `completionRate`
- [ ] Completed items have strikethrough class
- [ ] Adding an item emits `changed` with new item appended
- [ ] `readOnly=true` disables checkboxes and add button

#### Storybook Story Outline

- **Empty** — no items
- **Partial** — 3 of 5 items checked
- **Complete** — all items checked, progress bar full
- **Read Only** — static checklist

---

### TableBlock

**Selector:** `lore-table-block`
**File:** `src/app/features/blocks/table-block/table-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `TableBlockData` | — | Yes | Block data: `{id, headers: string[], rows: string[][]}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `TableBlockData` | Updated table data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `selectedCell` | `Signal<{row: number; col: number} \| null>` | `null` | Currently selected cell |
| `localBlock` | `Signal<TableBlockData>` | `input value` | Editable local copy |

#### Template Summary

A full-width HTML `<table>` with editable header cells (`<th>`) and body cells (`<td>`). Each cell is a `contenteditable` div inside the table cell. Toolbar above the table: Add Row, Add Column, Delete Row, Delete Column buttons. Column resize handles between header cells. A `⊞ Table` label badge sits above.

#### SCSS / Tailwind Strategy

Table: `width: 100%; border-collapse: collapse`. Cells: `border: 1px solid var(--color-border); padding: 8px; min-width: 80px`. Selected cell: `outline: 2px solid var(--color-accent)`. Header cells: `background: var(--color-surface-2); font-weight: 600`.

#### Accessibility

- ARIA role: `group` wrapping table; native `<table>` with `<th scope="col">` headers
- Cell navigation:
  - `Tab` → next cell
  - `Shift+Tab` → previous cell
  - `Arrow Keys` → directional cell navigation
  - `Enter` → confirm edit, move to next row

#### Unit Test Checklist

- [ ] Renders correct number of columns from `headers` array
- [ ] Renders correct number of rows from `rows` array
- [ ] Add Row button appends empty row and emits `changed`
- [ ] Add Column button appends empty column to headers and all rows
- [ ] Delete Row removes selected row and emits `changed`
- [ ] Cell edit emits `changed` with updated cell value
- [ ] Arrow key navigation moves `selectedCell` signal

#### Storybook Story Outline

- **Default** — 3×4 table with data
- **Empty** — no data rows, headers only
- **Large** — 8×10 table with scroll
- **Read Only** — non-editable table

---

### CodeBlock

**Selector:** `lore-code-block`
**File:** `src/app/features/blocks/code-block/code-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `CodeBlockData` | — | Yes | Block data: `{id, code, language, showLineNumbers}` |
| `readOnly` | `boolean` | `false` | No | Disables editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `CodeBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `copied` | `Signal<boolean>` | `false` | Transient copy-to-clipboard state |
| `selectedLanguage` | `Signal<string>` | `block.language` | Currently selected syntax language |

#### Template Summary

A dark-themed code editor card with a `{ } Code` header badge. The header row shows a language selector dropdown and a copy button. The code area uses a `<pre><code>` block with syntax highlighting applied via a pure pipe wrapping a highlight library (Highlight.js tokens). Line numbers are conditionally rendered in a left gutter. Font is `JetBrains Mono`.

#### SCSS / Tailwind Strategy

Container: `background: var(--color-code-bg); border-radius: var(--radius-card)`. Code: `font-family: var(--font-mono); font-size: 13px; tab-size: 2; white-space: pre`. Line numbers gutter: `user-select: none; color: var(--color-text-tertiary); text-align: right; padding-right: 16px`.

#### Accessibility

- ARIA role: `group` with `aria-label="Code block, language: [language]"`
- Code area: `role="textbox"` with `aria-multiline="true"` and `aria-label="Code content"`
- Copy button: `aria-label="Copy code"`, changes to `"Copied!"` after action
- Keyboard interaction map:
  - `Tab` inside code area → insert tab character (not move focus)
  - `Shift+Tab` → dedent selection

#### Unit Test Checklist

- [ ] Renders code with `JetBrains Mono` font family
- [ ] Language selector shows current language and emits `changed` on selection
- [ ] Copy button sets `copied` signal true for 2 seconds
- [ ] Line numbers visible when `showLineNumbers=true`
- [ ] Code content edit emits `changed` with updated code string
- [ ] `readOnly=true` makes code area non-editable but copy still works

#### Storybook Story Outline

- **Default** — TypeScript code snippet, no line numbers
- **With Line Numbers** — Python snippet with line numbers
- **Copied State** — copy button in confirmed state
- **Read Only** — static code display

---

### ImageBlock

**Selector:** `lore-image-block`
**File:** `src/app/features/blocks/image-block/image-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `ImageBlockData` | — | Yes | Block data: `{id, src, alt, caption, width, alignment}` |
| `readOnly` | `boolean` | `false` | No | Disables editing controls |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `ImageBlockData` | Updated block data |
| `uploadRequested` | `void` | User clicked upload/replace button |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `loading` | `Signal<boolean>` | `false` | Image loading state |
| `resizing` | `Signal<boolean>` | `false` | User is dragging resize handle |

#### Template Summary

Renders an `<img>` element with configurable width (drag resize handle on right edge) and alignment (left/center/right via toolbar). Below the image, an editable `caption` text field is displayed in muted italic style. When no `src` is set, shows a dashed upload drop zone. A replace/upload button appears on hover when not in read-only mode.

#### SCSS / Tailwind Strategy

Image: `max-width: 100%; height: auto; display: block`. Resize handle: `position: absolute; right: -6px; width: 12px; height: 100%; cursor: ew-resize`. Caption: `font-style: italic; font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 8px`.

#### Accessibility

- ARIA role: `figure` wrapping image and caption
- `<img>` has `alt` binding from block data
- `<figcaption>` semantic element for caption
- Upload zone: `role="button"` with `aria-label="Upload image"`

#### Unit Test Checklist

- [ ] `<img>` renders when `src` is provided
- [ ] Upload drop zone renders when `src` is null
- [ ] Caption edit emits `changed` with updated caption
- [ ] Resize drag updates `block.width` and emits `changed`
- [ ] Alignment toggle updates `block.alignment` and emits `changed`
- [ ] `loading` signal shows skeleton while image loads

#### Storybook Story Outline

- **With Image** — loaded image with caption
- **Upload Zone** — empty state, drag-and-drop zone
- **Loading** — skeleton placeholder
- **Read Only** — image without controls

---

### DividerBlock

**Selector:** `lore-divider-block`
**File:** `src/app/features/blocks/divider-block/divider-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `DividerBlockData` | — | Yes | Block data: `{id, style: 'solid' \| 'dashed' \| 'dotted', label}` |
| `readOnly` | `boolean` | `false` | No | Disables style picker |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `DividerBlockData` | Updated block data |

#### Internal State (Signals / BehaviorSubjects)

*None*

#### Template Summary

A full-width horizontal rule element. If `label` is set, the label text appears centered over the rule. Style (`solid`, `dashed`, `dotted`) drives the `border-style`. A minimal style picker appears on hover for non-read-only mode.

#### SCSS / Tailwind Strategy

Host: `display: flex; align-items: center; gap: 16px`. Rule: `flex: 1; border: 0; border-top: 1px [style] var(--color-border)`. Label: `font-size: 12px; color: var(--color-text-tertiary); white-space: nowrap`.

#### Accessibility

- ARIA role: `separator` with `aria-orientation="horizontal"`
- `aria-label` includes label text if present

#### Unit Test Checklist

- [ ] Solid style renders solid border
- [ ] Dashed style renders dashed border
- [ ] Dotted style renders dotted border
- [ ] Label text renders centered over rule
- [ ] Style picker change emits `changed` with new style

#### Storybook Story Outline

- **Solid** — default divider
- **Dashed** — dashed style
- **With Label** — labeled section divider

---

### AskClaudeBlock

**Selector:** `lore-ask-claude-block`
**File:** `src/app/features/blocks/ask-claude-block/ask-claude-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `AskClaudeBlockData` | — | Yes | Block data: `{id, prompt, response, model, status}` |
| `readOnly` | `boolean` | `false` | No | Disables prompt editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `AskClaudeBlockData` | Updated block data |
| `runRequested` | `{blockId: string; prompt: string; model: string}` | User clicked Run |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `streaming` | `Signal<boolean>` | `false` | Whether SSE stream is active |
| `streamedText` | `Signal<string>` | `''` | Accumulated streaming response text |
| `status` | `Signal<'idle' \| 'running' \| 'done' \| 'error'>` | `'idle'` | Current execution status |

#### Template Summary

A purple-branded `🤖 Ask Claude` card with a prompt text area, a model selector (piped from `ModelPicker`), and a Run button. When running, the Run button becomes a Stop button and `streamedText` is rendered in a response area below with a blinking cursor. Response arrives via SSE (Server-Sent Events): the parent service connects the stream and calls a method on this component (or updates an observable) with each chunk. Once complete, the full response is saved to `block.response` and emits `changed`. An error state shows the error message with a retry option.

#### SCSS / Tailwind Strategy

Card: `border-left: 4px solid var(--color-accent); background: var(--color-accent-subtle)`. Response area: `font-family: var(--font-body); line-height: 1.6; white-space: pre-wrap`. Streaming cursor: `animation: blink 1s step-end infinite`. Run button: `background: var(--color-accent); color: white`.

#### Accessibility

- ARIA role: `group` with `aria-label="Ask Claude block"`
- Response area: `aria-live="polite"` for streaming content announcements
- Run button: `aria-busy="true"` while streaming
- Stop button: `aria-label="Stop generation"`
- Keyboard interaction map:
  - `⌘Enter` → run prompt
  - `Escape` → stop streaming

#### Unit Test Checklist

- [ ] Prompt textarea renders and emits changes
- [ ] Run button click emits `runRequested` with prompt and model
- [ ] `streaming=true` shows Stop button instead of Run
- [ ] `streamedText` signal updates render in response area without full re-render
- [ ] `aria-live` region announced new content during streaming
- [ ] Error status shows error message and retry button
- [ ] On completion, `changed` emits with final response saved to block data
- [ ] Stop button click halts stream and saves partial response

#### Storybook Story Outline

- **Idle** — empty prompt, ready to run
- **Running / Streaming** — mid-stream with partial text rendering
- **Complete** — full response displayed
- **Error** — error message with retry button

---

### AskGptBlock

**Selector:** `lore-ask-gpt-block`
**File:** `src/app/features/blocks/ask-gpt-block/ask-gpt-block.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `block` | `AskGptBlockData` | — | Yes | Block data: `{id, prompt, response, model, status}` |
| `readOnly` | `boolean` | `false` | No | Disables prompt editing |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `changed` | `AskGptBlockData` | Updated block data |
| `runRequested` | `{blockId: string; prompt: string; model: string}` | User clicked Run |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `streaming` | `Signal<boolean>` | `false` | Whether SSE stream is active |
| `streamedText` | `Signal<string>` | `''` | Accumulated streaming response text |
| `status` | `Signal<'idle' \| 'running' \| 'done' \| 'error'>` | `'idle'` | Current execution status |

#### Template Summary

Structurally identical to `AskClaudeBlock` but uses green OpenAI branding (`🤖 Ask GPT` label, `--color-gpt` token) and offers GPT-model options via `ModelPicker`. Streaming is handled identically via SSE chunks. The Run button shows a GPT logo icon. Error messages include an API key misconfiguration hint when the error indicates an auth failure.

#### SCSS / Tailwind Strategy

Card: `border-left: 4px solid var(--color-gpt); background: var(--color-gpt-subtle)`. Response and controls identical pattern to AskClaudeBlock. Model picker filters to GPT model options.

#### Accessibility

- ARIA role: `group` with `aria-label="Ask GPT block"`
- `aria-live="polite"` on response region
- `aria-busy` on Run button while streaming
- Identical keyboard map to AskClaudeBlock

#### Unit Test Checklist

- [ ] Green GPT branding renders (color token applied)
- [ ] Run button click emits `runRequested`
- [ ] Streaming state shows Stop button
- [ ] `streamedText` accumulates SSE chunks correctly
- [ ] Auth error displays API key hint message
- [ ] `changed` emits with final response on completion
- [ ] Model picker shows only GPT models

#### Storybook Story Outline

- **Idle** — empty prompt with GPT branding
- **Streaming** — mid-stream partial response
- **Complete** — full GPT response
- **Auth Error** — API key error with hint

---

## Linking & Tags

---

### LinkPicker

**Selector:** `lore-link-picker`
**File:** `src/app/features/linking/link-picker/link-picker.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `query` | `string` | `''` | No | Initial search query (from `[[` trigger text) |
| `excludeIds` | `string[]` | `[]` | No | Note IDs to exclude from results |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `noteSelected` | `NoteRef` | User selected a note to link |
| `dismissed` | `void` | Picker closed without selection |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `searchQuery` | `Signal<string>` | `input query` | Current search string |
| `results` | `Signal<NoteRef[]>` | `[]` | Filtered note results |
| `activeIndex` | `Signal<number>` | `0` | Keyboard-navigated result index |
| `loading` | `Signal<boolean>` | `false` | Search request in flight |

#### Template Summary

A floating popover panel (CDK Overlay) with a search input at the top and a scrollable list of matching `NoteRef` items below. Each result row shows the note type icon, title, and notebook breadcrumb. Typing updates `searchQuery` which triggers a debounced search. Keyboard arrows navigate `activeIndex`; Enter selects. Empty state shows "No matching notes" when `results` is empty.

#### SCSS / Tailwind Strategy

Panel: `width: 320px; max-height: 320px; overflow-y: auto; background: var(--color-surface); border-radius: var(--radius-card); box-shadow: var(--shadow-panel)`. Result row: `height: 40px; padding: 0 12px`. Active row: `background: var(--color-accent-subtle)`.

#### Accessibility

- ARIA role: `combobox` on input, `listbox` on results, `option` per result
- `aria-activedescendant` on input pointing to active result id
- Keyboard interaction map:
  - `Arrow Down` / `Arrow Up` → navigate results
  - `Enter` → select active result
  - `Escape` → dismiss without selection

#### Unit Test Checklist

- [ ] Renders results matching `query` input
- [ ] Typing in search input updates `searchQuery` and re-filters results
- [ ] Arrow navigation increments/decrements `activeIndex`
- [ ] Enter on active result emits `noteSelected`
- [ ] `dismisseed` emits on Escape
- [ ] Empty state message shows when `results` is empty

#### Storybook Story Outline

- **With Results** — query matching several notes
- **No Results** — empty state message
- **Loading** — skeleton rows while searching
- **Keyboard Navigation** — third item active

---

### BacklinkChip

**Selector:** `lore-backlink-chip`
**File:** `src/app/features/linking/backlink-chip/backlink-chip.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `note` | `NoteRef` | — | Yes | The linked note reference |
| `context` | `string` | `''` | No | Short excerpt of surrounding text |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `clicked` | `NoteRef` | User clicked the chip to navigate |
| `removeRequested` | `NoteRef` | Remove-link button clicked |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `hovered` | `Signal<boolean>` | `false` | Hover state for showing remove button |

#### Template Summary

An inline pill element with a note type icon and note title. On hover, an `×` remove button appears. Clicking the chip navigates to the linked note. A tooltip on hover shows the `context` excerpt.

#### SCSS / Tailwind Strategy

Chip: `display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: var(--color-accent-subtle); border-radius: 999px; font-size: 13px`. Remove button: `opacity: 0` → `opacity: 1` on hover.

#### Accessibility

- ARIA role: `link` with `aria-label="Linked note: [NoteTitle]"`
- Remove button: `aria-label="Remove link to [NoteTitle]"`

#### Unit Test Checklist

- [ ] Note title and type icon render
- [ ] Click emits `clicked` with NoteRef
- [ ] Remove button visible on hover
- [ ] Remove click emits `removeRequested`
- [ ] Tooltip shows context excerpt on hover

#### Storybook Story Outline

- **Default** — chip with linked note
- **Hovered** — remove button visible
- **Long Title** — truncated title chip

---

### TagChip

**Selector:** `lore-tag-chip`
**File:** `src/app/features/linking/tag-chip/tag-chip.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `tag` | `Tag` | — | Yes | Tag object with `{id, label, color}` |
| `removable` | `boolean` | `true` | No | Whether to show remove button |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `clicked` | `Tag` | Chip clicked (filter by tag) |
| `removeRequested` | `Tag` | Remove button clicked |

#### Internal State (Signals / BehaviorSubjects)

*None*

#### Template Summary

A compact pill with a color dot and tag label. If `removable`, an `×` button is rendered on the right. The color dot uses `tag.color` or a default accent color.

#### SCSS / Tailwind Strategy

Chip: `display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 999px; border: 1px solid [tag.color]`. Color dot: `width: 8px; height: 8px; border-radius: 50%; background: [tag.color]`.

#### Accessibility

- ARIA role: `button` when `removable`, otherwise `status`
- `aria-label="Tag: [label]"`

#### Unit Test Checklist

- [ ] Renders tag label and color dot
- [ ] `removable=false` hides remove button
- [ ] Remove button click emits `removeRequested`
- [ ] Click emits `clicked` with Tag object

#### Storybook Story Outline

- **Default** — removable tag chip
- **Non-removable** — display-only chip
- **Custom Color** — colored tag chip

---

### TagInput

**Selector:** `lore-tag-input`
**File:** `src/app/features/linking/tag-input/tag-input.component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `tags` | `Tag[]` | `[]` | No | Currently applied tags |
| `suggestions` | `Tag[]` | `[]` | No | Available tag suggestions |
| `placeholder` | `string` | `'Add tag...'` | No | Input placeholder text |

#### Outputs

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `tagAdded` | `Tag` | New tag applied |
| `tagRemoved` | `Tag` | Tag removed |

#### Internal State (Signals / BehaviorSubjects)

| Signal/Subject | Type | Initial Value | Description |
|---------------|------|---------------|-------------|
| `inputValue` | `Signal<string>` | `''` | Current text in the input |
| `dropdownOpen` | `Signal<boolean>` | `false` | Suggestion dropdown visibility |
| `filteredSuggestions` | `Signal<Tag[]>` | `computed` | Suggestions filtered by `inputValue` |

#### Template Summary

An inline input that sits after the existing TagChip elements within a flex-wrap container. As the user types, a dropdown of `filteredSuggestions` appears. Pressing Enter or clicking a suggestion adds the tag. Pressing Backspace on an empty input removes the last tag. New tags not in suggestions are created with a default color on Enter.

#### SCSS / Tailwind Strategy

Container: `display: flex; flex-wrap: wrap; gap: 4px; align-items: center; min-height: 32px; border: 1px solid var(--color-border); border-radius: 6px; padding: 4px`. Input: `border: none; outline: none; flex: 1; min-width: 80px`. Dropdown: floating CDK overlay below input.

#### Accessibility

- ARIA role: `combobox` on input with `aria-autocomplete="list"`, `aria-expanded` reflecting `dropdownOpen`
- Existing tags as chips with remove buttons are before input in DOM order

#### Unit Test Checklist

- [ ] Existing tags render as TagChip before input
- [ ] Typing filters `filteredSuggestions`
- [ ] Selecting suggestion emits `tagAdded`
- [ ] Enter on custom input creates new tag and emits `tagAdded`
- [ ] Backspace on empty input emits `tagRemoved` for last tag

#### Storybook Story Outline

- **Empty** — no tags, placeholder visible
- **With Tags** — three tags applied
- **Dropdown Open** — typing with suggestion list visible

---