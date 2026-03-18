import { Component, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, NoteCardComponent, LoreIconComponent, FormsModule],
  templateUrl: './content-area.component.html',
  styleUrls: ['./content-area.component.scss'],
})
export class ContentAreaComponent implements OnChanges, AfterViewChecked {
  @Input() notebook: Notebook | null = null;
  @Input() searchQuery: string = '';
  @Input() colors: SectionColorMap = SECTION_COLORS;

  @Output() editNote = new EventEmitter<{ note: Note; section: Section }>();
  @Output() deleteNote = new EventEmitter<{ note: Note; section: Section }>();
  @Output() addNote = new EventEmitter<Section>();
  @Output() addPageNote = new EventEmitter<Section>();
  @Output() editSection = new EventEmitter<Section>();
  @Output() deleteSection = new EventEmitter<Section>();
  @Output() searchCleared = new EventEmitter<void>();
  @Output() addSectionInline = new EventEmitter<string>();
  @Output() renameSectionInline = new EventEmitter<{ section: Section; title: string }>();

  newSectionTitle = '';
  showNewSectionInput = false;

  // Inline section title editing
  editingSectionId: string | null = null;
  editingSectionTitle = '';
  private focusSecTitleInput = false;

  @ViewChild('secTitleInput') secTitleInputRef?: ElementRef<HTMLInputElement>;

  onNewSectionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.newSectionTitle.trim()) {
      this.addSectionInline.emit(this.newSectionTitle.trim());
      this.newSectionTitle = '';
      this.showNewSectionInput = false;
    }
    if (event.key === 'Escape') {
      this.newSectionTitle = '';
      this.showNewSectionInput = false;
    }
  }

  onNewSectionBlur(): void {
    if (this.newSectionTitle.trim()) {
      this.addSectionInline.emit(this.newSectionTitle.trim());
    }
    this.newSectionTitle = '';
    this.showNewSectionInput = false;
  }

  matchCount = 0;
  totalNotes = 0;
  // Plain object so Angular detects changes on mutation
  collapsedSections: Record<string, boolean> = {};

  startEditSectionTitle(section: Section): void {
    this.editingSectionId = section.id;
    this.editingSectionTitle = section.title;
    this.focusSecTitleInput = true;
  }

  onSecTitleKeydown(event: KeyboardEvent, section: Section): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitSectionTitle(section);
    }
    if (event.key === 'Escape') {
      this.editingSectionId = null;
      this.editingSectionTitle = '';
    }
  }

  commitSectionTitle(section: Section): void {
    const title = this.editingSectionTitle.trim();
    if (title && title !== section.title) {
      this.renameSectionInline.emit({ section, title });
    }
    this.editingSectionId = null;
    this.editingSectionTitle = '';
  }

  ngAfterViewChecked(): void {
    if (this.focusSecTitleInput && this.secTitleInputRef) {
      this.secTitleInputRef.nativeElement.focus();
      this.secTitleInputRef.nativeElement.select();
      this.focusSecTitleInput = false;
    }
  }

  toggleCollapse(sectionId: string): void {
    this.collapsedSections = {
      ...this.collapsedSections,
      [sectionId]: !this.collapsedSections[sectionId],
    };
  }

  isCollapsed(sectionId: string): boolean {
    return !!this.collapsedSections[sectionId];
  }

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

  onAddPageNote(section: Section): void {
    this.addPageNote.emit(section);
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
