import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * MarkdownPipe
 *
 * Converts a subset of Markdown to sanitized HTML.
 * Handles the constructs most common in AI responses:
 *   - Fenced code blocks (``` lang ... ```)
 *   - Inline code (`code`)
 *   - ATX headings (# H1 – ### H3)
 *   - Bold (**text** or __text__)
 *   - Italic (*text* or _text_)
 *   - Unordered lists (- item or * item)
 *   - Ordered lists (1. item)
 *   - Blockquotes (> text)
 *   - Horizontal rules (--- or ***)
 *   - Paragraphs (blank-line separated)
 *   - Line breaks (two trailing spaces or \n inside a paragraph)
 *
 * No external dependencies — uses only DomSanitizer to mark the
 * output as trusted HTML after escaping raw user content.
 */
@Pipe({
  name: 'markdown',
  standalone: true,
  pure: true
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return this.sanitizer.bypassSecurityTrustHtml('');
    const html = this.parse(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // ── Parser ──────────────────────────────────────────────────────────────────

  private parse(md: string): string {
    // Normalise line endings
    let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Extract fenced code blocks to protect them from inline processing
    const codeBlocks: string[] = [];
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
      const escaped = this.escapeHtml(code.replace(/\n$/, ''));
      const langAttr = lang ? ` class="language-${this.escapeHtml(lang)}"` : '';
      codeBlocks.push(`<pre><code${langAttr}>${escaped}</code></pre>`);
      return `\x00CODE${codeBlocks.length - 1}\x00`;
    });

    // 2. Split into blocks (paragraphs separated by blank lines)
    const blocks = text.split(/\n{2,}/);
    const rendered = blocks.map(block => this.renderBlock(block, codeBlocks));

    // 3. Restore code blocks
    return rendered.join('\n');
  }

  private renderBlock(block: string, codeBlocks: string[]): string {
    const trimmed = block.trim();

    // Restore code block placeholder
    const codeMatch = trimmed.match(/^\x00CODE(\d+)\x00$/);
    if (codeMatch) {
      return codeBlocks[parseInt(codeMatch[1], 10)];
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return `<h${level}>${this.renderInline(headingMatch[2])}</h${level}>`;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      return '<hr>';
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const inner = trimmed.replace(/^> ?/gm, '');
      return `<blockquote>${this.renderInline(inner)}</blockquote>`;
    }

    // Unordered list
    if (/^[-*+] /m.test(trimmed)) {
      const items = trimmed
        .split('\n')
        .filter(l => /^[-*+] /.test(l))
        .map(l => `<li>${this.renderInline(l.replace(/^[-*+] /, ''))}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    }

    // Ordered list
    if (/^\d+\. /m.test(trimmed)) {
      const items = trimmed
        .split('\n')
        .filter(l => /^\d+\. /.test(l))
        .map(l => `<li>${this.renderInline(l.replace(/^\d+\. /, ''))}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    }

    // Paragraph — convert single newlines to <br>
    if (trimmed) {
      const withBreaks = trimmed.replace(/\n/g, '<br>');
      return `<p>${this.renderInline(withBreaks)}</p>`;
    }

    return '';
  }

  // ── Inline rendering ────────────────────────────────────────────────────────

  private renderInline(text: string): string {
    // Inline code (protect from further processing)
    const inlineCodes: string[] = [];
    let result = text.replace(/`([^`]+)`/g, (_m, code) => {
      inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
      return `\x00IC${inlineCodes.length - 1}\x00`;
    });

    // Bold + italic (***text***)
    result = result.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
    // Bold (**text** or __text__)
    result = result.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
    result = result.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');
    // Italic (*text* or _text_) — avoid matching inside words for _
    result = result.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    result = result.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>');

    // Links [text](url)
    result = result.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Restore inline codes
    result = result.replace(/\x00IC(\d+)\x00/g, (_m, i) => inlineCodes[parseInt(i, 10)]);

    return result;
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
