import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PROVIDER_MAP } from '../config/provider-registry';
import { ModelDefinition } from '../config/provider-registry';
import { AIOptions, AIStreamChunk } from '../models/ai.model';
import { ApiKeyManagerService } from './api-key-manager.service';

// ============================================================================
// Internal adapter interface
// ============================================================================

/**
 * ProviderAdapter encapsulates the wire-format differences between AI providers.
 * Each provider has its own concrete adapter; the rest of AIService is
 * provider-agnostic and dispatches via PROVIDER_MAP.
 */
interface ProviderAdapter {
  /** Build the HTTP request headers for this provider. */
  buildHeaders(apiKey: string): Record<string, string>;

  /**
   * Build the JSON request body for this provider.
   * Returns `unknown` so callers must JSON.stringify it.
   */
  buildRequestBody(prompt: string, model: string, options: AIOptions): unknown;

  /**
   * Parse a single SSE line and return the incremental text delta,
   * or `null` if the line carries no content (e.g. event type lines,
   * empty lines, comment lines).
   */
  parseStreamChunk(line: string): string | null;

  /** Return true when the SSE stream signals completion. */
  isStreamDone(line: string): boolean;

  /**
   * Build the full request URL for this provider.
   * Most providers use `apiBaseUrl + path`; Google appends query params.
   */
  buildUrl(apiBaseUrl: string, model: string, apiKey: string): string;
}

// ============================================================================
// Concrete adapters
// ============================================================================

const anthropicAdapter: ProviderAdapter = {
  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
  },

  buildRequestBody(prompt: string, model: string, options: AIOptions): unknown {
    return {
      model,
      max_tokens: options.maxTokens ?? 1024,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    };
  },

  parseStreamChunk(line: string): string | null {
    // Anthropic SSE lines look like:
    //   data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}
    if (!line.startsWith('data:')) {
      return null;
    }
    const jsonStr = line.slice('data:'.length).trim();
    if (!jsonStr) {
      return null;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (
        parsed.type === 'content_block_delta' &&
        parsed.delta?.type === 'text_delta' &&
        typeof parsed.delta.text === 'string'
      ) {
        return parsed.delta.text;
      }
    } catch {
      // Malformed JSON — ignore
    }
    return null;
  },

  isStreamDone(line: string): boolean {
    // Anthropic signals completion with:
    //   event: message_stop
    return line.trim() === 'event: message_stop' || line.includes('"type":"message_stop"');
  },

  buildUrl(apiBaseUrl: string, _model: string, _apiKey: string): string {
    return `${apiBaseUrl}/messages`;
  },
};

// ----------------------------------------------------------------------------

const openaiAdapter: ProviderAdapter = {
  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    };
  },

  buildRequestBody(prompt: string, model: string, options: AIOptions): unknown {
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return {
      model,
      messages,
      stream: true,
      ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    };
  },

  parseStreamChunk(line: string): string | null {
    // OpenAI SSE lines look like:
    //   data: {"choices":[{"delta":{"content":"Hello"}}]}
    if (!line.startsWith('data:')) {
      return null;
    }
    const jsonStr = line.slice('data:'.length).trim();
    if (!jsonStr || jsonStr === '[DONE]') {
      return null;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed?.choices?.[0]?.delta?.content;
      if (typeof content === 'string') {
        return content;
      }
    } catch {
      // Malformed JSON — ignore
    }
    return null;
  },

  isStreamDone(line: string): boolean {
    return line.trim() === 'data: [DONE]';
  },

  buildUrl(apiBaseUrl: string, _model: string, _apiKey: string): string {
    return `${apiBaseUrl}/chat/completions`;
  },
};

// ----------------------------------------------------------------------------

