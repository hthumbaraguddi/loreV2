# Requirements Document

## Introduction

Phase 7 adds three AI-powered features to the Lore note-taking application, building on the existing `AIService`, `ApiKeyManagerService`, and `PROVIDER_REGISTRY` infrastructure from Phase 6.

**Feature 1 — AI Chat Sidebar**: A persistent, slide-in panel on the right side of the editor that lets the user hold a multi-turn conversation with any configured AI provider about the currently open note. Chat history is stored per note and is independent of the block-based Ask AI blocks.

**Feature 2 — Inline AI Mentions (@)**: When the user types `@` in the note-body textarea or trailing textarea, a small provider picker appears. Selecting a provider opens an inline prompt input; submitting it inserts the AI's plain-text response at the cursor position in the note body.

**Feature 3 — AI Behaviour Settings Tab**: A fully functional settings tab (the placeholder already exists in `settings-panel.component.ts`) that persists user preferences for default provider, note context inclusion, bio context injection, response style, and max tokens. These preferences are consumed by the Chat Sidebar and Inline Mention features.

---

## Glossary

- **Chat_Sidebar**: The slide-in panel component that hosts the multi-turn AI conversation UI.
- **Chat_Session**: The ordered list of `ChatMessage` objects associated with a single note, keyed by note ID.
- **ChatMessage**: A single turn in a `Chat_Session`, containing role (`user` | `assistant`), content string, provider ID, model ID, and timestamp.
- **Mention_Picker**: The small floating dropdown that appears when `@` is typed in a textarea, listing available AI providers.
- **Mention_Prompt**: The inline input that appears after a provider is selected from the `Mention_Picker`, accepting the user's question.
- **Inline_Response**: The plain-text AI response inserted at the cursor position after a `Mention_Prompt` is submitted.
- **AI_Behaviour_Settings**: The persisted user preferences object controlling default provider, context flags, response style, and token limit.
- **AIService**: The existing Angular service (`ai.service.ts`) that streams responses from Anthropic, OpenAI, Google, and Groq.
- **ApiKeyManagerService**: The existing Angular service that stores and retrieves encrypted API keys.
- **PROVIDER_REGISTRY**: The existing array of `ProviderDefinition` objects defining the four supported AI providers.
- **Note_Context**: The full text content of the currently open note, optionally prepended to AI prompts as context.
- **Bio_Context**: The user's `professionalContext` string from the profile settings, optionally injected as a system prompt.
- **Response_Style**: A set of user-selected style directives (e.g. "Concise", "Technical depth", "Use bullet points") appended to the system prompt.
- **PaperCanvas**: The existing `paper-canvas.component.ts` that hosts the note-body textarea and block list.
- **Settings_Panel**: The existing `settings-panel.component.ts` that manages all settings tabs.

---

## Requirements

### Requirement 1: AI Chat Sidebar — Open and Close

**User Story:** As a note-taker, I want to open and close a persistent AI chat panel from the editor, so that I can have a conversation about my note without leaving the editor view.

#### Acceptance Criteria

1. WHEN the user clicks the chat toggle button in the editor toolbar, THE Chat_Sidebar SHALL slide in from the right side of the editor within 300ms using a CSS transition.
2. WHEN the Chat_Sidebar is open and the user clicks the toggle button again, THE Chat_Sidebar SHALL slide out and be removed from the layout within 300ms.
3. THE Chat_Sidebar SHALL have a fixed width of 360px and SHALL NOT overlap the note canvas; the canvas SHALL shrink to accommodate the sidebar.
4. WHEN the Chat_Sidebar opens for a note that has an existing Chat_Session, THE Chat_Sidebar SHALL display the full prior conversation history for that note.
5. WHEN the Chat_Sidebar opens for a note with no prior Chat_Session, THE Chat_Sidebar SHALL display an empty conversation state with a placeholder prompt.
6. WHEN the user switches to a different note while the Chat_Sidebar is open, THE Chat_Sidebar SHALL load the Chat_Session for the newly active note without closing.

---

