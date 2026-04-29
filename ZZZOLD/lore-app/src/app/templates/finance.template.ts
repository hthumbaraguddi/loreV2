import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const financeTemplate: TemplateDefinition = {
  id: 'finance',
  name: 'Financial Log',
  icon: '💰',
  color: 'amber',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const inc = (d['income'] || [])
      .map((i: { label: string; amount: string }) =>
        `<div class="irow"><input class="fin" value="${esc(i.label || '')}" placeholder="e.g. Salary, Freelance" style="flex:1"><input class="amt-in" value="${esc(i.amount || '')}" placeholder="₹ 0"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');
    const exp = (d['expenses'] || [])
      .map((e: { label: string; amount: string }) =>
        `<div class="irow"><input class="fin" value="${esc(e.label || '')}" placeholder="e.g. Rent, Groceries" style="flex:1"><input class="amt-in" value="${esc(e.amount || '')}" placeholder="₹ 0"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');

    return `
    <div class="frow"><label class="flbl">Note Title *</label><input class="fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="e.g. March 2026 — Monthly Review"></div>
    <div class="g2">
      <div class="frow"><label class="flbl">📅 Period</label><input class="fin" id="f_period" value="${esc(d['period'] || '')}" placeholder="e.g. March 2026"></div>
      <div class="frow"><label class="flbl">Period Type</label>
        <select class="fsel" id="f_periodType">
          <option value="Monthly" ${d['periodType'] === 'Monthly' || !d['periodType'] ? 'selected' : ''}>Monthly</option>
          <option value="Weekly" ${d['periodType'] === 'Weekly' ? 'selected' : ''}>Weekly</option>
          <option value="Quarterly" ${d['periodType'] === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
          <option value="Annual" ${d['periodType'] === 'Annual' ? 'selected' : ''}>Annual</option>
        </select>
      </div>
    </div>
    <div class="frow"><label class="flbl">💡 Money Insight</label>
      <input class="fin" id="f_insight" value="${esc(d['insight'] || '')}" placeholder="Key financial lesson this period…"></div>
    <div class="fsec">
      <div class="fsec-ttl">💚 Income Sources</div>
      <div style="display:flex;gap:5px;font-size:10px;color:var(--tt);margin-bottom:5px"><span style="flex:1">Source</span><span style="width:95px;text-align:right;margin-right:28px">Amount (₹)</span></div>
      <div class="irows" id="f_income">${inc}</div>
      <button class="btn-ar" onclick="addAmtRow('f_income','e.g. Salary, Freelance project')">＋ Add Income</button>
    </div>
    <div class="fsec">
      <div class="fsec-ttl">❤️ Expenses</div>
      <div style="display:flex;gap:5px;font-size:10px;color:var(--tt);margin-bottom:5px"><span style="flex:1">Category</span><span style="width:95px;text-align:right;margin-right:28px">Amount (₹)</span></div>
      <div class="irows" id="f_expenses">${exp}</div>
      <button class="btn-ar" onclick="addAmtRow('f_expenses','e.g. Rent, Groceries, EMI')">＋ Add Expense</button>
    </div>
    <div class="frow" style="margin-top:14px"><label class="flbl">🎯 Savings Goal</label>
      <input class="fin" id="f_savingsGoal" value="${esc(d['savingsGoal'] || '')}" placeholder="e.g. Save ₹20,000 towards emergency fund"></div>
    <div class="frow"><label class="flbl">Tags</label><input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. march, Q1, savings"></div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLSelectElement)?.value || '';
    const readAmt = (id: string) => {
      const rows: { label: string; amount: string }[] = [];
      document.querySelectorAll('#' + id + ' .irow').forEach((row) => {
        const ins = Array.from(row.querySelectorAll('input')) as HTMLInputElement[];
        if (ins[0]?.value.trim()) {
          rows.push({ label: ins[0].value.trim(), amount: ins[1]?.value.trim() || '0' });
        }
      });
      return rows;
    };
    return {
      title: v('f_title'),
      period: v('f_period'),
      periodType: v('f_periodType'),
      insight: v('f_insight'),
      income: readAmt('f_income'),
      expenses: readAmt('f_expenses'),
      savingsGoal: v('f_savingsGoal'),
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const pa = (s: any) => parseFloat(String(s).replace(/[^0-9.\-]/g, '')) || 0;
    const fmt = (n: number) => {
      const a = Math.abs(n);
      return a >= 100000 ? '₹' + (a / 100000).toFixed(2) + 'L'
        : a >= 1000 ? '₹' + (a / 1000).toFixed(1) + 'K'
        : '₹' + a.toFixed(0);
    };
    const inc = (d['income'] || []).filter((i: any) => i && i.label) as { label: string; amount: string }[];
    const exp = (d['expenses'] || []).filter((e: any) => e && e.label) as { label: string; amount: string }[];
    const totI = inc.reduce((s, i) => s + pa(i.amount), 0);
    const totE = exp.reduce((s, e) => s + pa(e.amount), 0);
    const net = totI - totE;
    const netCls = net > 0 ? 'fin-net-pos' : net < 0 ? 'fin-net-neg' : 'fin-net-zero';

    return `
    ${d['period'] ? `<span class="fin-period-badge">📅 ${highlightFn(d['period'])}${d['periodType'] ? ' · ' + esc(d['periodType']) : ''}</span>` : ''}
    ${d['insight'] ? `<div class="cb-insight" style="border-left-color:${color.dot};background:${color.bg}22;margin-top:10px">
      <strong>💡 Insight:</strong> ${highlightFn(d['insight'])}</div>` : ''}
    ${(inc.length || exp.length) ? `<div class="fin-cols">
      <div class="fin-col fin-inc">
        <div class="cb-label" style="color:#15803D;margin-bottom:8px">💚 Income</div>
        ${inc.map(i => `<div class="fin-row"><span class="fin-lbl">${highlightFn(i.label)}</span><span class="fin-amt-g">+${fmt(pa(i.amount))}</span></div>`).join('')}
        ${inc.length ? `<div class="fin-total fin-total-g"><span>Total</span><span>+${fmt(totI)}</span></div>` : ''}
      </div>
      <div class="fin-col fin-exp">
        <div class="cb-label" style="color:#DC2626;margin-bottom:8px">❤️ Expenses</div>
        ${exp.map(e => `<div class="fin-row"><span class="fin-lbl">${highlightFn(e.label)}</span><span class="fin-amt-r">−${fmt(pa(e.amount))}</span></div>`).join('')}
        ${exp.length ? `<div class="fin-total fin-total-r"><span>Total</span><span>−${fmt(totE)}</span></div>` : ''}
      </div>
    </div>
    <div class="fin-net ${netCls}">
      <span>${net >= 0 ? '✅ Surplus' : '⚠ Deficit'}</span>
      <span style="font-size:15px">${net >= 0 ? '+' + fmt(net) : '-' + fmt(totE - totI)}</span>
    </div>` : ''}
    ${d['savingsGoal'] ? `<div class="fin-goal">🎯 <strong style="color:var(--tp)">Savings Goal:</strong> ${highlightFn(d['savingsGoal'])}</div>` : ''}
    ${(d['tags'] || []).length ? `<div class="tag-row">${(d['tags'] as string[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  },
};
