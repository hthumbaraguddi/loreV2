import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';

@Component({
  selector: 'app-paste-ai-response-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paste-ai-response-modal.component.html',
  styleUrls: ['./paste-ai-response-modal.component.scss']
})
export class PasteAiResponseModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() targetSection: { notebookId: string; sectionId: string } | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() noteSaved = new EventEmitter<void>();

  content = '';
  detectedType: 'markdown' | 'html' = 'markdown';
  // Allow user to override auto-detection
  forcedType: 'markdown' | 'html' | null = null;

  constructor(private data: DataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.content = '';
      this.detectedType = 'markdown';
      this.forcedType = null;
    }
  }

  get contentType(): 'markdown' | 'html' {
    return this.forcedType ?? this.detectedType;
  }

  onContentChange(): void {
    this.detectedType = this.detectContentType(this.content);
    // Reset forced type when content changes significantly
    if (this.forcedType && this.forcedType !== this.detectedType) {
      this.forcedType = null;
    }
  }

  setContentType(type: 'markdown' | 'html'): void {
    this.forcedType = type;
  }

  private detectContentType(text: string): 'markdown' | 'html' {
    const trimmed = text.trim();
    // Check for HTML doctype or opening html/body/div tags
    if (
      /^<!DOCTYPE\s+html/i.test(trimmed) ||
      /^<html[\s>]/i.test(trimmed) ||
      /<(div|section|article|header|footer|main|nav|aside|table|ul|ol|p|h[1-6])\s/i.test(trimmed.substring(0, 500))
    ) {
      return 'html';
    }
    return 'markdown';
  }

  get isSaveDisabled(): boolean {
    return !this.targetSection || !this.content.trim();
  }

  private extractTitle(text: string, type: 'markdown' | 'html'): string {
    if (type === 'html') {
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = text.match(/<h[123][^>]*>([^<]+)<\/h[123]>/i);
      if (titleMatch?.[1]) return titleMatch[1].trim().substring(0, 80);
      if (h1Match?.[1]) return h1Match[1].replace(/<[^>]+>/g, '').trim().substring(0, 80);
      return 'HTML Note';
    }
    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim() !== '');
    if (!lines.length) return 'Untitled Note';
    const first = lines[0];
    if (first.startsWith('# ')) return first.slice(2).trim().substring(0, 80);
    return first.trim().substring(0, 80) || 'Untitled Note';
  }

  save(): void {
    if (this.isSaveDisabled) return;
    const { notebookId, sectionId } = this.targetSection!;
    const type = this.contentType;
    const title = this.extractTitle(this.content, type);
    this.data.addNote(notebookId, sectionId, title, 'rich', {
      markdown: this.content,
      contentType: type,
    });
    this.noteSaved.emit();
    this.closed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
