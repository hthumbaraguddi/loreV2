# AI-Powered Lore — Requirements Document

**Date:** March 2026  
**Status:** Draft  
**Author:** Harsha T (via brainstorm session)

---

## Background & Problem Statement

Lore currently organises notes using structured templates (Research, Journal, Finance, Scrum, Watchlist, Investing). While these templates work well for planned, structured note-taking, real-world knowledge capture doesn't always follow a template.

Two specific pain points surfaced:

1. **AI responses don't fit templates.** When a user queries Claude or ChatGPT, the response comes back as rich, mixed-format content — tables, headings, bullet lists, charts, financial breakdowns — none of which maps cleanly to Lore's existing template fields. Example: a "₹5 Lakh Crash Portfolio" response from Claude includes a donut chart, tranche plan, allocation table, and risk verdict — all in one response.

2. **There is no path from AI tool → Lore.** Users research things in Claude/ChatGPT, get valuable information, and have no easy way to capture it in Lore. The current workflow is: copy text → create note → pick template → manually fill fields. This is too much friction.

---

## Goals

- Make Lore the natural destination for knowledge captured from AI tools
- Support free-form, unstructured notes alongside structured templates
- Provide an in-app AI chat experience for users who have an API key
- Ensure the product works well for users without any API key
- Allow users to save and reuse prompts with dynamic variables, so recurring analysis tasks (weekly portfolio review, stock analysis, etc.) can be run in one click and saved as notes automatically

---

## User Stories

### US-1: Free-form Rich Note
> As a user, I want to create a note without choosing a template, so I can capture any kind of information in its natural format.

**Acceptance criteria:**
- A new "Rich Note" type is available alongside existing templates
- The editor has two modes toggled by a button:
  - **Toolbar mode** — formatting buttons for bold, italic, headings (H1–H3), bullet list, numbered list, code block, blockquote
  - **Raw mode** — plain textarea for users who prefer to write markdown directly
- The note card renders markdown: headings, bold, italic, lists, tables, code blocks, blockquotes
- Rich notes are stored and synced to Drive like any other note

---

### US-2: Paste AI Response → Save as Note
> As a user without an API key, I want to copy a response from Claude/ChatGPT and paste it into Lore as a note, so I can save AI-generated knowledge without manual reformatting.

**Acceptance criteria:**
- A "Paste AI Response" button is available in the note creation flow
- User pastes raw markdown/text from any AI tool
- Lore auto-detects the first heading or first line as the note title
- The content is saved as a Rich Note and rendered as formatted markdown
- Works with output from Claude, ChatGPT, Gemini, Perplexity — any AI tool
- No API key required

---

### US-3: In-App AI Chat (Anthropic API)
> As a user with an Anthropic API key, I want to ask Claude questions directly inside Lore and save the responses as notes, so I never have to leave the app.

**Acceptance criteria:**
- Settings panel has an "AI" section where the user can enter and save their Anthropic API key
- The key is stored locally (localStorage) by default
- A checkbox "Sync API key to Google Drive" is shown — off by default, opt-in
- A chat panel is accessible from the topbar or sidebar
- User types a question, Lore calls the Anthropic API (`claude-3-5-sonnet` or latest), response streams back
- **Full conversation history is preserved** within the chat session — Claude has context of previous messages
- Response is rendered as rich markdown in the chat panel
- A "Save as note" button appears on each response
- User selects which shelf → notebook → section to save to
- The saved note is a Rich Note with the question as context and the response as content
- Chat history for a session can optionally be saved as a single conversation note
- If no API key is configured, the chat panel shows a prompt to add one in Settings

---

### US-4: API Key Management
> As a user, I want to manage my Anthropic API key in Settings, so I have full control over my AI usage and billing.

