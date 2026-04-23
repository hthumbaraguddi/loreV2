# Implementation Plan: HTML File Import

## Overview

Extend the existing `PasteAiResponseModalComponent` with a two-tab layout supporting direct HTML file import via file picker and drag-and-drop. Introduce a new `HtmlProcessorService` for sanitisation, title extraction, and containment CSS injection. Update `NoteCardComponent` to render HTML notes via Blob URLs instead of `document.write`.

## Tasks

- [x] 1. Create `HtmlProcessorService` with sanitisation and title extraction
  - Create `lore-app/src/app/services/html-processor.service.ts`
  - Implement `sanitise(html: string): string` — strips all `<script>` elements and inline `on*` event handler attributes
  - Implement `extractTitle(html: string): string` — reads `<title>`, falls back to first `<h1>`–`<h3>`, falls back to `"HTML Note"`, truncates to 80 characters
  - Implement `prependContainmentCss(html: string): string` — prepends the full containment `<style id="lore-containment">` block (animations, visibility, overflow, pointer-events rules)
  - Implement `prepareForRendering(html: string): string` — calls `sanitise` then `prependContainmentCss`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 1.1 Write property test for `sanitise` — scripts and event handlers removed (Property 3)
    - **Property 3: HTML Sanitisation Removes Scripts and Event Handlers**
    - Use `fast-check` to generate arbitrary HTML strings with injected `<script>` tags and `on*` attributes
    - Assert output contains no `<script>` tags and no `on\w+=` attribute patterns
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 1.2 Write property test for `sanitise` — non-script content preserved (Property 4)
    - **Property 4: HTML Sanitisation Preserves Non-Script Content**
    - Use `fast-check` to generate HTML strings that contain no `<script>` or `on*` attributes
    - Assert `sanitise(html)` is structurally equivalent to the input
    - **Validates: Requirements 3.3**

  - [ ]* 1.3 Write property test for `extractTitle` — priority order and truncation (Property 5)
    - **Property 5: Title Extraction Follows Priority Order and Truncates**
    - Use `fast-check` with `fc.record({ title: fc.option(fc.string()), h1: fc.option(fc.string()) })`
    - Assert correct priority (`<title>` → `<h1>`–`<h3>` → `"HTML Note"`) and `result.length <= 80`
    - **Validates: Requirements 3.4**

  - [ ]* 1.4 Write property test for `prependContainmentCss` — CSS always prepended (Property 7)
    - **Property 7: Containment CSS Is Always Prepended**
    - Use `fast-check` to generate arbitrary HTML strings
    - Assert output contains the containment `<style>` block before the original content
    - **Validates: Requirements 6.1**

  - [ ]* 1.5 Write unit tests for `HtmlProcessorService`
    - Test `sanitise` with specific cases: nested scripts, self-closing tags, multiple `on*` attrs, no scripts
    - Test `extractTitle` with `<title>`, only `<h1>`, only `<h2>`, neither, title > 80 chars
    - Test `prependContainmentCss` verifies output starts with the containment style block
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1_

- [x] 2. Add file validation logic to the modal
  - In `PasteAiResponseModalComponent`, add the `validateFile(file: File): string | null` private method
  - Validate extension: accept `.html` and `.htm` only (case-insensitive); return `"Only .html and .htm files are supported."` on failure
  - Validate size: reject files exceeding 10 × 1024 × 1024 bytes; return `"File is too large. Maximum supported size is 10 MB."` on failure
  - _Requirements: 1.4, 2.4, 2.5_

  - [ ]* 2.1 Write property test for `validateFile` — extension rejection (Property 1)
    - **Property 1: File Extension Validation Rejects Non-HTML Files**
    - Use `fast-check` with `fc.string()` filtered to names not ending in `.html`/`.htm`
    - Assert `validateFile` returns a non-null error string
    - **Validates: Requirements 1.4**

  - [ ]* 2.2 Write property test for `validateFile` — size limit (Property 2)
    - **Property 2: File Size Limit Rejects Oversized Files**
    - Use `fast-check` with `fc.integer({ min: 10*1024*1024 + 1, max: 50*1024*1024 })` as mock file size
    - Assert `validateFile` returns the size error string and `FileReader.readAsText` is not called
    - **Validates: Requirements 2.5**

  - [ ]* 2.3 Write unit tests for `validateFile`
    - Test `.html` accepted, `.htm` accepted, `.HTML` accepted (case-insensitive), `.txt` rejected, `.pdf` rejected
    - Test file at exactly 10 MB accepted, file at 10 MB + 1 byte rejected
    - _Requirements: 1.4, 2.4, 2.5_

