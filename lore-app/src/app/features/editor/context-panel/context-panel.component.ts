import { Component, input, signal, computed, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShelfService } from '../../../core/services/shelf.service';
import { BacklinksService } from '../../../core/services/backlinks.service';
import { Note } from '../../../core/models/shelf.model';

@Component({
  selector: 'lore-context-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="context-panel">
      <div class="panel-header">
        <h3 class="panel-title">Context</h3>
        <button class="panel-close" (click)="close.emit()" aria-label="Close panel">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="panel-body">
        @if (note()) {
          <!-- Note Stats -->
          <div class="panel-section">
            <div class="section-header">
              <span class="material-symbols-outlined">analytics</span>
              <span class="section-title">Statistics</span>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ wordCount() }}</div>
                <div class="stat-label">Words</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ charCount() }}</div>
                <div class="stat-label">Characters</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ blockCount() }}</div>
                <div class="stat-label">Blocks</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ readTime() }}</div>
                <div class="stat-label">Min read</div>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="panel-section">
            <div class="section-header">
              <span class="material-symbols-outlined">label</span>
              <span class="section-title">Tags</span>
            </div>
            <div class="tags-container">
              @for (tag of tags(); track tag) {
                <div class="tag-chip">
                  <span>{{ tag }}</span>
                  <button class="tag-remove" (click)="removeTag(tag)" aria-label="Remove tag">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              }
              <div class="add-tag-wrapper">
                @if (isAddingTag()) {
                  <input
                    #tagInput
                    type="text"
                    class="tag-input"
                    placeholder="Add tag…"
                    [ngModel]="newTag()"
                    (ngModelChange)="newTag.set($event)"
                    (keydown)="onTagKeydown($event)"
                    (blur)="cancelAddTag()"
                    autofocus
                  />
                } @else {
                  <button class="add-tag-btn" (click)="startAddTag()">
                    <span class="material-symbols-outlined">add</span>
                    <span>Add tag</span>
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Linked Notes -->
          <div class="panel-section">
            <div class="section-header">
              <span class="material-symbols-outlined">link</span>
              <span class="section-title">Linked Notes</span>
              <span class="section-count">{{ linkedNotes().length }}</span>
            </div>
            <div class="linked-list">
              @if (linkedNotes().length > 0) {
                @for (link of linkedNotes(); track link.id) {
                  <button class="linked-item" (click)="navigateToNote.emit(link.id)">
                    <span class="material-symbols-outlined">{{ link.icon }}</span>
                    <div class="linked-content">
                      <div class="linked-title">{{ link.title }}</div>
                      <div class="linked-path">{{ link.path }}</div>
                    </div>
                  </button>
                }
              } @else {
                <div class="empty-state">
                  <span class="material-symbols-outlined">link_off</span>
                  <span>No linked notes</span>
                </div>
              }
            </div>
          </div>

          <!-- Backlinks -->
          <div class="panel-section">
            <div class="section-header">
              <span class="material-symbols-outlined">history</span>
              <span class="section-title">Backlinks</span>
              <span class="section-count">{{ backlinks().length }}</span>
            </div>
            <div class="linked-list">
              @if (backlinks().length > 0) {
                @for (link of backlinks(); track link.id) {
                  <button class="linked-item" (click)="navigateToNote.emit(link.id)">
                    <span class="material-symbols-outlined">{{ link.icon }}</span>
                    <div class="linked-content">
                      <div class="linked-title">{{ link.title }}</div>
                      <div class="linked-path">{{ link.path }}</div>
                    </div>
                  </button>
                }
              } @else {
                <div class="empty-state">
                  <span class="material-symbols-outlined">link_off</span>
                  <span>No backlinks</span>
                </div>
              }
            </div>
          </div>

          <!-- Mini Graph -->
          @if (graphNodes().length > 1) {
            <div class="panel-section">
              <div class="section-header">
                <span class="material-symbols-outlined">hub</span>
                <span class="section-title">Local Graph</span>
              </div>
              <div class="mini-graph-container">
                <svg [attr.viewBox]="'0 0 260 180'" class="mini-graph-svg">
                  <!-- Edges -->
                  @for (edge of graphEdges(); track $index) {
                    <line
                      [attr.x1]="edge.x1"
                      [attr.y1]="edge.y1"
                      [attr.x2]="edge.x2"
                      [attr.y2]="edge.y2"
                      class="graph-edge"
                      [class.edge-backlink]="edge.isBacklink"
                    />
                  }
                  <!-- Nodes -->
                  @for (node of graphNodes(); track node.id) {
                    <g class="graph-node-group" (click)="onGraphNodeClick(node.id)" [class.center-node]="node.isCenter">
                      <circle
                        [attr.cx]="node.x"
                        [attr.cy]="node.y"
                        [attr.r]="node.isCenter ? 8 : 6"
                        [class]="'graph-node node-' + node.type"
                      />
                      <text
                        [attr.x]="node.x"
                        [attr.y]="node.y + (node.isCenter ? 18 : 15)"
                        class="graph-label"
                        [class.center-label]="node.isCenter"
                        text-anchor="middle"
                      >{{ node.label }}</text>
                    </g>
                  }
                </svg>
              </div>
            </div>
          }

          <!-- Unlinked Mentions -->
          @if (unlinkedMentions().length > 0) {
            <div class="panel-section">
              <div class="section-header">
                <span class="material-symbols-outlined">link</span>
                <span class="section-title">Unlinked Mentions</span>
                <span class="section-count">{{ unlinkedMentions().length }}</span>
              </div>
              <div class="linked-list">
                @for (mention of unlinkedMentions(); track mention.noteId) {
                  <div class="linked-item mention-item">
                    <span class="material-symbols-outlined">description</span>
                    <div class="linked-content">
                      <div class="linked-title">{{ mention.noteTitle }}</div>
                      <div class="linked-path">{{ mention.notePath }}</div>
                    </div>
                    <button class="link-btn" (click)="linkMention(mention.noteId)" title="Create link" aria-label="Link this mention">
                      <span class="material-symbols-outlined">add_link</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Note Metadata -->
          <div class="panel-section">
            <div class="section-header">
              <span class="material-symbols-outlined">info</span>
              <span class="section-title">Metadata</span>
            </div>
            <div class="metadata-list">
              <div class="metadata-item">
                <span class="metadata-label">Created</span>
                <span class="metadata-value">{{ note()!.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Updated</span>
                <span class="metadata-value">{{ note()!.updatedAt | date:'mediumDate' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Type</span>
                <span class="metadata-value">{{ note()!.type }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">ID</span>
                <span class="metadata-value metadata-id">{{ note()!.id }}</span>
              </div>
            </div>
          </div>
        } @else {
          <div class="no-note">
            <span class="material-symbols-outlined">note</span>
            <div class="no-note-title">No note selected</div>
            <div class="no-note-hint">Select a note to view context</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .context-panel {
      width: 280px;
      background: var(--lore-color-bg-subtle);
      border-left: 1px solid var(--lore-color-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--lore-space-12) var(--lore-space-16);
      border-bottom: 1px solid var(--lore-color-border);
      flex-shrink: 0;
    }

    .panel-title {
      font-size: var(--lore-font-size-sm);
      font-weight: 600;
      color: var(--lore-color-text-default);
    }

    .panel-close {
      width: 24px;
      height: 24px;
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

    .panel-close:hover {
      background: var(--lore-color-bg-subtle);
      color: var(--lore-color-text-default);
    }

    .panel-close .material-symbols-outlined {
      font-size: 18px;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--lore-space-12);
    }

    .panel-section {
      margin-bottom: var(--lore-space-20);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--lore-space-8);
      margin-bottom: var(--lore-space-10);
    }

    .section-header .material-symbols-outlined {
      font-size: 16px;
      color: var(--lore-color-text-muted);
    }

    .section-title {
      font-size: var(--lore-font-size-xs);
      font-weight: 600;
      color: var(--lore-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-count {
      margin-left: auto;
      font-size: var(--lore-font-size-xs);
      font-family: 'JetBrains Mono', monospace;
      color: var(--lore-color-text-muted-2);
      background: var(--lore-color-bg-surface);
      padding: 2px 6px;
      border-radius: var(--lore-radius-sm);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--lore-space-8);
    }

    .stat-item {
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      padding: var(--lore-space-10);
      text-align: center;
    }

    .stat-value {
      font-size: var(--lore-font-size-lg);
      font-weight: 600;
      color: var(--lore-color-text-default);
      font-family: 'JetBrains Mono', monospace;
    }

    .stat-label {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      margin-top: 2px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--lore-space-6);
    }

    .tag-chip {
      display: flex;
      align-items: center;
      gap: var(--lore-space-4);
      padding: var(--lore-space-4) var(--lore-space-8);
      background: var(--lore-color-accent-subtle);
      border: 1px solid var(--lore-color-accent-light);
      border-radius: var(--lore-radius-sm);
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-accent-dark);
    }

    .tag-remove {
      width: 14px;
      height: 14px;
      border: none;
      background: transparent;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--lore-color-accent-dark);
      opacity: 0.6;
      transition: opacity 0.15s;
      padding: 0;
    }

    .tag-remove:hover {
      opacity: 1;
    }

    .tag-remove .material-symbols-outlined {
      font-size: 12px;
    }

    .add-tag-wrapper {
      display: flex;
      align-items: center;
    }

    .tag-input {
      padding: var(--lore-space-4) var(--lore-space-8);
      border: 1px solid var(--lore-color-accent);
      border-radius: var(--lore-radius-sm);
      font-size: var(--lore-font-size-xs);
      background: var(--lore-color-bg-surface);
      color: var(--lore-color-text-default);
      outline: none;
      min-width: 80px;
    }

    .add-tag-btn {
      display: flex;
      align-items: center;
      gap: var(--lore-space-4);
      padding: var(--lore-space-4) var(--lore-space-8);
      border: 1px dashed var(--lore-color-border);
      border-radius: var(--lore-radius-sm);
      background: transparent;
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }

    .add-tag-btn:hover {
      border-color: var(--lore-color-accent);
      color: var(--lore-color-accent);
    }

    .add-tag-btn .material-symbols-outlined {
      font-size: 14px;
    }

    .linked-list {
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-4);
    }

    .linked-item {
      display: flex;
      align-items: center;
      gap: var(--lore-space-10);
      padding: var(--lore-space-8);
      border: none;
      background: var(--lore-color-bg-surface);
      border-radius: var(--lore-radius-md);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .linked-item:hover {
      background: var(--lore-color-accent-subtle);
    }

    .linked-item .material-symbols-outlined {
      font-size: 18px;
      color: var(--lore-color-text-muted);
      flex-shrink: 0;
    }

    .linked-content {
      flex: 1;
      min-width: 0;
    }

    .linked-title {
      font-size: var(--lore-font-size-sm);
      font-weight: 500;
      color: var(--lore-color-text-default);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .linked-path {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--lore-space-16);
      color: var(--lore-color-text-muted);
      font-size: var(--lore-font-size-sm);
    }

    .empty-state .material-symbols-outlined {
      font-size: 24px;
      margin-bottom: var(--lore-space-8);
      color: var(--lore-color-text-muted-2);
    }

    .metadata-list {
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-8);
    }

    .metadata-item {
      display: flex;
      justify-content: space-between;
      font-size: var(--lore-font-size-sm);
    }

    .metadata-label {
      color: var(--lore-color-text-muted);
    }

    .metadata-value {
      color: var(--lore-color-text-default);
      font-family: 'JetBrains Mono', monospace;
    }

    .metadata-id {
      font-size: var(--lore-font-size-xs);
      color: var(--lore-color-text-muted-2);
    }

    .no-note {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--lore-space-32);
      text-align: center;
    }

    .no-note .material-symbols-outlined {
      font-size: 48px;
      color: var(--lore-color-text-muted-2);
      margin-bottom: var(--lore-space-12);
    }

    .no-note-title {
      font-size: var(--lore-font-size-base);
      font-weight: 500;
      color: var(--lore-color-text-default);
      margin-bottom: var(--lore-space-4);
    }

    .no-note-hint {
      font-size: var(--lore-font-size-sm);
      color: var(--lore-color-text-muted);
    }

    .mention-item {
      position: relative;
    }

    .mention-item .link-btn {
      width: 26px;
      height: 26px;
      border: none;
      background: var(--lore-color-accent-subtle);
      border-radius: var(--lore-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--lore-color-accent);
      flex-shrink: 0;
      transition: all 0.15s;
      opacity: 0;
    }

    .mention-item:hover .link-btn {
      opacity: 1;
    }

    .link-btn:hover {
      background: var(--lore-color-accent);
      color: white;
    }

    .link-btn .material-symbols-outlined {
      font-size: 16px;
    }

    /* Mini Graph Styles */
    .mini-graph-container {
      background: var(--lore-color-bg-surface);
      border: 1px solid var(--lore-color-border);
      border-radius: var(--lore-radius-md);
      padding: var(--lore-space-8);
      overflow: hidden;
    }

    .mini-graph-svg {
      width: 100%;
      height: 180px;
      display: block;
    }

    .graph-edge {
      stroke: var(--lore-color-border);
      stroke-width: 1.5;
      opacity: 0.5;
    }

    .graph-edge.edge-backlink {
      stroke-dasharray: 4 3;
      stroke: var(--lore-color-text-muted);
      opacity: 0.35;
    }

    .graph-node {
      fill: var(--lore-color-accent);
      stroke: var(--lore-color-bg-surface);
      stroke-width: 2;
      transition: r 0.15s, fill 0.15s;
    }

    .graph-node.node-backlink {
      fill: var(--lore-color-text-muted);
    }

    .graph-node-group {
      cursor: pointer;
    }

    .graph-node-group:hover .graph-node {
      r: 9;
      fill: var(--lore-color-accent-dark, var(--lore-color-accent));
    }

    .center-node .graph-node {
      fill: var(--lore-color-accent);
      stroke-width: 3;
    }

    .center-node {
      cursor: default;
    }

    .graph-label {
      font-size: 9px;
      fill: var(--lore-color-text-muted);
      font-family: 'DM Sans', sans-serif;
      pointer-events: none;
    }

    .center-label {
      font-weight: 600;
      fill: var(--lore-color-text-default);
      font-size: 10px;
    }
  `]
})
export class ContextPanelComponent {
  private shelfService = inject(ShelfService);
  private backlinksService = inject(BacklinksService);

  note = input<Note | null>(null);

  close = output<void>();
  navigateToNote = output<string>();
  tagAdded = output<string>();
  tagRemoved = output<string>();

  isAddingTag = signal(false);
  newTag = signal('');

  // Computed stats
  wordCount = computed(() => {
    const n = this.note();
    if (!n || !n.content) return 0;
    return n.content.split(/\s+/).filter(w => w.length > 0).length;
  });

  charCount = computed(() => {
    const n = this.note();
    if (!n || !n.content) return 0;
    return n.content.length;
  });

  blockCount = computed(() => {
    const n = this.note();
    if (!n || !n.blocks) return 0;
    return n.blocks.length;
  });

  readTime = computed(() => {
    const words = this.wordCount();
    return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
  });

  tags = computed(() => {
    const n = this.note();
    return n?.tags || [];
  });

  linkedNotes = computed(() => {
    const n = this.note();
    if (!n || !n.linkedNoteIds || n.linkedNoteIds.length === 0) return [];

    // Get linked notes from ShelfService
    const allNotes = this.shelfService.getAllNotes();
    return n.linkedNoteIds
      .map((linkId: string) => {
        const linked = allNotes.find(note => note.id === linkId);
        if (!linked) return null;
        return {
          id: linked.id,
          title: linked.title || 'Untitled',
          path: this.getNotePath(linked),
          icon: this.getNoteIcon(linked.type)
        };
      })
      .filter((item: { id: string; title: string; path: string; icon: string } | null): item is { id: string; title: string; path: string; icon: string } => item !== null);
  });

  backlinks = computed(() => {
    const n = this.note();
    if (!n) return [];

    // Find all notes that link to this note
    const allNotes = this.shelfService.getAllNotes();
    return allNotes
      .filter(otherNote => {
        if (otherNote.id === n.id) return false;
        return otherNote.linkedNoteIds?.includes(n.id);
      })
      .map(linked => ({
        id: linked.id,
        title: linked.title || 'Untitled',
        path: this.getNotePath(linked),
        icon: this.getNoteIcon(linked.type)
      }));
  });

  unlinkedMentions = computed(() => {
    const n = this.note();
    if (!n) return [];
    return this.backlinksService.findUnlinkedMentions(n.id);
  });

  // Mini graph computed signals
  graphNodes = computed<Array<{ id: string; label: string; type: string; x: number; y: number; isCenter: boolean }>>(() => {
    const linked = this.linkedNotes();
    const backs = this.backlinks();
    const n = this.note();
    if (!n) return [];

    const centerX = 130;
    const centerY = 80;
    const radius = 60;
    const nodes: Array<{ id: string; label: string; type: string; x: number; y: number; isCenter: boolean }> = [];

    // Center node
    nodes.push({
      id: n.id,
      label: this.truncateLabel(n.title || 'Untitled', 14),
      type: n.type,
      x: centerX,
      y: centerY,
      isCenter: true
    });

    // Collect unique neighbor IDs
    const seenIds = new Set<string>([n.id]);
    const neighbors: Array<{ id: string; title: string; type: string; isBacklink: boolean }> = [];

    linked.forEach(l => {
      if (!seenIds.has(l.id)) {
        seenIds.add(l.id);
        neighbors.push({ id: l.id, title: l.title, type: 'link', isBacklink: false });
      }
    });

    backs.forEach(b => {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        neighbors.push({ id: b.id, title: b.title, type: 'backlink', isBacklink: true });
      }
    });

    // Position neighbors radially
    const total = neighbors.length;
    neighbors.forEach((neighbor, i) => {
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      nodes.push({
        id: neighbor.id,
        label: this.truncateLabel(neighbor.title, 12),
        type: neighbor.type,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        isCenter: false
      });
    });

    return nodes;
  });

  graphEdges = computed<Array<{ x1: number; y1: number; x2: number; y2: number; isBacklink: boolean }>>(() => {
    const nodes = this.graphNodes();
    if (nodes.length < 2) return [];

    const center = nodes[0];
    return nodes.slice(1).map(node => ({
      x1: center.x,
      y1: center.y,
      x2: node.x,
      y2: node.y,
      isBacklink: node.type === 'backlink'
    }));
  });

  startAddTag(): void {
    this.isAddingTag.set(true);
    this.newTag.set('');
  }

  cancelAddTag(): void {
    this.isAddingTag.set(false);
    this.newTag.set('');
  }

  onTagKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && this.newTag().trim()) {
      this.addTag(this.newTag().trim());
    } else if (e.key === 'Escape') {
      this.cancelAddTag();
    }
  }

  addTag(tag: string): void {
    if (!tag) return;
    this.tagAdded.emit(tag);
    this.cancelAddTag();
  }

  removeTag(tag: string): void {
    this.tagRemoved.emit(tag);
  }

  linkMention(targetNoteId: string): void {
    const n = this.note();
    if (n) {
      this.backlinksService.addLink(n.id, targetNoteId);
    }
  }

  onGraphNodeClick(nodeId: string): void {
    const n = this.note();
    if (n && nodeId !== n.id) {
      this.navigateToNote.emit(nodeId);
    }
  }

  private truncateLabel(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 1) + '…';
  }

  private getNotePath(note: Note): string {
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
}
