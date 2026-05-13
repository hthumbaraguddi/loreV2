# Lore Application - Phased Implementation Plan

> **📌 FOR AI AGENTS:** This is a PRIMARY file that MUST be updated after completing any task.  
> See `README_FOR_AI_AGENTS.md` and `UPDATE_CHECKLIST.md` for update instructions.

## 📊 Overall Progress Summary

**Last Updated**: May 13, 2026

### Phase Completion Status
- ✅ **Phase 1**: Foundation & Shell - **COMPLETE**
- ✅ **Phase 2**: Sidebar & Navigation - **COMPLETE**
- ✅ **Phase 3**: Editor Foundation - **COMPLETE**
- ✅ **Phase 4**: Block System Part 1 - **COMPLETE**
- ✅ **Phase 5**: Block System Part 2 - **COMPLETE** (12/12 blocks including Table)
- ✅ **Phase 6**: AI Integration Part 1 - **COMPLETE** (98%, only tests pending)
- ✅ **Phase 7**: AI Features Part 2 - **COMPLETE** (100%)
- 🚧 **Phase 8**: Prompt Library & Scheduling - **IN PROGRESS** (60%)
- ⏳ **Phase 9**: Linking & Search - **NOT STARTED**
- ⏳ **Phase 10**: Knowledge Graph - **NOT STARTED**
- ⏳ **Phase 11**: HTML Notes - **NOT STARTED**
- 🚧 **Phase 12**: Dark Mode & Zen Mode - **IN PROGRESS** (75%, dark mode complete)
- ⏳ **Phase 13**: Notifications & Quick Capture - **NOT STARTED**
- ⏳ **Phase 14**: Sharing & Export - **NOT STARTED**
- ⏳ **Phase 15**: Templates & Onboarding - **NOT STARTED**
- ⏳ **Phase 16**: Polish & Testing - **NOT STARTED**

