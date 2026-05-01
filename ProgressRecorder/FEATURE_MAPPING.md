# Feature Mapping: Implementation Plan → Mock Versions

This document maps the phased implementation plan to the mock versions (v1-v12) to guide development.

## Phase 1: Foundation & Shell ✅ COMPLETE
**Mock Reference**: v1
- Purple design system ✅
- Nav rail ✅
- Sidebar placeholder ✅
- Basic note editor placeholder ✅

---

## Phase 2: Sidebar & Navigation
**Mock Reference**: v3
**Status**: NEXT TO BUILD

### Features from v3:
- ✅ Shelf → Notebook → Notes three-level sidebar
- ✅ Compact / expanded sidebar toggle
- ✅ Note type badges (Research, Journal, Task, Idea, Reference, HTML)

### Implementation Tasks:
1. **Data Models** (from Phase 2)
   - Create `Shelf` model
   - Create `Notebook` model
   - Create `Note` model
   - Create `NoteType` enum

2. **Core Services**
   - Create `ShelfService` with CRUD operations
   - Create `NoteService` with CRUD operations
   - Implement seed data for development
   - Add localStorage persistence

3. **Sidebar Components**
   - Create `SidebarComponent` (main container)
   - Create `ShelfTreeComponent` (recursive tree)
   - Create `NotebookGroupComponent`
   - Create `NoteItemComponent` with type icons
   - Create `NewItemInputComponent` (inline creation)
   - Create `ContextMenuComponent` (right-click menu)

4. **Interactions**
   - Implement expand/collapse animation (180ms)
   - Add CDK drag-drop for reordering
   - Implement search/filter functionality
   - Add keyboard navigation

---

## Phase 3: Editor Foundation
**Mock Reference**: v4, v11
**Status**: PENDING

### Features from v4:
- Plain white paper canvas
- Slash command palette hint bar

### Features from v11:
- Canvas backgrounds (plain, dot grid, square grid, lined) — actual CSS rendering
- Split panes working simultaneously (1/2/3, each with independent note content)
- Pane resizers

### Implementation Tasks:
1. **Editor Components**
   - Create `SplitEditorComponent` (1/2/3 pane manager)
   - Create `PaneComponent` (individual pane)
   - Create `PaneHeaderComponent` (title, controls)
   - Create `PaperCanvasComponent` (note content host)
   - Create `CanvasBackgroundComponent` (4 background types)

2. **Canvas Backgrounds**
   - Implement Plain background
   - Implement Dot Grid background (SVG)
   - Implement Square Grid background (SVG)
   - Implement Lined background (CSS)

3. **Pane Management**
   - Implement pane splitting (1 → 2 → 3)
   - Add draggable resize dividers
   - Implement pane close functionality
   - Add pane focus management

---

## Phase 4 & 5: Block System
**Mock Reference**: v9, v10
**Status**: PENDING

### Features from v9:
- Block drag-to-reorder (full DnD with handles)
- Full slash palette (14 block types, searchable, keyboard nav)

### Features from v10:
- Template Builder (drag palette blocks onto canvas)
- Inline block comments (add, thread, reply, resolve)

### Implementation Tasks:
1. **Block Infrastructure**
   - Create `Block` model with all 14 block types
   - Create `BlockService` for block CRUD
   - Create `BlockHostComponent` (dynamic block renderer)
   - Create `BlockListComponent` with CDK drag-drop
   - Create `BlockToolbarComponent` (hover actions)

2. **All 14 Block Types**
   - Hypothesis, Conclusion, Note/Insight, Warning, Quote
   - Key Differences, Key Findings, Checklist, Table, Code
   - Image, Divider, Ask Claude, Ask GPT

---

## Phase 6 & 7: AI Integration
**Mock Reference**: v8, v10
**Status**: PENDING

### Features from v8:
- AI Chat sidebar (multi-turn, model switcher, save-as-block)
- Inline @mention AI (model picker dropdown)

### Features from v10:
- Live Claude API (actual fetch() to api.anthropic.com/v1/messages, streaming)

### Implementation Tasks:
1. **AI Infrastructure**
   - Create `AIService` for API communication
   - Implement streaming response handling
   - Add API key management

2. **AI Features**
   - AI Chat sidebar component
   - @mention inline AI
   - Ask Claude/GPT blocks

---

## Phase 8: Prompt Library & Scheduling
**Mock Reference**: v5, v6, v11, v12
**Status**: PENDING

### Features from v5:
- Prompt Library with cron schedule editor

### Features from v6:
- Scheduled Runs dashboard (table of past runs)
- Prompt slideover panel
- HTML generation animation (progress steps)

