import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TagService, TagInfo } from '../../../core/services/tag.service';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'lore-tags-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tags-browser">
      <div class="browser-header">
        <div class="header-content">
          <h1 class="page-title">Tags</h1>
          <p class="page-subtitle">Browse and manage all tags across your notes</p>
        </div>
        <div class="header-stats">
          <div class="stat">
            <div class="stat-value">{{ allTags().length }}</div>
            <div class="stat-label">Tags</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ totalNotes() }}</div>
            <div class="stat-label">Notes</div>
          </div>
        </div>
      </div>

      <div class="browser-controls">
        <div class="search-box">
          <span class="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search tags…"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>
        <div class="view-toggle">
          <button
            class="toggle-btn"
            [class.active]="viewMode() === 'grid'"
            (click)="viewMode.set('grid')"
            title="Grid view"
          >
            <span class="material-symbols-outlined">grid_view</span>
          </button>
          <button
            class="toggle-btn"
            [class.active]="viewMode() === 'list'"
            (click)="viewMode.set('list')"
            title="List view"
          >
            <span class="material-symbols-outlined">list</span>
          </button>
        </div>
      </div>

      <div class="browser-body">
        @if (filteredTags().length > 0) {
          @if (viewMode() === 'grid') {
            <div class="tags-grid">
              @for (tag of filteredTags(); track tag.name) {
                <button class="tag-card" (click)="selectTag(tag.name)">
                  <div class="tag-card-header">
                    <div class="tag-name">{{ tag.name }}</div>
                    <div class="tag-count">{{ tag.count }}</div>
                  </div>
                  <div class="tag-card-body">
                    <div class="tag-preview">
                      @for (note of tag.notes.slice(0, 3); track note.id) {
                        <div class="preview-item">
                          <span class="material-symbols-outlined">{{ getNoteIcon(note.type) }}</span>
                          <span class="preview-title">{{ note.title || 'Untitled' }}</span>
                        </div>
                      }
                      @if (tag.notes.length > 3) {
                        <div class="preview-more">+{{ tag.notes.length - 3 }} more</div>
                      }
                    </div>
                  </div>
                  <div class="tag-card-footer">
                    <button class="tag-action" (click)="editTag($event, tag.name)">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="tag-action delete" (click)="deleteTag($event, tag.name)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="tags-list">
              @for (tag of filteredTags(); track tag.name) {
                <div class="tag-row">
                  <button class="tag-row-main" (click)="selectTag(tag.name)">
                    <div class="tag-row-name">{{ tag.name }}</div>
                    <div class="tag-row-notes">
                      @for (note of tag.notes.slice(0, 2); track note.id) {
                        <span class="note-badge">{{ note.title || 'Untitled' }}</span>
                      }
                      @if (tag.notes.length > 2) {
                        <span class="note-badge more">+{{ tag.notes.length - 2 }}</span>
                      }
                    </div>
                  </button>
                  <div class="tag-row-count">{{ tag.count }}</div>
                  <div class="tag-row-actions">
                    <button class="tag-action" (click)="editTag($event, tag.name)">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="tag-action delete" (click)="deleteTag($event, tag.name)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        } @else {
          <div class="empty-state">
            <span class="material-symbols-outlined">label_off</span>
            <div class="empty-title">No tags found</div>
            <div class="empty-hint">
              @if (searchQuery()) {
                Try a different search term
              } @else {
                Start adding tags to your notes to see them here
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tags-browser {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--lore-color-bg-surface);
    }

    .browser-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--lore-space-24) var(--lore-space-32);
      border-bottom: 1px solid var(--lore-color-border);
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: var(--lore-font-size-2xl);
      font-weight: 600;
      color: var(--lore-color-text-default);
      margin: 0 0 var(--lore-space-4) 0;
    }

    .page-subtitle {
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-muted);
      margin: 0;
    }

    .header-stats {
      display: flex;
      gap: var(--lore-space-24);
      margin-left: var(--lore-space-32);
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: var(--lore-font-size-2xl);
      font-weight: 600;
      color: var(--lore-color-accent);
      font-family: 'JetBrains Mono', monospace;
    }

    .stat-label {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      margin-top: 2px;
    }

    .browser-controls {
      display: flex;
      align-items: center;
      gap: var(--lore-space-16);
      padding: var(--lore-space-16) var(--lore-space-32);
      border-bottom: 1px solid var(--lore-color-border);
    }

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--lore-space-10);
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      padding: var(--lore-space-8) var(--lore-space-12);
      transition: all 0.15s;
    }

    .search-box:focus-within {
      background: var(--lore-color-bg-surface);
      border-color: var(--lore-color-accent);
    }

    .search-box .material-symbols-outlined {
      font-size: 18px;
      color: var(--lore-color-text-muted);
      flex-shrink: 0;
    }

    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-default);
      outline: none;
    }

    .search-box input::placeholder {
      color: var(--lore-color-text-muted-2);
    }

    .view-toggle {
      display: flex;
      gap: var(--lore-space-4);
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      padding: var(--lore-space-4);
    }

    .toggle-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: var(--lore-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--lore-color-text-muted);
      transition: all 0.15s;
    }

    .toggle-btn:hover {
      background: var(--lore-color-bg-surface);
      color: var(--lore-color-text-default);
    }

    .toggle-btn.active {
      background: var(--lore-color-accent);
      color: white;
    }

    .toggle-btn .material-symbols-outlined {
      font-size: 18px;
    }

    .browser-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--lore-space-24) var(--lore-space-32);
    }

    .tags-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--lore-space-16);
    }

    .tag-card {
      display: flex;
      flex-direction: column;
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-lg);
      padding: var(--lore-space-16);
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .tag-card:hover {
      background: var(--lore-color-bg-surface);
      border-color: var(--lore-color-accent);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
    }

    .tag-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--lore-space-12);
    }

    .tag-name {
      font-size: var(--lore-font-size-base);
      font-weight: 600;
      color: var(--lore-color-text-default);
    }

    .tag-count {
      font-size: var(--lore-font-size-sm);
      font-weight: 600;
      background: var(--lore-color-accent-subtle);
      color: var(--lore-color-accent-dark);
      padding: var(--lore-space-2) var(--lore-space-8);
      border-radius: var(--lore-radius-sm);
      font-family: 'JetBrains Mono', monospace;
    }

    .tag-card-body {
      flex: 1;
      margin-bottom: var(--lore-space-12);
    }

    .tag-preview {
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-6);
    }

    .preview-item {
      display: flex;
      align-items: center;
      gap: var(--lore-space-8);
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
    }

    .preview-item .material-symbols-outlined {
      font-size: 14px;
      flex-shrink: 0;
    }

    .preview-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-more {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted-2);
      font-style: italic;
    }

    .tag-card-footer {
      display: flex;
      gap: var(--lore-space-8);
    }

    .tag-action {
      flex: 1;
      padding: var(--lore-space-6) var(--lore-space-10);
      border: 1px solid var(--lore-color-border);
      background: transparent;
      border-radius: var(--lore-radius-sm);
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--lore-space-4);
    }

    .tag-action:hover {
      background: var(--lore-color-bg-surface);
      color: var(--lore-color-text-default);
    }

    .tag-action.delete:hover {
      border-color: var(--lore-color-red);
      color: var(--lore-color-red);
    }

    .tag-action .material-symbols-outlined {
      font-size: 14px;
    }

    .tags-list {
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-8);
    }

    .tag-row {
      display: flex;
      align-items: center;
      gap: var(--lore-space-12);
      padding: var(--lore-space-12);
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      transition: all 0.15s;
    }

    .tag-row:hover {
      background: var(--lore-color-bg-surface);
      border-color: var(--lore-color-accent);
    }

    .tag-row-main {
      flex: 1;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-6);
    }

    .tag-row-name {
      font-size: var(--lore-font-size-base);
      font-weight: 600;
      color: var(--lore-color-text-default);
    }

    .tag-row-notes {
      display: flex;
      gap: var(--lore-space-6);
      flex-wrap: wrap;
    }

    .note-badge {
      font-size: var(--lore-font-size-xs);
      background: var(--lore-color-accent-subtle);
      color: var(--lore-color-accent-dark);
      padding: var(--lore-space-2) var(--lore-space-6);
      border-radius: var(--lore-radius-sm);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    .note-badge.more {
      background: var(--lore-color-bg-subtle);
      color: var(--lore-color-text-muted);
    }

    .tag-row-count {
      font-size: var(--lore-font-size-sm);
      font-weight: 600;
      color: var(--lore-color-accent);
      font-family: 'JetBrains Mono', monospace;
      min-width: 40px;
      text-align: right;
    }

    .tag-row-actions {
      display: flex;
      gap: var(--lore-space-6);
    }

    .tag-row-actions .tag-action {
      width: 32px;
      height: 32px;
      padding: 0;
      flex: none;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--lore-space-48);
      text-align: center;
    }

    .empty-state .material-symbols-outlined {
      font-size: 64px;
      color: var(--lore-color-text-muted-2);
      margin-bottom: var(--lore-space-16);
    }

    .empty-title {
      font-size: var(--lore-font-size-lg);
      font-weight: 600;
      color: var(--lore-color-text-default);
      margin-bottom: var(--lore-space-8);
    }

    .empty-hint {
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-muted);
    }
  `]
})
export class TagsBrowserComponent {
  private tagService = inject(TagService);
  private router = inject(Router);

  searchQuery = signal('');
  viewMode = signal<'grid' | 'list'>('grid');

  allTags = computed(() => this.tagService.getTags());

  filteredTags = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.allTags();
    return this.allTags().filter(tag =>
      tag.name.toLowerCase().includes(query)
    );
  });

  totalNotes = computed(() => {
    return this.allTags().reduce((sum, tag) => sum + tag.count, 0);
  });

  selectTag(tagName: string): void {
    // Navigate to tag search or filter view
    this.router.navigate(['/app/tags', tagName]);
  }

  editTag(event: Event, tagName: string): void {
    event.stopPropagation();
    // TODO: Open tag edit modal
    console.log('Edit tag:', tagName);
  }

  deleteTag(event: Event, tagName: string): void {
    event.stopPropagation();
    if (confirm(`Delete tag "${tagName}" from all notes?`)) {
      this.tagService.deleteTag(tagName);
    }
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
}
