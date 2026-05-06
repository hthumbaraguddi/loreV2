import { Component, signal, input, output, computed, inject, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShelfService } from '../../../core/services/shelf.service';
import { BlockService } from '../../../core/services/block.service';
import { Note, NoteType, NoteRef, Block, BlockType } from '../../../core/models/shelf.model';
import { CanvasBackgroundComponent } from '../canvas-background/canvas-background.component';
import { BlockListComponent } from '../../blocks/block-list/block-list.component';
import { FileLinkPaletteComponent } from '../file-link-palette/file-link-palette.component';

@Component({
  selector: 'lore-paper-canvas',
  standalone: true,
  imports: [CommonModule, CanvasBackgroundComponent, BlockListComponent, FileLinkPaletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paper-canvas.component.html',
  styleUrl: './paper-canvas.component.scss'
})
export class PaperCanvasComponent implements AfterViewInit {
  private shelfService = inject(ShelfService);
  private blockService = inject(BlockService);

  @ViewChild('noteBodyTextarea') noteBodyTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('trailingTextarea') trailingTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('titleElement') titleElement?: ElementRef<HTMLHeadingElement>;

  note = input.required<NoteRef>();
  backgroundStyle = input<'plain' | 'dot' | 'square' | 'lined'>('plain');
  readOnly = input<boolean>(false);

  // File link palette state
  showLinkPalette = signal(false);
  linkPaletteCursorPos = signal(0);
  linkPalettePosition = signal({ x: 0, y: 0 });

  // Trailing textarea — plain text continuation below blocks
  // Stored separately and appended to note content on input
  trailingContent = signal('');

  constructor() {
    // Sync title element with note title when it changes
    effect(() => {
      const title = this.fullNote().title;
      if (this.titleElement?.nativeElement && 
          this.titleElement.nativeElement.textContent !== title &&
          document.activeElement !== this.titleElement.nativeElement) {
        this.titleElement.nativeElement.textContent = title;
      }
    });

    // Reset trailing textarea when the active note changes
    effect(() => {
      const noteId = this.note().id; // track note changes
      
      // Load any saved trailing content from localStorage
      const saved = localStorage.getItem(`lore-trailing-${noteId}`);
      this.trailingContent.set(saved || '');
      
      this._trailingBase = undefined;
      if (this.trailingTextarea?.nativeElement) {
        this.trailingTextarea.nativeElement.value = saved || '';
        this.trailingTextarea.nativeElement.style.height = 'auto';
      }
    });
  }

  // Resolved full note
  fullNote = computed(() => {
    const ref = this.note();
    const full = this.shelfService.getNote(ref.id);
    if (!full) {
      return {
        ...ref, content: '', tags: [], status: 'draft' as any,
        blocks: [], linkedNoteIds: [], createdAt: new Date(), updatedAt: new Date()
      } as Note;
    }
    return full;
  });

  blocks = computed(() => this.fullNote().blocks ?? []);

  noteTypeIcon = computed(() => {
    const icons: Record<NoteType, string> = {
      [NoteType.Research]: 'science', [NoteType.Journal]: 'book',
      [NoteType.Task]: 'check_circle', [NoteType.Idea]: 'lightbulb',
      [NoteType.Reference]: 'description', [NoteType.HTML]: 'code'
    };
    return icons[this.fullNote().type as NoteType] ?? 'description';
  });

  noteTypeColor = computed(() => {
    const colors: Record<NoteType, string> = {
      [NoteType.Research]: 'var(--lore-color-note-research)',
      [NoteType.Journal]: 'var(--lore-color-note-journal)',
      [NoteType.Task]: 'var(--lore-color-note-task)',
      [NoteType.Idea]: 'var(--lore-color-note-idea)',
      [NoteType.Reference]: 'var(--lore-color-note-reference)',
      [NoteType.HTML]: 'var(--lore-color-note-html)'
    };
    return colors[this.fullNote().type as NoteType] ?? 'var(--lore-color-text-muted)';
  });

  // ─── Lifecycle ─────────────────────────────────────────────

  ngAfterViewInit(): void {
    // Initialize textarea height on load
    if (this.noteBodyTextarea?.nativeElement) {
      setTimeout(() => {
        this.autoResizeTextarea(this.noteBodyTextarea!.nativeElement);
      });
    }
  }

  // ─── Block handlers ────────────────────────────────────────

  onBlockAdded(event: { type: BlockType; afterIndex: number }): void {
    this.blockService.createBlock(this.fullNote().id, event.type, event.afterIndex);
  }

  onTrailingInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const typed = textarea.value;
    this.trailingContent.set(typed);
    
    // Prevent scroll jumping by saving and restoring scroll position
    const canvas = textarea.closest('.paper-canvas') as HTMLElement | null;
    const scrollTop = canvas?.scrollTop ?? 0;
    
    this.autoResizeTextarea(textarea);
    
    // Ensure scroll position is maintained after Angular change detection
    if (canvas) {
      requestAnimationFrame(() => {
        canvas.scrollTop = scrollTop;
      });
    }

    // Save trailing content to a separate storage mechanism
    // For now, we'll use localStorage with the note ID as key
    // This prevents it from appearing in the main textarea
    if (typed) {
      localStorage.setItem(`lore-trailing-${this.fullNote().id}`, typed);
    } else {
      localStorage.removeItem(`lore-trailing-${this.fullNote().id}`);
    }
  }

  /** Snapshot of note content taken when the user first types in the trailing area */
  private _trailingBase: string | undefined = undefined;

  onBlockChanged(block: Block): void {    this.blockService.updateBlock(this.fullNote().id, block.id, block);
  }

  onBlockDeleted(blockId: string): void {
    this.blockService.deleteBlock(this.fullNote().id, blockId);
  }

  onBlockReordered(event: { fromIndex: number; toIndex: number }): void {
    this.blockService.reorderBlocks(this.fullNote().id, event.fromIndex, event.toIndex);
  }

  onDuplicateBlock(blockId: string): void {
    this.blockService.duplicateBlock(this.fullNote().id, blockId);
  }

  // ─── Note body handler ─────────────────────────────────────

  onTitleBlur(event: Event): void {
    const title = (event.target as HTMLElement).textContent?.trim() || 'Untitled';
    if (title !== this.fullNote().title) {
      this.shelfService.updateNote(this.fullNote().id, { title });
    }
  }

  onTitleEnter(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).blur();
  }

  onNoteBodyInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const content = textarea.value;
    this.shelfService.updateNote(this.fullNote().id, { content });
    
    // Prevent scroll jumping by saving and restoring scroll position
    const canvas = textarea.closest('.paper-canvas') as HTMLElement | null;
    const scrollTop = canvas?.scrollTop ?? 0;
    
    this.autoResizeTextarea(textarea);
    
    // Ensure scroll position is maintained after Angular change detection
    if (canvas) {
      requestAnimationFrame(() => {
        canvas.scrollTop = scrollTop;
      });
    }
  }

  onNoteBodyKeydown(event: KeyboardEvent): void {
    const textarea = event.target as HTMLTextAreaElement;
    const content = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Check for slash command trigger
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Check if slash is at start of line or preceded by whitespace
      const beforeCursor = content.substring(0, cursorPos);
      const lastChar = beforeCursor.length > 0 ? beforeCursor[beforeCursor.length - 1] : '';
      const isStartOfLine = cursorPos === 0 || beforeCursor.endsWith('\n') || beforeCursor.endsWith(' ');
      
      if (isStartOfLine || lastChar === ' ' || lastChar === '\n' || lastChar === '') {
        event.preventDefault();
        this.triggerSlashCommand(textarea, cursorPos);
        return;
      }
    }

    // Check for @ mention trigger
    if (event.key === '@' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Check if @ is at start of line or preceded by whitespace
      const beforeCursor = content.substring(0, cursorPos);
      const lastChar = beforeCursor.length > 0 ? beforeCursor[beforeCursor.length - 1] : '';
      const isStartOfLine = cursorPos === 0 || beforeCursor.endsWith('\n') || beforeCursor.endsWith(' ');
      
      if (isStartOfLine || lastChar === ' ' || lastChar === '\n' || lastChar === '') {
        event.preventDefault();
        this.triggerMention(textarea, cursorPos);
        return;
      }
    }

    // Check for [[ link trigger
    if (event.key === '[' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const beforeCursor = content.substring(0, cursorPos);
      // Check if we have a single [ before cursor (would make [[)
      if (beforeCursor.length > 0 && beforeCursor[beforeCursor.length - 1] === '[') {
        event.preventDefault();
        this.triggerLink(textarea, cursorPos);
        return;
      }
    }

    // Allow Escape to cancel any in-progress operation
    if (event.key === 'Escape') {
      // Currently no operation to cancel, but we could add state for this later
      return;
    }
  }

  private triggerSlashCommand(textarea: HTMLTextAreaElement, cursorPos: number): void {
    // Use the existing insertBlock logic which handles line detection
    // We'll insert a default 'note' block
    this.insertBlock('note');
  }

  private triggerMention(textarea: HTMLTextAreaElement, cursorPos: number): void {
    // Remove any @ character that was about to be typed (event was prevented)
    // then insert the AI block and focus it
    this.insertBlock('ask-ai');
  }

  private triggerLink(textarea: HTMLTextAreaElement, cursorPos: number): void {
    // When user types [[, show file link palette
    const content = textarea.value;
    const beforeCursor = content.substring(0, cursorPos - 1); // Remove the first [
    const afterCursor = content.substring(cursorPos);
    
    // Insert [[ placeholder
    const newContent = beforeCursor + '[[]]' + afterCursor;
    this.shelfService.updateNote(this.fullNote().id, { content: newContent });
    
    // Store cursor position and show palette
    this.linkPaletteCursorPos.set(cursorPos + 1); // Position between [[]]
    this.showLinkPalette.set(true);
    
    // Calculate position for palette (near cursor)
    const textareaRect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const linesBeforeCursor = (content.substring(0, cursorPos).match(/\n/g) || []).length;
    const paletteY = textareaRect.top + (linesBeforeCursor * lineHeight) + lineHeight;
    const paletteX = textareaRect.left + 20;
    
    this.linkPalettePosition.set({ x: paletteX, y: paletteY });
    
    // Position cursor between [[ and ]]
    setTimeout(() => {
      if (this.noteBodyTextarea?.nativeElement) {
        const ta = this.noteBodyTextarea.nativeElement;
        ta.selectionStart = ta.selectionEnd = cursorPos + 1;
        ta.focus();
      }
    });
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    // Save the current scroll position of the canvas before resizing
    const canvas = textarea.closest('.paper-canvas') as HTMLElement | null;
    const scrollTop = canvas?.scrollTop ?? 0;
    
    // Resize the textarea - use max of scrollHeight and min-height
    textarea.style.height = 'auto';
    const newHeight = Math.max(textarea.scrollHeight, 300); // 300px is the min-height
    textarea.style.height = newHeight + 'px';
    
    // Restore the scroll position to prevent the canvas from jumping
    if (canvas) {
      canvas.scrollTop = scrollTop;
    }
  }

  /**
   * Scroll the canvas so the caret sits in the vertical center of the viewport.
   *
   * Strategy: create a hidden mirror <div> that replicates the textarea's
   * styles and content up to the cursor position, then append a zero-size
   * <span> at the end. The span's getBoundingClientRect() gives the exact
   * caret coordinates without any line-count arithmetic.
   */
  private scrollCaretToCenter(textarea: HTMLTextAreaElement): void {
    const canvas = textarea.closest('.paper-canvas') as HTMLElement | null;
    if (!canvas) return;

    const cursorPos = textarea.selectionEnd ?? textarea.value.length;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);

    // Build a mirror div that matches the textarea's layout exactly
    const mirror = document.createElement('div');
    const style = getComputedStyle(textarea);

    // Copy all relevant CSS properties
    const props: (keyof CSSStyleDeclaration)[] = [
      'boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom',
      'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
      'borderLeftWidth', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
      'letterSpacing', 'lineHeight', 'textTransform', 'wordBreak', 'overflowWrap',
      'whiteSpace'
    ];
    props.forEach(p => {
      (mirror.style as any)[p] = style[p];
    });

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.overflow = 'hidden';
    mirror.style.height = 'auto';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordBreak = 'break-word';

    // Fill mirror with text up to cursor, then a marker span
    const textNode = document.createTextNode(textBeforeCursor);
    const marker = document.createElement('span');
    marker.textContent = '\u200b'; // zero-width space
    mirror.appendChild(textNode);
    mirror.appendChild(marker);

    // Attach to the same parent so it inherits the same coordinate space
    textarea.parentElement!.appendChild(mirror);

    const markerRect = marker.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Caret position relative to the canvas scroll container
    const caretY = markerRect.top - canvasRect.top + canvas.scrollTop;

    // Target: caret at vertical center of the canvas
    const targetScrollTop = caretY - canvasRect.height / 2;

    textarea.parentElement!.removeChild(mirror);

    // Only scroll if caret is outside the middle 40% dead zone
    const caretScreenY = markerRect.top - canvasRect.top;
    const deadZoneTop = canvasRect.height * 0.30;
    const deadZoneBottom = canvasRect.height * 0.70;

    if (caretScreenY < deadZoneTop || caretScreenY > deadZoneBottom) {
      canvas.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
    }
  }

  // ─── File link palette handlers ─────────────────────────────

  onLinkPaletteSelect(event: { noteId: string; noteTitle: string; cursorPosition: number }): void {
    const textarea = this.noteBodyTextarea?.nativeElement;
    if (!textarea) return;

    const content = textarea.value;
    const cursorPos = event.cursorPosition;
    
    // Find the [[ placeholder
    const beforeCursor = content.substring(0, cursorPos - 2); // Before [[
    const afterCursor = content.substring(cursorPos + 2); // After ]]
    
    // Replace [[ placeholder with [[Note Title]]
    const newContent = beforeCursor + `[[${event.noteTitle}]]` + afterCursor;
    this.shelfService.updateNote(this.fullNote().id, { content: newContent });
    
    // Close palette
    this.showLinkPalette.set(false);
    
    // Update cursor position after the link
    setTimeout(() => {
      if (this.noteBodyTextarea?.nativeElement) {
        const ta = this.noteBodyTextarea.nativeElement;
        const newCursorPos = cursorPos - 2 + event.noteTitle.length + 4; // Position after [[Note Title]]
        ta.selectionStart = ta.selectionEnd = newCursorPos;
        ta.focus();
        this.autoResizeTextarea(ta);
      }
    });
  }

  onLinkPaletteDismiss(): void {
    this.showLinkPalette.set(false);
    
    // If palette is dismissed, remove the [[ placeholder
    const textarea = this.noteBodyTextarea?.nativeElement;
    if (textarea) {
      const content = textarea.value;
      const cursorPos = this.linkPaletteCursorPos();
      
      // Find and remove [[ placeholder
      const beforeCursor = content.substring(0, cursorPos - 2); // Before [[
      const afterCursor = content.substring(cursorPos + 2); // After ]]
      
      const newContent = beforeCursor + afterCursor;
      this.shelfService.updateNote(this.fullNote().id, { content: newContent });
      
      // Restore cursor position
      setTimeout(() => {
        if (this.noteBodyTextarea?.nativeElement) {
          const ta = this.noteBodyTextarea.nativeElement;
          ta.selectionStart = ta.selectionEnd = cursorPos - 2;
          ta.focus();
          this.autoResizeTextarea(ta);
        }
      });
    }
  }

  // ─── Insert block shortcuts ────────────────────────────────

  insertBlock(type: string): void {
    const blockType = this.stringToBlockType(type);
    if (!blockType) return;

    const textarea = this.noteBodyTextarea?.nativeElement;
    if (!textarea) {
      // Fallback: add at the end
      const afterIndex = this.blocks().length - 1;
      this.blockService.createBlock(this.fullNote().id, blockType, afterIndex);
      return;
    }

    const content = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Find the current line
    const beforeCursor = content.substring(0, cursorPos);
    const afterCursor = content.substring(cursorPos);
    
    const lastNewlineBeforeCursor = beforeCursor.lastIndexOf('\n');
    const nextNewlineAfterCursor = afterCursor.indexOf('\n');
    
    const lineStart = lastNewlineBeforeCursor === -1 ? 0 : lastNewlineBeforeCursor + 1;
    const lineEnd = nextNewlineAfterCursor === -1 ? content.length : cursorPos + nextNewlineAfterCursor;
    
    const currentLine = content.substring(lineStart, lineEnd);
    const isLineEmpty = currentLine.trim().length === 0;

    if (isLineEmpty) {
      // Current line is empty - insert block here and remove the empty line
      const beforeLine = content.substring(0, lineStart);
      const afterLine = content.substring(lineEnd);
      
      // Remove the empty line
      let newContent = beforeLine;
      if (afterLine.startsWith('\n')) {
        newContent += afterLine.substring(1);
      } else {
        newContent += afterLine;
      }
      
      // Update the note content
      this.shelfService.updateNote(this.fullNote().id, { content: newContent.trimEnd() });
      
      // Add block at the end (blocks always go after text content)
      const afterIndex = this.blocks().length - 1;
      this.blockService.createBlock(this.fullNote().id, blockType, afterIndex);
      
      // Resize textarea and focus the new block — not the textarea
      setTimeout(() => {
        if (this.noteBodyTextarea?.nativeElement) {
          this.autoResizeTextarea(this.noteBodyTextarea.nativeElement);
        }
        this.focusLastBlock();
      });
    } else {
      // Current line has content - add newline and insert block on next line
      const newContent = content.substring(0, lineEnd) + '\n' + content.substring(lineEnd);
      
      // Update the note content
      this.shelfService.updateNote(this.fullNote().id, { content: newContent });
      
      // Add block at the end
      const afterIndex = this.blocks().length - 1;
      this.blockService.createBlock(this.fullNote().id, blockType, afterIndex);
      
      // Resize textarea and focus the new block — not the textarea
      setTimeout(() => {
        if (this.noteBodyTextarea?.nativeElement) {
          this.autoResizeTextarea(this.noteBodyTextarea.nativeElement);
        }
        this.focusLastBlock();
      });
    }
  }

  /**
   * Focus the first interactive element inside the last rendered block,
   * then scroll it to the center of the canvas viewport.
   * For Ask AI blocks that's the prompt textarea; for text blocks it's
   * the contenteditable div. Falls back to the block container itself.
   */
  private focusLastBlock(): void {
    const blockRows = document.querySelectorAll('lore-block-list .block-row');
    if (!blockRows.length) return;

    const lastRow = blockRows[blockRows.length - 1];

    // Priority order: prompt textarea → contenteditable → any focusable element
    const focusTarget =
      lastRow.querySelector<HTMLElement>('textarea.blk-ai-prompt') ??
      lastRow.querySelector<HTMLElement>('[contenteditable="true"]') ??
      lastRow.querySelector<HTMLElement>('textarea, input, [tabindex]');

    const scrollTarget = (focusTarget ?? lastRow) as HTMLElement;

    if (focusTarget) {
      focusTarget.focus();
      // For textareas, place cursor at the end
      if (focusTarget instanceof HTMLTextAreaElement) {
        focusTarget.selectionStart = focusTarget.selectionEnd = focusTarget.value.length;
      }
    }

    // Scroll the block to the center of the scrollable canvas
    scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  private stringToBlockType(type: string): BlockType | null {    const typeMap: Record<string, BlockType> = {
      'hypothesis': BlockType.Hypothesis,
      'conclusion': BlockType.Conclusion,
      'key-differences': BlockType.KeyDifferences,
      'key-findings': BlockType.KeyFindings,
      'code': BlockType.Code,
      'ask-claude': BlockType.AskAI,
      'ask-gpt': BlockType.AskAI,
      'ask-ai': BlockType.AskAI,
      'note': BlockType.Note,
      'warning': BlockType.Warning,
      'quote': BlockType.Quote,
      'checklist': BlockType.Checklist,
      'image': BlockType.Image,
      'divider': BlockType.Divider
    };
    return typeMap[type] || null;
  }

  // ─── Utilities ─────────────────────────────────────────────

  getRelativeTime(date: Date): string {
    const diff = Math.ceil(Math.abs(Date.now() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
