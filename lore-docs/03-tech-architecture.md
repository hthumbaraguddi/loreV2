# Lore — Technical Architecture Document
Version: 1.0
Status: Engineering Source of Truth — Pre-implementation
Last Updated: 2025-Q2

---

## 1. Architecture Overview

### System Context (C4 Level 1)

Lore is a **browser-only, offline-first** Angular single-page application. There is no custom backend. All persistence is local (localStorage / IndexedDB), and the app communicates directly with two external APIs.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Lore SPA (Angular 17+)                       │   │
│  │                                                                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐  │   │
│  │  │  Editor    │  │ AI Layer   │  │  Sync    │  │ Scheduler │  │   │
│  │  │  Engine    │  │ (Services) │  │ Service  │  │ (Worker)  │  │   │
│  │  └────────────┘  └────────────┘  └──────────┘  └───────────┘  │   │
│  │         │               │              │               │        │   │
│  │  ┌──────┴───────────────┴──────────────┴───────────────┘        │   │
│  │  │          localStorage / IndexedDB (offline store)            │   │
│  │  └──────────────────────────────────────────────────────────────┘   │
│  └─────────────────────────────────────────────────────────────────┘   │
│          │                          │                                   │
└──────────┼──────────────────────────┼───────────────────────────────────┘
           │                          │
           ▼                          ▼
  ┌────────────────┐         ┌────────────────────┐
  │ Anthropic API  │         │  GitHub Gist API   │
  │ /v1/messages   │         │  REST + OAuth      │
  │ (SSE stream)   │         │  (cloud backup)    │
  └────────────────┘         └────────────────────┘

  [ Optional Future ]
  ┌────────────────────────────────┐
  │ Lore Backend (not in scope v1) │
  │ - Shared notebooks             │
  │ - Auth (multi-device)          │
  │ - Scheduled run execution      │
  └────────────────────────────────┘
```

### System Boundaries

| Boundary | Responsible Party | Notes |
|---|---|---|
| API keys | User-provided; stored in encrypted localStorage | Never committed to code |
| AI requests | Browser → Anthropic direct (no proxy) | CORS allowed by Anthropic for browser fetch |
| Cloud sync | Browser → GitHub Gist REST API | OAuth token stored in localStorage |
| Cron execution | Browser Web Worker | Runs only while tab is open; acknowledged limitation |
| Offline data | localStorage (notes/settings) + IndexedDB (large blobs) | Sync on reconnect |

---

## 2. Angular Project Structure

```
src/
├── app/
│   ├── core/                          # Singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── note.service.ts
│   │   │   ├── block.service.ts
│   │   │   ├── editor.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── prompt.service.ts
│   │   │   ├── scheduler.service.ts
│   │   │   ├── search.service.ts
│   │   │   ├── graph.service.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── theme.service.ts
│   │   │   └── template.service.ts
│   │   ├── guards/
│   │   │   ├── note-exists.guard.ts
│   │   │   └── unsaved-changes.guard.ts
│   │   ├── interceptors/              # (empty in v1; reserved for future proxy)
│   │   ├── errors/
│   │   │   ├── global-error-handler.ts
│   │   │   └── error.models.ts
│   │   ├── storage/
│   │   │   ├── local-storage.service.ts
│   │   │   ├── indexed-db.service.ts
│   │   │   └── storage.migrations.ts  # versioned migration runners
│   │   └── core.providers.ts          # provideCore() export consumed by app.config.ts
│   │
│   ├── features/
│   │   ├── shell/                     # Root layout: nav-rail + outlet
│   │   │   ├── shell.component.ts
│   │   │   ├── nav-rail/
│   │   │   │   ├── nav-rail.component.ts
│   │   │   │   └── nav-rail-item/
│   │   │   │       └── nav-rail-item.component.ts
│   │   │   └── shell.routes.ts
│   │   │
│   │   ├── sidebar/                   # Collapsible 3-level hierarchy
│   │   │   ├── sidebar.component.ts
│   │   │   ├── shelf-list/
│   │   │   │   └── shelf-list.component.ts
│   │   │   ├── notebook-list/
│   │   │   │   └── notebook-list.component.ts
│   │   │   ├── note-list/
│   │   │   │   └── note-list.component.ts    # CDK virtual scroll
│   │   │   └── sidebar.routes.ts
│   │   │
│   │   ├── editor/                    # Split-pane editor engine
│   │   │   ├── editor-workspace/
│   │   │   │   └── editor-workspace.component.ts   # pane manager
│   │   │   ├── editor-pane/
│   │   │   │   └── editor-pane.component.ts        # single pane host
│   │   │   ├── note-header/
│   │   │   │   └── note-header.component.ts
│   │   │   ├── block-list/
│   │   │   │   └── block-list.component.ts         # CDK drag-drop
│   │   │   ├── blocks/                # One component per block type
│   │   │   │   ├── block-host/
│   │   │   │   │   └── block-host.component.ts     # dynamic block renderer
│   │   │   │   ├── hypothesis-block/
│   │   │   │   ├── conclusion-block/
│   │   │   │   ├── note-block/
│   │   │   │   ├── warning-block/
│   │   │   │   ├── quote-block/
│   │   │   │   ├── key-differences-block/
│   │   │   │   ├── key-findings-block/
│   │   │   │   ├── checklist-block/
│   │   │   │   ├── table-block/
│   │   │   │   ├── code-block/
│   │   │   │   ├── image-block/
│   │   │   │   ├── divider-block/
│   │   │   │   ├── ask-claude-block/
│   │   │   │   └── ask-gpt-block/
│   │   │   ├── block-toolbar/
│   │   │   │   └── block-toolbar.component.ts
│   │   │   ├── block-comment/
│   │   │   │   ├── block-comment-thread/
│   │   │   │   └── block-comment-input/
│   │   │   ├── canvas-overlay/        # Plain/dot/grid/lined canvas renderer
│   │   │   │   └── canvas-overlay.component.ts
│   │   │   ├── note-linker/           # [[note linker input
│   │   │   │   └── note-linker.component.ts
│   │   │   └── editor.routes.ts
│   │   │
│   │   ├── context-panel/             # Right panel: stats, tags, graph
│   │   │   ├── context-panel.component.ts
│   │   │   ├── note-stats/
│   │   │   ├── tags-panel/
│   │   │   ├── linked-notes/
│   │   │   └── mini-graph/
│   │   │
│   │   ├── ai-chat/                   # AI chat sidebar
│   │   │   ├── ai-chat.component.ts
│   │   │   ├── chat-message/
│   │   │   ├── chat-input/
│   │   │   ├── model-switcher/
│   │   │   └── save-as-block/
│   │   │
│   │   ├── prompt-library/            # Prompt CRUD + scheduler
│   │   │   ├── prompt-library.component.ts
│   │   │   ├── prompt-list/
│   │   │   ├── prompt-editor/
│   │   │   ├── variable-substitutor/
│   │   │   └── prompt-scheduler/
│   │   │
│   │   ├── scheduler/                 # Scheduled runs dashboard
│   │   │   ├── scheduler.component.ts
│   │   │   ├── run-countdown/
│   │   │   ├── run-history/
│   │   │   └── run-output/
│   │   │
│   │   ├── knowledge-graph/           # SVG graph view
│   │   │   ├── knowledge-graph.component.ts
│   │   │   ├── graph-canvas/
│   │   │   ├── node-inspector/
│   │   │   └── graph-legend/
│   │   │
│   │   ├── search/                    # Global search overlay
│   │   │   ├── search-overlay.component.ts
│   │   │   ├── search-input/
│   │   │   ├── search-filters/
│   │   │   └── search-results/
│   │   │
│   │   ├── notifications/             # Notification center
│   │   │   ├── notification-center.component.ts
│   │   │   └── notification-item/
│   │   │
│   │   ├── sharing/                   # Note sharing modal
│   │   │   ├── share-modal.component.ts
│   │   │   ├── share-link/
│   │   │   └── share-embed/
│   │   │
│   │   ├── quick-capture/             # FAB → Inbox
│   │   │   ├── quick-capture-fab.component.ts
│   │   │   └── quick-capture-modal.component.ts
│   │   │
│   │   └── settings/                  # 6-tab settings page
│   │       ├── settings.component.ts
│   │       ├── ai-providers-tab/
│   │       ├── profile-tab/
│   │       ├── ai-behaviour-tab/
│   │       ├── sync-export-tab/
│   │       ├── templates-tab/
│   │       └── appearance-tab/
│   │
│   ├── shared/                        # Shared UI components, pipes, directives
│   │   ├── components/
│   │   │   ├── button/
│   │   │   ├── badge/
│   │   │   ├── chip/
│   │   │   ├── tooltip/
│   │   │   ├── modal/
│   │   │   ├── popover/
│   │   │   ├── icon/
│   │   │   ├── spinner/
│   │   │   ├── empty-state/
│   │   │   └── confirm-dialog/
│   │   ├── pipes/
│   │   │   ├── relative-time.pipe.ts
│   │   │   ├── word-count.pipe.ts
│   │   │   └── highlight.pipe.ts
│   │   ├── directives/
│   │   │   ├── content-editable.directive.ts
│   │   │   ├── autofocus.directive.ts
│   │   │   └── click-outside.directive.ts
│   │   └── models/
│   │       ├── note.models.ts
│   │       ├── block.models.ts
│   │       ├── ai.models.ts
│   │       ├── prompt.models.ts
│   │       ├── scheduler.models.ts
│   │       ├── sync.models.ts
│   │       └── settings.models.ts
│   │
│   ├── workers/
│   │   └── scheduler.worker.ts        # Web Worker for cron execution
│   │
│   ├── app.component.ts               # Root: router-outlet + overlays
│   ├── app.config.ts                  # provideRouter, provideCore, etc.
│   └── app.routes.ts                  # Top-level route definitions
│
├── assets/
│   ├── icons/                         # Phosphor SVG sprites
│   └── fonts/                         # (empty — Google Fonts CDN)
│
├── styles/
│   ├── _tokens.scss                   # All CSS custom properties
│   ├── _reset.scss
│   ├── _typography.scss
│   ├── _utilities.scss
│   └── styles.scss                    # Global entry; imports above
│
└── environments/
    ├── environment.ts
    └── environment.production.ts
