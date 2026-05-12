/**
 * Shelf Model
 * Top-level organizational unit in the three-tier hierarchy
 */
export interface Shelf {
  id: string;
  name: string;
  color: string; // Hex color for the shelf dot
  icon?: string; // Optional emoji icon
  notebooks: Notebook[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notebook Model
 * Second-level organizational unit, contains notes
 */
export interface Notebook {
  id: string;
  shelfId: string;
  name: string;
  icon: string; // Emoji icon
  notes: Note[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Note Model
 * Individual note with type, content, and metadata
 */
export interface Note {
  id: string;
  notebookId: string;
  title: string;
  type: NoteType;
  content: string; // Main note body
  preview?: string; // Auto-generated preview text
  tags: string[];
  status: NoteStatus;
  blocks: Block[]; // Structured blocks within the note
  linkedNoteIds: string[]; // Backlinks
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Note Reference
 * Lightweight reference to a note for sidebar and editor
 */
export interface NoteRef {
  id: string;
  notebookId: string;
  title: string;
  type: NoteType;
  preview?: string;
  updatedAt: Date;
}

/**
 * Note Type Enum
 * Defines the six note types with their visual styling
 */
export enum NoteType {
  Research = 'research',
  Journal = 'journal',
  Task = 'task',
  Idea = 'idea',
  Reference = 'reference',
  HTML = 'html'
}

/**
 * Note Status
 */
export enum NoteStatus {
  Draft = 'draft',
  InProgress = 'in-progress',
  Done = 'done',
  Archived = 'archived'
}

/**
 * Block Model
 * Structured content blocks within a note
 */
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, any>; // Type-specific metadata
  order: number;
  createdAt: Date;
}

/**
 * Block Type Enum
 * All 13 block types
 */
export enum BlockType {
  Hypothesis = 'hypothesis',
  Conclusion = 'conclusion',
  Note = 'note', // Insight block
  Warning = 'warning',
  Quote = 'quote',
  KeyDifferences = 'key-differences',
  KeyFindings = 'key-findings',
  Checklist = 'checklist',
  Table = 'table',
  Code = 'code',
  Image = 'image',
  Divider = 'divider',
  AskClaude = 'ask-claude',
  AskGPT = 'ask-gpt',
  AskAI = 'ask-ai'
}

/**
 * Note Type Configuration
 * Visual styling and metadata for each note type
 */
export interface NoteTypeConfig {
  type: NoteType;
  label: string;
  badgeClass: string; // CSS class for badge
  dotClass: string; // CSS class for dot
  icon?: string; // Optional icon
  description: string;
}

/**
 * Note type configurations
 */
export const NOTE_TYPE_CONFIGS: Record<NoteType, NoteTypeConfig> = {
  [NoteType.Research]: {
    type: NoteType.Research,
    label: 'Research',
    badgeClass: 'badge-research',
    dotClass: 'dot-research',
    description: 'Structured research notes with hypotheses and conclusions'
  },
  [NoteType.Journal]: {
    type: NoteType.Journal,
    label: 'Journal',
    badgeClass: 'badge-journal',
    dotClass: 'dot-journal',
    description: 'Daily journal entries and reflections'
  },
  [NoteType.Task]: {
    type: NoteType.Task,
    label: 'Task',
    badgeClass: 'badge-task',
    dotClass: 'dot-task',
    description: 'Action items and task lists'
  },
  [NoteType.Idea]: {
    type: NoteType.Idea,
    label: 'Idea',
    badgeClass: 'badge-idea',
    dotClass: 'dot-idea',
    description: 'Speculative ideas and brainstorming'
  },
  [NoteType.Reference]: {
    type: NoteType.Reference,
    label: 'Reference',
    badgeClass: 'badge-reference',
    dotClass: 'dot-reference',
    description: 'Reference materials and citations'
  },
  [NoteType.HTML]: {
    type: NoteType.HTML,
    label: 'HTML',
    badgeClass: 'badge-html',
    dotClass: 'dot-html',
    description: 'HTML notes with rich formatting'
  }
};
