import { Injectable, signal, computed, effect } from '@angular/core';

/**
 * AI Behaviour Settings
 * Persisted user preferences for AI interactions
 */
export interface AIBehaviourSettings {
  // Default provider for chat and mentions
  defaultProvider: string;
  
  // Context inclusion flags
  includeNoteContext: boolean;
  includeBioContext: boolean;
  
  // Response style preferences
  responseStyle: string[];
  
  // Token limits
  maxTokens: number;
  
  // Temperature (0.0 - 2.0)
  temperature: number;
  
  // System prompt override
  systemPrompt?: string;
  
  // Response language
  responseLanguage: string;
  
  // Feature toggles
  autoLinkReferences: boolean;
  saveExchanges: boolean;
  showTokenUsage: boolean;
  autoSummary: boolean;
  enableScheduledPrompts: boolean;
}

/**
 * Default AI behaviour settings
 */
const DEFAULT_SETTINGS: AIBehaviourSettings = {
  defaultProvider: 'anthropic',
  includeNoteContext: true,
  includeBioContext: true,
  responseStyle: ['Concise'],
  maxTokens: 1024,
  temperature: 1.0,
  systemPrompt: undefined,
  responseLanguage: 'English',
  autoLinkReferences: true,
  saveExchanges: true,
  showTokenUsage: false,
  autoSummary: false,
  enableScheduledPrompts: false,
};

/**
 * Available response style options
 */
export const RESPONSE_STYLES = [
  'Concise',
  'Technical depth',
  'Use bullet points',
  'Formal tone',
  'Explain like I\'m new to this',
] as const;

/**
 * Available response languages
 */
export const RESPONSE_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
] as const;

/**
 * Service for managing AI behaviour settings
 * Provides reactive signals and localStorage persistence
 */
@Injectable({
  providedIn: 'root'
})
export class AiBehaviourService {
  private readonly STORAGE_KEY = 'lore.settings.ai-behaviour';
  
  // Settings signal
  private readonly _settings = signal<AIBehaviourSettings>(this._loadSettings());
  
  // Public readonly settings
  readonly settings = this._settings.asReadonly();
  
  // Computed values for common use cases
  readonly defaultProvider = computed(() => this._settings().defaultProvider);
  readonly includeNoteContext = computed(() => this._settings().includeNoteContext);
  readonly includeBioContext = computed(() => this._settings().includeBioContext);
  readonly responseStyle = computed(() => this._settings().responseStyle);
  readonly maxTokens = computed(() => this._settings().maxTokens);
  readonly temperature = computed(() => this._settings().temperature);
  readonly systemPrompt = computed(() => this._settings().systemPrompt);
  readonly responseLanguage = computed(() => this._settings().responseLanguage);
  readonly showTokenUsage = computed(() => this._settings().showTokenUsage);
  
  constructor() {
    // Auto-save settings when they change
    effect(() => {
      const settings = this._settings();
      this._saveSettings(settings);
    });
  }
  
  /**
   * Update default provider
   */
  setDefaultProvider(providerId: string): void {
    this._settings.update(s => ({ ...s, defaultProvider: providerId }));
  }
  
  /**
   * Toggle note context inclusion
   */
  toggleNoteContext(): void {
    this._settings.update(s => ({ ...s, includeNoteContext: !s.includeNoteContext }));
  }
  
  /**
   * Set note context inclusion
   */
  setNoteContext(include: boolean): void {
    this._settings.update(s => ({ ...s, includeNoteContext: include }));
  }
  
  /**
   * Toggle bio context inclusion
   */
  toggleBioContext(): void {
    this._settings.update(s => ({ ...s, includeBioContext: !s.includeBioContext }));
  }
  
  /**
   * Set bio context inclusion
   */
  setBioContext(include: boolean): void {
    this._settings.update(s => ({ ...s, includeBioContext: include }));
  }
  