```

---

## 3. Feature Module Breakdown

| Feature Area | Folder | Key Files | Lazy Loaded? | Key Dependencies |
|---|---|---|---|---|
| Shell / Layout | `features/shell` | `shell.component.ts`, `nav-rail.component.ts` | No — eagerly loaded root | `ThemeService`, `NotificationService` |
| Sidebar | `features/sidebar` | `sidebar.component.ts`, `note-list.component.ts` | No — always visible | `NoteService`, `CDK ScrollingModule` |
| Editor | `features/editor` | `editor-workspace.component.ts`, `block-list.component.ts`, `block-host.component.ts` | No — primary surface | `BlockService`, `EditorService`, `CDK DragDropModule` |
| Context Panel | `features/context-panel` | `context-panel.component.ts`, `mini-graph` | No | `NoteService`, `GraphService` |
| AI Chat Sidebar | `features/ai-chat` | `ai-chat.component.ts` | Yes | `AIService` |
| Prompt Library | `features/prompt-library` | `prompt-library.component.ts`, `prompt-editor` | Yes | `PromptService`, `SchedulerService` |
| Scheduler Dashboard | `features/scheduler` | `scheduler.component.ts`, `run-history` | Yes | `SchedulerService` |
| Knowledge Graph | `features/knowledge-graph` | `knowledge-graph.component.ts`, `graph-canvas` | Yes — heavy SVG | `GraphService`, `NoteService` |
| Search | `features/search` | `search-overlay.component.ts` | Yes | `SearchService` |
| Notifications | `features/notifications` | `notification-center.component.ts` | Yes | `NotificationService` |
| Sharing | `features/sharing` | `share-modal.component.ts` | Yes | `SyncService` |
| Quick Capture | `features/quick-capture` | `quick-capture-fab.component.ts`, `quick-capture-modal.component.ts` | No — FAB always present | `NoteService` |
| Settings | `features/settings` | `settings.component.ts`, 6 tab components | Yes | All services (read settings) |
| Shared UI | `shared/` | All shared components, pipes, directives | N/A — tree-shaken per import | None |
| Core / Services | `core/` | All services, storage, error handler | N/A — eagerly provided | `LocalStorageService`, `IndexedDbService` |

---

## 4. Component Tree

```
AppComponent                           (router-outlet root, overlay host)
├── ShellComponent
│   ├── NavRailComponent
│   │   └── NavRailItemComponent × N   @Input: item; @Output: selected
│   ├── SidebarComponent
│   │   ├── ShelfListComponent         @Input: shelves; @Output: shelfSelected
│   │   │   └── NotebookListComponent  @Input: shelf; @Output: notebookSelected
│   │   │       └── NoteListComponent  @Input: notebookId; @Output: noteOpened
│   │   └── [CDK virtual scroll viewport]
│   ├── EditorWorkspaceComponent       (manages pane[] signal)
│   │   └── EditorPaneComponent × 1–3  @Input: paneId, noteId
│   │       ├── NoteHeaderComponent    @Input: note; @Output: titleChanged
│   │       ├── CanvasOverlayComponent @Input: canvasType
│   │       └── BlockListComponent     @Input: blocks; CDK drag container
│   │           └── BlockHostComponent × N  @Input: block; dynamic component
│   │               ├── [HypothesisBlockComponent]
│   │               ├── [ConclusionBlockComponent]
│   │               ├── [NoteBlockComponent]
│   │               ├── [WarningBlockComponent]
│   │               ├── [QuoteBlockComponent]
│   │               ├── [KeyDifferencesBlockComponent]
│   │               ├── [KeyFindingsBlockComponent]
│   │               ├── [ChecklistBlockComponent]
│   │               ├── [TableBlockComponent]
│   │               ├── [CodeBlockComponent]
│   │               ├── [ImageBlockComponent]
│   │               ├── [DividerBlockComponent]
│   │               ├── [AskClaudeBlockComponent]
│   │               └── [AskGptBlockComponent]
│   │               └── BlockToolbarComponent    @Input: blockId
│   │               └── BlockCommentThreadComponent @Input: blockId
│   ├── ContextPanelComponent
│   │   ├── NoteStatsComponent         @Input: noteId
│   │   ├── TagsPanelComponent         @Input: noteId; @Output: tagAdded/removed
│   │   ├── LinkedNotesComponent       @Input: noteId; @Output: noteOpened
│   │   └── MiniGraphComponent         @Input: noteId
│   └── QuickCaptureFabComponent       @Output: captured
│
├── [Routed overlays via aux outlet]
│   ├── AiChatComponent                (right drawer)
│   ├── SearchOverlayComponent         (Cmd+K portal)
│   ├── NotificationCenterComponent    (top-right drawer)
│   ├── KnowledgeGraphComponent        (full-screen lazy)
│   ├── PromptLibraryComponent         (full-screen lazy)
│   ├── SchedulerComponent             (full-screen lazy)
│   ├── ShareModalComponent            (dialog portal)
│   ├── QuickCaptureModalComponent     (dialog portal)
│   └── SettingsComponent              (full-screen lazy)
│       ├── AiProvidersTabComponent
│       ├── ProfileTabComponent
│       ├── AiBehaviourTabComponent
│       ├── SyncExportTabComponent
│       ├── TemplatesTabComponent
│       └── AppearanceTabComponent
│
└── [Global singletons — not routed]
    └── NoteLinkerComponent            (floating, portal-mounted, triggered by [[)
```

**Data flow conventions:**
- `@Input()` — always typed, never `any`; use `input()` signal-based inputs (Angular 17+)
- `@Output()` — `output<T>()` signal-based outputs
- Services consumed via `inject()` inside components; no constructor injection in standalone components
- No `EventEmitter` bubbling past two levels — communicate via service signal instead

---

## 5. Routing Table

```typescript
// app.routes.ts uses Angular 17 functional route guards and resolvers
```

| Route Path | Component | Guard | Resolve | Notes |
|---|---|---|---|---|
| `/` | Redirect → `/notes` | — | — | — |
| `/notes` | `ShellComponent` (eager) | — | — | Root layout; all child routes render in editor outlet |
| `/notes/:noteId` | `EditorPaneComponent` (within shell) | `noteExistsGuard` | `noteResolver` | Loads note by ID into primary pane |
| `/notes/:noteId/pane2/:note2Id` | `EditorPaneComponent` (secondary pane) | `noteExistsGuard` | `noteResolver` | Split pane 2 |
| `/notes/:noteId/pane3/:note3Id` | `EditorPaneComponent` (tertiary pane) | `noteExistsGuard` | `noteResolver` | Split pane 3 |
| `(aux:graph)` | `KnowledgeGraphComponent` | — | — | Named aux outlet `aux`; lazy; full-screen |
| `(aux:ai-chat)` | `AiChatComponent` | — | — | Named aux outlet; right drawer |
| `(aux:search)` | `SearchOverlayComponent` | — | — | Named aux outlet; keyboard-triggered |
| `(aux:notifications)` | `NotificationCenterComponent` | — | — | Named aux outlet; top-right drawer |
| `(aux:quick-capture)` | `QuickCaptureModalComponent` | — | — | Named aux outlet; dialog |
| `(aux:share)` | `ShareModalComponent` | — | — | Named aux outlet; dialog |
| `/prompts` | `PromptLibraryComponent` | — | — | Lazy; full-screen |
| `/scheduler` | `SchedulerComponent` | — | — | Lazy; full-screen |
| `/settings` | `SettingsComponent` | — | — | Lazy; full-screen |
| `/settings/ai-providers` | `AiProvidersTabComponent` | — | — | Child of `/settings` |
| `/settings/profile` | `ProfileTabComponent` | — | — | Child |
| `/settings/ai-behaviour` | `AiBehaviourTabComponent` | — | — | Child |
| `/settings/sync-export` | `SyncExportTabComponent` | — | — | Child |
| `/settings/templates` | `TemplatesTabComponent` | — | — | Child |
| `/settings/appearance` | `AppearanceTabComponent` | — | — | Child |
| `**` | Redirect → `/notes` | — | — | 404 fallback |

**Note on aux outlet routing:** Overlays (search, AI chat, notifications) are mounted in a named `<router-outlet name="aux">` inside `AppComponent`. This gives them deep-linkable URLs, back-button dismissal, and keeps the overlay state outside the primary route tree.

---

## 6. State Management Strategy

### Decision: Angular Signals + Services — NgRx NOT adopted in v1

**Rationale for ruling out NgRx:**
Lore is a single-user, offline-first app with no concurrent modification problem, no server-sent state reconciliation, and no need for time-travel debugging in production. NgRx adds ~50KB to the bundle, requires significant boilerplate per slice, and slows initial development velocity. The app's state surface — notes, blocks, settings — maps cleanly to injectable signal stores. If Lore ever grows multi-user real-time collaboration or requires reproducible state replay for debugging AI runs, a NgRx slice can be added to the scheduler feature only, without migrating the rest of the app.

**When to add a NgRx slice (decision tree):**
```
Does this state need...
├── Time-travel debugging (e.g., AI run replay)?  → Add NgRx Effects + Store slice
├── Cross-tab synchronisation?                     → Add NgRx + BroadcastChannel effect
├── Optimistic updates with server rollback?       → Add NgRx Effects slice (SyncService only)
└── None of the above?                            → Use Signal-based Service (default)
```

### State Domain Map

#### Notes & Notebooks

```
Owner: NoteService
Lives in: signal<Note[]>(), signal<Notebook[]>(), signal<Shelf[]>()
Updated by: NoteService methods (createNote, updateNote, deleteNote, moveNote)
Subscribed by: SidebarComponent, EditorWorkspaceComponent, ContextPanelComponent
Persisted to: localStorage on every write via effect()
```

#### Editor / Panes

```
Owner: EditorService
Lives in: signal<PaneConfig[]>() (max 3 panes), signal<FocusedPaneId>()
Updated by: EditorService.openInPane(), splitPane(), closePane()
Subscribed by: EditorWorkspaceComponent, NavRailComponent (active note indicator)
NOT persisted: pane layout resets on refresh (open notes restored via lastOpenedNoteIds in settings)
```

#### Blocks

```
Owner: BlockService
Lives in: Map<noteId, signal<Block[]>>()  — per-note signal map
Updated by: BlockService methods (addBlock, updateBlock, moveBlock, deleteBlock)
Subscribed by: BlockListComponent, BlockHostComponent (individual block signals via computed())
Persisted to: localStorage keyed by noteId on every write
Derived: BlockService.blockCount(noteId) → computed(); wordCount(noteId) → computed()
```

#### AI State

```
Owner: AIService
Lives in: signal<AIRequest[]>() (queue), signal<AIStreamState | null>() (active stream)
Updated by: AIService.sendMessage(), cancelStream(), clearQueue()
Subscribed by: AskClaudeBlockComponent, AskGptBlockComponent, AiChatComponent
NOT persisted: stream state is ephemeral; chat history persisted separately in NoteService
```

#### Prompts

```
Owner: PromptService
Lives in: signal<Prompt[]>()
Updated by: PromptService CRUD methods
Subscribed by: PromptLibraryComponent, SchedulerService
Persisted to: localStorage
```

#### Search

```
Owner: SearchService
Lives in: signal<string>() (query), signal<SearchResult[]>() (results), signal<SearchFilter>()
Updated by: SearchService.setQuery() (debounced 300ms), setFilter()
Subscribed by: SearchOverlayComponent, SearchResultsComponent
NOT persisted: ephemeral; search history (last 20 queries) stored in localStorage separately
```

#### Settings

```
Owner: ThemeService (theme subset) + each service reads its own settings slice
Lives in: signal<AppSettings>() in a dedicated SettingsService
Updated by: SettingsService.update() — partial update pattern
Subscribed by: ThemeService, AIService (reads API keys), SyncService (reads Gist token)
Persisted to: localStorage; AES-encrypted for AI key fields (see Section 14)
```

#### Notifications

```
Owner: NotificationService
Lives in: signal<Notification[]>()
Updated by: NotificationService.push(), dismiss(), dismissAll()
Subscribed by: NavRailComponent (badge count), NotificationCenterComponent
NOT persisted: cleared on app restart (cron failure history persisted in SchedulerService)
```

### Effect() Persistence Pattern

Every service that owns persisted state uses Angular's `effect()` to sync signals to localStorage:

```typescript
// Pattern used in NoteService, BlockService, PromptService, SettingsService
effect(() => {
  const notes = this.notes();
  this.storage.set('lore:notes', notes);  // serialise on every signal change
});
```

For high-frequency updates (e.g., block edits during typing), debounce via `toObservable` + `debounceTime` before persisting:

```typescript
toObservable(this.blocks).pipe(
  debounceTime(500),
  takeUntilDestroyed()
).subscribe(blocks => this.storage.set('lore:blocks', blocks));
```

---

## 7. Service Contracts

### 7.1 NoteService

**File:** `core/services/note.service.ts`

```typescript
import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { Shelf, Notebook, Note, NoteType, CanvasType } from '../../shared/models/note.models';
import { LocalStorageService } from '../storage/local-storage.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly storage = inject(LocalStorageService);
  private readonly notifications = inject(NotificationService);

  // ── Signals ──────────────────────────────────────────────────────────────
  readonly shelves = signal<Shelf[]>(this.storage.get<Shelf[]>('lore:shelves') ?? []);
  readonly notebooks = signal<Notebook[]>(this.storage.get<Notebook[]>('lore:notebooks') ?? []);
  readonly notes = signal<Note[]>(this.storage.get<Note[]>('lore:notes') ?? []);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly noteCount = computed(() => this.notes().length);
  readonly inboxNotes = computed(() => this.notes().filter(n => n.isInbox));

  notesForNotebook(notebookId: string): ReturnType<typeof computed<Note[]>> {
    return computed(() => this.notes().filter(n => n.notebookId === notebookId));
  }

  noteById(id: string): ReturnType<typeof computed<Note | undefined>> {
    return computed(() => this.notes().find(n => n.id === id));
  }

  backlinksTo(noteId: string): ReturnType<typeof computed<Note[]>> {
    return computed(() => this.notes().filter(n => n.linkedNoteIds.includes(noteId)));
  }

  // ── Shelves ───────────────────────────────────────────────────────────────
  createShelf(name: string): Shelf {
    const shelf: Shelf = { id: crypto.randomUUID(), name, notebookIds: [], createdAt: Date.now(), updatedAt: Date.now() };
    this.shelves.update(s => [...s, shelf]);
    return shelf;
  }

  updateShelf(id: string, patch: Partial<Pick<Shelf, 'name'>>): void {
    this.shelves.update(s => s.map(sh => sh.id === id ? { ...sh, ...patch, updatedAt: Date.now() } : sh));
  }

  deleteShelf(id: string): void {
    this.shelves.update(s => s.filter(sh => sh.id !== id));
    // Cascade: notebooks and notes referencing this shelf are moved to Orphaned
    this.notebooks.update(nb => nb.map(n => n.shelfId === id ? { ...n, shelfId: null } : n));
  }

  // ── Notebooks ─────────────────────────────────────────────────────────────
  createNotebook(shelfId: string | null, name: string): Notebook {
    const notebook: Notebook = { id: crypto.randomUUID(), shelfId, name, noteIds: [], createdAt: Date.now(), updatedAt: Date.now() };
    this.notebooks.update(nb => [...nb, notebook]);
    return notebook;
  }

  updateNotebook(id: string, patch: Partial<Pick<Notebook, 'name' | 'shelfId'>>): void {
    this.notebooks.update(nb => nb.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
  }

  deleteNotebook(id: string): void {
    this.notebooks.update(nb => nb.filter(n => n.id !== id));
    this.notes.update(ns => ns.filter(n => n.notebookId !== id));
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  createNote(notebookId: string, type: NoteType = 'research', title = 'Untitled'): Note {
    const note: Note = {
      id: crypto.randomUUID(), notebookId, type, title,
      tags: [], linkedNoteIds: [], blockIds: [],
      canvasType: 'plain', isInbox: false, isPinned: false,
      wordCount: 0, createdAt: Date.now(), updatedAt: Date.now()
    };
    this.notes.update(ns => [...ns, note]);
    return note;
  }

  updateNote(id: string, patch: Partial<Note>): void {
    this.notes.update(ns => ns.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
  }

  deleteNote(id: string): void {
    this.notes.update(ns => ns.filter(n => n.id !== id));
    // Remove backlinks in other notes
    this.notes.update(ns => ns.map(n => ({
      ...n, linkedNoteIds: n.linkedNoteIds.filter(lid => lid !== id)
    })));
  }

  moveNote(noteId: string, targetNotebookId: string): void {
    this.updateNote(noteId, { notebookId: targetNotebookId });
  }

  addTag(noteId: string, tag: string): void {
    this.notes.update(ns => ns.map(n =>
      n.id === noteId && !n.tags.includes(tag) ? { ...n, tags: [...n.tags, tag] } : n
    ));
  }

  removeTag(noteId: string, tag: string): void {
    this.notes.update(ns => ns.map(n =>
      n.id === noteId ? { ...n, tags: n.tags.filter(t => t !== tag) } : n
    ));
  }

  linkNotes(fromId: string, toId: string): void {
    this.notes.update(ns => ns.map(n =>
      n.id === fromId && !n.linkedNoteIds.includes(toId)
        ? { ...n, linkedNoteIds: [...n.linkedNoteIds, toId] }
        : n
    ));
  }

  exportNote(id: string, format: 'md' | 'html' | 'pdf'): Promise<Blob> {
    // Delegated to ExportService (thin wrapper); returns a Blob for download
    return Promise.reject(new Error('Implement in ExportService'));
  }
}
```

---

### 7.2 BlockService

**File:** `core/services/block.service.ts`

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { Block, BlockType, BlockContent } from '../../shared/models/block.models';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class BlockService {
  private readonly storage = inject(LocalStorageService);

  // Per-note signal map — blocks are loaded lazily as notes are opened
  private readonly blockMap = new Map<string, ReturnType<typeof signal<Block[]>>>();

  blocksForNote(noteId: string): ReturnType<typeof signal<Block[]>> {
    if (!this.blockMap.has(noteId)) {
      const stored = this.storage.get<Block[]>(`lore:blocks:${noteId}`) ?? [];
      const sig = signal<Block[]>(stored);
      this.blockMap.set(noteId, sig);
    }
    return this.blockMap.get(noteId)!;
  }

  blockById(noteId: string, blockId: string): ReturnType<typeof computed<Block | undefined>> {
    return computed(() => this.blocksForNote(noteId)().find(b => b.id === blockId));
  }

  wordCount(noteId: string): ReturnType<typeof computed<number>> {
    return computed(() =>
      this.blocksForNote(noteId)()
        .flatMap(b => ('text' in b.content ? (b.content as { text: string }).text.split(/\s+/) : []))
        .filter(w => w.length > 0).length
    );
  }

  addBlock(noteId: string, type: BlockType, afterBlockId?: string): Block {
    const block: Block = {
      id: crypto.randomUUID(), noteId, type,
      content: this.defaultContent(type),
      order: 0, commentIds: [], createdAt: Date.now(), updatedAt: Date.now()
    };
    const sig = this.blocksForNote(noteId);
    sig.update(blocks => {
      const idx = afterBlockId ? blocks.findIndex(b => b.id === afterBlockId) + 1 : blocks.length;
      const updated = [...blocks];
      updated.splice(idx, 0, block);
      return this.reorder(updated);
    });
    this.persist(noteId);
    return block;
  }

  updateBlock(noteId: string, blockId: string, patch: Partial<Block>): void {
    this.blocksForNote(noteId).update(blocks =>
      blocks.map(b => b.id === blockId ? { ...b, ...patch, updatedAt: Date.now() } : b)
    );
    this.persist(noteId);
  }

  moveBlock(noteId: string, blockId: string, newIndex: number): void {
    this.blocksForNote(noteId).update(blocks => {
      const updated = [...blocks];
      const currentIdx = updated.findIndex(b => b.id === blockId);
      if (currentIdx === -1) return blocks;
      const [block] = updated.splice(currentIdx, 1);
      updated.splice(newIndex, 0, block);
      return this.reorder(updated);
    });
    this.persist(noteId);
  }

  deleteBlock(noteId: string, blockId: string): void {
    this.blocksForNote(noteId).update(blocks => blocks.filter(b => b.id !== blockId));
    this.persist(noteId);
  }

  duplicateBlock(noteId: string, blockId: string): Block | undefined {
    const existing = this.blocksForNote(noteId)().find(b => b.id === blockId);
    if (!existing) return undefined;
    return this.addBlock(noteId, existing.type, blockId);
  }

  private reorder(blocks: Block[]): Block[] {
    return blocks.map((b, i) => ({ ...b, order: i }));
  }

  private persist(noteId: string): void {
    const blocks = this.blocksForNote(noteId)();
    this.storage.set(`lore:blocks:${noteId}`, blocks);
  }

  private defaultContent(type: BlockType): BlockContent {
    const defaults: Record<BlockType, BlockContent> = {
      hypothesis: { title: '', body: '', confidence: 'medium' },
      conclusion: { title: '', body: '', evidenceCount: 0 },
      note: { text: '' },
      warning: { title: '', body: '' },
      quote: { text: '', attribution: '' },
      'key-differences': { title: '', columnA: { label: '', items: [] }, columnB: { label: '', items: [] } },
      'key-findings': { title: '', items: [] },
      checklist: { title: '', items: [] },
      table: { headers: [], rows: [] },
      code: { language: 'typescript', code: '' },
      image: { src: null, alt: '', caption: '' },
      divider: { variant: 'default' },
      'ask-claude': { prompt: '', response: null, model: 'claude-opus-4-5' },
      'ask-gpt': { prompt: '', response: null, model: 'gpt-4o' }
    };
    return defaults[type];
  }
}
```

---

### 7.3 EditorService

**File:** `core/services/editor.service.ts`

```typescript
import { Injectable, computed, signal } from '@angular/core';
import { PaneConfig } from '../../shared/models/note.models';

@Injectable({ providedIn: 'root' })
export class EditorService {
  static readonly MAX_PANES = 3;

  readonly panes = signal<PaneConfig[]>([]);
  readonly focusedPaneId = signal<string | null>(null);

  readonly activePaneCount = computed(() => this.panes().length);
  readonly focusedNote = computed(() => {
    const id = this.focusedPaneId();
    return this.panes().find(p => p.id === id)?.noteId ?? null;
  });

  openNote(noteId: string): void {
    const existing = this.panes().find(p => p.noteId === noteId);
    if (existing) {
      this.focusedPaneId.set(existing.id);
      return;
    }
    if (this.panes().length === 0) {
      const pane: PaneConfig = { id: crypto.randomUUID(), noteId };
      this.panes.set([pane]);
      this.focusedPaneId.set(pane.id);
    } else {
      this.openInPane(this.focusedPaneId() ?? this.panes()[0].id, noteId);
    }
  }

  openInPane(paneId: string, noteId: string): void {
    this.panes.update(ps => ps.map(p => p.id === paneId ? { ...p, noteId } : p));
    this.focusedPaneId.set(paneId);
  }

  splitPane(sourcePaneId: string, noteId: string): void {
    if (this.panes().length >= EditorService.MAX_PANES) return;
    const sourceIdx = this.panes().findIndex(p => p.id === sourcePaneId);
    const newPane: PaneConfig = { id: crypto.randomUUID(), noteId };
    this.panes.update(ps => {
      const updated = [...ps];
      updated.splice(sourceIdx + 1, 0, newPane);
      return updated;
    });
    this.focusedPaneId.set(newPane.id);
  }

  closePane(paneId: string): void {
    this.panes.update(ps => ps.filter(p => p.id !== paneId));
    if (this.focusedPaneId() === paneId) {
      this.focusedPaneId.set(this.panes()[0]?.id ?? null);
    }
  }

  setFocus(paneId: string): void {
    this.focusedPaneId.set(paneId);
  }
}
```

---

### 7.4 AIService

**File:** `core/services/ai.service.ts`

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { AIRequest, AIResponse, AIStreamState, AIProvider, AIModelId } from '../../shared/models/ai.models';
import { NotificationService } from './notification.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class AIService {
  private readonly notifications = inject(NotificationService);
  private readonly settings = inject(SettingsService);

  private readonly requestQueue = signal<AIRequest[]>([]);
  readonly streamState = signal<AIStreamState | null>(null);
  readonly isStreaming = computed(() => this.streamState() !== null);

  private activeAbortController: AbortController | null = null;

  async sendMessage(request: AIRequest): Promise<void> {
    this.requestQueue.update(q => [...q, request]);
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isStreaming()) return;
    const queue = this.requestQueue();
    if (queue.length === 0) return;
    const [next, ...rest] = queue;
    this.requestQueue.set(rest);
    await this.executeRequest(next);
  }

  private async executeRequest(request: AIRequest): Promise<void> {
    const apiKey = this.getApiKey(request.provider);
    if (!apiKey) {
      this.notifications.push({
        id: crypto.randomUUID(), type: 'error', title: 'API Key Missing',
        body: `No API key configured for ${request.provider}. Go to Settings → AI Providers.`,
        timestamp: Date.now(), read: false
      });
      request.onError?.(new Error('API_KEY_MISSING'));
      return;
    }

    this.activeAbortController = new AbortController();
    this.streamState.set({ requestId: request.id, provider: request.provider, tokensReceived: 0, text: '' });

    try {
      if (request.provider === 'anthropic') {
        await this.streamAnthropic(request, apiKey, this.activeAbortController.signal);
      } else {
        await this.streamOpenAiCompat(request, apiKey, this.activeAbortController.signal);
      }
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error(String(err)), request);
    } finally {
      this.streamState.set(null);
      this.activeAbortController = null;
      await this.processQueue();
    }
  }

  private async streamAnthropic(request: AIRequest, apiKey: string, signal: AbortSignal): Promise<void> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        system: request.systemPrompt,
        messages: request.messages,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new AIServiceError(response.status, (body['error'] as { message?: string } | undefined)?.message ?? 'Unknown error', request.provider);
    }

    await this.consumeSSEStream(response, request);
  }

  private async streamOpenAiCompat(request: AIRequest, apiKey: string, abortSignal: AbortSignal): Promise<void> {
    const endpoint = this.settings.get().aiProviders[request.provider]?.endpoint ?? '';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: request.model, messages: request.messages,
        max_tokens: request.maxTokens ?? 4096, stream: true
      }),
      signal: abortSignal
    });

    if (!response.ok) {
      throw new AIServiceError(response.status, 'Provider request failed', request.provider);
    }

    await this.consumeSSEStream(response, request);
  }

  private async consumeSSEStream(response: Response, request: AIRequest): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = this.extractDelta(data, request.provider);
            if (delta) {
              fullText += delta;
              this.streamState.update(s => s ? { ...s, text: fullText, tokensReceived: s.tokensReceived + 1 } : s);
              request.onToken?.(delta, fullText);
            }
          } catch {
            // Non-fatal: skip malformed SSE line
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    request.onComplete?.(fullText);
  }

  private extractDelta(data: string, provider: AIProvider): string | null {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (provider === 'anthropic') {
      const delta = parsed['delta'] as { type?: string; text?: string } | undefined;
      return delta?.type === 'text_delta' ? (delta.text ?? null) : null;
    }
    // OpenAI-compat
    const choices = parsed['choices'] as Array<{ delta?: { content?: string } }> | undefined;
    return choices?.[0]?.delta?.content ?? null;
  }

  cancelStream(): void {
    this.activeAbortController?.abort();
    this.streamState.set(null);
  }

  clearQueue(): void {
    this.requestQueue.set([]);
  }

  private getApiKey(provider: AIProvider): string | null {
    const keys = this.settings.get().aiApiKeys;
    return keys[provider] ?? null;
  }

  private handleError(err: Error, request: AIRequest): void {
    if (err.name === 'AbortError') return; // User-cancelled, silent

    const isRateLimit = err instanceof AIServiceError && err.status === 429;
    const isAuthError = err instanceof AIServiceError && err.status === 401;

    this.notifications.push({
      id: crypto.randomUUID(), type: 'error',
      title: isRateLimit ? 'Rate Limited' : isAuthError ? 'Invalid API Key' : 'AI Error',
      body: err.message,
      timestamp: Date.now(), read: false
    });

    request.onError?.(err);
  }
}

