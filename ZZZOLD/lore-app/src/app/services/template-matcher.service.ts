import { Injectable, inject } from '@angular/core';
import { AnthropicService } from './anthropic.service';
import { TemplateService } from './template.service';

export interface MatchResult {
  templateId: string;
  score: number;       // keyword count, or 1.0 for AI match
  source: 'keyword' | 'ai';
}

/** Keyword sets for each built-in template. */
const KEYWORD_SETS: Record<string, string[]> = {
  finance: [
    'budget', 'revenue', 'expense', 'profit', 'loss', 'cash flow', 'invoice',
    'balance sheet', 'p&l', 'quarterly', 'fiscal', 'roi', 'ebitda',
  ],
  journal: [
    'today', 'mood', 'grateful', 'gratitude', 'reflection', 'intention',
    'energy', 'morning', 'evening', 'diary', 'feelings', 'mindset',
  ],
  research: [
    'hypothesis', 'methodology', 'findings', 'literature', 'abstract',
    'citation', 'conclusion', 'analysis', 'study', 'experiment', 'data',
  ],
  scrum: [
    'sprint', 'backlog', 'standup', 'velocity', 'story points', 'retrospective',
    'epic', 'user story', 'kanban', 'blocker', 'ticket',
  ],
  investing: [
    'portfolio', 'dividend', 'yield', 'stock', 'etf', 'allocation', 'rebalance',
    'compound', 'index fund', 'asset', 'equity', 'bond',
  ],
  watchlist: [
    'watch', 'rating', 'review', 'recommend', 'seen', 'episode', 'season',
    'genre', 'director', 'cast', 'score', 'imdb',
  ],
};

const VALID_TEMPLATE_IDS = ['finance', 'journal', 'research', 'scrum', 'investing', 'watchlist', 'page'];
const KEYWORD_THRESHOLD = 3;

@Injectable({ providedIn: 'root' })
export class TemplateMatcherService {
  private templateService = inject(TemplateService);
  private anthropicService = inject(AnthropicService);

  /** Entry point called after save. Returns null if no match. */
  async analyseContent(text: string): Promise<MatchResult | null> {
    if (this.isAiMatchingEnabled()) {
      return this.matchByAi(text);
    }
    return this.matchByKeywords(text);
  }

  /** Keyword-only path. */
  matchByKeywords(text: string): MatchResult | null {
    const lower = text.toLowerCase();
    let bestId: string | null = null;
    let bestScore = 0;

    for (const [templateId, keywords] of Object.entries(KEYWORD_SETS)) {
      const score = this.scoreKeywords(lower, keywords);
      if (score > bestScore) {
        bestScore = score;
        bestId = templateId;
      }
    }

    if (bestScore >= KEYWORD_THRESHOLD && bestId) {
      return { templateId: bestId, score: bestScore, source: 'keyword' };
    }
    return null;
  }

  /** Score how many keywords from the set appear in the lowercased text. */
  scoreKeywords(lowerText: string, keywords: string[]): number {
    let count = 0;
    for (const kw of keywords) {
      // Whole-word match for single-word keywords; substring match for multi-word phrases
      if (kw.includes(' ')) {
        if (lowerText.includes(kw.toLowerCase())) count++;
      } else {
        const pattern = new RegExp(`\\b${kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (pattern.test(lowerText)) count++;
      }
    }
    return count;
  }

  /** AI path. Falls back to keyword on error. */
  async matchByAi(text: string): Promise<MatchResult | null> {
    try {
      const prompt = this.buildAiPrompt(text);
      let fullResponse = '';

      await this.anthropicService.sendMessage(
        [{ role: 'user', content: prompt }],
        (chunk: string) => { fullResponse += chunk; },
      );

      const firstWord = fullResponse.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
      if (firstWord === 'null' || !firstWord) {
        return this.matchByKeywords(text);
      }
      if (VALID_TEMPLATE_IDS.includes(firstWord) && firstWord !== 'page') {
        return { templateId: firstWord, score: 1, source: 'ai' };
      }
      // AI returned 'page' or unknown — fall back to keyword
      return this.matchByKeywords(text);
    } catch (err) {
      console.warn('[TemplateMatcher] AI matching failed, falling back to keyword:', err);
      return this.matchByKeywords(text);
    }
  }

  /** Build the AI classification prompt. */
  buildAiPrompt(content: string): string {
    return `You are a note-categorisation assistant. Given the following note content, identify the single best-matching template from this list:
finance, journal, research, scrum, investing, watchlist, page

Reply with ONLY the template id (e.g. "journal") or "null" if none fits well.
Do not explain your answer.

Note content:
${content}`;
  }

  /** Returns true if AI matching is enabled in settings AND an API key is configured. */
  isAiMatchingEnabled(): boolean {
    const flag = localStorage.getItem('lore_smart_notes_ai_matching') === 'true';
    return flag && !!this.anthropicService.getApiKey();
  }

  /** Returns true if auto-apply is enabled in settings. */
  isAutoApplyEnabled(): boolean {
    return localStorage.getItem('lore_smart_notes_auto_apply') === 'true';
  }
}
