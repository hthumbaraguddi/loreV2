import { Component, signal, computed, ChangeDetectionStrategy, HostListener, inject, ElementRef, ViewChild, AfterViewInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShelfService } from '../../../core/services/shelf.service';
import { Note, Shelf } from '../../../core/models/shelf.model';

export interface SearchResult {
  type: 'note' | 'notebook' | 'shelf' | 'tag';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  badgeClass?: string;
  path?: string;
}

@Component({
  selector: 'lore-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-overlay" (click)="close.emit()" role="dialog" aria-modal="true" aria-label="Global search">
      <div class="search-container" (click)="$event.stopPropagation()">
        <div class="search-header">
          <div class="search-input-wrapper">
            <span class="search-icon material-symbols-outlined">search</span>
            <input
              #searchInput
              type="text"
              class="search-input"
              placeholder="Search notes, notebooks, tags…"
              [ngModel]="query()"
              (ngModelChange)="onQueryChange($event)"
              (keydown)="onKeydown($event)"
              autofocus
            />
            @if (query()) {
              <button class="clear-btn" (click)="clearQuery()" aria-label="Clear search">
                <span class="material-symbols-outlined">close</span>
              </button>
            }
          </div>
          <div class="search-shortcut">
            <kbd>ESC</kbd> to close
          </div>
        </div>

        <div class="search-body">
          @if (query().length > 0) {
            <div class="search-filters">
              <button
                class="filter-chip"
                [class.active]="filter() === 'all'"
                (click)="filter.set('all')"
              >
                All
              </button>
              <button
                class="filter-chip"
                [class.active]="filter() === 'notes'"
                (click)="filter.set('notes')"
              >
                Notes
              </button>
              <button
                class="filter-chip"
                [class.active]="filter() === 'notebooks'"
                (click)="filter.set('notebooks')"
              >
                Notebooks
              </button>
              <button
                class="filter-chip"
                [class.active]="filter() === 'tags'"
                (click)="filter.set('tags')"
              >
                Tags
              </button>
            </div>
          }

          <div class="search-results">
            @if (isLoading()) {
              <div class="search-loading">
                <div class="spinner"></div>
                <span>Searching…</span>
              </div>
            } @else if (results().length > 0) {
              @for (result of results(); track result.id; let i = $index) {
                <button
                  class="result-item"
                  [class.highlighted]="i === activeIndex()"
                  (click)="selectResult(result)"
                  (mouseenter)="activeIndex.set(i)"
                >
                  <div class="result-icon" [ngClass]="result.badgeClass">
                    <span class="material-symbols-outlined">{{ result.icon }}</span>
                  </div>
                  <div class="result-content">
                    <div class="result-title">{{ result.title }}</div>
                    <div class="result-subtitle">{{ result.subtitle }}</div>
                    @if (result.path) {
                      <div class="result-path">{{ result.path }}</div>
                    }
                  </div>
                  @if (result.badge) {
                    <div class="result-badge" [ngClass]="result.badgeClass">{{ result.badge }}</div>
                  }
                </button>
              }
            } @else if (query().length > 0) {
              <div class="search-empty">
                <span class="material-symbols-outlined">search_off</span>
                <div class="empty-title">No results found</div>
                <div class="empty-subtitle">Try a different search term or check your filters</div>
              </div>
            } @else {
              <div class="search-placeholder">
                <span class="material-symbols-outlined">search</span>
                <div class="placeholder-title">Start typing to search</div>
                <div class="placeholder-hint">Search across all notes, notebooks, and tags</div>
              </div>
            }
          </div>

          @if (query().length === 0) {
            <div class="search-footer">
              <div class="footer-hint">
                <span class="material-symbols-outlined">keyboard</span>
                <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-overlay {
      position: fixed;
      inset: 0;
      background: rgba(28, 24, 41, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 120px;
      z-index: 9999;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .search-container {
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-xl);
      box-shadow: var(--lore-shadow-float);
      width: 560px;
      max-height: 520px;
      overflow: hidden;
      animation: slideIn 0.2s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .search-header {
      display: flex;
      align-items: center;
      gap: var(--lore-space-12);
      padding: var(--lore-space-16);
      border-bottom: 1px solid var(--lore-color-border);
    }

    .search-input-wrapper {
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

    .search-input-wrapper:focus-within {
      background: var(--lore-color-bg-surface);
      border-color: var(--lore-color-accent);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }

    .search-icon {
      font-size: 18px;
      color: var(--lore-color-text-muted);
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: var(--lore-font-size-base);
      font-weight: 500;
      color: var(--lore-color-text-default);
      outline: none;
    }

    .search-input::placeholder {
      color: var(--lore-color-text-muted-2);
      font-weight: 400;
    }

    .clear-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: var(--lore-color-text-muted);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      padding: 0;
    }

    .clear-btn:hover {
      background: var(--lore-color-text-muted-2);
    }

    .clear-btn .material-symbols-outlined {
      font-size: 14px;
      color: var(--lore-color-bg-surface);
    }

    .search-shortcut {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      white-space: nowrap;
    }

    .search-shortcut kbd {
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: 3px;
      padding: 2px 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
    }

    .search-body {
      max-height: 420px;
      overflow-y: auto;
    }

    .search-filters {
      display: flex;
      gap: var(--lore-space-6);
      padding: var(--lore-space-10) var(--lore-space-16);
      border-bottom: 1px solid var(--lore-color-border);
    }

    .filter-chip {
      padding: var(--lore-space-4) var(--lore-space-12);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-sm);
      background: transparent;
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-chip:hover {
      background: var(--lore-color-bg-subtle);
      color: var(--lore-color-text-default);
    }

    .filter-chip.active {
      background: var(--lore-color-accent);
      border-color: var(--lore-color-accent);
      color: white;
    }

    .search-results {
      padding: var(--lore-space-8);
    }

    .result-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--lore-space-12);
      padding: var(--lore-space-10) var(--lore-space-12);
      border: none;
      background: transparent;
      border-radius: var(--lore-radius-md);
      cursor: pointer;
      text-align: left;
      transition: all 0.1s;
    }

    .result-item:hover,
    .result-item.highlighted {
      background: var(--lore-color-accent-subtle);
    }

    .result-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--lore-color-bg-subtle);
      border-radius: var(--lore-radius-md);
      flex-shrink: 0;
    }

    .result-icon .material-symbols-outlined {
      font-size: 20px;
      color: var(--lore-color-text-muted);
    }

    .result-item.highlighted .result-icon,
    .result-item:hover .result-icon {
      background: var(--lore-color-accent);
    }

    .result-item.highlighted .result-icon .material-symbols-outlined,
    .result-item:hover .result-icon .material-symbols-outlined {
      color: white;
    }

    .result-content {
      flex: 1;
      min-width: 0;
    }

    .result-title {
      font-size: var(--lore-font-size-sm);
      font-weight: 500;
      color: var(--lore-color-text-default);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-subtitle {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-path {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted-2);
      margin-top: 2px;
    }

    .result-badge {
      font-size: var(--lore-font-size-xs);
      font-weight: 600;
      padding: var(--lore-space-2) var(--lore-space-8);
      border-radius: var(--lore-radius-sm);
      flex-shrink: 0;
    }

    .badge-research { background: var(--lore-color-teal-bg); color: var(--lore-color-teal); }
    .badge-journal { background: var(--lore-color-amber-bg); color: var(--lore-color-amber); }
    .badge-task { background: var(--lore-color-blue-bg); color: var(--lore-color-blue); }
    .badge-idea { background: var(--lore-color-rose-bg); color: var(--lore-color-rose); }
    .badge-reference { background: var(--lore-color-accent-subtle); color: var(--lore-color-accent-dark); }

    .search-loading,
    .search-empty,
    .search-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--lore-space-32);
      text-align: center;
    }

    .search-loading .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--lore-color-border);
      border-top-color: var(--lore-color-accent);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .search-loading span {
      margin-top: var(--lore-space-12);
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-muted);
    }

    .search-empty .material-symbols-outlined,
    .search-placeholder .material-symbols-outlined {
      font-size: 48px;
      color: var(--lore-color-text-muted-2);
      margin-bottom: var(--lore-space-12);
    }

    .empty-title,
    .placeholder-title {
      font-size: var(--lore-font-size-base);
      font-weight: 500;
      color: var(--lore-color-text-default);
      margin-bottom: var(--lore-space-4);
    }

    .empty-subtitle,
    .placeholder-hint {
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-muted);
    }

    .search-footer {
      padding: var(--lore-space-12) var(--lore-space-16);
      border-top: 1px solid var(--lore-color-border);
    }

    .footer-hint {
      display: flex;
      align-items: center;
      gap: var(--lore-space-8);
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted-2);
    }

    .footer-hint .material-symbols-outlined {
      font-size: 16px;
    }

    .footer-hint kbd {
      background: var(--lore-color-bg-subtle);
      border: 1px solid var(--lore-color-border);
      border-radius: 3px;
      padding: 2px 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
    }
  `]
})
export class GlobalSearchComponent implements AfterViewInit {
  private shelfService = inject(ShelfService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  close = output<void>();

  query = signal('');
  filter = signal<'all' | 'notes' | 'notebooks' | 'tags'>('all');
  activeIndex = signal(0);
  isLoading = signal(false);

  private searchTimeout: any;

  allNotes = computed(() => this.shelfService.getAllNotes());
  allShelves = computed(() => this.shelfService.shelves());

  results = computed(() => {
    const q = this.query().toLowerCase().trim();
    const f = this.filter();

    if (!q) return [];

    const results: SearchResult[] = [];

    // Search notes
    if (f === 'all' || f === 'notes') {
      const notes = this.allNotes().filter(note =>
        note.title?.toLowerCase().includes(q) ||
        note.content?.toLowerCase().includes(q) ||
        note.tags?.some(tag => tag.toLowerCase().includes(q))
      ).slice(0, 10);

      notes.forEach(note => {
        results.push({
          type: 'note',
          id: note.id,
          title: note.title || 'Untitled',
          subtitle: this.getNotePreview(note),
          icon: this.getNoteIcon(note.type),
          badge: note.type,
          badgeClass: this.getBadgeClass(note.type),
          path: this.getNotePath(note)
        });
      });
    }

    // Search notebooks
    if (f === 'all' || f === 'notebooks') {
      const notebooks = this.findNotebooks(q);
      notebooks.forEach(nb => {
        results.push({
          type: 'notebook',
          id: nb.id,
          title: nb.name,
          subtitle: `${nb.notes.length} notes`,
          icon: 'folder',
          path: nb.path
        });
      });
    }

    // Search tags
    if (f === 'all' || f === 'tags') {
      const tags = this.findTags(q);
      tags.forEach(tag => {
        results.push({
          type: 'tag',
          id: tag.name,
          title: tag.name,
          subtitle: `${tag.count} notes`,
          icon: 'label',
          badge: tag.count.toString()
        });
      });
    }

    return results.slice(0, 15);
  });

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 50);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  clearQuery(): void {
    this.query.set('');
    this.activeIndex.set(0);
    this.searchInput?.nativeElement?.focus();
  }

  onKeydown(e: KeyboardEvent): void {
    const len = this.results().length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex.update(i => (i + 1) % len);
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.update(i => (i - 1 + len) % len);
    }
    else if (e.key === 'Enter' && len > 0) {
      e.preventDefault();
      const result = this.results()[this.activeIndex()];
      if (result) this.selectResult(result);
    }
    else if (e.key === 'Escape') {
      this.close.emit();
    }
  }

  selectResult(result: SearchResult): void {
    if (result.type === 'note') {
      // Navigate to the note
      this.router.navigate(['/app/notes', result.id]);
    } else if (result.type === 'notebook') {
      // Navigate to notebook (could open in grid view)
      this.router.navigate(['/app/notebook', result.id]);
    } else if (result.type === 'tag') {
      // Navigate to tag search
      this.router.navigate(['/app/tags', result.id]);
    }
    this.close.emit();
  }

  private getNotePreview(note: Note): string {
    if (!note.content) return 'No content';
    return note.content.substring(0, 60) + (note.content.length > 60 ? '…' : '');
  }

  private getNoteIcon(type: string): string {
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

  private getBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'research': 'badge-research',
      'journal': 'badge-journal',
      'task': 'badge-task',
      'idea': 'badge-idea',
      'reference': 'badge-reference',
      'html': 'badge-reference'
    };
    return classes[type] || 'badge-reference';
  }

  private getNotePath(note: Note): string {
    const shelves = this.allShelves();
    for (const shelf of shelves) {
      for (const notebook of shelf.notebooks) {
        if (notebook.notes.some(n => n.id === note.id)) {
          return `${shelf.name} › ${notebook.name}`;
        }
      }
    }
    return '';
  }

  private findNotebooks(query: string): Array<{ id: string; name: string; notes: any[]; path: string }> {
    const results: Array<{ id: string; name: string; notes: any[]; path: string }> = [];
    const shelves = this.allShelves();

    for (const shelf of shelves) {
      for (const notebook of shelf.notebooks) {
        if (notebook.name.toLowerCase().includes(query)) {
          results.push({
            id: notebook.id,
            name: notebook.name,
            notes: notebook.notes,
            path: shelf.name
          });
        }
      }
    }

    return results.slice(0, 5);
  }

  private findTags(query: string): Array<{ name: string; count: number }> {
    const tagCounts = new Map<string, number>();
    const notes = this.allNotes();

    for (const note of notes) {
      if (note.tags) {
        for (const tag of note.tags) {
          if (tag.toLowerCase().includes(query)) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        }
      }
    }

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
