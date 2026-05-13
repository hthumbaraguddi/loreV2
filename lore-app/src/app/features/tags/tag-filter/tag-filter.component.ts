import { Component, signal, computed, ChangeDetectionStrategy, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TagService } from '../../../core/services/tag.service';
import { ShelfService } from '../../../core/services/shelf.service';
import { Note } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-tag-filter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tag-filter">
      <div class="filter-header">
        <h2 class="filter-title">
          <span class="material-symbols-outlined">label</span>
          {{ selectedTag() }}
        </h2>
        <button class="filter-close" (click)="onClose()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="filter-stats">
        <div class="stat">
          <div class="stat-value">{{ filteredNotes().length }}</div>
          <div class="stat-label">Notes</div>
        </div>
      </div>

      <div class="filter-body">
        @if (filteredNotes().length > 0) {
          <div class="notes-list">
            @for (note of filteredNotes(); track note.id) {
              <button class="note-item" (click)="onNoteSelect(note.id)">
                <div class="note-icon">
                  <span class="material-symbols-outlined">{{ getNoteIcon(note.type) }}</span>
                </div>
                <div class="note-content">
                  <div class="note-title">{{ note.title || 'Untitled' }}</div>
                  <div class="note-path">{{ getNotePath(note) }}</div>
                  <div class="note-preview">{{ getPreview(note) }}</div>
                </div>
                <div class="note-date">{{ note.updatedAt | date:'short' }}</div>
              </button>
            }
          </div>
        } @else {
          <div class="empty-state">
            <span class="material-symbols-outlined">note_off</span>
            <div class="empty-title">No notes with this tag</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tag-filter {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--lore-color-bg-surface);
    }

    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--lore-space-16);
      border-bottom: 1px solid var(--lore-color-border);
      flex-shrink: 0;
    }

    .filter-title {
      display: flex;
      align-items: center;
      gap: var(--lore-space-10);
      font-size: var(--lore-font-size-lg);
      font-weight: 600;
      color: var(--lore-color-text-default);
      margin: 0;
    }

    .filter-title .material-symbols-outlined {
      font-size: 20px;
      color: var(--lore-color-accent);
    }

    .filter-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: var(--lore-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--lore-color-text-muted);
      transition: all 0.15s;
    }

    .filter-close:hover {
      background: var(--lore-color-bg-subtle);
      color: var(--lore-color-text-default);
    }

    .filter-close .material-symbols-outlined {
      font-size: 20px;
    }

    .filter-stats {
      display: flex;
      gap: var(--lore-space-16);
      padding: var(--lore-space-12) var(--lore-space-16);
      border-bottom: 1px solid var(--lore-color-border);
      flex-shrink: 0;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: var(--lore-font-size-lg);
      font-weight: 600;
      color: var(--lore-color-accent);
      font-family: 'JetBrains Mono', monospace;
    }

    .stat-label {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      margin-top: 2px;
    }

    .filter-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--lore-space-12);
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-8);
    }

    .note-item {
      display: flex;
      align-items: flex-start;
      gap: var(--lore-space-12);
      padding: var(--lore-space-12);
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .note-item:hover {
      background: var(--lore-color-bg-surface);
      border-color: var(--lore-color-accent);
    }

    .note-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--lore-color-accent-subtle);
      border-radius: var(--lore-radius-md);
      flex-shrink: 0;
    }

    .note-icon .material-symbols-outlined {
      font-size: 18px;
      color: var(--lore-color-accent);
    }

    .note-content {
      flex: 1;
      min-width: 0;
    }

    .note-title {
      font-size: var(--lore-font-size-sm);
      font-weight: 500;
      color: var(--lore-color-text-default);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .note-path {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      margin-bottom: 4px;
    }

    .note-preview {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted-2);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .note-date {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      font-family: 'JetBrains Mono', monospace;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--lore-space-32);
      text-align: center;
    }

    .empty-state .material-symbols-outlined {
      font-size: 48px;
      color: var(--lore-color-text-muted-2);
      margin-bottom: var(--lore-space-12);
    }

    .empty-title {
      font-size: var(--lore-font-size-base);
      font-weight: 500;
      color: var(--lore-color-text-default);
    }
  `]
})
export class TagFilterComponent implements OnInit {
  private tagService = inject(TagService);
  private shelfService = inject(ShelfService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  selectedTag = signal('');
  close = output<void>();
  selectNote = output<string>();

  filteredNotes = computed(() => {
    const tag = this.selectedTag();
    if (!tag) return [];
    return this.tagService.getNotesByTag(tag);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const tagName = params.get('tagName');
      if (tagName) {
        this.selectedTag.set(tagName);
      }
    });
  }

  onClose(): void {
    this.router.navigate(['/tags']);
  }

  onNoteSelect(noteId: string): void {
    this.router.navigate(['/notes', noteId]);
  }

  setTag(tagName: string): void {
    this.selectedTag.set(tagName);
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
    const shelves = this.shelfService.shelves();
    for (const shelf of shelves) {
      for (const notebook of shelf.notebooks) {
        if (notebook.notes.some(n => n.id === note.id)) {
          return `${shelf.name} › ${notebook.name}`;
        }
      }
    }
    return 'Unknown';
  }

  getPreview(note: Note): string {
    if (!note.content) return 'No content';
    return note.content.substring(0, 80) + (note.content.length > 80 ? '…' : '');
  }
}
