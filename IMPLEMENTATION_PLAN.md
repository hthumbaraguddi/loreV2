# Lore Application - Phased Implementation Plan

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

## Phase 1: Foundation & Shell (Week 1)
**Goal**: Establish project structure, design system, and application shell

### Tasks:
1. **Project Setup**
   - [ ] Create new Angular 17+ project with standalone components
   - [ ] Configure TypeScript strict mode
   - [ ] Set up SCSS with CSS custom properties
   - [ ] Install Angular CDK
   - [ ] Configure build and development environment

2. **Design System Implementation**
   - [ ] Create `src/styles/tokens.scss` with all CSS custom properties
     - Color tokens (light mode)
     - Typography scale
     - Spacing scale
     - Border radius scale
     - Shadow tokens
   - [ ] Create `src/styles/reset.scss`
   - [ ] Create `src/styles/global.scss`
   - [ ] Set up Google Fonts (Lora, DM Sans, JetBrains Mono)

3. **Application Shell**
   - [ ] Create `AppComponent` (root)
   - [ ] Create `ShellComponent` with CSS Grid layout
   - [ ] Create `NavRailComponent` with 7 navigation items
   - [ ] Create `LayoutService` for managing layout state
   - [ ] Set up routing configuration with lazy loading
   - [ ] Create route guards (auth, unsaved-changes stubs)

4. **Core Services Setup**
   - [ ] Create `LocalStorageService`
   - [ ] Create `IndexedDbService`
   - [ ] Create `ThemeService` (light mode only for now)
   - [ ] Create storage migration system

**Deliverable**: Working shell with navigation rail, collapsible sidebar placeholder, and routing

---

## Phase 2: Sidebar & Navigation (Week 2)
**Goal**: Implement three-level hierarchy navigation (Shelf → Notebook → Note)

### Tasks:
1. **Data Models**
   - [ ] Create `Shelf` model
   - [ ] Create `Notebook` model
   - [ ] Create `Note` model
   - [ ] Create `NoteType` enum (Research, Journal, Task, Idea, Reference, HTML)

2. **Core Services**
   - [ ] Create `ShelfService` with CRUD operations
   - [ ] Create `NoteService` with CRUD operations
   - [ ] Implement seed data for development
   - [ ] Add localStorage persistence

3. **Sidebar Components**
   - [ ] Create `SidebarComponent` (main container)
   - [ ] Create `ShelfTreeComponent` (recursive tree)
   - [ ] Create `NotebookGroupComponent`
   - [ ] Create `NoteItemComponent` with type icons
   - [ ] Create `NewItemInputComponent` (inline creation)
   - [ ] Create `ContextMenuComponent` (right-click menu)

4. **Interactions**
   - [ ] Implement expand/collapse animation (180ms)
   - [ ] Add CDK drag-drop for reordering
   - [ ] Implement search/filter functionality
   - [ ] Add keyboard navigation (Arrow keys, Enter, F2, Delete)

**Deliverable**: Fully functional sidebar with create, read, update, delete, and reorder operations

---

## Phase 3: Editor Foundation (Week 3)
**Goal**: Build split-pane editor with canvas and basic note display

### Tasks:
1. **Editor Components**
   - [ ] Create `SplitEditorComponent` (1/2/3 pane manager)
   - [ ] Create `PaneComponent` (individual pane)
   - [ ] Create `PaneHeaderComponent` (title, controls)
   - [ ] Create `PaperCanvasComponent` (note content host)
   - [ ] Create `CanvasBackgroundComponent` (4 background types)

2. **Canvas Backgrounds**
   - [ ] Implement Plain background
   - [ ] Implement Dot Grid background (SVG)
   - [ ] Implement Square Grid background (SVG)
   - [ ] Implement Lined background (CSS)

3. **Pane Management**
   - [ ] Implement pane splitting (1 → 2 → 3)
   - [ ] Add draggable resize dividers
   - [ ] Implement pane close functionality
   - [ ] Add pane focus management
   - [ ] Create `EditorService` for editor state

4. **Note Loading**
   - [ ] Connect panes to note data
   - [ ] Implement note title editing
   - [ ] Add breadcrumb navigation (Shelf › Notebook › Note)
   - [ ] Handle empty pane state (drop zone)

**Deliverable**: Working split-pane editor that can display notes with different backgrounds

---

## Phase 4: Block System - Part 1 (Week 4)
**Goal**: Implement core block types and block management

### Tasks:
1. **Block Infrastructure**
   - [ ] Create `Block` model with all 14 block types
   - [ ] Create `BlockService` for block CRUD
   - [ ] Create `BlockHostComponent` (dynamic block renderer)
   - [ ] Create `BlockListComponent` with CDK drag-drop
   - [ ] Create `BlockToolbarComponent` (hover actions)

2. **Basic Block Types** (6 blocks)
   - [ ] Create `HypothesisBlockComponent`
   - [ ] Create `ConclusionBlockComponent`
   - [ ] Create `NoteBlockComponent` (insight)
   - [ ] Create `WarningBlockComponent`
   - [ ] Create `QuoteBlockComponent` (with attribution)
   - [ ] Create `DividerBlockComponent`

