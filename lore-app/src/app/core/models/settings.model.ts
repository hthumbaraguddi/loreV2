/**
 * Settings Models
 * Defines interfaces for application settings
 */

export interface AISettings {
  defaultProvider: 'claude' | 'gpt';
  temperature: number;
  maxTokens: number;
  models: {
    claude: string;
    gpt: string;
  };
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: number;
  canvasBackground: 'plain' | 'dot' | 'square' | 'lined';
}

export interface EditorSettings {
  autoSave: boolean;
  autoSaveDelay: number;
  spellCheck: boolean;
  wordWrap: boolean;
}

export interface AppSettings {
  ai: AISettings;
  appearance: AppearanceSettings;
  editor: EditorSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    defaultProvider: 'claude',
    temperature: 0.7,
    maxTokens: 4096,
    models: {
      claude: 'claude-3-5-sonnet-20241022',
      gpt: 'gpt-4-turbo-preview'
    }
  },
  appearance: {
    theme: 'auto',
    accentColor: '#8b5cf6',
    fontSize: 16,
    canvasBackground: 'dot'
  },
  editor: {
    autoSave: true,
    autoSaveDelay: 2000,
    spellCheck: true,
    wordWrap: true
  }
};
