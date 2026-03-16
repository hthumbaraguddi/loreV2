import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const watchlistTemplate: TemplateDefinition = {
  id: 'watchlist',
  name: 'What to Watch',
  icon: '🎬',
  color: 'coral',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const items = (d['items'] || [])
      .map((item: { title: string; type: string; platform: string; rating: string; watched: boolean }) => `
      <div class="irow" style="align-items:center;gap:5px">
        <input class="fin" value="${esc(item.title || '')}" placeholder="Movie / Show title" style="flex:2">
        <select class="fsel" style="width:100px">
          <option ${item.type === 'Movie' || !item.type ? 'selected' : ''}>Movie</option>
          <option ${item.type === 'Series' ? 'selected' : ''}>Series</option>
          <option ${item.type === 'Documentary' ? 'selected' : ''}>Documentary</option>
          <option ${item.type === 'Short Film' ? 'selected' : ''}>Short Film</option>
        </select>
        <input class="fin" value="${esc(item.platform || '')}" placeholder="Netflix…" style="width:85px">
        <input class="fin" value="${esc(item.rating || '')}" placeholder="★ 1-5" style="width:50px">
        <label class="tog" title="Watched?"><input type="checkbox" ${item.watched ? 'checked' : ''}><span class="tog-tr"></span></label>
        <button class="btn-rm" onclick="this.parentElement.remove()">✕</button>
      </div>`)
      .join('');

    return `
    <div class="frow"><label class="flbl">Note Title *</label><input class="fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="e.g. March 15–16 Weekend Watchlist"></div>
    <div class="g2">
      <div class="frow"><label class="flbl">📅 Weekend / Date</label><input class="fin" id="f_weekend" value="${esc(d['weekend'] || '')}" placeholder="e.g. Mar 15–16, 2026"></div>
      <div class="frow"><label class="flbl">🎭 Mood / Genre</label><input class="fin" id="f_mood" value="${esc(d['mood'] || '')}" placeholder="e.g. Thriller, Light Comedy"></div>
    </div>
    <div class="fsec">
      <div class="fsec-ttl">🎬 Watch List</div>
      <div style="display:flex;gap:5px;font-size:10px;color:var(--tt);margin-bottom:6px">
        <span style="flex:2">Title</span><span style="width:100px">Type</span><span style="width:85px">Platform</span><span style="width:50px">★</span><span style="width:32px">Seen</span><span style="width:28px"></span>
      </div>
      <div class="irows" id="f_items">${items}</div>
      <button class="btn-ar" onclick="addWatchRow()">＋ Add to Watch List</button>
    </div>
    <div class="frow" style="margin-top:14px"><label class="flbl">🏆 Weekend Pick (top recommendation)</label>
      <input class="fin" id="f_pick" value="${esc(d['pick'] || '')}" placeholder="e.g. Oppenheimer — perfect for a slow Saturday"></div>
    <div class="frow"><label class="flbl">Notes / Thoughts</label>
      <textarea class="fta" id="f_notes" style="min-height:50px" placeholder="Any recommendations or context…">${esc(d['notes'] || '')}</textarea></div>
    <div class="frow"><label class="flbl">Tags</label><input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. weekend, sci-fi, binge"></div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement)?.value || '';
    const items: { title: string; type: string; platform: string; rating: string; watched: boolean }[] = [];
    document.querySelectorAll('#f_items .irow').forEach((row) => {
      const ins = Array.from(row.querySelectorAll('input:not([type=checkbox])')) as HTMLInputElement[];
      const sel = row.querySelector('select') as HTMLSelectElement | null;
      const chk = row.querySelector('input[type=checkbox]') as HTMLInputElement | null;
      if (ins[0]?.value.trim()) {
        items.push({
          title: ins[0].value.trim(),
          type: sel?.value || 'Movie',
          platform: ins[1]?.value.trim() || '',
          rating: ins[2]?.value.trim() || '',
          watched: chk?.checked || false,
        });
      }
    });
    return {
      title: v('f_title'),
      weekend: v('f_weekend'),
      mood: v('f_mood'),
      items,
      pick: v('f_pick'),
      notes: v('f_notes'),
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const items = (d['items'] || []).filter((i: any) => i && i.title) as {
      title: string; type: string; platform: string; rating: string; watched: boolean;
    }[];
    const stars = (n: string) => {
      const r = parseFloat(n) || 0;
      return r ? '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)) : '';
    };

    return `
    <div class="wl-meta">
      ${d['weekend'] ? `<span>📅 ${highlightFn(d['weekend'])}</span>` : ''}
      ${d['mood'] ? `<span class="wl-mood">🎭 ${highlightFn(d['mood'])}</span>` : ''}
      ${items.length ? `<span style="opacity:.6">${items.filter(i => i.watched).length}/${items.length} watched</span>` : ''}
    </div>
    ${items.map(item => `
      <div class="wl-item${item.watched ? ' seen' : ''}">
        <div class="wl-chk${item.watched ? ' ticked' : ''}">${item.watched ? '✓' : ''}</div>
        <div class="wl-info">
          <div class="wl-title">${highlightFn(item.title)}</div>
          <div class="wl-chips">
            ${item.type ? `<span class="wl-chip">${esc(item.type)}</span>` : ''}
            ${item.platform ? `<span class="wl-chip">📺 ${highlightFn(item.platform)}</span>` : ''}
          </div>
        </div>
        ${item.rating ? `<div class="wl-stars">${stars(item.rating)}</div>` : ''}
      </div>`).join('')}
    ${d['pick'] ? `<div class="wl-pick"><strong>🏆 Weekend Pick:</strong> ${highlightFn(d['pick'])}</div>` : ''}
    ${d['notes'] ? `<div class="cb-body">${highlightFn(d['notes'])}</div>` : ''}
    ${(d['tags'] || []).length ? `<div class="tag-row">${(d['tags'] as string[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  },
};
