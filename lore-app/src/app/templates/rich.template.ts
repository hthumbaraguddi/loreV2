import { marked } from 'marked';
import { TemplateDefinition } from '../services/template.service';
import { Note, SectionColor } from '../models';

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const richTemplate: TemplateDefinition = {
  id: 'rich',
  name: 'Rich Note',
  icon: '📝',
  color: '#6366f1',

  buildForm(data?: Record<string, any>): string {
    const d = data || {};
    const contentType = d['contentType'] || 'markdown';
    const content = esc(d['markdown'] || '');

    if (contentType === 'html') {
      return `
      <input type="hidden" id="f_content_type" value="html">
      <div class="rich-html-badge">HTML Note — raw HTML content</div>
      <textarea class="fta rich-ta" id="f_markdown" placeholder="HTML content…">${content}</textarea>`;
    }

    return `
    <input type="hidden" id="f_content_type" value="markdown">
    <div class="rich-mode-row"><button class="btn-mode active" id="btn-toolbar-mode" onclick="setRichMode('toolbar')">Toolbar</button><button class="btn-mode" id="btn-raw-mode" onclick="setRichMode('raw')">Raw</button></div>
    <div class="rich-toolbar" id="rich-toolbar"><button onclick="richInsert('**','**')"><b>B</b></button><button onclick="richInsert('*','*')"><i>I</i></button><button onclick="richInsert('# ','')">H1</button><button onclick="richInsert('## ','')">H2</button><button onclick="richInsert('### ','')">H3</button><button onclick="richInsert('- ','')">• List</button><button onclick="richInsert('1. ','')">1. List</button><button onclick="richInsert('\`\`\`\n','\n\`\`\`')">Code</button><button onclick="richInsert('> ','')">Quote</button></div>
    <textarea class="fta rich-ta" id="f_markdown" placeholder="Write in markdown or paste AI response here…">${content}</textarea>
    <script>
      function setRichMode(mode) {
        var toolbar = document.getElementById('rich-toolbar');
        var btnToolbar = document.getElementById('btn-toolbar-mode');
        var btnRaw = document.getElementById('btn-raw-mode');
        if (mode === 'toolbar') {
          toolbar.style.display = '';
          btnToolbar.classList.add('active');
          btnRaw.classList.remove('active');
        } else {
          toolbar.style.display = 'none';
          btnToolbar.classList.remove('active');
          btnRaw.classList.add('active');
        }
      }
      function richInsert(before, after) {
        var ta = document.getElementById('f_markdown');
        if (!ta) return;
        var start = ta.selectionStart;
        var end = ta.selectionEnd;
        var selected = ta.value.substring(start, end);
        var replacement = before + selected + after;
        ta.value = ta.value.substring(0, start) + replacement + ta.value.substring(end);
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + selected.length;
        ta.focus();
      }
    <\/script>`;
  },

  readForm(): Record<string, any> {
    const ta = document.querySelector('#f_markdown') as HTMLTextAreaElement | null;
    const value = ta?.value || '';
    const ctInput = document.querySelector('#f_content_type') as HTMLInputElement | null;
    const contentType = ctInput?.value || 'markdown';

    const lines = value.split('\n');
    const firstNonEmpty = lines.find(l => l.trim() !== '') || '';

    let title: string;
    if (contentType === 'html') {
      // Extract title from <title> tag or first <h1>/<h2>/<h3>
      const titleMatch = value.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = value.match(/<h[123][^>]*>([^<]+)<\/h[123]>/i);
      if (titleMatch?.[1]) {
        title = titleMatch[1].trim().substring(0, 80);
      } else if (h1Match?.[1]) {
        title = h1Match[1].trim().substring(0, 80);
      } else {
        title = 'HTML Note';
      }
    } else if (firstNonEmpty.startsWith('# ')) {
      title = firstNonEmpty.replace(/^# /, '').trim().substring(0, 80);
    } else if (firstNonEmpty.trim()) {
      title = firstNonEmpty.trim().substring(0, 80);
    } else {
      title = 'Untitled Note';
    }

    return { markdown: value, title, contentType };
  },

  renderCard(note: Note, color: SectionColor, highlightFn: (text: string) => string): string {
    const contentType = note.data['contentType'] || 'markdown';
    if (contentType === 'html') {
      // Render HTML content in a sandboxed iframe-like container
      const raw = note.data['markdown'] || '';
      return `<div class="rich-html-frame">${raw}</div>`;
    }
    const html = marked.parse(note.data['markdown'] || '') as string;
    return `<div class="rich-card-body">${html}</div>`;
  },
};
