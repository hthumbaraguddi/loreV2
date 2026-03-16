import { Component, Input, Output, EventEmitter, inject, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Note, Section, SectionColor } from '../../models';
import { DataService } from '../../services/data.service';
import { TemplateService, TemplateDefinition } from '../../services/template.service';

function escHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-card.component.html',
  styleUrls: ['./note-card.component.scss'],
})
export class NoteCardComponent implements OnChanges {
  @Input() note!: Note;
  @Input() section!: Section;
  @Input() color!: SectionColor;
  @Input() searchQuery: string = '';
  @Input() notebookId!: string;

  @Output() edit = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<Note>();

  private sanitizer = inject(DomSanitizer);
  private data = inject(DataService);
  private templateService = inject(TemplateService);

  cardBodyHtml: SafeHtml = '';
  template: TemplateDefinition | undefined;

  ngOnChanges(): void {
    this.template = this.templateService.getTemplate(this.note.templateId);
    this.cardBodyHtml = this.buildCardBody();
  }

  get badgeText(): string {
    return this.section.title.split('—')[0].trim().split(' ').slice(0, 2).join(' ');
  }

  get isOpen(): boolean {
    return !this.note._collapsed;
  }

  private highlightFn = (text: string): string => {
    const q = this.searchQuery?.trim();
    if (!q) return escHtml(text);
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escHtml(text).replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark class="hl">$1</mark>'
    );
  };

  private buildCardBody(): SafeHtml {
    let html = '';
    if (this.template) {
      html = this.template.renderCard(this.note, this.color, this.highlightFn);
    } else {
      html = this.templateService.renderFallbackCard(this.note, this.highlightFn);
    }
    const tags: string[] = this.note.data?.['tags'] || [];
    if (tags.length) {
      html += `<div class="tag-row">${tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}</div>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onToggle(): void {
    this.data.toggleNoteCollapse(this.notebookId, this.section.id, this.note.id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.note);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.note);
  }
}
