import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notebook, Section, Note, SectionColorMap, SectionColor, SECTION_COLORS } from '../../models';
import { NoteCardComponent } from '../note-card/note-card.component';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

/** Pure function: returns true if a note matches the query (case-insensitive). */
export function noteMatchesQuery(note: Note, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (note.title.toLowerCase().includes(q)) return true;
  for (const val of Object.values(note.data)) {
    if (typeof val === 'string' && val.toLowerCase().includes(q)) return true;
  }
  return false;
}

/** Pure function: filter all notes in a notebook by query, returning flat list. */
export function filterNotes(notebook: Notebook, query: string): Note[] {
  if (!query) return notebook.sections.flatMap(s => s.notes);
  return notebook.sections.flatMap(s => s.notes.filter(n => noteMatchesQuery(n, query)));
}

@Component({
  selector: 'app-content-area',
  standalone: true,
  imports: [CommonModule, NoteCardComponent, LoreIconComponent],
  templateUrl: './content-area.component.html',
  styleUrls: ['./content-area.component.scss'],
})
export class ContentAreaComponent implements OnChanges {
  @Input() notebook: Notebook | null = null;
  @Input() searchQuery: string = '';
  @Input() colors: SectionColorMap = SECTION_COLORS;

  @Output() editNote = new EventEmitter<{ note: Note; section: Section }>();
  @Output() deleteNote = new EventEmitter<{ note: Note; section: Section }>();
  @Output() addNote = new EventEmitter<Section>();
  @Output() editSection = new EventEmitter<Section>();
  @Output() deleteSection = new EventEmitter<Section>();
  @Output() searchCleared = new EventEmitter<void>();

  matchCount = 0;
  totalNotes = 0;

  ngOnChanges(): void {
    this.totalNotes = this.notebook
      ? this.notebook.sections.reduce((sum, s) => sum + s.notes.length, 0)
      : 0;
    this.matchCount = this.notebook && this.searchQuery
      ? filterNotes(this.notebook, this.searchQuery).length
      : this.totalNotes;
  }

  getColor(section: Section): SectionColor {
    return this.colors[section.color] ?? SECTION_COLORS['purple'];
  }

  getVisibleNotes(section: Section): Note[] {
    if (!this.searchQuery) return section.notes;
    return section.notes.filter(n => noteMatchesQuery(n, this.searchQuery));
  }

  isSectionVisible(section: Section): boolean {
    if (!this.searchQuery) return true;
    return this.getVisibleNotes(section).length > 0;
  }

  get progressSegments(): { color: string; flex: number }[] {
    if (!this.notebook) return [];
    const total = this.totalNotes || 1;
    return this.notebook.sections.map(s => ({
      color: this.getColor(s).dot,
      flex: s.notes.length / total,
    }));
  }

  onEditNote(note: Note, section: Section): void {
    this.editNote.emit({ note, section });
  }

  onDeleteNote(note: Note, section: Section): void {
    this.deleteNote.emit({ note, section });
  }

  onAddNote(section: Section): void {
    this.addNote.emit(section);
  }

  onEditSection(section: Section): void {
    this.editSection.emit(section);
  }

  onDeleteSection(section: Section): void {
    this.deleteSection.emit(section);
  }

  onClearSearch(): void {
    this.searchCleared.emit();
  }
}
