import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SECTION_COLORS } from '../../../models';
import { TemplateDefinition } from '../../../services/template.service';

/** Sample note data keyed by template id for preview */
const SAMPLE_DATA: Record<string, Record<string, any>> = {
  research: {
    title: 'LLM Hallucination in RAG Systems',
    domain: 'NLP / AI',
    status: 'ip',
    hypothesis: 'Retrieval-augmented generation reduces hallucination by grounding responses in retrieved context.',
    methodology: 'Compared GPT-4 outputs with and without RAG on 500 factual queries.',
    findings: ['RAG reduced hallucination rate by 38%', 'Chunk size of 512 tokens performed best', 'Re-ranking improved precision by 12%'],
    references: [{ text: 'Lewis et al. (2020) — RAG paper', url: 'https://arxiv.org/abs/2005.11401' }],
    conclusion: 'RAG is effective but chunk quality matters more than quantity.',
    tags: ['NLP', 'RAG', 'hallucination'],
  },
  finance: {
    title: 'March 2025 Budget',
    period: 'March 2025',
    income: [{ label: 'Salary', amount: 85000 }, { label: 'Freelance', amount: 12000 }],
    expenses: [{ label: 'Rent', amount: 22000 }, { label: 'Groceries', amount: 6500 }, { label: 'Subscriptions', amount: 1800 }],
    goal: 'Save ₹30,000 this month for emergency fund.',
    tags: ['budget', 'march'],
  },
  watchlist: {
    title: 'Weekend Watch List',
    mood: 'Chill',
    items: [
      { title: 'Oppenheimer', type: 'Movie', platform: 'Prime', rating: '5', seen: false },
      { title: 'Severance', type: 'Series', platform: 'Apple TV+', rating: '5', seen: true },
    ],
    pick: 'Start with Oppenheimer — it\'s a masterpiece.',
    tags: ['movies', 'weekend'],
  },
  journal: {
    title: 'Morning Reflection',
    date: '2025-03-17',
    mood: '😊 Good',
    energy: 4,
    gratitude: ['Had a great coffee this morning', 'Finished the feature I was stuck on', 'Sunny weather'],
    highlight: 'Shipped the new template preview feature.',
    reflection: 'Need to focus more on deep work blocks in the afternoon.',
    tags: ['daily', 'reflection'],
  },
  scrum: {
    title: 'Sprint 12 Standup',
    sprint: 'Sprint 12',
    date: '2025-03-17',
    done: ['Completed template browser redesign', 'Fixed font size bug'],
    today: ['Add preview panel to template modal', 'Write unit tests'],
    blockers: ['Waiting for design review on settings panel'],
    actions: [{ task: 'Review PR #42', owner: '@alex' }],
    tags: ['standup', 'sprint-12'],
  },
  investing: {
    title: 'Q1 2025 Market Review',
    date: '2025-03-17',
    sentiment: 'bull',
    watchlist: [{ ticker: 'NVDA', price: '$875', direction: 'up', thesis: 'AI infrastructure demand' }],
    trades: [{ ticker: 'AAPL', action: 'BUY', price: '$172', qty: '10', reason: 'Dip buy near support' }],
    thesis: 'Tech sector remains strong driven by AI capex cycle.',
    tags: ['investing', 'Q1'],
  },
};

@Component({
  selector: 'app-template-browser-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-browser-modal.component.html',
  styleUrls: ['./template-browser-modal.component.scss']
})
export class TemplateBrowserModalComponent {
  @Input() templates: TemplateDefinition[] = [];
  @Output() selected = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() buildTemplate = new EventEmitter<void>();
  @Output() importTemplate = new EventEmitter<void>();

  readonly colors = SECTION_COLORS;

  selectedId: string | null = null;
  previewHtml: SafeHtml | null = null;
  previewTitle = '';
  previewName = '';
  previewIcon = '';

  constructor(private sanitizer: DomSanitizer) {}

  getColor(colorKey: string) {
    return this.colors[colorKey] || this.colors['gray'];
  }

  onPreview(tpl: TemplateDefinition): void {
    this.selectedId = tpl.id;
    this.previewTitle = SAMPLE_DATA[tpl.id]?.['title'] || 'Sample Note';
    this.previewName = tpl.name;
    this.previewIcon = tpl.icon;

    const color = this.getColor(tpl.color);
    const sampleNote = {
      id: 'preview',
      title: this.previewTitle,
      templateId: tpl.id,
      data: SAMPLE_DATA[tpl.id] || { title: 'Sample Note' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    const html = tpl.renderCard(sampleNote, color, (t: string) => t);
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  clearPreview(): void {
    this.previewHtml = null;
    this.selectedId = null;
  }

  select(templateId: string): void {
    this.selected.emit(templateId);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onBuildTemplate(): void {
    this.buildTemplate.emit();
  }

  onImportTemplate(): void {
    this.importTemplate.emit();
  }
}
