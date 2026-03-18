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

  constructor(private data: DataService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.content = '';
    }
  }

  get isSaveDisabled(): boolean {
    return !this.targetSection || !this.content.trim();
  }

  private extractTitle(text: string): string {
    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l.trim() !== '');
    if (!lines.length) return 'Untitled Note';
    const first = lines[0];
    if (first.startsWith('# ')) {
      return first.slice(2).trim().substring(0, 80);
    }
    return first.trim().substring(0, 80) || 'Untitled Note';
  }

  save(): void {
    if (this.isSaveDisabled) return;
    const { notebookId, sectionId } = this.targetSection!;
    const title = this.extractTitle(this.content);
    this.data.addNote(notebookId, sectionId, title, 'rich', { markdown: this.content });
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