### Requirement 2: AI Chat Sidebar — Provider Selection

**User Story:** As a note-taker, I want to choose which AI provider powers my chat session, so that I can use the model best suited to my question.

#### Acceptance Criteria

1. THE Chat_Sidebar SHALL display a provider selector showing all four providers from PROVIDER_REGISTRY.
2. WHEN the Chat_Sidebar opens, THE Chat_Sidebar SHALL pre-select the provider stored in AI_Behaviour_Settings as the default provider.
3. WHEN a provider has no API key configured in ApiKeyManagerService, THE Chat_Sidebar SHALL display that provider as disabled with a "no key" label.
4. WHEN the user selects a different provider from the selector, THE Chat_Sidebar SHALL use that provider for all subsequent messages in the current session without clearing the existing conversation history.
5. IF the user selects a provider with no configured API key, THEN THE Chat_Sidebar SHALL display an inline warning with a link to the AI Providers settings tab.

---

### Requirement 3: AI Chat Sidebar — Sending Messages

**User Story:** As a note-taker, I want to type a message and receive a streaming AI response in the chat panel, so that I can have a natural back-and-forth conversation about my note.

#### Acceptance Criteria

1. THE Chat_Sidebar SHALL provide a textarea input at the bottom of the panel for composing messages.
2. WHEN the user presses Enter (without Shift) or clicks the send button, THE Chat_Sidebar SHALL submit the message and begin streaming the AI response.
3. WHEN a message is submitted, THE Chat_Sidebar SHALL append a `ChatMessage` with role `user` to the Chat_Session immediately before the response begins.
4. WHILE a response is streaming, THE Chat_Sidebar SHALL display the accumulating response text in a new assistant message bubble with a blinking cursor indicator.
5. WHILE a response is streaming, THE Chat_Sidebar SHALL disable the message input and send button.
6. WHEN the stream completes, THE Chat_Sidebar SHALL mark the assistant message as complete, remove the cursor indicator, and re-enable the input.
7. IF the AI_Behaviour_Settings flag `includeNoteContext` is enabled, THEN THE Chat_Sidebar SHALL prepend the full content of the current note to the prompt as a system context block.
8. IF the AI_Behaviour_Settings flag `includeBioContext` is enabled, THEN THE Chat_Sidebar SHALL inject the user's `professionalContext` string as the system prompt.
9. WHEN both `includeNoteContext` and `includeBioContext` are enabled, THE Chat_Sidebar SHALL combine both into a single system prompt, with bio context first and note context second.
10. THE Chat_Sidebar SHALL pass the full prior conversation history as the message array to AIService so the provider receives multi-turn context.

---

### Requirement 4: AI Chat Sidebar — Streaming and Cancellation

**User Story:** As a note-taker, I want to cancel an in-progress AI response, so that I am not forced to wait for a long response I no longer need.

#### Acceptance Criteria

1. WHILE a response is streaming, THE Chat_Sidebar SHALL display a cancel button.
2. WHEN the user clicks the cancel button, THE Chat_Sidebar SHALL call `AIService.cancelRequest()` and stop appending new text to the assistant message.
3. WHEN a request is cancelled, THE Chat_Sidebar SHALL mark the assistant message with a "(cancelled)" suffix and re-enable the input.
4. IF the streaming request fails with an error, THEN THE Chat_Sidebar SHALL display the error message inline in the assistant message bubble with a retry button.
5. WHEN the user clicks the retry button on a failed message, THE Chat_Sidebar SHALL re-submit the preceding user message using the same provider.

---

### Requirement 5: AI Chat Sidebar — Conversation Persistence

**User Story:** As a note-taker, I want my chat history to be saved per note, so that I can return to a previous conversation without losing context.

#### Acceptance Criteria