  /**
   * Toggle a response style
   */
  toggleResponseStyle(style: string): void {
    this._settings.update(s => {
      const styles = [...s.responseStyle];
      const index = styles.indexOf(style);
      
      if (index >= 0) {
        styles.splice(index, 1);
      } else {
        styles.push(style);
      }
      
      return { ...s, responseStyle: styles };
    });
  }
  
  /**
   * Set response styles
   */
  setResponseStyles(styles: string[]): void {
    this._settings.update(s => ({ ...s, responseStyle: [...styles] }));
  }
  
  /**
   * Update max tokens (clamped to 256-8192)
   */
  setMaxTokens(tokens: number): void {
    const clamped = Math.max(256, Math.min(8192, tokens));
    this._settings.update(s => ({ ...s, maxTokens: clamped }));
  }
  
  /**
   * Update temperature (clamped to 0.0-2.0)
   */
  setTemperature(temp: number): void {
    const clamped = Math.max(0.0, Math.min(2.0, temp));
    this._settings.update(s => ({ ...s, temperature: clamped }));
  }
  
  /**
   * Update system prompt
   */
  setSystemPrompt(prompt: string | undefined): void {
    this._settings.update(s => ({ ...s, systemPrompt: prompt }));
  }
  
  /**
   * Update response language
   */
  setResponseLanguage(language: string): void {
    this._settings.update(s => ({ ...s, responseLanguage: language }));
  }
  
  /**
   * Toggle auto-link references
   */
  toggleAutoLinkReferences(): void {
    this._settings.update(s => ({ ...s, autoLinkReferences: !s.autoLinkReferences }));
  }
  
  /**
   * Toggle save exchanges
   */
  toggleSaveExchanges(): void {
    this._settings.update(s => ({ ...s, saveExchanges: !s.saveExchanges }));
  }
  
  /**
   * Toggle show token usage
   */
  toggleShowTokenUsage(): void {
    this._settings.update(s => ({ ...s, showTokenUsage: !s.showTokenUsage }));
  }
  
  /**
   * Toggle auto-summary
   */
  toggleAutoSummary(): void {
    this._settings.update(s => ({ ...s, autoSummary: !s.autoSummary }));
  }
  
  /**
   * Toggle scheduled prompts
   */
  toggleScheduledPrompts(): void {
    this._settings.update(s => ({ ...s, enableScheduledPrompts: !s.enableScheduledPrompts }));
  }
  
  /**
   * Build system prompt from settings
   * Combines bio context, note context, and style preferences
   */
  buildSystemPrompt(bioContext?: string, noteContext?: string): string {
    const parts: string[] = [];
    
    // Add custom system prompt if set
    const customPrompt = this._settings().systemPrompt;
    if (customPrompt) {
      parts.push(customPrompt);
    }
    
    // Add bio context if enabled
    if (this._settings().includeBioContext && bioContext) {
      parts.push(`Professional context: ${bioContext}`);
    }
    
    // Add note context if enabled
    if (this._settings().includeNoteContext && noteContext) {
      parts.push(`Current note content:\n${noteContext}`);
    }
    
    // Add response style directives
    if (this._settings().responseStyle.length > 0) {
      const styles = this._settings().responseStyle.join(', ');
      parts.push(`Respond in the following style: ${styles}.`);
    }
    
    // Add language directive if not English
    if (this._settings().responseLanguage !== 'English') {
      parts.push(`Respond in ${this._settings().responseLanguage}.`);
    }
    
    return parts.join('\n\n');
  }
  
  /**
   * Get AI request options from settings
   */
  getRequestOptions() {
    return {
      maxTokens: this._settings().maxTokens,
      temperature: this._settings().temperature,
    };
  }
  
  /**
   * Reset to default settings
   */
  reset(): void {
    this._settings.set({ ...DEFAULT_SETTINGS });
  }
  
  /**
   * Load settings from localStorage
   */
  private _loadSettings(): AIBehaviourSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new fields
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load AI behaviour settings:', error);
    }
    
    return { ...DEFAULT_SETTINGS };
  }
  
  /**
   * Save settings to localStorage
   */
  private _saveSettings(settings: AIBehaviourSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save AI behaviour settings:', error);
    }
  }
}
