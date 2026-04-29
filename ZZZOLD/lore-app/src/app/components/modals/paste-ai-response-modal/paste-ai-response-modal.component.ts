import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { HtmlProcessorService } from '../../../services/html-processor.service';

@Component({
  selector: 'app-paste-ai-response-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paste-ai-response-modal.component.html',
  styleUrls: ['./paste-ai-response-modal.component.scss']
})
export class PasteAiResponseModalComponent implements OnChanges {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  @Input() isOpen = false;
  @Input() targetSection: { notebookId: string; sectionId: string } | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() noteSaved = new EventEmitter<void>();

  content = '';
  detectedType: 'markdown' | 'html' = 'markdown';
  forcedType: 'markdown' | 'html' | null = null;

  // Import tab state
  activeTab: 'paste' | 'import' = 'paste';
  selectedFile: File | null = null;
  fileHtml: string | null = null;
  fileError: string | null = null;
  isDragOver = false;

  constructor(private data: DataService, private htmlProcessor: HtmlProcessorService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.content = '';
      this.detectedType = 'markdown';
      this.forcedType = null;
      this.activeTab = 'paste';
      this.selectedFile = null;
      this.fileHtml = null;
      this.fileError = null;
      this.isDragOver = false;
    }
  }

  get contentType(): 'markdown' | 'html' {
    return this.forcedType ?? this.detectedType;
  }

  onContentChange(): void {
    this.detectedType = this.detectContentType(this.content);
    if (this.forcedType && this.forcedType !== this.detectedType) {
      this.forcedType = null;
    }
  }

  setContentType(type: 'markdown' | 'html'): void {
    this.forcedType = type;
  }

  private detectContentType(text: string): 'markdown' | 'html' {
    const trimmed = text.trim();
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
    if (!this.targetSection) return true;
    if (this.activeTab === 'import') return !this.fileHtml;
    return !this.content.trim();
  }

  selectTab(tab: 'paste' | 'import'): void {
    this.activeTab = tab;
    this.fileError = null;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    const error = this.validateFile(file);
    if (error) {
      this.fileError = error;
      return;
    }
    this.fileError = null;
    this.selectedFile = file;
    this.readFile(file);
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.fileHtml = e.target?.result as string;
    };
    reader.onerror = (e) => {
      this.fileError = (e.target as FileReader).error?.message ?? 'Failed to read file.';
      this.fileHtml = null;
    };
    reader.readAsText(file, 'UTF-8');
  }

  private validateFile(file: File): string | null {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.html') && !name.endsWith('.htm')) {
      return 'Only .html and .htm files are supported.';
    }
    if (file.size > this.MAX_FILE_SIZE) {
      return 'File is too large. Maximum supported size is 10 MB.';
    }
    return null;
  }

  save(): void {
    if (this.isSaveDisabled) return;
    const { notebookId, sectionId } = this.targetSection!;

    if (this.activeTab === 'import' && this.fileHtml) {
      const sanitised = this.htmlProcessor.sanitise(this.fileHtml);
      const title = this.htmlProcessor.extractTitle(this.fileHtml);
      try {
        this.data.addNote(notebookId, sectionId, title, 'rich', {
          markdown: sanitised,
          contentType: 'html',
        });
        this.noteSaved.emit();
        this._resetImportState();
        this.closed.emit();
      } catch (err) {
        this.data.showToast('Failed to save note. Please try again.');
      }
      return;
    }

    // Paste tab
    const type = this.contentType;
    const title = this._extractPasteTitle(this.content, type);
    this.data.addNote(notebookId, sectionId, title, 'rich', {
      markdown: this.content,
      contentType: type,
    });
    this.noteSaved.emit();
    this.closed.emit();
  }

  cancel(): void {
    this._resetImportState();
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this._resetImportState();
      this.closed.emit();
    }
  }

  private _resetImportState(): void {
    this.activeTab = 'paste';
    this.selectedFile = null;
    this.fileHtml = null;
    this.fileError = null;
    this.isDragOver = false;
    this.content = '';
    this.forcedType = null;
    this.detectedType = 'markdown';
  }

  private _extractPasteTitle(text: string, type: 'markdown' | 'html'): string {
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
}
