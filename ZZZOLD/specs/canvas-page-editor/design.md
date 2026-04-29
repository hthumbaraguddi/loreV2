# Canvas Page Editor — Design Document

## Overview

Replace the current block-based `<textarea>` array in `PageEditorComponent` with a single `contenteditable` div (the "canvas"). The goal is a fluid, paper-like writing experience — no visible block boundaries, no cursor jumping between DOM elements — while keeping the existing `PageBlock[]` storage format and all surrounding features (title, icon, tags, template picker, save/delete/close, slash menu) completely intact.

This is a **Phase 1 scope**: the canvas replaces only the block editing area. Everything outside that area (topbar, template picker, inline template forms, tags, modals) is unchanged.

### Design Goals

- Zero new dependencies — pure `contenteditable`, no ProseMirror / TipTap / Quill.
- The `PageBlock[]` data model is the source of truth; the canvas is a rendering surface.
- Two pure serialization functions form the only boundary between the data model and the DOM.
- Angular's `OnPush` change detection is preserved; the component never reads `innerHTML` reactively.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  PageEditorComponent  (OnPush)                          │
│                                                         │
│  @Input() note ──► loadFromNote()                       │
│                         │                               │
│                         ▼                               │
│              blocksToHtml(blocks)                       │
│                         │                               │
│                         ▼                               │
│         ┌───────────────────────────────┐               │
│         │  <div #editorCanvas           │               │
│         │       contenteditable="true"> │               │
│         │    <p>text block</p>          │               │
│         │    <h1>heading</h1>           │               │
│         │    <blockquote>…</blockquote> │               │
│         │    …                          │               │
│         │  </div>                       │               │
│         └───────────────────────────────┘               │
│                         │                               │
│              (input) event                              │
│                         │                               │
│                         ▼                               │
│              onCanvasInput()                            │
│              ├─ markdown shortcut check                 │
│              └─ markDirty()                             │
│                                                         │
│  onSave() ──► htmlToBlocks(canvas.innerHTML)            │
│                         │                               │
│                         ▼                               │
│              saved.emit({ blocks, … })                  │
└─────────────────────────────────────────────────────────┘
```

The component retains its existing `@Input`/`@Output` contract. The only internal change is that `blocks: PageBlock[]` is no longer the live editing state — it is loaded once on `ngOnChanges` (via `blocksToHtml`) and re-read on save (via `htmlToBlocks`).

---

## Components and Interfaces

### Modified: `PageEditorComponent`

**Removed:**
- `*ngFor` over `blocks` in the template
- `onBlockKeydown`, `onBlockInput`, `onTextareaInput`, `autoResize`, `resizeAllTextareas`, `focusBlock`, `needsResize`, `ngAfterViewChecked` (textarea-specific)
- `slashMenuIndex` positional tracking (replaced by cursor-position tracking)

**Added:**
- `@ViewChild('editorCanvas') canvasRef: ElementRef<HTMLDivElement>`
- `onCanvasInput(event: InputEvent): void` — handles live input, triggers markdown shortcuts
- `onCanvasKeydown(event: KeyboardEvent): void` — handles slash menu trigger, Tab key
- `blocksToHtml(blocks: PageBlock[]): string` — pure serialization (load path)
- `htmlToBlocks(html: string): PageBlock[]` — pure deserialization (save path)
- `applyMarkdownShortcut(node: Element): boolean` — detects and converts trigger patterns
- `saveAndRestoreCursor(fn: () => void): void` — wraps DOM mutations that need cursor preservation
- `showSlashMenuAtCursor(): void` — replaces index-based slash menu positioning

**Unchanged interface:**
```typescript
@Input()  note: Note
@Input()  section: Section
@Input()  notebookId: string
@Output() saved: EventEmitter<{ title: string; templateId: string; data: Record<string, any> }>
@Output() deleted: EventEmitter<void>
@Output() closed: EventEmitter<void>
@Output() titleChanged: EventEmitter<string>
```

### New: `CanvasSerializerService` (optional extraction)

The two serialization functions are pure enough to live as static methods on the component for Phase 1. If they grow in complexity (inline formatting, nested lists), they can be extracted to a `CanvasSerializerService`. The design keeps them as component methods for now.

---

## Data Models

### Block Type ↔ HTML Element Map

| `PageBlock.type` | HTML element | Notes |
|---|---|---|
| `text` | `<p>` | Default block |
| `heading` | `<h1>` | |
| `heading2` | `<h2>` | |
| `callout` | `<div data-type="callout">` | `<p>` inside for content |
| `todo` | `<p data-type="todo" data-checked="false\|true">` | |
| `quote` | `<blockquote>` | |
| `divider` | `<hr>` | Self-closing, no content |

### `PageBlock` (unchanged)

```typescript
export interface PageBlock {
  type: 'text' | 'heading' | 'heading2' | 'callout' | 'todo' | 'quote' | 'divider';
  content: string;
  checked?: boolean;
}
```

No data migration is required. The `data.blocks` array stored in `Note.data` is identical in shape.

---

## Serialization Functions

These are the two most critical functions in the design. Both are pure (no side effects, no DOM reads beyond what is passed in).

### `blocksToHtml(blocks: PageBlock[]): string`

Called once on load to set `canvasRef.nativeElement.innerHTML`.

```
Input:  PageBlock[]
Output: HTML string