export class AIServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly provider: AIProvider
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}
```

---

### 7.5 PromptService

**File:** `core/services/prompt.service.ts`

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Prompt, PromptVariable } from '../../shared/models/prompt.models';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class PromptService {
  private readonly storage = inject(LocalStorageService);

  readonly prompts = signal<Prompt[]>(this.storage.get<Prompt[]>('lore:prompts') ?? []);
  readonly count = computed(() => this.prompts().length);

  createPrompt(name: string, body: string, tags: string[] = []): Prompt {
    const prompt: Prompt = {
      id: crypto.randomUUID(), name, body, tags,
      variables: this.extractVariables(body),
      scheduledCron: null, lastRunAt: null,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    this.prompts.update(ps => [...ps, prompt]);
    this.persist();
    return prompt;
  }

  updatePrompt(id: string, patch: Partial<Pick<Prompt, 'name' | 'body' | 'tags' | 'scheduledCron'>>): void {
    this.prompts.update(ps => ps.map(p =>
      p.id === id ? { ...p, ...patch,
        variables: patch.body ? this.extractVariables(patch.body) : p.variables,
        updatedAt: Date.now()
      } : p
    ));
    this.persist();
  }

  deletePrompt(id: string): void {
    this.prompts.update(ps => ps.filter(p => p.id !== id));
    this.persist();
  }

  substituteVariables(promptId: string, values: Record<string, string>): string {
    const prompt = this.prompts().find(p => p.id === promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);
    return prompt.body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
  }

  private extractVariables(body: string): PromptVariable[] {
    const matches = [...body.matchAll(/\{\{(\w+)\}\}/g)];
    const unique = [...new Set(matches.map(m => m[1]))];
    return unique.map(name => ({ name, defaultValue: '' }));
  }

  private persist(): void {
    this.storage.set('lore:prompts', this.prompts());
  }
}
```

