# AI-Powered Lore — Implementation Tasks

## Phase 1: Rich Note + Paste AI Response

- [x] 1. Add `SavedPrompt` and `ChatMessage` interfaces to `models/index.ts`
  - [x] 1.1 Add `SavedPrompt` interface with all fields from design doc
  - [x] 1.2 Add `ChatMessage` interface (`role`, `content`)
  - [x] 1.3 Extend Drive sync payload type to include `prompts` and optional `anthropicKey`

- [x] 2. Install `marked` and create the `rich` template
  - [x] 2.1 Run `npm install marked` in `lore-app/`
  - [x] 2.2 Create `lore-app/src/app/templates/rich.template.ts`
    - `buildForm(data?)` — renders mode-toggle button, toolbar row, and `<textarea id="f_markdown">`
    - `readForm()` — reads `#f_markdown`, extracts title from first `# Heading` or first non-empty line (≤80 chars)
    - `renderCard(note, color, highlightFn)` — calls `marked.parse(note.data.markdown)` and returns HTML
  - [x] 2.3 Register `richTemplate` in `TemplateService` constructor
  - [x] 2.4 Add markdown rendering styles to `styles.scss` (headings, tables, code blocks, blockquotes)

- [x] 3. Create `PasteAiResponseModalComponent`
  - [x] 3.1 Scaffold `lore-app/src/app/components/modals/paste-ai-response-modal/` (ts, html, scss)
  - [x] 3.2 Textarea for pasting raw markdown; "Save" disabled when empty/whitespace
  - [x] 3.3 On save: extract title, call `DataService.addNote` with `templateId: 'rich'`
  - [x] 3.4 Inputs: `isOpen`, `targetSection`; Outputs: `closed`, `noteSaved`

- [x] 4. Extend `EditPanelComponent` for rich template
  - [x] 4.1 When selected template is `rich`, render the rich template form (toolbar + textarea toggle)
  - [x] 4.2 Add "Paste AI Response" button that opens `PasteAiResponseModalComponent` pre-filled from clipboard
  - [x] 4.3 Manage `richMode: 'toolbar' | 'raw'` toggle in component state
  - [x] 4.4 Wire toolbar buttons (bold, italic, H1–H3, bullet list, numbered list, code block, blockquote) to insert markdown syntax into the textarea

- [ ] 5. Write property-based tests for Phase 1 (using `fast-check`)
  - [ ] 5.1 P1 — Rich Note data round-trip: serialize/deserialize, assert `data.markdown` identity
  - [ ] 5.2 P2 — Title extraction from first `# Heading`
  - [ ] 5.3 P3 — Title extraction fallback to first non-empty line
  - [ ] 5.4 P4 — Markdown rendering produces structural HTML tags

---

## Phase 2: In-App Claude Chat

- [x] 6. Create `AnthropicService`
  - [x] 6.1 Scaffold `lore-app/src/app/services/anthropic.service.ts`
  - [x] 6.2 Implement `getApiKey()`, `setApiKey()`, `clearApiKey()` using `localStorage['lore_anthropic_key']`
  - [x] 6.3 Implement `validateApiKey(key)` — sends a minimal test message, returns `Promise<boolean>`
  - [x] 6.4 Implement `sendMessage(messages, onChunk)` — fetch + ReadableStream SSE, calls `onChunk` per text delta
  - [x] 6.5 Handle API errors: 401, 429, network failure, stream interruption

- [x] 7. Extend `SettingsPanelComponent` with AI section
  - [x] 7.1 Add "AI" section to settings panel HTML with masked API key input
  - [x] 7.2 "Save & Validate" button — calls `AnthropicService.validateApiKey`, shows success/error toast
  - [x] 7.3 "Remove key" button — calls `AnthropicService.clearApiKey`
  - [x] 7.4 Checkbox "Sync API key to Google Drive" — stored as `lore_anthropic_key_sync_drive`; when checked, key included in Drive payload
  - [x] 7.5 Link to Anthropic API key page for users who need to get a key

- [x] 8. Create `ChatPanelComponent`
  - [x] 8.1 Scaffold `lore-app/src/app/components/chat-panel/` (ts, html, scss) — slide-in panel pattern matching `EditPanelComponent`
  - [x] 8.2 Maintain `messages: ChatMessage[]` in component state (session memory)
  - [x] 8.3 Render user messages as plain text, assistant messages via `marked.parse` + `DomSanitizer`
  - [x] 8.4 Stream assistant response character-by-character into the last message
  - [x] 8.5 "Save as note" button on each assistant message — section picker → `DataService.addNote` with `templateId: 'rich'`
  - [x] 8.6 "Save conversation" button in footer — saves full Q&A thread as a single Rich Note
  - [x] 8.7 Show "no API key" state with link to Settings when key is absent
  - [x] 8.8 Add chat panel trigger button to topbar

- [x] 9. Wire `ChatPanelComponent` into `AppComponent`
  - [x] 9.1 Add `<app-chat-panel>` to `app.component.html`
  - [x] 9.2 Toggle `chatPanelOpen` from topbar button

