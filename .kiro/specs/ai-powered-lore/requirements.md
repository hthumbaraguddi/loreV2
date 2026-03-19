# Requirements Document — AI-Powered Lore

## Introduction

This document captures requirements for adding AI-powered features to Lore. The feature set is delivered in phases:

- **Phase 1** — Rich Note template + Paste AI Response (no API key required)
- **Phase 2** — In-App AI Chat with streaming responses, session history, and save-as-note
- **Phase 3** — Prompt Library with `{{variable}}` placeholders, run history, and export/import
- **Phase 5** — AI Note Actions (sparkle button) and Smart Search (ask your notes)

All features are purely frontend. No backend is introduced.

---

## Glossary

- **System**: The Lore Angular web application
- **Chat_Panel**: The slide-in chat UI component that communicates with the AI provider
- **AI_Provider**: The configured AI service (Anthropic, Groq, Gemini, OpenRouter, etc.)
- **AnthropicService**: The Angular service that manages AI provider config and API calls
- **Rich_Note**: A note with `templateId: 'rich'` that stores content as a markdown string
- **Prompt_Library**: The UI and service layer for managing saved, reusable prompts
- **PromptService**: The Angular service managing saved prompts in localStorage
- **DataService**: The Angular service managing app state and Drive sync
- **Note_Card**: The card component that renders a note in the content area
- **Edit_Panel**: The slide-in panel for creating and editing notes
- **Settings_Panel**: The slide-in panel for app configuration including AI keys

---

## Requirements

### Requirement 1: Free-form Rich Note (US-1)

**User Story:** As a user, I want to create a note without choosing a template, so I can capture any kind of information in its natural format.

#### Acceptance Criteria

1. THE System SHALL provide a "Rich Note" type available alongside existing templates
2. WHEN the Rich Note editor is open, THE System SHALL provide a toggle between toolbar mode (formatting buttons) and raw mode (plain textarea)
3. WHEN a Rich Note is rendered on a note card, THE System SHALL render markdown including headings, bold, italic, lists, tables, code blocks, and blockquotes
4. THE System SHALL store and sync Rich Notes to Google Drive identically to other note types

---

### Requirement 2: Paste AI Response → Save as Note (US-2)

**User Story:** As a user without an API key, I want to copy a response from Claude/ChatGPT and paste it into Lore as a note, so I can save AI-generated knowledge without manual reformatting.

#### Acceptance Criteria

1. THE System SHALL provide a "Paste AI Response" button in the note creation flow
2. WHEN a user pastes markdown or plain text into the paste modal, THE System SHALL auto-detect the first `# Heading` or first non-empty line as the note title, truncated to 80 characters
3. THE System SHALL save the pasted content as a Rich Note rendered as formatted markdown
4. THE System SHALL accept paste input from any AI tool output without requiring an API key

---

### Requirement 3: In-App AI Chat (US-3)

**User Story:** As a user with an AI API key, I want to ask questions directly inside Lore and save the responses as notes, so I never have to leave the app.

#### Acceptance Criteria

1. THE System SHALL provide a chat panel accessible from the topbar
2. WHEN a user sends a message, THE Chat_Panel SHALL stream the AI response back in real time
3. WHILE a response is streaming, THE Chat_Panel SHALL display the partial response as it arrives
4. THE Chat_Panel SHALL preserve full conversation history within the session so the AI has context of previous messages
5. WHEN an assistant response is complete, THE Chat_Panel SHALL display a "Save as note" button on that response
6. WHEN the user clicks "Save as note", THE System SHALL prompt the user to select a shelf, notebook, and section, then save the response as a Rich Note
7. IF no API key is configured, THEN THE Chat_Panel SHALL display a prompt directing the user to add a key in Settings

---

### Requirement 4: API Key Management (US-4)

**User Story:** As a user, I want to manage my AI API key in Settings, so I have full control over my AI usage and billing.

#### Acceptance Criteria

1. THE Settings_Panel SHALL provide an AI section with a masked input for the API key
2. WHEN the user saves an API key, THE System SHALL validate it by making a minimal test call to the provider
3. THE System SHALL store the API key in `localStorage` only by default
4. THE Settings_Panel SHALL provide a checkbox "Sync API key to Google Drive" that is unchecked by default
5. IF the sync checkbox is checked, THEN THE System SHALL include the API key in the Drive sync payload
6. THE System SHALL never send the API key to any server other than the configured AI provider endpoint

---

