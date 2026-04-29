# Lore — Product Requirements Document
Version: 1.0 | Status: Draft | Owner: Product

---

## 1. Executive Summary

Modern knowledge workers are drowning in fragmented information. Research lives in browser tabs, ideas accumulate in disconnected apps, tasks scatter across tools, and the connections between pieces of knowledge are never surfaced. Existing solutions force a choice: Notion offers structure but lacks depth for researchers; Obsidian delivers powerful linking but has a steep learning curve and no native AI; Roam Research is powerful but opaque to new users. None of these tools treat AI as a first-class collaborator woven into the writing and thinking experience itself.

Lore is an AI-native knowledge base application for the desktop and web that organises thinking into a three-tier hierarchy — Shelves, Notebooks, and Notes — and augments every layer with live AI assistance. It is built around the conviction that a knowledge base should not merely store information but actively help the user synthesise, question, and connect it. Every note in Lore is a canvas where structured block types (hypotheses, conclusions, key findings, code, and more) sit alongside inline AI queries, scheduled AI runs, and a live knowledge graph that makes the shape of a user's thinking visible.

Lore targets three primary markets: independent researchers and academics managing literature reviews and evolving ideas; product and engineering teams maintaining living technical documentation and decision logs; and knowledge-intensive solo professionals — consultants, analysts, journalists — who need a personal second brain with the intelligence to contribute back. The addressable segment of knowledge workers using two or more productivity/notes tools simultaneously is estimated at over 50 million globally, with the highest-intent cohort being those already paying for both a notes app and a separate AI subscription.

The product's key differentiators are: (1) AI that is multi-model and deeply contextual — users can invoke Claude, GPT-4o, Gemini, or Groq inline, in a sidebar chat, or on a cron schedule with full note context; (2) a structured block system that imposes just enough schema to make knowledge retrievable without forcing rigid templates; (3) a live Knowledge Graph that visualises the entire Shelf as an SVG cluster map with cron-job arrows and node inspection, turning passive storage into an active thinking map; (4) a Prompt Library with variable syntax and scheduling that enables repeatable AI workflows — a capability no competing general-purpose notes app offers; and (5) HTML Notes with AI generation and a gallery view, enabling Lore to serve as a lightweight publishing layer for curated content.

Lore is implemented in Angular 17+ with standalone components and signals, keeping the frontend modern and reactive. The MVP targets a three-month delivery sprint covering all P0 features across the core editor, AI integration, navigation, search, and settings. Post-launch priorities include expanded collaboration features, mobile clients, and deeper third-party integrations.

---

## 2. User Personas

### Persona 1 — Dr. Maya Okonkwo, Independent Research Scientist

**Role:** Postdoctoral researcher in computational biology; runs her own consulting practice on the side.

**Goals:**
- Maintain a living literature review that links papers, hypotheses, and experimental conclusions.
- Quickly surface connections between notes written weeks or months apart.
- Automate routine synthesis tasks (weekly summaries of new findings, structured comparison of methodologies) so she can focus on original thinking.

**Pain Points:**
- Obsidian requires too much manual plugin configuration; she spends time managing the tool rather than using it.
- ChatGPT gives good answers but has no memory of her existing notes; every session starts from scratch.
- Notion is great for project management but its editor is too free-form for rigorous research notes — she needs Hypothesis and Conclusion block types, not just bullet lists.

**Tech Comfort Level:** High. Comfortable with Markdown, API keys, and cron syntax. Uses terminal daily. Will read documentation.

**Key Jobs-to-be-Done:**
- Capture a hypothesis with supporting evidence in a structured block and link it to related notes.
- Run a weekly AI-generated synthesis of all notes tagged `#literature` without manual prompting.
- Export a notebook as a PDF to share with collaborators.

---

### Persona 2 — Reza Tehrani, Senior Product Manager at a Series B SaaS Company

**Role:** PM responsible for three product squads; maintains the team's product wiki, decision logs, and competitive intelligence.

**Goals:**
- Keep technical and product decisions recorded with enough context that engineers onboarded six months later can understand the reasoning.
- Monitor competitor product updates on a schedule and pipe summaries into a notebook automatically.
- Work across multiple notes simultaneously (spec on one pane, related research on another).

**Pain Points:**
- Notion is where team docs live, but it is too slow for personal rapid capture; his own thinking ends up in Slack DMs or Apple Notes.
- He has no structured way to track decisions (what was decided, why, what alternatives were rejected) in a format that is both scannable and linkable.
- Global search across his notes is too slow and imprecise — he can never find the note where he wrote about a specific topic three months ago.

**Tech Comfort Level:** Medium-high. Comfortable with web apps and settings; not a developer. Will use keyboard shortcuts but will not write scripts.

**Key Jobs-to-be-Done:**
- Open a split-pane view with a decision log note on one side and a competitive research note on the other.
- Use the global search overlay to find any note mentioning a competitor's feature within seconds.
- Share a formatted note as a link or export it as a PDF to send to a stakeholder.

---

### Persona 3 — Selin Çelik, Freelance Investigative Journalist

**Role:** Freelance journalist covering financial crime and regulatory affairs; manages long-running investigations that span dozens of sources and months of notes.

**Goals:**
- Capture quotes, reference materials, and working hypotheses from multiple sources and keep them linked.
- Use AI to draft summaries of source documents without leaving her notes environment.
- Switch quickly between the messiness of active investigation notes and a clean, focused writing mode.

