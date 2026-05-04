/**
 * AI Models
 * Shared interfaces for the AIService and related components.
 */

// Re-export ModelDefinition from the provider registry for convenience.
export type { ModelDefinition } from '../config/provider-registry';

/**
 * Options for an AI prompt request.
 */
export interface AIOptions {
  /** Model ID to use (overrides the provider's default). */
  model?: string;
  /** Sampling temperature (0–1). */
  temperature?: number;
  /** Maximum number of tokens to generate. */
  maxTokens?: number;
  /** Optional system prompt prepended to the conversation. */
  systemPrompt?: string;
}

/**
 * A single chunk emitted by the streaming observable returned by
 * `AIService.sendPrompt()`.
 */
export interface AIStreamChunk {
  /** Unique ID for the request this chunk belongs to. */
  requestId: string;
  /** Incremental text content for this chunk. */
  delta: string;
  /** True when the stream has finished (success or error). */
  isComplete: boolean;
  /** Set when the stream terminates due to an error. */
  error?: string;
}

/**
 * Persisted record of a completed AI response.
 */
export interface AIResponseData {
  /** Unique response ID. */
  id: string;
  /** The prompt that was sent. */
  prompt: string;
  /** The full accumulated response content. */
  content: string;
  /** Provider ID (generic string — not a union type). */
  providerId: string;
  /** Model ID used for this response. */
  model: string;
  /** When the response was received. */
  timestamp: Date;
  /** Total tokens consumed, if reported by the provider. */
  tokensUsed?: number;
  /** Error message if the request failed. */
  error?: string;
}