---

### 7.6 SchedulerService

**File:** `core/services/scheduler.service.ts`

```typescript
import { Injectable, inject, signal, computed, NgZone, OnDestroy } from '@angular/core';
import { ScheduledRun, RunHistory } from '../../shared/models/scheduler.models';
import { AIService } from './ai.service';
import { PromptService } from './prompt.service';
import { NotificationService } from './notification.service';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class SchedulerService implements OnDestroy {
  private readonly ai = inject(AIService);
  private readonly prompts = inject(PromptService);
  private readonly notifications = inject(NotificationService);
  private readonly storage = inject(LocalStorageService);
  private readonly zone = inject(NgZone);

  readonly scheduledRuns = signal<ScheduledRun[]>(this.storage.get<ScheduledRun[]>('lore:scheduled-runs') ?? []);
  readonly runHistory = signal<RunHistory[]>(this.storage.get<RunHistory[]>('lore:run-history') ?? []);
  readonly pendingRuns = computed(() => this.scheduledRuns().filter(r => r.isEnabled));

  private worker: Worker | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof Worker === 'undefined') return;
    this.worker = new Worker(new URL('../../workers/scheduler.worker', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      this.zone.run(() => this.onWorkerMessage(data));
    };
    this.worker.onerror = (e) => this.zone.run(() =>
      this.notifications.push({ id: crypto.randomUUID(), type: 'error', title: 'Scheduler Error', body: e.message, timestamp: Date.now(), read: false })
    );
    this.syncWorker();
  }

  createRun(promptId: string, cron: string, outputNoteId: string): ScheduledRun {
    const run: ScheduledRun = {
      id: crypto.randomUUID(), promptId, cron, outputNoteId,
      isEnabled: true, lastRunAt: null, nextRunAt: this.computeNext(cron),
      createdAt: Date.now()
    };
    this.scheduledRuns.update(rs => [...rs, run]);
    this.persist();
    this.syncWorker();
    return run;
  }

  updateRun(id: string, patch: Partial<Pick<ScheduledRun, 'cron' | 'isEnabled' | 'outputNoteId'>>): void {
    this.scheduledRuns.update(rs => rs.map(r =>
      r.id === id ? { ...r, ...patch, nextRunAt: patch.cron ? this.computeNext(patch.cron) : r.nextRunAt } : r
    ));
    this.persist();
    this.syncWorker();
  }

  deleteRun(id: string): void {
    this.scheduledRuns.update(rs => rs.filter(r => r.id !== id));
    this.persist();
    this.syncWorker();
  }

  async executeRunNow(runId: string): Promise<void> {
    const run = this.scheduledRuns().find(r => r.id === runId);
    if (!run) return;
    await this.executeRun(run);
  }

  countdown(runId: string): number {
    const run = this.scheduledRuns().find(r => r.id === runId);
    if (!run?.nextRunAt) return 0;
    return Math.max(0, run.nextRunAt - Date.now());
  }

  private async executeRun(run: ScheduledRun): Promise<void> {
    const prompt = this.prompts.prompts().find(p => p.id === run.promptId);
    if (!prompt) return;

    const startedAt = Date.now();
    let outputHtml = '';

    try {
      await this.ai.sendMessage({
        id: crypto.randomUUID(),
        provider: 'anthropic',
        model: 'claude-opus-4-5',
        messages: [{ role: 'user', content: prompt.body }],
        onToken: (_, full) => { outputHtml = full; },
        onComplete: (full) => { outputHtml = full; }
      });

      const historyEntry: RunHistory = {
        id: crypto.randomUUID(), runId: run.id, promptId: run.promptId,
        status: 'success', outputHtml, startedAt, completedAt: Date.now()
      };
      this.runHistory.update(h => [historyEntry, ...h].slice(0, 100)); // cap at 100 entries
      this.scheduledRuns.update(rs => rs.map(r =>
        r.id === run.id ? { ...r, lastRunAt: Date.now(), nextRunAt: this.computeNext(r.cron) } : r
      ));
      this.notifications.push({
        id: crypto.randomUUID(), type: 'info', title: 'Scheduled Run Complete',
        body: `Prompt "${prompt.name}" ran successfully.`, timestamp: Date.now(), read: false
      });
    } catch (err) {
      const historyEntry: RunHistory = {
        id: crypto.randomUUID(), runId: run.id, promptId: run.promptId,
        status: 'error', outputHtml: '', startedAt, completedAt: Date.now(),
        error: err instanceof Error ? err.message : String(err)
      };
      this.runHistory.update(h => [historyEntry, ...h].slice(0, 100));
    }

    this.persistHistory();
    this.persist();
  }

  private onWorkerMessage(msg: WorkerMessage): void {
    if (msg.type === 'RUN_DUE') {
      const run = this.scheduledRuns().find(r => r.id === msg.runId);
      if (run?.isEnabled) void this.executeRun(run);
    }
  }

  private syncWorker(): void {
    this.worker?.postMessage({ type: 'SYNC', runs: this.scheduledRuns() });
  }

  private computeNext(cron: string): number {
    // Uses a lightweight cron-parser (e.g., cronstrue + cron-parser wasm port)
    // Returns Unix timestamp ms of next execution
    // Implementation: import { parseExpression } from 'cron-parser';
    // return parseExpression(cron).next().getTime();
    return Date.now() + 60_000; // placeholder — replace with cron-parser
  }

  private persist(): void {
    this.storage.set('lore:scheduled-runs', this.scheduledRuns());
  }

  private persistHistory(): void {
    this.storage.set('lore:run-history', this.runHistory());
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }
}

interface WorkerMessage {
  type: 'RUN_DUE';
  runId: string;
}
```

