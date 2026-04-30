# LORE — Master Prompt Generator
> Five self-contained prompts for generating the full documentation suite of the Lore AI-powered knowledge base app.

---

---

# ═══════════════════════════════════════════════════
# PROMPT 1 — PRODUCT REQUIREMENTS DOCUMENT (PRD)
# ═══════════════════════════════════════════════════

## Copy everything below this line into a new Claude conversation

---

**ROLE**
You are a senior product manager with 10+ years of experience shipping developer-facing SaaS tools and AI-native productivity applications. You write PRDs that engineering and design teams can execute directly, with zero ambiguity.

---

**CONTEXT — PRODUCT OVERVIEW**

You are writing the PRD for **Lore**, an AI-powered knowledge base desktop/web application. Below is the full confirmed feature set.

**Core Structure**
- Nav rail + collapsible sidebar organised as: Shelf → Notebook → Notes hierarchy
- Split-pane editor supporting 1, 2, or 3 panes with independent notes per pane
- Right context panel showing: stats, tags, linked notes, mini graph
- Inline block comments with threading and resolve functionality

**Note Types:** Research, Journal, Task, Idea, Reference, HTML

**Block Types (14 total):**
Hypothesis, Conclusion, Note/Insight, Warning, Quote, Key Differences (side-by-side comparison), Key Findings (numbered list), Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT

**Canvas Backgrounds:** Plain, Dot grid, Square grid, Lined

**AI Features**
- Live Claude API integration via fetch to api.anthropic.com/v1/messages
- @mention AI inline with a model picker (Claude, GPT-4o, Gemini, Groq)
- AI Chat sidebar: multi-turn conversation, model switcher, save-as-block
- Prompt Library: full CRUD, `{{variable}}` syntax, cron scheduler
- Scheduled Runs: cron jobs, countdown timer, run history, HTML output
- HTML Notes: import, paste, generate via AI, gallery view, full viewer

**UX Features**
- Dark mode with full CSS variable swap, triggered via ⌘⇧D
- Zen / Focus mode that hides chrome and shows a floating zen bar
- Global search overlay (⌘K) with type/shelf/date filters and highlighted results
- `[[note linker` per pane with keyboard navigation and backlink chips
- Block drag-to-reorder with drag-and-drop handles
- Quick Capture FAB (⌘J) that saves to an Inbox notebook
- 4-step onboarding flow
- Keyboard cheatsheet overlay triggered by `?` key
- Template Builder: drag palette → canvas, add metadata, save as template
- Knowledge Graph: SVG visualisation with shelf clusters, cron arrows, node inspector
- Note Sharing: link, export as MD/PDF/HTML, embed code, GitHub Gist sync
- Notification Center with tabs: All / Cron / AI / Errors, and action buttons

**Settings (6 tabs):** AI Providers, Profile, AI Behaviour, Sync & Export, Templates, Appearance

**Design System**
- Fonts: Lora (serif, titles), DM Sans (UI), JetBrains Mono (metadata)
- Accent: #7C3AED (purple-600), dark mode: #C4B5FD
- Nav: #EAE7F7, Sidebar: #F0EEF9, Canvas: #FFFFFF
- Border: rgba(109,40,217,0.09), hover: rgba(109,40,217,0.06)
- Border radius scale: 4 / 8 / 12 / 18 px

**Target Tech Stack**
- Angular 17+ (standalone components, signals)
- Angular Material or custom component library
- RxJS for state management, NgRx optional
- TailwindCSS or SCSS with CSS custom properties
- Anthropic SDK or direct fetch for AI calls
- GitHub Gist API for sync

---

**YOUR TASK**

Write a complete, production-ready **Product Requirements Document (PRD)** for Lore. Every section must be filled in fully — no placeholders, no "TBD".

---

**OUTPUT FORMAT**

Use the following exact markdown structure:

