import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const researchTemplate: TemplateDefinition = {
  id: 'research',
  name: 'Research Notes',
  icon: '🔬',
  color: 'teal',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const findings = (d['findings'] || [])
      .map((f: string) => `<div class="irow"><input class="fin" value="${esc(f)}" placeholder="Key finding or observation…"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');
    const refs = (d['references'] || [])
      .map((r: { text: string; url: string }) => `<div class="irow"><input class="fin" value="${esc(r.text || '')}" placeholder="Paper / Author" style="flex:1"><input class="fin" value="${esc(r.url || '')}" placeholder="DOI or URL" style="flex:2"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');

    return `
    <div class="frow"><label class="flbl">Title *</label><input class="fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="e.g. LLM Hallucination in Enterprise RAG"></div>
    <div class="g2">
      <div class="frow"><label class="flbl">Domain / Field</label><input class="fin" id="f_domain" value="${esc(d['domain'] || '')}" placeholder="e.g. NLP, Immunology"></div>
      <div class="frow"><label class="flbl">Status</label>
        <select class="fsel" id="f_status">
          <option value="ip" ${d['status'] === 'ip' || !d['status'] ? 'selected' : ''}>🔵 In Progress</option>
          <option value="done" ${d['status'] === 'done' ? 'selected' : ''}>✅ Completed</option>
          <option value="hold" ${d['status'] === 'hold' ? 'selected' : ''}>⏸ On Hold</option>
        </select>
      </div>
    </div>
    <div class="frow"><label class="flbl">💡 Hypothesis / Research Question</label>
      <textarea class="fta" id="f_hypothesis" placeholder="What are you trying to prove or discover?">${esc(d['hypothesis'] || '')}</textarea></div>
    <div class="frow"><label class="flbl">Methodology</label>
      <textarea class="fta" id="f_methodology" style="min-height:60px" placeholder="How you approached this research…">${esc(d['methodology'] || '')}</textarea></div>
    <div class="fsec">
      <div class="fsec-ttl">🔍 Key Findings</div>
      <div class="irows" id="f_findings">${findings}</div>
      <button class="btn-ar" onclick="addRow('f_findings','Finding or observation…')">＋ Add Finding</button>
    </div>
    <div class="fsec">
      <div class="fsec-ttl">📚 References &amp; Papers</div>
      <div class="irows" id="f_refs">${refs}</div>
      <button class="btn-ar" onclick="addLinkRow('f_refs','Paper / Article title','DOI or URL')">＋ Add Reference</button>
    </div>
    <div class="frow" style="margin-top:14px"><label class="flbl">🎯 Conclusion</label>
      <textarea class="fta" id="f_conclusion" placeholder="What can you conclude?">${esc(d['conclusion'] || '')}</textarea></div>
    <div class="frow"><label class="flbl">Tags</label><input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. NLP, RAG, hallucination"></div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || '';
    return {
      title: v('f_title'),
      domain: v('f_domain'),
      status: v('f_status'),
      hypothesis: v('f_hypothesis'),
      methodology: v('f_methodology'),
      findings: Array.from(document.querySelectorAll('#f_findings .irow input') as NodeListOf<HTMLInputElement>)
        .map(i => i.value)
        .filter(Boolean),
      references: Array.from(document.querySelectorAll('#f_refs .irow') as NodeListOf<HTMLElement>)
        .map(row => {
          const inputs = row.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
          return { text: inputs[0]?.value || '', url: inputs[1]?.value || '' };
        })
        .filter(r => r.text),
      conclusion: v('f_conclusion'),
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const statusMap: Record<string, { lbl: string; cls: string }> = {
      ip:   { lbl: 'In Progress', cls: 'rs-ip' },
      done: { lbl: 'Completed',   cls: 'rs-done' },
      hold: { lbl: 'On Hold',     cls: 'rs-hold' },
    };
    const st = statusMap[d['status']] || statusMap['ip'];
    const findings = (d['findings'] || []).filter(Boolean) as string[];
    const refs = (d['references'] || []).filter((r: any) => r && r.text) as { text: string; url: string }[];

    return `
    <div class="rs-meta">
      ${d['domain'] ? `<span class="rs-domain">📍 ${highlightFn(d['domain'])}</span>` : ''}
      <span class="rs-status ${st.cls}">${st.lbl}</span>
    </div>
    ${d['hypothesis'] ? `<div class="cb-insight" style="border-left-color:${color.dot};background:${color.bg}22">
      <strong>💡 Hypothesis:</strong> ${highlightFn(d['hypothesis'])}</div>` : ''}
    ${d['methodology'] ? `<div style="margin-top:10px"><div class="cb-label">Methodology</div>
      <div class="cb-body" style="margin-top:3px">${highlightFn(d['methodology'])}</div></div>` : ''}
    ${(findings.length || refs.length) ? `<div class="two-col">
      <div class="col-box">
        <div class="cb-label">🔍 Key Findings</div>
        <div class="bl-list">${findings.map((f, i) => `<div class="bl-item">
          <span class="rs-num">${i + 1}</span><span>${highlightFn(f)}</span></div>`).join('')}</div>
      </div>
      <div class="col-box">
        <div class="cb-label">📚 References</div>
        ${refs.map(r => r.url
          ? `<a class="link-chip" href="${esc(r.url)}" target="_blank" style="background:${color.bg};color:${color.text};border-color:${color.border}">🔗 ${highlightFn(r.text)}</a>`
          : `<span class="link-chip plain" style="background:${color.bg};color:${color.text};border-color:${color.border}">${highlightFn(r.text)}</span>`
        ).join('')}
      </div>
    </div>` : ''}
    ${d['conclusion'] ? `<div class="cb-footer" style="border-left-color:${color.dot};background:${color.bg}22">
      <strong>🎯 Conclusion:</strong> ${highlightFn(d['conclusion'])}</div>` : ''}
    ${(d['tags'] || []).length ? `<div class="tag-row">${(d['tags'] as string[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  },
};
