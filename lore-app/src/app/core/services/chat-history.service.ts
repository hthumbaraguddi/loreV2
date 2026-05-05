import { Injectable, signal, Signal } from '@angular/core';
import { ChatSession, ChatMessage } from '../../features/ai-chat/ai-chat.component';

// ── Storage constants ─────────────────────────────────────────────────────────

const SESSIONS_KEY   = 'lore.chat.sessions';
const ACTIVE_KEY     = 'lore.chat.activeSessionId';
/** Maximum number of sessions to keep (oldest pruned first). */
const MAX_SESSIONS   = 50;
/** Maximum messages per session stored (oldest pruned first). */
const MAX_MESSAGES   = 200;

// ── Serialisation helpers ─────────────────────────────────────────────────────

/** Revive Date strings that JSON.parse leaves as strings. */
function reviveSession(raw: unknown): ChatSession {
  const s = raw as ChatSession;
  return {
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    messages: (s.messages ?? []).map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
      // Strip any leftover streaming flag — a reload always means complete
      isStreaming: false,
    })),
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * ChatHistoryService
 *
 * Persists AI chat sessions to localStorage and exposes them as Angular
 * Signals. The component reads from the signals and calls the mutation
 * methods; this service handles all serialisation/deserialisation.
 */
@Injectable({ providedIn: 'root' })
export class ChatHistoryService {

  // ── Private writable signals ──────────────────────────────────────────────

  private readonly _sessions       = signal<ChatSession[]>(this._loadSessions());
  private readonly _activeSessionId = signal<string | null>(this._loadActiveId());

  // ── Public read-only signals ──────────────────────────────────────────────

  readonly sessions:        Signal<ChatSession[]>  = this._sessions.asReadonly();
  readonly activeSessionId: Signal<string | null>  = this._activeSessionId.asReadonly();

  // ── Session CRUD ──────────────────────────────────────────────────────────

  createSession(providerId: string): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      providerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this._sessions.update(list => {
      const next = [session, ...list];
      // Prune oldest sessions beyond the cap
      return next.slice(0, MAX_SESSIONS);
    });

    this._activeSessionId.set(session.id);
    this._persist();
    return session;
  }

  setActiveSession(id: string): void {
    this._activeSessionId.set(id);
    this._persistActiveId();
  }

  deleteSession(id: string): void {
    this._sessions.update(list => list.filter(s => s.id !== id));

    if (this._activeSessionId() === id) {
      const remaining = this._sessions();
      this._activeSessionId.set(remaining[0]?.id ?? null);
      this._persistActiveId();
    }

    this._persist();
  }

  updateTitle(sessionId: string, title: string): void {
    this._sessions.update(list =>
      list.map(s => s.id === sessionId ? { ...s, title } : s)
    );
    this._persist();
  }

  // ── Message mutations ─────────────────────────────────────────────────────

  appendMessage(sessionId: string, msg: ChatMessage): void {
    this._sessions.update(list =>
      list.map(s => {
        if (s.id !== sessionId) return s;
        const messages = [...s.messages, msg].slice(-MAX_MESSAGES);
        return { ...s, messages, updatedAt: new Date() };
      })
    );
    this._persist();
  }

  appendDelta(sessionId: string, msgId: string, delta: string): void {
    this._sessions.update(list =>
      list.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map(m =>
            m.id === msgId ? { ...m, content: m.content + delta } : m
          ),
        };
      })
    );
    // Deltas arrive at high frequency — defer the write to avoid thrashing.
    // The final _persistOnComplete() call will flush the full content.
  }

  patchMessage(sessionId: string, msgId: string, patch: Partial<ChatMessage>): void {
    this._sessions.update(list =>
      list.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map(m =>
            m.id === msgId ? { ...m, ...patch } : m
          ),
        };
      })
    );
    this._persist();
  }

  /** Call this when a streaming response finishes to flush the full content. */
  persistNow(): void {
    this._persist();
  }

  /** Remove every session and reset signals. */
  clearAll(): void {
    this._sessions.set([]);
    this._activeSessionId.set(null);
    this._persist();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _loadSessions(): ChatSession[] {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown[];
      return parsed.map(reviveSession);
    } catch {
      return [];
    }
  }

  private _loadActiveId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  }

  private _persist(): void {
    try {
      // Strip isStreaming before writing — it's transient UI state
      const toStore = this._sessions().map(s => ({
        ...s,
        messages: s.messages.map(({ isStreaming: _s, ...rest }) => rest),
      }));
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(toStore));
      this._persistActiveId();
    } catch (e) {
      // localStorage quota exceeded — silently ignore
      console.warn('ChatHistoryService: failed to persist sessions', e);
    }
  }

  private _persistActiveId(): void {
    try {
      const id = this._activeSessionId();
      if (id) {
        localStorage.setItem(ACTIVE_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch {
      // ignore
    }
  }
}