```
# Lore — Product Requirements Document
Version: 1.0 | Status: Draft | Owner: [Product]

## 1. Executive Summary
(3–5 paragraphs: problem space, product vision, target market, key differentiators vs. Notion/Obsidian/Roam)

## 2. User Personas
(3 distinct personas, each with: Name, Role, Goals, Pain Points, Tech Comfort Level, Key Jobs-to-be-Done)

## 3. User Stories
(Grouped by feature area. Format strictly: "As a [persona], I want [action] so that [outcome]."
Minimum 40 stories total, covering all major features.)

## 4. Feature List with Priorities
(Markdown table with columns: Feature | Description | Priority | Rationale)
Priority values: P0 = must-have for MVP, P1 = launch, P2 = post-launch

## 5. Acceptance Criteria
(One subsection per P0 and P1 feature. Format: Given / When / Then.)

## 6. Out of Scope (v1)
(Bulleted list with brief rationale for each exclusion)

## 7. Success Metrics
(Table with columns: Metric | Definition | Target | Measurement Method)
Cover: activation, retention, AI feature usage, performance, NPS)
```

---

**CONSTRAINTS**
- All user stories must be written from one of the three defined personas
- Acceptance criteria must be testable — no vague language like "fast" or "intuitive"
- Priority assignments must be justified; P0 features must be achievable in a 3-month MVP sprint
- Do not invent features not listed above; capture every listed feature in the feature table
- Do not use bullet points inside acceptance criteria — use Given/When/Then format only
- The PRD should be usable standalone by an engineer who has never seen the mockups

---

**QUALITY CHECK**
Before submitting your response, verify:
- [ ] All 14 block types appear in the feature list or user stories
- [ ] All 6 settings tabs are covered
- [ ] Every P0 acceptance criterion has at least one unhappy-path / edge-case scenario
- [ ] No duplicate user stories
- [ ] Success metrics include both leading and lagging indicators
- [ ] Executive summary could be read by a non-technical stakeholder and fully understood
- [ ] The PRD has no placeholders or "to be defined" entries

---

---

# ═══════════════════════════════════════════════════
# PROMPT 2 — DESIGN SYSTEM SPECIFICATION
# ═══════════════════════════════════════════════════

## Copy everything below this line into a new Claude conversation

---

**ROLE**
You are a principal design systems engineer with deep expertise in token-based design, component anatomy documentation, and cross-theme accessibility. You have shipped design systems used by 50+ product teams. You write specs that Figma designers and Angular/CSS engineers can implement identically without any back-and-forth.

---

**CONTEXT — LORE DESIGN IDENTITY**

Lore is a calm, scholarly AI knowledge base. The aesthetic is academic-meets-modern: serif type for content, clean geometric sans for UI, a deep purple accent that signals intelligence without aggression.

**Confirmed Design Values:**
- Fonts: Lora (serif, note titles and headings), DM Sans (all UI chrome), JetBrains Mono (metadata, code, timestamps)
- Accent colour: #7C3AED (light mode), #C4B5FD (dark mode)
- Nav rail background: #EAE7F7
- Sidebar background: #F0EEF9
- Canvas/editor background: #FFFFFF (light), #1A1625 (dark — derive the exact token)
- Border: rgba(109,40,217,0.09)
- Hover overlay: rgba(109,40,217,0.06)
- Border radius scale: 4px (chip/tag), 8px (button/input), 12px (card/panel), 18px (modal/overlay)

**Block Types (14) that need component anatomy:**
Hypothesis, Conclusion, Note/Insight, Warning, Quote, Key Differences (side-by-side), Key Findings (numbered), Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT

**Themes:** Light mode (default) and Dark mode (full swap via CSS custom properties)

---

**YOUR TASK**

Write a complete **Design System Specification** for Lore. This is an engineering and design handoff document — it must be precise enough to implement without Figma files.

---

**OUTPUT FORMAT**

Use the following exact markdown structure:

