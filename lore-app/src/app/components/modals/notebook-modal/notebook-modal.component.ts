import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Shelf, Notebook } from '../../../models';

const NOTEBOOK_ICONS = [
  '📓', '📚', '🧠', '💡', '🚀', '🎯', '🛠️', '⚙️', '🔬', '💼',
  '🎨', '📊', '🌍', '🌱', '🔐', '🤖', '✨', '🎓', '💻', '📝',
  '🔭', '🏗️', '📐', '🧩', '📈', '💰', '🎬', '🏃', '🌅', '📋'
];

@Component({
  selector: 'app-notebook-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notebook-modal.component.html',
  styleUrls: ['./notebook-modal.component.scss']
})
export class NotebookModalComponent implements OnChanges {
  @Input() notebook: Notebook | null = null;
  @Input() shelves: Shelf[] = [];
  @Input() defaultShelfId = '';
  @Output() saved = new EventEmitter<{ name: string; icon: string; shelfId: string }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  selectedIcon = NOTEBOOK_ICONS[0];
  selectedShelfId = '';
  icons = NOTEBOOK_ICONS;

  get isEdit(): boolean { return !!this.notebook; }
  get title(): string { return this.isEdit ? 'Edit Notebook' : 'New Notebook'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notebook'] || changes['defaultShelfId'] || changes['shelves']) {
      if (this.notebook) {
        this.name = this.notebook.name;
        this.selectedIcon = this.notebook.icon || NOTEBOOK_ICONS[0];
        this.selectedShelfId = this.notebook.shelfId;
      } else {
        this.name = '';
        this.selectedIcon = NOTEBOOK_ICONS[0];
        this.selectedShelfId = this.defaultShelfId || (this.shelves[0]?.id ?? '');
      }
    }
  }

  pickIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  save(): void {
    const trimmed = this.name.trim();
    if (!trimmed) return;
    this.saved.emit({ name: trimmed, icon: this.selectedIcon, shelfId: this.selectedShelfId });
  }

  delete(): void {
    this.deleted.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
