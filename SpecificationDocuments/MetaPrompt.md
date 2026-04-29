You are a senior prompt engineer and software architect.

I have built a complete 12-version HTML mockup series for a notes app 
called "Lore" — an AI-powered knowledge base with the following 
confirmed features:

CORE STRUCTURE
- Nav rail + collapsible sidebar (Shelf → Notebook → Notes hierarchy)
- Split-pane editor (1/2/3 panes, independent notes per pane)
- Right context panel (stats, tags, linked notes, mini graph)
- Inline block comments with threading and resolve

NOTE TYPES: Research, Journal, Task, Idea, Reference, HTML

BLOCK TYPES (14):
Hypothesis, Conclusion, Note/Insight, Warning, Quote,
Key Differences (side-by-side), Key Findings (numbered),
Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT

CANVAS BACKGROUNDS: Plain, Dot grid, Square grid, Lined

AI FEATURES
- Live Claude API via fetch to api.anthropic.com/v1/messages
- @mention AI inline (model picker: Claude, GPT-4o, Gemini, Groq)
- AI Chat sidebar (multi-turn, model switcher, save-as-block)
- Prompt Library (CRUD, {{variable}} syntax, cron scheduler)
- Scheduled Runs (cron jobs, countdown, run history, HTML output)
- HTML Notes (import, paste, generate via AI, gallery, full viewer)

UX FEATURES
- Dark mode (full CSS variable swap, ⌘⇧D)
- Zen / Focus mode (hides chrome, floating zen bar)
- Global search overlay (⌘K, type/shelf/date filters, highlighted results)
- [[note linker (per pane, keyboard nav, backlink chips)
- Block drag-to-reorder (DnD handles)
- Quick Capture FAB (⌘J, saves to Inbox)
- Onboarding 4-step flow
- Keyboard cheatsheet (? key)
- Template Builder (drag palette → canvas, metadata, save)
- Knowledge Graph (SVG, shelf clusters, cron arrows, node inspector)
- Note Sharing (link, export MD/PDF/HTML, embed, GitHub Gist)
- Notification Center (tabs: All/Cron/AI/Errors, action buttons)

SETTINGS (6 tabs):
AI Providers, Profile, AI Behaviour, Sync & Export, Templates, Appearance

DESIGN SYSTEM
- Fonts: Lora (serif titles), DM Sans (UI), JetBrains Mono (metadata)
- Accent: #7C3AED (purple-600), dark mode shifts to #C4B5FD
- Nav: #EAE7F7, Sidebar: #F0EEF9, Canvas: #FFFFFF
- Border: rgba(109,40,217,0.09), hover: rgba(109,40,217,0.06)
- Border radius: 4/8/12/18px scale

TECH STACK (target)
- Angular 17+ (standalone components, signals)
- Angular Material or custom component library
- RxJS for state, NgRx optional
- TailwindCSS or SCSS with CSS custom properties
- Anthropic SDK or direct fetch for AI calls
- GitHub Gist API for sync

Your job is to write a MASTER PROMPT GENERATOR.

The master prompt generator should output FIVE SEPARATE PROMPTS,
one for each of these documents:

PROMPT 1 → Generate the Product Requirements Document (PRD)
  Include: executive summary, user personas, user stories (as a... I want... 
  so that...), feature list with priorities (P0/P1/P2), acceptance criteria 
  per feature, out of scope items, success metrics.

PROMPT 2 → Generate the Design System Specification
  Include: all colour tokens (light + dark), typography scale, spacing scale, 
  border radius scale, shadow tokens, component anatomy for each of the 14 
  block types, icon usage rules, animation/transition specs, dark mode 
  implementation guide, do/don't examples.

PROMPT 3 → Generate the Technical Architecture Document
  Include: Angular module/feature structure, folder layout, component tree, 
  routing table, state management strategy (services + signals or NgRx), 
  API service contracts, local storage schema, GitHub Gist sync design, 
  Anthropic API integration pattern, cron job scheduling approach (browser 
  vs server), error handling strategy, performance considerations.

PROMPT 4 → Generate the Component Specification Document
  Include: every Angular component with selector name, @Input/@Output 
  properties typed in TypeScript, internal state (signals or BehaviorSubjects), 
  template summary, SCSS/Tailwind class strategy, accessibility requirements, 
  unit test checklist, storybook story outline. Cover at minimum:
  AppShell, NavRail, Sidebar, ShelfTree, NoteItem, SplitEditor, Pane, 
  PaperCanvas, BlockContainer, each of the 14 block components, 
  LinkPicker, TagChip, BacklinkChip, RightPanel, CommentPanel, 
  PromptLibrary, PromptCard, PromptEditor, SlideOver, RunModal, 
  HtmlNotesGallery, HtmlViewer, NotificationPanel, SharePanel, 
  KnowledgeGraph, Settings (6 tab panels), SearchOverlay, ZenBar, 
  QuickCapture, OnboardingFlow.

PROMPT 5 → Generate the Agent Prompt Playbook
  Include: one focused agent prompt per feature area, written specifically 
  for use in GitHub Copilot Workspace, Kiro, or Claude Code. Each agent 
  prompt should specify: the files to create, the Angular patterns to follow, 
  the exact component API, and a clear done-definition. Group by:
  (a) App shell and routing
  (b) Sidebar and note tree
  (c) Split editor and panes
  (d) Block system (all 14 types)
  (e) [[Note linker and backlinks
  (f) AI integration (@mention, chat sidebar, live API)
  (g) Prompt Library and cron scheduler
  (h) HTML Notes view
  (i) Knowledge Graph
  (j) Settings panel
  (k) Search, Zen mode, Quick Capture
  (l) Dark mode and design tokens
  (m) Notification Center and Share panel

For each of the five prompts:
- Start with a ROLE statement (who Claude should be)
- Include all relevant context from the feature list above
- Specify the exact OUTPUT FORMAT (markdown headings, tables, code blocks)
- Include a CONSTRAINTS section (Angular version, naming conventions, file structure)
- End with a QUALITY CHECK list Claude should self-verify before responding

Output all five prompts clearly separated with headers.
Each prompt should be self-contained — someone should be able to copy 
it and paste it directly into a new Claude conversation and get the 
full document.