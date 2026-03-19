import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavedPrompt } from '../../../models';
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prompt'] && this.prompt) {
      this.variables = this.promptService.extractVariables(this.prompt.body);
      this.values = {};
      for (const v of this.variables) {
        this.values[v] = this.prompt.lastRunValues?.[v] || '';
      }
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

  close(): void {
    this.closed.emit();
  }
}
