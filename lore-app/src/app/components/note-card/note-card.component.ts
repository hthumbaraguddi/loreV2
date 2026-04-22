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
  private iframeSized = false;

  ngOnChanges(): void {
    this.template = this.templateService.getTemplate(this.note.templateId);
    this.cardBodyHtml = this.buildCardBody();
    this.iframeInjected = false;
    this.iframeSized = false;
  }

  ngAfterViewChecked(): void {
    // Only inject when the card body is visible (open)
    if (!this.isOpen) return;

    if (!this.iframeInjected) {
      const placeholder = this.el.nativeElement.querySelector('.rich-html-placeholder');
      if (!placeholder) return;
      this.iframeInjected = true;
      const encoded = placeholder.getAttribute('data-html-content');
      if (!encoded) return;
      const html = decodeURIComponent(encoded);
      const iframe = document.createElement('iframe');
      iframe.className = 'rich-html-iframe';
      iframe.setAttribute('sandbox', 'allow-same-origin');
      iframe.setAttribute('scrolling', 'no');
      placeholder.replaceWith(iframe);
      setTimeout(() => {
        try {
          iframe.contentDocument?.open();
          // Inject containment CSS to prevent HTML content from overflowing the iframe
          const containmentCss = `<style>
            html, body { max-width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; margin: 0 !important; }
            * { max-width: 100% !important; box-sizing: border-box !important; }
            nav, header, .nav, .navbar { position: relative !important; width: 100% !important; }
            [style*="position:fixed"], [style*="position: fixed"] { position: relative !important; }
            table { table-layout: fixed !important; width: 100% !important; }
            img, video { max-width: 100% !important; height: auto !important; }
            pre, code { white-space: pre-wrap !important; word-break: break-all !important; }
          </style>`;
          iframe.contentDocument?.write(containmentCss + html);
          iframe.contentDocument?.close();
          this.sizeIframe(iframe);
        } catch (e) {
          console.warn('iframe write failed', e);
        }
      }, 0);
      return;
    }

    // Re-size if already injected but not yet sized (card was closed during injection)
    if (!this.iframeSized) {
      const iframe = this.el.nativeElement.querySelector('.rich-html-iframe') as HTMLIFrameElement | null;
      if (iframe) this.sizeIframe(iframe);
    }
  }

  private sizeIframe(iframe: HTMLIFrameElement): void {
    const resize = () => {
      const h = iframe.contentDocument?.body?.scrollHeight;
      if (h && h > 50) {
        iframe.style.height = (h + 20) + 'px';
        this.iframeSized = true;
      }
    };
    iframe.contentDocument?.addEventListener('DOMContentLoaded', resize);
    setTimeout(resize, 50);
    setTimeout(resize, 300);
    setTimeout(resize, 1000);
    setTimeout(resize, 2500);
  }

  get badgeText(): string {
    return this.section.title.split('—')[0].trim().split(' ').slice(0, 2).join(' ');
  }

  get isOpen(): boolean {
    return !this.note._collapsed;
  }

  get isHtmlNote(): boolean {
    return this.note.templateId === 'rich' && this.note.data?.['contentType'] === 'html';
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
    // When opening an HTML note, reset sized flag so ngAfterViewChecked re-measures
    if (this.isHtmlNote && this.note._collapsed) {
      this.iframeSized = false;
    }
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
