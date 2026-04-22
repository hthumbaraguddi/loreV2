# Tasks — Smart Template Selection

## Task List

- [ ] 1. Create TemplateMatcherService
  - [ ] 1.1 Create `lore-app/src/app/services/template-matcher.service.ts` with `MatchResult` interface and keyword sets
  - [ ] 1.2 Implement `matchByKeywords(text)` — keyword scoring with threshold 3
  - [ ] 1.3 Implement `matchByAi(text)` — calls AnthropicService, falls back to keyword on error
  - [ ] 1.4 Implement `analyseContent(text)` — routes to AI or keyword based on settings
  - [ ] 1.5 Implement `isAiMatchingEnabled()` and `isAutoApplyEnabled()` settings helpers

- [ ] 2. Update PageEditorComponent TypeScript
  - [ ] 2.1 Add state fields: `showTemplatePicker`, `pendingTemplateId`, `pendingTemplateName`, `pendingTemplateIcon`, `showUndoToast`
  - [ ] 2.2 Inject `TemplateMatcherService`, `TemplateService`, `DataService`
  - [ ] 2.3 Update `loadFromNote()` to handle `_pendingTemplateId` and empty-block picker logic
  - [ ] 2.4 Add `onPickerSelectTemplate()`, `onPickerDismiss()`, `onBannerApply()`, `onBannerDismiss()`, `onUndoAutoApply()`
  - [ ] 2.5 Add `runBackgroundAnalysis()`, `extractPlainText()`, `applyPendingTemplate()`, `clearPendingTemplate()`
  - [ ] 2.6 Update `onSave()` to fire background analysis when wordCount ≥ 20 and templateId === 'page'
  - [ ] 2.7 Add `selectedTemplateId` and `formHtml` fields for inline template form rendering

- [ ] 3. Update page-editor.component.html
  - [ ] 3.1 Add Template Picker section (`*ngIf="showTemplatePicker"`) between title row and block editor
  - [ ] 3.2 Add Decoration Banner (`*ngIf="pendingTemplateId && !showTemplatePicker"`) above title
  - [ ] 3.3 Add undo toast (`*ngIf="showUndoToast"`) at bottom
  - [ ] 3.4 Conditionally show block editor only when no template is selected (or page template)

- [ ] 4. Update page-editor.component.scss
  - [ ] 4.1 Add `.pg-template-picker` grid layout and card styles
  - [ ] 4.2 Add `.pg-decoration-banner` styles
  - [ ] 4.3 Add `.pg-undo-toast` fixed bottom toast styles

- [ ] 5. Update SettingsPanelComponent
  - [ ] 5.1 Add `smartNotesAiMatching` and `smartNotesAutoApply` boolean fields
  - [ ] 5.2 Read from localStorage in `ngOnChanges`
  - [ ] 5.3 Add `onSmartNotesAiMatchingChange()` and `onSmartNotesAutoApplyChange()` methods

- [ ] 6. Update settings-panel.component.html
  - [ ] 6.1 Add "Smart Notes" section after AI Provider section with two checkboxes

- [ ] 7. Update settings-panel.component.scss
  - [ ] 7.1 Add `.sp-smart-notes` section styles and `.sp-hint` style

- [ ] 8. Build verification
  - [ ] 8.1 Run `ng build` to verify no TypeScript errors