- [x] 3. Implement the Import File tab UI in `PasteAiResponseModalComponent`
  - Add state fields: `activeTab: 'paste' | 'import' = 'paste'`, `selectedFile`, `fileHtml`, `fileError`, `isDragOver`
  - Add `selectTab(tab)`, `onFileSelected(event)`, `onDrop(event)`, `onDragOver(event)`, `onDragLeave(event)`, `processFile(file)`, `readFile(file)` methods
  - Update the modal template (`paste-ai-response-modal.component.html`) to render two tabs: "Paste Text" (existing) and "Import File" (new)
  - Render the Drag_Zone with drag-and-drop event bindings and a "Browse…" `<input type="file" accept=".html,.htm">` button
  - Display file name and size (KB, 1 decimal place) on successful selection; display `.file-error` element on validation or read errors
  - Disable "Save as Note" button when no file is selected; enable it when `fileHtml` is set
  - Call `event.preventDefault()` on `dragover` and `drop` events
  - Apply visual highlight class to Drag_Zone on `dragover`; remove it on `dragleave` and `drop`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 3.1 Write property test for drop/browse equivalence (Property 9)
    - **Property 9: Drop and Browse Produce Identical State**
    - Use `fast-check` with `fc.record({ name, content, size })` for valid files
    - Assert component state after drop equals state after browse (same `fileHtml`, `selectedFile.name`, `selectedFile.size`, no `fileError`)
    - **Validates: Requirements 8.3**

  - [ ]* 3.2 Write unit tests for Import File tab interactions
    - Test tab switching sets `activeTab` correctly
    - Test `dragover` applies highlight class; `dragleave` removes it
    - Test `event.preventDefault()` called on `dragover` and `drop`
    - Test FileReader `onerror` path sets `fileError` and keeps save button disabled
    - Test save button disabled when no file selected, enabled when `fileHtml` is set
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 8.1, 8.2, 8.4_

