import { Injectable } from '@angular/core';
import { SavedPrompt } from '../models';

const STORAGE_KEY = 'lore_prompts';

const BUILT_IN_PROMPTS: Omit<SavedPrompt, 'lastRunValues' | 'lastRunAt'>[] = [
  {
    id: 'builtin-research-summary',
    name: 'Tech Research Summary',
    category: 'Research',
    body: `Write a research summary on {{topic}}.

Structure it as follows:
- # Title heading
- ## Overview section (2-3 paragraphs)
- ## Key Use Cases (bullet list with bold labels)
- ## Pros vs Cons (markdown table with 3 rows each)
- ## Code Example if applicable
- ## Key Takeaway as a blockquote

Keep it informative and realistic. Use proper markdown formatting throughout.`,
    variables: ['topic'],
    defaultTarget: { shelfId: '', notebookId: '', sectionId: '' },
    isBuiltIn: true,
    createdAt: 0,
  },
  {
    id: 'builtin-weekly-stock',
    name: 'Weekly Stock Analysis',
    category: 'Finance',
    body: `Write a weekly stock analysis note for a portfolio containing {{holdings}}.

Structure:
- # Weekly Portfolio Review — {{week}}
- For each stock, a ## section with current price, week change, and 3 catalysts
- ## Summary Table — markdown table with columns: Stock | Price | Change | Outlook
- ## Action Items — numbered list of 4 portfolio decisions
- End with a blockquote: "Key risk this week"

Use realistic but fictional numbers. Format cleanly in markdown.`,
    variables: ['holdings', 'week'],
    defaultTarget: { shelfId: '', notebookId: '', sectionId: '' },
    isBuiltIn: true,
    createdAt: 0,
  },
  {
    id: 'builtin-portfolio-review',
    name: 'Portfolio Review',
    category: 'Finance',
    body: `Review my investment portfolio and provide insights.

Portfolio details:
{{portfolio}}

Please provide:
- ## Performance Summary
- ## Top Performers & Laggards
- ## Risk Assessment
- ## Rebalancing Suggestions
- ## Outlook for next quarter

Format as clean markdown with tables where appropriate.`,
    variables: ['portfolio'],
    defaultTarget: { shelfId: '', notebookId: '', sectionId: '' },
    isBuiltIn: true,
    createdAt: 0,
  },
  {
    id: 'builtin-monthly-budget',
    name: 'Monthly Budget Review',
    category: 'Finance',
    body: `Analyze my monthly budget and provide a financial health report.

Income and expenses:
{{details}}

Please provide:
- ## Income vs Expenses Summary
- ## Spending Breakdown by Category
- ## Savings Rate Analysis
- ## Areas to Optimize
- ## Next Month Goals

Use markdown formatting with a summary table.`,
    variables: ['details'],
    defaultTarget: { shelfId: '', notebookId: '', sectionId: '' },
    isBuiltIn: true,
    createdAt: 0,
  },
];

@Injectable({ providedIn: 'root' })
export class PromptService {
  private prompts: SavedPrompt[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.prompts = raw ? JSON.parse(raw) : [];
    } catch {
      this.prompts = [];
    }
    this.seedBuiltIns();
  }

  private seedBuiltIns(): void {
    let changed = false;
    for (const bp of BUILT_IN_PROMPTS) {
      if (!this.prompts.find(p => p.id === bp.id)) {
        this.prompts.push({ ...bp, lastRunValues: {}, lastRunAt: null });
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prompts));
  }

  getAll(): SavedPrompt[] {
    return [...this.prompts];
  }

  getById(id: string): SavedPrompt | undefined {
    return this.prompts.find(p => p.id === id);
  }

  save(prompt: SavedPrompt): void {
    const idx = this.prompts.findIndex(p => p.id === prompt.id);
    if (idx >= 0) {
      this.prompts[idx] = prompt;
    } else {
      this.prompts.push(prompt);
    }
    this.persist();
  }

  delete(id: string): void {
    const p = this.prompts.find(p => p.id === id);
    if (!p || p.isBuiltIn) return;
    this.prompts = this.prompts.filter(p => p.id !== id);
    this.persist();
  }

  duplicate(id: string): SavedPrompt | null {
    const original = this.getById(id);
    if (!original) return null;
    const copy: SavedPrompt = {
      ...original,
      id: `prompt-${Date.now()}`,
      name: `${original.name} (copy)`,
      isBuiltIn: false,
      lastRunValues: {},
      lastRunAt: null,
      createdAt: Date.now(),
    };
    this.prompts.push(copy);
    this.persist();
    return copy;
  }

  extractVariables(body: string): string[] {
    const matches = body.matchAll(/\{\{(\w+)\}\}/g);
    const seen = new Set<string>();
    const vars: string[] = [];
    for (const m of matches) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        vars.push(m[1]);
      }
    }
    return vars;
  }

  updateLastRunValues(id: string, values: Record<string, string>): void {
    const p = this.prompts.find(p => p.id === id);
    if (!p) return;
    p.lastRunValues = values;
    p.lastRunAt = Date.now();
    this.persist();
  }

  exportPrompt(id: string): void {
    const p = this.getById(id);
    if (!p) return;
    const { lastRunValues, defaultTarget, ...exportable } = p;
    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '-').toLowerCase()}.prompt.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importPrompt(json: unknown): SavedPrompt {
    const raw = json as Partial<SavedPrompt>;
    if (!raw.name || !raw.body) throw new Error('Invalid prompt file');

    let name = raw.name;
    const existing = this.prompts.map(p => p.name);
    let suffix = 1;
    while (existing.includes(name)) {
      name = `${raw.name} (${suffix++})`;
    }

    const prompt: SavedPrompt = {
      id: `prompt-${Date.now()}`,
      name,
      category: raw.category || 'General',
      body: raw.body,
      variables: raw.variables || this.extractVariables(raw.body),
      lastRunValues: {},
      defaultTarget: { shelfId: '', notebookId: '', sectionId: '' },
      lastRunAt: null,
      isBuiltIn: false,
      createdAt: Date.now(),
    };
    this.prompts.push(prompt);
    this.persist();
    return prompt;
  }

  loadFromArray(prompts: SavedPrompt[]): void {
    // Merge: keep built-ins, overwrite user prompts from Drive
    const builtIns = this.prompts.filter(p => p.isBuiltIn);
    const userPrompts = prompts.filter(p => !p.isBuiltIn);
    this.prompts = [...builtIns, ...userPrompts];
    this.persist();
  }
}
