import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const journalTemplate: TemplateDefinition = {
  id: 'journal',
  name: 'Daily Journal',
  icon: '🌅',
  color: 'pink',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const grat: string[] = d['gratitude'] || ['', '', ''];

    return `
    <div class="frow"><label class="flbl">Note Title *</label><input class="fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="e.g. Monday — Deep focus day"></div>
    <div class="g3">
      <div class="frow"><label class="flbl">📅 Date</label><input class="fin" id="f_date" value="${esc(d['date'] || today)}" placeholder="Today's date"></div>
      <div class="frow"><label class="flbl">😊 Mood</label><input class="fin" id="f_mood" value="${esc(d['mood'] || '😊')}" placeholder="😊 😐 😤 🤔"></div>
      <div class="frow"><label class="flbl">⚡ Energy (1–5)</label><input class="fin" id="f_energy" type="number" min="1" max="5" value="${d['energy'] || 3}"></div>
    </div>
    <div class="frow"><label class="flbl">✨ Morning Intention</label>
      <textarea class="fta" id="f_intention" style="min-height:52px" placeholder="What do you want to achieve today?">${esc(d['intention'] || '')}</textarea></div>
    <div class="fsec">
      <div class="fsec-ttl">🙏 Three Things I'm Grateful For</div>
      ${[0, 1, 2].map(i => `<div class="frow"><input class="fin" id="f_g${i}" value="${esc(grat[i] || '')}" placeholder="${['Something that made me smile…', 'A person I appreciate…', 'A small win today…'][i]}"></div>`).join('')}
    </div>
    <div class="g2" style="margin-top:14px">
      <div class="frow"><label class="flbl">🏆 Wins &amp; Highlights</label>
        <textarea class="fta" id="f_wins" placeholder="What went well today?">${esc(d['wins'] || '')}</textarea></div>
      <div class="frow"><label class="flbl">💭 Challenges</label>
        <textarea class="fta" id="f_challenges" placeholder="What was hard? What to improve?">${esc(d['challenges'] || '')}</textarea></div>
    </div>
    <div class="frow"><label class="flbl">🌙 Tomorrow's One Clear Focus</label>
      <input class="fin" id="f_tomorrow" value="${esc(d['tomorrowFocus'] || '')}" placeholder="One priority for tomorrow…"></div>
    <div class="frow"><label class="flbl">Tags</label><input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. monday, reflection, week12"></div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement)?.value || '';
    return {
      title: v('f_title'),
      date: v('f_date'),
      mood: v('f_mood'),
      energy: parseInt(v('f_energy')) || 3,
      intention: v('f_intention'),
      gratitude: [v('f_g0'), v('f_g1'), v('f_g2')].filter(Boolean),
      wins: v('f_wins'),
      challenges: v('f_challenges'),
      tomorrowFocus: v('f_tomorrow'),
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const energy = parseInt(d['energy']) || 3;
    const grat = (d['gratitude'] || []).filter(Boolean) as string[];

    return `
    <div class="jn-top">
      ${d['date'] ? `<span style="font-size:12px;color:var(--ts)">📅 ${highlightFn(d['date'])}</span>` : ''}
      ${d['mood'] ? `<span class="jn-mood">${esc(d['mood'])}</span>` : ''}
      ${d['energy'] ? `<div class="jn-energy">${[1, 2, 3, 4, 5].map(i => `<div class="jn-pip${i <= energy ? ' on' : ''}"></div>`).join('')}<span class="jn-energy-lbl">Energy ${energy}/5</span></div>` : ''}
    </div>
    ${d['intention'] ? `<div class="cb-insight" style="border-left-color:${color.dot};background:${color.bg}22;margin-top:10px">
      <strong>✨ Intention:</strong> ${highlightFn(d['intention'])}</div>` : ''}
    ${grat.length ? `<div style="margin-top:11px">
      <div class="cb-label">🙏 Grateful For</div>
      <div class="jn-grat">${grat.map((g, i) => `<div class="jn-grat-item"><span class="jn-gn">${i + 1}</span>${highlightFn(g)}</div>`).join('')}</div>
    </div>` : ''}
    ${(d['wins'] || d['challenges']) ? `<div class="two-col">
      ${d['wins'] ? `<div class="col-box"><div class="cb-label">🏆 Wins</div><div class="cb-body" style="margin-top:4px">${highlightFn(d['wins'])}</div></div>` : `<div></div>`}
      ${d['challenges'] ? `<div class="col-box"><div class="cb-label">💭 Challenges</div><div class="cb-body" style="margin-top:4px">${highlightFn(d['challenges'])}</div></div>` : `<div></div>`}
    </div>` : ''}
    ${d['tomorrowFocus'] ? `<div class="cb-footer" style="border-left-color:${color.dot};background:${color.bg}22">
      <strong>🌙 Tomorrow:</strong> ${highlightFn(d['tomorrowFocus'])}</div>` : ''}
    ${(d['tags'] || []).length ? `<div class="tag-row">${(d['tags'] as string[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  },
};
