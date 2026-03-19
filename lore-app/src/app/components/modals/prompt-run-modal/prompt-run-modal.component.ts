import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SavedPrompt, PromptSchedule, ScheduleFrequency } from '../../../models';
import { PromptService } from '../../../services/prompt.service';
import { DataService } from '../../../services/data.service';
import { AnthropicService } from '../../../services/anthropic.service';
import { LoreIconComponent } from '../../lore-icon/lore-icon.component';
import { marked } from 'marked';

@Component({
  selector: 'app-prompt-run-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent],
  templateUrl: './prompt-run-modal.component.html',
  styleUrls: ['./prompt-run-modal.component.scss'],
})
export class PromptRunModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() prompt: SavedPrompt | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() sendToChat = new EventEmitter<string>();

  private promptService = inject(PromptService);
  private data = inject(DataService);
  private ai = inject(AnthropicService);
  private sanitizer = inject(DomSanitizer);

  variables: string[] = [];
  values: Record<string, string> = {};

  // AI run state
  isRunning = false;
  aiResult = '';
  aiError = '';
  showPreview = false;

  // Save-as-note state
  showSavePicker = false;
  saveNotebookId = '';
  saveSectionId = '';
  noteSaved = false;

  // Schedule state
  showSchedule = false;
  schedFrequency: ScheduleFrequency | '' = '';
  schedSectionId = '';
  schedHour = '08';
  schedMinute = '00';
  schedSaved = false;

  readonly hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  readonly minutes = ['00', '15', '30', '45'];

  get notebooks() { return this.data.getState().notebooks; }
  get sections() {
    return this.notebooks.flatMap(nb =>
      nb.sections.map(sec => ({ id: sec.id, label: `${nb.name} › ${sec.title}`, notebookId: nb.id }))
    );
  }

  get hasApiKey(): boolean {
    return !!this.ai.getApiKey();
  }

  get aiResultHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(marked.parse(this.aiResult) as string);
  }

  get sectionsForSave() {
    return this.notebooks.flatMap(nb =>
      nb.sections.map(sec => ({ id: sec.id, label: `${nb.name} › ${sec.title}`, notebookId: nb.id }))
    );
  }

  get canSend(): boolean {
    return this.variables.every(v => (this.values[v] || '').trim().length > 0);
  }

  get assembledPrompt(): string {
    if (!this.prompt) return '';
    let body = this.prompt.body;
    for (const v of this.variables) {
      body = body.replaceAll(`{{${v}}}`, this.values[v] || '');
    }
    return body;
  }

  get canSaveSchedule(): boolean {
    return !!this.schedFrequency && !!this.schedSectionId;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prompt'] && this.prompt) {
      this.variables = this.promptService.extractVariables(this.prompt.body);
      this.values = {};
      for (const v of this.variables) {
        this.values[v] = this.prompt.lastRunValues?.[v] || '';
      }
      // Load existing schedule if any
      const sched = this.prompt.schedule;
      this.schedFrequency = sched?.frequency || '';
      this.schedSectionId = sched?.targetSectionId || '';
      const [hh, mm] = (sched?.scheduleTime || '08:00').split(':');
      this.schedHour = hh || '08';
      this.schedMinute = mm || '00';
      this.showSchedule = !!sched?.frequency;
      this.schedSaved = false;
      // Reset AI state
      this.aiResult = '';
      this.aiError = '';
      this.showPreview = false;
      this.showSavePicker = false;
      this.noteSaved = false;
      this.isRunning = false;
    }
  }

  isTextarea(varName: string): boolean {
    const longVars = ['holdings', 'portfolio', 'context', 'details', 'list', 'content', 'text'];
    return longVars.some(k => varName.toLowerCase().includes(k));
  }

  async onRunWithAi(): Promise<void> {
    if (!this.canSend || this.isRunning) return;
    if (this.prompt) {
      this.promptService.updateLastRunValues(this.prompt.id, { ...this.values });
    }
    this.isRunning = true;
    this.aiResult = '';
    this.aiError = '';
    this.showPreview = true;
    this.showSavePicker = false;
    this.noteSaved = false;
    try {
      await this.ai.sendMessage(
        [{ role: 'user', content: this.assembledPrompt }],
        (chunk) => { this.aiResult += chunk; }
      );
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg === 'NO_KEY') this.aiError = 'No API key configured. Add one in Settings.';
      else if (msg === 'INVALID_KEY') this.aiError = 'Invalid API key. Check your key in Settings.';
      else if (msg === 'RATE_LIMITED') this.aiError = 'Rate limited. Try again in a moment.';
      else this.aiError = 'Something went wrong. Please try again.';
    } finally {
      this.isRunning = false;
    }
  }

  onSaveAsNote(): void {
    if (!this.aiResult.trim()) return;
    this.showSavePicker = true;
  }

  onConfirmSave(): void {
    if (!this.saveSectionId || !this.aiResult.trim() || !this.prompt) return;
    const date = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const title = `${this.prompt.name} — ${date}`;
    this.data.addNoteToSection(this.saveSectionId, title, 'rich', {
      markdown: this.aiResult,
      promptId: this.prompt.id,
      promptVariables: { ...this.values },
    });
    this.promptService.updateLastRunValues(this.prompt.id, { ...this.values });
    this.noteSaved = true;
    this.showSavePicker = false;
    this.data.showToast(`✓ Saved as "${title}"`);
  }

  onSendToChat(): void {
    if (!this.canSend) return;
    if (this.prompt) {
      this.promptService.updateLastRunValues(this.prompt.id, { ...this.values });
    }
    this.sendToChat.emit(this.assembledPrompt);
  }

  onCopyPrompt(): void {
    navigator.clipboard.writeText(this.assembledPrompt).then(() => {
      this.data.showToast('Prompt copied to clipboard');
    });
  }

  onSaveSchedule(): void {
    if (!this.prompt || !this.canSaveSchedule) return;
    const sec = this.sections.find(s => s.id === this.schedSectionId);
    const schedule: PromptSchedule = {
      frequency: this.schedFrequency as ScheduleFrequency,
      targetSectionId: this.schedSectionId,
      targetNotebookId: sec?.notebookId || '',
      scheduleTime: `${this.schedHour}:${this.schedMinute}`,
      lastScheduledRunAt: this.prompt.schedule?.lastScheduledRunAt ?? null,
    };
    this.promptService.save({ ...this.prompt, schedule });
    this.schedSaved = true;
    this.data.showToast(`✓ Schedule saved — runs ${this.schedFrequency}`);
  }

  onClearSchedule(): void {
    if (!this.prompt) return;
    this.promptService.save({ ...this.prompt, schedule: null });
    this.schedFrequency = '';
    this.schedSectionId = '';
    this.schedSaved = false;
    this.showSchedule = false;
    this.data.showToast('Schedule removed');
  }

  close(): void {
    this.closed.emit();
  }
}
