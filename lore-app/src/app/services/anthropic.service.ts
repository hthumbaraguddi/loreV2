import { Injectable } from '@angular/core';
import { ChatMessage } from '../models';

@Injectable({ providedIn: 'root' })
export class AnthropicService {
  readonly API_KEY_STORAGE = 'lore_anthropic_key';
  readonly MODEL = 'claude-3-5-sonnet-20241022';
  private readonly API_URL = 'https://api.anthropic.com/v1/messages';

  getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE);
  }

  setApiKey(key: string): void {
    localStorage.setItem(this.API_KEY_STORAGE, key);
  }

  clearApiKey(): void {
    localStorage.removeItem(this.API_KEY_STORAGE);
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }

  async sendMessage(messages: ChatMessage[], onChunk: (text: string) => void): Promise<void> {
    const key = this.getApiKey();
    if (!key) throw new Error('NO_KEY');

    let response: Response;
    try {
      response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          max_tokens: 4096,
          stream: true,
          messages,
        }),
      });
    } catch {
      throw new Error('NETWORK_ERROR');
    }

    if (!response.ok) {
      if (response.status === 401) throw new Error('INVALID_KEY');
      if (response.status === 429) throw new Error('RATE_LIMITED');
      throw new Error('API_ERROR');
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
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              onChunk(parsed.delta.text);
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
