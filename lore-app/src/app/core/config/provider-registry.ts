/**
 * Provider Registry
 * Single source of truth for all supported AI provider metadata.
 * Adding a new provider requires only a new entry in PROVIDER_REGISTRY —
 * no other code changes are needed.
 */

export interface ModelDefinition {
  id: string;
  displayName: string;
}

export interface ProviderDefinition {
  /** Unique provider identifier, e.g. 'anthropic', 'openai', 'google' */
  id: string;
  /** Human-readable name shown in the UI, e.g. 'Anthropic Claude' */
  displayName: string;
  /** Path to the provider logo SVG asset */
  logoAsset: string;
  /** Placeholder text for the API key input field */
  keyPlaceholder: string;
  /** RegExp used to validate the API key format before saving */
  keyPattern: RegExp;
  /** URL opened in a new tab when the user clicks "Get API Key" */
  getApiKeyUrl: string;
  /** Base URL for API requests to this provider */
  apiBaseUrl: string;
  /** Default model ID used when no model is explicitly selected */
  defaultModel: string;
  /** All models available for this provider */
  availableModels: ModelDefinition[];
}

export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  {
    id: 'anthropic',
    displayName: 'Anthropic Claude',
    logoAsset: 'assets/providers/anthropic.svg',
    keyPlaceholder: 'sk-ant-api03-...',
    keyPattern: /^sk-ant-/,
    getApiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
    availableModels: [
      { id: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229',     displayName: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307',    displayName: 'Claude 3 Haiku' },
    ],
  },
  {
    id: 'openai',
    displayName: 'OpenAI GPT',
    logoAsset: 'assets/providers/openai.svg',
    keyPlaceholder: 'sk-...',
    keyPattern: /^sk-/,
    getApiKeyUrl: 'https://platform.openai.com/api-keys',
    apiBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo-preview',
    availableModels: [
      { id: 'gpt-4-turbo-preview', displayName: 'GPT-4 Turbo' },
      { id: 'gpt-4',               displayName: 'GPT-4' },
      { id: 'gpt-3.5-turbo',       displayName: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'google',
    displayName: 'Google Gemini',
    logoAsset: 'assets/providers/google.svg',
    keyPlaceholder: 'AIza...',
    keyPattern: /^AIza/,
    getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-pro',
    availableModels: [
      { id: 'gemini-1.5-pro',   displayName: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
    ],
  },
  {
    id: 'groq',
    displayName: 'Groq',
    logoAsset: 'assets/providers/groq.svg',
    keyPlaceholder: 'gsk_...',
    keyPattern: /^gsk_/,
    getApiKeyUrl: 'https://console.groq.com/keys',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      { id: 'llama-3.3-70b-versatile',  displayName: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant',     displayName: 'Llama 3.1 8B Instant' },
      { id: 'mixtral-8x7b-32768',       displayName: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it',             displayName: 'Gemma 2 9B' },
    ],
  },
];

/**
 * Convenience lookup map — O(1) access by provider ID.
 * Use instead of PROVIDER_REGISTRY.find() in hot paths.
 */
export const PROVIDER_MAP = new Map<string, ProviderDefinition>(
  PROVIDER_REGISTRY.map(p => [p.id, p])
);
