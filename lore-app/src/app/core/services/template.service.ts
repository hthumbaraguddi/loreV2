import { Injectable, signal, computed } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { BlockType } from '../models/shelf.model';

export interface TemplateBlock {
  id: string;
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  required: boolean;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  noteType: string;
  blocks: TemplateBlock[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TemplateService
 * Manages note templates for quick note creation
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly STORAGE_KEY = 'templates';
  
  // Signals
  private templatesSignal = signal<Template[]>([]);
  
  // Public computed signals
  templates = this.templatesSignal.asReadonly();
  
  // Categories and note types
  categories = signal(['Research', 'Journal', 'Finance', 'Engineering', 'AI', 'Personal', 'Work']);
  noteTypes = signal(['Research', 'Journal', 'Task', 'Idea', 'Reference', 'HTML']);

  constructor(private localStorage: LocalStorageService) {
    this.loadFromStorage();
    this.initializeDefaultTemplates();
  }

  // ═══════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Create a new template
   */
  createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
    const newTemplate: Template = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const templates = this.templatesSignal();
    this.templatesSignal.set([...templates, newTemplate]);
    this.saveToStorage();
    return newTemplate;
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<Template>): boolean {
    const templates = this.templatesSignal();
    const index = templates.findIndex(t => t.id === templateId);
    
    if (index === -1) return false;

    const updatedTemplate = {
      ...templates[index],
      ...updates,
      updatedAt: new Date()
    };

    const newTemplates = [...templates];
    newTemplates[index] = updatedTemplate;
    this.templatesSignal.set(newTemplates);
    this.saveToStorage();
    return true;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const templates = this.templatesSignal();
    const filtered = templates.filter(t => t.id !== templateId);
    
    if (filtered.length === templates.length) return false;

    this.templatesSignal.set(filtered);
    this.saveToStorage();
    return true;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Template | undefined {
    return this.templatesSignal().find(t => t.id === templateId);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Template[] {
    return this.templatesSignal().filter(t => t.category === category);
  }

  /**
   * Get templates by note type
   */
  getTemplatesByNoteType(noteType: string): Template[] {
    return this.templatesSignal().filter(t => t.noteType === noteType);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): Template[] {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return this.templatesSignal().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STORAGE & UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Load templates from localStorage
   */
  private loadFromStorage(): void {
    const stored = this.localStorage.getItem<Template[]>(this.STORAGE_KEY);
    
    if (stored && stored.length > 0) {
      // Convert date strings back to Date objects
      const templates = stored.map(template => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt),
        blocks: template.blocks.map(block => ({
          ...block,
          // Ensure blocks have all required properties
          required: block.required || false,
          order: block.order || 0
        }))
      }));
      this.templatesSignal.set(templates);
    }
  }