- [x] 4. Extend `save()` to handle the import tab and implement modal reset
  - In `PasteAiResponseModalComponent.save()`, branch on `activeTab`:
    - `'paste'` tab: existing behaviour unchanged
    - `'import'` tab: call `HtmlProcessorService.sanitise`, then `extractTitle` for the note title, then `data.addNote(...)` with `{ markdown: fileHtml, contentType: 'html' }` and the extracted title; wrap in try/catch and show toast via `data.showToast()` on error
  - Implement modal reset: on `cancel()` and after successful save, clear `selectedFile`, `fileHtml`, `fileError`, `isDragOver`, reset `activeTab` to `'paste'`, reset `content` to `''`
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3_

  - [ ]* 4.1 Write property test for title round-trip (Property 6)
    - **Property 6: Saved Note Title Matches Extracted Title**
    - Use `fast-check` with `fc.string()` as HTML input
    - Assert `note.title === extractTitle(html)` after the full import flow
    - **Validates: Requirements 4.3**

  - [ ]* 4.2 Write property test for modal reset (Property 10)
    - **Property 10: Modal Close Resets All State**
    - Use `fast-check` with `fc.record({ activeTab, selectedFile, fileHtml, fileError, isDragOver })`
    - Assert after `cancel()` or successful `save()`, all fields equal initial values
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 4.3 Write unit tests for save and reset
    - Test `save()` on import tab creates note with correct `templateId`, `contentType`, `markdown`, and `title`
    - Test `save()` on import tab calls `data.showToast()` when `addNote` throws
    - Test `cancel()` resets all state fields to initial values
    - Test modal reopened shows "Paste Text" tab and disabled save button
    - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update `NoteCardComponent` to render HTML notes via Blob URLs
  - Inject `HtmlProcessorService` into `NoteCardComponent`
  - Add `private blobUrl: string | null = null` field
  - Implement `injectBlobIframe(placeholder: Element, html: string): void`:
    - Call `htmlProcessor.prepareForRendering(html)` to get sanitised + CSS-injected HTML
    - Create a `Blob` with MIME type `text/html` and call `URL.createObjectURL`
    - Store the URL in `this.blobUrl`
    - Create an `<iframe>` with `sandbox="allow-same-origin"`, assign the Blob URL to `iframe.src`
    - Replace the placeholder element with the iframe
    - If `URL.createObjectURL` is unavailable, fall back to `document.write` and log `console.warn('Blob URL unavailable, falling back to document.write')`
  - Update `ngOnDestroy()` to call `URL.revokeObjectURL(this.blobUrl)` if set
  - Call `URL.revokeObjectURL` and clear `this.blobUrl` when the note is collapsed
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.1 Write unit tests for Blob URL rendering
    - Test `URL.revokeObjectURL` called on `ngOnDestroy`
    - Test `URL.revokeObjectURL` called when note is collapsed
    - Test fallback to `document.write` when `createObjectURL` is undefined, with `console.warn` logged
    - Test `sandbox` attribute set to `allow-same-origin` on created iframe
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement iframe sizing via `load` event
  - Update `sizeIframe` in `NoteCardComponent` to listen for the iframe `load` event as the primary trigger
  - On `load`, read `iframe.contentDocument.body.scrollHeight`; set `iframe.style.height` to `(scrollHeight + 20) + 'px'`
  - If `scrollHeight <= 50` after the `load` event, schedule retries at 300 ms and 1000 ms; if still ≤ 50 after retries, leave at default height
  - Wrap `contentDocument` access in a try/catch; on exception log a warning and leave iframe at default height
  - Re-measure and update height when the note card is expanded after having been collapsed
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.1 Write property test for iframe height formula (Property 8)
    - **Property 8: Iframe Height Formula**
    - Use `fast-check` with `fc.integer({ min: 51, max: 100000 })` as `scrollHeight`
    - Assert `iframe.style.height === (scrollHeight + 20) + 'px'`
    - **Validates: Requirements 7.1**

  - [ ]* 7.2 Write unit tests for iframe sizing
    - Test `load` event triggers height measurement
    - Test `scrollHeight <= 50` triggers retries at 300 ms and 1000 ms
    - Test `contentDocument` access exception is caught and warning is logged
    - Test height is re-measured on expand after collapse
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Add styles for the Import File tab and Drag Zone
  - Update `paste-ai-response-modal.component.scss` with styles for:
    - Tab bar (`.tab-bar`, `.tab-btn`, `.tab-btn.active`)
    - Drag Zone (`.drag-zone`, `.drag-zone.drag-over` highlight state)
    - File confirmation display (`.file-info` showing name and size)
    - Inline error message (`.file-error`)
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `HtmlProcessorService` is a pure-function service — test it in isolation before wiring it into components
- Property tests use `fast-check`; run with `ng test` (Karma/Jasmine) or Jest depending on project setup
- The `data.markdown` / `data.contentType` contract in `DataService` and `richTemplate` is unchanged — no model migrations needed
- Containment CSS is injected at render time (in `NoteCardComponent`), not at storage time, so stored HTML remains clean
