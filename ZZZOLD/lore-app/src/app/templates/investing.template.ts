import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const investingTemplate: TemplateDefinition = {
  id: 'investing',
  name: 'Investment Notes',
  icon: '📈',
  color: 'green',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const wlItems = (d['watchlist'] || [])
      .map((w: { ticker: string; price: string; dir: string; thesis: string }) =>
        `<div class="irow"><input class="fin" value="${esc(w.ticker || '')}" placeholder="TICKER" style="width:72px"><input class="fin" value="${esc(w.price || '')}" placeholder="₹ / $" style="width:80px"><select class="fsel" style="width:78px"><option value="up" ${w.dir === 'up' ? 'selected' : ''}>↑ Up</option><option value="down" ${w.dir === 'down' ? 'selected' : ''}>↓ Down</option><option value="flat" ${(!w.dir || w.dir === 'flat') ? 'selected' : ''}>→ Flat</option></select><input class="fin" value="${esc(w.thesis || '')}" placeholder="Brief thesis…" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');
    const trItems = (d['trades'] || [])
      .map((t: { ticker: string; action: string; price: string; qty: string; notes: string }) =>
        `<div class="irow"><input class="fin" value="${esc(t.ticker || '')}" placeholder="TICKER" style="width:72px"><select class="fsel" style="width:75px"><option ${t.action === 'BUY' || !t.action ? 'selected' : ''}>BUY</option><option ${t.action === 'SELL' ? 'selected' : ''}>SELL</option><option ${t.action === 'HOLD' ? 'selected' : ''}>HOLD</option></select><input class="fin" value="${esc(t.price || '')}" placeholder="Price" style="width:80px"><input class="fin" value="${esc(t.qty || '')}" placeholder="Qty" style="width:58px"><input class="fin" value="${esc(t.notes || '')}" placeholder="Reason / note…" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');
    const cats = (d['catalysts'] || [])
      .map((c: string) =>
        `<div class="irow"><input class="fin" value="${esc(c)}" placeholder="e.g. Fed rate decision, NVDA earnings"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button></div>`)
      .join('');

    return `
    <div class="frow"><label class="flbl">Note Title *</label><input class="fin" id="f_title" value="${esc(d['title'] || '')}" placeholder="e.g. Week of Mar 10 — Tech Sector Focus"></div>
    <div class="g2">
      <div class="frow"><label class="flbl">📅 Week Of</label><input class="fin" id="f_weekOf" value="${esc(d['weekOf'] || '')}" placeholder="e.g. Mar 10, 2026"></div>
      <div class="frow"><label class="flbl">Market Sentiment</label>
        <select class="fsel" id="f_sentiment">
          <option value="bull" ${d['sentiment'] === 'bull' ? 'selected' : ''}>📈 Bullish</option>
          <option value="bear" ${d['sentiment'] === 'bear' ? 'selected' : ''}>📉 Bearish</option>
          <option value="neut" ${!d['sentiment'] || d['sentiment'] === 'neut' ? 'selected' : ''}>→ Neutral</option>
          <option value="vol" ${d['sentiment'] === 'vol' ? 'selected' : ''}>⚡ Volatile</option>
        </select>
      </div>
    </div>
    <div class="frow"><label class="flbl">Portfolio Overview / Notes</label>
      <textarea class="fta" id="f_portNotes" style="min-height:52px" placeholder="Overall portfolio state, thesis for the week…">${esc(d['portfolioNotes'] || '')}</textarea></div>
    <div class="fsec">
      <div class="fsec-ttl">👁 Watchlist</div>
      <div style="display:flex;gap:5px;font-size:10px;color:var(--tt);margin-bottom:5px"><span style="width:72px">Ticker</span><span style="width:80px">Price</span><span style="width:78px">Direction</span><span style="flex:1">Thesis</span><span style="width:28px"></span></div>
      <div class="irows" id="f_watchlist">${wlItems}</div>
      <button class="btn-ar" onclick="addTickerRow()">＋ Add to Watchlist</button>
    </div>
    <div class="fsec">
      <div class="fsec-ttl">📊 Trades This Week</div>
      <div style="display:flex;gap:5px;font-size:10px;color:var(--tt);margin-bottom:5px"><span style="width:72px">Ticker</span><span style="width:75px">Action</span><span style="width:80px">Price</span><span style="width:58px">Qty</span><span style="flex:1">Notes</span><span style="width:28px"></span></div>
      <div class="irows" id="f_trades">${trItems}</div>
      <button class="btn-ar" onclick="addTradeRow()">＋ Add Trade</button>
    </div>
    <div class="fsec">
      <div class="fsec-ttl">⚡ Market Catalysts / Events</div>
      <div class="irows" id="f_catalysts">${cats}</div>
      <button class="btn-ar" onclick="addRow('f_catalysts','e.g. Fed meeting, earnings release…')">＋ Add Catalyst</button>
    </div>
    <div class="frow" style="margin-top:14px"><label class="flbl">📅 Next Week Focus</label>
      <textarea class="fta" id="f_nextWeek" style="min-height:50px" placeholder="What to watch or act on next week…">${esc(d['nextWeekFocus'] || '')}</textarea></div>
    <div class="frow"><label class="flbl">Tags</label><input class="fin" id="f_tags" value="${esc((d['tags'] || []).join(', '))}" placeholder="e.g. NVDA, tech, Q1-2026"></div>`;
  },

  readForm(): Record<string, any> {
    const v = (id: string) => (document.querySelector('#' + id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || '';
    const wl: { ticker: string; price: string; dir: string; thesis: string }[] = [];
    document.querySelectorAll('#f_watchlist .irow').forEach((row) => {
      const ins = Array.from(row.querySelectorAll('input')) as HTMLInputElement[];
      const sel = row.querySelector('select') as HTMLSelectElement | null;
      if (ins[0]?.value.trim()) {
        wl.push({ ticker: ins[0].value.trim(), price: ins[1]?.value.trim() || '', dir: sel?.value || 'flat', thesis: ins[2]?.value.trim() || '' });
      }
    });
    const trades: { ticker: string; action: string; price: string; qty: string; notes: string }[] = [];
    document.querySelectorAll('#f_trades .irow').forEach((row) => {
      const ins = Array.from(row.querySelectorAll('input')) as HTMLInputElement[];
      const sel = row.querySelector('select') as HTMLSelectElement | null;
      if (ins[0]?.value.trim()) {
        trades.push({ ticker: ins[0].value.trim(), action: sel?.value || 'BUY', price: ins[1]?.value.trim() || '', qty: ins[2]?.value.trim() || '', notes: ins[3]?.value.trim() || '' });
      }
    });
    return {
      title: v('f_title'),
      weekOf: v('f_weekOf'),
      sentiment: v('f_sentiment'),
      portfolioNotes: v('f_portNotes'),
      watchlist: wl,
      trades,
      catalysts: Array.from(document.querySelectorAll('#f_catalysts .irow input') as NodeListOf<HTMLInputElement>)
        .map(i => i.value)
        .filter(Boolean),
      nextWeekFocus: v('f_nextWeek'),
      tags: v('f_tags').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const d = note.data || {};
    const sentMap: Record<string, { lbl: string; cls: string }> = {
      bull: { lbl: '📈 Bullish', cls: 'sent-bull' },
      bear: { lbl: '📉 Bearish', cls: 'sent-bear' },
      neut: { lbl: '→ Neutral', cls: 'sent-neut' },
      vol:  { lbl: '⚡ Volatile', cls: 'sent-vol' },
    };
    const sent = sentMap[d['sentiment']] || sentMap['neut'];
    const wl = (d['watchlist'] || []).filter((w: any) => w && w.ticker) as { ticker: string; price: string; dir: string; thesis: string }[];
    const trades = (d['trades'] || []).filter((t: any) => t && t.ticker) as { ticker: string; action: string; price: string; qty: string; notes: string }[];
    const cats = (d['catalysts'] || []).filter(Boolean) as string[];

    return `
    <div class="inv-meta">
      ${d['weekOf'] ? `<span>📅 Week of ${highlightFn(d['weekOf'])}</span>` : ''}
      <span class="${sent.cls}">${sent.lbl}</span>
    </div>
    ${d['portfolioNotes'] ? `<div class="cb-insight" style="border-left-color:${color.dot};background:${color.bg}22;margin-top:10px">
      ${highlightFn(d['portfolioNotes'])}</div>` : ''}
    ${wl.length ? `<div style="margin-top:11px">
      <div class="cb-label">👁 Watchlist</div>
      <div class="ticker-grid">${wl.map(w => {
        const cls = w.dir === 'up' ? 'tk-up' : w.dir === 'down' ? 'tk-down' : 'tk-flat';
        const arrow = w.dir === 'up' ? '↑' : w.dir === 'down' ? '↓' : '→';
        return `<div class="tk-chip ${cls}"><span class="tk-sym">${arrow} ${esc(w.ticker)}</span>${w.price ? `<span class="tk-price">${esc(w.price)}</span>` : ''}<span class="tk-thesis">${esc(w.thesis || '')}</span></div>`;
      }).join('')}</div>
    </div>` : ''}
    ${trades.length ? `<div style="margin-top:12px">
      <div class="cb-label">📊 This Week's Trades</div>
      ${trades.map(t => {
        const badgeCls = t.action === 'BUY' ? 'tr-buy' : t.action === 'SELL' ? 'tr-sell' : 'tr-hold';
        return `<div class="trade-row">
          <span class="${badgeCls}">${esc(t.action)}</span>
          <span class="tr-ticker">${esc(t.ticker)}</span>
          <span class="tr-detail">${t.price ? esc(t.price) : ''}${t.qty ? ' × ' + esc(t.qty) : ''}</span>
          ${t.notes ? `<span class="tr-note">${highlightFn(t.notes)}</span>` : ''}
        </div>`;
      }).join('')}
    </div>` : ''}
    ${cats.length ? `<div style="margin-top:12px">
      <div class="cb-label">⚡ Market Catalysts</div>
      <div class="bl-list">${cats.map(cat => `<div class="bl-item"><span style="font-size:10px;color:var(--acc);flex-shrink:0;margin-top:3px">●</span><span>${highlightFn(cat)}</span></div>`).join('')}</div>
    </div>` : ''}
    ${d['nextWeekFocus'] ? `<div class="cb-footer" style="border-left-color:${color.dot};background:${color.bg}22">
      <strong>📅 Next Week:</strong> ${highlightFn(d['nextWeekFocus'])}</div>` : ''}
    ${(d['tags'] || []).length ? `<div class="tag-row">${(d['tags'] as string[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  },
};
