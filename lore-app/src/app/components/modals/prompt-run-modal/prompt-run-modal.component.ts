import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavedPrompt, PromptSchedule, ScheduleFrequency } from '../../../models';
import { PromptService } from '../../../services/prompt.service';
import { DataService } from '../../../services/data.service';
import { LoreIconComponent } from '../../lore-icon/lore-icon.component';

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

  variables: string[] = [];
  values: Record<string, string> = {};

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
    }
  }

  isTextarea(varName: string): boolean {
    const longVars = ['holdings', 'portfolio', 'context', 'details', 'list', 'content', 'text'];
    return longVars.some(k => varName.toLowerCase().includes(k));
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