- [ ] 10. Write property-based and unit tests for Phase 2
  - [ ] 10.1 P12 — API key stored only in localStorage by default; absent from Drive payload unless checkbox checked
  - [ ] 10.2 P13 — Copy mode when no API key; no fetch to `api.anthropic.com`
  - [ ] 10.3 Unit: `validateApiKey` — mock fetch, assert `true` on 200, `false` on 401
  - [ ] 10.4 Unit: `sendMessage` — mock ReadableStream SSE, assert `onChunk` called with correct text deltas
  - [ ] 10.5 Unit: `ChatPanelComponent` — assert "no API key" state renders settings prompt

---

## Phase 3: Prompt Library

- [ ] 11. Create `PromptService`
  - [ ] 11.1 Scaffold `lore-app/src/app/services/prompt.service.ts`
  - [ ] 11.2 Implement `getAll()`, `getById()`, `save()` (upsert), `delete()` (no-op for built-ins), `duplicate()`
  - [ ] 11.3 Implement `extractVariables(body)` — regex `/\{\{(\w+)\}\}/g`, returns unique names
  - [ ] 11.4 Implement `updateLastRunValues(id, values)` — persists values and sets `lastRunAt`
  - [ ] 11.5 Implement `exportPrompt(id)` — downloads JSON excluding `lastRunValues` and `defaultTarget`
  - [ ] 11.6 Implement `importPrompt(json)` — parses, deduplicates name with suffix, saves, forces `isBuiltIn: false`
  - [ ] 11.7 Implement `getRunHistory(promptId)` — queries `DataService` for notes with `data.promptId`
  - [ ] 11.8 Seed 4 built-in starter prompts on first load (Research Summary, Weekly Stock Analysis, Portfolio Review, Monthly Budget Review)

- [ ] 12. Create `PromptLibraryModalComponent`
  - [ ] 12.1 Scaffold `lore-app/src/app/components/modals/prompt-library-modal/` (ts, html, scss)
  - [ ] 12.2 List all prompts grouped by category with search bar
  - [ ] 12.3 Each row: name, category badge, "Last run" timestamp, Run / Edit / Duplicate / Export / Delete actions
  - [ ] 12.4 Built-in prompts show "Built-in" badge; Delete disabled for built-ins
  - [ ] 12.5 "New Prompt" button opens inline create form
  - [ ] 12.6 "Import" button accepts `.json` file via file input

- [ ] 13. Create `PromptRunModalComponent`
  - [ ] 13.1 Scaffold `lore-app/src/app/components/modals/prompt-run-modal/` (ts, html, scss)
  - [ ] 13.2 Dynamically build variable form from `PromptService.extractVariables(prompt.body)`
    - Names containing `holdings`, `portfolio`, `context`, `details`, `list` → `<textarea>`
    - All others → `<input type="text">`
  - [ ] 13.3 Pre-fill fields from `prompt.lastRunValues`
  - [ ] 13.4 "Run with Claude" button (API key present) — assemble prompt, call `AnthropicService.sendMessage`, stream into preview
  - [ ] 13.5 "Copy Prompt" button (no API key) — copy assembled prompt to clipboard, show toast, guide to Paste flow
  - [ ] 13.6 Preview area is editable before saving
  - [ ] 13.7 "Save as note" — creates Rich Note with title `{promptName} — {date}`, sets `data.promptId` and `data.promptVariables`
  - [ ] 13.8 Run button disabled until all variable fields are non-empty

- [ ] 14. Add Prompt Library trigger to topbar/sidebar
  - [ ] 14.1 Add "Prompts" button to topbar
  - [ ] 14.2 Wire `<app-prompt-library-modal>` into `AppComponent`

- [ ] 15. Integrate prompts into Drive sync
  - [ ] 15.1 Extend `DriveService.scheduleSave` to include `PromptService.getAll()` in payload
  - [ ] 15.2 Extend `DataService.loadFromObject` to restore prompts into `PromptService` on Drive load
  - [ ] 15.3 When `lore_anthropic_key_sync_drive` is `'true'`, include API key in Drive payload

- [ ] 16. Write property-based and unit tests for Phase 3
  - [ ] 16.1 P5 — Variable extraction completeness
  - [ ] 16.2 P6 — Variable substitution leaves no `{{...}}` tokens
  - [ ] 16.3 P7 — Prompt CRUD round-trip
  - [ ] 16.4 P8 — Last-run values and timestamp persistence
  - [ ] 16.5 P9 — Prompt export excludes `lastRunValues` and `defaultTarget`
  - [ ] 16.6 P10 — Prompt import deduplicates names with suffix
  - [ ] 16.7 P11 — Built-in prompts are undeletable
  - [ ] 16.8 Unit: `importPrompt` forces `isBuiltIn: false`
  - [ ] 16.9 Unit: all 4 built-in starter prompts present after `PromptService` init on empty storage
  - [ ] 16.10 Unit: generated note title matches `{promptName} — {date}` pattern
  - [ ] 16.11 Integration: `DataService.saveAll` includes prompts in Drive payload
  - [ ] 16.12 Integration: API key sync checkbox controls key presence in Drive payload