**Pain Points:**
- Browser bookmarks and Pocket are where reference material goes to die; she cannot annotate or link them.
- She loses track of which notes are drafts vs. published vs. archived; there is no note-type taxonomy.
- When writing long-form pieces, notifications and sidebar chrome are distracting; she wants full-screen focus.

**Tech Comfort Level:** Medium. Comfortable with web tools and mobile apps. Uses keyboard shortcuts but finds developer-facing settings intimidating. Prefers UI controls over configuration files.

**Key Jobs-to-be-Done:**
- Capture a web-sourced quote block with attribution in under 10 seconds using the Quick Capture FAB.
- Switch to Zen / Focus mode when drafting and have all UI chrome hidden behind a floating bar.
- Generate an AI summary of a pasted HTML reference document and save it as a block in her active note.

---

## 3. User Stories

### 3.1 Navigation & Structure

1. As Maya, I want to create a Shelf containing multiple Notebooks so that I can organise my research by project domain without mixing unrelated topics.
2. As Reza, I want to collapse the sidebar so that I have more horizontal canvas space when working in the split-pane editor.
3. As Selin, I want to rename and reorder Notebooks within a Shelf by drag-and-drop so that I can surface the most active investigation at the top.
4. As Reza, I want to navigate between Shelves using the nav rail without the full sidebar being open so that I can switch contexts quickly while keeping the editor maximised.
5. As Maya, I want to delete a Notebook and have it ask for confirmation before permanently removing all contained Notes so that I do not accidentally destroy research.

### 3.2 Note Types

6. As Maya, I want to create a Research note type so that the editor signals to me — and to any future collaborator — that this note follows a research structure rather than being a freeform journal.
7. As Selin, I want to create a Journal note so that I can log dated field observations separately from formal source reference notes.
8. As Reza, I want to create a Task note so that action items are visually distinguished from decision logs and reference material in the notebook list.
9. As Maya, I want to create an Idea note so that speculative, unvalidated thoughts are clearly separated from concluded findings.
10. As Selin, I want to create a Reference note so that source material with attribution is kept in its own note type, making it easy to filter for references during citation checking.
11. As Selin, I want to create an HTML note so that I can paste or import raw HTML from a web source and render it inside Lore without leaving the app.

### 3.3 Block Types

12. As Maya, I want to insert a Hypothesis block so that I can clearly denote an assumption that requires evidence before it can be treated as a conclusion.
13. As Maya, I want to insert a Conclusion block so that findings with sufficient supporting evidence are visually distinguished from open hypotheses.
14. As Maya, I want to insert a Note/Insight block so that inline observations that do not yet qualify as conclusions are captured in a structured, findable way.
15. As Reza, I want to insert a Warning block so that critical caveats or risks in a spec note are visually prominent and not missed during review.
16. As Selin, I want to insert a Quote block with an attribution field so that source material is always paired with its origin rather than being an anonymous excerpt.
17. As Reza, I want to insert a Key Differences block so that I can compare two approaches side-by-side in a structured layout without building a table manually.
18. As Maya, I want to insert a Key Findings block so that numbered, ranked findings from a study are formatted consistently and are immediately scannable.
19. As Reza, I want to insert a Checklist block so that task items inside a spec note can be checked off as the engineering team completes them.
20. As Reza, I want to insert a Table block so that structured data such as API parameter lists is formatted in a readable grid rather than a bulleted list.
21. As Maya, I want to insert a Code block with syntax highlighting so that analysis scripts and code snippets are rendered in monospace with language-appropriate colouring.
22. As Selin, I want to insert an Image block so that photographs or screenshots from a field investigation are embedded directly in the note rather than linked externally.
23. As Reza, I want to insert a Divider block so that I can visually separate sections within a long decision log note without creating a new note.
24. As Maya, I want to insert an Ask Claude block so that I can pose a contextual AI question at a specific point in a note and have the answer embedded inline, permanently visible to future readers of that note.
25. As Reza, I want to insert an Ask GPT block so that I can use GPT-4o for tasks where its specific strengths (e.g. structured data extraction) are preferable, without switching tools.

### 3.4 Canvas & Editor

26. As Reza, I want to work in a two-pane split layout so that I can reference a competitive research note on the right while writing a product spec on the left.
27. As Maya, I want to open three panes simultaneously so that I can cross-reference a source note, a hypothesis note, and a conclusions note during active synthesis.
28. As Selin, I want to choose a Lined canvas background for journal notes so that the writing surface feels natural and intentional rather than blank.
29. As Maya, I want to drag blocks up and down within a note to reorder them so that I can restructure an argument without cutting and pasting text.
30. As Selin, I want to add inline block comments with threading so that I can annotate a specific block with a question or to-do and resolve it later without cluttering the main text.

### 3.5 AI Features

31. As Maya, I want to @mention an AI model inline within the editor so that I can ask a question in context without switching to a separate chat window, preserving my flow.
32. As Reza, I want to switch between AI models (Claude, GPT-4o, Gemini, Groq) in the AI Chat sidebar so that I can choose the best model for each task without leaving Lore.
33. As Reza, I want to save an AI response as a block in my current note so that valuable AI output becomes part of my permanent knowledge base rather than disappearing.
34. As Maya, I want to create a Prompt in the Prompt Library with `{{variable}}` placeholders so that I can reuse a synthesis prompt across different notebooks without rewriting it.
35. As Maya, I want to schedule a Prompt Library entry to run on a cron schedule so that my weekly literature summary is generated automatically every Monday morning.
36. As Reza, I want to view the run history of a scheduled prompt so that I can review past AI-generated outputs and see whether the scheduler fired correctly.
37. As Selin, I want to generate an HTML note using AI from a text description so that I can produce a formatted reference page without knowing HTML.