---

### 7.7 SearchService

**File:** `core/services/search.service.ts`

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SearchResult, SearchFilter } from '../../shared/models/note.models';
import { NoteService } from './note.service';
import { BlockService } from './block.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly noteService = inject(NoteService);
  private readonly blockService = inject(BlockService);

  readonly query = signal<string>('');
  readonly filter = signal<SearchFilter>({ types: [], tags: [], dateRange: null });
  readonly results = signal<SearchResult[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly searchHistory = signal<string[]>(this.loadHistory());

  readonly hasResults = computed(() => this.results().length > 0);
  readonly resultCount = computed(() => this.results().length);

  constructor() {
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) { this.results.set([]); return of([]); }
        this.isSearching.set(true);
        return of(this.runSearch(q, this.filter()));
      })
    ).subscribe(results => {
      this.results.set(results);
      this.isSearching.set(false);
    });
  }

  setQuery(query: string): void {
    this.query.set(query);
  }

  setFilter(filter: Partial<SearchFilter>): void {
    this.filter.update(f => ({ ...f, ...filter }));
  }

  clearSearch(): void {
    this.query.set('');
    this.results.set([]);
    this.filter.set({ types: [], tags: [], dateRange: null });
  }

  addToHistory(query: string): void {
    this.searchHistory.update(h => [query, ...h.filter(q => q !== query)].slice(0, 20));
    this.persistHistory();
  }

  private runSearch(query: string, filter: SearchFilter): SearchResult[] {
    const lower = query.toLowerCase();
    const notes = this.noteService.notes().filter(n => {
      const matchesType = filter.types.length === 0 || filter.types.includes(n.type);
      const matchesTag = filter.tags.length === 0 || filter.tags.some(t => n.tags.includes(t));
      const matchesTitle = n.title.toLowerCase().includes(lower);
      return matchesType && matchesTag && matchesTitle;
    });
    return notes.map(n => ({ noteId: n.id, title: n.title, snippet: '', matchType: 'title' as const }));
    // Full-text: extend to scan block content from BlockService
  }

  private loadHistory(): string[] {
    try {
      return JSON.parse(localStorage.getItem('lore:search-history') ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  private persistHistory(): void {
    localStorage.setItem('lore:search-history', JSON.stringify(this.searchHistory()));
  }
}
```

---

### 7.8 GraphService

**File:** `core/services/graph.service.ts`

```typescript
import { Injectable, computed, inject } from '@angular/core';
import { GraphNode, GraphEdge, GraphData } from '../../shared/models/note.models';
import { NoteService } from './note.service';

@Injectable({ providedIn: 'root' })
export class GraphService {
  private readonly notes = inject(NoteService);

  readonly graphData = computed<GraphData>(() => {
    const notes = this.notes.notes();
    const nodes: GraphNode[] = notes.map(n => ({
      id: n.id, label: n.title, type: n.type, group: n.notebookId
    }));
    const edges: GraphEdge[] = notes.flatMap(n =>
      n.linkedNoteIds.map(targetId => ({ source: n.id, target: targetId }))
    );
    return { nodes, edges };
  });

  neighboursOf(noteId: string): ReturnType<typeof computed<GraphNode[]>> {
    return computed(() => {
      const { edges, nodes } = this.graphData();
      const neighbourIds = edges
        .filter(e => e.source === noteId || e.target === noteId)
        .map(e => e.source === noteId ? e.target : e.source);
      return nodes.filter(n => neighbourIds.includes(n.id));
    });
  }

  clusterByShelf(): ReturnType<typeof computed<Map<string, GraphNode[]>>> {
    return computed(() => {
      const map = new Map<string, GraphNode[]>();
      for (const node of this.graphData().nodes) {
        const cluster = map.get(node.group) ?? [];
        cluster.push(node);
        map.set(node.group, cluster);
      }
      return map;
    });
  }
}
```

---

### 7.9 SyncService

**File:** `core/services/sync.service.ts`

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { SyncState, GistFile, SyncConflict } from '../../shared/models/sync.models';
import { NoteService } from './note.service';
import { NotificationService } from './notification.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly noteService = inject(NoteService);
  private readonly notifications = inject(NotificationService);
  private readonly settings = inject(SettingsService);

  readonly syncState = signal<SyncState>('idle');
  readonly lastSyncAt = signal<number | null>(null);
  readonly pendingConflicts = signal<SyncConflict[]>([]);
  readonly isSyncing = computed(() => this.syncState() === 'syncing');

  private gistId: string | null = null;

  async syncNow(): Promise<void> {
    const token = this.settings.get().githubToken;
    if (!token) {
      this.notifications.push({ id: crypto.randomUUID(), type: 'error', title: 'Sync Error', body: 'No GitHub token configured.', timestamp: Date.now(), read: false });
      return;
    }
    this.syncState.set('syncing');
    try {
      this.gistId = this.gistId ?? this.settings.get().gistId ?? null;
      if (!this.gistId) {
        await this.initialSync(token);
      } else {
        await this.deltaSync(token);
      }
      this.lastSyncAt.set(Date.now());
      this.syncState.set('synced');
    } catch (err) {
      this.syncState.set('error');
      this.notifications.push({
        id: crypto.randomUUID(), type: 'error', title: 'Sync Failed',
        body: err instanceof Error ? err.message : 'Unknown sync error',
        timestamp: Date.now(), read: false
      });
    }
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote'): Promise<void> {
    const conflict = this.pendingConflicts().find(c => c.id === conflictId);
    if (!conflict) return;
    if (resolution === 'remote') {
      this.noteService.updateNote(conflict.noteId, conflict.remoteNote);
    }
    this.pendingConflicts.update(cs => cs.filter(c => c.id !== conflictId));
    await this.syncNow();
  }

  private async initialSync(token: string): Promise<void> {
    const payload = this.buildGistPayload();
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Lore Knowledge Base Sync', public: false, files: payload })
    });
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const data = await response.json() as { id: string };
    this.gistId = data.id;
    this.settings.update({ gistId: data.id });
  }

  private async deltaSync(token: string): Promise<void> {
    // Fetch remote state
    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 404) { this.gistId = null; await this.initialSync(token); return; }
    if (response.status === 429) throw new Error('GitHub rate limit reached. Retry in 1 hour.');
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

    const remote = await response.json() as { files: Record<string, { content: string }> };
    const remoteNotes = JSON.parse(remote.files['lore-notes.json']?.content ?? '[]') as Note[];

    // Conflict detection: compare updatedAt timestamps
    const localNotes = this.noteService.notes();
    const conflicts = this.detectConflicts(localNotes, remoteNotes);

    if (conflicts.length > 0) {
      this.pendingConflicts.set(conflicts);
      this.notifications.push({
        id: crypto.randomUUID(), type: 'error', title: 'Sync Conflicts Detected',
        body: `${conflicts.length} note(s) were modified both locally and remotely. Please resolve them.`,
        timestamp: Date.now(), read: false
      });
      return; // Block sync until conflicts resolved
    }

    // Merge: remote wins for notes only modified remotely; local wins for notes only modified locally
    const merged = this.mergeNotes(localNotes, remoteNotes);
    this.noteService.notes.set(merged);

    // Push merged state back to Gist
    await fetch(`https://api.github.com/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: this.buildGistPayload() })
    });
  }

  private detectConflicts(local: Note[], remote: Note[]): SyncConflict[] {
    const remoteMap = new Map(remote.map(n => [n.id, n]));
    const lastSyncTime = this.lastSyncAt() ?? 0;
    return local.filter(ln => {
      const rn = remoteMap.get(ln.id);
      if (!rn) return false;
      const localModifiedSinceSync = ln.updatedAt > lastSyncTime;
      const remoteModifiedSinceSync = rn.updatedAt > lastSyncTime;
      return localModifiedSinceSync && remoteModifiedSinceSync && ln.updatedAt !== rn.updatedAt;
    }).map(ln => ({
      id: crypto.randomUUID(), noteId: ln.id,
      localNote: ln, remoteNote: remoteMap.get(ln.id)!
    }));
  }

  private mergeNotes(local: Note[], remote: Note[]): Note[] {
    const remoteMap = new Map(remote.map(n => [n.id, n]));
    const localIds = new Set(local.map(n => n.id));
    const merged = local.map(ln => {
      const rn = remoteMap.get(ln.id);
      if (!rn) return ln; // Only in local — keep
      return rn.updatedAt > ln.updatedAt ? rn : ln; // Remote wins if newer
    });
    // Add notes that exist only in remote (created on another device)
    for (const rn of remote) {
      if (!localIds.has(rn.id)) merged.push(rn);
    }
    return merged;
  }

  private buildGistPayload(): Record<string, { content: string }> {
    return {
      'lore-notes.json': { content: JSON.stringify(this.noteService.notes()) },
      'lore-notebooks.json': { content: JSON.stringify(this.noteService.notebooks()) },
      'lore-shelves.json': { content: JSON.stringify(this.noteService.shelves()) }
    };
  }
}

