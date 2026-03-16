import { Injectable } from '@angular/core';
import { Note, SectionColor, CustomTemplate, TemplateField } from '../models';
import { researchTemplate } from '../templates/research.template';
import { financeTemplate } from '../templates/finance.template';
import { watchlistTemplate } from '../templates/watchlist.template';
import { journalTemplate } from '../templates/journal.template';
import { scrumTemplate } from '../templates/scrum.template';
import { investingTemplate } from '../templates/investing.template';

export interface TemplateDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  buildForm(data?: Record<string, any>): string;
  readForm(): Record<string, any>;
  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string;
}

const CUSTOM_TEMPLATES_KEY = 'lore_custom_templates';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private builtInTemplates: TemplateDefinition[] = [];

  constructor() {
    this.registerTemplate(researchTemplate);
    this.registerTemplate(financeTemplate);
    this.registerTemplate(watchlistTemplate);
    this.registerTemplate(journalTemplate);
    this.registerTemplate(scrumTemplate);
    this.registerTemplate(investingTemplate);
  }

  registerTemplate(t: TemplateDefinition): void {
    this.builtInTemplates.push(t);
  }

  getBuiltInTemplates(): TemplateDefinition[] {
    return this.builtInTemplates;
  }

  getCustomTemplates(): CustomTemplate[] {
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveCustomTemplate(t: CustomTemplate): void {
    const templates = this.getCustomTemplates();
    const idx = templates.findIndex(c => c.id === t.id);
    if (idx >= 0) {
      templates[idx] = t;
    } else {
      templates.push(t);
    }
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  }

  deleteCustomTemplate(id: string): void {
    const templates = this.getCustomTemplates().filter(c => c.id !== id);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  }

  getTemplates(): TemplateDefinition[] {
    const custom = this.getCustomTemplates().map(c => this._customToDefinition(c));
    return [...this.builtInTemplates, ...custom];
  }

  getTemplate(id: string): TemplateDefinition | undefined {
    return this.getTemplates().find(t => t.id === id);
  }

  buildFormForCustom(template: CustomTemplate, data?: Record<string, any>): string {
    return this._customToDefinition(template).buildForm(data);
  }

  renderCardForCustom(
    template: CustomTemplate,
    note: Note,
    color: SectionColor,
    highlightFn: (text: string) => string
  ): string {
    return this._customToDefinition(template).renderCard(note, color, highlightFn);
  }

  /** Fallback renderer for notes whose template has been deleted */
  renderFallbackCard(note: Note, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const entries = Object.entries(d).filter(([k]) => k !== 'title' && k !== 'tags');
    if (!entries.length) {
      return `<div style="font-size:12.5px;color:var(--ts);opacity:.6;padding:8px 0">No data available (template was deleted).</div>`;
    }
    const rows = entries.map(([key, val]) => {
      if (val === null || val === undefined || val === '') return '';
      const label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
      if (Array.isArray(val)) {
        if (!val.length) return '';
        const items = val.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return `<div class="bl-item"><span>${esc(JSON.stringify(item))}</span></div>`;
          }
          return `<div class="bl-item"><span>● ${highlightFn(String(item))}</span></div>`;
        }).join('');
        return `<div style="margin-top:9px"><div class="cb-label">${esc(label)}</div><div class="bl-list" style="margin-top:4px">${items}</div></div>`;
      }
      return `<div style="margin-top:9px"><div class="cb-label">${esc(label)}</div><div class="cb-body" style="margin-top:3px">${highlightFn(String(val))}</div></div>`;
    }).filter(Boolean).join('');

    const tags = (d['tags'] || []) as string[];
    const tagRow = tags.length
      ? `<div class="tag-row">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
      : '';

    return rows + tagRow;
  }

  private _customToDefinition(c: CustomTemplate): TemplateDefinition {
    const self = this;
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,

      buildForm(data?: Record<string, any>): string {
        const d = data || {};
        return c.fields.map((field: TemplateField) => {
          const fid = field.id === 'title' ? 'f_title' : 'cf_' + field.id;
          const val = field.id === 'title' ? (d['title'] || '') : (d[field.id] ?? '');
          const ph = esc(field.placeholder || 'Enter ' + field.label.toLowerCase() + '…');
          const lbl = esc(field.label) + (field.required ? ' *' : '');

          switch (field.type) {
            case 'text':
              return `<div class="frow"><label class="flbl">${lbl}</label><input class="fin" id="${fid}" value="${esc(String(val))}" placeholder="${ph}"></div>`;
            case 'textarea':
              return `<div class="frow"><label class="flbl">${lbl}</label><textarea class="fta" id="${fid}" placeholder="${ph}">${esc(String(val))}</textarea></div>`;
            case 'date':
              return `<div class="frow"><label class="flbl">${lbl}</label><input class="fin" type="date" id="${fid}" value="${esc(String(val))}"></div>`;
            case 'select': {
              const opts = (field.options || []).map(o =>
                `<option value="${esc(o)}"${val === o ? ' selected' : ''}>${esc(o)}</option>`
              ).join('');
              return `<div class="frow"><label class="flbl">${lbl}</label><select class="fsel" id="${fid}"><option value="">— Select —</option>${opts}</select></div>`;
            }
            case 'rating': {
              const rOpts = ['1', '2', '3', '4', '5'].map(r =>
                `<option value="${r}"${val === r ? ' selected' : ''}>${'★'.repeat(parseInt(r))} (${r}/5)</option>`
              ).join('');
              return `<div class="frow"><label class="flbl">${lbl}</label><select class="fsel" id="${fid}"><option value="">No rating</option>${rOpts}</select></div>`;
            }
            case 'list': {
              const items = (Array.isArray(val) ? val : []).map((item: string) =>
                `<div class="irow"><input class="fin" value="${esc(item)}" placeholder="${ph}"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`
              ).join('');
              return `<div class="fsec"><div class="fsec-ttl">${esc(field.label)}</div><div class="irows" id="${fid}">${items}</div><button class="btn-ar" onclick="addRow('${fid}','${ph}')">＋ Add</button></div>`;
            }
            case 'checklist': {
              const items = (Array.isArray(val) ? val : []).map((item: { text: string; done: boolean }) =>
                `<div class="irow"><label class="tog"><input type="checkbox"${item.done ? ' checked' : ''}><span class="tog-tr"></span></label><input class="fin" value="${esc(item.text || '')}" placeholder="${ph}" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`
              ).join('');
              return `<div class="fsec"><div class="fsec-ttl">${esc(field.label)}</div><div class="irows" id="${fid}">${items}</div><button class="btn-ar" onclick="addChecklistRow('${fid}','${ph}')">＋ Add Item</button></div>`;
            }
            default:
              return '';
          }
        }).join('');
      },

      readForm(): Record<string, any> {
        const data: Record<string, any> = {};
        c.fields.forEach((field: TemplateField) => {
          const fid = field.id === 'title' ? 'f_title' : 'cf_' + field.id;
          const el = document.getElementById(fid) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
          switch (field.type) {
            case 'text':
            case 'textarea':
            case 'date':
            case 'select':
            case 'rating':
              data[field.id] = el ? el.value : '';
              break;
            case 'list':
              data[field.id] = Array.from(
                document.querySelectorAll('#' + fid + ' .irow input') as NodeListOf<HTMLInputElement>
              ).map(i => i.value.trim()).filter(Boolean);
              break;
            case 'checklist':
              data[field.id] = Array.from(
                document.querySelectorAll('#' + fid + ' .irow') as NodeListOf<HTMLElement>
              ).map(row => ({
                text: (row.querySelector('input.fin') as HTMLInputElement)?.value.trim() || '',
                done: (row.querySelector('input[type="checkbox"]') as HTMLInputElement)?.checked || false,
              })).filter(i => i.text);
              break;
          }
        });
        data['title'] = data['title'] || '';
        return data;
      },

      renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
        const d = note.data || {};
        return c.fields
          .filter((field: TemplateField) => field.id !== 'title')
          .map((field: TemplateField) => {
            const val = d[field.id];
            if (val === undefined || val === null || val === '' || (Array.isArray(val) && !val.length)) return '';
            const lbl = `<div class="cb-label">${esc(field.label)}</div>`;

            switch (field.type) {
              case 'text':
                return `<div style="margin-top:10px">${lbl}<div class="cb-body" style="margin-top:3px">${highlightFn(val)}</div></div>`;
              case 'textarea':
                return `<div style="margin-top:10px">${lbl}<div class="cb-body" style="margin-top:3px">${highlightFn(val)}</div></div>`;
              case 'date':
                return `<div style="margin-top:9px"><span style="font-size:11px;background:${color.bg};color:${color.text};border:0.5px solid ${color.border};padding:2px 9px;border-radius:4px;display:inline-block">📅 ${esc(field.label)}: ${esc(val)}</span></div>`;
              case 'select':
                return val ? `<div style="margin-top:9px"><span style="font-size:11px;background:${color.bg};color:${color.text};border:0.5px solid ${color.border};padding:2px 9px;border-radius:4px;display:inline-block">${esc(field.label)}: ${esc(val)}</span></div>` : '';
              case 'rating':
                return val ? `<div style="margin-top:9px;font-size:14px">${'★'.repeat(parseInt(val) || 0)}<span style="font-size:10px;color:var(--tt);margin-left:5px">${esc(field.label)}</span></div>` : '';
              case 'list':
                return `<div style="margin-top:10px">${lbl}<div class="bl-list" style="margin-top:4px">${(val as string[]).map(item =>
                  `<div class="bl-item"><span style="color:${color.dot};font-size:9px;flex-shrink:0;margin-top:4px">●</span><span>${highlightFn(item)}</span></div>`
                ).join('')}</div></div>`;
              case 'checklist':
                return `<div style="margin-top:10px">${lbl}${(val as { text: string; done: boolean }[]).map(item =>
                  `<div class="wl-item${item.done ? ' seen' : ''}" style="margin-top:5px"><div class="wl-chk${item.done ? ' ticked' : ''}">${item.done ? '✓' : ''}</div><span class="wl-title">${esc(item.text)}</span></div>`
                ).join('')}</div>`;
              default:
                return '';
            }
          }).join('');
      },
    };
  }
}