### 3.6 UX & Productivity

38. As Selin, I want to activate Zen mode so that all navigation chrome is hidden and I see only the note canvas with a minimal floating bar, eliminating distraction during long writing sessions.
39. As Reza, I want to use the global search overlay (⌘K) to search by type, shelf, and date range so that I can find a specific decision log from last quarter in under five seconds.
40. As Maya, I want to link notes using the `[[` trigger in any pane so that I can create backlinks between related research notes and have those links visible as chips in the right context panel.
41. As Reza, I want to use the Quick Capture FAB (⌘J) to save a thought to the Inbox notebook immediately so that I never lose an idea because I had to navigate to the right notebook first.
42. As Selin, I want to open the keyboard cheatsheet with the `?` key so that I can learn shortcuts without leaving the keyboard.
43. As Maya, I want to build a note template by dragging block types onto a template canvas and saving it so that every new Research note in a project starts with the same Hypothesis/Method/Conclusion scaffold.
44. As Reza, I want to view a Knowledge Graph SVG of my Shelf so that I can visually identify which notes are central hubs, which are isolated, and where cron jobs connect across notes.
45. As Selin, I want to share a note as a public link or export it as Markdown, PDF, or HTML so that I can deliver a formatted source summary to an editor without copy-pasting.
46. As Maya, I want to sync a note to a GitHub Gist so that version-controlled snapshots of my research notes are accessible from outside Lore.
47. As Reza, I want to see a notification in the Notification Center when a scheduled prompt run completes so that I know the output is ready without watching the UI.
48. As Maya, I want to toggle dark mode with ⌘⇧D so that I can switch to a low-light working environment during evening sessions without going into Settings.

### 3.7 Settings

49. As Maya, I want to add and manage API keys for multiple AI providers in the AI Providers settings tab so that Lore calls the correct model with my credentials rather than a shared key.
50. As Reza, I want to configure AI behaviour defaults (temperature, response length, system prompt) in the AI Behaviour settings tab so that all AI blocks in my notes use consistent behaviour without per-block configuration.

---

## 4. Feature List with Priorities