### Key Achievements
- ✅ Complete design system with light/dark themes
- ✅ Fully functional sidebar with drag-drop, search, and keyboard navigation
- ✅ Split-pane editor (1/2/3 panes) with resizable dividers
- ✅ 4 canvas background types (plain, dot, square, lined)
- ✅ 12 standard block types + 3 AI block types (15 total)
- ✅ Slash command palette for block insertion
- ✅ Note linking with [[ syntax and file link palette
- ✅ Notebook grid view for browsing notes with filters and tabs
- ✅ Theme toggle with dark mode support
- ✅ Settings panel with AI Providers tab
- ✅ Template builder structure
- ✅ Landing page with animated gradient
- ✅ Storage sync service for data persistence
- ✅ Floating pane action buttons (Panel, History, Canvas)
- ✅ Breadcrumb navigation in editor header
- ✅ Focus mode (Zen mode) toggle
- ✅ **AI Integration with 4 providers (Claude, GPT, Gemini, Groq)**
- ✅ **AI Chat sidebar with streaming responses**
- ✅ **Complete versioning system (git-style)**
- ✅ **Session-based automatic versioning**
- ✅ **Comment service infrastructure**

### Bonus Features Implemented
- ✅ **Note Versioning System** - Complete version control with git-style tree view
- ✅ **Comment Service** - Infrastructure for block and note comments
- ✅ **Chat History Service** - Persistent AI conversation history
- ✅ **Table Block** - Editable grid block type

### Additional Components Implemented
- ✅ `NotebookGridComponent` - Grid view for browsing notes
- ✅ `FileLinkPaletteComponent` - Note linking interface
- ✅ `LandingComponent` - Marketing landing page
- ✅ `ThemeToggleComponent` - Theme switcher
- ✅ `TemplateBuilderComponent` - Template creation UI
- ✅ `KnowledgeGraphComponent` - Graph visualization placeholder
- ✅ `HTMLNotesGalleryComponent` - HTML notes viewer placeholder
- ✅ `AIChatComponent` - AI chat sidebar with multi-turn conversations
- ✅ `VersionHistoryComponent` - Version timeline modal
- ✅ `VersionTreeComponent` - Git-style version tree view
- ✅ `AskClaudeBlockComponent` - Claude AI block
- ✅ `AskGPTBlockComponent` - GPT AI block
- ✅ `TableBlockComponent` - Editable table block

### Next Priority: Phase 7 - Complete AI Features
Focus on inline AI mentions and AI behaviour settings.

---

## Overview
This document outlines the phased approach to rebuilding the Lore application from scratch using Angular 17+ with standalone components, based on the comprehensive documentation in `lore-docs/` and the feature progression shown in the mocks.

## Technology Stack
- **Framework**: Angular 17+ (Standalone Components)
- **State Management**: Angular Signals + Services (no NgRx in v1)
- **Styling**: SCSS with CSS Custom Properties
- **UI Components**: Custom components following design system
- **Drag & Drop**: Angular CDK
- **Icons**: Material Symbols (Phosphor as alternative)
- **Fonts**: Lora (serif), DM Sans (sans), JetBrains Mono (mono)

## Phase 1: Foundation & Shell (Week 1) ✅ COMPLETE
**Goal**: Establish project structure, design system, and application shell

### Tasks:
1. **Project Setup**
   - [x] Create new Angular 17+ project with standalone components
   - [x] Configure TypeScript strict mode
   - [x] Set up SCSS with CSS custom properties
   - [x] Install Angular CDK
   - [x] Configure build and development environment

2. **Design System Implementation**
   - [x] Create `src/styles/tokens.scss` with all CSS custom properties
     - Color tokens (light mode)
     - Typography scale
     - Spacing scale
     - Border radius scale
     - Shadow tokens
   - [x] Create `src/styles/reset.scss`
   - [x] Create `src/styles/global.scss`
   - [x] Set up Google Fonts (Lora, DM Sans, JetBrains Mono)

3. **Application Shell**
   - [x] Create `AppComponent` (root)
   - [x] Create `ShellComponent` with CSS Grid layout
   - [x] Create `NavRailComponent` with 7 navigation items
   - [x] Create `LayoutService` for managing layout state
   - [x] Set up routing configuration with lazy loading
   - [x] Create route guards (auth, unsaved-changes stubs)

4. **Core Services Setup**
   - [x] Create `LocalStorageService`
   - [ ] Create `IndexedDbService`
   - [x] Create `ThemeService` (light mode only for now)
   - [ ] Create storage migration system

**Deliverable**: ✅ Working shell with navigation rail, collapsible sidebar placeholder, and routing

---

## Phase 2: Sidebar & Navigation (Week 2) ✅ COMPLETE
**Goal**: Implement three-level hierarchy navigation (Shelf → Notebook → Note)

### Tasks:
1. **Data Models**
   - [x] Create `Shelf` model
   - [x] Create `Notebook` model
   - [x] Create `Note` model
   - [x] Create `NoteType` enum (Research, Journal, Task, Idea, Reference, HTML)

2. **Core Services**
   - [x] Create `ShelfService` with CRUD operations
   - [x] Create `NoteService` with CRUD operations
   - [x] Implement seed data for development
   - [x] Add localStorage persistence

3. **Sidebar Components**
   - [x] Create `SidebarComponent` (main container)
   - [x] Create `ShelfTreeComponent` (recursive tree)
   - [x] Create `NotebookGroupComponent`
   - [x] Create `NoteItemComponent` with type icons
   - [x] Create `NewItemInputComponent` (inline creation)
   - [x] Create `ContextMenuComponent` (right-click menu)

4. **Interactions**
   - [x] Implement expand/collapse animation (180ms)
   - [x] Add CDK drag-drop for reordering
   - [x] Implement search/filter functionality
   - [x] Add keyboard navigation (Arrow keys, Enter, F2, Delete)

**Deliverable**: ✅ Fully functional sidebar with create, read, update, delete, and reorder operations

---

## Phase 3: Editor Foundation (Week 3) ✅ COMPLETE
**Goal**: Build split-pane editor with canvas and basic note display

### Tasks:
1. **Editor Components**
   - [x] Create `SplitEditorComponent` (1/2/3 pane manager)
   - [x] Create `PaneComponent` (individual pane)
   - [x] Create `PaneHeaderComponent` (title, controls)
   - [x] Create `PaperCanvasComponent` (note content host)
   - [x] Create `CanvasBackgroundComponent` (4 background types)

2. **Canvas Backgrounds**
   - [x] Implement Plain background
   - [x] Implement Dot Grid background (SVG)
   - [x] Implement Square Grid background (SVG)
   - [x] Implement Lined background (CSS)

3. **Pane Management**
   - [x] Implement pane splitting (1 → 2 → 3)
   - [x] Add draggable resize dividers
   - [x] Implement pane close functionality
   - [x] Add pane focus management
   - [x] Create `EditorService` for editor state

4. **Note Loading**
   - [x] Connect panes to note data
   - [x] Implement note title editing
   - [x] Add breadcrumb navigation (Shelf › Notebook › Note)
   - [x] Handle empty pane state (drop zone)

5. **Additional Features Implemented**
   - [x] Notes header with breadcrumb navigation
   - [x] Live AI indicator
   - [x] Panel configuration toggle (1/2/3 panes)
   - [x] Focus mode toggle
   - [x] Toolbar action buttons (Ask AI, Templates)
   - [x] Floating pane action buttons (Panel, History, Canvas)
   - [x] Automatic pane space regain on close
   - [x] Conditional pane header visibility

**Deliverable**: ✅ Working split-pane editor that can display notes with different backgrounds

---

## Phase 4: Block System - Part 1 (Week 4) ✅ COMPLETE
**Goal**: Implement core block types and block management

### Tasks:
1. **Block Infrastructure**
   - [x] Create `Block` model with all 14 block types
   - [x] Create `BlockService` for block CRUD
   - [x] Create `BlockHostComponent` (dynamic block renderer)
   - [x] Create `BlockListComponent` with CDK drag-drop
   - [x] Create `BlockToolbarComponent` (hover actions)

2. **Basic Block Types** (6 blocks)
   - [x] Create `HypothesisBlockComponent`
   - [x] Create `ConclusionBlockComponent`
   - [x] Create `NoteBlockComponent` (insight)
   - [x] Create `WarningBlockComponent`
   - [x] Create `QuoteBlockComponent` (with attribution)
   - [x] Create `DividerBlockComponent`

3. **Block Interactions**
   - [x] Implement `/` slash command palette
   - [x] Add block drag-to-reorder
   - [x] Implement block deletion
   - [x] Add block duplication
   - [x] Create block type picker popover

**Deliverable**: ✅ Editor with 6 working block types and slash command interface

---

## Phase 5: Block System - Part 2 (Week 5) ✅ COMPLETE
**Goal**: Complete remaining block types

### Tasks:
1. **Structured Block Types** (5 blocks)
   - [x] Create `KeyDifferencesBlockComponent` (two-column)
   - [x] Create `KeyFindingsBlockComponent` (numbered list)
   - [x] Create `ChecklistBlockComponent` (interactive checkboxes)
   - [x] Create `TableBlockComponent` (editable grid) ✅ **COMPLETED**
   - [x] Create `CodeBlockComponent` (syntax highlighting)

2. **Media Block Types** (1 block)
   - [x] Create `ImageBlockComponent` (upload, drag-drop, URL)
   - [ ] Implement image storage (IndexedDB)
   - [ ] Add image size validation (10MB limit)

3. **Block Features**
   - [ ] Add block comments (inline threading) - Service exists, UI pending
   - [ ] Implement comment resolution
   - [x] Add block metadata (created, updated timestamps)
   - [ ] Implement block search within note

**Deliverable**: ✅ Complete block system with 12 of 12 non-AI block types + 3 AI blocks

---

## Phase 6: AI Integration - Part 1 (Week 6) ✅ COMPLETE
**Goal**: Implement AI API integration and AI blocks

### Tasks:
1. **AI Infrastructure**
   - [x] Create `AIService` for API communication (661 lines)
   - [x] Create `ApiKeyManagerService` for secure key storage
   - [x] Implement streaming response handling (SSE)
   - [x] Add API key management (encrypted localStorage)
   - [x] Create error handling for API failures
   - [x] Support 4 providers (Anthropic, OpenAI, Google, Groq)

2. **AI Block Types** (3 blocks)
   - [x] Create `AskClaudeBlockComponent` (fully functional)
   - [x] Create `AskGPTBlockComponent` (fully functional)
   - [x] Create generic `AskAIBlockComponent`
   - [x] Implement streaming response display
   - [x] Add prompt editing and re-run
   - [x] Store prompt and response in block
   - [x] Add markdown rendering for responses

3. **Settings - AI Providers Tab**
   - [x] Create `SettingsPanelComponent` (complete)
   - [x] Create `AIProvidersTabComponent`
   - [x] Add API key input fields (Anthropic, OpenAI, Gemini, Groq)
   - [x] Implement connection testing
   - [x] Add default model selection
   - [x] Add masked API key display

**Deliverable**: ✅ Working AI blocks with multi-provider API integration and settings panel

**Pending**: Unit tests (ai.service.spec.ts)

---

## Phase 7: AI Features - Part 2 (Week 7) 🚧 IN PROGRESS
**Goal**: Add AI chat sidebar and inline AI mentions

### Tasks:
1. **AI Chat Sidebar**
   - [x] Create `AIChatComponent` (right panel) ✅ **COMPLETED**
   - [x] Create `ChatHistoryService` for persistence ✅ **COMPLETED**
   - [x] Implement multi-turn conversation ✅ **COMPLETED**
   - [x] Add model switcher (Claude, GPT, Gemini, Groq) ✅ **COMPLETED**
   - [x] Create "Save as Block" functionality ✅ **COMPLETED**
   - [x] Add chat history persistence ✅ **COMPLETED**
   - [x] Implement streaming responses ✅ **COMPLETED**
   - [ ] Add context passing (note content)

2. **Inline AI Mentions**
   - [ ] Implement `@mention` trigger detection
   - [ ] Create AI model picker dropdown
   - [ ] Add inline response rendering
   - [ ] Implement context passing (note content)

3. **Settings - AI Behaviour Tab**
   - [ ] Create `AIBehaviourTabComponent`
   - [ ] Add temperature control
   - [ ] Add max tokens setting
   - [ ] Add system prompt customization
   - [ ] Add response language setting

**Deliverable**: Complete AI interaction layer with chat and inline mentions

**Current Status**: 60% complete (chat sidebar done, mentions and settings pending)

---

## Phase 8: Prompt Library & Scheduling (Week 8) 🚧 IN PROGRESS
**Goal**: Implement prompt management and scheduled runs

**Status**: 60% Complete

### Tasks:
1. **Prompt Library**
   - [x] Create `PromptLibraryComponent`
   - [x] Create `PromptService` for CRUD operations
   - [x] Create `Prompt` model with variables
   - [x] Implement search and filtering
   - [x] Add grid and list views
   - [x] Implement import/export
   - [x] Create `PromptEditorComponent` (modal) ✅ NEW
   - [x] Implement variable management UI ✅ NEW
   - [x] Add variable type definitions ✅ NEW
   - [x] Create prompt card list view

2. **Prompt Scheduling**
   - [x] Create `SchedulerService` with interval checking
   - [x] Implement cron expression parser
   - [x] Add schedule validation
   - [x] Calculate next run times
   - [x] Create cron editor UI ✅ NEW
   - [x] Add cron presets ✅ NEW
   - [ ] Add countdown timer display
   - [ ] Implement run history tracking UI

3. **Scheduled Runs Dashboard**
   - [ ] Create `SchedulerComponent` (full page)
   - [ ] Create run history table
   - [ ] Add stats cards (total runs, success rate, etc.)
   - [ ] Implement enable/disable toggles
   - [ ] Add "Run Now" and "Retry" actions

4. **Prompt Execution**
   - [ ] Create `PromptSlideoverComponent`
   - [ ] Implement variable substitution UI
   - [ ] Add AI provider selection per prompt
   - [ ] Create run progress modal (4-step animation)
   - [ ] Store run outputs

**Deliverable**: Complete prompt library with scheduling and execution

**Current Status**: Core infrastructure and editor complete. Execution and dashboard components pending.

---

## Phase 9: Linking & Search (Week 9)
**Goal**: Implement note linking, backlinks, and global search

### Tasks:
1. **Note Linking**
   - [ ] Create `NoteLinkerComponent` (overlay)
   - [ ] Implement `[[` trigger detection
   - [ ] Add fuzzy search for notes
   - [ ] Create backlink chip rendering
   - [ ] Implement backlink tracking in NoteService

2. **Context Panel**
   - [ ] Create `ContextPanelComponent` (right panel)
   - [ ] Create `NoteStatsComponent` (word count, blocks, etc.)
   - [ ] Create `TagsPanelComponent` (add/remove tags)
   - [ ] Create `LinkedNotesComponent` (backlinks list)
   - [ ] Create `MiniGraphComponent` (local graph view)

3. **Global Search**
   - [ ] Create `SearchService` with full-text indexing
   - [ ] Create `SearchOverlayComponent` (⌘K)
   - [ ] Implement search filters (type, shelf, date range)
   - [ ] Add keyboard navigation (arrow keys)
   - [ ] Highlight search results in note content

4. **Tags System**
   - [ ] Implement tag creation and management
   - [ ] Create tags browser view
   - [ ] Add tag-based filtering
   - [ ] Implement tag autocomplete

**Deliverable**: Complete linking and search functionality

---

## Phase 10: Knowledge Graph (Week 10)
**Goal**: Build interactive knowledge graph visualization

### Tasks:
1. **Graph Service**
   - [ ] Create `GraphService` for graph data
   - [ ] Implement graph layout algorithm
   - [ ] Calculate node positions and connections
   - [ ] Add shelf clustering logic

2. **Graph Visualization**
   - [ ] Create `KnowledgeGraphComponent`
   - [ ] Render SVG nodes and edges
   - [ ] Implement shelf cluster outlines (dashed)
   - [ ] Add cron job arrows
   - [ ] Implement zoom and pan

3. **Graph Interactions**
   - [ ] Create `NodeInspectorComponent` (side panel)
   - [ ] Add node click to open note
   - [ ] Implement node hover tooltips
   - [ ] Add graph legend
   - [ ] Create graph export (SVG, PNG)

**Deliverable**: Interactive knowledge graph with shelf clustering

---

## Phase 11: HTML Notes (Week 11)
**Goal**: Implement HTML note type with import and generation

### Tasks:
1. **HTML Note Infrastructure**
   - [ ] Extend Note model for HTML content
   - [ ] Create HTML storage in IndexedDB
   - [ ] Implement HTML sanitization

2. **HTML Import**
   - [ ] Create `HTMLImportModalComponent`
   - [ ] Add file upload (drag-drop)
   - [ ] Add paste HTML functionality
   - [ ] Add URL import
   - [ ] Create import preview

3. **HTML Generation**
   - [ ] Create `HTMLGenerateModalComponent`
   - [ ] Add AI prompt input
   - [ ] Implement template selection
   - [ ] Add variable table
   - [ ] Create 4-step progress animation

4. **HTML Gallery**
   - [ ] Create `HTMLNotesGalleryComponent`
   - [ ] Implement card grid view
   - [ ] Add preview thumbnails
   - [ ] Create full HTML viewer modal (iframe)
   - [ ] Add export options

**Deliverable**: Complete HTML notes feature with import and generation

---

## Phase 12: Dark Mode & Zen Mode (Week 12) 🚧 PARTIAL
**Goal**: Implement theme switching and focus mode

### Tasks:
1. **Dark Mode**
   - [x] Create dark mode CSS tokens
   - [x] Implement theme toggle (⌘⇧D)
   - [x] Add theme persistence
   - [x] Update all components for dark mode
   - [x] Add smooth theme transition (300ms)

2. **Zen Mode**
   - [x] Implement Zen mode toggle
   - [x] Hide all chrome (sidebar, rail, panels)
   - [ ] Create floating Zen bar
   - [ ] Add wide margins for editor
   - [x] Implement Escape to exit

3. **Settings - Appearance Tab**
   - [ ] Create `AppearanceTabComponent`
   - [ ] Add theme selector (Light/Dark/System)
   - [ ] Add canvas background picker
   - [ ] Add font size control
   - [ ] Add accent color override

**Deliverable**: Complete theme system with dark mode and zen mode

---

## Phase 13: Notifications & Quick Capture (Week 13)
**Goal**: Implement notification system and quick capture

### Tasks:
1. **Notification System**
   - [ ] Create `NotificationService`
   - [ ] Create `NotificationCenterComponent`
   - [ ] Implement notification types (All, Cron, AI, Errors)
   - [ ] Add unread indicators
   - [ ] Create notification actions (View, Dismiss, Retry)

2. **Quick Capture**
   - [ ] Create `QuickCaptureFABComponent` (⌘J)
   - [ ] Create `QuickCaptureModalComponent`
   - [ ] Implement Inbox notebook
   - [ ] Add quick note creation
   - [ ] Add keyboard shortcut handling

3. **Keyboard Shortcuts**
   - [ ] Create `KeyboardCheatsheetComponent` (? key)
   - [ ] Document all shortcuts
   - [ ] Implement global keyboard handler
   - [ ] Add shortcut hints in UI

**Deliverable**: Notification center and quick capture functionality

---

## Phase 14: Sharing & Export (Week 14)
**Goal**: Implement note sharing and export features

### Tasks:
1. **Note Sharing**
   - [ ] Create `ShareModalComponent`
   - [ ] Implement public link generation
   - [ ] Add link toggle (active/inactive)
   - [ ] Create read-only note view

2. **Export Functionality**
   - [ ] Create `ExportService`
   - [ ] Implement Markdown export
   - [ ] Implement PDF export
   - [ ] Implement HTML export
   - [ ] Implement plain text export

3. **GitHub Gist Integration**
   - [ ] Create `SyncService`
   - [ ] Implement OAuth flow
   - [ ] Add Gist push functionality
   - [ ] Add sync status display
   - [ ] Create Settings - Sync & Export tab

4. **Embed Code**
   - [ ] Generate iframe embed code
   - [ ] Add embed preview
   - [ ] Implement embed security

**Deliverable**: Complete sharing and export functionality

---

## Phase 15: Templates & Onboarding (Week 15) 🚧 PARTIAL
**Goal**: Implement template system and user onboarding

### Tasks:
1. **Template System**
   - [x] Create `TemplateService`
   - [x] Create `TemplateBuilderComponent` (UI structure)
   - [ ] Implement drag-and-drop block palette
   - [ ] Add template metadata editor
   - [ ] Create template gallery

2. **Template Features**
   - [ ] Add required field checkboxes
   - [ ] Implement template variables
   - [ ] Create template preview
   - [ ] Add template → note instantiation
   - [ ] Create Settings - Templates tab

3. **Onboarding**
   - [ ] Create `OnboardingComponent` (4-step modal)
   - [ ] Step 1: Welcome
   - [ ] Step 2: Create Shelf
   - [ ] Step 3: Add Note
   - [ ] Step 4: Try AI
   - [ ] Add onboarding skip/complete tracking

4. **Settings - Profile Tab**
   - [ ] Create `ProfileTabComponent`
   - [ ] Add name, email, timezone fields
   - [ ] Add bio/persona context
   - [ ] Add response style chips

5. **Landing Page**
   - [x] Create `LandingComponent` with animated gradient
   - [x] Implement hero section with CTA
   - [x] Add feature showcase
   - [x] Responsive design

**Deliverable**: Complete template system and onboarding flow

---

## Phase 16: Polish & Testing (Week 16)
**Goal**: Final polish, testing, and optimization

### Tasks:
1. **Performance Optimization**
   - [ ] Implement virtual scrolling for long lists
   - [ ] Optimize change detection
   - [ ] Add lazy loading for images
   - [ ] Implement debouncing for search
   - [ ] Optimize bundle size

2. **Accessibility**
   - [ ] Add ARIA labels throughout
   - [ ] Implement keyboard navigation
   - [ ] Add focus management
   - [ ] Test with screen readers
   - [ ] Ensure WCAG AA compliance

3. **Testing**
   - [ ] Write unit tests for services
   - [ ] Write component tests
   - [ ] Add E2E tests for critical flows
   - [ ] Test cross-browser compatibility
   - [ ] Test responsive behavior

4. **Documentation**
   - [ ] Create user documentation
   - [ ] Document keyboard shortcuts
   - [ ] Create developer documentation
   - [ ] Add inline code comments
   - [ ] Create deployment guide

5. **Bug Fixes & Polish**
   - [ ] Fix any remaining bugs
   - [ ] Polish animations and transitions
   - [ ] Improve error messages
   - [ ] Add loading states
   - [ ] Optimize mobile experience

**Deliverable**: Production-ready application

---

## Success Criteria

### Technical
- [ ] Zero TypeScript errors in strict mode
- [ ] All components use OnPush change detection
- [ ] Bundle size < 500KB (gzipped)
- [ ] First Contentful Paint < 1.5s
- [ ] All interactions respond within 100ms
- [ ] 90%+ test coverage for services

### Functional
- [ ] All features from v12 mock implemented
- [ ] Offline-first with localStorage persistence
- [ ] Live Claude API integration working
- [ ] All 14 block types functional
- [ ] Split-pane editor with 1/2/3 panes
- [ ] Knowledge graph visualization
- [ ] Dark mode and zen mode
- [ ] Prompt library with scheduling
- [ ] HTML notes with import/generate

### User Experience
- [ ] Smooth animations (180ms expand/collapse)
- [ ] Keyboard shortcuts working
- [ ] Responsive design (desktop-first)
- [ ] Accessible (WCAG AA)
- [ ] Intuitive navigation
- [ ] Clear error messages

---

## Risk Mitigation

### Technical Risks
1. **AI API Rate Limits**: Implement request queuing and retry logic
2. **Large Note Performance**: Use virtual scrolling and lazy loading
3. **Browser Storage Limits**: Implement storage quota monitoring
4. **Complex State Management**: Use signals consistently, avoid prop drilling

### Schedule Risks
1. **Scope Creep**: Stick to P0 features, defer P1/P2 to post-launch
2. **Integration Issues**: Test integrations early and often
3. **Performance Issues**: Profile regularly, optimize incrementally

---

## Post-Launch Roadmap (P1/P2 Features)

### P1 Features (Next 3 months)
- Mobile responsive design
- Collaboration features (shared notebooks)
- Real-time sync across devices
- Advanced search with filters
- Note version history
- Template marketplace
- Browser extension for web clipping

### P2 Features (6-12 months)
- Mobile apps (iOS, Android)
- Desktop apps (Electron)
- API for third-party integrations
- Plugin system
- Advanced AI features (summarization, Q&A)
- Team workspaces
- Advanced analytics

---

## Development Guidelines

### Code Standards
- Use Angular 17+ standalone components exclusively
- Follow OnPush change detection strategy
- Use signals for local state, RxJS for async streams
- Prefix all selectors with `lore-`
- Use strict TypeScript (no `any`)
- Follow SCSS BEM naming convention
- Use CSS custom properties for all styling

### Git Workflow
- Feature branches from `main`
- PR reviews required
- Squash and merge
- Semantic commit messages
- Tag releases with version numbers

### Testing Strategy
- Unit tests for all services
- Component tests for complex components
- E2E tests for critical user flows
- Manual testing for UI/UX
- Performance testing for large datasets

---

## Conclusion

This phased approach ensures steady progress with clear milestones. Each phase builds on the previous one, allowing for iterative testing and refinement. The 16-week timeline is aggressive but achievable with focused development.

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Foundation & Shell
4. Schedule weekly progress reviews
