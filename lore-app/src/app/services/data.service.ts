import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppState, Shelf, Notebook, Section, Note } from '../models';

const USERS_KEY = 'lore_users';

const DEFAULT_STATE: AppState = {
  shelves: [],
  notebooks: [],
  activeNotebookId: null,
  sidebarCollapsed: false,
  theme: 'default',
  fontSize: 14,
};

@Injectable({ providedIn: 'root' })
export class DataService {

  state$ = new BehaviorSubject<AppState>({ ...DEFAULT_STATE });

  private currentUsername = '';

  uid(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  showToast(message: string): void {
    window.dispatchEvent(new CustomEvent('lore-toast', { detail: message }));
  }

  getState(): AppState {
    return this.state$.getValue();
  }

  loadAll(username: string): void {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        this.state$.next({ ...DEFAULT_STATE });
        return;
      }

      let users: Record<string, any>;
      try {
        users = JSON.parse(raw);
      } catch {
        this.showToast('Failed to parse saved data — starting fresh.');
        this.state$.next({ ...DEFAULT_STATE });
        return;
      }

      const user = users[username];
      if (!user || !user.data || typeof user.data !== 'object') {
        this.state$.next({ ...DEFAULT_STATE });
        return;
      }

      const restored: AppState = {
        shelves: Array.isArray(user.data.shelves) ? user.data.shelves : [],
        notebooks: Array.isArray(user.data.notebooks) ? user.data.notebooks : [],
        activeNotebookId: user.data.activeNotebookId ?? null,
        sidebarCollapsed: typeof user.data.sidebarCollapsed === 'boolean' ? user.data.sidebarCollapsed : false,
        theme: typeof user.data.theme === 'string' ? user.data.theme : 'default',
        fontSize: typeof user.data.fontSize === 'number' ? user.data.fontSize : 14,
      };

      this.state$.next(restored);
    } catch {
      this.showToast('localStorage is unavailable — running in-memory.');
      this.state$.next({ ...DEFAULT_STATE });
    }
  }

  saveAll(username: string): void {
    try {
      const raw = localStorage.getItem(USERS_KEY) || '{}';
      let users: Record<string, any>;
      try {
        users = JSON.parse(raw);
      } catch {
        users = {};
      }

      if (!users[username]) {
        users[username] = { username, password: '', name: '', data: {} };
      }

      users[username].data = this.state$.getValue();
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e: any) {
      if (e && e.name === 'QuotaExceededError') {
        this.showToast('Storage quota exceeded — changes not saved.');
      } else {
        this.showToast('Failed to save data.');
      }
    }
  }

  // ── User context ──────────────────────────────────────────────────────────

  setCurrentUser(username: string): void {
    this.currentUsername = username;
  }

  updateUserName(name: string): void {
    try {
      const raw = localStorage.getItem(USERS_KEY) || '{}';
      let users: Record<string, any>;
      try { users = JSON.parse(raw); } catch { users = {}; }
      if (users[this.currentUsername]) {
        users[this.currentUsername].name = name;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch {
      // Silently ignore
    }
  }

  // ── Shelf mutations ───────────────────────────────────────────────────────

  addShelf(name: string, icon: string): Shelf {
    const shelf: Shelf = { id: this.uid(), name, icon, open: true };
    const s = this.getState();
    const newState: AppState = { ...s, shelves: [...s.shelves, shelf] };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
    return shelf;
  }

  updateShelf(id: string, name: string, icon: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      shelves: s.shelves.map(sh => sh.id === id ? { ...sh, name, icon } : sh),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  deleteShelf(id: string): void {
    const s = this.getState();
    const removedNotebookIds = s.notebooks
      .filter(nb => nb.shelfId === id)
      .map(nb => nb.id);
    const newState: AppState = {
      ...s,
      shelves: s.shelves.filter(sh => sh.id !== id),
      notebooks: s.notebooks.filter(nb => nb.shelfId !== id),
      activeNotebookId: removedNotebookIds.includes(s.activeNotebookId ?? '')
        ? null
        : s.activeNotebookId,
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  // ── Notebook mutations ────────────────────────────────────────────────────

  addNotebook(name: string, icon: string, shelfId: string): Notebook {
    const notebook: Notebook = { id: this.uid(), name, icon, shelfId, sections: [] };
    const s = this.getState();
    const newState: AppState = { ...s, notebooks: [...s.notebooks, notebook] };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
    return notebook;
  }

  updateNotebook(id: string, name: string, icon: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb => nb.id === id ? { ...nb, name, icon } : nb),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  deleteNotebook(id: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.filter(nb => nb.id !== id),
      activeNotebookId: s.activeNotebookId === id ? null : s.activeNotebookId,
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  // ── Section mutations ─────────────────────────────────────────────────────

  addSection(notebookId: string, title: string, subtitle: string, color: string): Section {
    const section: Section = { id: this.uid(), title, subtitle, color, notes: [] };
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? { ...nb, sections: [...nb.sections, section] }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
    return section;
  }

  updateSection(notebookId: string, sectionId: string, title: string, subtitle: string, color: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sections: nb.sections.map(sec =>
                sec.id === sectionId ? { ...sec, title, subtitle, color } : sec
              ),
            }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  deleteSection(notebookId: string, sectionId: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? { ...nb, sections: nb.sections.filter(sec => sec.id !== sectionId) }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  // ── Note mutations ────────────────────────────────────────────────────────

  addNote(notebookId: string, sectionId: string, title: string, templateId: string, data: Record<string, any>): Note {
    const now = Date.now();
    const note: Note = {
      id: this.uid(),
      title,
      templateId,
      data,
      _collapsed: false,
      createdAt: now,
      updatedAt: now,
    };
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sections: nb.sections.map(sec =>
                sec.id === sectionId
                  ? { ...sec, notes: [...sec.notes, note] }
                  : sec
              ),
            }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
    return note;
  }

  updateNote(notebookId: string, sectionId: string, noteId: string, title: string, templateId: string, data: Record<string, any>): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sections: nb.sections.map(sec =>
                sec.id === sectionId
                  ? {
                      ...sec,
                      notes: sec.notes.map(n =>
                        n.id === noteId
                          ? { ...n, title, templateId, data, updatedAt: Date.now() }
                          : n
                      ),
                    }
                  : sec
              ),
            }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  deleteNote(notebookId: string, sectionId: string, noteId: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sections: nb.sections.map(sec =>
                sec.id === sectionId
                  ? { ...sec, notes: sec.notes.filter(n => n.id !== noteId) }
                  : sec
              ),
            }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  // ── UI state mutations ────────────────────────────────────────────────────

  toggleNoteCollapse(notebookId: string, sectionId: string, noteId: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      notebooks: s.notebooks.map(nb =>
        nb.id === notebookId
          ? {
              ...nb,
              sections: nb.sections.map(sec =>
                sec.id === sectionId
                  ? {
                      ...sec,
                      notes: sec.notes.map(n =>
                        n.id === noteId ? { ...n, _collapsed: !n._collapsed } : n
                      ),
                    }
                  : sec
              ),
            }
          : nb
      ),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  toggleShelf(id: string): void {
    const s = this.getState();
    const newState: AppState = {
      ...s,
      shelves: s.shelves.map(sh => sh.id === id ? { ...sh, open: !sh.open } : sh),
    };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  toggleSidebar(): void {
    const s = this.getState();
    const newState: AppState = { ...s, sidebarCollapsed: !s.sidebarCollapsed };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  setActiveNotebook(id: string | null): void {
    const s = this.getState();
    const newState: AppState = { ...s, activeNotebookId: id };
    this.state$.next(newState);
    this.saveAll(this.currentUsername);
  }

  updateTheme(theme: string): void {
    const s = this.getState();
    this.state$.next({ ...s, theme });
    this.saveAll(this.currentUsername);
  }

  updateFontSize(fontSize: number): void {
    const s = this.getState();
    this.state$.next({ ...s, fontSize });
    this.saveAll(this.currentUsername);
  }
}