| Feature | Description | Priority | Rationale |
|---|---|---|---|
| **Nav Rail** | Fixed left rail with Shelf icons for single-click context switching | P0 | Core navigation; required for all other features |
| **Collapsible Sidebar** | Sidebar showing Shelf → Notebook → Notes hierarchy; can be collapsed to zero width | P0 | Primary content navigation; MVP-critical |
| **Note CRUD** | Create, read, update, delete notes with title and body; auto-save on change | P0 | Core data model |
| **Notebook CRUD** | Create, rename, reorder, delete notebooks within a shelf | P0 | Core data model |
| **Shelf CRUD** | Create, rename, reorder, delete shelves | P0 | Core data model |
| **Note Type: Research** | Note flagged as Research type; distinct icon and label in sidebar | P0 | Differentiator; satisfies persona 1 |
| **Note Type: Journal** | Note flagged as Journal type with date-stamp header | P0 | Core note taxonomy |
| **Note Type: Task** | Note flagged as Task type with task-centric layout | P0 | Core note taxonomy |
| **Note Type: Idea** | Note flagged as Idea type; visually distinct | P0 | Core note taxonomy |
| **Note Type: Reference** | Note flagged as Reference type with attribution metadata fields | P0 | Core note taxonomy |
| **Note Type: HTML** | Note that stores and renders raw HTML; can be imported, pasted, or AI-generated | P1 | Enables HTML gallery and import flow |
| **Split-Pane Editor (1/2/3)** | Editor supporting 1, 2, or 3 horizontal panes, each with independent note | P0 | Key differentiator; core editor capability |
| **Block: Hypothesis** | Structured block with label "Hypothesis" and distinct border/background | P0 | Research-grade note structure |
| **Block: Conclusion** | Structured block with label "Conclusion"; visually distinct from Hypothesis | P0 | Research-grade note structure |
| **Block: Note/Insight** | Inline insight block; lighter visual weight than Conclusion | P0 | Core block palette |
| **Block: Warning** | Alert-style block with warning icon for critical caveats | P0 | Core block palette |
| **Block: Quote** | Block with blockquote styling and an attribution/source text field | P0 | Core block palette |
| **Block: Key Differences** | Two-column side-by-side comparison block | P0 | Core block palette |
| **Block: Key Findings** | Auto-numbered list block for ranked findings | P0 | Core block palette |
| **Block: Checklist** | Checklist with interactive checkboxes | P0 | Core block palette |
| **Block: Table** | Editable inline table with row/column add/remove | P0 | Core block palette |
| **Block: Code** | Code block with language selector and syntax highlighting | P0 | Core block palette |
| **Block: Image** | Image embed block with drag-to-upload and URL input | P0 | Core block palette |
| **Block: Divider** | Horizontal rule block for section separation | P0 | Core block palette |
| **Block: Ask Claude** | Block that calls Claude API with configurable prompt and embeds response | P0 | AI differentiation; core value prop |
| **Block: Ask GPT** | Block that calls OpenAI API with configurable prompt and embeds response | P1 | Multi-model support; expands AI value |
| **Canvas Backgrounds** | Per-note background chooser: Plain, Dot grid, Square grid, Lined | P1 | UX polish; requested by writing personas |
| **Block Drag-to-Reorder** | Drag handles on all blocks; reorder within a note via drag-and-drop | P0 | Core editing UX |
| **Right Context Panel** | Slide-in panel with note stats, tags, linked notes list, mini knowledge graph | P1 | Discoverability of linked content |
| **Inline Block Comments** | Click to add a comment thread on any block; threading; resolve button | P1 | Review and annotation workflow |
| **Live Claude API Integration** | Direct fetch to api.anthropic.com/v1/messages; streaming response display | P0 | Core AI feature |
| **@Mention AI Inline** | `@claude`, `@gpt`, `@gemini`, `@groq` triggers inside editor body; model picker dropdown | P0 | Core AI interaction pattern |
| **AI Chat Sidebar** | Multi-turn conversational chat panel; model switcher; "save as block" button | P1 | Extended AI workflow |
| **Prompt Library** | CRUD for saved prompts; `{{variable}}` substitution syntax; list view | P0 | Enables AI automation; key differentiator |
| **Scheduled Prompt Runs (Cron)** | Attach cron expressions to Prompt Library entries; countdown timer; run history | P1 | Automation differentiator |
| **HTML Note: Import/Paste/Generate** | Import HTML file, paste raw HTML, or generate via AI prompt | P1 | Expands HTML note type capability |
| **HTML Note Gallery View** | Grid gallery of all HTML notes in a Notebook with preview thumbnails | P1 | Discoverability for HTML content collection |
| **HTML Full Viewer** | Full-page iframe-sandboxed viewer for a single HTML note | P1 | Safe rendering of complex HTML |
| **Dark Mode (⌘⇧D)** | Full CSS variable swap to dark palette; keyboard shortcut toggle | P0 | UX expectation; accessibility |
| **Zen / Focus Mode** | Hides all nav chrome; shows floating zen bar with minimal controls | P1 | Writing-focused UX; differentiator vs. Notion |
| **Global Search Overlay (⌘K)** | Full-text search overlay with type, shelf, and date filters; highlighted results | P0 | Core discoverability |
| **Note Linker (`[[`)** | `[[` trigger per pane opens a search popover; insert backlink chip; backlink visible in context panel | P0 | Roam-style linking; graph enabler |
| **Quick Capture FAB (⌘J)** | Floating action button; opens minimal capture dialog; saves to Inbox notebook | P0 | Idea capture without context switch |
| **Keyboard Cheatsheet (`?`)** | Full cheatsheet overlay listing all keyboard shortcuts | P1 | Onboarding and power-user support |
| **4-Step Onboarding Flow** | Modal-based onboarding: Welcome → Create Shelf → Add Note → Try AI | P0 | Activation; reduces day-1 churn |
| **Template Builder** | Drag-and-drop block palette → template canvas; add metadata; save as template | P1 | Power-user workflow enablement |
| **Knowledge Graph (SVG)** | SVG visualisation of notes as nodes; shelf clusters; cron-job arrows; node inspector panel | P1 | Differentiator; long-term retention driver |
| **Note Sharing (Link)** | Generate public shareable link to a read-only note view | P1 | Collaboration and sharing |
| **Note Export (MD / PDF / HTML)** | Export current note as Markdown, PDF, or standalone HTML file | P1 | Output and interoperability |
| **Embed Code** | Generate `<iframe>` embed snippet for a note | P2 | Post-launch publishing feature |
| **GitHub Gist Sync** | Push note content to GitHub Gist; update on demand | P2 | Developer persona; post-launch |
| **Notification Center** | Bell icon panel with All / Cron / AI / Errors tabs; action buttons per notification | P1 | System status; cron awareness |
| **Settings: AI Providers** | Add/remove API keys for Anthropic, OpenAI, Gemini, Groq; test-connection button | P0 | Gate for all AI features |
| **Settings: Profile** | Name, avatar, email display; account management | P0 | Basic user identity |
| **Settings: AI Behaviour** | Default temperature, max tokens, system prompt, response language | P1 | AI quality tuning |
| **Settings: Sync & Export** | Configure GitHub Gist token; export all notes as ZIP; import from Markdown | P1 | Data portability |
| **Settings: Templates** | View, edit, delete saved templates; set default template per note type | P1 | Template management |
| **Settings: Appearance** | Font scale, accent colour override, canvas default background, sidebar width default | P1 | Personalisation |

---

## 5. Acceptance Criteria

### 5.1 Note CRUD

**Given** a user has a Notebook open in the sidebar,
**When** they click the "New Note" button or press ⌘N,
**Then** a new untitled note is created, added to the top of the notebook's note list, and the editor focuses the title field within 200 ms.

**Given** a user has edited the body of a note,
**When** 500 ms have elapsed since the last keystroke,
**Then** the note is persisted to local storage and a "Saved" indicator replaces any unsaved indicator, with no user action required.

**Given** a user right-clicks a note in the sidebar and selects "Delete",
**When** the confirmation modal appears and the user confirms deletion,
**Then** the note is removed from the list, the editor clears, and the action is undoable within the current session via ⌘Z.

**Given** a user attempts to delete the only note in a Notebook,
**When** they confirm deletion,
**Then** the notebook becomes empty (zero notes), the editor shows an empty-state prompt, and no crash or error occurs.

---

### 5.2 Shelf / Notebook CRUD

**Given** a user clicks "New Shelf" in the nav rail,
**When** they type a name and press Enter,
**Then** the shelf appears in the nav rail, the sidebar switches to show its (empty) notebook list, and the name is persisted.

