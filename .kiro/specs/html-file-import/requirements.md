# Requirements Document

## Introduction

The HTML File Import feature extends the existing "Paste AI Response" modal in the Lore Notes Angular app to support direct HTML file import via a file picker (drag-and-drop or click-to-browse). Instead of requiring users to manually copy-paste large HTML files into a textarea, the feature reads the file via the browser's `FileReader` API, stores the raw HTML string directly in the note's data model (not as a DOM attribute), and renders it in the note card via a Blob URL (`URL.createObjectURL`) so that large files work reliably. The feature also injects CSS overrides into the rendered iframe to neutralise CSS-class-based hidden states and animation-frozen content, ensuring all content is immediately visible without JavaScript execution.

## Glossary

- **File_Importer**: The Angular component logic (within the existing `PasteAiResponseModal` or a new dedicated modal) responsible for accepting a file from the user and reading its contents.
- **HTML_Processor**: The client-side processing step that strips `<script>` tags, inline event handlers, and injects containment/visibility CSS into the raw HTML string before storage or rendering.
- **Note_Store**: The `DataService` that persists note data in the app state.
- **Rich_Template**: The `richTemplate` (`TemplateDefinition`) that renders note cards for notes with `templateId === 'rich'`.
- **Note_Card**: The `NoteCardComponent` that displays a rendered note, including the iframe for HTML notes.
- **Blob_Renderer**: The logic inside `NoteCardComponent` that creates a `Blob` from the stored HTML string, generates a `URL.createObjectURL` URL, and assigns it to an iframe's `src` attribute.
- **Containment_CSS**: A `<style>` block injected into the HTML before rendering that cancels animations, forces visibility, and constrains layout.
- **HTML_Note**: A `Note` with `templateId === 'rich'` and `data.contentType === 'html'`.
- **Import_Tab**: A tab or toggle within the modal that switches between the existing paste-text workflow and the new file-import workflow.
- **Drag_Zone**: The drag-and-drop target area rendered in the Import_Tab.

---

## Requirements

### Requirement 1: File Import UI in the Paste AI Response Modal

**User Story:** As a user, I want to import an HTML file directly from my filesystem into a note, so that I do not have to manually copy-paste large HTML file contents.

#### Acceptance Criteria

1. WHEN the "Paste AI Response" modal is open, THE File_Importer SHALL display two tabs: "Paste Text" (existing behaviour) and "Import File" (new behaviour).
2. WHEN the user selects the "Import File" tab, THE File_Importer SHALL display a Drag_Zone that accepts `.html` and `.htm` file types.
3. WHEN the user selects the "Import File" tab, THE File_Importer SHALL display a "Browse…" button that opens the native OS file picker filtered to `.html` and `.htm` files.
4. THE File_Importer SHALL accept only files with a `.html` or `.htm` extension; IF a file with any other extension is dropped or selected, THEN THE File_Importer SHALL display an inline error message stating "Only .html and .htm files are supported."
5. WHEN a valid HTML file is selected or dropped, THE File_Importer SHALL display the file name and file size (in kilobytes, rounded to one decimal place) as confirmation to the user.
6. WHEN a valid HTML file is selected or dropped, THE File_Importer SHALL enable the "Save as Note" button.
7. WHILE no file has been selected, THE File_Importer SHALL keep the "Save as Note" button disabled.

---

### Requirement 2: File Reading

**User Story:** As a user, I want the app to read the full content of the selected HTML file, so that the complete document is available for storage and rendering.

#### Acceptance Criteria

1. WHEN the user confirms a file selection, THE File_Importer SHALL read the file contents as a UTF-8 string using the browser `FileReader` API.
2. WHEN the `FileReader` read operation completes successfully, THE File_Importer SHALL store the raw HTML string in memory for subsequent processing and saving.
3. IF the `FileReader` read operation fails, THEN THE File_Importer SHALL display an inline error message containing the failure reason and SHALL NOT proceed to save.
4. THE File_Importer SHALL support HTML files up to 10 MB in size without error.
5. IF the selected file exceeds 10 MB, THEN THE File_Importer SHALL display an inline error message stating "File is too large. Maximum supported size is 10 MB." and SHALL NOT read the file.

---

### Requirement 3: HTML Processing Before Storage

**User Story:** As a user, I want the imported HTML to be sanitised before saving, so that scripts and event handlers cannot execute when the note is rendered.

#### Acceptance Criteria

1. WHEN the File_Importer reads an HTML file, THE HTML_Processor SHALL remove all `<script>` elements and their contents from the HTML string before storage.
2. WHEN the File_Importer reads an HTML file, THE HTML_Processor SHALL remove all inline event handler attributes (attributes whose names begin with `on`, such as `onclick`, `onload`, `onerror`) from the HTML string before storage.
3. THE HTML_Processor SHALL preserve all non-script HTML structure, text content, CSS `<style>` blocks, and `<link rel="stylesheet">` references.
4. THE HTML_Processor SHALL extract the document title from the `<title>` element, or from the first `<h1>`–`<h3>` element if no `<title>` is present, and use it as the note title (truncated to 80 characters). IF neither is found, THEN THE HTML_Processor SHALL use "HTML Note" as the note title.

---

### Requirement 4: Note Storage

**User Story:** As a user, I want the imported HTML to be stored in the note's data model without attribute-stuffing, so that large files are saved and retrieved correctly.

#### Acceptance Criteria

