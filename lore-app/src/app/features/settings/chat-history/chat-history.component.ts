import {
  Component, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatHistoryService } from '../../../core/services/chat-history.service';
import { PROVIDER_MAP } from '../../../core/config/provider-registry';
import { ChatSession, ChatMessage } from '../../ai-chat/ai-chat.component';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-history.component.html',
  styleUrl: './chat-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHistoryComponent {

  readonly history = inject(ChatHistoryService);

  // ── UI state ──────────────────────────────────────────────────────────────

  /** Which session is expanded in the detail view */
  readonly expandedSessionId = signal<string | null>(null);

  /** Search / filter query */
  readonly searchQuery = signal<string>('');

  /** Provider filter — empty string = all */
  readonly providerFilter = signal<string>('');

  /** Folder save status: idle | saving | done | error */
  readonly saveStatus = signal<'idle' | 'saving' | 'done' | 'error'>('idle');

  /** Last saved folder path (display only) */
  readonly savedFolderPath = signal<string | null>(null);

  /** Whether the File System Access API is available in this browser */
  readonly fsPicker = typeof (window as any).showDirectoryPicker === 'function';

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly filteredSessions = computed(() => {
    const q     = this.searchQuery().toLowerCase().trim();
    const prov  = this.providerFilter();
    return this.history.sessions().filter(s => {
      const matchesProv  = !prov || s.providerId === prov;
      const matchesQuery = !q
        || s.title.toLowerCase().includes(q)
        || s.messages.some(m => m.content.toLowerCase().includes(q));
      return matchesProv && matchesQuery;
    });
  });

  readonly expandedSession = computed<ChatSession | null>(() => {
    const id = this.expandedSessionId();
    return id ? (this.history.sessions().find(s => s.id === id) ?? null) : null;
  });

  readonly totalMessages = computed(() =>
    this.history.sessions().reduce((n, s) => n + s.messages.length, 0)
  );

  readonly uniqueProviders = computed(() => {
    const ids = new Set(this.history.sessions().map(s => s.providerId));
    return [...ids].map(id => ({
      id,
      name: PROVIDER_MAP.get(id)?.displayName ?? id,
    }));
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  toggleExpand(id: string): void {
    this.expandedSessionId.update(cur => cur === id ? null : id);
  }

  deleteSession(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Delete this chat session? This cannot be undone.')) return;
    if (this.expandedSessionId() === id) this.expandedSessionId.set(null);
    this.history.deleteSession(id);
  }

  clearAll(): void {
    if (!confirm('Delete ALL chat history? This cannot be undone.')) return;
    this.expandedSessionId.set(null);
    this.history.clearAll();
  }

  /** Export a single session as a Markdown file */
  exportSession(session: ChatSession, event: Event): void {
    event.stopPropagation();
    const md = this._sessionToMarkdown(session);
    this._downloadText(md, `${this._safeFilename(session.title)}.md`);
  }

  /** Export all sessions as one Markdown file */
  exportAll(): void {
    const md = this.history.sessions()
      .map(s => this._sessionToMarkdown(s))
      .join('\n\n---\n\n');
    this._downloadText(md, 'lore-chat-history.md');
  }

  /**
   * Open a folder picker and write each session as a Markdown file.
   * Works entirely in the component — no pre-configured folder required.
   */
  async saveToFolder(): Promise<void> {
    if (!this.fsPicker) {
      // Fallback: download a single combined Markdown file
      this.exportAll();
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (window as any).showDirectoryPicker({
        id: 'lore-chat-history',
        mode: 'readwrite',
        startIn: 'documents',
      });
    } catch (e: any) {
      // User cancelled — do nothing
      if (e?.name === 'AbortError') return;
      this.saveStatus.set('error');
      return;
    }

    this.saveStatus.set('saving');

    try {
      const sessions = this.history.sessions();
      for (const session of sessions) {
        const safeName = this._safeFilename(session.title) + '-' + session.id.slice(0, 8);
        const fileHandle = await dirHandle.getFileHandle(`${safeName}.md`, { create: true });
        const writable   = await fileHandle.createWritable();
        await writable.write(this._sessionToMarkdown(session));
        await writable.close();
      }

      // Show the folder name as confirmation
      this.savedFolderPath.set(dirHandle.name);
      this.saveStatus.set('done');

      // Reset status after 3 s
      setTimeout(() => this.saveStatus.set('idle'), 3000);
    } catch (e: any) {
      console.error('Chat history save failed', e);
      this.saveStatus.set('error');
      setTimeout(() => this.saveStatus.set('idle'), 4000);
    }
  }

  /** Save a single session to a folder the user picks */
  async saveSessionToFolder(session: ChatSession, event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.fsPicker) {
      this.exportSession(session, event);
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (window as any).showDirectoryPicker({
        id: 'lore-chat-history',
        mode: 'readwrite',
        startIn: 'documents',
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      return;
    }

    try {
      const safeName   = this._safeFilename(session.title) + '-' + session.id.slice(0, 8);
      const fileHandle = await dirHandle.getFileHandle(`${safeName}.md`, { create: true });
      const writable   = await fileHandle.createWritable();
      await writable.write(this._sessionToMarkdown(session));
      await writable.close();
    } catch (e: any) {
      console.error('Session save failed', e);
    }
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  providerName(id: string): string {
    return PROVIDER_MAP.get(id)?.displayName ?? id;
  }

  providerColor(id: string): string {
    switch (id) {
      case 'anthropic': return 'var(--lore-primitive-purple-600)';
      case 'openai':    return '#10A37F';
      case 'google':    return '#4285F4';
      case 'groq':      return '#F55036';
      default:          return 'var(--lore-primitive-purple-600)';
    }
  }

  providerInitial(id: string): string {
    return this.providerName(id).charAt(0).toUpperCase();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  messageCount(session: ChatSession): string {
    const n = session.messages.length;
    return `${n} message${n !== 1 ? 's' : ''}`;
  }

  userTurns(session: ChatSession): number {
    return session.messages.filter(m => m.role === 'user').length;
  }

  /** First user message as a preview snippet */
  preview(session: ChatSession): string {
    const first = session.messages.find(m => m.role === 'user');
    if (!first) return '—';
    return first.content.length > 120
      ? first.content.slice(0, 120) + '…'
      : first.content;
  }

  /** First model used in a session */
  firstModel(session: ChatSession): string {
    return session.messages.length > 0 ? session.messages[0].model : '—';
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _sessionToMarkdown(session: ChatSession): string {
    const header = [
      `# ${session.title}`,
      `**Provider:** ${this.providerName(session.providerId)}`,
      `**Created:** ${this.formatDateTime(session.createdAt)}`,
      `**Messages:** ${session.messages.length}`,
      '',
    ].join('\n');

    const body = session.messages.map(m => {
      const role = m.role === 'user' ? '**You**' : `**${this.providerName(m.providerId)}**`;
      const time = this.formatDateTime(m.timestamp);
      return `${role} _(${time})_\n\n${m.content}`;
    }).join('\n\n---\n\n');

    return header + body;
  }

  private _safeFilename(title: string): string {
    return title.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '-').toLowerCase() || 'chat';
  }

  private _downloadText(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
