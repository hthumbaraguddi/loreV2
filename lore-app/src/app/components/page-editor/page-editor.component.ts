import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef, inject, AfterViewChecked, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, Section } from '../../models';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

export interface PageBlock {
  type: 'text' | 'heading' | 'heading2' | 'callout' | 'todo' | 'quote' | 'divider';
  content: string;
  checked?: boolean;
}

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent],
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

  icon = '📄';
  title = '';
  blocks: PageBlock[] = [];
  tags: string[] = [];
  tagInput = '';
  isDirty = false;
  private needsResize = false;

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
  }

  // ── Block operations ──────────────────────────────────────────────────────

  addBlock(type: PageBlock['type'], afterIndex?: number): void {
    const block: PageBlock = { type, content: '', checked: type === 'todo' ? false : undefined };
    const idx = afterIndex !== undefined ? afterIndex + 1 : this.blocks.length;
    this.blocks.splice(idx, 0, block);
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
    this.saved.emit({
      title: this.title.trim() || 'Untitled',
      templateId: 'page',
      data: {
        icon: this.icon,
        blocks: this.blocks.filter(b => b.type === 'divider' || b.content.trim() !== '' || b.type === 'todo'),
        tags: this.tags,
      },
    });
    this.isDirty = false;
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
