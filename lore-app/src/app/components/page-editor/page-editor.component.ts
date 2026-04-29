import {
  Component, Input, Output, EventEmitter, OnChanges, OnDestroy, AfterViewInit,
  SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject, ElementRef,
  ViewChild, NgZone,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
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
export class PageEditorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() note!: Note;
  @Input() section!: Section;
  @Input() notebookId!: string;

  @Output() saved = new EventEmitter<{ title: string; templateId: string; data: Record<string, any> }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  /** Emits the current title ~300ms after the user stops typing, for live notebook rename. */
  @Output() titleChanged = new EventEmitter<string>();

  @ViewChild('editorCanvas') canvasRef!: ElementRef<HTMLDivElement>;

  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private templateMatcher = inject(TemplateMatcherService);
  private templateService = inject(TemplateService);
  private dataService = inject(DataService);
  private zone = inject(NgZone);

  icon = '📄';
  title = '';
  tags: string[] = [];
  tagInput = '';
  isDirty = false;

  private titleSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

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

  // ── Slash menu ────────────────────────────────────────────────────────────
  slashMenuVisible = false;
  slashMenuTop = 0;
  slashMenuLeft = 0;

  readonly blockTypes: { type: PageBlock['type']; label: string; icon: string }[] = [
    { type: 'text',     label: 'Text',    icon: '¶' },
    { type: 'heading',  label: 'H1',      icon: 'H1' },
    { type: 'heading2', label: 'H2',      icon: 'H2' },
    { type: 'callout',  label: 'Callout', icon: '💡' },
    { type: 'todo',     label: 'To-do',   icon: '☐' },
    { type: 'quote',    label: 'Quote',   icon: '"' },
    { type: 'divider',  label: 'Divider', icon: '—' },
  ];

  // ── Pending blocks to render after view init ──────────────────────────────
  private pendingBlocks: PageBlock[] | null = null;
  private viewInitialized = false;

  get pasteTarget(): { notebookId: string; sectionId: string } | null {
    return this.notebookId && this.section?.id
      ? { notebookId: this.notebookId, sectionId: this.section.id }
      : null;
  }

  openPasteModal(): void { this.pasteModalOpen = true; this.cdr.markForCheck(); }
  onPasteModalClosed(): void { this.pasteModalOpen = false; this.cdr.markForCheck(); }
  onPasteNoteSaved(): void { this.pasteModalOpen = false; this.cdr.markForCheck(); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] && this.note) {
      if (changes['note'].firstChange) {
        this.titleSubject.pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
        ).subscribe(t => this.titleChanged.emit(t));
      }
      this.loadFromNote();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    // Set default paragraph separator so Enter creates <p> not <div>
    document.execCommand('defaultParagraphSeparator', false, 'p');
    if (this.pendingBlocks !== null) {
      this.renderBlocks(this.pendingBlocks);
      this.pendingBlocks = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.undoToastTimer) clearTimeout(this.undoToastTimer);
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  private loadFromNote(): void {
    const d = this.note.data || {};
    this.icon = d['icon'] || '📄';
    this.title = this.note.title || '';
    const blocks: PageBlock[] = (d['blocks'] || []).map((b: any) => ({ ...b }));
    if (!blocks.length) blocks.push({ type: 'text', content: '' });
    this.tags = [...(d['tags'] || [])];
    this.isDirty = false;
    this.selectedTemplateId = null;
    this.formHtml = '';
    this.showUndoToast = false;
    if (this.undoToastTimer) { clearTimeout(this.undoToastTimer); this.undoToastTimer = null; }
    this.allTemplates = this.templateService.getTemplates();

    // Decoration Banner
    this.pendingTemplateId = d['_pendingTemplateId'] ?? null;
    if (this.pendingTemplateId) {
      const tpl = this.templateService.getTemplate(this.pendingTemplateId);
      this.pendingTemplateName = tpl?.name ?? this.pendingTemplateId;
      this.pendingTemplateIcon = tpl?.icon ?? '📄';
      if (this.templateMatcher.isAutoApplyEnabled()) {
        this.applyPendingTemplate(true);
        return;
      }
    }

    // Template Picker: show only for new empty notes
    const hasContent = blocks.some(b => b.content.trim() !== '' || b.type === 'divider');
    this.showTemplatePicker = !hasContent && !this.pendingTemplateId;

    // Render canvas
    if (this.viewInitialized && this.canvasRef) {
      this.renderBlocks(blocks);
    } else {
      this.pendingBlocks = blocks;
    }
  }

  private renderBlocks(blocks: PageBlock[]): void {
    if (!this.canvasRef) return;
    this.canvasRef.nativeElement.innerHTML = this.blocksToHtml(blocks);
  }

  // ── Serialization ─────────────────────────────────────────────────────────

  /**
   * Convert PageBlock[] to HTML string for setting as canvas innerHTML.
   * Pure function — no side effects.
   */
  blocksToHtml(blocks: PageBlock[]): string {
    if (!blocks.length) return '<p><br></p>';
    return blocks.map(b => {
      const c = b.content ? this.escapeHtml(b.content) : '<br>';
      switch (b.type) {
        case 'text':     return `<p>${c}</p>`;
        case 'heading':  return `<h1>${c}</h1>`;
        case 'heading2': return `<h2>${c}</h2>`;
        case 'callout':  return `<div data-type="callout"><p>${c}</p></div>`;
        case 'todo':     return `<p data-type="todo" data-checked="${!!b.checked}">${c}</p>`;
        case 'quote':    return `<blockquote><p>${c}</p></blockquote>`;
        case 'divider':  return `<hr>`;
        default:         return `<p>${c}</p>`;
      }
    }).join('');
  }

  /**
   * Convert canvas innerHTML back to PageBlock[].
   * Walks live child nodes of the canvas element.
   * Pure function — reads only the passed element's children.
   */
  htmlToBlocks(canvas: HTMLElement): PageBlock[] {
    const blocks: PageBlock[] = [];
    const children = Array.from(canvas.childNodes);

    for (const node of children) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const dataType = el.getAttribute('data-type');

      if (tag === 'hr') {
        blocks.push({ type: 'divider', content: '' });
        continue;
      }

      if (tag === 'h1') {
        blocks.push({ type: 'heading', content: this.getTextContent(el) });
        continue;
      }

      if (tag === 'h2') {
        blocks.push({ type: 'heading2', content: this.getTextContent(el) });
        continue;
      }

      if (tag === 'blockquote') {
        const inner = el.querySelector('p') ?? el;
        blocks.push({ type: 'quote', content: this.getTextContent(inner) });
        continue;
      }

      if (tag === 'div' && dataType === 'callout') {
        const inner = el.querySelector('p') ?? el;
        blocks.push({ type: 'callout', content: this.getTextContent(inner) });
        continue;
      }

      if (tag === 'p' && dataType === 'todo') {
        blocks.push({
          type: 'todo',
          content: this.getTextContent(el),
          checked: el.getAttribute('data-checked') === 'true',
        });
        continue;
      }

      // Default: treat as text block (covers <p>, unknown <div>, etc.)
      blocks.push({ type: 'text', content: this.getTextContent(el) });
    }

    return blocks.length ? blocks : [{ type: 'text', content: '' }];
  }

  private getTextContent(el: HTMLElement): string {
    // Use innerText to get rendered text (respects <br> as newline)
    // Then trim and normalize
    return (el.innerText ?? el.textContent ?? '').replace(/\n$/, '').trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Canvas event handlers ─────────────────────────────────────────────────

  onCanvasInput(_event: Event): void {
    this.isDirty = true;

    // Check for markdown shortcuts on the current block
    const block = this.getBlockAtCursor();
    if (block) {
      this.applyMarkdownShortcut(block);
    }

    // Hide template picker once user starts typing
    if (this.showTemplatePicker) {
      this.showTemplatePicker = false;
      this.cdr.markForCheck();
    }

    this.cdr.markForCheck();
  }

  onCanvasKeydown(event: KeyboardEvent): void {
    // Slash on empty line → show slash menu
    if (event.key === '/' && this.isCurrentBlockEmpty()) {
      // Let the '/' character be inserted first, then show menu
      setTimeout(() => {
        const block = this.getBlockAtCursor();
        if (block && (block.textContent?.trim() === '/')) {
          this.showSlashMenuAtCursor();
          this.cdr.markForCheck();
        }
      }, 0);
      return;
    }

    // Escape → hide slash menu
    if (event.key === 'Escape') {
      if (this.slashMenuVisible) {
        this.hideSlashMenu();
        event.preventDefault();
      }
      return;
    }

    // Tab → insert 2 spaces
    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertText', false, '  ');
      return;
    }

    // Enter in a heading → create a plain text paragraph after
    if (event.key === 'Enter' && !event.shiftKey) {
      const block = this.getBlockAtCursor();
      if (block) {
        const tag = block.tagName?.toLowerCase();
        if (tag === 'h1' || tag === 'h2') {
          event.preventDefault();
          this.insertParagraphAfter(block);
          return;
        }
      }
    }
  }

  onCanvasClick(event: MouseEvent): void {
    // Handle todo checkbox click (the ::before pseudo-element area)
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-type') === 'todo') {
      const rect = target.getBoundingClientRect();
      // Click in the left ~24px = checkbox area
      if (event.clientX - rect.left < 24) {
        const current = target.getAttribute('data-checked') === 'true';
        target.setAttribute('data-checked', String(!current));
        this.isDirty = true;
        this.cdr.markForCheck();
        event.preventDefault();
      }
    }
    // Hide slash menu on click elsewhere
    if (this.slashMenuVisible) {
      this.hideSlashMenu();
    }
  }

  onTitleInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    this.autoResizeTextarea(ta);
    this.isDirty = true;
    this.titleSubject.next(ta.value);
    if (this.showTemplatePicker && ta.value.trim()) {
      this.showTemplatePicker = false;
      this.cdr.markForCheck();
    }
  }

  // ── Slash menu ────────────────────────────────────────────────────────────

  showSlashMenuAtCursor(): void {
    const block = this.getBlockAtCursor();
    if (!block || !this.canvasRef) return;
    const rect = block.getBoundingClientRect();
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.slashMenuTop = rect.bottom - canvasRect.top + 4;
    this.slashMenuLeft = Math.max(0, rect.left - canvasRect.left);
    this.slashMenuVisible = true;
  }

  hideSlashMenu(): void {
    this.slashMenuVisible = false;
    this.cdr.markForCheck();
  }

  selectSlashType(type: PageBlock['type']): void {
    const block = this.getBlockAtCursor();
    this.hideSlashMenu();
    if (!block) return;

    // Clear the '/' character and replace block with chosen type
    const newEl = this.createBlockElement(type);
    block.replaceWith(newEl);
    this.placeCursorIn(newEl);
    this.isDirty = true;
    this.cdr.markForCheck();
  }

  // ── Markdown shortcuts ────────────────────────────────────────────────────

  /**
   * Detect and apply markdown trigger patterns on the given block element.
   * Returns true if a shortcut was applied.
   * Patterns are anchored (^ and $) so they only fire on exact full-line matches.
   */
  applyMarkdownShortcut(blockEl: Element): boolean {
    const text = blockEl.textContent ?? '';

    const triggers: { pattern: RegExp; type: PageBlock['type'] }[] = [
      { pattern: /^# $/,              type: 'heading'  },
      { pattern: /^## $/,             type: 'heading2' },
      { pattern: /^> $/,              type: 'quote'    },
      { pattern: /^---$/,             type: 'divider'  },
      { pattern: /^\[\] $|^\[ \] $/, type: 'todo'     },
    ];

    const match = triggers.find(t => t.pattern.test(text));
    if (!match) return false;

    const newEl = this.createBlockElement(match.type);
    blockEl.replaceWith(newEl);
    this.placeCursorIn(newEl);
    return true;
  }

  // ── Block helpers ─────────────────────────────────────────────────────────

  private createBlockElement(type: PageBlock['type']): HTMLElement {
    switch (type) {
      case 'heading': {
        const h = document.createElement('h1');
        h.innerHTML = '<br>';
        return h;
      }
      case 'heading2': {
        const h = document.createElement('h2');
        h.innerHTML = '<br>';
        return h;
      }
      case 'callout': {
        const d = document.createElement('div');
        d.setAttribute('data-type', 'callout');
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        d.appendChild(p);
        return d;
      }
      case 'todo': {
        const p = document.createElement('p');
        p.setAttribute('data-type', 'todo');
        p.setAttribute('data-checked', 'false');
        p.innerHTML = '<br>';
        return p;
      }
      case 'quote': {
        const bq = document.createElement('blockquote');
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        bq.appendChild(p);
        return bq;
      }
      case 'divider': {
        const hr = document.createElement('hr');
        // Insert a new paragraph after the divider for continued typing
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        // Return a fragment-like approach: we'll handle this in selectSlashType
        // For now return hr; the paragraph insertion is handled separately
        return hr;
      }
      default: {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        return p;
      }
    }
  }

  private placeCursorIn(el: HTMLElement): void {
    // For dividers, place cursor in the next sibling or insert a new paragraph
    if (el.tagName?.toLowerCase() === 'hr') {
      const next = el.nextElementSibling as HTMLElement | null;
      if (next) {
        this.placeCursorIn(next);
      } else {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        el.after(p);
        this.placeCursorIn(p);
      }
      return;
    }

    // For elements with a nested <p> (callout, quote), focus the inner <p>
    const target = el.querySelector('p') ?? el;
    target.focus?.();

    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    // Place cursor at start of the element
    if (target.childNodes.length > 0) {
      range.setStart(target.childNodes[0], 0);
    } else {
      range.setStart(target, 0);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private insertParagraphAfter(block: HTMLElement): void {
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    block.after(p);
    this.placeCursorIn(p);
  }

  private getBlockAtCursor(): HTMLElement | null {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;
    // Walk up to find a direct child of the canvas
    while (node && node.parentElement !== canvas) {
      node = node.parentElement;
    }
    return node as HTMLElement | null;
  }

  private isCurrentBlockEmpty(): boolean {
    const block = this.getBlockAtCursor();
    return !block || (block.textContent?.trim() ?? '') === '';
  }

  private autoResizeTextarea(ta: HTMLTextAreaElement): void {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  // ── Extract plain text for background analysis ────────────────────────────

  extractPlainText(): string {
    if (!this.canvasRef) return '';
    return (this.canvasRef.nativeElement.innerText ?? '').trim();
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
            this.notebookId, this.section.id, noteId,
            currentNote.title, 'page', newData,
          );
        }
      } catch (err) {
        console.warn('[PageEditor] Background analysis failed:', err);
      }
    })();
  }

  // ── Template Picker ───────────────────────────────────────────────────────

  onPickerSelectTemplate(templateId: string): void {
    this.showTemplatePicker = false;
    if (templateId === 'page') {
      this.selectedTemplateId = null;
      this.formHtml = '';
      this.cdr.markForCheck();
      return;
    }
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

  onBannerApply(): void { this.applyPendingTemplate(false); }
  onBannerDismiss(): void { this.clearPendingTemplate(); }

  onUndoAutoApply(): void {
    this.selectedTemplateId = null;
    this.formHtml = '';
    this.showUndoToast = false;
    if (this.undoToastTimer) { clearTimeout(this.undoToastTimer); this.undoToastTimer = null; }
    const currentData = this.note.data || {};
    const newData = { ...currentData };
    delete newData['_pendingTemplateId'];
    this.dataService.updateNote(this.notebookId, this.section.id, this.note.id, this.note.title, 'page', newData);
    this.pendingTemplateId = null;
    this.pendingTemplateName = '';
    this.pendingTemplateIcon = '';
    this.cdr.markForCheck();
  }

  private applyPendingTemplate(showToast: boolean): void {
    if (!this.pendingTemplateId) return;
    const tpl = this.templateService.getTemplate(this.pendingTemplateId);
    if (!tpl) { this.clearPendingTemplate(); return; }
    this.selectedTemplateId = this.pendingTemplateId;
    const html = tpl.buildForm({ title: this.title, ...this.note.data });
    this.formHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    this.showTemplatePicker = false;
    const currentData = this.note.data || {};
    const newData = { ...currentData };
    delete newData['_pendingTemplateId'];
    this.dataService.updateNote(this.notebookId, this.section.id, this.note.id, this.note.title, this.pendingTemplateId, newData);
    if (showToast) {
      this.showUndoToast = true;
      if (this.undoToastTimer) clearTimeout(this.undoToastTimer);
      this.undoToastTimer = setTimeout(() => { this.showUndoToast = false; this.cdr.markForCheck(); }, 6000);
    }
    this.pendingTemplateId = null;
    this.isDirty = false;
    this.cdr.markForCheck();
  }

  private clearPendingTemplate(): void {
    const currentData = this.note.data || {};
    const newData = { ...currentData };
    delete newData['_pendingTemplateId'];
    this.dataService.updateNote(this.notebookId, this.section.id, this.note.id, this.note.title, 'page', newData);
    this.pendingTemplateId = null;
    this.pendingTemplateName = '';
    this.pendingTemplateIcon = '';
    this.cdr.markForCheck();
  }

  /** Maps built-in template ids to lore-icon names. */
  getTemplateIconName(templateId: string): string | null {
    const map: Record<string, string> = {
      page: 'note-plus', rich: 'section', research: 'search',
      finance: 'layers', watchlist: 'list-view', journal: 'pulse',
      scrum: 'grid-view', investing: 'ai-sparkle',
    };
    return map[templateId] ?? null;
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  onTagKeydown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ',') && this.tagInput.trim()) {
      event.preventDefault();
      const tag = this.tagInput.trim().replace(/,$/, '');
      if (tag && !this.tags.includes(tag)) { this.tags.push(tag); this.isDirty = true; }
      this.tagInput = '';
    }
    if (event.key === 'Backspace' && !this.tagInput && this.tags.length) {
      this.tags.pop();
      this.isDirty = true;
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
    this.isDirty = true;
  }

  // ── Save / Delete / Close ─────────────────────────────────────────────────

  onSave(): void {
    // Non-page template: read from the template form
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

    // Page template: read from canvas
    const blocks = this.canvasRef
      ? this.htmlToBlocks(this.canvasRef.nativeElement)
      : [{ type: 'text' as const, content: '' }];

    const filteredBlocks = blocks.filter(
      b => b.type === 'divider' || b.content.trim() !== '' || b.type === 'todo'
    );

    this.saved.emit({
      title: this.title.trim() || 'Untitled',
      templateId: 'page',
      data: { icon: this.icon, blocks: filteredBlocks, tags: this.tags },
    });
    this.isDirty = false;

    // Post-save background analysis
    const plainText = this.extractPlainText();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 20 && !this.pendingTemplateId) {
      this.runBackgroundAnalysis(this.note.id, plainText);
    }
  }

  onDelete(): void { this.deleted.emit(); }
  onClose(): void { this.closed.emit(); }
}
