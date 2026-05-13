import { Injectable, signal, computed } from '@angular/core';
import { Prompt, PromptRun, PromptStats, PromptVariable } from '../models/prompt.model';
import { LocalStorageService } from './local-storage.service';

/**
 * PromptService
 * Manages CRUD operations for reusable AI prompt templates
 */
@Injectable({
  providedIn: 'root'
})
export class PromptService {
  private readonly STORAGE_KEY = 'lore.prompts';
  private readonly RUNS_STORAGE_KEY = 'lore.prompt-runs';
  private readonly MAX_RUNS_PER_PROMPT = 50;

  // Signal-based state
  private promptsSignal = signal<Prompt[]>([]);
  private runsSignal = signal<PromptRun[]>([]);

  // Computed signals
  prompts = this.promptsSignal.asReadonly();
  runs = this.runsSignal.asReadonly();
  
  favoritePrompts = computed(() => 
    this.promptsSignal().filter(p => p.isFavorite)
  );
  
  scheduledPrompts = computed(() => 
    this.promptsSignal().filter(p => p.schedule?.enabled)
  );
  
  stats = computed<PromptStats>(() => {
    const prompts = this.promptsSignal();
    const runs = this.runsSignal();
    const successfulRuns = runs.filter(r => r.status === 'success');
    
    return {
      totalPrompts: prompts.length,
      totalRuns: runs.length,
      successRate: runs.length > 0 ? (successfulRuns.length / runs.length) * 100 : 0,
      averageDuration: runs.length > 0 
        ? runs.reduce((sum, r) => sum + (r.duration || 0), 0) / runs.length 
        : 0,
      totalTokensUsed: runs.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
      favoriteCount: prompts.filter(p => p.isFavorite).length,
      scheduledCount: prompts.filter(p => p.schedule?.enabled).length
    };
  });

  constructor(private localStorage: LocalStorageService) {
    this.loadPrompts();
    this.loadRuns();
  }

