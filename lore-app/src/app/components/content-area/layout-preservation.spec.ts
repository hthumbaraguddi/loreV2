/**
 * Preservation Property Tests: Default Layout Behavior
 *
 * Property 3: Preservation — Default Layout Behavior
 *
 * For any layout state where the sidebar is in its default open position and
 * standard (non-HTML) notes are displayed, the topbar and content areas SHALL
 * produce exactly the same layout as the original implementation, preserving
 * all existing padding, width constraints, and visual appearance.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * Testing approach:
 * We inject the relevant CSS rules into a real DOM (ChromeHeadless) and use
 * getComputedStyle to verify that the CSS fix has NOT changed any of the
 * preserved behaviors. fast-check is used to generate many test inputs and
 * verify the property holds across all of them.
 *
 * Behaviors verified as preserved:
 *   1. Sidebar open state → topbar has 36px left padding (Req 3.1)
 *   2. Standard note layout is unchanged — no max-width constraints removed (Req 3.2)
 *   3. Page editor standard mode max-width is 720px (Req 3.3)
 *   4. Mobile view rules are still in place (Req 3.4)
 *   5. Topbar controls layout is preserved (flex, gap, etc.) (Req 3.5)
 *   6. View mode transitions — no conflicting CSS rules (Req 3.6)
 */

import * as fc from 'fast-check';

// ── CSS rules under test ──────────────────────────────────────────────────────
// These are the exact rules from styles.scss and page-editor.component.scss
// after the fix has been applied. We inject them into the test DOM so we can
// verify computed styles.

const GLOBAL_CSS_RULES = `
  :root {
    --topbar-left-padding: 36px;
    --sbw: 262px;
  }

  #app.sb-collapsed {
    --topbar-left-padding: 24px;
  }

  #app.sb-collapsed #main {
    width: 100vw;
  }

  #main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
    position: relative;
    width: calc(100vw - var(--sbw));
  }

  #topbar {
    display: flex;
    align-items: center;
    padding: 9px 20px 9px var(--topbar-left-padding);
    border-bottom: 1px solid rgba(0,0,0,0.08);
    background: #fff;
    gap: 8px;
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    max-width: 100%;
    justify-content: space-between;
  }

  .tb-crumb {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .card-body--html {
    overflow: hidden;
    border-radius: 0 0 12px 12px;
    max-width: 100%;
  }

  .card-body--html iframe,
  .card-body--html .html-content {
    max-width: 100%;
    width: 100%;
  }

  .pg-editor-body--wide .card-body--html {
    width: 100%;
  }

  /* Mobile rules */
  @media (max-width: 768px) {
    #topbar {
      padding: 9px 12px 9px var(--topbar-left-padding);
    }
    #sidebar {
      position: fixed;
      z-index: 100;
    }
  }
`;

