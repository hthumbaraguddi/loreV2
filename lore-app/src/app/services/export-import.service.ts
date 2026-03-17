import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { TemplateService } from './template.service';
import { Shelf, Notebook, Section, Note, CustomTemplate, SECTION_COLORS } from '../models';

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

export interface WorkspaceExport {
  _type: 'workspace';
  version: 1;
  exportedAt: string;
  state: {
    shelves: Shelf[];
    notebooks: Notebook[];
  };
  customTemplates: CustomTemplate[];
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

function triggerHtmlDownload(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build a standalone HTML document from a list of notebooks */
function buildHtmlDocument(title: string, notebooks: Notebook[], templateService: TemplateService): string {
  const noHighlight = (s: string) => esc(s);

  const notebookSections = notebooks.map(nb => {
    const sectionsHtml = nb.sections.map(sec => {
      const color = SECTION_COLORS[sec.color] || SECTION_COLORS['gray'];
      const notesHtml = sec.notes.map(note => {
        const tpl = templateService.getTemplate(note.templateId);
        const cardBody = tpl
          ? tpl.renderCard(note, color, noHighlight)
          : templateService.renderFallbackCard(note, noHighlight);
        return `
        <div class="note-card" style="border-left:3px solid ${color.border};background:var(--card-bg);border-radius:8px;padding:14px 16px;margin-bottom:12px">
          <div class="note-header" style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:13px;font-weight:600;color:var(--text)">${esc(note.title)}</span>
            ${tpl ? `<span style="font-size:10px;background:${color.bg};color:${color.text};border:0.5px solid ${color.border};padding:2px 7px;border-radius:4px">${esc(tpl.icon)} ${esc(tpl.name)}</span>` : ''}
          </div>
          <div class="note-body" style="font-size:13px;color:var(--text-secondary)">${cardBody}</div>
        </div>`;
      }).join('');

      return `
      <div class="section" style="margin-bottom:28px">
        <div class="section-header" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);margin-bottom:12px">
          <span style="width:10px;height:10px;border-radius:50%;background:${color.dot};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:14px;font-weight:600;color:var(--text)">${esc(sec.title)}</span>
          ${sec.subtitle ? `<span style="font-size:12px;color:var(--text-muted)">${esc(sec.subtitle)}</span>` : ''}
        </div>
        ${notesHtml || '<p style="font-size:12px;color:var(--text-muted);padding:8px 0">No notes in this section.</p>'}
      </div>`;
    }).join('');

    return `
    <div class="notebook" style="margin-bottom:40px">
      <h2 style="font-size:18px;font-weight:700;color:var(--text);margin:0 0 20px;display:flex;align-items:center;gap:8px">
        <span>${esc(nb.icon)}</span><span>${esc(nb.name)}</span>
      </h2>
      ${sectionsHtml || '<p style="color:var(--text-muted)">No sections.</p>'}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
    :root {
      --bg: #0f1117;
      --card-bg: #1a1d27;
      --border: rgba(255,255,255,0.08);
      --text: #e8eaf0;
      --text-secondary: #b0b4c4;
      --text-muted: #6b7280;
      --accent: #7C6AF6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); padding: 32px 24px; line-height: 1.6; }
    .container { max-width: 860px; margin: 0 auto; }
    .page-header { margin-bottom: 36px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .page-title { font-size: 26px; font-weight: 700; color: var(--text); }
    .page-meta { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
    .lore-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); background: rgba(124,106,246,0.1); border: 0.5px solid rgba(124,106,246,0.3); padding: 3px 10px; border-radius: 20px; margin-top: 10px; }
    /* Note card inner styles */
    .rs-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .rs-domain { font-size: 11px; background: rgba(255,255,255,0.06); color: var(--text-secondary); padding: 2px 8px; border-radius: 4px; }
    .rs-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; }
    .rs-ip { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .rs-done { background: rgba(34,197,94,0.15); color: #4ade80; }
    .rs-hold { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .cb-insight { padding: 8px 12px; border-left: 3px solid; border-radius: 0 6px 6px 0; font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
    .cb-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .cb-body { font-size: 13px; color: var(--text-secondary); }
    .cb-footer { padding: 8px 12px; border-left: 3px solid; border-radius: 0 6px 6px 0; font-size: 13px; color: var(--text-secondary); margin-top: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
    @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }
    .col-box { display: flex; flex-direction: column; gap: 6px; }
    .bl-list { display: flex; flex-direction: column; gap: 5px; margin-top: 6px; }
    .bl-item { display: flex; gap: 8px; font-size: 13px; color: var(--text-secondary); align-items: flex-start; }
    .rs-num { font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.08); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
    .link-chip { display: inline-block; font-size: 12px; padding: 3px 9px; border-radius: 5px; border: 0.5px solid; text-decoration: none; margin: 3px 3px 0 0; }
    .link-chip:hover { opacity: 0.8; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }
    .tag { font-size: 11px; background: rgba(255,255,255,0.06); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; }
    /* Finance */
    .fin-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); padding: 4px 0; border-bottom: 0.5px solid var(--border); }
    .fin-net-pos { color: #4ade80; font-weight: 700; }
    .fin-net-neg { color: #f87171; font-weight: 700; }
    .fin-net-zero { color: var(--text-muted); font-weight: 700; }
    /* Watchlist */
    .wl-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); padding: 5px 0; }
    .wl-item.seen { opacity: 0.45; text-decoration: line-through; }
    .wl-chk { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
    .wl-chk.ticked { background: #4ade80; border-color: #4ade80; color: #000; }
    /* Journal pips */
    .pip { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 3px; }
    .pip.filled { background: var(--accent); }
    .pip.empty { background: rgba(255,255,255,0.12); }
    /* Scrum */
    .scrum-col { display: flex; flex-direction: column; gap: 4px; }
    .scrum-item { font-size: 13px; color: var(--text-secondary); padding: 3px 0; }
    /* Investing */
    .tk-up { color: #4ade80; }
    .tk-down { color: #f87171; }
    .tk-flat { color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <div class="page-header">
      <div class="page-title">${esc(title)}</div>
      <div class="page-meta">Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div class="lore-badge">📓 Exported from Lore Notes</div>
    </div>
    ${notebookSections}
  </div>
</body>
</html>`;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ExportImportService {

  constructor(private data: DataService, private templateService: TemplateService) {}

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

  /** Export shelf as standalone HTML */
  exportShelfAsHtml(shelf: Shelf): void {
    const state = this.data.getState();
    const notebooks = state.notebooks.filter(nb => nb.shelfId === shelf.id);
    const html = buildHtmlDocument(shelf.name, notebooks, this.templateService);
    triggerHtmlDownload(html, `shelf-${slugify(shelf.name)}-${todayStr()}.html`);
  }

  /** Export notebook as standalone HTML */
  exportNotebookAsHtml(notebook: Notebook): void {
    const html = buildHtmlDocument(notebook.name, [notebook], this.templateService);
    triggerHtmlDownload(html, `notebook-${slugify(notebook.name)}-${todayStr()}.html`);
  }

  /** Export entire workspace (all shelves, notebooks, custom templates) as a single JSON */
  exportWorkspace(): void {
    const state = this.data.getState();
    let customTemplates: CustomTemplate[] = [];
    try {
      customTemplates = JSON.parse(localStorage.getItem('lore_custom_templates') || '[]');
    } catch { /* ignore */ }

    const payload: WorkspaceExport = {
      _type: 'workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: {
        shelves: state.shelves,
        notebooks: state.notebooks,
      },
      customTemplates,
    };
    triggerDownload(payload, `lore-workspace-${todayStr()}.json`);
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

    this.data.appendShelfWithNotebooks(newShelf, newNotebooks);
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

    this.data.appendNotebook(newNotebook);
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