### Features from v11:
- Scheduled Runs table (full log, stats cards, enable/disable toggles, run now, retry)
- Next runs sidebar with live countdown chips

### Features from v12:
- Prompt Library — full CRUD with cards, editor modal, variable syntax
- Prompt Slideover with countdown, variable table, run history
- Run Now modal (4-step animated progress)

---

## Phase 9: Linking & Search
**Mock Reference**: v7, v8, v10, v11
**Status**: PENDING

### Features from v7:
- Global search overlay (⌘K) with keyboard nav

### Features from v8:
- [[ note linker with searchable picker → backlink chips
- Tags browser

### Features from v10:
- Advanced Search (type, shelf, date range filters, highlighted results)

### Features from v11:
- Full [[ linker per pane (keyboard nav, backlink chips inserted into body)

---

## Phase 10: Knowledge Graph
**Mock Reference**: v6, v11
**Status**: PENDING

### Features from v6:
- Knowledge Graph with cron output arrows

### Features from v11:
- Full interactive SVG, shelf cluster dashed outlines, cron arrows, node inspector

---

## Phase 11: HTML Notes
**Mock Reference**: v5, v12
**Status**: PENDING

### Features from v5:
- HTML Note import / generate flow

### Features from v12:
- Quick generate bar
- Drag/drop import zone
- Import modal (upload file / paste / URL tabs)
- Generate with AI modal
- HTML Notes gallery (cards with preview)
- Full HTML viewer modal

---

## Phase 12: Dark Mode & Zen Mode
**Mock Reference**: v7, v10, v11
**Status**: PENDING

### Features from v7:
- Full dark mode (CSS variable swap, ⌘⇧D)

### Features from v10:
- Zen / Focus mode (hides sidebar + toolbar, wide margins, floating zen bar)

### Features from v11:
- Dark mode applied across all views

---

## Phase 13: Notifications & Quick Capture
**Mock Reference**: v7, v9, v12
**Status**: PENDING

### Features from v7:
- Notification Center (slide-in panel)
- Quick Capture FAB (⌘J)

### Features from v9:
- Quick Capture FAB refined
- Keyboard cheatsheet (? key)

### Features from v12:
- Notification Center with tabs (All / Cron / AI / Errors)
- Unread indicators, action buttons

---

## Phase 14: Sharing & Export
**Mock Reference**: v9, v12
**Status**: PENDING

### Features from v9:
- Note sharing panel (link, export MD/PDF/HTML, embed code, GitHub Gist)

### Features from v12:
- Share link (copy, toggle active)
- Export (MD / PDF / HTML / Text)
- Embed iframe code
- GitHub Gist push

---

## Phase 15: Templates & Onboarding
**Mock Reference**: v6, v9, v10, v12
**Status**: PENDING

### Features from v6:
- Template → note flow

### Features from v9:
- Onboarding 4-step flow

### Features from v10:
- Template Builder (drag palette blocks onto canvas, required checkboxes, metadata sidebar)

### Features from v12:
- Settings — Templates tab (gallery of 6 templates with visual previews)

---

## Phase 16: Settings Panel
**Mock Reference**: v5, v12
**Status**: PENDING

### Features from v5:
- Full Settings panel (AI providers, appearance, cron toggles)

### Features from v12:
- Settings — 6 full tabs:
  - AI Providers (API key inputs, connected status, default model grid)
  - Profile (name, email, timezone, bio, persona context)
  - AI Behaviour (8 toggles)
  - Sync & Export (GitHub Gist sync, export options)
  - Templates (gallery)
  - Appearance (Light/Dark/System, canvas picker, font size)

---

## Build Order Priority

Based on feature dependencies and user value:

1. **Phase 2: Sidebar & Navigation** (v3) ← START HERE
2. **Phase 3: Editor Foundation** (v4, v11)
3. **Phase 4-5: Block System** (v9, v10)
4. **Phase 6-7: AI Integration** (v8, v10)
5. **Phase 9: Linking & Search** (v7, v8, v10, v11)
6. **Phase 12: Dark Mode** (v7, v10, v11)
7. **Phase 8: Prompt Library** (v5, v6, v11, v12)
8. **Phase 10: Knowledge Graph** (v6, v11)
9. **Phase 11: HTML Notes** (v5, v12)
10. **Phase 13: Notifications** (v7, v9, v12)
11. **Phase 14: Sharing** (v9, v12)
12. **Phase 15: Templates** (v6, v9, v10, v12)
13. **Phase 16: Settings** (v5, v12)

---

## Next Action

**START: Phase 2 - Sidebar & Navigation (Mock v3)**

This will implement the core data hierarchy and navigation that all other features depend on.