const googleAdapter: ProviderAdapter = {
  buildHeaders(_apiKey: string): Record<string, string> {
    return {
      'content-type': 'application/json',
    };
  },

  buildRequestBody(prompt: string, _model: string, options: AIOptions): unknown {
    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    if (options.systemPrompt) {
      body['systemInstruction'] = { parts: [{ text: options.systemPrompt }] };
    }
    if (options.temperature !== undefined || options.maxTokens !== undefined) {
      const generationConfig: Record<string, unknown> = {};
      if (options.temperature !== undefined) {
        generationConfig['temperature'] = options.temperature;
      }
      if (options.maxTokens !== undefined) {
        generationConfig['maxOutputTokens'] = options.maxTokens;
      }
      body['generationConfig'] = generationConfig;
    }
    return body;
  },

  parseStreamChunk(line: string): string | null {
    // Google SSE lines look like:
    //   data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}
    if (!line.startsWith('data:')) {
      return null;
    }
    const jsonStr = line.slice('data:'.length).trim();
    if (!jsonStr) {
      return null;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') {
        return text;
      }
    } catch {
      // Malformed JSON — ignore
    }
    return null;
  },

  isStreamDone(_line: string): boolean {
    // Google's SSE stream closes naturally; no explicit done sentinel.
    return false;
  },

  buildUrl(apiBaseUrl: string, model: string, apiKey: string): string {
    return `${apiBaseUrl}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  },
};

// ----------------------------------------------------------------------------
// Groq — OpenAI-compatible API, same wire format as OpenAI
// ----------------------------------------------------------------------------

const groqAdapter: ProviderAdapter = {
  buildHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    };
  },

  buildRequestBody(prompt: string, model: string, options: AIOptions): unknown {
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return {
      model,
      messages,
      stream: true,
      ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    };
  },

  parseStreamChunk(line: string): string | null {
    // Groq uses the same SSE format as OpenAI
    if (!line.startsWith('data:')) {
      return null;
    }
    const jsonStr = line.slice('data:'.length).trim();
    if (!jsonStr || jsonStr === '[DONE]') {
      return null;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      const content = parsed?.choices?.[0]?.delta?.content;
      if (typeof content === 'string') {
        return content;
      }
    } catch {
      // Malformed JSON — ignore
    }
    return null;
  },

  isStreamDone(line: string): boolean {
    return line.trim() === 'data: [DONE]';
  },

  buildUrl(apiBaseUrl: string, _model: string, _apiKey: string): string {
    return `${apiBaseUrl}/chat/completions`;
  },
};

// ============================================================================
// Adapter dispatch map — keyed by provider ID
// ============================================================================

const ADAPTER_MAP = new Map<string, ProviderAdapter>([
  ['anthropic', anthropicAdapter],
  ['openai',    openaiAdapter],
  ['google',    googleAdapter],
  ['groq',      groqAdapter],
]);

// ============================================================================
// AIService
// ============================================================================

/**
 * AIService
 *
 * Sends prompts to AI provider APIs and returns streaming observables.
 * All provider-specific logic is encapsulated in ProviderAdapter instances;
 * this service is fully provider-agnostic — no `if (provider === 'claude')`
 * branches exist here.
 *
 * Streaming is implemented via the Fetch API + ReadableStream, wrapped in an
 * Observable. Angular HttpClient does not natively support SSE streaming, so
 * the Fetch API is used for the actual HTTP call.
 *
 * Exponential backoff: delay = Math.min(1000 * 2^attempt, 30000), max 3 retries.
 */
@Injectable({
  providedIn: 'root'
})
export class AIService {

  /** Active AbortControllers keyed by requestId. */
  private readonly _activeRequests = new Map<string, AbortController>();

  /** Maximum number of retry attempts on network errors. */
  private readonly MAX_RETRIES = 3;

  constructor(private readonly keyManager: ApiKeyManagerService) {}

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Send a prompt to the specified provider and return a streaming observable
   * of `AIStreamChunk` values. The observable completes after emitting a chunk
   * with `isComplete: true`.
   *
   * @param providerId  Registry provider ID (e.g. 'anthropic', 'openai', 'google')
   * @param prompt      The user prompt text
   * @param options     Optional model/temperature/maxTokens/systemPrompt overrides
   */
  sendPrompt(
    providerId: string,
    prompt: string,
    options: AIOptions = {}
  ): Observable<AIStreamChunk> {
    const requestId = crypto.randomUUID();

    return new Observable<AIStreamChunk>(subscriber => {
      // Kick off the async streaming pipeline.
      this._streamPrompt(requestId, providerId, prompt, options, subscriber);

      // Teardown: cancel the request if the subscriber unsubscribes.
      return () => {
        this.cancelRequest(requestId);
      };
    });
  }

  /**
   * Cancel an in-flight request by its request ID.
   * Calls `abort()` on the underlying AbortController.
   */
  cancelRequest(requestId: string): void {
    const controller = this._activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this._activeRequests.delete(requestId);
    }
  }

  /**
   * Return the available models for the given provider from the registry.
   * Returns an empty array for unknown provider IDs.
   */
  getModels(providerId: string): ModelDefinition[] {
    return PROVIDER_MAP.get(providerId)?.availableModels ?? [];
  }

  /**
   * Test the connection for a provider by sending a minimal prompt.
   * Returns true if the API responds with a 2xx status, false otherwise.
   */
  async testConnection(providerId: string): Promise<boolean> {
    const providerDef = PROVIDER_MAP.get(providerId);
    const adapter = ADAPTER_MAP.get(providerId);

    if (!providerDef || !adapter) {
      return false;
    }

    const apiKey = await this.keyManager.getKey(providerId);
    if (!apiKey) {
      return false;
    }

    const model = providerDef.defaultModel;
    const url = adapter.buildUrl(providerDef.apiBaseUrl, model, apiKey);
    const headers = adapter.buildHeaders(apiKey);

    // Send a minimal non-streaming request — just enough to verify auth.
    // We build the body without stream:true so we get a quick JSON response.
    const testBody = this._buildTestBody(providerId, model, apiKey);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Build a minimal non-streaming test request body for each provider.
   */
  private _buildTestBody(providerId: string, model: string, _apiKey: string): unknown {
    switch (providerId) {
      case 'anthropic':
        return {
          model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
          stream: false,
        };
      case 'google':
        return {
          contents: [{ parts: [{ text: 'hi' }] }],
          generationConfig: { maxOutputTokens: 1 },
        };
      // openai + groq share the same format
      default:
        return {
          model,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
          stream: false,
        };
    }
  }

  // --------------------------------------------------------------------------
  // Private streaming implementation
  // --------------------------------------------------------------------------

  /**
   * Core streaming pipeline. Resolves the API key, builds the request,
   * streams the response, and emits chunks to the subscriber.
   * Retries on network errors with exponential backoff.
   */
  private async _streamPrompt(
    requestId: string,
    providerId: string,
    prompt: string,
    options: AIOptions,
    subscriber: {
      next: (chunk: AIStreamChunk) => void;
      error: (err: unknown) => void;
      complete: () => void;
    }
  ): Promise<void> {
    // --- Validate provider ---
    const providerDef = PROVIDER_MAP.get(providerId);
    if (!providerDef) {
      subscriber.next({
        requestId,
        delta: '',
        isComplete: true,
        error: `Unknown provider: "${providerId}"`,
      });
      subscriber.complete();
      return;
    }

    const adapter = ADAPTER_MAP.get(providerId);
    if (!adapter) {
      subscriber.next({
        requestId,
        delta: '',
        isComplete: true,
        error: `No adapter registered for provider: "${providerId}"`,
      });
      subscriber.complete();
      return;
    }

    // --- Resolve API key ---
    const apiKey = await this.keyManager.getKey(providerId);
    if (!apiKey) {
      subscriber.next({
        requestId,
        delta: '',
        isComplete: true,
        error: `No API key configured for provider "${providerId}"`,
      });
      subscriber.complete();
      return;
    }

    // --- Determine model ---
    const model = options.model ?? providerDef.defaultModel;

    // --- Build request ---
    const url = adapter.buildUrl(providerDef.apiBaseUrl, model, apiKey);
    const headers = adapter.buildHeaders(apiKey);
    const body = JSON.stringify(adapter.buildRequestBody(prompt, model, options));

    // --- Retry loop with exponential backoff ---
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        await this._sleep(delay);
      }

      const controller = new AbortController();
      this._activeRequests.set(requestId, controller);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}${errorText ? ` — ${errorText}` : ''}`
          );
        }

        if (!response.body) {
          throw new Error('Response body is null — streaming not supported');
        }

        // --- Stream the response ---
        await this._readStream(
          requestId,
          response.body,
          adapter,
          subscriber
        );

        // Stream completed successfully — clean up and return.
        this._activeRequests.delete(requestId);
        return;

      } catch (err: unknown) {
        this._activeRequests.delete(requestId);

        // If the request was aborted (cancelled by the caller), stop silently.
        if (err instanceof Error && err.name === 'AbortError') {
          subscriber.complete();
          return;
        }

        lastError = err;

        // On the last attempt, emit an error chunk.
        if (attempt === this.MAX_RETRIES) {
          break;
        }
        // Otherwise, retry.
      }
    }

    // All retries exhausted — emit error chunk.
    subscriber.next({
      requestId,
      delta: '',
      isComplete: true,
      error: `Request failed after ${this.MAX_RETRIES + 1} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    });
    subscriber.complete();
  }

  /**
   * Read a `ReadableStream<Uint8Array>` line by line and emit `AIStreamChunk`
   * values to the subscriber for each content delta.
   */
  private async _readStream(
    requestId: string,
    body: ReadableStream<Uint8Array>,
    adapter: ProviderAdapter,
    subscriber: {
      next: (chunk: AIStreamChunk) => void;
      complete: () => void;
    }
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffered content.
          if (buffer.trim()) {
            this._processLine(requestId, buffer.trim(), adapter, subscriber);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Split on newlines and process complete lines.
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer.
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (adapter.isStreamDone(line)) {
            // Emit the final completion chunk and stop reading.
            subscriber.next({ requestId, delta: '', isComplete: true });
            subscriber.complete();
            reader.cancel();
            return;
          }
          this._processLine(requestId, line, adapter, subscriber);
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Stream ended naturally (e.g. Google closes without a done sentinel).
    subscriber.next({ requestId, delta: '', isComplete: true });
    subscriber.complete();
  }

  /**
   * Parse a single SSE line via the adapter and emit a chunk if it carries
   * content.
   */
  private _processLine(
    requestId: string,
    line: string,
    adapter: ProviderAdapter,
    subscriber: { next: (chunk: AIStreamChunk) => void }
  ): void {
    const delta = adapter.parseStreamChunk(line);
    if (delta !== null) {
      subscriber.next({ requestId, delta, isComplete: false });
    }
  }

  /** Promise-based sleep helper for retry backoff. */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