### Requirement 5: Prompt Library — Create & Save Prompts (US-5)

**User Story:** As a user, I want to save prompts I use regularly so I don't have to retype them every time.

#### Acceptance Criteria

1. THE System SHALL provide a Prompt Library section accessible from the topbar
2. THE Prompt_Library SHALL allow users to create prompts with a name, category/tag, body text with optional `{{variable}}` placeholders, and a default save target
3. THE Prompt_Library SHALL list all prompts in a searchable, editable list
4. THE System SHALL store prompts in `localStorage` and sync them to Google Drive with the rest of user data
5. THE Prompt_Library SHALL allow users to duplicate, edit, or delete any non-built-in prompt

---

### Requirement 6: Prompt Variables — Fill & Run (US-6)

**User Story:** As a user, I want to fill in the variable fields of a saved prompt and run it against the AI, so I can get a fresh analysis note with minimal effort.

#### Acceptance Criteria

1. WHEN a user selects a prompt and clicks "Run", THE System SHALL display a modal showing each `{{variable}}` as a labelled input field
2. THE System SHALL pre-fill variable fields with values from the last run of that prompt
3. WHEN the user clicks "Run", THE System SHALL substitute all `{{variable}}` placeholders with the provided values before sending to the AI
4. THE System SHALL stream the AI response into a preview panel within the run modal
5. WHEN the user saves the response, THE System SHALL create a Rich Note with title `{promptName} — {date}` and store `data.promptId` and `data.promptVariables` on the note

---

### Requirement 7: Prompt Run Without API Key — Copy Mode (US-7)

**User Story:** As a user without an API key, I want to use the Prompt Library to assemble my prompt with variables filled in and copy it to clipboard.

#### Acceptance Criteria

1. IF no API key is configured, THEN THE System SHALL replace the "Run" button with a "Copy Prompt" button
2. WHEN the user clicks "Copy Prompt", THE System SHALL copy the fully assembled prompt (variables substituted) to the clipboard
3. WHEN the prompt is copied, THE System SHALL display a toast message guiding the user to paste the result into an external AI tool and return to use "Paste AI Response"

---

### Requirement 8: Prompt Run History (US-8)

**User Story:** As a user, I want to see when I last ran a prompt and what notes it produced, so I can track my recurring analyses over time.

#### Acceptance Criteria

1. THE Prompt_Library SHALL display "Last run: X days ago" for each prompt that has been run
2. WHEN a user views a prompt's history, THE System SHALL show a list of notes generated from that prompt, linked to the actual notes
3. THE System SHALL tag notes generated from a prompt with the prompt name for traceability

---

### Requirement 9: Prompt Export & Import (US-9)

**User Story:** As a user, I want to export my prompts and share them with others, so useful prompts can be reused across accounts or devices.

#### Acceptance Criteria

1. THE Prompt_Library SHALL provide an "Export" button per prompt that downloads a `.json` file containing `name`, `category`, `body`, and `variables`
2. THE exported JSON SHALL NOT contain `lastRunValues` or `defaultTarget`
3. THE Prompt_Library SHALL provide an "Import Prompt" button that accepts a `.json` prompt file
4. WHEN a prompt is imported with a name that already exists, THE System SHALL add the imported prompt with a numeric suffix (e.g. "Name (2)") without overwriting the existing prompt

---

### Requirement 10: Built-in Starter Prompts (US-10)

**User Story:** As a new user, I want ready-made prompts for common tasks so I can get value immediately without writing prompts from scratch.

#### Acceptance Criteria

1. THE System SHALL ship with 4 built-in starter prompts: Research Summary, Weekly Stock Analysis, Portfolio Review, Monthly Budget Review
2. THE Prompt_Library SHALL mark built-in prompts with a "Built-in" badge and SHALL NOT allow them to be deleted
3. THE Prompt_Library SHALL allow users to duplicate any built-in prompt to create a customisable copy

---

### Requirement 11: Cross-Notebook Connections (US-11)

**User Story:** As a user, I want Lore to surface connections and recurring themes across all my notebooks, so I can discover patterns I didn't notice myself.

#### Acceptance Criteria

1. THE System SHALL provide a "Surface Connections" action accessible from the topbar or sidebar AI menu
2. WHEN the user triggers Surface Connections, THE System SHALL collect all note titles and content and send them to the AI with an analysis prompt
3. IF total note content exceeds approximately 200,000 characters, THEN THE System SHALL truncate each note to its title and first 300 characters
4. THE System SHALL display the AI result as formatted markdown in a read-only panel
5. THE System SHALL provide a "Save as note" button on the result panel
6. IF no API key is configured, THEN THE System SHALL display a prompt directing the user to Settings