**Given** a user drags a Notebook from one position to another within the same Shelf's sidebar list,
**When** they release the drag,
**Then** the notebook's order is updated immediately in the UI and persisted; no page reload is required.

**Given** a user attempts to delete a Shelf that contains Notebooks and Notes,
**When** they click Delete and a warning dialog enumerates the contents (e.g., "This will delete 3 notebooks and 17 notes"),
**Then** the user must type the shelf name to confirm before deletion proceeds; cancelling leaves all content intact.

---

### 5.3 Split-Pane Editor

**Given** the editor is in single-pane mode,
**When** the user clicks the two-pane icon in the editor toolbar,
**Then** the editor splits horizontally into two equal-width panes, each displaying the note that was previously open (or an empty-state prompt if the second pane has no prior state), within 100 ms of the click.

**Given** the editor is in two-pane mode,
**When** the user clicks the three-pane icon,
**Then** a third pane appears to the right; all three panes are independently scrollable and can contain different notes simultaneously.

**Given** the editor is in three-pane mode,
**When** the viewport width is reduced below 900 px,
**Then** the editor automatically collapses to single-pane mode and a toast notifies the user that multi-pane mode requires a wider viewport.

**Given** two panes are open and the user closes one pane using the × button,
**When** the close action completes,
**Then** the remaining pane expands to full editor width and the closed pane's note is not lost — it remains accessible in the sidebar.

---

### 5.4 Block Types (All 14)

**Given** a user places the cursor at the start of a new line in any note,
**When** they type `/` to open the block picker,
**Then** a popover lists all 14 block types (Hypothesis, Conclusion, Note/Insight, Warning, Quote, Key Differences, Key Findings, Checklist, Table, Code, Image, Divider, Ask Claude, Ask GPT) and the user can filter by typing or navigate with arrow keys.

