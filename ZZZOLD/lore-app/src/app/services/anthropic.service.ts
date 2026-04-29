import { Injectable } from '@angular/core';
import { ChatMessage } from '../models';

export interface AiProvider {
  id: string;
  name: string;
  label: string;
  free: boolean;
  url: string;
  keyPlaceholder: string;
  defaultEndpoint: string;
  supportsCustomEndpoint: boolean;
  note?: string;
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (Official)',
    label: 'Claude 3.5 Sonnet',
    free: false,
    url: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-…',
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    supportsCustomEndpoint: false,
    note: 'Paid — $5 free credit on signup',
  },
  {
    id: 'clod',
    name: 'Clod.io',
    label: 'OpenAI-compatible · Free tier',
    free: true,
    url: 'https://app.clod.io/',
    keyPlaceholder: 'Paste your Clod.io API key',
    defaultEndpoint: typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? '/clod-proxy/v1/chat/completions'
      : 'https://api.clod.io/v1/chat/completions',
    supportsCustomEndpoint: true,
    note: 'Free tier available — OpenAI-compatible API',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    label: 'Multi-model · Free models available',
    free: true,
    url: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-…',
    defaultEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    supportsCustomEndpoint: false,
    note: 'Free models like Llama, Mistral, Gemma',
  },
  {
    id: 'groq',
    name: 'Groq',
    label: 'Ultra-fast inference · Free tier',
    free: true,
    url: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_…',
    defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    supportsCustomEndpoint: false,
    note: 'Free tier — Llama 3, Mixtral, Gemma',
  },
  {
    id: 'together',
    name: 'Together AI',
    label: 'Open-source models · $1 free credit',
    free: true,
    url: 'https://api.together.xyz/settings/api-keys',
    keyPlaceholder: 'Paste your Together AI key',
    defaultEndpoint: 'https://api.together.xyz/v1/chat/completions',
    supportsCustomEndpoint: false,
    note: '$1 free credit on signup',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    label: 'Gemini 2.0 Flash · Free tier',
    free: true,
    url: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza…',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent',
    supportsCustomEndpoint: false,
    note: 'Free tier via Google AI Studio — generous limits',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    label: 'Any OpenAI-compatible API',
    free: false,
    url: '',
    keyPlaceholder: 'Your API key',
    defaultEndpoint: '',
    supportsCustomEndpoint: true,
    note: 'Bring your own OpenAI-compatible endpoint',
  },
];

@Injectable({ providedIn: 'root' })
export class AnthropicService {
  readonly API_KEY_STORAGE = 'lore_anthropic_key';
  readonly ENDPOINT_STORAGE = 'lore_ai_endpoint';
  readonly PROVIDER_STORAGE = 'lore_ai_provider';
  readonly MODEL_STORAGE = 'lore_ai_model';
  readonly MODEL = 'claude-3-5-sonnet-20241022';

  private get apiUrl(): string {
    return localStorage.getItem(this.ENDPOINT_STORAGE) || 'https://api.anthropic.com/v1/messages';
  }

  getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE);
  }

  setApiKey(key: string): void {
    localStorage.setItem(this.API_KEY_STORAGE, key);
  }

  clearApiKey(): void {
    localStorage.removeItem(this.API_KEY_STORAGE);
  }

  getEndpoint(): string {
    return localStorage.getItem(this.ENDPOINT_STORAGE) || 'https://api.anthropic.com/v1/messages';
  }

  setEndpoint(url: string): void {
    if (url.trim()) {
      localStorage.setItem(this.ENDPOINT_STORAGE, url.trim());
    } else {
      localStorage.removeItem(this.ENDPOINT_STORAGE);
    }
  }

  getProviderId(): string {
    return localStorage.getItem(this.PROVIDER_STORAGE) || 'anthropic';
  }

  setProviderId(id: string): void {
    localStorage.setItem(this.PROVIDER_STORAGE, id);
  }

  getModel(): string {
    return localStorage.getItem(this.MODEL_STORAGE) || '';
  }

  setModel(model: string): void {
    if (model.trim()) {
      localStorage.setItem(this.MODEL_STORAGE, model.trim());
    } else {
      localStorage.removeItem(this.MODEL_STORAGE);
    }
  }

  /** Fetch available models from the provider's /models endpoint. Returns [] on failure. */
  async fetchModels(key: string, providerId: string, endpoint?: string): Promise<string[]> {
    try {
      if (providerId === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        return (json.models ?? [])
          .map((m: any) => m.name?.replace('models/', '') ?? '')
          .filter((n: string) => n.includes('gemini') && n.includes('flash') || n.includes('pro'))
          .sort();
      }
      if (providerId === 'anthropic') {
        // Anthropic doesn't have a public /models list endpoint — return known models
        return [
          'claude-opus-4-5',
          'claude-sonnet-4-5',
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-haiku-20240307',
        ];
      }
      // OpenAI-compatible providers: GET /models
      const base = endpoint
        ? endpoint.replace(/\/chat\/completions$/, '')
        : this.getEndpoint().replace(/\/chat\/completions$/, '');
      const modelsUrl = `${base}/models`;
      const res = await fetch(modelsUrl, {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (!res.ok) return [];
      const json = await res.json();
      const models: string[] = (json.data ?? json.models ?? [])
        .map((m: any) => m.id ?? m.name ?? '')
        .filter(Boolean)
        .sort();
      return models;
    } catch {
      return [];
    }
  }

  private buildHeaders(key: string, providerId: string): Record<string, string> {
    const base: Record<string, string> = { 'content-type': 'application/json' };
    if (providerId === 'anthropic') {
      return {
        ...base,
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    }
    // OpenAI-compatible (clod, OpenRouter, Groq, Together, custom)
    return { ...base, 'Authorization': `Bearer ${key}` };
  }

  private buildBody(messages: ChatMessage[], providerId: string, stream: boolean): object {
    if (providerId === 'anthropic') {
      const model = this.getModel() || this.MODEL;
      return { model, max_tokens: stream ? 4096 : 1, stream, messages };
    }
    if (providerId === 'gemini') {
      return {};
    }
    // OpenAI-compatible format — use stored model or sensible defaults
    const defaultModel = providerId === 'groq' ? 'llama-3.3-70b-versatile'
      : providerId === 'together' ? 'meta-llama/Llama-3-70b-chat-hf'
      : providerId === 'openrouter' ? 'meta-llama/llama-3.1-8b-instruct:free'
      : providerId === 'clod' ? 'DeepSeek V3'
      : 'gpt-3.5-turbo';
    const model = this.getModel() || defaultModel;
    return {
      model,
      max_tokens: stream ? 4096 : 1,
      stream,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    };
  }

  private buildGeminiBody(messages: ChatMessage[]): object {
    return {
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 4096 },
    };
  }

  async validateApiKey(key: string, providerId?: string, endpoint?: string): Promise<boolean> {
    const pid = providerId || this.getProviderId();
    const url = endpoint || this.apiUrl;
    try {
      if (pid === 'gemini') {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 1 } }),
        });
        if (!response.ok && response.status !== 400) {
          const body = await response.text().catch(() => '');
          console.warn(`[AI validate] Gemini ${response.status}:`, body);
        }
        return response.ok || response.status === 400;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(key, pid),
        body: JSON.stringify(this.buildBody([{ role: 'user', content: 'hi' }], pid, false)),
      });
      if (!response.ok && response.status !== 400 && response.status !== 422) {
        const body = await response.text().catch(() => '');
        console.warn(`[AI validate] ${pid} ${response.status}:`, body);
      }
      return response.ok || response.status === 400 || response.status === 422;
    } catch (e) {
      console.warn('[AI validate] fetch error:', e);
      return false;
    }
  }

  async sendMessage(messages: ChatMessage[], onChunk: (text: string) => void): Promise<void> {
    const key = this.getApiKey();
    if (!key) throw new Error('NO_KEY');

    const pid = this.getProviderId();

    // ── Gemini path ──────────────────────────────────────────────────────────
    if (pid === 'gemini') {
      const geminiModel = this.getModel() || 'gemini-2.0-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${key}`;
      let response: Response;
      try {
        response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(this.buildGeminiBody(messages)),
        });
      } catch {
        throw new Error('NETWORK_ERROR');
      }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('INVALID_KEY');
        if (response.status === 429) throw new Error('RATE_LIMITED');
        const body = await response.text().catch(() => '');
        console.error(`[AI sendMessage] gemini HTTP ${response.status}:`, body);
        throw new Error(`API_ERROR:${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('STREAM_ERROR');
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) onChunk(text);
            } catch { /* skip */ }
          }
        }
      } catch {
        throw new Error('STREAM_INTERRUPTED');
      }
      return;
    }

    // ── Anthropic / OpenAI-compatible path ───────────────────────────────────
    const isAnthropicStyle = pid === 'anthropic';

    let response: Response;
    try {
      response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.buildHeaders(key, pid),
        body: JSON.stringify(this.buildBody(messages, pid, true)),
      });
    } catch {
      throw new Error('NETWORK_ERROR');
    }

    if (!response.ok) {
      if (response.status === 401) throw new Error('INVALID_KEY');
      if (response.status === 429) throw new Error('RATE_LIMITED');
      const body = await response.text().catch(() => '');
      console.error(`[AI sendMessage] ${pid} HTTP ${response.status}:`, body);
      throw new Error(`API_ERROR:${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('STREAM_ERROR');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (isAnthropicStyle) {
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                onChunk(parsed.delta.text);
              }
            } else {
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) onChunk(delta);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      throw new Error('STREAM_INTERRUPTED');
    }
  }
}
