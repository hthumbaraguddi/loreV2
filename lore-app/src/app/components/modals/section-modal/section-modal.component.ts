import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Section, SECTION_COLORS } from '../../../models';

@Component({
  selector: 'app-section-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './section-modal.component.html',
  styleUrls: ['./section-modal.component.scss']
})
export class SectionModalComponent implements OnChanges {
  @Input() section: Section | null = null;
  @Output() saved = new EventEmitter<{ title: string; subtitle: string; color: string }>();
  @Output() deleted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  title = '';
  subtitle = '';
  selectedColor = 'purple';

  readonly colorKeys = Object.keys(SECTION_COLORS);
  readonly colors = SECTION_COLORS;

  get isEdit(): boolean { return !!this.section; }
  get modalTitle(): string { return this.isEdit ? 'Edit Section' : 'New Section'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['section']) {
      if (this.section) {
        this.title = this.section.title;
        this.subtitle = this.section.subtitle || '';
        this.selectedColor = this.section.color || 'purple';
      } else {
        this.title = '';
        this.subtitle = '';
        this.selectedColor = 'purple';
      }
    }
  }

  pickColor(color: string): void {
    this.selectedColor = color;
  }

  save(): void {
    const trimmed = this.title.trim();
    if (!trimmed) return;
    this.saved.emit({ title: trimmed, subtitle: this.subtitle.trim(), color: this.selectedColor });
  }

  delete(): void {
    this.deleted.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