  /**
   * Save templates to localStorage
   */
  private saveToStorage(): void {
    this.localStorage.setItem(this.STORAGE_KEY, this.templatesSignal());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const templates = this.templatesSignal();
    if (templates.length > 0) return; // Already initialized

    const defaultTemplates: Template[] = [
      {
        id: 'tpl_research_standard',
        name: 'Research Paper Template',
        description: 'Standard template for academic research notes',
        category: 'Research',
        noteType: 'Research',
        blocks: [
          { id: 'blk_hyp', type: BlockType.Hypothesis, name: 'Hypothesis', description: 'Core research question', icon: '💡', required: true, order: 0 },
          { id: 'blk_kf', type: BlockType.KeyFindings, name: 'Key Findings', description: 'Numbered list of results', icon: '🔑', required: true, order: 1 },
          { id: 'blk_con', type: BlockType.Conclusion, name: 'Conclusion', description: 'Summary and implications', icon: '🎯', required: true, order: 2 },
          { id: 'blk_kd', type: BlockType.KeyDifferences, name: 'Comparison Table', description: 'Side-by-side analysis', icon: '⚡', required: false, order: 3 },
          { id: 'blk_note', type: BlockType.Note, name: 'Methodology Notes', description: 'Research methods details', icon: '📝', required: false, order: 4 }
        ],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01')
      },
      {
        id: 'tpl_journal_daily',
        name: 'Daily Journal Template',
        description: 'Template for daily reflection and planning',
        category: 'Journal',
        noteType: 'Journal',
        blocks: [
          { id: 'blk_note', type: BlockType.Note, name: 'What I did', description: 'Daily accomplishments', icon: '📝', required: true, order: 0 },
          { id: 'blk_note', type: BlockType.Note, name: 'What went well', description: 'Positive experiences', icon: '📝', required: true, order: 1 },
          { id: 'blk_note', type: BlockType.Note, name: 'What didn\'t go well', description: 'Challenges and learnings', icon: '📝', required: true, order: 2 },
          { id: 'blk_check', type: BlockType.Checklist, name: 'Tomorrow\'s Tasks', description: 'Planned activities', icon: '✅', required: false, order: 3 },
          { id: 'blk_note', type: BlockType.Note, name: 'Gratitude', description: 'Things I\'m thankful for', icon: '📝', required: false, order: 4 }
        ],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01')
      },
      {
        id: 'tpl_ai_analysis',
        name: 'AI Model Analysis',
        description: 'Template for comparing AI models and architectures',
        category: 'AI',
        noteType: 'Research',
        blocks: [
          { id: 'blk_kd', type: BlockType.KeyDifferences, name: 'Model Comparison', description: 'Side-by-side specs', icon: '⚡', required: true, order: 0 },
          { id: 'blk_hyp', type: BlockType.Hypothesis, name: 'Performance Hypothesis', description: 'Expected vs actual', icon: '💡', required: true, order: 1 },
          { id: 'blk_kf', type: BlockType.KeyFindings, name: 'Benchmark Results', description: 'Quantitative analysis', icon: '🔑', required: true, order: 2 },
          { id: 'blk_con', type: BlockType.Conclusion, name: 'Recommendation', description: 'Which model to use', icon: '🎯', required: true, order: 3 },
          { id: 'blk_ai', type: BlockType.AskAI, name: 'Ask AI', description: 'Get AI insights', icon: '✦', required: false, order: 4 }
        ],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01')
      },
      {
        id: 'tpl_meeting_notes',
        name: 'Meeting Notes',
        description: 'Template for capturing meeting discussions and action items',
        category: 'Work',
        noteType: 'Task',
        blocks: [
          { id: 'blk_note', type: BlockType.Note, name: 'Agenda', description: 'Meeting topics', icon: '📝', required: true, order: 0 },
          { id: 'blk_note', type: BlockType.Note, name: 'Discussion Points', description: 'Key conversations', icon: '📝', required: true, order: 1 },
          { id: 'blk_check', type: BlockType.Checklist, name: 'Action Items', description: 'Tasks with owners', icon: '✅', required: true, order: 2 },
          { id: 'blk_note', type: BlockType.Note, name: 'Decisions Made', description: 'Agreements and outcomes', icon: '📝', required: true, order: 3 },
          { id: 'blk_note', type: BlockType.Note, name: 'Next Steps', description: 'Follow-up actions', icon: '📝', required: false, order: 4 }
        ],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01')
      }
    ];

    this.templatesSignal.set(defaultTemplates);
    this.saveToStorage();
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE APPLICATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Apply template to create note blocks
   */
  applyTemplate(templateId: string): any[] {
    const template = this.getTemplate(templateId);
    if (!template) return [];

    // Convert template blocks to note blocks
    return template.blocks.map(block => ({
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: block.type,
      content: '',
      order: block.order,
      createdAt: new Date(),
      metadata: {}
    }));
  }

  /**
   * Duplicate template
   */
  duplicateTemplate(templateId: string): Template | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    const newTemplate: Template = {
      ...template,
      id: this.generateId(),
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const templates = this.templatesSignal();
    this.templatesSignal.set([...templates, newTemplate]);
    this.saveToStorage();
    return newTemplate;
  }
}