1. WHEN a Chat_Session is updated (message added or completed), THE Chat_Sidebar SHALL persist the Chat_Session to `localStorage` under the key `lore.chat.{noteId}`.
2. WHEN the application loads and the Chat_Sidebar opens for a note, THE Chat_Sidebar SHALL restore the Chat_Session from `localStorage` if a stored session exists.
3. THE Chat_Sidebar SHALL provide a "Clear conversation" button that removes the Chat_Session for the current note from both the UI and `localStorage`.
4. WHEN the user clicks "Clear conversation", THE Chat_Sidebar SHALL display a confirmation prompt before deleting the session.
5. THE Chat_Sidebar SHALL store a maximum of 50 messages per Chat_Session; WHEN the limit is reached, THE Chat_Sidebar SHALL remove the oldest user+assistant message pair before appending new messages.

---

### Requirement 6: Inline AI Mentions — Trigger and Picker

**User Story:** As a note-taker, I want to type `@` in the note body to quickly invoke an AI provider inline, so that I can get answers inserted directly into my writing without switching to a separate panel.

#### Acceptance Criteria

1. WHEN the user types `@` at the start of a line or after a whitespace character in the note-body textarea or trailing textarea, THE PaperCanvas SHALL display the Mention_Picker.
2. THE Mention_Picker SHALL list all four providers from PROVIDER_REGISTRY, each showing the provider display name and a coloured dot.
3. WHEN a provider has no configured API key, THE Mention_Picker SHALL show that provider with a "no key" badge and SHALL prevent selection.
4. THE Mention_Picker SHALL be positioned adjacent to the cursor, within the viewport bounds.
5. WHEN the user presses Escape or clicks outside the Mention_Picker, THE Mention_Picker SHALL close and the `@` character SHALL be removed from the textarea.
6. WHEN the user types characters after `@`, THE Mention_Picker SHALL filter the provider list to entries whose display name contains the typed string (case-insensitive).
7. THE Mention_Picker SHALL support keyboard navigation: ArrowUp and ArrowDown move the selection, Enter confirms the highlighted provider.

---

### Requirement 7: Inline AI Mentions — Prompt Input and Response Insertion

**User Story:** As a note-taker, I want to type a question after selecting a provider and have the answer inserted inline, so that AI-generated content flows naturally into my note.

#### Acceptance Criteria

1. WHEN the user selects a provider from the Mention_Picker, THE PaperCanvas SHALL replace the `@` trigger with an inline Mention_Prompt input field at the cursor position.
2. THE Mention_Prompt SHALL display a placeholder of "Ask [ProviderName]…" where [ProviderName] is the selected provider's display name.
3. WHEN the user presses Enter in the Mention_Prompt, THE PaperCanvas SHALL submit the prompt to AIService using the selected provider.
4. WHILE the response is streaming, THE PaperCanvas SHALL display a loading indicator adjacent to the Mention_Prompt.
5. WHEN the stream completes, THE PaperCanvas SHALL insert the full Inline_Response as plain text into the note body at the position immediately after the Mention_Prompt, separated by a newline.
6. WHEN the Inline_Response is inserted, THE PaperCanvas SHALL remove the Mention_Prompt input from the textarea and place the cursor at the end of the inserted response text.
7. IF the AI_Behaviour_Settings flag `includeNoteContext` is enabled, THEN THE PaperCanvas SHALL prepend the current note content as context when submitting the Mention_Prompt.
8. IF the streaming request fails, THEN THE PaperCanvas SHALL display an inline error message at the cursor position and restore the textarea to its state before the `@` trigger.
9. WHEN the user presses Escape while the Mention_Prompt is active, THE PaperCanvas SHALL cancel any in-flight request, remove the Mention_Prompt, and restore the textarea to its pre-trigger state.

---

### Requirement 8: AI Behaviour Settings — Persistence

**User Story:** As a note-taker, I want my AI behaviour preferences to be saved and loaded automatically, so that I do not have to reconfigure them each session.

#### Acceptance Criteria