1. WHEN the user saves an imported HTML file, THE Note_Store SHALL create a new `Note` with `templateId === 'rich'`, `data.contentType === 'html'`, and `data.markdown` set to the processed HTML string.
2. THE Note_Store SHALL store the HTML string as a plain JavaScript string value in `data.markdown`, NOT as a `data-*` DOM attribute or encoded URI component embedded in HTML markup.
3. WHEN the note is saved, THE Note_Store SHALL set the note title to the value extracted by the HTML_Processor per Requirement 3, Criterion 4.
4. THE Note_Store SHALL persist notes containing HTML strings of up to 10 MB without data truncation or corruption.

---

### Requirement 5: Blob URL Rendering in the Note Card

**User Story:** As a user, I want large HTML notes to render correctly in the note card, so that I can view the full content without the iframe breaking on large files.

#### Acceptance Criteria

1. WHEN a Note_Card renders an HTML_Note and the note is expanded, THE Blob_Renderer SHALL create a `Blob` from `data.markdown` with MIME type `text/html` and generate a URL via `URL.createObjectURL`.
2. THE Blob_Renderer SHALL assign the generated Blob URL to the iframe's `src` attribute instead of writing content via `document.write`.
3. WHEN the Note_Card is destroyed or the note is collapsed, THE Blob_Renderer SHALL call `URL.revokeObjectURL` on any previously created Blob URL to release memory.
4. THE Blob_Renderer SHALL set the iframe `sandbox` attribute to `allow-same-origin` to permit CSS and font loading while blocking script execution.
5. IF `URL.createObjectURL` is unavailable in the current browser environment, THEN THE Blob_Renderer SHALL fall back to `document.write` and SHALL log a warning to the browser console.

---

### Requirement 6: Containment CSS Injection

**User Story:** As a user, I want all content in the imported HTML to be visible immediately when the note card is expanded, so that CSS-hidden panels and animation-frozen elements are not invisible.

#### Acceptance Criteria

1. WHEN the Blob_Renderer prepares HTML for rendering, THE HTML_Processor SHALL prepend a Containment_CSS `<style>` block to the HTML string before creating the Blob.
2. THE Containment_CSS SHALL set `animation: none !important`, `animation-duration: 0s !important`, and `transition: none !important` on all elements (`*`) to prevent animation-frozen initial states.
3. THE Containment_CSS SHALL set `opacity: 1 !important`, `visibility: visible !important`, and `transform: none !important` on all elements to override CSS-class-based hidden states.
4. THE Containment_CSS SHALL override `display: none` on elements hidden via CSS classes (not only inline styles) by targeting common hiding class patterns (e.g., `.hidden`, `.hide`, `.tab-pane:not(.active)`, `.fade:not(.show)`).
5. THE Containment_CSS SHALL constrain `html` and `body` with `overflow-x: hidden` and `box-sizing: border-box` to prevent horizontal overflow within the iframe.
6. THE Containment_CSS SHALL set `max-width: 100%` on `img`, `video`, `canvas`, and `table` elements to prevent content from overflowing the iframe width.
7. THE Containment_CSS SHALL set `pointer-events: none` on `input`, `textarea`, `select`, `button`, and `a` elements to make the note card a read-only viewer.

---

### Requirement 7: Iframe Sizing

**User Story:** As a user, I want the note card iframe to automatically resize to fit the full height of the rendered HTML content, so that I can scroll through the complete document without a fixed-height cutoff.

#### Acceptance Criteria

1. WHEN the Blob_Renderer has loaded the iframe content, THE Note_Card SHALL set the iframe height to the `scrollHeight` of the iframe's `body` element plus 20 pixels.
2. WHEN the iframe `src` is set via Blob URL, THE Note_Card SHALL listen for the iframe `load` event to trigger height measurement, rather than relying on `setTimeout` polling.
3. THE Note_Card SHALL re-measure and update the iframe height when the note card is expanded after having been collapsed.
4. IF the measured `scrollHeight` is less than or equal to 50 pixels, THE Note_Card SHALL defer height measurement and retry after 300 ms and again after 1000 ms.

---

### Requirement 8: Drag-and-Drop Interaction

**User Story:** As a user, I want to drag an HTML file from my file manager and drop it onto the import area, so that I can import files without using the file picker dialog.

#### Acceptance Criteria

1. WHEN the user drags a file over the Drag_Zone, THE File_Importer SHALL apply a visual highlight style to the Drag_Zone to indicate it is a valid drop target.
2. WHEN the user drags a file away from the Drag_Zone without dropping, THE File_Importer SHALL remove the visual highlight style from the Drag_Zone.
3. WHEN the user drops a file onto the Drag_Zone, THE File_Importer SHALL process the dropped file using the same validation and reading logic as Requirement 2 and Requirement 4.
4. THE File_Importer SHALL call `event.preventDefault()` on `dragover` and `drop` events to prevent the browser from navigating to the dropped file.

---

### Requirement 9: Modal State Reset

**User Story:** As a user, I want the import modal to reset its state when I close and reopen it, so that a previous import attempt does not carry over to a new session.

#### Acceptance Criteria

1. WHEN the modal is closed (via Cancel or after a successful save), THE File_Importer SHALL clear the selected file reference, the read HTML string, any displayed error messages, and the file name/size confirmation display.
2. WHEN the modal is reopened, THE File_Importer SHALL display the "Paste Text" tab as the default active tab.
3. WHEN the modal is reopened, THE File_Importer SHALL display the "Save as Note" button in its disabled state.
