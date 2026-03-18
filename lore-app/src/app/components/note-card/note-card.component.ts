import { Component, Input, Output, EventEmitter, inject, OnChanges, AfterViewChecked, ElementRef } from '@angular/core';
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
export class NoteCardComponent implements OnChanges, AfterViewChecked {
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
  private el = inject(ElementRef);

  cardBodyHtml: SafeHtml = '';
  template: TemplateDefinition | undefined;
  private iframeInjected = false;

  ngOnChanges(): void {
    this.template = this.templateService.getTemplate(this.note.templateId);
    this.cardBodyHtml = this.buildCardBody();
    this.iframeInjected = false;
  }

  ngAfterViewChecked(): void {
    if (this.iframeInjected) return;
    const placeholder = this.el.nativeElement.querySelector('.rich-html-placeholder');
    if (!placeholder) return;
    this.iframeInjected = true;
    const encoded = placeholder.getAttribute('data-html-content');
    if (!encoded) return;
    const html = decodeURIComponent(encoded);
    const iframe = document.createElement('iframe');
    iframe.className = 'rich-html-iframe';
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.setAttribute('scrolling', 'yes');
    placeholder.replaceWith(iframe);
    // Write content after iframe is in DOM
    setTimeout(() => {
      try {
        iframe.contentDocument?.open();
        iframe.contentDocument?.write(html);
        iframe.contentDocument?.close();
        // Auto-size to content
        const resize = () => {
          const h = iframe.contentDocument?.body?.scrollHeight;
          if (h) iframe.style.height = Math.min(h + 20, 600) + 'px';
        };
        iframe.contentDocument?.addEventListener('DOMContentLoaded', resize);
        setTimeout(resize, 200);
      } catch (e) {
        console.warn('iframe write failed', e);
      }
    }, 0);
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