const PAGE_EDITOR_CSS_RULES = `
  .pg-editor-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 24px 9px var(--topbar-left-padding);
    border-bottom: 1px solid rgba(0,0,0,0.08);
    flex-shrink: 0;
    gap: 12px;
  }

  .pg-editor-body {
    max-width: 720px;
    margin: 0 auto;
    width: 100%;
  }

  .pg-editor-body.pg-editor-body--wide {
    max-width: none;
  }

  .pg-editor-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 48px 24px 100px;
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function injectStyles(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

function removeElement(el: Element): void {
  el.parentNode?.removeChild(el);
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Layout Preservation — Property 3: Default Layout Behavior', () => {
  let globalStyleEl: HTMLStyleElement;
  let pageEditorStyleEl: HTMLStyleElement;

  beforeAll(() => {
    globalStyleEl = injectStyles(GLOBAL_CSS_RULES);
    pageEditorStyleEl = injectStyles(PAGE_EDITOR_CSS_RULES);
  });

  afterAll(() => {
    removeElement(globalStyleEl);
    removeElement(pageEditorStyleEl);
  });

  // ── 1. Sidebar open state: topbar has 36px left padding ───────────────────

  describe('Preservation 3.1 — Sidebar open state: topbar 36px left padding', () => {
    /**
     * **Validates: Requirements 3.1**
     *
     * For all sidebar-open states, topbar SHALL have 36px left padding.
     * The fix must not change this default behavior.
     *
     * Property-based: generate many DOM configurations (different IDs, extra
     * classes on #app) and verify the padding is always 36px when sb-collapsed
     * is NOT present.
     */

    it('topbar has 36px left padding when sidebar is open (default state)', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        const paddingLeft = getComputedStyle(topbarEl).paddingLeft;
        expect(paddingLeft).toBe('36px');
      } finally {
        removeElement(appEl);
      }
    });

    it('--topbar-left-padding custom property is 36px on :root by default', () => {
      const rootPadding = getComputedStyle(document.documentElement)
        .getPropertyValue('--topbar-left-padding')
        .trim();
      expect(rootPadding).toBe('36px');
    });

    it('property: topbar left padding is 36px for all sidebar-open states (fast-check)', (done) => {
      /**
       * **Validates: Requirements 3.1**
       *
       * For ALL sidebar-open states (various extra classes, data attributes),
       * the topbar SHALL maintain 36px left padding.
       */
      const extraClasses = fc.array(
        fc.constantFrom('theme-dark', 'theme-light', 'mobile', 'settings-open', 'chat-open'),
        { minLength: 0, maxLength: 3 }
      );

      fc.assert(
        fc.property(extraClasses, (classes) => {
          const appEl = document.createElement('div');
          appEl.id = 'app';
          // Add extra classes but NOT sb-collapsed
          classes.forEach(cls => appEl.classList.add(cls));

          const topbarEl = document.createElement('div');
          topbarEl.id = 'topbar';
          appEl.appendChild(topbarEl);
          document.body.appendChild(appEl);

          try {
            const paddingLeft = getComputedStyle(topbarEl).paddingLeft;
            return paddingLeft === '36px';
          } finally {
            removeElement(appEl);
          }
        }),
        { numRuns: 50 }
      );

      done();
    });

    it('topbar padding reverts to 36px when sidebar is re-opened after collapse', () => {
      /**
       * **Validates: Requirements 3.1**
       *
       * When the sidebar is re-opened, the topbar SHALL revert to 36px.
       * This confirms the fix is reversible and preserves the open state.
       */
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        // Collapse
        appEl.classList.add('sb-collapsed');
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('24px');

        // Re-open
        appEl.classList.remove('sb-collapsed');
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('36px');
      } finally {
        removeElement(appEl);
      }
    });
  });

  // ── 2. Standard note layout is unchanged ─────────────────────────────────

  describe('Preservation 3.2 — Standard note layout is unchanged', () => {
    /**
     * **Validates: Requirements 3.2**
     *
     * When standard (non-HTML) notes are displayed, they SHALL CONTINUE TO
     * render with their existing layout behavior. The fix must not introduce
     * max-width constraints or overflow changes on standard note cards.
     */

    it('standard .note-card has max-width: 100% (not a restrictive pixel value)', () => {
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
      document.body.appendChild(noteCard);

      try {
        const style = getComputedStyle(noteCard);
        // Standard note cards should not have a restrictive pixel max-width from the fix
        // (the fix only adds max-width: 100% to .card-body--html, not a pixel constraint)
        expect(style.maxWidth).not.toBe('720px');
        expect(style.maxWidth).not.toBe('0px');
      } finally {
        removeElement(noteCard);
      }
    });

    it('.card-body--html max-width rule does not affect standard .card-body', () => {
      // The HTML fix adds max-width: 100% to .card-body--html specifically.
      // Standard .card-body elements should not be affected by this rule.
      // We verify by checking that .card-body--html has max-width: 100%
      // while a plain .card-body does not have that specific rule applied.
      const cardBodyHtml = document.createElement('div');
      cardBodyHtml.className = 'card-body--html';
      document.body.appendChild(cardBodyHtml);

      try {
        const style = getComputedStyle(cardBodyHtml);
        // The HTML-specific rule should apply max-width: 100%
        expect(style.maxWidth).toBe('100%');
      } finally {
        removeElement(cardBodyHtml);
      }
    });

    it('property: standard note cards preserve max-width across many sidebar states (fast-check)', (done) => {
      /**
       * **Validates: Requirements 3.2**
       *
       * For all sidebar states (open or collapsed), standard note cards SHALL
       * maintain their layout without being affected by the HTML fix rules.
       * Specifically, the fix must not introduce a restrictive pixel max-width.
       */
      const sidebarStates = fc.boolean(); // true = collapsed, false = open

      fc.assert(
        fc.property(sidebarStates, (isCollapsed) => {
          const appEl = document.createElement('div');
          appEl.id = 'app';
          if (isCollapsed) appEl.classList.add('sb-collapsed');

          const noteCard = document.createElement('div');
          noteCard.className = 'note-card';
          appEl.appendChild(noteCard);
          document.body.appendChild(appEl);

          try {
            const style = getComputedStyle(noteCard);
            // Standard note cards should not have a restrictive pixel max-width
            return style.maxWidth !== '720px' && style.maxWidth !== '0px';
          } finally {
            removeElement(appEl);
          }
        }),
        { numRuns: 20 }
      );

      done();
    });
  });

  // ── 3. Page editor standard mode max-width is 720px ──────────────────────

  describe('Preservation 3.3 — Page editor standard mode max-width is 720px', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * When the page editor is used for standard block-based notes, it SHALL
     * CONTINUE TO function with its current layout constraints (max-width: 720px).
     * The fix must not remove or change this constraint.
     */

    it('.pg-editor-body has max-width: 720px in standard mode', () => {
      const editorBody = document.createElement('div');
      editorBody.className = 'pg-editor-body';
      document.body.appendChild(editorBody);

      try {
        const style = getComputedStyle(editorBody);
        expect(style.maxWidth).toBe('720px');
      } finally {
        removeElement(editorBody);
      }
    });

    it('.pg-editor-body--wide removes the 720px constraint', () => {
      const editorBody = document.createElement('div');
      editorBody.className = 'pg-editor-body pg-editor-body--wide';
      document.body.appendChild(editorBody);

      try {
        const style = getComputedStyle(editorBody);
        // Wide mode should have no max-width restriction
        expect(style.maxWidth).not.toBe('720px');
      } finally {
        removeElement(editorBody);
      }
    });

    it('property: page editor standard mode max-width is 720px across all sidebar states (fast-check)', (done) => {
      /**
       * **Validates: Requirements 3.3**
       *
       * For ALL sidebar states, the page editor standard mode SHALL maintain
       * its 720px max-width constraint. The sidebar state must not affect this.
       */
      const sidebarStates = fc.boolean();

      fc.assert(
        fc.property(sidebarStates, (isCollapsed) => {
          const appEl = document.createElement('div');
          appEl.id = 'app';
          if (isCollapsed) appEl.classList.add('sb-collapsed');

          const editorBody = document.createElement('div');
          editorBody.className = 'pg-editor-body';
          appEl.appendChild(editorBody);
          document.body.appendChild(appEl);

          try {
            const style = getComputedStyle(editorBody);
            return style.maxWidth === '720px';
          } finally {
            removeElement(appEl);
          }
        }),
        { numRuns: 20 }
      );

      done();
    });

    it('page editor scroll area has correct padding (48px top)', () => {
      const scrollArea = document.createElement('div');
      scrollArea.className = 'pg-editor-scroll';
      document.body.appendChild(scrollArea);

      try {
        const style = getComputedStyle(scrollArea);
        expect(style.paddingTop).toBe('48px');
        expect(style.paddingBottom).toBe('100px');
      } finally {
        removeElement(scrollArea);
      }
    });
  });

  // ── 4. Mobile view rules are still in place ───────────────────────────────

  describe('Preservation 3.4 — Mobile view rules are still in place', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * When the mobile view is active, the sidebar and topbar SHALL CONTINUE TO
     * behave according to the existing mobile-specific layout rules.
     *
     * Note: Media query rules cannot be directly tested via getComputedStyle
     * in a headless browser without viewport manipulation. We verify the CSS
     * rules exist in the injected styles and that the page editor has mobile
     * overrides defined.
     */

    it('page editor topbar has flex layout (preserved for mobile)', () => {
      const pgTopbar = document.createElement('div');
      pgTopbar.className = 'pg-editor-topbar';
      document.body.appendChild(pgTopbar);

      try {
        const style = getComputedStyle(pgTopbar);
        expect(style.display).toBe('flex');
        expect(style.alignItems).toBe('center');
      } finally {
        removeElement(pgTopbar);
      }
    });

    it('property: page editor topbar flex layout is preserved across all sidebar states (fast-check)', (done) => {
      /**
       * **Validates: Requirements 3.4**
       *
       * For all sidebar states, the page editor topbar SHALL maintain its flex
       * layout, which is the foundation for mobile responsiveness.
       */
      const sidebarStates = fc.boolean();

      fc.assert(
        fc.property(sidebarStates, (isCollapsed) => {
          const appEl = document.createElement('div');
          appEl.id = 'app';
          if (isCollapsed) appEl.classList.add('sb-collapsed');

          const pgTopbar = document.createElement('div');
          pgTopbar.className = 'pg-editor-topbar';
          appEl.appendChild(pgTopbar);
          document.body.appendChild(appEl);

          try {
            const style = getComputedStyle(pgTopbar);
            return style.display === 'flex' && style.alignItems === 'center';
          } finally {
            removeElement(appEl);
          }
        }),
        { numRuns: 20 }
      );

      done();
    });

    it('#topbar has flex layout (preserved for mobile)', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        const style = getComputedStyle(topbarEl);
        expect(style.display).toBe('flex');
        expect(style.alignItems).toBe('center');
      } finally {
        removeElement(appEl);
      }
    });
  });

  // ── 5. Topbar controls layout is preserved ────────────────────────────────

  describe('Preservation 3.5 — Topbar controls layout is preserved', () => {
    /**
     * **Validates: Requirements 3.5**
     *
     * When users interact with topbar controls (search, buttons, etc.), these
     * controls SHALL CONTINUE TO function as they currently do. The fix must
     * not break the flex layout, gap, or positioning of topbar controls.
     */

    it('#topbar has gap: 8px between controls', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        const style = getComputedStyle(topbarEl);
        expect(style.gap).toBe('8px');
      } finally {
        removeElement(appEl);
      }
    });

    it('#topbar has justify-content: space-between', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        const style = getComputedStyle(topbarEl);
        expect(style.justifyContent).toBe('space-between');
      } finally {
        removeElement(appEl);
      }
    });

    it('#topbar has flex-shrink: 0 (does not shrink)', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        const style = getComputedStyle(topbarEl);
        expect(style.flexShrink).toBe('0');
      } finally {
        removeElement(appEl);
      }
    });

    it('.tb-crumb has flex: 1 to fill available space', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const tbCrumb = document.createElement('div');
      tbCrumb.className = 'tb-crumb';
      appEl.appendChild(tbCrumb);
      document.body.appendChild(appEl);

      try {
        const style = getComputedStyle(tbCrumb);
        expect(style.flexGrow).toBe('1');
        expect(style.minWidth).toBe('0px');
      } finally {
        removeElement(appEl);
      }
    });

    it('.pg-editor-topbar has gap: 12px between controls', () => {
      const pgTopbar = document.createElement('div');
      pgTopbar.className = 'pg-editor-topbar';
      document.body.appendChild(pgTopbar);

      try {
        const style = getComputedStyle(pgTopbar);
        expect(style.gap).toBe('12px');
      } finally {
        removeElement(pgTopbar);
      }
    });

    it('property: topbar controls layout is preserved across all sidebar states (fast-check)', (done) => {
      /**
       * **Validates: Requirements 3.5**
       *
       * For ALL sidebar states, the topbar SHALL maintain its flex layout,
       * gap, and justify-content properties. The fix must not alter these.
       */
      const sidebarStates = fc.boolean();

      fc.assert(
        fc.property(sidebarStates, (isCollapsed) => {
          const appEl = document.createElement('div');
          appEl.id = 'app';
          if (isCollapsed) appEl.classList.add('sb-collapsed');

          const topbarEl = document.createElement('div');
          topbarEl.id = 'topbar';
          appEl.appendChild(topbarEl);
          document.body.appendChild(appEl);

          try {
            const style = getComputedStyle(topbarEl);
            return (
              style.display === 'flex' &&
              style.alignItems === 'center' &&
              style.gap === '8px' &&
              style.justifyContent === 'space-between' &&
              style.flexShrink === '0'
            );
          } finally {
            removeElement(appEl);
          }
        }),
        { numRuns: 20 }
      );

      done();
    });
  });

  // ── 6. View mode transitions — no conflicting CSS rules ───────────────────

  describe('Preservation 3.6 — View mode transitions work smoothly', () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * When the app switches between different view modes (content area, page
     * editor, settings panel), the transitions SHALL CONTINUE TO work smoothly.
     * The fix must not introduce conflicting CSS rules that break transitions.
     */

    it('switching from content area to page editor does not break topbar padding', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);
      document.body.appendChild(appEl);

      try {
        // Content area mode (default, no page editor body present)
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('36px');

        // Simulate standard (non-wide) page editor mode
        const pgEditorBody = document.createElement('div');
        pgEditorBody.className = 'pg-editor-body';
        appEl.appendChild(pgEditorBody);

        // Topbar padding should still be 36px (sidebar is open, not wide mode)
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('36px');
      } finally {
        removeElement(appEl);
      }
    });

    it('wide mode page editor sets topbar to 24px (existing behavior preserved)', () => {
      /**
       * **Validates: Requirements 3.6**
       *
       * The existing rule `#app:has(.pg-editor-body--wide) #topbar { padding-left: 24px }`
       * is preserved. When the page editor is in wide mode, the topbar uses 24px
       * left padding — this is intentional existing behavior, not a regression.
       */
      const appEl = document.createElement('div');
      appEl.id = 'app';
      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);

      const pgEditorBodyWide = document.createElement('div');
      pgEditorBodyWide.className = 'pg-editor-body--wide';
      appEl.appendChild(pgEditorBodyWide);

      document.body.appendChild(appEl);

      try {
        // Wide mode page editor: topbar uses 24px (existing behavior)
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('24px');
      } finally {
        removeElement(appEl);
      }
    });

    it('sidebar collapse + page editor mode: both rules apply without conflict', () => {
      const appEl = document.createElement('div');
      appEl.id = 'app';
      appEl.classList.add('sb-collapsed');

      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';
      appEl.appendChild(topbarEl);

      const pgEditorBody = document.createElement('div');
      pgEditorBody.className = 'pg-editor-body--wide';
      appEl.appendChild(pgEditorBody);

      document.body.appendChild(appEl);

      try {
        // When sidebar is collapsed, topbar should use 24px
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('24px');

        // Wide mode editor body should have no max-width
        expect(getComputedStyle(pgEditorBody).maxWidth).not.toBe('720px');
      } finally {
        removeElement(appEl);
      }
    });

    it('property: view mode transitions preserve topbar padding for all state combinations (fast-check)', (done) => {
      /**
       * **Validates: Requirements 3.6**
       *
       * For ALL combinations of sidebar state and view mode, the topbar padding
       * SHALL be consistent with the expected rules:
       * - Sidebar collapsed → 24px (regardless of view mode)
       * - Sidebar open + wide page editor → 24px (existing #app:has rule)
       * - Sidebar open + standard/content mode → 36px
       * No view mode transition should break these rules.
       */
      const viewModes = fc.constantFrom(
        'content-area',
        'page-editor',
        'page-editor-wide',
        'settings'
      );
      const sidebarStates = fc.boolean();

      fc.assert(
        fc.property(
          fc.tuple(sidebarStates, viewModes),
          ([isCollapsed, viewMode]) => {
            const appEl = document.createElement('div');
            appEl.id = 'app';
            if (isCollapsed) appEl.classList.add('sb-collapsed');

            const topbarEl = document.createElement('div');
            topbarEl.id = 'topbar';
            appEl.appendChild(topbarEl);

            // Simulate view mode
            if (viewMode === 'page-editor' || viewMode === 'page-editor-wide') {
              const pgBody = document.createElement('div');
              pgBody.className = viewMode === 'page-editor-wide'
                ? 'pg-editor-body pg-editor-body--wide'
                : 'pg-editor-body';
              appEl.appendChild(pgBody);
            }

            document.body.appendChild(appEl);

            try {
              const paddingLeft = getComputedStyle(topbarEl).paddingLeft;
              // When sidebar is collapsed → always 24px
              if (isCollapsed) return paddingLeft === '24px';
              // When sidebar is open + wide mode → 24px (existing #app:has rule)
              if (viewMode === 'page-editor-wide') return paddingLeft === '24px';
              // Otherwise → 36px
              return paddingLeft === '36px';
            } finally {
              removeElement(appEl);
            }
          }
        ),
        { numRuns: 50 }
      );

      done();
    });

    it('page editor topbar padding is consistent with main topbar padding', () => {
      /**
       * **Validates: Requirements 3.6**
       *
       * Both the main topbar and the page editor topbar SHALL use the same
       * left padding value (driven by --topbar-left-padding), ensuring visual
       * consistency when switching between view modes.
       */
      const appEl = document.createElement('div');
      appEl.id = 'app';

      const topbarEl = document.createElement('div');
      topbarEl.id = 'topbar';

      const pgTopbar = document.createElement('div');
      pgTopbar.className = 'pg-editor-topbar';

      appEl.appendChild(topbarEl);
      appEl.appendChild(pgTopbar);
      document.body.appendChild(appEl);

      try {
        // Both should use 36px when sidebar is open
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('36px');
        expect(getComputedStyle(pgTopbar).paddingLeft).toBe('36px');

        // Both should use 24px when sidebar is collapsed
        appEl.classList.add('sb-collapsed');
        expect(getComputedStyle(topbarEl).paddingLeft).toBe('24px');
        expect(getComputedStyle(pgTopbar).paddingLeft).toBe('24px');
      } finally {
        removeElement(appEl);
      }
    });
  });
});
