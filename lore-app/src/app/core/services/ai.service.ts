import { Injectable, signal } from '@angular/core';

/**
 * AI Provider Configuration
 */
export interface AIProvider {
  id: string;
  name: string;
  apiKey: string | null;
  baseUrl: string;
  models: AIModel[];
  enabled: boolean;
  connected: boolean;
}

/**
 * AI Model Configuration
 */
export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  maxTokens: number;
  supportsStreaming: boolean;
}

/**
 * AI Request Configuration
 */
export interface AIRequest {
  prompt: string;
  model: string;
  providerId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: string;
}

/**
 * AI Response
 */
export interface AIResponse {
  content: string;
  model: string;
  providerId: string;
  tokensUsed?: number;
  finishReason?: string;
  error?: string;
}

/**
 * AIService
 * Handles communication with AI providers (Claude, GPT, Gemini, Groq)
 */
@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly STORAGE_KEY = 'lore-ai-config';

  // Available providers
  private providersSignal = signal<AIProvider[]>([
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      apiKey: null,
      baseUrl: 'https://api.anthropic.com/v1',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          providerId: 'anthropic',
          maxTokens: 200000,
          supportsStreaming: true
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          providerId: 'anthropic',
          maxTokens: 200000,
          supportsStreaming: true
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          providerId: 'anthropic',
          maxTokens: 200000,
          supportsStreaming: true
        }
      ],
      enabled: true,
      connected: false
    },
    {
      id: 'openai',
      name: 'OpenAI (GPT)',
      apiKey: null,
      baseUrl: 'https://api.openai.com/v1',
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          providerId: 'openai',
          maxTokens: 128000,
          supportsStreaming: true
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          providerId: 'openai',
          maxTokens: 128000,
          supportsStreaming: true
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          providerId: 'openai',
          maxTokens: 16385,
          supportsStreaming: true
        }
      ],
      enabled: true,
      connected: false
    },
    {
      id: 'google',
      name: 'Google (Gemini)',
      apiKey: null,
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      models: [
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          providerId: 'google',
          maxTokens: 1000000,
          supportsStreaming: true
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          providerId: 'google',
          maxTokens: 1000000,
          supportsStreaming: true
        }
      ],
      enabled: false,
      connected: false
    },
    {
      id: 'groq',
      name: 'Groq (Llama)',
      apiKey: null,
      baseUrl: 'https://api.groq.com/openai/v1',
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B',
          providerId: 'groq',
          maxTokens: 32768,
          supportsStreaming: true
        },
        {
          id: 'llama-3.1-8b-instant',
          name: 'Llama 3.1 8B',
          providerId: 'groq',
          maxTokens: 8192,
          supportsStreaming: true
        }
      ],
      enabled: false,
      connected: false
    }
  ]);

  // Default model
  private defaultModelSignal = signal<string>('claude-3-5-sonnet-20241022');

  // Public signals
  providers = this.providersSignal.asReadonly();
  defaultModel = this.defaultModelSignal.asReadonly();

  constructor() {
    this.loadConfiguration();
  }

  // ═══════════════════════════════════════════════════════════
  // PROVIDER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  /**
   * Set API key for a provider
   */
  setApiKey(providerId: string, apiKey: string): void {
    this.providersSignal.update(providers =>
      providers.map(p =>
        p.id === providerId
          ? { ...p, apiKey, connected: !!apiKey }
          : p
      )
    );
    this.saveConfiguration();
  }

  /**
   * Get API key for a provider
   */
  getApiKey(providerId: string): string | null {
    const provider = this.providersSignal().find(p => p.id === providerId);
    return provider?.apiKey || null;
  }

  /**
   * Test connection to a provider
   */
  async testConnection(providerId: string): Promise<boolean> {
    const provider = this.providersSignal().find(p => p.id === providerId);
    if (!provider || !provider.apiKey) {
      return false;
    }

    try {
      // Send a simple test request
      const response = await this.sendRequest({
        prompt: 'Hello',
        model: provider.models[0].id,
        providerId: provider.id,
        maxTokens: 10,
        stream: false
      });

      const success = !response.error;
      
      // Update connection status
      this.providersSignal.update(providers =>
        providers.map(p =>
          p.id === providerId
            ? { ...p, connected: success }
            : p
        )
      );
      
      this.saveConfiguration();
      return success;
    } catch (error) {
      console.error(`Connection test failed for ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Set default model
   */
  setDefaultModel(modelId: string): void {
    this.defaultModelSignal.set(modelId);
    this.saveConfiguration();
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providersSignal().find(p => p.id === providerId);
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): AIModel | undefined {
    for (const provider of this.providersSignal()) {
      const model = provider.models.find(m => m.id === modelId);
      if (model) return model;
    }
    return undefined;
  }

  // ═══════════════════════════════════════════════════════════
  // AI REQUESTS
  // ═══════════════════════════════════════════════════════════

  /**
   * Send AI request (non-streaming)
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const provider = this.getProvider(request.providerId);
    if (!provider) {
      return {
        content: '',
        model: request.model,
        providerId: request.providerId,
        error: `Provider ${request.providerId} not found`
      };
    }

    if (!provider.apiKey) {
      return {
        content: '',
        model: request.model,
        providerId: request.providerId,
        error: `API key not configured for ${provider.name}`
      };
    }

    try {
      switch (request.providerId) {
        case 'anthropic':
          return await this.sendAnthropicRequest(request, provider);
        case 'openai':
          return await this.sendOpenAIRequest(request, provider);
        case 'google':
          return await this.sendGoogleRequest(request, provider);
        case 'groq':
          return await this.sendGroqRequest(request, provider);
        default:
          return {
            content: '',
            model: request.model,
            providerId: request.providerId,
            error: `Provider ${request.providerId} not supported`
          };
      }
    } catch (error: any) {
      return {
        content: '',
        model: request.model,
        providerId: request.providerId,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Send streaming AI request
   */
  async *sendStreamingRequest(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const provider = this.getProvider(request.providerId);
    if (!provider || !provider.apiKey) {
      yield `Error: Provider ${request.providerId} not configured`;
      return;
    }

    try {
      switch (request.providerId) {
        case 'anthropic':
          yield* this.streamAnthropicRequest(request, provider);
          break;
        case 'openai':
          yield* this.streamOpenAIRequest(request, provider);
          break;
        case 'google':
          yield* this.streamGoogleRequest(request, provider);
          break;
        case 'groq':
          yield* this.streamGroqRequest(request, provider);
          break;
        default:
          yield `Error: Provider ${request.providerId} not supported`;
      }
    } catch (error: any) {
      yield `Error: ${error.message || 'Unknown error occurred'}`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ANTHROPIC (CLAUDE) IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Send request to Anthropic API
   */
  private async sendAnthropicRequest(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1.0,
        system: request.systemPrompt || 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: request.context
              ? `Context:\n${request.context}\n\nQuestion:\n${request.prompt}`
              : request.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      model: request.model,
      providerId: request.providerId,
      tokensUsed: data.usage?.total_tokens,
      finishReason: data.stop_reason
    };
  }

  /**
   * Stream request to Anthropic API
   */
  private async *streamAnthropicRequest(request: AIRequest, provider: AIProvider): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1.0,
        system: request.systemPrompt || 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: request.context
              ? `Context:\n${request.context}\n\nQuestion:\n${request.prompt}`
              : request.prompt
          }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // OPENAI (GPT) IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Send request to OpenAI API
   */
  private async sendOpenAIRequest(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1.0,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt || 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: request.context
              ? `Context:\n${request.context}\n\nQuestion:\n${request.prompt}`
              : request.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: request.model,
      providerId: request.providerId,
      tokensUsed: data.usage?.total_tokens,
      finishReason: data.choices[0].finish_reason
    };
  }

  /**
   * Stream request to OpenAI API
   */
  private async *streamOpenAIRequest(request: AIRequest, provider: AIProvider): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1.0,
        messages: [
          {
            role: 'system',
            content: request.systemPrompt || 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: request.context
              ? `Context:\n${request.context}\n\nQuestion:\n${request.prompt}`
              : request.prompt
          }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GOOGLE (GEMINI) IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Send request to Google Gemini API
   */
  private async sendGoogleRequest(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    const response = await fetch(
      `${provider.baseUrl}/models/${request.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: request.context
                    ? `Context:\n${request.context}\n\nQuestion:\n${request.prompt}`
                    : request.prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: request.temperature || 1.0,
            maxOutputTokens: request.maxTokens || 4096
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      model: request.model,
      providerId: request.providerId,
      finishReason: data.candidates[0].finishReason
    };
  }

  /**
   * Stream request to Google Gemini API
   */
  private async *streamGoogleRequest(request: AIRequest, provider: AIProvider): AsyncGenerator<string, void, unknown> {
    const response = await fetch(
      `${provider.baseUrl}/models/${request.model}:streamGenerateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: request.context
                    ? `Context:\n${request.context}\n\nQuestion:\n${request.prompt}`
                    : request.prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: request.temperature || 1.0,
            maxOutputTokens: request.maxTokens || 4096
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GROQ (LLAMA) IMPLEMENTATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Send request to Groq API (OpenAI-compatible)
   */
  private async sendGroqRequest(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    return this.sendOpenAIRequest(request, provider);
  }

  /**
   * Stream request to Groq API (OpenAI-compatible)
   */
  private async *streamGroqRequest(request: AIRequest, provider: AIProvider): AsyncGenerator<string, void, unknown> {
    yield* this.streamOpenAIRequest(request, provider);
  }

  // ═══════════════════════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════════════════════

  /**
   * Load configuration from localStorage
   */
  private loadConfiguration(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        
        // Update providers with stored API keys
        if (config.providers) {
          this.providersSignal.update(providers =>
            providers.map(p => {
              const stored = config.providers.find((sp: any) => sp.id === p.id);
              return stored
                ? { ...p, apiKey: stored.apiKey, connected: stored.connected }
                : p;
            })
          );
        }

        // Update default model
        if (config.defaultModel) {
          this.defaultModelSignal.set(config.defaultModel);
        }
      } catch (error) {
        console.error('Failed to load AI configuration:', error);
      }
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfiguration(): void {
    const config = {
      providers: this.providersSignal().map(p => ({
        id: p.id,
        apiKey: p.apiKey,
        connected: p.connected
      })),
      defaultModel: this.defaultModelSignal()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }
}
