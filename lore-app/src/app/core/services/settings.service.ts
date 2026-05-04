import { Injectable, signal, computed, effect } from '@angular/core';
import { AppSettings, AISettings, DEFAULT_SETTINGS } from '../models/settings.model';
import { encrypt, decrypt, isCryptoAvailable } from '../../shared/utils/crypto.util';

/**
 * SettingsService
 * Manages application settings and API keys with encryption
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_PREFIX = 'lore.';
  private readonly SETTINGS_KEY = 'lore.settings';
  private readonly CLAUDE_KEY = 'lore.ai.claude.key';
  private readonly GPT_KEY = 'lore.ai.gpt.key';

  // Settings state
  private settingsState = signal<AppSettings>(this.loadSettings());

  // API key state (encrypted in storage, decrypted in memory)
  private claudeApiKeyState = signal<string | null>(null);
  private gptApiKeyState = signal<string | null>(null);

  // Public signals
  readonly settings = this.settingsState.asReadonly();
  readonly aiSettings = computed(() => this.settingsState().ai);
  readonly appearanceSettings = computed(() => this.settingsState().appearance);
  readonly editorSettings = computed(() => this.settingsState().editor);
  readonly claudeApiKey = this.claudeApiKeyState.asReadonly();
  readonly gptApiKey = this.gptApiKeyState.asReadonly();

  // Computed helpers
  readonly hasClaudeKey = computed(() => this.claudeApiKeyState() !== null);
  readonly hasGptKey = computed(() => this.gptApiKeyState() !== null);
  readonly hasAnyApiKey = computed(() => this.hasClaudeKey() || this.hasGptKey());

  constructor() {
    // Auto-save settings on change
    effect(() => {
      const settings = this.settingsState();
      this.saveSettings(settings);
    });

    // Load API keys on init
    this.loadApiKeys();
  }

  // ============================================================================
  // Settings Management
  // ============================================================================

  /**
   * Update AI settings
   */
  updateAISettings(updates: Partial<AISettings>): void {
    this.settingsState.update(current => ({
      ...current,
      ai: { ...current.ai, ...updates }
    }));
  }

  /**
   * Update appearance settings
   */
  updateAppearanceSettings(updates: Partial<AppSettings['appearance']>): void {
    this.settingsState.update(current => ({
      ...current,
      appearance: { ...current.appearance, ...updates }
    }));
  }

  /**
   * Update editor settings
   */
  updateEditorSettings(updates: Partial<AppSettings['editor']>): void {
    this.settingsState.update(current => ({
      ...current,
      editor: { ...current.editor, ...updates }
    }));
  }

  /**
   * Reset all settings to defaults
   */
  resetSettings(): void {
    this.settingsState.set(DEFAULT_SETTINGS);
  }

  // ============================================================================
  // API Key Management
  // ============================================================================

  /**
   * Set Claude API key (encrypted storage)
   */
  async setClaudeApiKey(key: string): Promise<void> {
    if (!key || key.trim() === '') {
      throw new Error('API key cannot be empty');
    }

    if (!this.validateClaudeKey(key)) {
      throw new Error('Invalid Claude API key format');
    }

    try {
      const encrypted = await encrypt(key);
      localStorage.setItem(this.CLAUDE_KEY, encrypted);
      this.claudeApiKeyState.set(key);
    } catch (error) {
      console.error('Failed to save Claude API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Set GPT API key (encrypted storage)
   */
  async setGptApiKey(key: string): Promise<void> {
    if (!key || key.trim() === '') {
      throw new Error('API key cannot be empty');
    }

    if (!this.validateGptKey(key)) {
      throw new Error('Invalid GPT API key format');
    }

    try {
      const encrypted = await encrypt(key);
      localStorage.setItem(this.GPT_KEY, encrypted);
      this.gptApiKeyState.set(key);
    } catch (error) {
      console.error('Failed to save GPT API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Get Claude API key (decrypted)
   */
  getClaudeApiKey(): string | null {
    return this.claudeApiKeyState();
  }

  /**
   * Get GPT API key (decrypted)
   */
  getGptApiKey(): string | null {
    return this.gptApiKeyState();
  }

  /**
   * Clear Claude API key
   */
  clearClaudeApiKey(): void {
    localStorage.removeItem(this.CLAUDE_KEY);
    this.claudeApiKeyState.set(null);
  }

  /**
   * Clear GPT API key
   */
  clearGptApiKey(): void {
    localStorage.removeItem(this.GPT_KEY);
    this.gptApiKeyState.set(null);
  }

  /**
   * Clear all API keys
   */
  clearAllApiKeys(): void {
    this.clearClaudeApiKey();
    this.clearGptApiKey();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
          appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
          editor: { ...DEFAULT_SETTINGS.editor, ...parsed.editor }
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Load API keys from localStorage (decrypt)
   */
  private async loadApiKeys(): Promise<void> {
    if (!isCryptoAvailable()) {
      console.warn('Web Crypto API not available');
      return;
    }

    // Load Claude key
    try {
      const claudeEncrypted = localStorage.getItem(this.CLAUDE_KEY);
      if (claudeEncrypted) {
        const claudeKey = await decrypt(claudeEncrypted);
        this.claudeApiKeyState.set(claudeKey);
      }
    } catch (error) {
      console.error('Failed to load Claude API key:', error);
      localStorage.removeItem(this.CLAUDE_KEY);
    }

    // Load GPT key
    try {
      const gptEncrypted = localStorage.getItem(this.GPT_KEY);
      if (gptEncrypted) {
        const gptKey = await decrypt(gptEncrypted);
        this.gptApiKeyState.set(gptKey);
      }
    } catch (error) {
      console.error('Failed to load GPT API key:', error);
      localStorage.removeItem(this.GPT_KEY);
    }
  }

  /**
   * Validate Claude API key format
   */
  private validateClaudeKey(key: string): boolean {
    // Claude keys start with 'sk-ant-'
    return key.startsWith('sk-ant-') && key.length > 20;
  }

  /**
   * Validate GPT API key format
   */
  private validateGptKey(key: string): boolean {
    // OpenAI keys start with 'sk-'
    return key.startsWith('sk-') && key.length > 20;
  }
}
