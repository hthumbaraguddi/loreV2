import { Component, signal, input, output, computed, inject, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShelfService } from '../../../core/services/shelf.service';
import { BlockService } from '../../../core/services/block.service';
import { Note, NoteType, NoteRef, Block, BlockType } from '../../../core/models/shelf.model';
import { CanvasBackgroundComponent } from '../canvas-background/canvas-background.component';
import { BlockListComponent } from '../../blocks/block-list/block-list.component';

@Component({
  selector: 'lore-paper-canvas',
  standalone: true,
  imports: [CommonModule, CanvasBackgroundComponent, BlockListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paper-canvas.component.html',
  styleUrl: './paper-canvas.component.scss'
})
export class PaperCanvasComponent implements AfterViewInit {
  private shelfService = inject(ShelfService);
  private blockService = inject(BlockService);

  @ViewChild('noteBodyTextarea') noteBodyTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('titleElement') titleElement?: ElementRef<HTMLHeadingElement>;

  note = input.required<NoteRef>();
  backgroundStyle = input<'plain' | 'dot' | 'square' | 'lined'>('plain');
  readOnly = input<boolean>(false);

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

  onBlockChanged(block: Block): void {
    this.blockService.updateBlock(this.fullNote().id, block.id, block);
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
    this.autoResizeTextarea(textarea);
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
    // Use the existing insertBlock logic for AI block
    this.insertBlock('ask-claude');
  }

  private triggerLink(textarea: HTMLTextAreaElement, cursorPos: number): void {
    // When user types [[, insert a link placeholder
    const content = textarea.value;
    const beforeCursor = content.substring(0, cursorPos - 1); // Remove the first [
    const afterCursor = content.substring(cursorPos);
    
    // Insert link placeholder
    const newContent = beforeCursor + '[[Link Title]]' + afterCursor;
    this.shelfService.updateNote(this.fullNote().id, { content: newContent });
    
    // Position cursor between [[ and ]]
    setTimeout(() => {
      if (this.noteBodyTextarea?.nativeElement) {
        const ta = this.noteBodyTextarea.nativeElement;
        // Position cursor after "[["
        ta.selectionStart = ta.selectionEnd = cursorPos + 1;
        ta.focus();
      }
    });
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit content
    textarea.style.height = textarea.scrollHeight + 'px';
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
      
      // Update textarea
      setTimeout(() => {
        if (this.noteBodyTextarea?.nativeElement) {
          this.autoResizeTextarea(this.noteBodyTextarea.nativeElement);
        }
      });
    } else {
      // Current line has content - add newline and insert block on next line
      const newContent = content.substring(0, lineEnd) + '\n' + content.substring(lineEnd);
      
      // Update the note content
      this.shelfService.updateNote(this.fullNote().id, { content: newContent });
      
      // Add block at the end
      const afterIndex = this.blocks().length - 1;
      this.blockService.createBlock(this.fullNote().id, blockType, afterIndex);
      
      // Update textarea and move cursor
      setTimeout(() => {
        if (this.noteBodyTextarea?.nativeElement) {
          const ta = this.noteBodyTextarea.nativeElement;
          this.autoResizeTextarea(ta);
          // Move cursor to the new line
          ta.selectionStart = ta.selectionEnd = lineEnd + 1;
          ta.focus();
        }
      });
    }
  }

  private stringToBlockType(type: string): BlockType | null {
    const typeMap: Record<string, BlockType> = {
      'hypothesis': BlockType.Hypothesis,
      'conclusion': BlockType.Conclusion,
      'key-differences': BlockType.KeyDifferences,
      'key-findings': BlockType.KeyFindings,
      'code': BlockType.Code,
      'ask-claude': BlockType.AskClaude,
      'ask-gpt': BlockType.AskGPT,
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
