✅ Features Built — By Version
v1 — First Redesign

Purple design system, nav rail, sidebar, basic note editor

v2 — Full App

Split notes view concept, Settings skeleton, Prompt Library skeleton, Knowledge Graph skeleton

v3 — Hierarchy

Shelf → Notebook → Notes three-level sidebar
Compact / expanded sidebar toggle
Note type badges (Research, Journal, Task, Idea, Reference, HTML)

v4 — Paper Canvas

Soft purple sidebar finalized
Plain white paper canvas
Slash command palette hint bar

v5 — Feature Depth

Split-pane notes (1 / 2 / 3 columns)
Full Settings panel (AI providers, appearance, cron toggles)
Prompt Library with cron schedule editor
HTML Note import / generate flow

v6 — Scheduled Runs

Scheduled Runs dashboard (table of past runs)
Prompt slideover panel
Template → note flow
HTML generation animation (progress steps)
Knowledge Graph with cron output arrows

v7 — Dark Mode & Overlays

Full dark mode (CSS variable swap, ⌘⇧D)
Global search overlay (⌘K) with keyboard nav
Notification Center (slide-in panel)
HTML Note full-screen viewer with zoom
Quick Capture FAB (⌘J)
Note version history timeline

v8 — Linking & Chat

[[ note linker with searchable picker and keyboard nav → backlink chips
Tags browser
Notebook card grid view
AI Chat sidebar (multi-turn, model switcher, save-as-block)
HTML paste import with live iframe preview

v9 — Polish & Completeness

Block drag-to-reorder (full DnD with handles)
Full slash palette (14 block types, searchable, keyboard nav)
Note sharing panel (link, export MD/PDF/HTML, embed code, GitHub Gist)
Keyboard cheatsheet (? key)
Onboarding 4-step flow
Mini note graph in right panel
Inline @mention AI (model picker dropdown, simulated response)
Quick Capture FAB refined

v10 — Live AI Layer

Live Claude API (actual fetch() to api.anthropic.com/v1/messages, streaming character-by-character)
Zen / Focus mode (hides sidebar + toolbar, wide margins, floating zen bar)
Template Builder (drag palette blocks onto canvas, required checkboxes, metadata sidebar, save)
Inline block comments (add, thread, reply, resolve)
Advanced Search (type, shelf, date range filters, highlighted results)

v11 — Master Integration

Split panes working simultaneously (1/2/3, each with independent note content)
Pane resizers
Canvas backgrounds (plain, dot grid, square grid, lined) — actual CSS rendering
Full [[ linker per pane (keyboard nav, backlink chips inserted into body)
Scheduled Runs table (full log, stats cards, enable/disable toggles, run now, retry)
Next runs sidebar with live countdown chips
Knowledge Graph (full interactive SVG, shelf cluster dashed outlines, cron arrows, node inspector)
Dark mode applied across all views
Sidebar pane indicators for split notes

v12 — Final Layer

Settings — 6 full tabs:

AI Providers (API key inputs per model, connected status, default model grid)
Profile (name, email, timezone, bio, persona context, response style chips)
AI Behaviour (8 toggles: graph linking, context, persona, token tracking, HTML gen, cron, etc.)
Sync & Export (GitHub Gist sync status, toggles, JSON/MD/ZIP/HTML export, import)
Templates (gallery of 6 templates with visual previews, create new card)
Appearance (Light/Dark/System, canvas picker, font size)


Prompt Library — full CRUD:

Prompt cards with preview, cron badge, AI provider badges, use count
Prompt Editor modal (body textarea, {{variable}} syntax, variable table with type, AI provider picker, output type, save-to-notebook, cron scheduler with day picker + preview)
Prompt Slideover (next-run countdown chips, variable table editable, provider selector, run history with output links)
Run Now modal (4-step animated progress → success with view/export)


HTML Notes view:

Quick generate bar
Drag/drop import zone
Import modal (upload file / paste / URL tabs)
Generate with AI modal (prompt, template picker, variable table)
HTML Notes gallery (cards with preview, metadata, link/export actions)
Full HTML viewer modal (live preview of equity report)


Notification Center:

Slide-in panel with tabs (All / Cron / AI / Errors)
Unread indicators, action buttons (View HTML, Open Note, Retry, Dismiss)


Note Sharing panel:

Share link (copy, toggle active)
Export (MD / PDF / HTML / Text)
Embed iframe code
GitHub Gist push (private / public)




🔲 What's NOT yet in the mockup
These are features that were discussed or implied but never fully rendered:
FeatureStatusAngular app — the actual production buildOut of scope (mocks only)Lore app (Angular) component architecture specNot startedInline rich text (bold, italic, headings in body) — actual contentEditableBody is a plain <textarea>Table block — full editable grid with add row/colPartial in v9 palette, not fully builtImage block — actual image upload + previewPlaceholder onlyQuote block — pull quote stylingIn palette, not as a full preset block[[ linker in all panes re: v12 (only in v11)v12 focused on other featuresAI Chat sidebar (multi-turn, persistent)Built in v8, not carried into v11/v12Version history timelineBuilt in v7, not in later versionsNotebook card grid viewBuilt in v8, not in v11/v12Mobile / responsive layoutDesktop only throughoutOffline mode / PWANot addressedReal-time collaborationNot addressedNote search within a shelf (scoped)Global search exists, scoped search notInline LaTeX / math renderingNot addressed (relevant for linear algebra book)

Summary: 12 versions, ~60 discrete features built. The mocks are comprehensive enough to hand off to an Angular developer as a complete design specification. The main gaps are features that make more sense as production code than as HTML prototypes — rich text editing, image uploads, real API integrations beyond Claude.✅ Features Built — By Version
v1 — First Redesign

Purple design system, nav rail, sidebar, basic note editor

v2 — Full App

Split notes view concept, Settings skeleton, Prompt Library skeleton, Knowledge Graph skeleton

v3 — Hierarchy

Shelf → Notebook → Notes three-level sidebar
Compact / expanded sidebar toggle
Note type badges (Research, Journal, Task, Idea, Reference, HTML)

v4 — Paper Canvas

Soft purple sidebar finalized
Plain white paper canvas
Slash command palette hint bar

v5 — Feature Depth

Split-pane notes (1 / 2 / 3 columns)
Full Settings panel (AI providers, appearance, cron toggles)
Prompt Library with cron schedule editor
HTML Note import / generate flow

v6 — Scheduled Runs

Scheduled Runs dashboard (table of past runs)
Prompt slideover panel
Template → note flow
HTML generation animation (progress steps)
Knowledge Graph with cron output arrows

v7 — Dark Mode & Overlays

Full dark mode (CSS variable swap, ⌘⇧D)
Global search overlay (⌘K) with keyboard nav
Notification Center (slide-in panel)
HTML Note full-screen viewer with zoom
Quick Capture FAB (⌘J)
Note version history timeline

v8 — Linking & Chat

[[ note linker with searchable picker and keyboard nav → backlink chips
Tags browser
Notebook card grid view
AI Chat sidebar (multi-turn, model switcher, save-as-block)
HTML paste import with live iframe preview

v9 — Polish & Completeness

Block drag-to-reorder (full DnD with handles)
Full slash palette (14 block types, searchable, keyboard nav)
Note sharing panel (link, export MD/PDF/HTML, embed code, GitHub Gist)
Keyboard cheatsheet (? key)
Onboarding 4-step flow
Mini note graph in right panel
Inline @mention AI (model picker dropdown, simulated response)
Quick Capture FAB refined

v10 — Live AI Layer

Live Claude API (actual fetch() to api.anthropic.com/v1/messages, streaming character-by-character)
Zen / Focus mode (hides sidebar + toolbar, wide margins, floating zen bar)
Template Builder (drag palette blocks onto canvas, required checkboxes, metadata sidebar, save)
Inline block comments (add, thread, reply, resolve)
Advanced Search (type, shelf, date range filters, highlighted results)

v11 — Master Integration

Split panes working simultaneously (1/2/3, each with independent note content)
Pane resizers
Canvas backgrounds (plain, dot grid, square grid, lined) — actual CSS rendering
Full [[ linker per pane (keyboard nav, backlink chips inserted into body)
Scheduled Runs table (full log, stats cards, enable/disable toggles, run now, retry)
Next runs sidebar with live countdown chips
Knowledge Graph (full interactive SVG, shelf cluster dashed outlines, cron arrows, node inspector)
Dark mode applied across all views
Sidebar pane indicators for split notes

v12 — Final Layer

Settings — 6 full tabs:

AI Providers (API key inputs per model, connected status, default model grid)
Profile (name, email, timezone, bio, persona context, response style chips)
AI Behaviour (8 toggles: graph linking, context, persona, token tracking, HTML gen, cron, etc.)
Sync & Export (GitHub Gist sync status, toggles, JSON/MD/ZIP/HTML export, import)
Templates (gallery of 6 templates with visual previews, create new card)
Appearance (Light/Dark/System, canvas picker, font size)


Prompt Library — full CRUD:

Prompt cards with preview, cron badge, AI provider badges, use count
Prompt Editor modal (body textarea, {{variable}} syntax, variable table with type, AI provider picker, output type, save-to-notebook, cron scheduler with day picker + preview)
Prompt Slideover (next-run countdown chips, variable table editable, provider selector, run history with output links)
Run Now modal (4-step animated progress → success with view/export)


HTML Notes view:

Quick generate bar
Drag/drop import zone
Import modal (upload file / paste / URL tabs)
Generate with AI modal (prompt, template picker, variable table)
HTML Notes gallery (cards with preview, metadata, link/export actions)
Full HTML viewer modal (live preview of equity report)


Notification Center:

Slide-in panel with tabs (All / Cron / AI / Errors)
Unread indicators, action buttons (View HTML, Open Note, Retry, Dismiss)


Note Sharing panel:

Share link (copy, toggle active)
Export (MD / PDF / HTML / Text)
Embed iframe code
GitHub Gist push (private / public)




🔲 What's NOT yet in the mockup
These are features that were discussed or implied but never fully rendered:
FeatureStatusAngular app — the actual production buildOut of scope (mocks only)Lore app (Angular) component architecture specNot startedInline rich text (bold, italic, headings in body) — actual contentEditableBody is a plain <textarea>Table block — full editable grid with add row/colPartial in v9 palette, not fully builtImage block — actual image upload + previewPlaceholder onlyQuote block — pull quote stylingIn palette, not as a full preset block[[ linker in all panes re: v12 (only in v11)v12 focused on other featuresAI Chat sidebar (multi-turn, persistent)Built in v8, not carried into v11/v12Version history timelineBuilt in v7, not in later versionsNotebook card grid viewBuilt in v8, not in v11/v12Mobile / responsive layoutDesktop only throughoutOffline mode / PWANot addressedReal-time collaborationNot addressedNote search within a shelf (scoped)Global search exists, scoped search notInline LaTeX / math renderingNot addressed (relevant for linear algebra book)

Summary: 12 versions, ~60 discrete features built. The mocks are comprehensive enough to hand off to an Angular developer as a complete design specification. The main gaps are features that make more sense as production code than as HTML prototypes — rich text editing, image uploads, real API integrations beyond Claude.