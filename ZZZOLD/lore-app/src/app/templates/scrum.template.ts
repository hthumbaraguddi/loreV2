import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const scrumTemplate: TemplateDefinition = {
  id: 'scrum',
  name: 'Scrum Standup',
  icon: '🏃',
  color: 'blue',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const mkList = (id: string, items: string[], ph: string) =>
      `<div class="irows" id="${id}">${(items || []).map(it =>
        `<div class="irow"><input class="fin" value="${esc(it)}" placeholder="${ph}"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`
      ).join('')}</div>`;
    const mkActions = (acts: { task: string; owner: string }[]) =>
      `<div class="irows" id="f_actions">${(acts || []).map(a =>
        `<div class="irow"><input class="fin" value="${esc(a.task || '')}" placeholder="Action item…" style="flex:2"><input class="fin" value="${esc(a.owner || '')}" placeholder="@Owner" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`
      ).join('')}</div>`;

    return `
    <div class="frow"><label class="flbl">Note Title *</label><input class="fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="e.g. Sprint 14 Daily Standup — Mar 14"></div>
    <div class="g3">
      <div class="frow"><label class="flbl">Sprint #</label><input class="fin" id="f_sprint" value="${esc(d['sprint'] || '')}" placeholder="14"></div>
      <div class="frow"><label class="flbl">Date</label><input class="fin" id="f_date" value="${esc(d['date'] || '')}" placeholder="Mar 14"></div>
      <div class="frow"><label class="flbl">Attendees</label><input class="fin" id="f_attendees" value="${esc(d['attendees'] || '')}" placeholder="Team members"></div>
    </div>
    <div class="frow"><label class="flbl">🎯 Sprint Goal</label>
      <textarea class="fta" id="f_sprintGoal" style="min-height:50px" placeholder="What is the team committing to this sprint?">${esc(d['sprintGoal'] || '')}</textarea></div>
    <div class="three-col" style="margin-top:14px">
      <div class="sc-form-col">
        <div class="fsec-ttl" style="color:#15803D">✓ Yesterday</div>
        ${mkList('f_yesterday', d['yesterday'] || [], 'Completed item…')}
        <button class="btn-ar" onclick="addRow('f_yesterday','Completed item…')" style="margin-top:4px">＋ Add</button>
      </div>
      <div class="sc-form-col">
        <div class="fsec-ttl" style="color:#1D4ED8">→ Today</div>
        ${mkList('f_today', d['today'] || [], 'Planned task…')}
        <button class="btn-ar" onclick="addRow('f_today','Planned task…')" style="margin-top:4px">＋ Add</button>
      </div>
      <div class="sc-form-col">
        <div class="fsec-ttl" style="color:#B91C1C">⚠ Blockers</div>
        ${mkList('f_blockers', d['blockers'] || [], 'Impediment…')}
        <button class="btn-ar" onclick="addRow('f_blockers','Impediment…')" style="margin-top:4px">＋ Add</button>
      </div>
    </div>
    <div class="fsec">
      <div class="fsec-ttl">📋 Action Items</div>
      <div style="display:flex;gap:5px;font-size:10px;color:var(--tt);margin-bottom:5px"><span style="flex:2">Task</span><span style="flex:1">Owner</span><span style="width:28px"></span></div>
      ${mkActions(d['actionItems'] || [])}
      <button class="btn-ar" onclick="addActionRow()">＋ Add Action Item</button>
    </div>
    <div class="frow" style="margin-top:14px"><label class="flbl">Tags</label><input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. sprint-14, planning, backend"></div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || '';
    const lv = (id: string) =>
      Array.from(document.querySelectorAll('#' + id + ' .irow input') as NodeListOf<HTMLInputElement>)
        .map(i => i.value)
        .filter(Boolean);
    const actions: { task: string; owner: string }[] = [];
    document.querySelectorAll('#f_actions .irow').forEach((row) => {
      const ins = Array.from(row.querySelectorAll('input')) as HTMLInputElement[];
      if (ins[0]?.value.trim()) {
        actions.push({ task: ins[0].value.trim(), owner: ins[1]?.value.trim() || '' });
      }
    });
    return {
      title: v('f_title'),
      sprint: v('f_sprint'),
      date: v('f_date'),
      attendees: v('f_attendees'),
      sprintGoal: v('f_sprintGoal'),
      yesterday: lv('f_yesterday'),
      today: lv('f_today'),
      blockers: lv('f_blockers'),
      actionItems: actions,
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const yesterday = (d['yesterday'] || []).filter(Boolean) as string[];
    const today = (d['today'] || []).filter(Boolean) as string[];
    const blockers = (d['blockers'] || []).filter(Boolean) as string[];
    const actions = (d['actionItems'] || []).filter((a: any) => a && a.task) as { task: string; owner: string }[];

    return `
    <div class="sc-meta">
      ${d['sprint'] ? `<span class="sc-sprint" style="background:${color.bg};color:${color.text};border:0.5px solid ${color.border}">Sprint ${highlightFn(d['sprint'])}</span>` : ''}
      ${d['date'] ? `<span>📅 ${highlightFn(d['date'])}</span>` : ''}
      ${d['attendees'] ? `<span>👥 ${highlightFn(d['attendees'])}</span>` : ''}
    </div>
    ${d['sprintGoal'] ? `<div class="cb-insight" style="border-left-color:${color.dot};background:${color.bg}22;margin-top:10px">
      <strong>🎯 Sprint Goal:</strong> ${highlightFn(d['sprintGoal'])}</div>` : ''}
    <div class="three-col">
      <div class="col-box">
        <div class="sc-col-head sc-done"><span class="sc-dot"></span>Yesterday</div>
        ${yesterday.map(it => `<div class="sc-item">✓ ${highlightFn(it)}</div>`).join('')}
        ${!yesterday.length ? `<div class="sc-item" style="opacity:.35">Nothing logged</div>` : ''}
      </div>
      <div class="col-box">
        <div class="sc-col-head sc-today"><span class="sc-dot"></span>Today</div>
        ${today.map(it => `<div class="sc-item">→ ${highlightFn(it)}</div>`).join('')}
        ${!today.length ? `<div class="sc-item" style="opacity:.35">Nothing planned</div>` : ''}
      </div>
      <div class="col-box">
        <div class="sc-col-head sc-block"><span class="sc-dot"></span>Blockers</div>
        ${blockers.map(b => `<div class="sc-block-item">⚠ ${highlightFn(b)}</div>`).join('')}
        ${!blockers.length ? `<div class="sc-item" style="color:#16A34A">✓ No blockers</div>` : ''}
      </div>
    </div>
    ${actions.length ? `<div class="sc-actions">
      <div class="cb-label" style="margin-top:12px">📋 Action Items</div>
      ${actions.map(a => `<div class="sc-act-row">
        <span class="sc-act-task">→ ${highlightFn(a.task)}</span>
        ${a.owner ? `<span class="sc-act-owner">@${esc(a.owner)}</span>` : ''}
      </div>`).join('')}
    </div>` : ''}
    ${(d['tags'] || []).length ? `<div class="tag-row">${(d['tags'] as string[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  },
};