---

### Requirement 12: AI Note Actions — Sparkle Button (US-12)

**User Story:** As a user, I want to select a note and ask AI to summarise, tag, or restructure it, so I can improve my notes without manual effort.

#### Acceptance Criteria

1. WHEN a user hovers over a note card, THE Note_Card SHALL display a sparkle (✦) AI action button
2. WHEN the user clicks the sparkle button, THE System SHALL display a compact action menu with preset actions and a free-text input
3. THE System SHALL provide the following preset actions: Summarise, Extract tags, Expand, Simplify, Action items
4. WHEN the user selects an action or submits a free-text instruction, THE System SHALL send the note content to the AI and stream the result into a preview panel
5. THE System SHALL provide three apply options on the preview: Replace note content, Append to note, Save as new note
6. WHEN the user chooses Replace, THE System SHALL preserve the original note content in an in-memory undo buffer until the user explicitly confirms
7. IF no API key is configured, THEN THE System SHALL display a prompt directing the user to Settings
8. THE System SHALL extract content from both Rich Notes and structured template notes for AI processing

---

### Requirement 13: Smart Search — Ask Your Notes (US-13)

**User Story:** As a user, I want to ask a question in plain English and get an answer drawn from my notes, so I can find information without remembering exact keywords.

#### Acceptance Criteria

1. THE System SHALL provide an "Ask AI" toggle in the existing search bar
2. WHEN the Ask AI toggle is active and the user submits a query, THE System SHALL send the query along with note content to the AI
3. WHILE the AI search is processing, THE System SHALL display a "Searching your notes…" loading state
4. WHEN the AI returns a result, THE System SHALL display the answer followed by source note references as clickable links
5. WHEN the user clicks a source reference, THE System SHALL open that note
6. IF no API key is configured, THEN THE System SHALL fall back to keyword search
7. THE System SHALL support scoping the search to a single notebook or across all notebooks

---

### Requirement 14: Daily Digest (US-14)

**User Story:** As a user, I want Lore to generate a brief daily or weekly digest of my recent notes, so I stay on top of what I've captured without re-reading everything.

#### Acceptance Criteria

1. THE Settings_Panel SHALL provide an opt-in "Daily Digest" toggle in the AI section, off by default
2. WHEN Daily Digest is enabled, THE System SHALL generate a digest on the next app open after the scheduled interval (daily or weekly)
3. THE System SHALL save the digest automatically as a Rich Note in a user-configured section
4. THE System SHALL allow the user to manually trigger a digest at any time via a "Generate digest now" button
5. IF no API key is configured, THEN THE System SHALL not generate a digest and SHALL display a prompt to add a key

---

### Requirement 15: AI-Suggested Related Notes (US-15)

**User Story:** As a user, I want to see AI-suggested related notes when I'm viewing or editing a note, so I can connect ideas across my knowledge base.

#### Acceptance Criteria

1. WHEN a note is open in the Edit_Panel, THE System SHALL display a "Related" section in the panel footer, collapsed by default
2. WHEN the user clicks "Find related notes", THE System SHALL send the current note content and other note summaries to the AI and return 2–3 related note suggestions
3. THE System SHALL display each suggestion with the note title and notebook path
4. WHEN the user clicks a suggestion, THE System SHALL open that note
5. IF no API key is configured, THEN THE System SHALL not display the related notes section

---

### Requirement 16: Dynamic AI Provider Name in Chat Panel (US-16)

**User Story:** As a user, I want the chat panel to display the name of my active AI provider, so I know which AI service I am talking to.

#### Acceptance Criteria

1. WHEN the Chat_Panel is open, THE Chat_Panel SHALL display the active provider's name in the panel header (e.g. "Ask Groq", "Ask Gemini", "Ask Claude") instead of a hardcoded provider name
2. WHEN the user changes the active AI provider in Settings, THE Chat_Panel SHALL reflect the updated provider name on next open
3. THE Chat_Panel SHALL derive the display name from `AnthropicService.getProviderId()` mapped through the `AI_PROVIDERS` list
4. IF the active provider id does not match any entry in `AI_PROVIDERS`, THEN THE Chat_Panel SHALL display a generic label "Ask AI"