3. **Block Interactions**
   - [ ] Implement `/` slash command palette
   - [ ] Add block drag-to-reorder
   - [ ] Implement block deletion
   - [ ] Add block duplication
   - [ ] Create block type picker popover

**Deliverable**: Editor with 6 working block types and slash command interface

---

## Phase 5: Block System - Part 2 (Week 5)
**Goal**: Complete remaining block types

### Tasks:
1. **Structured Block Types** (5 blocks)
   - [ ] Create `KeyDifferencesBlockComponent` (two-column)
   - [ ] Create `KeyFindingsBlockComponent` (numbered list)
   - [ ] Create `ChecklistBlockComponent` (interactive checkboxes)
   - [ ] Create `TableBlockComponent` (editable grid)
   - [ ] Create `CodeBlockComponent` (syntax highlighting)

2. **Media Block Types** (1 block)
   - [ ] Create `ImageBlockComponent` (upload, drag-drop, URL)
   - [ ] Implement image storage (IndexedDB)
   - [ ] Add image size validation (10MB limit)

3. **Block Features**
   - [ ] Add block comments (inline threading)
   - [ ] Implement comment resolution
   - [ ] Add block metadata (created, updated timestamps)
   - [ ] Implement block search within note

**Deliverable**: Complete block system with all 12 non-AI block types

---

## Phase 6: AI Integration - Part 1 (Week 6)
**Goal**: Implement Claude API integration and AI blocks

### Tasks:
1. **AI Infrastructure**
   - [ ] Create `AIService` for API communication
   - [ ] Implement streaming response handling
   - [ ] Add API key management (encrypted localStorage)
   - [ ] Create error handling for API failures

2. **AI Block Types** (2 blocks)
   - [ ] Create `AskClaudeBlockComponent`
   - [ ] Create `AskGPTBlockComponent`
   - [ ] Implement streaming response display
   - [ ] Add prompt editing and re-run
   - [ ] Store prompt and response in block

3. **Settings - AI Providers Tab**
   - [ ] Create `SettingsPanelComponent` (shell)
   - [ ] Create `AIProvidersTabComponent`
   - [ ] Add API key input fields (Anthropic, OpenAI, Gemini, Groq)
   - [ ] Implement connection testing
   - [ ] Add default model selection

**Deliverable**: Working AI blocks with Claude API integration and settings panel

---

## Phase 7: AI Features - Part 2 (Week 7)
**Goal**: Add AI chat sidebar and inline AI mentions

### Tasks:
1. **AI Chat Sidebar**
   - [ ] Create `AIChatComponent` (right panel)
   - [ ] Implement multi-turn conversation
   - [ ] Add model switcher (Claude, GPT, Gemini, Groq)
   - [ ] Create "Save as Block" functionality
   - [ ] Add chat history persistence

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

---

## Phase 8: Prompt Library & Scheduling (Week 8)
**Goal**: Implement prompt management and scheduled runs

### Tasks:
1. **Prompt Library**
   - [ ] Create `PromptLibraryComponent`
   - [ ] Create `PromptService` for CRUD operations
   - [ ] Create `PromptEditorComponent` (modal)
   - [ ] Implement `{{variable}}` syntax
   - [ ] Add variable type definitions
   - [ ] Create prompt card list view

2. **Prompt Scheduling**
   - [ ] Create `SchedulerService` with Web Worker
   - [ ] Implement cron expression parser
   - [ ] Create `PromptSchedulerComponent` (cron editor)
   - [ ] Add countdown timer display
   - [ ] Implement run history tracking

3. **Scheduled Runs Dashboard**
   - [ ] Create `SchedulerComponent` (full page)
   - [ ] Create run history table
   - [ ] Add stats cards (total runs, success rate, etc.)
   - [ ] Implement enable/disable toggles
   - [ ] Add "Run Now" and "Retry" actions

4. **Prompt Execution**
   - [ ] Create `PromptSlideoverComponent`
   - [ ] Implement variable substitution
   - [ ] Add AI provider selection per prompt
   - [ ] Create run progress modal (4-step animation)
   - [ ] Store run outputs

**Deliverable**: Complete prompt library with scheduling and execution

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

## Phase 12: Dark Mode & Zen Mode (Week 12)
**Goal**: Implement theme switching and focus mode

### Tasks:
1. **Dark Mode**
   - [ ] Create dark mode CSS tokens
   - [ ] Implement theme toggle (⌘⇧D)
   - [ ] Add theme persistence
   - [ ] Update all components for dark mode
   - [ ] Add smooth theme transition (300ms)

2. **Zen Mode**
   - [ ] Implement Zen mode toggle
   - [ ] Hide all chrome (sidebar, rail, panels)
   - [ ] Create floating Zen bar
   - [ ] Add wide margins for editor
   - [ ] Implement Escape to exit

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

## Phase 15: Templates & Onboarding (Week 15)
**Goal**: Implement template system and user onboarding

### Tasks:
1. **Template System**
   - [ ] Create `TemplateService`
   - [ ] Create `TemplateBuilderComponent`
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
