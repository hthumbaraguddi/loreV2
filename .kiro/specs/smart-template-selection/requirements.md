# Requirements Document

## Introduction

The Smart Template Selection feature adds two complementary capabilities to the Lore notes app's page editor (blank note type).

**Feature 1 — In-page template picker:** When a user opens a new blank page note, an inline template picker appears inside the editor itself (no modal, no drawer). The user can browse all available templates and apply one, switching the editor to that template's form inline. If the user prefers to write freely, they can dismiss the picker and continue on the blank page.

**Feature 2 — Background template decoration:** After the user finishes writing a free-form blank page note and saves it, the app silently analyses the content in the background (using keyword matching, or AI matching if enabled). The matched template is stored against the note. The *next time* the user opens that note, it is presented decorated with the matched template's structure — the user is never interrupted while writing. The user can confirm or reject the decoration on re-open, and a setting controls whether decoration is applied automatically or requires confirmation.

Both features are designed to reduce friction when starting a new note and help users discover the right structure for their content without interrupting their flow.

## Glossary

- **Page_Editor**: The Angular component (`page-editor.component`) that renders the blank/page-type note editor with block-based content.
- **Template_Picker**: The inline UI section rendered inside the Page_Editor that displays all available templates for selection.
- **Template_Matcher**: The service responsible for analysing page content and returning a ranked template suggestion.
- **Keyword_Matcher**: The rule-based matching algorithm within the Template_Matcher that scores templates against content using keyword heuristics.
- **AI_Matcher**: The AI-powered matching algorithm within the Template_Matcher that calls the configured AI provider to classify content.
- **Pending_Match**: A matched template id stored on a note (in the note's `data` object under `_pendingTemplateId`) that has been identified but not yet confirmed by the user.
- **Decoration_Banner**: The confirmation UI element shown at the top of the Page_Editor when a note is re-opened and has a Pending_Match, prompting the user to accept or dismiss the suggested template.
- **Smart_Notes_Settings**: The new settings section added to the Settings panel that controls template matching behaviour.
- **AppState**: The application state object persisted to localStorage and synced to GitHub Gist.
- **TemplateService**: The existing Angular service that provides built-in and custom template definitions.
- **AnthropicService**: The existing Angular service that communicates with the configured AI provider.
- **Blank_Page**: A note whose `templateId` is `'page'`.

---

## Requirements

### Requirement 1: In-Page Template Picker Display

**User Story:** As a user opening a new blank page note, I want to see a template picker inside the editor itself, so that I can choose a starting structure without leaving the page or opening a modal.

#### Acceptance Criteria

1. WHEN a Blank_Page with no block content is opened in the Page_Editor, THE Template_Picker SHALL render inline within the page editor body, below the title field and above the block editor area.
2. THE Template_Picker SHALL display all built-in templates and all custom templates retrieved from the TemplateService.
3. THE Template_Picker SHALL show each template's icon, name, and color accent so that users can visually distinguish templates.
4. WHEN the user has not yet typed any content and has not dismissed the Template_Picker, THE Template_Picker SHALL remain visible.
5. WHEN the user dismisses the Template_Picker by clicking a "Start blank" control, THE Template_Picker SHALL hide and THE Page_Editor SHALL display the standard block editor.
6. WHEN the user adds content to the title or any block, THE Template_Picker SHALL automatically hide.
7. IF the note already has non-empty block content when opened, THEN THE Template_Picker SHALL NOT be displayed.

---

### Requirement 2: In-Page Template Application

**User Story:** As a user viewing the template picker, I want to select a template and have the editor switch to that template's form inline, so that I can start filling in structured fields without navigating away.

#### Acceptance Criteria

1. WHEN the user selects a template from the Template_Picker, THE Page_Editor SHALL hide the Template_Picker and the block editor, and SHALL display the selected template's form inline within the same editor view.
2. WHEN a template is selected, THE Page_Editor SHALL preserve the current title value and pre-populate the template form's title field with it.
3. WHEN the user saves after selecting a template, THE Page_Editor SHALL emit a `saved` event with the selected `templateId` and the form data read from the template form.
4. WHEN the user selects the built-in `'page'` template from the picker, THE Page_Editor SHALL remain in block-editor mode and SHALL hide the Template_Picker.

---

### Requirement 3: Background Template Analysis on Save

**User Story:** As a user who writes free-form notes, I want the app to silently analyse my content after I save and identify the best matching template, so that my note can be decorated next time I open it — without interrupting my writing flow.

#### Acceptance Criteria

1. WHEN a Blank_Page note is saved with at least 20 words of block content, THE Template_Matcher SHALL run in the background after the save completes.
2. THE Template_Matcher SHALL analyse the saved content using keyword matching (always enabled) or AI matching (if enabled in Smart_Notes_Settings).
3. WHEN the Template_Matcher identifies a match above the configured confidence threshold, IT SHALL store the matched template id as `_pendingTemplateId` in the note's `data` object and persist the note.
4. THE background analysis SHALL NOT block the save operation, SHALL NOT display any loading indicator, and SHALL NOT interrupt the user in any way.
5. IF no template scores above the threshold, THEN `_pendingTemplateId` SHALL NOT be set and the note SHALL remain as a plain Blank_Page.
6. IF the note already has a non-page `templateId` (i.e. the user already applied a template), THEN background analysis SHALL NOT run.

---

### Requirement 4: Keyword-Based Template Matching

**User Story:** As a user, I want the app to use keyword rules to identify the best matching template for my note content, so that template suggestions work even without an AI provider configured.

#### Acceptance Criteria

1. THE Keyword_Matcher SHALL define keyword sets for each built-in template: finance, journal, research, scrum, investing, and watchlist.
2. THE Keyword_Matcher SHALL assign a relevance score to each template by counting keyword matches (case-insensitive) in the note's full text content.
3. THE Keyword_Matcher SHALL return the highest-scoring template only if its score exceeds a minimum threshold of 3 keyword matches.
4. IF no template exceeds the threshold, THE Keyword_Matcher SHALL return null (no match).
5. WHEN AI matching is disabled in Smart_Notes_Settings, THE Template_Matcher SHALL use only the Keyword_Matcher result.

---

### Requirement 5: AI-Powered Template Matching

**User Story:** As a user with an AI provider configured, I want the app to use AI to identify the best matching template for my note content, so that I get more accurate suggestions than keyword rules alone.

#### Acceptance Criteria

1. WHEN AI matching is enabled in Smart_Notes_Settings and an API key is configured, THE AI_Matcher SHALL send the note's full text content to the AnthropicService after save and request a template classification.
2. THE AI_Matcher SHALL instruct the AI provider to return one of the known template ids (`finance`, `journal`, `research`, `scrum`, `investing`, `watchlist`, `page`) or `null` if no template fits.
3. WHEN the AI_Matcher returns a valid template id, THE Template_Matcher SHALL use the AI result as the primary match, overriding the keyword result.
4. WHEN the AnthropicService returns an error, times out, or no API key is configured, THE Template_Matcher SHALL fall back to the Keyword_Matcher result without displaying an error to the user.
5. IF the user has not configured an AI provider API key, THEN the "AI template matching" checkbox in Smart_Notes_Settings SHALL be disabled with a hint: "Requires an AI provider API key".

---

### Requirement 6: Decoration Banner on Re-Open

**User Story:** As a user re-opening a note that was analysed in the background, I want to see a non-intrusive banner offering to apply the matched template, so that I can accept or dismiss the suggestion at my own pace.

#### Acceptance Criteria

1. WHEN a Blank_Page note with a `_pendingTemplateId` is opened in the Page_Editor, THE Decoration_Banner SHALL render at the top of the editor (above the title) showing the matched template's icon, name, and two actions: "Apply [Template Name]" and "Keep as plain note".
2. WHEN the user clicks "Apply [Template Name]", THE Page_Editor SHALL apply the matched template as described in Requirement 2 (AC 1–3), clear `_pendingTemplateId` from the note's data, and save.
3. WHEN the user clicks "Keep as plain note", THE Decoration_Banner SHALL hide, `_pendingTemplateId` SHALL be cleared from the note's data, and the note SHALL remain as a Blank_Page.
4. WHILE the Decoration_Banner is visible, THE Page_Editor SHALL allow the user to read and edit the note without any blocking interaction.
5. WHEN auto-apply is enabled in Smart_Notes_Settings, THE Page_Editor SHALL apply the matched template immediately on open WITHOUT showing the Decoration_Banner, and SHALL display a brief dismissible toast: "Applied [Template Name] — Undo".
6. WHEN the user clicks "Undo" in the auto-apply toast, THE Page_Editor SHALL revert the note to Blank_Page state, clear `_pendingTemplateId`, and save.

---

### Requirement 7: Smart Notes Settings Section

**User Story:** As a user, I want a dedicated "Smart Notes" section in the Settings panel where I can control template matching behaviour.

#### Acceptance Criteria

1. THE Settings_Panel SHALL render a "Smart Notes" section below the "AI Provider" section.
2. THE Smart_Notes_Settings SHALL contain a checkbox labelled "AI template matching" that enables or disables AI-powered matching (default: off).
3. THE Smart_Notes_Settings SHALL contain a checkbox labelled "Auto-apply matched template" that controls whether the Decoration_Banner is shown or the template is applied immediately on re-open (default: off).
4. WHEN either checkbox is toggled, THE Smart_Notes_Settings SHALL persist the preference to localStorage (`lore_smart_notes_ai_matching`, `lore_smart_notes_auto_apply`).
5. WHEN the Settings panel is opened, THE Smart_Notes_Settings SHALL read and reflect the current persisted values for both checkboxes.
6. IF no API key is configured, THEN the "AI template matching" checkbox SHALL be rendered as disabled with a visible hint: "Requires an AI provider API key".

---

### Requirement 8: Settings Persistence

**User Story:** As a user, I want my Smart Notes settings to survive page reloads.

#### Acceptance Criteria

1. THE Smart_Notes_Settings SHALL store both preference flags in localStorage so that they persist across browser sessions.
2. FOR ALL valid combinations of the two boolean preference flags, reading the flags immediately after writing them SHALL return the same values (round-trip property).