1. THE Settings_Panel SHALL persist AI_Behaviour_Settings to `localStorage` under the key `lore.settings.ai-behaviour` as a JSON object.
2. WHEN the application loads, THE Settings_Panel SHALL read AI_Behaviour_Settings from `localStorage` and initialise all controls to the stored values.
3. IF no stored AI_Behaviour_Settings exist, THEN THE Settings_Panel SHALL initialise with the following defaults: `defaultProvider: 'anthropic'`, `includeNoteContext: true`, `includeBioContext: true`, `responseStyle: ['Concise']`, `maxTokens: 1024`.
4. WHEN any AI_Behaviour_Settings value is changed by the user, THE Settings_Panel SHALL write the updated object to `localStorage` within 500ms.
5. THE AI_Behaviour_Settings object SHALL be readable by the Chat_Sidebar and PaperCanvas components via a shared `AiBehaviourService`.

---

### Requirement 9: AI Behaviour Settings — Default Provider

**User Story:** As a note-taker, I want to set a default AI provider, so that the chat sidebar and inline mentions start with my preferred provider pre-selected.

#### Acceptance Criteria

1. THE Settings_Panel AI Behaviour tab SHALL display a provider selector showing all four providers from PROVIDER_REGISTRY.
2. WHEN the user selects a provider, THE Settings_Panel SHALL update the `defaultProvider` field in AI_Behaviour_Settings.
3. WHEN a provider has no configured API key, THE Settings_Panel SHALL display that provider with a "no key" indicator but SHALL still allow it to be selected as the default.
4. THE Chat_Sidebar SHALL read `defaultProvider` from AI_Behaviour_Settings on open and pre-select that provider.

---

### Requirement 10: AI Behaviour Settings — Context and Style Controls

**User Story:** As a note-taker, I want to control whether my note content and bio are sent to the AI, and how the AI should format its responses, so that I get relevant and appropriately styled answers.

#### Acceptance Criteria

1. THE Settings_Panel AI Behaviour tab SHALL display a toggle for "Include note context in every AI prompt" bound to the `includeNoteContext` flag in AI_Behaviour_Settings.
2. THE Settings_Panel AI Behaviour tab SHALL display a toggle for "Include personal bio context" bound to the `includeBioContext` flag in AI_Behaviour_Settings.
3. THE Settings_Panel AI Behaviour tab SHALL display a multi-select control for response style with the options: "Concise", "Technical depth", "Use bullet points", "Formal tone", "Explain like I'm new to this".
4. WHEN the user selects or deselects a response style option, THE Settings_Panel SHALL update the `responseStyle` array in AI_Behaviour_Settings.
5. WHEN `responseStyle` contains one or more values, THE Chat_Sidebar and PaperCanvas SHALL append a style directive to the system prompt in the format: "Respond in the following style: [style1], [style2]."
6. THE Settings_Panel AI Behaviour tab SHALL display a numeric input for "Max tokens per request" accepting integer values between 256 and 8192.
7. WHEN the user changes the max tokens value, THE Settings_Panel SHALL update the `maxTokens` field in AI_Behaviour_Settings and clamp the value to the range [256, 8192].
8. THE Chat_Sidebar and PaperCanvas SHALL pass the `maxTokens` value from AI_Behaviour_Settings as the `maxTokens` option to `AIService.sendPrompt()`.

---

### Requirement 11: AI Behaviour Settings — Existing Toggle Wiring

**User Story:** As a note-taker, I want the existing AI behaviour toggles in the settings panel to actually persist and take effect, so that features like token usage display and auto-summary work as configured.

#### Acceptance Criteria

1. THE Settings_Panel SHALL persist the state of all existing `aiBehaviourToggles` (auto-link, note-context, bio-context, save-exchanges, token-usage, auto-summary, scheduled-prompts) to `localStorage` under the key `lore.settings.ai-toggles`.
2. WHEN the application loads, THE Settings_Panel SHALL restore all toggle states from `localStorage`.
3. WHEN the `token-usage` toggle is enabled, THE Chat_Sidebar SHALL display the token count and estimated cost in the footer of each completed assistant message.
4. WHEN the `note-context` toggle state changes in Settings_Panel, THE Chat_Sidebar and PaperCanvas SHALL reflect the updated value on the next prompt submission without requiring a page reload.

