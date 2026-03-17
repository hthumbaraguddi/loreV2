import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppState, Shelf, Notebook, Section, Note } from '../models';
import { DriveService } from './drive.service';

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

  constructor(private drive: DriveService) {}

  uid(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  showToast(message: string): void {
    window.dispatchEvent(new CustomEvent('lore-toast', { detail: message }));
  }

  getState(): AppState {
    return this.state$.getValue();
  }

  /** Load state directly from a plain object (e.g. from Drive) */
  loadFromObject(obj: Partial<AppState>): void {
    const restored: AppState = {
      shelves: Array.isArray(obj.shelves) ? obj.shelves : [],
      notebooks: Array.isArray(obj.notebooks) ? obj.notebooks : [],
      activeNotebookId: obj.activeNotebookId ?? null,
      sidebarCollapsed: typeof obj.sidebarCollapsed === 'boolean' ? obj.sidebarCollapsed : false,
      theme: typeof obj.theme === 'string' ? obj.theme : 'default',
      fontSize: typeof obj.fontSize === 'number' ? obj.fontSize : 14,
    };
    this.state$.next(restored);
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

      // Mirror to Google Drive (debounced) — only when Drive token is available
      if (this.drive.hasToken()) {
        console.log('[Data] scheduling Drive save for user:', username);
        this.drive.scheduleSave({
          state: this.state$.getValue(),
          customTemplates: this.getCustomTemplatesRaw(),
        });
      } else {
        console.log('[Data] no Drive token — saved to localStorage only');
      }
    } catch (e: any) {
      if (e && e.name === 'QuotaExceededError') {
        this.showToast('Storage quota exceeded — changes not saved.');
      } else {
        this.showToast('Failed to save data.');
      }
    }
  }

  private getCustomTemplatesRaw(): any[] {
    try {
      return JSON.parse(localStorage.getItem('lore_custom_templates') || '[]');
    } catch { return []; }
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

  /** Append an already-constructed shelf + notebooks (used by import) */
  appendShelfWithNotebooks(shelf: Shelf, notebooks: Notebook[]): void {
    const s = this.getState();
    this.state$.next({
      ...s,
      shelves: [...s.shelves, shelf],
      notebooks: [...s.notebooks, ...notebooks],
    });
    this.saveAll(this.currentUsername);
  }

  /** Append an already-constructed notebook (used by import) */
  appendNotebook(notebook: Notebook): void {
    const s = this.getState();
    this.state$.next({ ...s, notebooks: [...s.notebooks, notebook] });
    this.saveAll(this.currentUsername);
  }

  /** Seed a demo shelf/notebook so new users see the app in action. */
  seedDemoData(): void {
    const shelf = this.addShelf('🌟 Demo Workspace', '🌟');
    const notebook = this.addNotebook('Lore Showcase', '📓', shelf.id);
    const nbId = notebook.id;

    // ── Section 1: Research Notes (purple) ───────────────────────────────
    const sec1 = this.addSection(nbId, 'Research', 'AI & Machine Learning', 'purple');
    this.addNote(nbId, sec1.id, 'Transformer Architecture Deep Dive', 'research', {
      domain: 'Machine Learning',
      status: 'in-progress',
      hypothesis: 'Attention mechanisms can replace recurrence entirely for sequence modelling tasks.',
      methodology: 'Literature review of "Attention Is All You Need" (Vaswani et al., 2017) and follow-up papers. Implemented a mini transformer on a toy dataset.',
      findings: [
        'Self-attention scales quadratically with sequence length — a key bottleneck.',
        'Positional encodings are critical; learned vs sinusoidal encodings perform similarly.',
        'Multi-head attention allows the model to attend to different representation subspaces simultaneously.',
      ],
      references: [
        { text: 'Attention Is All You Need — Vaswani et al.', url: 'https://arxiv.org/abs/1706.03762' },
        { text: 'The Illustrated Transformer — Jay Alammar', url: 'https://jalammar.github.io/illustrated-transformer/' },
      ],
      conclusion: 'Transformers are now the dominant architecture for NLP and increasingly for vision tasks. Worth investing time in understanding the internals.',
      tags: ['transformers', 'attention', 'NLP', 'deep-learning'],
    });

    // ── Section 2: Daily Journal (teal) ──────────────────────────────────
    const sec2 = this.addSection(nbId, 'Journal', 'Daily reflections', 'teal');
    this.addNote(nbId, sec2.id, 'Monday — Deep Work Session', 'journal', {
      date: '2026-03-16',
      mood: 'Focused 🎯',
      energy: 4,
      intention: 'Ship the Lore demo data and get the app deployed to Azure.',
      gratitude: [
        'Great coffee this morning',
        'Quiet uninterrupted morning block',
        'The Angular build finally compiled cleanly',
      ],
      wins: 'Finished the seed data feature and wired all six templates into the showcase notebook.',
      challenges: 'Spent too long debugging a CSS z-index issue on the edit panel overlay.',
      tomorrowFocus: 'Write the Azure Static Web Apps deployment workflow and test the /lore base href.',
      tags: ['productivity', 'angular', 'lore'],
    });

    // ── Section 3: Financial Log (amber) ─────────────────────────────────
    const sec3 = this.addSection(nbId, 'Finance', 'Monthly tracking', 'amber');
    this.addNote(nbId, sec3.id, 'March 2026 — Monthly Review', 'finance', {
      period: 'March 2026',
      periodType: 'Monthly',
      insight: 'Subscription costs crept up again. Time to audit and cancel unused services.',
      income: [
        { label: 'Salary', amount: 8500 },
        { label: 'Freelance', amount: 1200 },
      ],
      expenses: [
        { label: 'Rent', amount: 2200 },
        { label: 'Groceries', amount: 480 },
        { label: 'Subscriptions', amount: 320 },
        { label: 'Transport', amount: 150 },
        { label: 'Dining out', amount: 290 },
      ],
      savingsGoal: 2000,
      tags: ['budget', 'march', 'review'],
    });

    // ── Section 4: Scrum Standup (blue) ──────────────────────────────────
    const sec4 = this.addSection(nbId, 'Standups', 'Sprint 12', 'blue');
    this.addNote(nbId, sec4.id, 'Sprint 12 — Day 3 Standup', 'scrum', {
      sprint: 'Sprint 12',
      date: '2026-03-16',
      attendees: 'Alice, Bob, Carol, Dave',
      sprintGoal: 'Ship Lore v1.0 to production with all six templates and export/import.',
      yesterday: [
        'Completed seed data implementation',
        'Fixed edit panel z-index bug',
        'Reviewed PR for export service',
      ],
      today: [
        'Deploy to Azure Static Web Apps',
        'Write end-to-end smoke test',
        'Update README with setup instructions',
      ],
      blockers: [],
      actionItems: [
        { task: 'Set up GitHub Actions CI pipeline', owner: 'Alice' },
        { task: 'Configure custom domain on Azure', owner: 'Dave' },
      ],
      tags: ['sprint-12', 'lore', 'deployment'],
    });

    // ── Section 5: What to Watch (coral) ─────────────────────────────────
    const sec5 = this.addSection(nbId, 'Watchlist', 'Weekend picks', 'coral');
    this.addNote(nbId, sec5.id, 'Weekend of March 21', 'watchlist', {
      weekend: 'March 21–22, 2026',
      mood: 'Chill & cerebral 🧠',
      items: [
        { title: 'Dune: Part Two', type: 'Movie', platform: 'Max', rating: '9/10', watched: true },
        { title: 'Severance S2', type: 'Series', platform: 'Apple TV+', rating: '10/10', watched: true },
        { title: 'The Brutalist', type: 'Movie', platform: 'Cinema', rating: '', watched: false },
        { title: 'Shogun', type: 'Series', platform: 'Disney+', rating: '', watched: false },
      ],
      pick: 'Severance S2 — absolutely unmissable.',
      notes: 'Avoid reading any Dune Part Two reviews before watching — spoilers everywhere.',
      tags: ['movies', 'series', 'weekend'],
    });

    // ── Section 6: Investing (green) ─────────────────────────────────────
    const sec6 = this.addSection(nbId, 'Investing', 'Week of Mar 16', 'green');
    this.addNote(nbId, sec6.id, 'Week of March 16, 2026', 'investing', {
      weekOf: '2026-03-16',
      sentiment: 'bull',
      watchlist: [
        { ticker: 'NVDA', price: '875.40', dir: 'up', thesis: 'AI infrastructure spend continues to accelerate; data centre backlog strong.' },
        { ticker: 'MSFT', price: '412.10', dir: 'flat', thesis: 'Copilot monetisation still early; Azure growth solid at 28% YoY.' },
        { ticker: 'INTC', price: '31.20', dir: 'down', thesis: 'Foundry turnaround taking longer than expected; watching for Q1 guidance.' },
      ],
      trades: [
        { ticker: 'NVDA', action: 'BUY', price: '868.00', qty: '5', notes: 'Added on the dip after earnings volatility settled.' },
      ],
      catalysts: [
        'Fed rate decision on March 19 — market pricing in a hold.',
        'NVDA GTC conference keynote — potential new GPU announcement.',
      ],
      portfolioNotes: 'Tech-heavy allocation at 62%. Consider trimming if NVDA runs another 15%.',
      nextWeekFocus: 'Watch Fed statement language closely. Review INTC thesis if it breaks below $30.',
      tags: ['tech', 'AI', 'fed', 'march'],
    });

    // Set the demo notebook as active
    this.setActiveNotebook(nbId);
  }
}
