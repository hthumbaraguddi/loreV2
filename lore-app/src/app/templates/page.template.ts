import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const pageTemplate: TemplateDefinition = {
  id: 'page',
  name: 'Page',
  icon: '📄',
  color: 'purple',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const blocks: any[] = d['blocks'] || [];

    const blockRows = blocks.map((b: any, i: number) => renderBlockEditor(b, i)).join('');

    return `
    <div class="pg-form-header">
      <div class="pg-icon-picker">
        <input class="pg-icon-input" id="f_icon" value="${esc(d['icon'] || '📄')}" placeholder="📄" maxlength="4" title="Click to change icon">
      </div>
      <input class="pg-title-input fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="Untitled">
    </div>
    <div class="pg-blocks" id="f_blocks">
      ${blockRows}
    </div>
    <div class="pg-add-block-bar">
      <button class="btn-ar" onclick="pgAddBlock('text')">＋ Text</button>
      <button class="btn-ar" onclick="pgAddBlock('heading')">＋ Heading</button>
      <button class="btn-ar" onclick="pgAddBlock('callout')">＋ Callout</button>
      <button class="btn-ar" onclick="pgAddBlock('todo')">＋ To-do</button>
      <button class="btn-ar" onclick="pgAddBlock('quote')">＋ Quote</button>
      <button class="btn-ar" onclick="pgAddBlock('divider')">── Divider</button>
    </div>
    <div class="frow" style="margin-top:14px">
      <label class="flbl">Tags</label>
      <input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. notes, ideas, project">
    </div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement)?.value || '';
    const blockRows = Array.from(document.querySelectorAll('#f_blocks .pg-block-row') as NodeListOf<HTMLElement>);
    const blocks = blockRows.map(row => {
      const type = row.dataset['type'] || 'text';
      if (type === 'divider') return { type };
      const ta = row.querySelector('textarea') as HTMLTextAreaElement | null;
      const check = row.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      return {
        type,
        content: ta?.value || '',
        checked: check ? check.checked : undefined,
      };
    });
    return {
      title: v('f_title'),
      icon: v('f_icon') || '📄',
      blocks,
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const blocks: any[] = d['blocks'] || [];
    const icon = d['icon'] || '📄';

    const renderedBlocks = blocks.map((b: any) => {
      switch (b.type) {
        case 'heading':
          return `<div class="pg-heading">${highlightFn(b.content || '')}</div>`;
        case 'callout':
          return `<div class="pg-callout" style="border-left-color:${color.dot};background:${color.bg}22">
            <span class="pg-callout-ico">💡</span>
            <span>${highlightFn(b.content || '')}</span>
          </div>`;
        case 'todo':
          return `<div class="pg-todo${b.checked ? ' pg-todo-done' : ''}">
            <span class="pg-todo-box">${b.checked ? '✓' : ''}</span>
            <span>${highlightFn(b.content || '')}</span>
          </div>`;
        case 'quote':
          return `<div class="pg-quote" style="border-left-color:${color.dot}">${highlightFn(b.content || '')}</div>`;
        case 'divider':
          return `<div class="pg-divider"></div>`;
        default: // text
          return b.content ? `<div class="pg-text">${highlightFn(b.content)}</div>` : '';
      }
    }).filter(Boolean).join('');

    const tags = (d['tags'] || []) as string[];
    const tagRow = tags.length
      ? `<div class="tag-row">${tags.map((t: string) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
      : '';

    return `
    <div class="pg-card-header">
      <span class="pg-card-icon">${esc(icon)}</span>
    </div>
    <div class="pg-card-body">${renderedBlocks || '<span style="color:var(--tt);font-size:12px">Empty page</span>'}</div>
    ${tagRow}`;
  },
};

function renderBlockEditor(b: any, i: number): string {
  const type = b.type || 'text';
  if (type === 'divider') {
    return `<div class="pg-block-row" data-type="divider">
      <div class="pg-divider-preview">──────────────────</div>
      <button class="pg-block-del" onclick="this.parentElement.remove()">✕</button>
    </div>`;
  }
  const placeholders: Record<string, string> = {
    text: 'Write something…',
    heading: 'Heading text…',
    callout: 'Callout message…',
    todo: 'To-do item…',
    quote: 'Quote or excerpt…',
  };
  const ph = placeholders[type] || 'Content…';
  const todoCheck = type === 'todo'
    ? `<input type="checkbox" class="pg-todo-check"${b.checked ? ' checked' : ''}>`
    : '';
  return `<div class="pg-block-row pg-block-${esc(type)}" data-type="${esc(type)}">
    ${todoCheck}
    <textarea class="pg-block-ta" placeholder="${esc(ph)}">${esc(b.content || '')}</textarea>
    <button class="pg-block-del" onclick="this.parentElement.remove()">✕</button>
  </div>`;
}
