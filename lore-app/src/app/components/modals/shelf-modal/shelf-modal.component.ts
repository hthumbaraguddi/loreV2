import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Shelf } from '../../../models';
import { LoreIconComponent } from '../../lore-icon/lore-icon.component';

const SHELF_ICONS = [
  'shelf', 'notebook', 'folder', 'star', 'bookmark', 'home', 'lightbulb',
  'layers', 'archive', 'calendar', 'chart-bar', 'database', 'image', 'video',
  'audio', 'lock', 'settings', 'user', 'users', 'filter', 'search', 'link',
  'pin', 'milestone', 'pulse', 'quote', 'draft', 'badge', 'inbox', 'save'
];

@Component({
  selector: 'app-shelf-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent],
  templateUrl: './shelf-modal.component.html',
  styleUrls: ['./shelf-modal.component.scss']
})
export class ShelfModalComponent implements OnChanges {
  @Input() shelf: Shelf | null = null;
  @Output() saved = new EventEmitter<{ name: string; icon: string }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  selectedIcon = SHELF_ICONS[0];
  icons = SHELF_ICONS;

  get isEdit(): boolean { return !!this.shelf; }
  get title(): string { return this.isEdit ? 'Edit Shelf' : 'New Shelf'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shelf']) {
      if (this.shelf) {
        this.name = this.shelf.name;
        this.selectedIcon = this.shelf.icon || SHELF_ICONS[0];
      } else {
        this.name = '';
        this.selectedIcon = SHELF_ICONS[0];
      }
    }
  }

  pickIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  save(): void {
    const trimmed = this.name.trim();
    if (!trimmed) return;
    this.saved.emit({ name: trimmed, icon: this.selectedIcon });
  }

  delete(): void {
    this.deleted.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