```
# Lore — Design System Specification
Version: 1.0

## 1. Design Principles
(4–6 named principles, each with a one-sentence description and one do/don't pair)

## 2. Colour Tokens

### 2.1 Primitive Palette
(Full colour ramp for purple, grey, red, green, yellow, blue — at least 11 stops each, hex values)

### 2.2 Semantic Tokens — Light Mode
(CSS custom properties table: --token-name | Value | Usage)
Cover: background, surface, border, text, icon, accent, state (hover/active/focus/disabled), feedback (error/warning/success/info))

### 2.3 Semantic Tokens — Dark Mode
(Same table structure, all tokens remapped for dark)

### 2.4 Dark Mode Implementation Guide
(Step-by-step: how the [data-theme="dark"] attribute swap works, which tokens change, which stay, how to handle images and SVGs)

## 3. Typography Scale
(Table: Token | Font Family | Weight | Size | Line Height | Letter Spacing | Usage)
Cover: display-xl, display-lg, heading-1 through heading-4, body-lg, body-md, body-sm, caption, code, label, overline)

## 4. Spacing Scale
(Table: Token | Value in px | Value in rem | Common usage)
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

## 5. Border Radius Scale
(Table: Token | Value | Usage examples)

## 6. Shadow Tokens
(Table: Token | CSS value | Usage)
Cover: shadow-sm, shadow-md, shadow-lg, shadow-overlay, shadow-focus-ring)

## 7. Component Anatomy — 14 Block Types
(One subsection per block type. Each subsection contains:
  - Visual description of the block's structure
  - Named anatomy parts (e.g., "block-header", "block-body", "block-icon")
  - Token mapping: which design token each part uses
  - States: default, hover, focused, editing, collapsed, commenting
  - Size variants if applicable
  - Accessibility notes: role, aria-label pattern, keyboard behaviour)

## 8. Icon Usage Rules
(Icon library choice, size scale: 16/20/24px, colour rules, when to use icon-only vs icon+label, prohibited usages)

## 9. Animation & Transition Specifications
(Table: Interaction | Duration | Easing | CSS property)
Cover: panel slide, modal enter/exit, tooltip, hover state, focus ring, dark mode swap, block drag, search overlay)

## 10. Do / Don't Examples
(Minimum 12 pairs covering colour misuse, typography misuse, spacing violations, component misuse)
```

---

**CONSTRAINTS**
- All colour tokens must be defined as CSS custom properties (--lore-[category]-[name])
- Dark mode must NOT use a separate stylesheet — only a [data-theme="dark"] attribute override
- Typography must pass WCAG AA contrast for body text (4.5:1) and large text (3:1) in both themes
- All token names must follow a consistent naming convention — document the convention explicitly
- The 14 block anatomy specs must include every named part needed to write the SCSS for that component
- Animation durations must be specified in milliseconds, not vague terms
- Do/don't examples must reference specific token names, not generic descriptions

---

