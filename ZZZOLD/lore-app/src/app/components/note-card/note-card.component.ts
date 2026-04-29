import { Component, Input, Output, EventEmitter, inject, OnChanges, AfterViewChecked, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Note, Section, SectionColor } from '../../models';
import { DataService } from '../../services/data.service';
import { TemplateService, TemplateDefinition } from '../../services/template.service';
import { HtmlProcessorService } from '../../services/html-processor.service';

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
export class NoteCardComponent implements OnChanges, AfterViewChecked, OnDestroy {
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
  private htmlProcessor = inject(HtmlProcessorService);
  private el = inject(ElementRef);

  cardBodyHtml: SafeHtml = '';
  template: TemplateDefinition | undefined;
  private iframeInjected = false;
  private iframeSized = false;
  private blobUrl: string | null = null;

  ngOnChanges(): void {
    this.template = this.templateService.getTemplate(this.note.templateId);
    this.cardBodyHtml = this.buildCardBody();
    this.iframeInjected = false;
    this.iframeSized = false;
  }

  ngOnDestroy(): void {
    this._revokeBlobUrl();
  }

  ngAfterViewChecked(): void {
    if (!this.isOpen) return;

    if (!this.iframeInjected) {
      const placeholder = this.el.nativeElement.querySelector('.rich-html-placeholder');
      if (!placeholder) return;
      this.iframeInjected = true;
      const encoded = placeholder.getAttribute('data-html-content');
      if (!encoded) return;
      const html = decodeURIComponent(encoded);
      this._injectBlobIframe(placeholder, html);
      return;
    }

    // Re-size if already injected but not yet sized (card was closed during injection)
    if (!this.iframeSized) {
      const iframe = this.el.nativeElement.querySelector('.rich-html-iframe') as HTMLIFrameElement | null;
      if (iframe) this._sizeIframe(iframe);
    }
  }

  private _injectBlobIframe(placeholder: Element, html: string): void {
    const prepared = this.htmlProcessor.prepareForRendering(html);

    const iframe = document.createElement('iframe');
    iframe.className = 'rich-html-iframe';
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('tabindex', '-1');
    iframe.style.pointerEvents = 'auto';
    iframe.addEventListener('focus', () => iframe.blur(), true);

    placeholder.replaceWith(iframe);

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      // Primary path: Blob URL — works for large files, no document.write deprecation
      this._revokeBlobUrl(); // clean up any previous blob
      const blob = new Blob([prepared], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      this.blobUrl = url;
      iframe.src = url;
      iframe.addEventListener('load', () => this._sizeIframe(iframe), { once: true });
    } else {
      // Fallback: document.write (legacy browsers)
      console.warn('Blob URL unavailable, falling back to document.write');
      setTimeout(() => {
        try {
          iframe.contentDocument?.open();
          // eslint-disable-next-line deprecation/deprecation
          (iframe.contentDocument as any).write(prepared);
          iframe.contentDocument?.close();
          this._sizeIframe(iframe);
        } catch (e) {
          console.warn('iframe write failed', e);
        }
      }, 0);
    }
  }

  private _sizeIframe(iframe: HTMLIFrameElement): void {
    const measure = (retries = 0) => {
      try {
        const h = iframe.contentDocument?.body?.scrollHeight;
        if (h && h > 50) {
          iframe.style.height = (h + 20) + 'px';
          this.iframeSized = true;
        } else if (retries < 2) {
          // Retry at 300ms and 1000ms if content not yet laid out
          setTimeout(() => measure(retries + 1), retries === 0 ? 300 : 700);
        }
      } catch (e) {
        console.warn('iframe sizing failed — contentDocument inaccessible', e);
      }
    };
    measure();
  }

  private _revokeBlobUrl(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
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
    // When collapsing an HTML note, revoke the blob URL to free memory
    if (this.isHtmlNote && !this.note._collapsed) {
      this._revokeBlobUrl();
      this.iframeInjected = false;
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
