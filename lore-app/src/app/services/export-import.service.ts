import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Shelf, Notebook, Section, Note, CustomTemplate } from '../models';

// ── Serialised shapes ─────────────────────────────────────────────────────────

export interface ShelfExport {
  _type: 'shelf';
  shelf: Shelf;
  notebooks: NotebookExport[];
}

export interface NotebookExport {
  _type: 'notebook';
  notebook: Notebook;
}

export interface TemplateExport {
  _type: 'template';
  template: CustomTemplate;
}

const CUSTOM_TEMPLATES_KEY = 'lore_custom_templates';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export';
}

function triggerDownload(json: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ExportImportService {

  constructor(private data: DataService) {}

  // ── Export ──────────────────────────────────────────────────────────────────

  /** Serialise shelf + all notebooks/sections/notes → browser download */
  exportShelf(shelf: Shelf): void {
    const state = this.data.getState();
    const notebooks = state.notebooks
      .filter(nb => nb.shelfId === shelf.id)
      .map(nb => ({ _type: 'notebook' as const, notebook: nb }));

    const payload: ShelfExport = { _type: 'shelf', shelf, notebooks };
    const filename = `shelf-${slugify(shelf.name)}-${todayStr()}.json`;
    triggerDownload(payload, filename);
  }

  /** Serialise notebook + sections/notes → browser download */
  exportNotebook(notebook: Notebook): void {
    const payload: NotebookExport = { _type: 'notebook', notebook };
    const filename = `notebook-${slugify(notebook.name)}-${todayStr()}.json`;
    triggerDownload(payload, filename);
  }

  /** Serialise custom template → browser download */
  exportTemplate(template: CustomTemplate): void {
    const payload: TemplateExport = { _type: 'template', template };
    const filename = `template-${slugify(template.name)}-${todayStr()}.json`;
    triggerDownload(payload, filename);
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  /**
   * Validate shelf JSON, reassign all ids, append to shelves array.
   * Returns the newly created shelf id on success.
   */
  importShelf(json: unknown): string {
    if (!this._isShelfExport(json)) {
      this.data.showToast('Import failed: invalid shelf file structure.');
      throw new Error('Invalid shelf export structure');
    }

    const { shelf: srcShelf, notebooks: srcNotebooks } = json;

    // Reassign shelf id
    const newShelfId = this.data.uid();
    const newShelf: Shelf = { ...srcShelf, id: newShelfId };

    // Reassign notebook + section + note ids
    const newNotebooks: Notebook[] = srcNotebooks.map(nbExport => {
      const srcNb = nbExport.notebook;
      const newNbId = this.data.uid();
      const newSections: Section[] = srcNb.sections.map(sec => {
        const newSecId = this.data.uid();
        const newNotes: Note[] = sec.notes.map(note => ({
          ...note,
          id: this.data.uid(),
        }));
        return { ...sec, id: newSecId, notes: newNotes };
      });
      return { ...srcNb, id: newNbId, shelfId: newShelfId, sections: newSections };
    });

    // Append to state
    const state = this.data.getState();
    this.data['state$'].next({
      ...state,
      shelves: [...state.shelves, newShelf],
      notebooks: [...state.notebooks, ...newNotebooks],
    });
    this.data.saveAll(this.data['currentUsername']);

    return newShelfId;
  }

  /**
   * Validate notebook JSON, reassign ids, append to target shelf.
   * Returns the newly created notebook id on success.
   */
  importNotebook(json: unknown, targetShelfId: string): string {
    if (!this._isNotebookExport(json)) {
      this.data.showToast('Import failed: invalid notebook file structure.');
      throw new Error('Invalid notebook export structure');
    }

    const srcNb = json.notebook;
    const newNbId = this.data.uid();
    const newSections: Section[] = srcNb.sections.map(sec => {
      const newSecId = this.data.uid();
      const newNotes: Note[] = sec.notes.map(note => ({
        ...note,
        id: this.data.uid(),
      }));
      return { ...sec, id: newSecId, notes: newNotes };
    });

    const newNotebook: Notebook = {
      ...srcNb,
      id: newNbId,
      shelfId: targetShelfId,
      sections: newSections,
    };

    const state = this.data.getState();
    this.data['state$'].next({
      ...state,
      notebooks: [...state.notebooks, newNotebook],
    });
    this.data.saveAll(this.data['currentUsername']);

    return newNbId;
  }

  /**
   * Validate template JSON, add to localStorage.
   * Returns the template id on success.
   */
  importTemplate(json: unknown): string {
    if (!this._isTemplateExport(json)) {
      this.data.showToast('Import failed: invalid template file structure.');
      throw new Error('Invalid template export structure');
    }

    const template = json.template;

    // Validate required fields
    if (!template.id || !template.name || !Array.isArray(template.fields)) {
      this.data.showToast('Import failed: template missing required fields (id, name, fields).');
      throw new Error('Template missing required fields');
    }

    const existing: CustomTemplate[] = this._loadCustomTemplates();
    const idx = existing.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      existing[idx] = template;
    } else {
      existing.push(template);
    }
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(existing));

    return template.id;
  }

  // ── Validators ──────────────────────────────────────────────────────────────

  private _isShelfExport(json: unknown): json is ShelfExport {
    if (!json || typeof json !== 'object') return false;
    const o = json as Record<string, unknown>;
    if (o['_type'] !== 'shelf') return false;
    if (!o['shelf'] || typeof o['shelf'] !== 'object') return false;
    const shelf = o['shelf'] as Record<string, unknown>;
    if (typeof shelf['id'] !== 'string' || typeof shelf['name'] !== 'string') return false;
    if (!Array.isArray(o['notebooks'])) return false;
    for (const nbEntry of o['notebooks'] as unknown[]) {
      if (!this._isNotebookExport(nbEntry)) return false;
    }
    return true;
  }

  private _isNotebookExport(json: unknown): json is NotebookExport {
    if (!json || typeof json !== 'object') return false;
    const o = json as Record<string, unknown>;
    if (o['_type'] !== 'notebook') return false;
    if (!o['notebook'] || typeof o['notebook'] !== 'object') return false;
    const nb = o['notebook'] as Record<string, unknown>;
    if (typeof nb['id'] !== 'string' || typeof nb['name'] !== 'string') return false;
    if (!Array.isArray(nb['sections'])) return false;
    return true;
  }

  private _isTemplateExport(json: unknown): json is TemplateExport {
    if (!json || typeof json !== 'object') return false;
    const o = json as Record<string, unknown>;
    if (o['_type'] !== 'template') return false;
    if (!o['template'] || typeof o['template'] !== 'object') return false;
    const t = o['template'] as Record<string, unknown>;
    if (typeof t['id'] !== 'string' || typeof t['name'] !== 'string') return false;
    if (!Array.isArray(t['fields'])) return false;
    return true;
  }

  private _loadCustomTemplates(): CustomTemplate[] {
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
