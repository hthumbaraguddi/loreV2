import { Component, input, output, signal, computed, ChangeDetectionStrategy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShelfService } from '../../../core/services/shelf.service';
import { Note } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-file-link-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="file-link-palette" role="listbox" aria-label="File link picker">
      <div class="palette-search">
        <span class="material-symbols-outlined">search</span>
        <input
          #searchInput
          type="text"
          placeholder="Search notes…"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          (keydown)="onKeydown($event)"
          autofocus
        />
      </div>
      <div class="palette-list">
        @for (note of filteredNotes(); track note.id; let i = $index) {
          <button
            class="palette-item"
            role="option"
            [class.highlighted]="i === activeIndex()"
            (click)="select(note)"
            (mouseenter)="activeIndex.set(i)"
          >
            <span class="item-icon material-symbols-outlined">{{ getNoteIcon(note.type) }}</span>
            <div class="item-content">
              <div class="item-title">{{ note.title || 'Untitled' }}</div>
              <div class="item-path">{{ getNotePath(note) }}</div>
            </div>
          </button>
        }
        @if (filteredNotes().length === 0) {
          <div class="palette-empty">No notes match "{{ query() }}"</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .file-link-palette {
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-lg);
      box-shadow: var(--lore-shadow-lg);
      width: 320px; max-height: 400px; overflow: hidden;
    }
    .palette-search {
      display: flex; align-items: center; gap: var(--lore-space-8);
      padding: var(--lore-space-10) var(--lore-space-12);
      border-bottom: 1px solid var(--lore-color-border);
      .material-symbols-outlined { font-size: 16px; color: var(--lore-color-text-muted); flex-shrink: 0; }
      input {
        flex: 1; border: none; background: transparent; outline: none;
        font-size: var(--lore-font-size-sm); color: var(--lore-color-text-default);
        &::placeholder { color: var(--lore-color-text-muted-2); }
      }
    }
    .palette-list { max-height: 320px; overflow-y: auto; padding: 4px; }
    .palette-item {
      display: flex; align-items: center; gap: var(--lore-space-10);
      width: 100%; padding: var(--lore-space-8) var(--lore-space-10);
      border: none; background: transparent; border-radius: var(--lore-radius-sm);
      font-size: var(--lore-font-size-sm); color: var(--lore-color-text-default);
      cursor: pointer; text-align: left;
      &.highlighted, &:hover { background: var(--lore-color-accent-subtle); color: var(--lore-color-accent); }
    }
    .item-icon { 
      font-size: 18px; color: var(--lore-color-text-muted); flex-shrink: 0; 
      .palette-item.highlighted &, .palette-item:hover & { color: var(--lore-color-accent); }
    }
    .item-content { flex: 1; min-width: 0; }
    .item-title { 
      font-weight: 500; margin-bottom: 2px; 
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .item-path { 
      font-size: var(--lore-font-size-xs); color: var(--lore-color-text-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .palette-empty { 
      padding: var(--lore-space-16); text-align: center; 
      color: var(--lore-color-text-muted); font-size: var(--lore-font-size-sm); 
    }
  `]
})
export class FileLinkPaletteComponent {
  private shelfService = inject(ShelfService);

  cursorPosition = input(0);
  selected = output<{ noteId: string; noteTitle: string; cursorPosition: number }>();
  dismissed = output<void>();

  query = signal('');
  activeIndex = signal(0);

  allNotes = computed(() => this.shelfService.getAllNotes());

  filteredNotes = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.allNotes().slice(0, 20); // Limit to 20 when no query
    
    return this.allNotes().filter(note => 
      note.title?.toLowerCase().includes(q) || 
      note.content?.toLowerCase().includes(q) ||
      note.tags?.some(tag => tag.toLowerCase().includes(q))
    ).slice(0, 20); // Limit results
  });

  @HostListener('document:keydown.escape')
  onEscape(): void { this.dismissed.emit(); }

  onKeydown(e: KeyboardEvent): void {
    const len = this.filteredNotes().length;
    if (e.key === 'ArrowDown') { 
      e.preventDefault(); 
      this.activeIndex.update(i => (i + 1) % len); 
    }
    else if (e.key === 'ArrowUp') { 
      e.preventDefault(); 
      this.activeIndex.update(i => (i - 1 + len) % len); 
    }
    else if (e.key === 'Enter') { 
      e.preventDefault(); 
      const note = this.filteredNotes()[this.activeIndex()]; 
      if (note) this.select(note); 
    }
    else if (e.key === 'Escape') { 
      this.dismissed.emit(); 
    }
  }

  select(note: Note): void {
    this.selected.emit({ 
      noteId: note.id, 
      noteTitle: note.title || 'Untitled',
      cursorPosition: this.cursorPosition() 
    });
  }

  getNoteIcon(type: string): string {
    const icons: Record<string, string> = {
      'research': 'science',
      'journal': 'book',
      'task': 'check_circle',
      'idea': 'lightbulb',
      'reference': 'description',
      'html': 'code'
    };
    return icons[type] || 'description';
  }

  getNotePath(note: Note): string {
    // Find which shelf and notebook contains this note
    const shelves = this.shelfService.shelves();
    for (const shelf of shelves) {
      for (const notebook of shelf.notebooks) {
        if (notebook.notes.some(n => n.id === note.id)) {
          return `${shelf.name} › ${notebook.name}`;
        }
      }
    }
    return 'Unknown location';
  }
}