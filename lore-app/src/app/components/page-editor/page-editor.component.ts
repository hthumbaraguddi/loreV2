import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef, inject, AfterViewChecked, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Note, Section } from '../../models';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';
import { TemplateMatcherService } from '../../services/template-matcher.service';
import { TemplateService, TemplateDefinition } from '../../services/template.service';
import { DataService } from '../../services/data.service';
import { PasteAiResponseModalComponent } from '../modals/paste-ai-response-modal/paste-ai-response-modal.component';

export interface PageBlock {
  type: 'text' | 'heading' | 'heading2' | 'callout' | 'todo' | 'quote' | 'divider';
  content: string;
  checked?: boolean;
}

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent, PasteAiResponseModalComponent],
  templateUrl: './page-editor.component.html',
  styleUrls: ['./page-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageEditorComponent implements OnChanges, AfterViewChecked {
  @Input() note!: Note;
  @Input() section!: Section;
  @Input() notebookId!: string;

  @Output() saved = new EventEmitter<{ title: string; templateId: string; data: Record<string, any> }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private cdr = inject(ChangeDetectorRef);
  private el = inject(ElementRef);
  private sanitizer = inject(DomSanitizer);
  private templateMatcher = inject(TemplateMatcherService);
  private templateService = inject(TemplateService);
  private dataService = inject(DataService);

  icon = '📄';
  title = '';
  blocks: PageBlock[] = [];
  tags: string[] = [];
  tagInput = '';
  isDirty = false;
  private needsResize = false;

  // ── Template Picker ───────────────────────────────────────────────────────
  showTemplatePicker = false;
  allTemplates: TemplateDefinition[] = [];

  // ── Decoration Banner ─────────────────────────────────────────────────────
  pendingTemplateId: string | null = null;
  pendingTemplateName = '';
  pendingTemplateIcon = '';

  // ── Inline template form (when a non-page template is selected) ───────────
  selectedTemplateId: string | null = null;
  formHtml: SafeHtml = '';

  // ── Auto-apply undo toast ─────────────────────────────────────────────────
  showUndoToast = false;
  private undoToastTimer: any = null;

  // ── Paste AI Response modal (rich template) ───────────────────────────────
  pasteModalOpen = false;

  get pasteTarget(): { notebookId: string; sectionId: string } | null {
    return this.notebookId && this.section?.id
      ? { notebookId: this.notebookId, sectionId: this.section.id }
      : null;
  }

  openPasteModal(): void {
    this.pasteModalOpen = true;
    this.cdr.markForCheck();
  }

  onPasteModalClosed(): void {
    this.pasteModalOpen = false;
    this.cdr.markForCheck();
  }

  onPasteNoteSaved(): void {
    this.pasteModalOpen = false;
    this.cdr.markForCheck();
  }

  readonly blockTypes: { type: PageBlock['type']; label: string; icon: string }[] = [
    { type: 'text',     label: 'Text',    icon: '¶' },
    { type: 'heading',  label: 'H1',      icon: 'H1' },
    { type: 'heading2', label: 'H2',      icon: 'H2' },
    { type: 'callout',  label: 'Callout', icon: '💡' },
    { type: 'todo',     label: 'To-do',   icon: '☐' },
    { type: 'quote',    label: 'Quote',   icon: '"' },
    { type: 'divider',  label: 'Divider', icon: '—' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] && this.note) {
      this.loadFromNote();
      this.needsResize = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsResize) {
      this.needsResize = false;
      this.resizeAllTextareas();
    }
  }

  /** Auto-resize all textareas to fit their content. */
  resizeAllTextareas(): void {
    const tas = this.el.nativeElement.querySelectorAll('textarea') as NodeListOf<HTMLTextAreaElement>;
    tas.forEach((ta: HTMLTextAreaElement) => this.autoResize(ta));
  }

  autoResize(ta: HTMLTextAreaElement): void {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  onTextareaInput(event: Event, index: number): void {
    const ta = event.target as HTMLTextAreaElement;
    this.autoResize(ta);
    this.onBlockInput(index, ta.value);
  }

  onTitleInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    this.autoResize(ta);
    this.isDirty = true;
    // Hide picker once user starts typing in title
    if (this.showTemplatePicker && ta.value.trim()) {
      this.showTemplatePicker = false;
      this.cdr.markForCheck();
    }
  }

  private loadFromNote(): void {
    const d = this.note.data || {};
    this.icon = d['icon'] || '📄';
    this.title = this.note.title || '';
    this.blocks = (d['blocks'] || []).map((b: any) => ({ ...b }));
    if (!this.blocks.length) {
      this.blocks = [{ type: 'text', content: '' }];
    }
    this.tags = [...(d['tags'] || [])];
    this.isDirty = false;
    this.selectedTemplateId = null;
    this.formHtml = '';
    this.showUndoToast = false;
    if (this.undoToastTimer) { clearTimeout(this.undoToastTimer); this.undoToastTimer = null; }

    // Load all templates for the picker
    this.allTemplates = this.templateService.getTemplates();

    // ── Decoration Banner ──────────────────────────────────────────────────
    this.pendingTemplateId = d['_pendingTemplateId'] ?? null;
    if (this.pendingTemplateId) {
      const tpl = this.templateService.getTemplate(this.pendingTemplateId);
      this.pendingTemplateName = tpl?.name ?? this.pendingTemplateId;
      this.pendingTemplateIcon = tpl?.icon ?? '📄';
      if (this.templateMatcher.isAutoApplyEnabled()) {
        this.applyPendingTemplate(/* showToast */ true);
        return; // applyPendingTemplate handles the rest
      }
    }

    // ── Template Picker: show only for new empty notes ─────────────────────
    const hasContent = this.blocks.some(b => b.content.trim() !== '' || b.type === 'divider');
    this.showTemplatePicker = !hasContent && !this.pendingTemplateId;
  }

  // ── Template Picker ───────────────────────────────────────────────────────

  onPickerSelectTemplate(templateId: string): void {
    this.showTemplatePicker = false;
    if (templateId === 'page') {
      // Stay in block editor mode
      this.selectedTemplateId = null;
      this.formHtml = '';
      this.cdr.markForCheck();
      return;
    }
    // Switch to inline template form
    this.selectedTemplateId = templateId;
    const tpl = this.templateService.getTemplate(templateId);
    if (tpl) {
      const html = tpl.buildForm({ title: this.title });
      this.formHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    }
    this.isDirty = true;
    this.cdr.markForCheck();
  }

  onPickerDismiss(): void {
    this.showTemplatePicker = false;
    this.cdr.markForCheck();
  }

  // ── Decoration Banner ─────────────────────────────────────────────────────

  onBannerApply(): void {
    this.applyPendingTemplate(false);
  }

  onBannerDismiss(): void {
    this.clearPendingTemplate();
  }

  // ── Auto-apply undo ───────────────────────────────────────────────────────

  onUndoAutoApply(): void {
    // Revert to blank page state
    this.selectedTemplateId = null;
    this.formHtml = '';
    this.showUndoToast = false;
    if (this.undoToastTimer) { clearTimeout(this.undoToastTimer); this.undoToastTimer = null; }

    // Clear _pendingTemplateId and save
    const currentData = this.note.data || {};
    const newData = { ...currentData };
    delete newData['_pendingTemplateId'];
    this.dataService.updateNote(
      this.notebookId,
      this.section.id,
      this.note.id,
      this.note.title,
      'page',
      newData,
    );
    this.pendingTemplateId = null;
    this.pendingTemplateName = '';
    this.pendingTemplateIcon = '';
    this.cdr.markForCheck();
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  private applyPendingTemplate(showToast: boolean): void {
    if (!this.pendingTemplateId) return;
    const tpl = this.templateService.getTemplate(this.pendingTemplateId);
    if (!tpl) {
      // Template no longer exists — just clear
      this.clearPendingTemplate();
      return;
    }

    this.selectedTemplateId = this.pendingTemplateId;
    const html = tpl.buildForm({ title: this.title, ...this.note.data });
    this.formHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    this.showTemplatePicker = false;

    // Clear _pendingTemplateId from note data and persist
    const currentData = this.note.data || {};
    const newData = { ...currentData };
    delete newData['_pendingTemplateId'];
    this.dataService.updateNote(
      this.notebookId,
      this.section.id,
      this.note.id,
      this.note.title,
      this.pendingTemplateId,
      newData,
    );

    if (showToast) {
      this.showUndoToast = true;
      if (this.undoToastTimer) clearTimeout(this.undoToastTimer);
      this.undoToastTimer = setTimeout(() => {
        this.showUndoToast = false;
        this.cdr.markForCheck();
      }, 6000);
    }

    this.pendingTemplateId = null;
    this.isDirty = false;
    this.cdr.markForCheck();
  }

  private clearPendingTemplate(): void {
    const currentData = this.note.data || {};
    const newData = { ...currentData };
    delete newData['_pendingTemplateId'];
    this.dataService.updateNote(
      this.notebookId,
      this.section.id,
      this.note.id,
      this.note.title,
      'page',
      newData,
    );
    this.pendingTemplateId = null;
    this.pendingTemplateName = '';
    this.pendingTemplateIcon = '';
    this.cdr.markForCheck();
  }

  /** Maps built-in template ids to lore-icon names. Returns null for custom templates (use emoji). */
  getTemplateIconName(templateId: string): string | null {
    const map: Record<string, string> = {
      page:      'note-plus',
      rich:      'section',
      research:  'search',
      finance:   'layers',
      watchlist: 'list-view',
      journal:   'pulse',
      scrum:     'grid-view',
      investing: 'ai-sparkle',
    };
    return map[templateId] ?? null;
  }

  extractPlainText(): string {
    return this.blocks
      .filter(b => b.type !== 'divider')
      .map(b => b.content)
      .join(' ')
      .trim();
  }

  private runBackgroundAnalysis(noteId: string, text: string): void {
    (async () => {
      try {
        const result = await this.templateMatcher.analyseContent(text);
        if (result) {
          const currentNote = this.note;
          if (!currentNote) return;
          const currentData = currentNote.data || {};
          const newData = { ...currentData, _pendingTemplateId: result.templateId };
          this.dataService.updateNote(
            this.notebookId,
            this.section.id,
            noteId,
            currentNote.title,
            'page',
            newData,
          );
        }
      } catch (err) {
        console.warn('[PageEditor] Background analysis failed:', err);
      }
    })();
  }

  // ── Block operations ──────────────────────────────────────────────────────

  addBlock(type: PageBlock['type'], afterIndex?: number): void {
    const block: PageBlock = { type, content: '', checked: type === 'todo' ? false : undefined };
    const idx = afterIndex !== undefined ? afterIndex + 1 : this.blocks.length;
    this.blocks.splice(idx, 0, block);
    // Hide picker when user starts adding blocks
    if (this.showTemplatePicker) {
      this.showTemplatePicker = false;
    }
    this.markDirty();
    setTimeout(() => {
      this.resizeAllTextareas();
      this.focusBlock(idx);
    }, 30);
  }

  removeBlock(index: number): void {
    if (this.blocks.length <= 1) {
      this.blocks[0] = { type: 'text', content: '' };
    } else {
      this.blocks.splice(index, 1);
      setTimeout(() => {
        this.resizeAllTextareas();
        this.focusBlock(Math.max(0, index - 1));
      }, 30);
    }
    this.markDirty();
  }

  changeBlockType(index: number, type: PageBlock['type']): void {
    const content = this.blocks[index].content;
    this.blocks[index] = { type, content, checked: type === 'todo' ? false : undefined };
    this.markDirty();
    setTimeout(() => {
      this.resizeAllTextareas();
      this.focusBlock(index);
    }, 30);
  }

  onBlockKeydown(event: KeyboardEvent, index: number): void {
    const block = this.blocks[index];
    const ta = event.target as HTMLTextAreaElement;

    if (event.key === 'Enter' && event.shiftKey) {
      // Shift+Enter: insert a real newline within the block
      event.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = block.content;
      block.content = val.slice(0, start) + '\n' + val.slice(end);
      this.markDirty();
      setTimeout(() => {
        ta.setSelectionRange(start + 1, start + 1);
        this.autoResize(ta);
      }, 0);
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addBlock('text', index);
      return;
    }

    if (event.key === 'Backspace' && block.content === '' && this.blocks.length > 1) {
      event.preventDefault();
      this.removeBlock(index);
      return;
    }

    if (event.key === 'ArrowUp' && index > 0) {
      if (ta.selectionStart === 0) {
        event.preventDefault();
        this.focusBlock(index - 1, 'end');
      }
    }

    if (event.key === 'ArrowDown' && index < this.blocks.length - 1) {
      if (ta.selectionStart === ta.value.length) {
        event.preventDefault();
        this.focusBlock(index + 1, 'start');
      }
    }
  }

  onBlockInput(index: number, value: string): void {
    // Hide picker when user starts typing in a block
    if (this.showTemplatePicker && value.trim()) {
      this.showTemplatePicker = false;
    }

    // Slash command detection
    if (value === '/') {
      this.showSlashMenu(index);
      return;
    }
    // Markdown shortcuts
    if (value === '# ') { this.changeBlockType(index, 'heading'); this.blocks[index].content = ''; return; }
    if (value === '## ') { this.changeBlockType(index, 'heading2'); this.blocks[index].content = ''; return; }
    if (value === '> ') { this.changeBlockType(index, 'quote'); this.blocks[index].content = ''; return; }
    if (value === '---') { this.changeBlockType(index, 'divider'); this.blocks[index].content = ''; return; }
    if (value === '[] ' || value === '[ ] ') { this.changeBlockType(index, 'todo'); this.blocks[index].content = ''; return; }

    this.blocks[index].content = value;
    this.markDirty();
  }

  slashMenuIndex: number | null = null;

  showSlashMenu(index: number): void {
    this.slashMenuIndex = index;
    this.cdr.markForCheck();
  }

  hideSlashMenu(): void {
    this.slashMenuIndex = null;
    this.cdr.markForCheck();
  }

  selectSlashType(type: PageBlock['type'], index: number): void {
    this.blocks[index].content = '';
    this.changeBlockType(index, type);
    this.hideSlashMenu();
  }

  private focusBlock(index: number, position: 'start' | 'end' = 'end'): void {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('.pg-editor-block-ta');
    const ta = textareas[index];
    if (!ta) return;
    ta.focus();
    const pos = position === 'end' ? ta.value.length : 0;
    ta.setSelectionRange(pos, pos);
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  onTagKeydown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ',') && this.tagInput.trim()) {
      event.preventDefault();
      const tag = this.tagInput.trim().replace(/,$/, '');
      if (tag && !this.tags.includes(tag)) {
        this.tags.push(tag);
        this.markDirty();
      }
      this.tagInput = '';
    }
    if (event.key === 'Backspace' && !this.tagInput && this.tags.length) {
      this.tags.pop();
      this.markDirty();
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
    this.markDirty();
  }

  // ── Save / Delete / Close ─────────────────────────────────────────────────

  onSave(): void {
    // If a non-page template is selected, read from the template form
    if (this.selectedTemplateId && this.selectedTemplateId !== 'page') {
      const tpl = this.templateService.getTemplate(this.selectedTemplateId);
      if (tpl) {
        const data = tpl.readForm();
        const titleEl = document.getElementById('f_title') as HTMLInputElement | null;
        const title = (titleEl?.value?.trim()) || this.title.trim() || 'Untitled';
        this.saved.emit({ title, templateId: this.selectedTemplateId, data });
        this.isDirty = false;
        return;
      }
    }

    const filteredBlocks = this.blocks.filter(
      b => b.type === 'divider' || b.content.trim() !== '' || b.type === 'todo'
    );

    this.saved.emit({
      title: this.title.trim() || 'Untitled',
      templateId: 'page',
      data: {
        icon: this.icon,
        blocks: filteredBlocks,
        tags: this.tags,
      },
    });
    this.isDirty = false;

    // Post-save background analysis hook (fire-and-forget)
    const plainText = this.extractPlainText();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 20 && !this.pendingTemplateId) {
      this.runBackgroundAnalysis(this.note.id, plainText);
    }
  }

  onDelete(): void {
    this.deleted.emit();
  }

  onClose(): void {
    this.closed.emit();
  }

  private markDirty(): void {
    this.isDirty = true;
    this.cdr.markForCheck();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