  /**
   * Load prompts from localStorage
   */
  private loadPrompts(): void {
    const stored = this.localStorage.getItem<Prompt[]>(this.STORAGE_KEY);
    if (stored && Array.isArray(stored)) {
      // Convert date strings back to Date objects
      const prompts = stored.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined,
        schedule: p.schedule ? {
          ...p.schedule,
          nextRun: p.schedule.nextRun ? new Date(p.schedule.nextRun) : undefined,
          lastRun: p.schedule.lastRun ? new Date(p.schedule.lastRun) : undefined
        } : undefined
      }));
      this.promptsSignal.set(prompts);
    } else {
      // Initialize with sample prompts
      this.initializeSamplePrompts();
    }
  }

  /**
   * Load prompt runs from localStorage
   */
  private loadRuns(): void {
    const stored = this.localStorage.getItem<PromptRun[]>(this.RUNS_STORAGE_KEY);
    if (stored && Array.isArray(stored)) {
      const runs = stored.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }));
      this.runsSignal.set(runs);
    }
  }

  /**
   * Save prompts to localStorage
   */
  private savePrompts(): void {
    this.localStorage.setItem(this.STORAGE_KEY, this.promptsSignal());
  }

  /**
   * Save runs to localStorage
   */
  private saveRuns(): void {
    this.localStorage.setItem(this.RUNS_STORAGE_KEY, this.runsSignal());
  }

  /**
   * Initialize with sample prompts for development
   */
  private initializeSamplePrompts(): void {
    const now = new Date();
    const samples: Prompt[] = [
      {
        id: this.generateId(),
        title: 'Summarize Research',
        description: 'Generate a concise summary of research findings',
        template: 'Please summarize the following research on {{topic}}:\n\n{{content}}\n\nFocus on: {{focus_areas}}',
        variables: [
          { name: 'topic', type: 'text', label: 'Research Topic', required: true, placeholder: 'e.g., Machine Learning' },
          { name: 'content', type: 'text', label: 'Research Content', required: true, placeholder: 'Paste your research notes here' },
          { name: 'focus_areas', type: 'text', label: 'Focus Areas', required: false, placeholder: 'e.g., Key findings, methodology' }
        ],
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 1024,
        tags: ['research', 'summary'],
        createdAt: now,
        updatedAt: now,
        useCount: 0,
        isFavorite: true
      },
      {
        id: this.generateId(),
        title: 'Daily Standup Report',
        description: 'Generate a daily standup report from notes',
        template: 'Create a standup report for {{date}}:\n\nYesterday: {{yesterday}}\nToday: {{today}}\nBlockers: {{blockers}}',
        variables: [
          { name: 'date', type: 'date', label: 'Date', required: true },
          { name: 'yesterday', type: 'text', label: 'Yesterday\'s Work', required: true },
          { name: 'today', type: 'text', label: 'Today\'s Plan', required: true },
          { name: 'blockers', type: 'text', label: 'Blockers', required: false, defaultValue: 'None' }
        ],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 512,
        tags: ['work', 'standup'],
        schedule: {
          enabled: true,
          cronExpression: '0 9 * * 1-5', // Weekdays at 9 AM
          nextRun: new Date(now.getTime() + 86400000) // Tomorrow
        },
        createdAt: now,
        updatedAt: now,
        useCount: 0,
        isFavorite: false
      },
      {
        id: this.generateId(),
        title: 'Code Review',
        description: 'Review code and provide feedback',
        template: 'Review the following {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{review_aspects}}',
        variables: [
          { name: 'language', type: 'select', label: 'Programming Language', required: true, options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust'] },
          { name: 'code', type: 'text', label: 'Code to Review', required: true },
          { name: 'review_aspects', type: 'select', label: 'Review Focus', required: false, options: ['Performance', 'Security', 'Best Practices', 'Readability'], defaultValue: 'Best Practices' }
        ],
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        maxTokens: 2048,
        tags: ['code', 'review'],
        createdAt: now,
        updatedAt: now,
        useCount: 0,
        isFavorite: true
      }
    ];
    
    this.promptsSignal.set(samples);
    this.savePrompts();
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new prompt
   */
  createPrompt(prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'useCount'>): Prompt {
    const now = new Date();
    const newPrompt: Prompt = {
      ...prompt,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      useCount: 0
    };
    
    this.promptsSignal.update(prompts => [...prompts, newPrompt]);
    this.savePrompts();
    return newPrompt;
  }

  /**
   * Update an existing prompt
   */
  updatePrompt(id: string, updates: Partial<Prompt>): Prompt | null {
    const prompts = this.promptsSignal();
    const index = prompts.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    const updatedPrompt: Prompt = {
      ...prompts[index],
      ...updates,
      id: prompts[index].id, // Prevent ID change
      createdAt: prompts[index].createdAt, // Prevent createdAt change
      updatedAt: new Date()
    };
    
    this.promptsSignal.update(prompts => {
      const newPrompts = [...prompts];
      newPrompts[index] = updatedPrompt;
      return newPrompts;
    });
    
    this.savePrompts();
    return updatedPrompt;
  }

  /**
   * Delete a prompt
   */
  deletePrompt(id: string): boolean {
    const prompts = this.promptsSignal();
    const filtered = prompts.filter(p => p.id !== id);
    
    if (filtered.length === prompts.length) return false;
    
    this.promptsSignal.set(filtered);
    this.savePrompts();
    
    // Also delete associated runs
    const runs = this.runsSignal();
    const filteredRuns = runs.filter(r => r.promptId !== id);
    if (filteredRuns.length !== runs.length) {
      this.runsSignal.set(filteredRuns);
      this.saveRuns();
    }
    
    return true;
  }

  /**
   * Get a prompt by ID
   */
  getPrompt(id: string): Prompt | undefined {
    return this.promptsSignal().find(p => p.id === id);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string): boolean {
    const prompt = this.getPrompt(id);
    if (!prompt) return false;
    
    this.updatePrompt(id, { isFavorite: !prompt.isFavorite });
    return true;
  }

  /**
   * Increment use count and update lastUsed
   */
  recordUsage(id: string): void {
    const prompt = this.getPrompt(id);
    if (!prompt) return;
    
    this.updatePrompt(id, {
      useCount: prompt.useCount + 1,
      lastUsed: new Date()
    });
  }

  /**
   * Substitute variables in template
   */
  substituteVariables(template: string, values: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  /**
   * Validate variable values
   */
  validateVariables(variables: PromptVariable[], values: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const variable of variables) {
      const value = values[variable.name];
      
      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push(`${variable.label} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        if (variable.type === 'number' && isNaN(Number(value))) {
          errors.push(`${variable.label} must be a number`);
        }
        
        if (variable.type === 'select' && variable.options && !variable.options.includes(value)) {
          errors.push(`${variable.label} must be one of: ${variable.options.join(', ')}`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Record a prompt run
   */
  recordRun(run: Omit<PromptRun, 'id' | 'timestamp'>): PromptRun {
    const newRun: PromptRun = {
      ...run,
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    // Add to runs and limit to MAX_RUNS_PER_PROMPT per prompt
    this.runsSignal.update(runs => {
      const promptRuns = runs.filter(r => r.promptId === run.promptId);
      const otherRuns = runs.filter(r => r.promptId !== run.promptId);
      
      const updatedPromptRuns = [...promptRuns, newRun]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_RUNS_PER_PROMPT);
      
      return [...otherRuns, ...updatedPromptRuns];
    });
    
    this.saveRuns();
    return newRun;
  }

  /**
   * Get runs for a specific prompt
   */
  getPromptRuns(promptId: string): PromptRun[] {
    return this.runsSignal()
      .filter(r => r.promptId === promptId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent runs (all prompts)
   */
  getRecentRuns(limit: number = 10): PromptRun[] {
    return this.runsSignal()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all runs for a prompt
   */
  clearPromptRuns(promptId: string): void {
    this.runsSignal.update(runs => runs.filter(r => r.promptId !== promptId));
    this.saveRuns();
  }

  /**
   * Search prompts by title, description, or tags
   */
  searchPrompts(query: string): Prompt[] {
    const lowerQuery = query.toLowerCase();
    return this.promptsSignal().filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter prompts by tag
   */
  filterByTag(tag: string): Prompt[] {
    return this.promptsSignal().filter(p => p.tags.includes(tag));
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.promptsSignal().forEach(p => p.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }

  /**
   * Duplicate a prompt
   */
  duplicatePrompt(id: string): Prompt | null {
    const original = this.getPrompt(id);
    if (!original) return null;
    
    return this.createPrompt({
      ...original,
      title: `${original.title} (Copy)`,
      isFavorite: false,
      schedule: undefined,
      lastUsed: undefined
    });
  }

  /**
   * Export prompts as JSON
   */
  exportPrompts(): string {
    return JSON.stringify(this.promptsSignal(), null, 2);
  }

  /**
   * Import prompts from JSON
   */
  importPrompts(json: string): { success: boolean; count: number; error?: string } {
    try {
      const imported = JSON.parse(json);
      if (!Array.isArray(imported)) {
        return { success: false, count: 0, error: 'Invalid format: expected array' };
      }
      
      let count = 0;
      for (const prompt of imported) {
        if (prompt.title && prompt.template && prompt.variables) {
          this.createPrompt({
            title: prompt.title,
            description: prompt.description,
            template: prompt.template,
            variables: prompt.variables,
            provider: prompt.provider || 'anthropic',
            model: prompt.model,
            temperature: prompt.temperature,
            maxTokens: prompt.maxTokens,
            tags: prompt.tags || [],
            isFavorite: false
          });
          count++;
        }
      }
      
      return { success: true, count };
    } catch (error) {
      return { success: false, count: 0, error: 'Failed to parse JSON' };
    }
  }
}
