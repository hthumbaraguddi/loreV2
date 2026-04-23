import { Injectable } from '@angular/core';

const CONTAINMENT_CSS = `<style id="lore-containment">
*, *::before, *::after {
  animation: none !important;
  animation-delay: 0s !important;
  animation-duration: 0s !important;
  transition: none !important;
  transition-delay: 0s !important;
  transition-duration: 0s !important;
}
* {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}
.hidden, .hide, [hidden],
.tab-pane:not(.active),
.fade:not(.show),
.collapse:not(.show) {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}
html, body {
  overflow-x: hidden !important;
  box-sizing: border-box !important;
}
img, video, canvas, table {
  max-width: 100% !important;
}
input, textarea, select, button, a {
  pointer-events: none !important;
}
</style>`;

@Injectable({ providedIn: 'root' })
export class HtmlProcessorService {

  /**
   * Remove all <script> elements (and their contents) and all inline on* event
   * handler attributes from the given HTML string.
   */
  sanitise(html: string): string {
    // Remove <script>...</script> blocks (including multiline, with any attributes)
    let result = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');

    // Remove on* event handler attributes (e.g. onclick="...", onload='...', onerror=handler)
    // Handles both quoted and unquoted attribute values
    result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

    return result;
  }

  /**
   * Extract a title from the HTML string using the following priority:
   * 1. Text content of the first <title> element
   * 2. Text content of the first <h1>, <h2>, or <h3> element (inner tags stripped)
   * 3. Fallback: "HTML Note"
   *
   * The result is truncated to 80 characters.
   */
  extractTitle(html: string): string {
    // Try <title> tag
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
    if (titleMatch) {
      const text = this._stripTags(titleMatch[1]).trim();
      if (text) {
        return text.slice(0, 80);
      }
    }

    // Try first <h1>, <h2>, or <h3>
    const headingMatch = html.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]\s*>/i);
    if (headingMatch) {
      const text = this._stripTags(headingMatch[1]).trim();
      if (text) {
        return text.slice(0, 80);
      }
    }

    return 'HTML Note';
  }

  /**
   * Prepend the containment <style> block to the HTML string.
   * If a <head> tag is present, the style is inserted as the first child of <head>.
   * Otherwise, it is prepended to the beginning of the string.
   */
  prependContainmentCss(html: string): string {
    const headMatch = html.match(/<head\b[^>]*>/i);
    if (headMatch && headMatch.index !== undefined) {
      const insertAt = headMatch.index + headMatch[0].length;
      return html.slice(0, insertAt) + '\n' + CONTAINMENT_CSS + '\n' + html.slice(insertAt);
    }
    return CONTAINMENT_CSS + '\n' + html;
  }

  /**
   * Full pipeline for Blob rendering: sanitise then prependContainmentCss.
   */
  prepareForRendering(html: string): string {
    return this.prependContainmentCss(this.sanitise(html));
  }

  /** Strip all HTML tags from a string, returning plain text. */
  private _stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, '');
  }
}