// Imported from models — included here for context
interface Note { id: string; notebookId: string; updatedAt: number; [key: string]: unknown; }
```

---

### 7.10 NotificationService

**File:** `core/services/notification.service.ts`

```typescript
import { Injectable, computed, signal } from '@angular/core';
import { Notification, NotificationTab } from '../../shared/models/note.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  notificationsForTab(tab: NotificationTab): ReturnType<typeof computed<Notification[]>> {
    return computed(() => {
      const all = this.notifications();
      if (tab === 'all') return all;
      return all.filter(n => n.type === tab);
    });
  }

  push(notification: Notification): void {
    this.notifications.update(ns => [notification, ...ns].slice(0, 200)); // cap at 200
  }

  markRead(id: string): void {
    this.notifications.update(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllRead(): void {
    this.notifications.update(ns => ns.map(n => ({ ...n, read: true })));
  }

  dismiss(id: string): void {
    this.notifications.update(ns => ns.filter(n => n.id !== id));
  }

  dismissAll(): void {
    this.notifications.set([]);
  }
}
```

---

### 7.11 ThemeService

**File:** `core/services/theme.service.ts`

```typescript
import { Injectable, inject, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('lore-theme', t);
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private loadTheme(): Theme {
    const saved = localStorage.getItem('lore-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

---

### 7.12 TemplateService

**File:** `core/services/template.service.ts`

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { NoteTemplate } from '../../shared/models/note.models';
import { LocalStorageService } from '../storage/local-storage.service';
import { NoteService } from './note.service';
import { BlockService } from './block.service';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly storage = inject(LocalStorageService);
  private readonly noteService = inject(NoteService);
  private readonly blockService = inject(BlockService);

  readonly templates = signal<NoteTemplate[]>(
    this.storage.get<NoteTemplate[]>('lore:templates') ?? this.builtInTemplates()
  );

  createTemplate(name: string, noteId: string): NoteTemplate {
    const note = this.noteService.noteById(noteId)();
    if (!note) throw new Error(`Note ${noteId} not found`);
    const blocks = this.blockService.blocksForNote(noteId)();
    const template: NoteTemplate = {
      id: crypto.randomUUID(), name, noteType: note.type,
      blockSnapshots: blocks, isBuiltIn: false,
      createdAt: Date.now()
    };
    this.templates.update(ts => [...ts, template]);
    this.persist();
    return template;
  }

  applyTemplate(templateId: string, targetNoteId: string): void {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);
    for (const blockSnapshot of template.blockSnapshots) {
      const newBlock = this.blockService.addBlock(targetNoteId, blockSnapshot.type);
      this.blockService.updateBlock(targetNoteId, newBlock.id, { content: blockSnapshot.content });
    }
  }

  deleteTemplate(id: string): void {
    const template = this.templates().find(t => t.id === id);
    if (template?.isBuiltIn) throw new Error('Cannot delete built-in templates');
    this.templates.update(ts => ts.filter(t => t.id !== id));
    this.persist();
  }

  private persist(): void {
    this.storage.set('lore:templates', this.templates().filter(t => !t.isBuiltIn));
  }

  private builtInTemplates(): NoteTemplate[] {
    return [
      { id: 'builtin-research', name: 'Research Note', noteType: 'research', blockSnapshots: [], isBuiltIn: true, createdAt: 0 },
      { id: 'builtin-journal', name: 'Daily Journal', noteType: 'journal', blockSnapshots: [], isBuiltIn: true, createdAt: 0 }
    ];
  }
}
```

---

## 8. Local Storage Schema

### Version and Migration

All localStorage entries are versioned. On app startup, `StorageMigrations.run()` upgrades stored data to the current schema version before any service initialises.

```typescript
// core/storage/storage.migrations.ts

const CURRENT_VERSION = 1;

export class StorageMigrations {
  static run(): void {
    const stored = parseInt(localStorage.getItem('lore:schema-version') ?? '0', 10);
    if (stored === CURRENT_VERSION) return;
    for (let v = stored + 1; v <= CURRENT_VERSION; v++) {
      StorageMigrations.migrations[v]?.();
    }
    localStorage.setItem('lore:schema-version', String(CURRENT_VERSION));
  }

  private static readonly migrations: Record<number, () => void> = {
    1: () => {
      // v0 → v1: add `isInbox` field to all notes that lack it
      const raw = localStorage.getItem('lore:notes');
      if (!raw) return;
      const notes = JSON.parse(raw) as Array<Record<string, unknown>>;
      const migrated = notes.map(n => ({ isInbox: false, ...n }));
      localStorage.setItem('lore:notes', JSON.stringify(migrated));
    }
  };
}
```

### TypeScript Interfaces (authoritative schema)

```typescript
// shared/models/note.models.ts

export type NoteType = 'research' | 'journal' | 'task' | 'idea' | 'reference' | 'html';
export type CanvasType = 'plain' | 'dot-grid' | 'square-grid' | 'lined';
export type NotificationTab = 'all' | 'error' | 'info' | 'cron';

export interface Shelf {
  id: string;
  name: string;
  notebookIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Notebook {
  id: string;
  shelfId: string | null;
  name: string;
  noteIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  notebookId: string;
  type: NoteType;
  title: string;
  tags: string[];
  linkedNoteIds: string[];
  blockIds: string[];       // Ordered list; source of truth for order is BlockService
  canvasType: CanvasType;
  isInbox: boolean;
  isPinned: boolean;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PaneConfig {
  id: string;
  noteId: string;
}

export interface SearchResult {
  noteId: string;
  title: string;
  snippet: string;
  matchType: 'title' | 'body' | 'tag';
}

export interface SearchFilter {
  types: NoteType[];
  tags: string[];
  dateRange: { from: number; to: number } | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: NoteType;
  group: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Notification {
  id: string;
  type: 'error' | 'info' | 'cron';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

export interface NoteTemplate {
  id: string;
  name: string;
  noteType: NoteType;
  blockSnapshots: Block[];
  isBuiltIn: boolean;
  createdAt: number;
}

// shared/models/block.models.ts

export type BlockType =
  | 'hypothesis' | 'conclusion' | 'note' | 'warning' | 'quote'
  | 'key-differences' | 'key-findings' | 'checklist' | 'table'
  | 'code' | 'image' | 'divider' | 'ask-claude' | 'ask-gpt';

export type BlockContent =
  | HypothesisContent | ConclusionContent | NoteContent | WarningContent
  | QuoteContent | KeyDifferencesContent | KeyFindingsContent | ChecklistContent
  | TableContent | CodeContent | ImageContent | DividerContent
  | AskAIContent;

export interface Block {
  id: string;
  noteId: string;
  type: BlockType;
  content: BlockContent;
  order: number;
  commentIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface HypothesisContent { title: string; body: string; confidence: 'low' | 'medium' | 'high'; }
export interface ConclusionContent { title: string; body: string; evidenceCount: number; }
export interface NoteContent { text: string; }
export interface WarningContent { title: string; body: string; }
export interface QuoteContent { text: string; attribution: string; }
export interface KeyDifferencesContent {
  title: string;
  columnA: { label: string; items: Array<{ label: string; value: string }> };
  columnB: { label: string; items: Array<{ label: string; value: string }> };
}
export interface KeyFindingsContent { title: string; items: string[]; }
export interface ChecklistContent { title: string; items: Array<{ text: string; checked: boolean }>; }
export interface TableContent { headers: string[]; rows: string[][]; }
export interface CodeContent { language: string; code: string; }
export interface ImageContent { src: string | null; alt: string; caption: string; }
export interface DividerContent { variant: 'default' | 'strong' | 'decorative'; }
export interface AskAIContent { prompt: string; response: string | null; model: string; }

// shared/models/ai.models.ts

export type AIProvider = 'anthropic' | 'openai' | 'gemini' | 'groq';
export type AIModelId = string; // Free-form; validated against provider's model list at runtime

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  id: string;
  provider: AIProvider;
  model: AIModelId;
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  onToken?: (delta: string, fullText: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

export interface AIStreamState {
  requestId: string;
  provider: AIProvider;
  tokensReceived: number;
  text: string;
}

// shared/models/prompt.models.ts

export interface PromptVariable {
  name: string;
  defaultValue: string;
}

export interface Prompt {
  id: string;
  name: string;
  body: string;
  tags: string[];
  variables: PromptVariable[];
  scheduledCron: string | null;
  lastRunAt: number | null;
  createdAt: number;
  updatedAt: number;
}

// shared/models/scheduler.models.ts

export interface ScheduledRun {
  id: string;
  promptId: string;
  cron: string;
  outputNoteId: string;
  isEnabled: boolean;
  lastRunAt: number | null;
  nextRunAt: number | null;
  createdAt: number;
}

export interface RunHistory {
  id: string;
  runId: string;
  promptId: string;
  status: 'success' | 'error';
  outputHtml: string;
  startedAt: number;
  completedAt: number;
  error?: string;
}

// shared/models/sync.models.ts

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'conflict';

export interface SyncConflict {
  id: string;
  noteId: string;
  localNote: Note;
  remoteNote: Note;
}

export interface GistFile {
  content: string;
}

// shared/models/settings.models.ts

export interface AppSettings {
  schemaVersion: number;
  gistId: string | null;
  githubToken: string | null;       // AES-encrypted at rest
  aiApiKeys: Record<AIProvider, string | null>; // AES-encrypted at rest
  aiProviders: Record<AIProvider, { endpoint: string; defaultModel: string }>;
  theme: 'light' | 'dark';
  lastOpenedNoteIds: string[];       // Restored on app restart
  defaultCanvasType: CanvasType;
  defaultNoteType: NoteType;
  appearance: AppearanceSettings;
  aiBehaviour: AIBehaviourSettings;
}

export interface AppearanceSettings {
  fontSize: 'sm' | 'md' | 'lg';
  fontFamily: 'lora' | 'georgia' | 'merriweather';
  lineHeight: 'compact' | 'normal' | 'relaxed';
}

export interface AIBehaviourSettings {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  saveResponsesToNote: boolean;
}
```

---

## 9. GitHub Gist Sync Design

### Auth Flow

```
User enters GitHub Personal Access Token (PAT) in Settings → Sync & Export
         │
         ▼
SettingsService.update({ githubToken: encrypt(token) })
         │
         ▼
SyncService reads token on demand (never cached in memory after session end)
```

### Initial Sync Sequence

```
User: clicks "Enable Sync"
         │
         ▼
SyncService.syncNow()
         │
         ├── No gistId stored?
         │       │
         │       ▼
         │   POST /gists  (create new Gist with lore-notes.json, lore-notebooks.json, lore-shelves.json)
         │       │
         │       ▼
         │   Store gistId in Settings
         │       │
         │       ▼
         │   lastSyncAt = Date.now()
         │       │
         │       ▼
         └── Sync complete → state: 'synced'
```

### Delta Sync Sequence

```
User: online, triggers manual sync OR auto-sync on reconnect
         │
         ▼
SyncService.deltaSync(token)
         │
         ▼
GET /gists/:gistId
         │
         ├── 404?  → gistId stale → re-run initialSync
         ├── 429?  → throw "Rate limit" → Notification Center
         └── 200 OK
                │
                ▼
         Parse remote notes from lore-notes.json
                │
                ▼
         detectConflicts(localNotes, remoteNotes)
                │
         ┌──────┴──────┐
      conflicts?      no conflicts
         │                  │
         ▼                  ▼
  Set pendingConflicts   mergeNotes(local, remote)
  Notify user                  │
  BLOCK sync until             ▼
  all resolved         PATCH /gists/:gistId (push merged state)
                              │
                              ▼
                        lastSyncAt = Date.now()
                        state: 'synced'
```

### Conflict Resolution Strategy

- **Definition of conflict:** A note was modified locally (updatedAt > lastSyncAt) AND also modified remotely (remote.updatedAt > lastSyncAt) and the two `updatedAt` values differ.
- **Resolution options presented to user per conflict:**
  - "Keep my version" → local wins, remote overwritten on next push
  - "Use remote version" → remote note replaces local
  - Future: "Merge" (manual block-level merge) — not in v1
- **Auto-resolve:** Notes only modified locally (not touched remotely) → local wins automatically. Notes only modified remotely → remote wins automatically.

### Offline-First Behaviour

```
User edits offline (no network)
         │ All writes go to localStorage immediately
         │ syncState remains 'idle' (no error)
         │
         ▼
App detects reconnection via window.addEventListener('online', ...)
         │
         ▼
SyncService.syncNow() is called automatically
         │
         ▼
Delta sync runs; local changes since lastSyncAt are the "local" side
Remote changes since lastSyncAt are the "remote" side
Conflicts resolved as above
```

### Rate Limiting

- GitHub allows 5,000 API requests/hour for authenticated users.
- Lore makes at most 1 PATCH per sync, triggered either manually or on `'online'` event.
- Auto-sync minimum interval: 60 seconds (enforced by comparing `Date.now() - lastSyncAt`).

---

## 10. Anthropic API Integration Pattern

See Section 7.4 (AIService) for the full implementation. Key design decisions summarised:

### Streaming (SSE) Token-by-Token Pattern

```
fetch('/v1/messages', { body: {..., stream: true} })
         │
         ▼
response.body.getReader()
         │
         ▼
while(true) { reader.read() }
         │  decode TextDecoder → split on '\n' → filter 'data: ' lines
         ▼
JSON.parse each line → extract delta text via extractDelta()
         │
         ▼
request.onToken(delta, fullText)   ← component updates UI on each token
         │
         ▼
request.onComplete(fullText)       ← block persists final response
```

### Request/Response TypeScript Interfaces

```typescript
// Full types in Section 8 (shared/models/ai.models.ts)

// The internal wrapper pattern — AIService manages this internally:
interface StreamSession {
  requestId: string;
  abortController: AbortController;
  startedAt: number;
  tokensReceived: number;
  accumulated: string;
}
```

### API Key Management

- Keys read from `SettingsService` at call time — never stored in service properties
- Keys are AES-GCM encrypted in localStorage (see Section 14)
- If key is missing: error routed to `NotificationService`, never throws to component

### Concurrent Request Queuing

- One stream at a time (enforced by `isStreaming` computed signal check)
- Additional requests enter `requestQueue` signal
- On stream complete, `processQueue()` is called in `finally` block
- Queue is cleared on explicit `cancelStream()` + `clearQueue()` call (e.g., note closed)

---

## 11. Cron Scheduler Design

### Architecture Decision: Web Worker + Visibility API

The cron scheduler runs entirely in the browser using a Web Worker, with a Visibility API guard to handle tab-hidden scenarios.

**Why Web Worker:**
- Avoids main-thread blocking for cron tick calculations on large schedules
- Worker continues running when the main thread is busy rendering
- Worker is terminated cleanly on `ngOnDestroy` of `SchedulerService`

**Known Browser-Side Limitation:** Workers are paused by some mobile browsers when the tab is backgrounded for extended periods. Mitigation:
- On each page visibility change to `visible`, the main thread recalculates all `nextRunAt` timestamps and checks for any missed runs
- Missed runs are executed immediately (once) if they were due within the last 10 minutes; older missed runs are logged in `RunHistory` as `skipped`

### Web Worker Implementation

```typescript
// workers/scheduler.worker.ts

interface SyncMessage {
  type: 'SYNC';
  runs: Array<{ id: string; cron: string; nextRunAt: number | null; isEnabled: boolean }>;
}

type WorkerInput = SyncMessage;

let ticks: Map<string, { nextRunAt: number }> = new Map();
let intervalId: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  if (e.data.type === 'SYNC') {
    ticks.clear();
    for (const run of e.data.runs) {
      if (run.isEnabled && run.nextRunAt) {
        ticks.set(run.id, { nextRunAt: run.nextRunAt });
      }
    }
    startTicking();
  }
};

function startTicking(): void {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    const now = Date.now();
    for (const [runId, tick] of ticks.entries()) {
      if (now >= tick.nextRunAt) {
        self.postMessage({ type: 'RUN_DUE', runId });
        ticks.delete(runId); // Main thread will re-sync after execution
      }
    }
  }, 1000); // 1-second resolution
}
```

### Visibility-Based Catch-Up

```typescript
// In SchedulerService constructor:
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    this.catchUpMissedRuns();
  }
});

private catchUpMissedRuns(): void {
  const now = Date.now();
  const catchUpWindow = 10 * 60 * 1000; // 10 minutes
  for (const run of this.scheduledRuns()) {
    if (!run.isEnabled || !run.nextRunAt) continue;
    if (run.nextRunAt < now) {
      if (now - run.nextRunAt < catchUpWindow) {
        void this.executeRunNow(run.id);
      } else {
        // Log as skipped
        const entry: RunHistory = {
          id: crypto.randomUUID(), runId: run.id, promptId: run.promptId,
          status: 'error', outputHtml: '', startedAt: run.nextRunAt,
          completedAt: now, error: 'Skipped: tab was not active'
        };
        this.runHistory.update(h => [entry, ...h].slice(0, 100));
      }
    }
  }
}
```

### HTML Output Capture

The `RunHistory.outputHtml` field stores the AI response as markdown text (not rendered HTML) to avoid XSS. Rendering to HTML is done at display-time inside `RunOutputComponent` using a trusted markdown-to-HTML pipeline with DOMPurify sanitisation.

---

## 12. Error Handling Strategy

### Layered Architecture

```
Component Layer
   └── try/catch around user interactions → local error state signal
         └── Calls service method

Service Layer
   └── All service methods that call external APIs: try/catch → NotificationService.push()
   └── Service methods never throw to caller (fail silently with notification)

Global ErrorHandler
   └── Catches uncaught errors (e.g., ChangeDetection errors, unhandled promise rejections)
   └── Logs to console + pushes to NotificationService
```

### Global Error Handler

```typescript
// core/errors/global-error-handler.ts

import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class LoreErrorHandler implements ErrorHandler {
  private readonly notifications = inject(NotificationService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Lore Global Error]', error);
    this.notifications.push({
      id: crypto.randomUUID(), type: 'error',
      title: 'Unexpected Error', body: message,
      timestamp: Date.now(), read: false
    });
  }
}

// Registered in app.config.ts:
// { provide: ErrorHandler, useClass: LoreErrorHandler }
```

### Specific Error Scenarios

| Error Scenario | Detection | Handling |
|---|---|---|
| API key invalid (401) | `AIServiceError.status === 401` | Notification: "Invalid API Key" with link to Settings → AI Providers |
| Rate limit (429) | `AIServiceError.status === 429` | Notification: "Rate Limited — retry in X minutes"; expose `Retry-After` header value if present |
| Network offline | `fetch()` throws `TypeError: Failed to fetch` | Notification: "No internet connection"; `SyncService.syncState` → `'error'`; auto-retry on `'online'` event |
| Gist sync conflict | `SyncService.detectConflicts()` returns non-empty | Notification with action button → opens conflict resolution UI; sync blocked until resolved |
| Cron run failure | `executeRun()` catch block | `RunHistory` entry with `status: 'error'`; Notification in 'cron' tab |
| localStorage full | `localStorage.setItem()` throws `QuotaExceededError` | Notification: "Storage full — consider exporting old notes"; `LocalStorageService` catches and rethrows typed error |
| Note not found | `noteExistsGuard` returns false | Redirect to `/notes`; Notification: "Note not found or was deleted" |
| Worker unavailable | `typeof Worker === 'undefined'` | `SchedulerService` falls back to `setInterval` on main thread; logs warning |

---

## 13. Performance Considerations

### Virtual Scrolling for Note Lists

`NoteListComponent` and `SearchResultsComponent` use Angular CDK `ScrollingModule`:

```typescript
// note-list.component.ts
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="48" style="height: 100%">
      <div *cdkVirtualFor="let note of notes()">
        <app-note-list-item [note]="note" />
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Item size:** 48px fixed height. Variable-height notes use `AutoSizeVirtualScrollStrategy` from `@angular/cdk-experimental`.

### Knowledge Graph SVG — Lazy Loading

`KnowledgeGraphComponent` is behind a lazy route (`(aux:graph)`). The D3 or custom SVG force layout library is loaded only when the graph is first opened:

```typescript
const d3 = await import('d3');  // dynamic import inside ngAfterViewInit
```

For notes with >500 nodes, cluster the graph by shelf first and only render the full graph on zoom-in.

### Block Rendering Strategy for Large Notes

- `BlockListComponent` uses `ChangeDetectionStrategy.OnPush`
- Each `BlockHostComponent` subscribes to a `computed()` signal for its specific block — only re-renders when its own block changes
- For notes >100 blocks: implement virtual scrolling at the block list level using `AutoSizeVirtualScrollStrategy`
- Image blocks use `IntersectionObserver` for lazy image loading (native `loading="lazy"` as fallback)

### Search Debounce and Indexing

- Query debounced 300ms in `SearchService` (see Section 7.7)
- For v1: linear scan over notes/blocks in memory (acceptable for <1,000 notes)
- For v2: build a `lunr.js` or `minisearch` index updated lazily on `notes` signal change using `toObservable` + `debounceTime(2000)`
- Search index stored in-memory only (not persisted)

### ChangeDetection.OnPush Policy

**Policy:** All components use `ChangeDetectionStrategy.OnPush` without exception. This is enforced via an ESLint rule (`@angular-eslint/prefer-on-push-component-change-detection`).

Components affected:
- `NoteListComponent` — virtual scroll list
- `BlockListComponent` — main editor content
- `BlockHostComponent` and all 14 block type components
- `GraphCanvasComponent` — SVG render
- `SearchResultsComponent`
- `NotificationItemComponent`

### Bundle Splitting

```
Initial bundle (eager):         shell, sidebar, editor, core services, shared components
Lazy chunks (on-demand):        knowledge-graph, prompt-library, scheduler, settings, ai-chat, search
Code-split at route level via:  loadComponent: () => import(...)
```

**Target initial bundle:** <200KB gzipped. Enforce via `ng build --budget` with `maximumError: 200kb`.

Tree-shaking: All Phosphor icon imports are named imports — no full-library import.

---

## 14. Security Considerations

### API Key Storage — AES-GCM Encryption

API keys and GitHub tokens are stored AES-GCM encrypted in localStorage. The encryption key is derived from the app's origin using the Web Crypto API. This prevents keys from being readable by injected scripts on other origins but does NOT protect against malicious JavaScript executing on the same origin. Users must be informed of this limitation.

```typescript
// core/storage/local-storage.service.ts (encryption methods)

private async deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = enc.encode(window.location.origin + ':lore-v1');
  const importedKey = await crypto.subtle.importKey('raw', rawKey, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('lore-salt-v1'), iterations: 100_000, hash: 'SHA-256' },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async encryptSecret(value: string): Promise<string> {
  const key = await this.deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
}

async decryptSecret(stored: string): Promise<string> {
  const { iv, data } = JSON.parse(stored) as { iv: number[]; data: number[] };
  const key = await this.deriveKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return new TextDecoder().decode(decrypted);
}
```

**Keys stored in plaintext fields are:** never any. `aiApiKeys` and `githubToken` are always encrypted via `encryptSecret` before writing to localStorage.

### Content Security Policy (CSP)

Add to `index.html` `<meta http-equiv="Content-Security-Policy">`:

```
default-src 'self';
script-src 'self';
style-src 'self' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self' https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://api.github.com;
worker-src 'self' blob:;
frame-src 'none';
object-src 'none';
```

**Note:** `unsafe-inline` is **not** included. All styles must be in class-based stylesheets. Angular's ViewEncapsulation generates class-based styles, which comply.

### XSS Prevention for HTML Notes

The `html` note type renders user-authored HTML. This is the highest XSS risk in the application.

**Mitigation layers:**
1. **DOMPurify** sanitises all user-authored HTML before injection: `DOMPurify.sanitize(htmlContent, { FORCE_BODY: true, ALLOWED_TAGS: [...safelist] })`. The safelist excludes `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, event handler attributes (`on*`), and `javascript:` URIs.
2. Rendered HTML is displayed in a sandboxed `<iframe srcdoc="...">` with `sandbox="allow-same-origin"` — **no** `allow-scripts`. This isolates execution even if DOMPurify fails.
3. Angular's `DomSanitizer.bypassSecurityTrustHtml` is **never used** — all HTML goes through DOMPurify first.
4. ESLint rule `@angular-eslint/no-inner-html` prevents `[innerHTML]` binding anywhere except the single `HtmlNoteRendererComponent`, which is code-reviewed on every change.

### GitHub OAuth Token Handling

- Token is input as a Personal Access Token (PAT) — OAuth device flow is recommended for v2 but not implemented in v1 to avoid a backend
- PAT scope required: `gist` only (minimum privilege)
- Token never logged, never sent to any endpoint other than `api.github.com`
- Token is encrypted before localStorage write (see above)
- Token is cleared from memory immediately after each API call — not cached as a service property

### Additional Security Notes

- **No eval():** The cron parser library must not use `eval()` — validate before adding as dependency
- **Dependency auditing:** `npm audit` run as part of CI on every PR
- **iframe sandbox for Scheduler HTML output:** Run outputs displayed in `<iframe sandbox="allow-same-origin">` same as HTML notes
- **Clickjacking:** Add `X-Frame-Options: DENY` header (handled at hosting layer, e.g., Netlify `_headers` file)

---

*End of Lore Technical Architecture Document v1.0*