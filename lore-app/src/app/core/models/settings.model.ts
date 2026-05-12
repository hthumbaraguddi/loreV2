/**
 * Settings Models
 * Defines interfaces for application settings
 */

export interface AIBehaviourToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AISettings {
  defaultProvider: 'claude' | 'gpt';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  responseLanguage: string;
  models: {
    claude: string;
    gpt: string;
  };
  behaviourToggles: AIBehaviourToggle[];
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

export const DEFAULT_AI_BEHAVIOUR_TOGGLES: AIBehaviourToggle[] = [
  { id: 'auto-link',        name: 'Auto-link AI responses to Knowledge Graph',      description: 'AI replies are parsed for concepts and linked as graph nodes automatically',                  enabled: true },
  { id: 'note-context',     name: 'Include note context in every AI prompt',         description: 'The full current note content is sent as context with each @mention query',                  enabled: true },
  { id: 'bio-context',      name: 'Include personal bio context',                    description: 'Inject your profile persona into AI system prompts for better responses',                    enabled: true },
  { id: 'save-exchanges',   name: 'Save AI exchanges as sub-notes',                  description: 'Each @mention conversation is saved as a linked child note in the same notebook',           enabled: true },
  { id: 'token-usage',      name: 'Show token usage and estimated cost',             description: 'Display token count and approximate cost per AI call in block footer',                      enabled: false },
  { id: 'auto-summary',     name: 'Auto-generate note summary on save',              description: 'Generates a 2-sentence summary for sidebar preview using the default model',                enabled: false },
  { id: 'scheduled-prompts', name: 'Scheduled AI prompts (Cron Jobs)',               description: 'Allow prompts from the Prompt Library to run on a schedule and save output as notes',      enabled: true },
];

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    defaultProvider: 'claude',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: '',
    responseLanguage: 'English',
    models: {
      claude: 'claude-3-5-sonnet-20241022',
      gpt: 'gpt-4-turbo-preview'
    },
    behaviourToggles: DEFAULT_AI_BEHAVIOUR_TOGGLES,
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
