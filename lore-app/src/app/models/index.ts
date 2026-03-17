export interface Shelf {
  id: string;
  name: string;
  icon: string;
  open: boolean;
}

export interface Note {
  id: string;
  title: string;
  templateId: string;
  data: Record<string, any>;
  _collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Section {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  notes: Note[];
}

export interface Notebook {
  id: string;
  name: string;
  icon: string;
  shelfId: string;
  sections: Section[];
}

export interface SectionColor {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export type SectionColorMap = Record<string, SectionColor>;

export interface TemplateField {
  id: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'rating' | 'list' | 'checklist';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface CustomTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  fields: TemplateField[];
}

export interface AppState {
  shelves: Shelf[];
  notebooks: Notebook[];
  activeNotebookId: string | null;
  sidebarCollapsed: boolean;
  theme: string;
  fontSize: number;
}

export interface UserRecord {
  username: string;
  password: string;
  name: string;
  email?: string;
  isLocal?: boolean;
  data: Partial<AppState>;
}

export const SECTION_COLORS: SectionColorMap = {
  purple: { bg: 'rgba(124,106,246,0.1)', text: '#7C6AF6', border: 'rgba(124,106,246,0.3)', dot: '#7C6AF6' },
  teal:   { bg: 'rgba(20,184,166,0.1)',  text: '#0D9488', border: 'rgba(20,184,166,0.3)',  dot: '#14B8A6' },
  blue:   { bg: 'rgba(59,130,246,0.1)',  text: '#2563EB', border: 'rgba(59,130,246,0.3)',  dot: '#3B82F6' },
  amber:  { bg: 'rgba(245,158,11,0.1)',  text: '#D97706', border: 'rgba(245,158,11,0.3)',  dot: '#F59E0B' },
  coral:  { bg: 'rgba(239,68,68,0.1)',   text: '#DC2626', border: 'rgba(239,68,68,0.3)',   dot: '#EF4444' },
  green:  { bg: 'rgba(34,197,94,0.1)',   text: '#16A34A', border: 'rgba(34,197,94,0.3)',   dot: '#22C55E' },
  pink:   { bg: 'rgba(236,72,153,0.1)',  text: '#DB2777', border: 'rgba(236,72,153,0.3)',  dot: '#EC4899' },
  gray:   { bg: 'rgba(107,114,128,0.1)', text: '#4B5563', border: 'rgba(107,114,128,0.3)', dot: '#6B7280' },
};