Rules:
  - Empty array → '<p><br></p>'  (browser needs a <br> in empty blocks to render cursor)
  - text        → <p>{content}</p>  (empty content → <p><br></p>)
  - heading     → <h1>{content}</h1>
  - heading2    → <h2>{content}</h2>
  - callout     → <div data-type="callout"><p>{content}</p></div>
  - todo        → <p data-type="todo" data-checked="{checked}">{content}</p>
  - quote       → <blockquote><p>{content}</p></blockquote>
  - divider     → <hr>
  - content is HTML-escaped (& → &amp;, < → &lt;, > → &gt;)
```

**Implementation sketch:**

```typescript
blocksToHtml(blocks: PageBlock[]): string {
  if (!blocks.length) return '<p><br></p>';
  return blocks.map(b => {
    const c = this.escapeHtml(b.content);
    const empty = !b.content ? '<br>' : c;
    switch (b.type) {
      case 'text':     return `<p>${empty}</p>`;
      case 'heading':  return `<h1>${empty}</h1>`;
      case 'heading2': return `<h2>${empty}</h2>`;
      case 'callout':  return `<div data-type="callout"><p>${empty}</p></div>`;
      case 'todo':     return `<p data-type="todo" data-checked="${!!b.checked}">${empty}</p>`;
      case 'quote':    return `<blockquote><p>${empty}</p></blockquote>`;
      case 'divider':  return `<hr>`;
    }
  }).join('');
}
```

### `htmlToBlocks(html: string): PageBlock[]`

Called on save by parsing `canvasRef.nativeElement.innerHTML` via a temporary `DOMParser` or by walking the live child nodes directly.

```
Input:  HTML string (innerHTML of the canvas div)
Output: PageBlock[]

Rules (walk top-level child nodes):
  - <p> with no data-type          → { type: 'text',     content: innerText.trim() }
  - <h1>                           → { type: 'heading',  content: innerText.trim() }
  - <h2>                           → { type: 'heading2', content: innerText.trim() }
  - <div data-type="callout">      → { type: 'callout',  content: firstChild.innerText.trim() }
  - <p data-type="todo">           → { type: 'todo',     content: innerText.trim(), checked: dataset.checked === 'true' }
  - <blockquote>                   → { type: 'quote',    content: firstChild.innerText.trim() }
  - <hr>                           → { type: 'divider',  content: '' }
  - Unknown / <div> without attr   → { type: 'text',     content: innerText.trim() } (fallback)
  - Empty result                   → [{ type: 'text', content: '' }]