**Given** a user inserts a Hypothesis block,
**When** it renders in the editor,
**Then** it displays a distinct left border in the accent colour (#7C3AED in light mode, #C4B5FD in dark mode) and a "Hypothesis" label badge, visually differentiated from Conclusion blocks.

**Given** a user inserts a Conclusion block adjacent to a Hypothesis block,
**When** both are visible,
**Then** each has a distinct label and background tint, making them immediately distinguishable without reading the label text.

**Given** a user inserts a Quote block and fills in the attribution field,
**When** the note is exported as Markdown,
**Then** the exported Markdown contains a blockquote (`>`) followed by a citation line (`— [attribution]`) on the next line.

**Given** a user inserts a Key Differences block,
**When** they populate both columns,
**Then** the two columns are rendered side-by-side with equal widths and do not collapse to a single column unless the pane width is below 480 px, at which point they stack vertically.

**Given** a user inserts a Checklist block and checks an item,
**When** the checkbox state changes,
**Then** the item text gains a strikethrough style, the checked state is persisted immediately, and the note's "Saved" indicator updates.

**Given** a user inserts a Code block and selects "Python" from the language dropdown,
**When** they type code into the block,
**Then** syntax highlighting is applied using a bundled highlighter (no external CDN call required) and the language label is displayed in the block header.

**Given** a user inserts an Image block and uploads a file via drag-and-drop,
**When** the file is a JPEG or PNG under 10 MB,
**Then** the image is stored in app storage, rendered inline at full pane width with a max-height of 600 px (scrollable), and the block displays file name and size metadata.

**Given** a user inserts an Image block and drags a file exceeding 10 MB,
**When** the drop event fires,
**Then** the image is not stored, the block displays an error message "File exceeds 10 MB limit. Please compress or resize before uploading.", and the block remains in an empty/editable state.

**Given** a user inserts an Ask Claude block and has a valid Anthropic API key in Settings → AI Providers,
**When** they type a prompt and click "Run",
**Then** the block streams the Claude API response token-by-token into a read-only response area within the block, and the prompt and response are both persisted in the note on completion.

**Given** a user inserts an Ask Claude block but has no Anthropic API key configured,
**When** they attempt to run the block,
**Then** the block displays an inline error: "No Anthropic API key found. Add one in Settings → AI Providers." with a direct link to that settings tab.

**Given** a user inserts an Ask GPT block with a valid OpenAI API key configured,
**When** they type a prompt and click "Run",
**Then** the block calls the OpenAI API with the prompt and model "gpt-4o", streams the response into the block's read-only response area, and persists both prompt and response.

---

### 5.5 Live Claude API Integration

**Given** a user has a valid Anthropic API key saved in Settings → AI Providers,
**When** any AI feature triggers a call to api.anthropic.com/v1/messages,
**Then** the request is made using the key stored in the user's local settings, response streaming begins within 3 seconds on a standard broadband connection, and no API key is ever written to a server log or remote telemetry endpoint.

**Given** the Anthropic API returns a non-200 HTTP response (e.g., 429 rate limit or 503),
**When** the error is received,
**Then** the relevant UI element (block, chat sidebar, or scheduled run) displays a human-readable error message that includes the HTTP status code and a suggestion (e.g., "Rate limit reached. Wait 60 seconds and try again.").

---

### 5.6 @Mention AI Inline

**Given** a user types `@` inside the editor body,
**When** a model picker dropdown appears within 150 ms,
**Then** the dropdown lists Claude, GPT-4o, Gemini, and Groq; the user can select with arrow keys and Enter or by clicking; typing after `@` filters the list.

**Given** a user selects a model from the @mention picker and types a prompt inline,
**When** they press Enter to submit,
**Then** the inline response is rendered beneath the prompt in a visually contained region, and the user can convert it to a named block type using an action menu that appears on hover.

**Given** a user selects a model from the @mention picker but that model's API key is not configured,
**When** they press Enter to submit,
**Then** an inline warning appears: "[Model] is not configured. Add an API key in Settings → AI Providers." and no API call is made.

---

### 5.7 Prompt Library

**Given** a user navigates to the Prompt Library,
**When** they click "New Prompt" and fill in a title, body text using `{{variable}}` syntax, and an optional description, then save,
**Then** the prompt appears in the library list with the title and the variable names extracted and listed as chips below the body preview.

**Given** a user opens a saved prompt that contains `{{topic}}` and `{{date}}` variables,
**When** they click "Run",
**Then** a modal presents one labelled text input per detected variable; the user fills them in and clicks "Execute"; the substituted prompt is sent to the selected AI model.

**Given** a user deletes a Prompt Library entry that is currently assigned to an active cron schedule,
**When** deletion is confirmed,
**Then** the cron schedule is also deleted, and the Notification Center logs an entry: "Scheduled run for '[Prompt Name]' was cancelled because the prompt was deleted."

---

### 5.8 Global Search Overlay (⌘K)

**Given** the user presses ⌘K from any view,
**When** the search overlay opens,
**Then** the text input is focused within 100 ms, no other UI action is required, and pressing Escape closes the overlay without navigating away from the current note.

**Given** the user types a query of 2 or more characters into the global search overlay,
**When** results are returned,
**Then** matched terms are highlighted in yellow within the result snippet, results are ranked by recency, and the first result is pre-selected so the user can press Enter to open it immediately.

**Given** the user applies a "Shelf" filter and a "Date: Last 30 days" filter simultaneously,
**When** results are displayed,
**Then** only notes from the selected shelf created or modified within the last 30 calendar days are shown; removing either filter expands results accordingly.

**Given** the user types a query that matches no notes,
**When** the results area updates,
**Then** it shows an empty state message: "No notes match your search. Try different keywords or remove filters." — no error, no spinner, no blank screen.

---

### 5.9 Note Linker (`[[`)

**Given** a user types `[[` in any pane's editor body,
**When** the note-linker popover appears,
**Then** it lists recent notes first, supports keyboard navigation (arrow keys, Enter to select, Escape to dismiss), and inserts a backlink chip displaying the linked note's title upon selection.

**Given** a backlink chip has been inserted into a note,
**When** the user opens the Right Context Panel,
**Then** the linked note appears in the "Linked Notes" section with its title, note type icon, and a button to open it in a new pane.

**Given** a user deletes a note that is referenced by backlink chips in other notes,
**When** the deletion is confirmed,
**Then** the orphaned backlink chips in other notes display a "Note deleted" greyed-out state rather than breaking the editor or throwing an error.

---

### 5.10 Quick Capture FAB (⌘J)

**Given** the user presses ⌘J from any view including a note editor,
**When** the Quick Capture dialog opens,
**Then** the text area is focused within 100 ms; the user can type a note body; pressing ⌘Enter or clicking "Save to Inbox" creates a new Idea note in the Inbox notebook and closes the dialog.

**Given** the Inbox notebook does not exist (e.g., user deleted it),
**When** the user activates Quick Capture,
**Then** the system recreates an Inbox notebook in the first available Shelf, saves the note there, and shows a toast: "Inbox notebook was recreated."

---

### 5.11 Dark Mode

**Given** the user presses ⌘⇧D,
**When** the shortcut fires,
**Then** all CSS custom properties swap to their dark-mode values within one animation frame (≤ 16 ms), no page reload occurs, and the preference is persisted to local storage so subsequent sessions open in the same mode.

**Given** the user's OS is set to dark mode preference,
**When** Lore is opened for the first time (no stored preference),
**Then** Lore initialises in dark mode automatically by reading `prefers-color-scheme: dark`.

---

### 5.12 4-Step Onboarding Flow

**Given** a first-time user opens Lore (no prior data in local storage),
**When** the app initialises,
**Then** a modal onboarding overlay starts at Step 1 (Welcome) automatically; the user cannot access the main editor until they complete or explicitly skip onboarding.

**Given** the user reaches Step 3 (Add Note) of onboarding,
**When** they create their first note,
**Then** the step is marked complete and a "Next" button activates; the note they created remains in the app when onboarding ends.

**Given** the user clicks "Skip" at any onboarding step,
**When** the skip is confirmed,
**Then** the overlay closes, the app is fully accessible, and onboarding never auto-re-triggers in subsequent sessions; a "Restart onboarding" option is available in Settings → Profile.

---

### 5.13 Settings: AI Providers

**Given** a user navigates to Settings → AI Providers and enters an Anthropic API key,
**When** they click "Test Connection",
**Then** Lore makes a minimal API call (e.g., `max_tokens: 1`, prompt: "ping") and displays "Connection successful" within 5 seconds, or displays the API error message if the key is invalid.

**Given** a user saves an API key to Settings → AI Providers,
**When** the key is stored,
**Then** it is stored only in the browser's local storage or equivalent client-side storage and is never transmitted to any server operated by Lore.

---

### 5.14 Settings: Profile

**Given** a user navigates to Settings → Profile and updates their display name,
**When** they click "Save",
**Then** the new name is reflected in the app header, in any note attribution, and in the Notification Center sender field within one UI render cycle.

---

### 5.15 Knowledge Graph

**Given** a user navigates to the Knowledge Graph view for a Shelf,
**When** the SVG renders,
**Then** each note in the shelf is represented as a labelled node, backlink connections appear as directed edges, shelf cluster boundaries are visually grouped, and cron-job relationships appear as dashed arrows — all within 2 seconds for shelves containing up to 200 notes.

**Given** the user clicks a node in the Knowledge Graph,
**When** the node inspector panel opens,
**Then** it displays the note title, note type, last-modified date, tag list, and a button to open the note in the editor.

**Given** a Shelf contains a note with no backlinks and no cron connections,
**When** the Knowledge Graph renders,
**Then** the isolated note appears as a node positioned at the periphery of the cluster; it is not hidden or excluded from the graph.

---

### 5.16 Note Sharing & Export

**Given** a user clicks "Share" on a note and selects "Copy link",
**When** the link is generated,
**Then** it is copied to the clipboard, a toast confirms "Link copied", and the link opens the note in a read-only public viewer that does not require authentication.

**Given** a user exports a note as PDF,
**When** the export completes,
**Then** all block types are rendered in a print-appropriate layout; Ask Claude / Ask GPT blocks include both the prompt and the stored response; images are embedded; the PDF filename matches the note title.

**Given** a user exports a note as Markdown,
**When** the export completes,
**Then** the resulting `.md` file contains: note title as H1, block-type labels as bold section headers, code blocks as fenced code with language tags, and quote blocks in blockquote format.

---

### 5.17 Notification Center

**Given** a scheduled prompt run completes successfully,
**When** the user opens the Notification Center,
**Then** a new entry in the "Cron" tab shows the prompt name, execution timestamp, and a "View output" action that opens the note containing the run output.

**Given** a scheduled prompt run fails due to an API error,
**When** the user opens the Notification Center,
**Then** the entry appears in both the "Errors" tab and the "Cron" tab with a red error badge, the HTTP error message, and a "Retry" button that re-triggers the run immediately.

---

### 5.18 Zen / Focus Mode

**Given** a user activates Zen mode (via toolbar or keyboard shortcut),
**When** Zen mode is active,
**Then** the nav rail, sidebar, right context panel, and top toolbar are all hidden; a floating zen bar is visible containing only: note title, word count, and a button to exit Zen mode; the canvas fills the full viewport.

**Given** the user is in Zen mode and presses Escape,
**When** the key event fires,
**Then** Zen mode deactivates, all hidden chrome reappears, and the editor state (scroll position, cursor position) is preserved.

---

### 5.19 AI Chat Sidebar

**Given** a user opens the AI Chat sidebar and sends a message,
**When** the AI responds,
**Then** the conversation thread displays user messages right-aligned, AI responses left-aligned with the model name labelled, and the thread is scrollable; each response includes a "Save as block" button.

**Given** a user clicks "Save as block" on an AI Chat response,
**When** the action fires,
**Then** a modal asks which note and which block type (Ask Claude, Note/Insight, Conclusion) to use; upon confirmation the response text is inserted as a new block at the bottom of the selected note.

---

### 5.20 Scheduled Prompt Runs (Cron)

**Given** a user attaches a cron expression (e.g., `0 9 * * 1`) to a Prompt Library entry and saves,
**When** the scheduled time arrives,
**Then** the prompt runs automatically (with any stored variable values), the output is appended as a new HTML or text note in the designated notebook, and a notification is created in the Notification Center.

**Given** a user enters an invalid cron expression (e.g., `99 * * * *`),
**When** they attempt to save the schedule,
**Then** an inline validation error appears: "Invalid cron expression. Field 1 (minutes) must be 0–59." and the save is blocked until corrected.

**Given** a scheduled run is pending and the app is closed,
**When** the app is reopened after the scheduled time has passed,
**Then** the run executes immediately on next app open (catch-up run), is timestamped with the actual execution time, and a toast notifies the user that a missed scheduled run was completed.

---

### 5.21 HTML Notes

**Given** a user creates a new HTML note type and pastes raw HTML into the import field,
**When** they click "Render",
**Then** the HTML is rendered in a sandboxed iframe within the note; external scripts in the pasted HTML are stripped; a "View source" toggle shows the raw HTML.

**Given** a user opens the HTML note Gallery view for a Notebook,
**When** the gallery renders,
**Then** each HTML note is displayed as a thumbnail card showing a scaled preview, the note title, and last-modified date; clicking a card opens the full viewer.

**Given** a user requests AI generation of an HTML note by entering a text description,
**When** the AI response is received,
**Then** the generated HTML is placed into the note's source field, rendered in the sandboxed viewer, and the user can edit the raw source before saving.

---

### 5.22 Template Builder

**Given** a user opens the Template Builder,
**When** they drag block types from the left palette onto the canvas,
**Then** each dropped block is added to the canvas in the order dropped; blocks can be dragged to reorder on the canvas; a metadata form allows setting template name, associated note type, and description.

**Given** a user saves a template,
**When** they create a new note and select "Apply template",
**Then** a modal lists all saved templates filtered by note type; selecting one pre-populates the note with the template's block scaffold and leaves cursor focus on the first editable field.

---

### 5.23 Inline Block Comments

**Given** a user hovers over a block and clicks the comment icon,
**When** the comment thread panel opens alongside the block,
**Then** the user can type a comment, press Enter to submit, and the comment appears in the thread with a timestamp and author name from Settings → Profile.

**Given** a comment thread has multiple replies,
**When** the user clicks "Resolve",
**Then** the entire thread collapses to a resolved state (greyed-out, marked "Resolved by [Name]"), the block no longer shows an active comment indicator, and the thread can be expanded by clicking "Show resolved".

---

## 6. Out of Scope (v1)

- **Real-time multiplayer collaboration (simultaneous editing):** Operational transformation or CRDT-based co-editing requires infrastructure beyond a 3-month MVP. Sharing via public link (read-only) is in scope; live co-editing is not.
- **Mobile native apps (iOS / Android):** The Angular 17 web app will be responsive for tablet viewports but a dedicated native app with offline sync is post-launch.
- **Offline-first sync with a remote server:** v1 uses local storage and GitHub Gist for persistence. A full cloud sync backend with conflict resolution is an architectural commitment deferred to v2.
- **Plugin / extension system:** An open plugin API that allows third-party block types or sidebar panels is a significant security and API stability investment; deferred post-launch.
- **AI-generated images inside Image blocks:** Image generation (DALL-E, Stable Diffusion) is distinct from text AI; licensing, latency, and cost require a separate planning cycle.
- **PDF annotation / markup:** Annotating uploaded PDFs directly in Lore (highlights, sticky notes on PDF pages) is a feature distinct from the note block system; deferred.
- **Mentions of team members / @user collaboration:** User directory, mention notifications, and permission systems require a user account backend. v1 has single-user local usage only.
- **Embed code (`<iframe>` snippet generation):** P2 feature; the public link viewer exists in v1 but the embed snippet generator is post-launch.
- **GitHub Gist Sync:** P2; requires GitHub OAuth flow and Gist API integration. Settings configuration is in scope but the sync action itself is post-launch.
- **Webhooks / external integrations (Zapier, Make):** Integration platform connectors require a server-side middleware layer; deferred post-launch.
- **Voice / audio capture:** Microphone-based capture and transcription (e.g., recording meeting notes) is a separate product surface; not in v1.
- **Version history / note restore:** While auto-save is in scope, a full version history with diff viewer and point-in-time restore is a backend storage feature deferred to v2.

---

## 7. Success Metrics

| Metric | Definition | Target | Measurement Method |
|---|---|---|---|
| **Day-1 Activation Rate** | % of new users who complete the 4-step onboarding flow and create at least one note | ≥ 65% | Event: `onboarding_completed` + `note_created` within first session |
| **Day-7 Retention** | % of users who return to Lore at least once in the 7 days following first use | ≥ 40% | Session event on day 2–8 post first launch |
| **Day-30 Retention** | % of users with at least one session in the 30-day cohort window | ≥ 20% | Session event in days 8–30 post first launch |
| **Notes Created per Active User (Weekly)** | Average number of notes created per user per week among users active in that week | ≥ 5 notes/week | `note_created` events / MAU per week |
| **AI Feature Activation** | % of users who use any AI feature (Ask Claude block, @mention, or AI Chat) within their first 7 days | ≥ 50% | Events: `ask_claude_block_run` OR `ai_mention_submitted` OR `ai_chat_sent` |
| **AI Features per Session** | Average number of AI feature interactions (any model, any surface) per active session | ≥ 2.0 per session | Sum of all AI interaction events / session count |
| **Prompt Library Adoption** | % of Day-30 retained users who have saved at least one Prompt Library entry | ≥ 25% | `prompt_library_saved` event per user cohort |
| **Scheduled Run Adoption** | % of Prompt Library users who activate at least one cron schedule | ≥ 30% of Prompt Library users | `cron_schedule_created` event |
| **Split-Pane Usage Rate** | % of sessions where at least one split-pane action is taken | ≥ 20% of sessions | `split_pane_opened` event / session count |
| **Search Overlay Usage** | % of sessions where ⌘K is invoked | ≥ 35% of sessions | `global_search_opened` event / session count |
| **Quick Capture Usage** | % of daily active users who use ⌘J Quick Capture at least once per day on days they are active | ≥ 15% of DAU | `quick_capture_saved` event / DAU |
| **Knowledge Graph Opens** | % of weekly active users who open the Knowledge Graph view at least once per week | ≥ 20% of WAU | `knowledge_graph_opened` event / WAU |
| **Note Export / Share Actions** | Number of note export or share-link actions per week across all users | ≥ 200 events/week at 6-week post-launch | `note_exported` + `share_link_copied` events |
| **Dark Mode Adoption** | % of users with dark mode active (from local storage preference) | ≥ 45% | Local preference sampled at session start |
| **Editor Load Time (P95)** | Time from navigation to note until the editor is interactive (P95 across all sessions) | ≤ 800 ms | Browser performance mark: `editor_interactive` |
| **AI Response First Token Latency (P95)** | Time from AI request submission to first streamed token rendered in UI (P95) | ≤ 3 000 ms | Custom timing event: `ai_first_token` − `ai_request_sent` |
| **App Crash Rate** | % of sessions ending in an unhandled JavaScript error | ≤ 0.5% of sessions | Error event: `window.onerror` / session count |
| **NPS (Net Promoter Score)** | In-app NPS survey (0–10 scale) shown at 14 days post-activation | ≥ 40 | In-app survey; `promoters − detractors / total` × 100 |
| **Support Ticket Volume per MAU** | Number of support tickets submitted per 1 000 monthly active users | ≤ 8 tickets/1 000 MAU | Support inbox ticket count / MAU × 1 000 |
| **Feature Discovery Rate: Block Types** | % of Day-30 retained users who have used 5 or more distinct block types | ≥ 35% | Count of distinct `block_type_inserted` values per user |