**Acceptance criteria:**
- Settings → AI section shows a masked input for the API key
- Key is validated on save (a test call is made)
- User can clear/remove the key at any time
- Key is stored in `localStorage` only by default
- A checkbox "Sync API key to Google Drive" is shown — unchecked by default
- If checked, the key is included in the Drive sync payload (encrypted or as-is — user's responsibility)
- Key is never sent anywhere except directly to `api.anthropic.com`
- A link to Anthropic's API key page is shown for users who need to get a key

---

### US-5: Prompt Library — Create & Save Prompts
> As a user, I want to save prompts I use regularly so I don't have to retype them every time.

**Acceptance criteria:**
- A "Prompt Library" section is accessible from the sidebar or topbar
- User can create a new prompt with:
  - Name (e.g. "Weekly Portfolio Review")
  - Category/tag (e.g. "Finance", "Research", "Health")
  - Prompt body — free text with optional `{{variable}}` placeholders
  - Default target: which shelf → notebook → section the output note should be saved to
- Prompts are listed, searchable, and editable
- Prompts are stored locally and synced to Drive with the rest of user data
- User can duplicate, edit, or delete any prompt

**Example prompt:**
```
Analyse my stock portfolio for the week of {{week}}.

My current holdings:
{{holdings}}

Please provide:
1. Performance summary vs Nifty 50
2. Top performer and laggard this week
3. Risk assessment
4. Recommendation for next week
```

---

### US-6: Prompt Variables — Fill & Run
> As a user, I want to fill in the variable fields of a saved prompt and run it against Claude, so I can get a fresh analysis note with minimal effort.

**Acceptance criteria:**
- When a user selects a prompt from the library and clicks "Run", a modal appears
- The modal shows each `{{variable}}` as a labelled input field
  - Short variables (e.g. `{{week}}`) render as a single-line text input
  - Long variables (e.g. `{{holdings}}`, `{{context}}`) render as a multi-line textarea
- **Values from the last run are pre-filled** — user only needs to update what changed (e.g. the week date)
- Last-used values are persisted per prompt in localStorage
- User fills in the values and clicks "Run with Claude"
- Lore assembles the final prompt (variables substituted) and sends it to the Anthropic API
- The response streams back and is shown in a preview panel
- User can edit the response before saving
- "Save as note" saves it as a Rich Note to the pre-configured section (overridable)
- The note title defaults to: `{Prompt Name} — {date}` (e.g. "Weekly Portfolio Review — 24 Mar 2026")

---

### US-7: Prompt Run Without API Key (Copy Mode)
> As a user without an Anthropic API key, I want to use the Prompt Library to assemble my prompt with variables filled in, copy it, and paste the AI response back into Lore.

**Acceptance criteria:**
- If no API key is configured, the "Run with Claude" button is replaced with "Copy Prompt"
- Clicking "Copy Prompt" copies the fully assembled prompt (variables substituted) to clipboard
- A toast message says: "Prompt copied — paste it into Claude or ChatGPT, then come back and use 'Paste AI Response'"
- The flow then guides the user to the "Paste AI Response" flow (US-2)
- This ensures the Prompt Library is useful even without an API key

---

### US-8: Prompt Run History
> As a user, I want to see when I last ran a prompt and what notes it produced, so I can track my recurring analyses over time.

**Acceptance criteria:**
- Each prompt shows "Last run: X days ago" in the library list
- Clicking a prompt shows a history of notes generated from it (linked to the actual notes)
- Notes generated from a prompt are tagged with the prompt name for traceability

---

### US-9: Prompt Export & Import
> As a user, I want to export my prompts and share them with others, so useful prompts like "Weekly Stock Analysis" can be reused across accounts or devices.

**Acceptance criteria:**
- Each prompt has an "Export" button that downloads it as a `.json` file
- "Import Prompt" button in the Prompt Library accepts a `.json` prompt file
- Exported format includes: name, category, body, variables list (not last-run values or personal data)
- Imported prompts are added to the library without overwriting existing ones (duplicate name gets a suffix)

---

### US-10: Built-in Starter Prompts
> As a new user, I want ready-made prompts for common tasks so I can get value immediately without writing prompts from scratch.

**Acceptance criteria:**
- The following starter prompts ship with Lore (read-only, can be duplicated and customised):

**Research Summary**
```
Summarise the following topic for me: {{topic}}

Please structure your response with:
1. What it is (2-3 sentences)
2. Why it matters
3. Key concepts to understand
4. Recommended next steps or resources
5. Any risks or caveats to be aware of
```

**Weekly Stock Analysis**
```
Analyse the following stocks for the week of {{week}}.

Stocks to analyse: {{stocks}}

For each stock provide:
- Price movement this week and reason
- Key news or events affecting it
- Technical outlook (support/resistance levels)
- Fundamental snapshot (P/E, sector trend)
- Short-term outlook: Bullish / Neutral / Bearish with reasoning
```

**Portfolio Review**
```
Review my investment portfolio for {{period}}.

My holdings:
{{holdings}}

Please provide:
1. Overall portfolio performance vs Nifty 50 / S&P 500
2. Best and worst performers with reasons
3. Sector concentration and diversification assessment
4. Risk assessment (overexposure, correlation risks)
5. Recommended actions: hold, add, trim, or exit for each position
6. Outlook for next {{period}}
```

**Monthly Budget Review**
```
Review my finances for {{month}}.

Income: {{income}}
Expenses by category: {{expenses}}
Savings goal: {{savings_goal}}

Please provide:
1. Income vs expense summary
2. Categories where I overspent vs budget
3. Savings rate and whether I'm on track
4. Top 3 areas to cut back
5. Recommendations for next month
```

- Starter prompts are marked with a "Built-in" badge and cannot be deleted (only duplicated)
- User can duplicate any starter prompt to customise it

---

## Technical Approach

### Rich Note Storage
Rich notes use `templateId: 'rich'` and store content in `note.data.markdown` (a single string field). The note card renders this field using a markdown parser (e.g. `marked` or `marked-it`).

### Paste Flow
The "Paste AI Response" modal accepts raw text. On save:
1. Extract title from first `# Heading` or first non-empty line (truncated to 80 chars)
2. Store full text as `data.markdown`
3. Save as a Rich Note to the selected section

### In-App Claude Chat
Direct browser-to-API call using `fetch`:
```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: <user's key>
  anthropic-version: 2023-06-01
  anthropic-dangerous-direct-browser-access: true
  content-type: application/json
```
No backend proxy needed. Anthropic explicitly supports direct browser access with the user's own key.

### Prompt Library Storage
Prompts are stored as a `lore_prompts` array in localStorage and included in the Drive sync payload:

```typescript
interface SavedPrompt {
  id: string;
  name: string;
  category: string;
  body: string;           // raw text with {{variable}} placeholders
  variables: string[];    // extracted variable names, e.g. ['week', 'holdings']
  lastRunValues: Record<string, string>;  // persisted from last run, pre-filled next time
  defaultTarget: {
    shelfId: string;
    notebookId: string;
    sectionId: string;
  };
  lastRunAt: number | null;
  isBuiltIn: boolean;     // true for starter prompts — cannot be deleted
  createdAt: number;
}
```

### API Key Storage
- Stored in `localStorage` under key `lore_anthropic_key`
- **Not included in Drive sync by default**
- Settings checkbox "Sync API key to Google Drive" — when checked, key is added to Drive payload
- Never logged, never sent to any server other than `api.anthropic.com`

### Chat History Storage
- Active chat session messages stored in memory during the session
- Full conversation sent to Anthropic API on each message (maintains context)
- "Save conversation as note" saves the full Q&A thread as a single Rich Note
- Individual responses can also be saved as standalone notes

### Variable Extraction
Variables are extracted from the prompt body using regex: `/\{\{(\w+)\}\}/g`  
Each unique variable name becomes a form field when the prompt is run.  
Variable type is inferred by name:
- Names containing `holdings`, `portfolio`, `context`, `details`, `list` → textarea
- All others → single-line text input

### Prompt Execution Flow
1. User selects prompt → "Run" clicked
2. Variable fill modal opens
3. User fills values → "Run with Claude" (or "Copy Prompt" if no key)
4. Final prompt assembled: `body.replace(/\{\{varName\}\}/g, value)`
5. Sent to Anthropic API as a user message
6. Response streamed back → rendered as markdown preview
7. User saves → Rich Note created with:
   - `title`: `{promptName} — {date}`
   - `data.markdown`: full AI response
   - `data.promptId`: reference to source prompt
   - `data.promptVariables`: the values used (for audit trail)

---

## Phased Delivery

### Phase 1 — Rich Note + Paste Flow (no API key needed)
- Rich Note template (markdown editor + card renderer)
- "Paste AI Response" button in note creation
- Auto-title extraction
- Markdown rendering on note cards

### Phase 2 — In-App Claude Chat
- API key input in Settings
- Chat panel UI (slide-in panel, similar to Edit Panel)
- Streaming response from Anthropic API
- "Save as note" action on responses
- Section picker for saving

### Phase 3 — Prompt Library
- Prompt Library UI (create, edit, delete, search prompts)
- `{{variable}}` syntax with auto-detected form fields
- Last-run values persisted and pre-filled on next run
- Run flow: fill variables → call Claude → preview → save as Rich Note
- Copy mode for users without API key
- Default target section per prompt
- Prompt run history linked to generated notes
- Export/import prompts as `.json`
- 4 built-in starter prompts: Research Summary, Weekly Stock Analysis, Portfolio Review, Monthly Budget Review

### Phase 4 — AI Enhancements (stretch)
- "Summarise this note" action on any note card
- "Suggest tags" from note content
- "Ask your notes" — semantic search across all notes using AI

---

## Out of Scope (for now)
- Scraping claude.ai or chatgpt.com (blocked by CORS, against ToS)
- Running a headless browser within Lore (not possible in a browser context)
- Shared/hosted API key (would require a backend and incur costs)
- OpenAI / Gemini support (can be added later — same pattern, different endpoint)

---

## Decisions (Open Questions Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | Chat history: conversation or individual notes? | **Save as conversation** — full chat history preserved, individual responses can also be saved as notes |
| 2 | API key in Drive sync? | **Off by default** — checkbox in Settings: "Sync API key to Google Drive" (opt-in) |
| 3 | Rich Note editor: toolbar or plain textarea? | **Both** — provide a toggle between markdown toolbar mode and raw textarea mode; decide which to default after user testing |
| 4 | Prompts shareable/exportable? | **Yes** — prompts can be exported as `.json` and imported, same pattern as notebooks |
| 5 | Variable values pre-filled from last run? | **Yes** — last-used values are persisted per prompt and pre-filled on next run |
| 6 | Built-in starter prompts? | **Yes** — ship with at least: Research Summary, Weekly Stock Analysis, Monthly Portfolio Review, Monthly Budget Review |
