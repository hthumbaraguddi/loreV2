/**
 * Prompt Model
 * Represents a reusable AI prompt template with variables
 */

export interface PromptVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  label: string;
  defaultValue?: string | number;
  options?: string[]; // For select type
  required: boolean;
  placeholder?: string;
}

export interface PromptSchedule {
  enabled: boolean;
  cronExpression: string; // e.g., "0 9 * * 1" (Every Monday at 9 AM)
  nextRun?: Date;
  lastRun?: Date;
}

export interface PromptRun {
  id: string;
  promptId: string;
  timestamp: Date;
  status: 'success' | 'error' | 'cancelled';
  provider: string;
  model: string;
  input: Record<string, any>; // Variable values used
  output?: string; // AI response
  error?: string;
  tokensUsed?: number;
  duration?: number; // milliseconds
}

export interface Prompt {
  id: string;
  title: string;
  description?: string;
  template: string; // Prompt text with {{variable}} placeholders
  variables: PromptVariable[];
  provider: string; // Default provider (anthropic, openai, google, groq)
  model?: string; // Default model
  temperature?: number;
  maxTokens?: number;
  tags: string[];
  schedule?: PromptSchedule;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  useCount: number;
  isFavorite: boolean;
}

export interface PromptStats {
  totalPrompts: number;
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  totalTokensUsed: number;
  favoriteCount: number;
  scheduledCount: number;
}