**QUALITY CHECK**
Before submitting your response, verify:
- [ ] Every colour token exists in both light and dark tables
- [ ] All 14 block types have a full anatomy spec
- [ ] Typography scale has a token for every text style that appears in the UI
- [ ] Shadow tokens include a focus-ring style (for keyboard accessibility)
- [ ] Dark mode guide explains how to handle the canvas background for all 4 canvas types
- [ ] Animation spec covers the search overlay open/close (it's the most complex transition)
- [ ] No token value is duplicated under two different names without an alias explanation
- [ ] All CSS custom property names are kebab-case and prefixed consistently

---

---

# ═══════════════════════════════════════════════════
# PROMPT 3 — TECHNICAL ARCHITECTURE DOCUMENT
# ═══════════════════════════════════════════════════

## Copy everything below this line into a new Claude conversation

---

**ROLE**
You are a principal frontend architect specialising in Angular enterprise applications and AI-integrated web apps. You have led architecture reviews for apps with 100k+ MAU and complex real-time state requirements. You write architecture documents that a senior engineer can hand to a mid-level engineer and have them implement correctly.

---

**CONTEXT — LORE TECHNICAL REQUIREMENTS**

Lore is an Angular 17+ desktop/web app — a knowledge base with AI integration. The full feature set:

**Core Architecture Needs:**
- Nav rail + collapsible sidebar with 3-level hierarchy (Shelf → Notebook → Notes)
- Split-pane editor: 1, 2, or 3 panes, each holding an independent note
- Right context panel with stats, tags, linked notes, mini graph
- Inline block comments with threading and resolve

**Note Types:** Research, Journal, Task, Idea, Reference, HTML
**Block Types (14):** Hypothesis, Conclusion, Note/Insight, Warning, Quote, Key Differences, Key Findings, Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT
**Canvas types:** Plain, Dot grid, Square grid, Lined

**AI Integration:**
- Direct fetch to `api.anthropic.com/v1/messages` (Claude)
- @mention AI inline with model picker (Claude, GPT-4o, Gemini, Groq)
- AI Chat sidebar: multi-turn conversation, model switcher, save-as-block
- Prompt Library: CRUD, `{{variable}}` substitution, cron scheduler
- Scheduled Runs: cron jobs, countdown, run history, HTML output

**Persistence & Sync:**
- Local storage schema for offline-first operation
- GitHub Gist API for cloud sync
- Export: MD, PDF, HTML

**UX Systems:**
- Dark mode via CSS custom property swap
- Global search overlay with filters
- `[[note linker` with keyboard nav and backlink chips
- Block drag-to-reorder
- Quick Capture FAB → Inbox
- Knowledge Graph: SVG, shelf clusters, cron arrows, node inspector
- Notification Center (All/Cron/AI/Errors tabs)
- Note Sharing (link, embed, GitHub Gist)
- Template Builder

**Settings (6 tabs):** AI Providers, Profile, AI Behaviour, Sync & Export, Templates, Appearance

**Tech Stack:**
- Angular 17+ standalone components and signals
- RxJS for reactive streams, NgRx optional but must be recommended or ruled out with rationale
- TailwindCSS or SCSS with CSS custom properties
- Anthropic SDK or direct fetch
- GitHub Gist REST API

---

**YOUR TASK**

Write a complete **Technical Architecture Document** for Lore. This document is the engineering source of truth before any code is written.

---

**OUTPUT FORMAT**

Use the following exact markdown structure:

```
# Lore — Technical Architecture Document
Version: 1.0

## 1. Architecture Overview
(C4-style context diagram described in text + ASCII art. Explain system boundaries: browser app, Anthropic API, GitHub Gist API, optional future backend.)

## 2. Angular Project Structure
(Full folder tree using code block. Every folder explained. Follow Angular 17+ standalone component conventions.)

## 3. Feature Module Breakdown
(Table: Feature Area | Folder | Key Files | Lazy Loaded? | Dependencies)

## 4. Component Tree
(ASCII tree showing parent → child relationships for all major components. Indicate @Input/@Output flow direction.)

## 5. Routing Table
(Table: Route Path | Component | Guard | Resolve | Notes)
Cover all top-level and nested routes including modal/overlay routes if using router outlet for overlays.)

## 6. State Management Strategy
(Explain the chosen approach: Angular Signals + Services vs NgRx. 
For each major domain — notes, editor, AI, prompts, settings, search — specify:
  - Where state lives
  - How it is updated
  - How components subscribe
Include a NgRx decision tree: when to add a store slice vs keep it in a service signal.)

## 7. Service Contracts
(One subsection per service. For each:
  - Class name and file path
  - Public method signatures in TypeScript
  - Signals or Observables it exposes
  - Dependencies injected
  - Side effects and error handling)
Cover: NoteService, BlockService, EditorService, AIService, PromptService, SchedulerService, SearchService, GraphService, SyncService, NotificationService, ThemeService, TemplateService

## 8. Local Storage Schema
(JSON schema or TypeScript interface for every persisted entity: Shelf, Notebook, Note, Block, Comment, Prompt, ScheduledRun, Settings, SearchHistory)

## 9. GitHub Gist Sync Design
(Sequence diagram in ASCII. Cover: initial sync, conflict resolution strategy, delta sync, auth flow, rate limiting, error recovery.)

## 10. Anthropic API Integration Pattern
(Code-level pattern: how AIService wraps fetch, handles streaming responses, manages API keys from settings, queues concurrent requests, surfaces errors to Notification Center. Include a TypeScript interface for the request/response wrapper.)

## 11. Cron Scheduler Design
(Browser-side approach using Web Workers or setInterval with visibility API. Cover: persistence of cron state, countdown calculation, run history storage, HTML output capture, failure handling.)

## 12. Error Handling Strategy
(Layered strategy: component level, service level, global ErrorHandler. How errors flow to Notification Center. Specific handling for: API key invalid, rate limit, network offline, Gist sync conflict, cron run failure.)

## 13. Performance Considerations
(Cover: virtual scrolling for large note lists, lazy loading for Knowledge Graph SVG, block render strategy for large notes, search debounce and indexing, Angular ChangeDetection.OnPush policy, bundle splitting strategy.)

## 14. Security Considerations
(API key storage: never in code, localStorage encryption approach. Content Security Policy for HTML Notes. XSS prevention for rendered HTML blocks. GitHub OAuth token handling.)
```

---

**CONSTRAINTS**
- All TypeScript must use strict mode — no `any` types in service contracts
- File paths must be relative to `src/app/` and follow Angular CLI conventions
- NgRx must be recommended or explicitly ruled out — no "it depends" non-answers
- The Gist sync design must handle offline-first: explain what happens when the user edits offline and reconnects
- Cron scheduler must not use a backend — browser-only, explain limitations and mitigations
- Code examples must compile — do not use pseudocode in service contracts

---

**QUALITY CHECK**
Before submitting your response, verify:
- [ ] The folder tree covers every feature area mentioned in the context
- [ ] Every service in section 7 has typed method signatures (no implicit any)
- [ ] Local storage schema has a version field and a migration strategy note
- [ ] Gist sync covers the conflict resolution case explicitly
- [ ] The Anthropic integration pattern handles streaming token-by-token responses
- [ ] Performance section mentions OnPush for every list component
- [ ] Security section addresses HTML Notes XSS risk specifically
- [ ] No route is missing from the routing table

---

---

# ═══════════════════════════════════════════════════
# PROMPT 4 — COMPONENT SPECIFICATION DOCUMENT
# ═══════════════════════════════════════════════════

## Copy everything below this line into a new Claude conversation

---

**ROLE**
You are a senior Angular engineer and design-systems architect. You write component specifications that serve as the contract between design, engineering, and QA. Your specs are precise enough that a developer can implement the component correctly without ever talking to you, and a QA engineer can write tests directly from your spec.

---

**CONTEXT — LORE APP**

Lore is an Angular 17+ standalone-component knowledge base app. The full feature set:

- Nav rail + collapsible sidebar (Shelf → Notebook → Notes hierarchy)
- Split-pane editor (1/2/3 panes, independent notes per pane)
- Right context panel (stats, tags, linked notes, mini graph)
- Inline block comments with threading and resolve
- Note Types: Research, Journal, Task, Idea, Reference, HTML
- Block Types (14): Hypothesis, Conclusion, Note/Insight, Warning, Quote, Key Differences, Key Findings, Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT
- Canvas Backgrounds: Plain, Dot grid, Square grid, Lined
- AI Chat sidebar, Prompt Library with CRUD and cron, Scheduled Runs
- Dark mode (⌘⇧D), Zen/Focus mode, Global search (⌘K)
- [[note linker, block drag-to-reorder, Quick Capture FAB (⌘J)
- Template Builder, Knowledge Graph SVG, Note Sharing, Notification Center
- Settings: 6 tabs (AI Providers, Profile, AI Behaviour, Sync & Export, Templates, Appearance)
- 4-step onboarding flow, Keyboard cheatsheet (? key)

**Design tokens:** Lora/DM Sans/JetBrains Mono fonts, #7C3AED accent, CSS custom properties for theming.

**Angular patterns:** Standalone components, Angular Signals for local state, RxJS for async streams, OnPush change detection.

---

**YOUR TASK**

Write a complete **Component Specification Document** covering every Angular component in the Lore app.

---

**OUTPUT FORMAT**

For **every** component, use this exact repeating template:

```
### ComponentName

**Selector:** `lore-component-name`
**File:** `src/app/features/[area]/[component-name]/[component-name].component.ts`
**Standalone:** Yes
**ChangeDetection:** OnPush

#### Inputs
| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|

#### Outputs
| Event | Payload Type | Description |
|-------|-------------|-------------|

#### Internal State (Signals / BehaviorSubjects)
| Signal/Subject | Type | Initial Value | Description |

#### Template Summary
(2–4 sentences describing what the template renders and its key structural regions)

#### SCSS / Tailwind Strategy
(Which tokens used, key class patterns, host: binding if applicable)

#### Accessibility
- ARIA role and key attributes
- Keyboard interaction map (key → action)
- Focus management notes

#### Unit Test Checklist
- [ ] Test 1
- [ ] Test 2
(Minimum 4 tests per component)

#### Storybook Story Outline
- Default story
- [variant] story
(Cover primary states and variants)
```

**Components to specify (in this order):**

**Shell & Navigation:**
AppShell, NavRail, Sidebar, ShelfTree, NotebookGroup, NoteItem

**Editor:**
SplitEditor, Pane, PaperCanvas, CanvasBackground

**Block System:**
BlockContainer, BlockToolbar, BlockHandle (drag),
HypothesisBlock, ConclusionBlock, NoteInsightBlock, WarningBlock, QuoteBlock,
KeyDifferencesBlock, KeyFindingsBlock, ChecklistBlock, TableBlock, CodeBlock,
ImageBlock, DividerBlock, AskClaudeBlock, AskGptBlock

**Linking & Tags:**
LinkPicker, BacklinkChip, TagChip, TagInput

**Right Panel:**
RightPanel, NoteStats, LinkedNotesPanel, MiniGraph

**Comments:**
CommentPanel, CommentThread, CommentItem, CommentComposer

**AI Features:**
AiChatSidebar, AiChatMessage, AiChatInput, ModelPicker, InlineAiMention

**Prompt Library:**
PromptLibrary, PromptCard, PromptEditor, VariableInput, PromptRunner

**Scheduled Runs:**
RunModal, RunHistoryList, RunHistoryItem, CronCountdown

**HTML Notes:**
HtmlNotesGallery, HtmlNoteCard, HtmlViewer

**Overlays & Global UI:**
SearchOverlay, SearchResult, SearchFilters,
NotificationPanel, NotificationItem,
SharePanel, ShareLinkRow,
KnowledgeGraph, GraphNode, GraphInspector,
ZenBar, QuickCaptureModal,
KeyboardCheatsheet, OnboardingFlow, OnboardingStep,
SlideOver, ConfirmDialog

**Settings:**
SettingsPanel, AiProvidersTab, ProfileTab, AiBehaviourTab, SyncExportTab, TemplatesTab, AppearanceTab

**Template Builder:**
TemplateBuilder, TemplatePalette, TemplateCanvas, TemplateMetaForm

---

**CONSTRAINTS**
- Use Angular 17+ syntax: `input()`, `output()`, `signal()`, `computed()` signal primitives — not `@Input()` decorator syntax (unless mixed approach is required for Material components)
- Every component must use `ChangeDetection.OnPush`
- All types must be from defined interfaces — no primitive-only inputs where an object is more appropriate
- Selectors must follow `lore-` prefix convention
- File paths must follow feature folder structure from the architecture document
- Storybook stories must cover at minimum: default state, loading state (where applicable), and one edge case
- Accessibility keyboard map must cover Tab, Enter, Escape, and Arrow keys for interactive components

---

**QUALITY CHECK**
Before submitting your response, verify:
- [ ] All 14 block components have specs
- [ ] All 6 settings tab components have specs
- [ ] Every component has at least 4 unit test cases
- [ ] No component is missing its ARIA role
- [ ] BlockContainer spec covers how it renders all 14 block types (via dynamic component loading or ngSwitch)
- [ ] AskClaudeBlock and AskGptBlock specs describe their streaming response handling
- [ ] KnowledgeGraph spec describes the SVG rendering strategy (not Canvas)
- [ ] OnboardingFlow spec covers the step transition animation
- [ ] AppShell spec describes how it composes all major layout regions

---

---

# ═══════════════════════════════════════════════════
# PROMPT 5 — AGENT PROMPT PLAYBOOK
# ═══════════════════════════════════════════════════

## Copy everything below this line into a new Claude conversation

---

**ROLE**
You are a principal engineer and AI-assisted development expert who has built production Angular apps using GitHub Copilot Workspace, Kiro, and Claude Code as coding agents. You write agent prompts that are precise enough for an AI coding agent to produce correct, production-ready Angular 17+ code on the first attempt — with no human clarification needed.

---

**CONTEXT — LORE APP**

Lore is an Angular 17+ standalone-component knowledge base with AI integration. The full feature set:

- Nav rail + collapsible sidebar (Shelf → Notebook → Notes hierarchy)
- Split-pane editor (1/2/3 panes, independent notes per pane)
- Right context panel, inline block comments
- 14 block types: Hypothesis, Conclusion, Note/Insight, Warning, Quote, Key Differences, Key Findings, Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT
- 6 note types: Research, Journal, Task, Idea, Reference, HTML
- Canvas backgrounds: Plain, Dot grid, Square grid, Lined
- Live Claude API (fetch to api.anthropic.com/v1/messages), @mention AI inline, AI Chat sidebar
- Prompt Library (CRUD, {{variable}} syntax, cron scheduling), Scheduled Runs
- HTML Notes (gallery, viewer, AI generation)
- Knowledge Graph (SVG), Note Sharing, Notification Center
- Dark mode (CSS custom properties), Zen mode, Global search (⌘K)
- [[note linker, Quick Capture FAB, Template Builder, 4-step onboarding

**Angular conventions to enforce across all agent prompts:**
- Angular 17+ standalone components only — no NgModules
- Signals (`signal()`, `computed()`, `effect()`) for local component state
- RxJS Observables for cross-component async streams (services)
- `ChangeDetectionStrategy.OnPush` on every component
- `lore-` prefix for all component selectors
- Feature folder structure: `src/app/features/[feature]/`
- Shared folder: `src/app/shared/` for reusable components, pipes, directives
- CSS: SCSS with CSS custom properties from the design token file at `src/styles/tokens.scss`
- All TypeScript in strict mode, no `any`

---

**YOUR TASK**

Write a complete **Agent Prompt Playbook** — one focused, self-contained agent prompt per feature group, formatted for direct use in GitHub Copilot Workspace, Kiro, or Claude Code.

Each agent prompt must follow this exact structure:

```
### Agent Prompt [letter]: [Feature Group Name]

**Agent Role:** [One sentence: what kind of engineer this agent is]

**Goal:** [One paragraph: what this prompt will produce, why it matters]

**Files to Create:**
(Exhaustive list of files with full paths relative to project root)

**Files to Modify:**
(Existing files that must be updated, with what specifically changes)

**Angular Patterns to Follow:**
(Bulleted list of specific Angular 17+ patterns required for this feature)

**Exact Component API:**
(For each component created: selector, key inputs/outputs typed in TypeScript, internal signals)

**Implementation Instructions:**
(Step-by-step numbered instructions for the agent. Be explicit about template structure, SCSS tokens to use, service injection, routing changes, and state wiring.)

**Done Definition:**
(Numbered checklist the agent must verify before considering the task complete. Should be objectively verifiable — no subjective criteria.)
```

---

**GROUPS TO COVER:**

Write one agent prompt for each of the following 13 groups:

**(a) App Shell and Routing**
AppShell component, NavRail, top-level router config, lazy-loaded feature routes, global layout with CSS grid, Angular Router setup with route guards placeholder.

**(b) Sidebar and Note Tree**
Sidebar component, ShelfTree, NotebookGroup, NoteItem, collapsible hierarchy with animations, drag-to-reorder shelf/notebook ordering, right-click context menu, new note/notebook/shelf creation flow.

**(c) Split Editor and Panes**
SplitEditor, Pane, PaperCanvas, CanvasBackground (4 types), 1/2/3 pane layout with resizable dividers, independent note loading per pane, pane-local [[note linker, pane close/split controls.

**(d) Block System — All 14 Types**
BlockContainer with dynamic component loading, BlockHandle for DnD reordering, BlockToolbar, and all 14 block components: HypothesisBlock, ConclusionBlock, NoteInsightBlock, WarningBlock, QuoteBlock, KeyDifferencesBlock, KeyFindingsBlock, ChecklistBlock, TableBlock, CodeBlock (with syntax highlight), ImageBlock, DividerBlock, AskClaudeBlock, AskGptBlock. Cover add-block affordance between blocks.

**(e) [[Note Linker and Backlinks**
LinkPicker overlay triggered by `[[`, keyboard navigation (arrows + enter), fuzzy search across all notes, BacklinkChip rendering, backlink index maintained in NoteService, backlink panel in RightPanel.

**(f) AI Integration — @mention, Chat Sidebar, Live API**
InlineAiMention triggered by `@`, ModelPicker dropdown (Claude/GPT-4o/Gemini/Groq), AiChatSidebar with multi-turn history, AIService wrapping Anthropic fetch with streaming, save-response-as-block action, API key validation on first use.

**(g) Prompt Library and Cron Scheduler**
PromptLibrary CRUD panel, PromptCard, PromptEditor with `{{variable}}` highlighting, VariableInput form generation, cron expression builder, SchedulerService using Web Worker for browser-side cron, RunModal, RunHistoryList, CronCountdown, HTML output capture and storage.

**(h) HTML Notes View**
HtmlNotesGallery grid, HtmlNoteCard, HtmlViewer full-screen with sandboxed iframe, import from file, paste HTML, AI-generate HTML via AskClaudeBlock, gallery filtering by date and tag.

**(i) Knowledge Graph**
KnowledgeGraph SVG component, force-directed layout algorithm (d3-force or custom), shelf colour clusters, cron job arrows (animated dashed lines), node inspector panel (GraphInspector), zoom/pan controls, click node to open note.

**(j) Settings Panel**
SettingsPanel with 6 tab components: AiProvidersTab (API key management for all providers), ProfileTab, AiBehaviourTab (temperature, system prompt, context window), SyncExportTab (Gist connection, export triggers), TemplatesTab (list + delete), AppearanceTab (theme, font size, canvas default). SlideOver wrapper animation.

**(k) Search, Zen Mode, Quick Capture**
SearchOverlay triggered by ⌘K, SearchFilters (type/shelf/date), highlighted search results, keyboard navigation through results, ZenBar floating toolbar for Zen/Focus mode (⌘⇧Z), QuickCaptureModal (⌘J) saving to Inbox notebook, global keyboard shortcut service using Angular HostListener.

**(l) Dark Mode and Design Tokens**
`src/styles/tokens.scss` with all CSS custom properties for light and dark, ThemeService toggling `[data-theme="dark"]` on document root, persisting preference to localStorage, ⌘⇧D keyboard shortcut, system preference detection via `prefers-color-scheme` media query, AppearanceTab controls wired to ThemeService.

**(m) Notification Center and Share Panel**
NotificationCenter slide-over panel, tabs (All/Cron/AI/Errors), NotificationItem with action buttons, NotificationService with BehaviorSubject stream, SharePanel with link generation, MD/PDF/HTML export (PDF via print dialog), embed code snippet, GitHub Gist push integration wired to SyncService.

---

**CONSTRAINTS**
- Every agent prompt must be fully self-contained — do not reference "the previous prompt" or assume context outside the prompt itself
- All TypeScript in agent prompts must be in strict mode and syntactically valid Angular 17+
- Each "Files to Create" list must be exhaustive — if a file is needed, it must be listed
- "Done Definition" items must be binary pass/fail — no subjective checklist items
- Agent prompts for AI features must specify error handling for: invalid API key, network failure, rate limit (429), and streaming parse error
- The block system agent prompt must describe how BlockContainer dynamically loads components (ViewContainerRef + ComponentFactory or Angular CDK)
- The cron scheduler agent prompt must specify that all scheduling is browser-side and explain how to handle tab suspension (Page Visibility API)

---

**QUALITY CHECK**
Before submitting your response, verify:
- [ ] All 13 group prompts are present
- [ ] Every prompt has all 8 required sections (Role, Goal, Files to Create, Files to Modify, Angular Patterns, Component API, Instructions, Done Definition)
- [ ] All 14 block types appear in the block system prompt's "Files to Create" list
- [ ] The AI integration prompt covers streaming token-by-token response handling explicitly
- [ ] The dark mode prompt includes the system preference (`prefers-color-scheme`) detection
- [ ] The cron scheduler prompt mentions the Page Visibility API
- [ ] No agent prompt says "implement as appropriate" or similar vague instructions — every instruction is explicit
- [ ] Done Definitions are objectively verifiable (e.g., "⌘K opens the overlay in under 100ms" not "search feels fast")
- [ ] The Knowledge Graph prompt specifies the layout algorithm (not just "use d3")
- [ ] Each prompt could be pasted into Claude Code or Copilot Workspace and produce working code without clarification