Content extraction:
  - Use node.innerText (not innerHTML) to get plain text, stripping any inline formatting
  - Trim leading/trailing whitespace
  - Replace '\n' within a block with ' ' (single-line block model)
```

**Walking strategy:** iterate `canvasRef.nativeElement.childNodes` directly (no DOMParser needed — the live DOM is already parsed). This avoids a second parse and keeps the function synchronous.

---

## Keyboard Event Handling

### `onCanvasKeydown(event: KeyboardEvent)`

Handles special keys before the browser's default contenteditable behavior.

| Key | Condition | Action |
|---|---|---|
| `/` | Current line is empty (cursor at start of empty block) | `showSlashMenuAtCursor()`, prevent default |
| `Escape` | Slash menu is open | `hideSlashMenu()` |
| `Tab` | — | `document.execCommand('insertText', false, '  ')`, prevent default (insert 2 spaces) |

All other keys (Enter, Backspace, arrows) are handled by the browser's native contenteditable behavior. This is intentional — the browser correctly:
- Creates a new `<p>` on Enter (with `div` as the canvas element, the browser inserts `<div>` by default; we override this with CSS `white-space` and a one-time `document.execCommand('defaultParagraphSeparator', false, 'p')` call on init)
- Merges paragraphs on Backspace at the start of a block
- Moves the cursor naturally on arrow keys

### `onCanvasInput(event: InputEvent)`

Fires on every keystroke after the DOM has been updated.

```
1. Get the current block element (getBlockAtCursor())
2. Check if the block's full text content matches a markdown trigger
3. If yes: applyMarkdownShortcut(block) → saveAndRestoreCursor
4. markDirty()
5. cdr.markForCheck()
```

### Slash Menu Trigger

The slash menu is shown when `/` is typed as the **first and only character** of a block. Detection:

```typescript
private isSlashTrigger(node: Element): boolean {
  return node.textContent?.trim() === '/';
}
```

On selection, `selectSlashType(type)`:
1. Gets the current block element
2. Replaces it with a new element of the chosen type (empty content)
3. Moves cursor into the new element
4. Hides the slash menu

---

## Markdown Shortcut Detection Algorithm

Markdown shortcuts convert a trigger pattern into a block type change. They fire in `onCanvasInput` after each keystroke.

### Trigger Table

| Typed text (full line) | Converts to | Clears content |
|---|---|---|
| `# ` (hash + space) | `<h1>` | yes |
| `## ` (double hash + space) | `<h2>` | yes |
| `> ` (gt + space) | `<blockquote><p>` | yes |
| `---` (three dashes) | `<hr>` | yes (no content) |
| `[] ` or `[ ] ` | `<p data-type="todo">` | yes |

### Detection Algorithm

```
function applyMarkdownShortcut(blockNode: Element): boolean {
  const text = blockNode.textContent ?? '';

  const triggers = [
    { pattern: /^# $/,       type: 'heading'  },
    { pattern: /^## $/,      type: 'heading2' },
    { pattern: /^> $/,       type: 'quote'    },
    { pattern: /^---$/,      type: 'divider'  },
    { pattern: /^\[\] $|^\[ \] $/, type: 'todo' },
  ];

  const match = triggers.find(t => t.pattern.test(text));
  if (!match) return false;

  saveAndRestoreCursor(() => {
    const newEl = createBlockElement(match.type);  // creates the right DOM element
    blockNode.replaceWith(newEl);
    placeCursorIn(newEl);  // moves cursor to start of new element
  });
  return true;
}
```

**Isolation guarantee:** each pattern is anchored with `^` and `$`, so `"some text # more"` never matches. The function only receives the current block node's `textContent`, not the full canvas HTML.

### `saveAndRestoreCursor(fn: () => void)`

Wraps any DOM mutation that would otherwise lose the cursor:

```typescript
saveAndRestoreCursor(fn: () => void): void {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) { fn(); return; }
  const range = sel.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;

  fn();  // mutates the DOM

  // After mutation, the old range is stale. Place cursor at start of new element.
  // (For markdown shortcuts, we always want cursor at position 0 of the new block.)
  const newSel = window.getSelection();
  if (newSel) {
    const newRange = document.createRange();
    // placeCursorIn() handles this — saveAndRestoreCursor is a wrapper for non-shortcut mutations
    newSel.removeAllRanges();
    newSel.addRange(newRange);
  }
}
```

For markdown shortcuts specifically, cursor placement is always "start of the new block" so full range restoration is not needed. For future use cases (e.g., inline bold toggle), the full save/restore pattern would be used.

---

## Angular Integration

### Template

```html
<!-- Replaces the *ngFor of textareas -->
<div
  #editorCanvas
  class="pg-canvas"
  contenteditable="true"
  [attr.data-placeholder]="'Write something… (/ for commands)'"
  (input)="onCanvasInput($event)"
  (keydown)="onCanvasKeydown($event)"
  (focus)="hideSlashMenu()"
></div>
```

The canvas is rendered only when `!selectedTemplateId || selectedTemplateId === 'page'` — same condition as the current block list.

### Change Detection

`contenteditable` does not work with `[(ngModel)]`. The component uses `ChangeDetectionStrategy.OnPush`. The pattern is:

1. **Load**: `ngOnChanges` → `blocksToHtml` → set `canvasRef.nativeElement.innerHTML` directly (bypasses Angular binding, which is correct — we don't want Angular to re-render the canvas on every change detection cycle).
2. **Input**: `(input)` event → `markDirty()` → `cdr.markForCheck()` (only marks the component dirty, does not re-render the canvas).
3. **Save**: `onSave()` → reads `canvasRef.nativeElement.innerHTML` → `htmlToBlocks` → emits.

This means Angular never touches the canvas innerHTML after initial load, which is the correct pattern for contenteditable.

### Initialization

In `ngAfterViewInit` (or at the end of `loadFromNote` after the view is ready):

```typescript
// Set default paragraph separator so Enter creates <p> not <div>
document.execCommand('defaultParagraphSeparator', false, 'p');
// Set initial content
this.canvasRef.nativeElement.innerHTML = this.blocksToHtml(this.blocks);
```

`document.execCommand('defaultParagraphSeparator')` is deprecated but still universally supported and is the standard way to control this behavior in contenteditable divs.

---

## CSS Approach for Block Type Styling

The canvas div gets the class `pg-canvas`. Block elements inside it are styled by element type and data attributes.

```scss
.pg-canvas {
  outline: none;
  min-height: 200px;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  color: var(--tp);
  line-height: 1.75;
  caret-color: var(--acc);

  // Placeholder via ::before on the first empty <p>
  > p:only-child:empty::before,
  > p:first-child:empty::before {
    content: attr(data-placeholder);  // set via JS on the canvas, not each <p>
    color: var(--tt);
    opacity: 0.35;
    pointer-events: none;
  }

  // Text block (default)
  > p {
    margin: 0 0 2px;
    padding: 2px 0;
    min-height: 1.75em;
  }

  // Headings
  > h1 {
    font-size: 26px;
    font-weight: 700;
    font-family: 'Lora', serif;
    line-height: 1.3;
    margin: 16px 0 4px;
    color: var(--tp);
  }

  > h2 {
    font-size: 20px;
    font-weight: 600;
    font-family: 'Lora', serif;
    line-height: 1.35;
    margin: 12px 0 4px;
    color: var(--tp);
  }

  // Callout
  > div[data-type="callout"] {
    background: var(--accl);
    border-left: 3px solid var(--acc);
    border-radius: 8px;
    padding: 8px 12px;
    margin: 4px 0;
    color: var(--acc);
    font-size: 14px;

    > p { margin: 0; }
  }

  // Todo
  > p[data-type="todo"] {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding-left: 0;

    &::before {
      content: '';
      display: inline-block;
      width: 15px;
      height: 15px;
      border: 1.5px solid var(--border);
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 4px;
      background: transparent;
    }

    &[data-checked="true"] {
      text-decoration: line-through;
      opacity: 0.45;
      &::before {
        background: var(--acc);
        border-color: var(--acc);
      }
    }
  }

  // Quote
  > blockquote {
    border-left: 3px solid var(--bh);
    margin: 4px 0;
    padding: 2px 0 2px 14px;
    color: var(--ts);
    font-style: italic;

    > p { margin: 0; }
  }

  // Divider
  > hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 12px 0;
    // Make it selectable/deletable but not editable
    pointer-events: none;
    user-select: none;
  }
}
```

**Placeholder strategy:** A single `::before` pseudo-element on the canvas's first `<p>` when it is empty. The placeholder text is set as a `data-placeholder` attribute on the canvas div (not on each `<p>`), so it only appears when the entire canvas is empty (first `<p>` is the only child and is empty).

**Todo checkbox:** Rendered as a CSS `::before` pseudo-element rather than a real `<input type="checkbox">`. This avoids the complexity of managing a real input inside contenteditable. Clicking the `::before` area is handled by a `click` event listener on the canvas that checks if the click target is a `p[data-type="todo"]` and toggles `data-checked`.

---

## Slash Menu

The slash menu is positioned absolutely near the cursor using `getBoundingClientRect()` on the current block element, rather than being anchored to a block index.

```typescript
showSlashMenuAtCursor(): void {
  const block = this.getBlockAtCursor();
  if (!block) return;
  const rect = block.getBoundingClientRect();
  const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
  this.slashMenuTop = rect.bottom - canvasRect.top + 4;
  this.slashMenuLeft = rect.left - canvasRect.left;
  this.slashMenuVisible = true;
  this.cdr.markForCheck();
}
```

The menu HTML and block type list (`blockTypes` array) are unchanged from the current implementation.

### `getBlockAtCursor(): Element | null`

```typescript
private getBlockAtCursor(): Element | null {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let node: Node | null = sel.getRangeAt(0).startContainer;
  // Walk up to find a direct child of the canvas
  while (node && node.parentElement !== this.canvasRef.nativeElement) {
    node = node.parentElement;
  }
  return node as Element | null;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Serialization Round-Trip Fidelity

*For any* non-empty array of `PageBlock` values (covering all 7 block types, arbitrary content strings including empty strings, unicode, and special HTML characters, and arbitrary `checked` boolean values for todo blocks), calling `blocksToHtml` followed by `htmlToBlocks` SHALL produce an array where each block has the same `type` and `content` as the corresponding input block, and `checked` is preserved for todo blocks.

**Validates: Requirement — round-trip fidelity (correctness property 1 from feature description)**

### Property 2: Markdown Trigger Isolation

*For any* string that contains a markdown trigger pattern (e.g., `# `, `## `, `> `, `---`, `[] `) but where that pattern is **not** the entire string (i.e., the pattern appears mid-sentence or has additional characters before or after it), `applyMarkdownShortcut` SHALL return `false` and leave the block element unchanged.

Conversely, *for any* string that exactly matches one of the five trigger patterns (and only those patterns), `applyMarkdownShortcut` SHALL return `true` and convert the block to the corresponding type.

**Validates: Requirement — markdown trigger isolation (correctness property 3 from feature description)**

---

## Error Handling

### Malformed HTML in `htmlToBlocks`

If the canvas contains unexpected element types (e.g., pasted content with `<table>`, `<ul>`, `<span>` wrappers), the fallback rule applies: any unrecognized element is treated as `{ type: 'text', content: node.innerText.trim() }`. This ensures save never fails due to unexpected DOM structure.

### Empty Canvas

If `canvasRef.nativeElement.childNodes` is empty (e.g., the user deleted all content), `htmlToBlocks` returns `[{ type: 'text', content: '' }]`. This matches the current behavior where `blocks` always has at least one entry.

### Clipboard Paste

Pasted HTML from external sources (e.g., a web page) will be sanitized by the browser's contenteditable paste behavior. The component does not intercept paste events in Phase 1 — pasted content is treated as plain text blocks on save. A future phase can add a `paste` event handler to normalize pasted HTML into the block type map.

### `document.execCommand` Deprecation

`defaultParagraphSeparator` and `insertText` are deprecated but have no replacement API. They remain the standard approach for contenteditable control in 2024. The design uses them in exactly two places (init and Tab key), both of which have well-understood fallback behavior if they stop working.

---

## Testing Strategy

### Unit Tests (example-based)

Focus on the two pure serialization functions and the markdown detection function, which have no DOM or Angular dependencies.

**`blocksToHtml` examples:**
- Each block type produces the correct HTML element
- Empty content produces `<br>` inside the element
- HTML special characters in content are escaped (`<`, `>`, `&`)
- Empty array produces `<p><br></p>`
- Todo block with `checked: true` produces `data-checked="true"`

**`htmlToBlocks` examples:**
- Each HTML element maps to the correct block type
- `<br>` inside an element produces `content: ''`
- Unknown elements fall back to `type: 'text'`
- Empty canvas (no children) produces `[{ type: 'text', content: '' }]`

**`applyMarkdownShortcut` examples:**
- Each of the 5 trigger patterns fires correctly
- Patterns embedded in longer text do not fire
- Non-trigger text returns `false`

### Property-Based Tests

Use **fast-check** (the standard PBT library for TypeScript/JavaScript projects).

**Property 1: Serialization Round-Trip**

```typescript
// Feature: canvas-page-editor, Property 1: serialization round-trip fidelity
fc.assert(
  fc.property(
    fc.array(arbitraryPageBlock(), { minLength: 1, maxLength: 20 }),
    (blocks) => {
      const html = blocksToHtml(blocks);
      const result = htmlToBlocks(html);
      expect(result.length).toBe(blocks.length);
      blocks.forEach((b, i) => {
        expect(result[i].type).toBe(b.type);
        expect(result[i].content).toBe(b.content);
        if (b.type === 'todo') expect(result[i].checked).toBe(!!b.checked);
      });
    }
  ),
  { numRuns: 200 }
);
```

The `arbitraryPageBlock()` generator produces:
- Random `type` from the 7 valid types
- Random `content` string (including empty, unicode, HTML special chars — but not raw HTML tags, since content is stored as plain text)
- Random `checked` boolean for todo blocks

**Property 2: Markdown Trigger Isolation**

```typescript
// Feature: canvas-page-editor, Property 2: markdown trigger isolation
const TRIGGERS = ['# ', '## ', '> ', '---', '[] ', '[ ] '];

// Part A: exact triggers always fire
fc.assert(
  fc.property(
    fc.constantFrom(...TRIGGERS),
    (trigger) => {
      const el = document.createElement('p');
      el.textContent = trigger;
      const fired = applyMarkdownShortcut(el);
      expect(fired).toBe(true);
    }
  ),
  { numRuns: 100 }
);

// Part B: triggers embedded in longer text never fire
fc.assert(
  fc.property(
    fc.constantFrom(...TRIGGERS),
    fc.string({ minLength: 1 }),
    (trigger, extra) => {
      const text = extra + trigger; // trigger is not the full content
      const el = document.createElement('p');
      el.textContent = text;
      const fired = applyMarkdownShortcut(el);
      expect(fired).toBe(false);
    }
  ),
  { numRuns: 200 }
);
```

Minimum 100 iterations per property test (200 configured above to cover the larger input space).

### Angular Component Tests (DOM-based)

Use Angular's `TestBed` with a real DOM for cursor and focus behavior:

- Enter at end of a text block creates a new `<p>` as the next sibling
- Enter at end of a heading block creates a new `<p>` (not another `<h1>`)
- Backspace on an empty `<p>` merges it with the previous block
- Typing `/` on an empty line shows the slash menu
- Selecting a slash menu item replaces the current block

These are example-based tests (not property tests) because they require DOM interaction and the behavior is deterministic for specific inputs.
