import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Prompt, PromptVariable } from '../../../core/models/prompt.model';
import { PromptService } from '../../../core/services/prompt.service';
import { SchedulerService } from '../../../core/services/scheduler.service';

/**
 * PromptEditorComponent
 * Modal component for creating and editing prompt templates
 */
@Component({
  selector: 'lore-prompt-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-editor.component.html',
  styleUrls: ['./prompt-editor.component.scss']
})
export class PromptEditorComponent implements OnInit {
  @Input() prompt: Prompt | null = null;
  @Output() save = new EventEmitter<Prompt>();
  @Output() cancel = new EventEmitter<void>();

  // Form signals
  title = signal('');
  description = signal('');
  template = signal('');
  provider = signal('anthropic');
  model = signal('claude-3-5-sonnet-20241022');
  temperature = signal(0.7);
  maxTokens = signal(1024);
  tags = signal<string[]>([]);
  tagInput = signal('');
  variables = signal<PromptVariable[]>([]);
  
  // New fields for mock design
  categories = signal<string[]>([]);
  outputType = signal<'note' | 'html' | 'notification'>('note');
  saveToNotebook = signal('');
  
  // Schedule signals
  scheduleEnabled = signal(false);
  cronFrequency = signal('weekly');
  cronTime = signal('08:00');
  cronDays = signal<boolean[]>([true, false, false, false, false, false, false]); // Mon-Sun
  cronExpression = signal('0 9 * * 1-5');
  cronPreset = signal('');
  
  // UI state - removed tabs, using two-column layout
  showVariableForm = signal(false);
  editingVariableIndex = signal<number | null>(null);
  
  // Variable form
  varName = signal('');
  varType = signal<'text' | 'number' | 'date' | 'select'>('text');
  varLabel = signal('');
  varPlaceholder = signal('');
  varRequired = signal(true);
  varDefaultValue = signal('');
  varOptions = signal('');
  
  // Validation
  errors = signal<string[]>([]);
  cronValidation = computed(() => {
    const expr = this.cronExpression();
    if (!expr) return { valid: false, error: 'Cron expression required' };
    return this.schedulerService.validateCronExpression(expr);
  });
  
  cronDescription = computed(() => {
    const expr = this.cronExpression();
    if (!expr) return '';
    return this.schedulerService.describeCronExpression(expr);
  });

  // Providers and models
  providers = [
    { id: 'anthropic', name: 'Anthropic (Claude)', color: '#D97757' },
    { id: 'openai', name: 'OpenAI (GPT)', color: '#10A37F' },
    { id: 'google', name: 'Google (Gemini)', color: '#4285F4' },
    { id: 'groq', name: 'Groq (Llama)', color: '#F55036' }
  ];

  models: Record<string, string[]> = {
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    openai: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
    google: ['gemini-pro', 'gemini-pro-vision'],
    groq: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768']
  };

  variableTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (dropdown)' }
  ];

  constructor(
    private promptService: PromptService,
    private schedulerService: SchedulerService
  ) {}

  ngOnInit(): void {
    if (this.prompt) {
      this.loadPrompt(this.prompt);
    }
  }

  /**
   * Load existing prompt into form
   */
  private loadPrompt(prompt: Prompt): void {
    this.title.set(prompt.title);
    this.description.set(prompt.description || '');
    this.template.set(prompt.template);
    this.provider.set(prompt.provider);
    this.model.set(prompt.model || this.models[prompt.provider][0]);
    this.temperature.set(prompt.temperature || 0.7);
    this.maxTokens.set(prompt.maxTokens || 1024);
    this.tags.set([...prompt.tags]);
    this.variables.set([...prompt.variables]);
    
    if (prompt.schedule) {
      this.scheduleEnabled.set(prompt.schedule.enabled);
      this.cronExpression.set(prompt.schedule.cronExpression);
    }
  }

  /**
   * Validate form
   */
  private validate(): boolean {
    const errors: string[] = [];
    
    if (!this.title().trim()) {
      errors.push('Title is required');
    }
    
    if (!this.template().trim()) {
      errors.push('Template is required');
    }
    
    // Check for undefined variables in template
    const templateVars = this.extractVariablesFromTemplate(this.template());
    const definedVars = new Set(this.variables().map(v => v.name));
    const undefinedVars = templateVars.filter(v => !definedVars.has(v));
    
    if (undefinedVars.length > 0) {
      errors.push(`Undefined variables in template: ${undefinedVars.join(', ')}`);
    }
    
    // Validate schedule if enabled
    if (this.scheduleEnabled()) {
      const cronValid = this.cronValidation();
      if (!cronValid.valid) {
        errors.push(`Invalid cron expression: ${cronValid.error}`);
      }
    }
    
    this.errors.set(errors);
    return errors.length === 0;
  }

  /**
   * Extract variable names from template
   */
  private extractVariablesFromTemplate(template: string): string[] {
    const regex = /\{\{(\s*\w+\s*)\}\}/g;
    const matches = template.matchAll(regex);
    const vars = new Set<string>();
    
    for (const match of matches) {
      vars.add(match[1].trim());
    }
    
    return Array.from(vars);
  }

  /**
   * Save prompt
   */
  onSave(): void {
    if (!this.validate()) {
      return;
    }
    
    const promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'useCount'> = {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      template: this.template().trim(),
      variables: this.variables(),
      provider: this.provider(),
      model: this.model(),
      temperature: this.temperature(),
      maxTokens: this.maxTokens(),
      tags: this.tags(),
      isFavorite: this.prompt?.isFavorite || false,
      lastUsed: this.prompt?.lastUsed,
      schedule: this.scheduleEnabled() ? {
        enabled: true,
        cronExpression: this.cronExpression(),
        nextRun: this.schedulerService.calculateNextRun(this.cronExpression())
      } : undefined
    };
    
    let savedPrompt: Prompt;
    
    if (this.prompt) {
      // Update existing
      savedPrompt = this.promptService.updatePrompt(this.prompt.id, promptData)!;
    } else {
      // Create new
      savedPrompt = this.promptService.createPrompt(promptData);
    }
    
    // Register/unregister schedule
    if (savedPrompt.schedule?.enabled) {
      this.schedulerService.registerSchedule(savedPrompt.id, savedPrompt.schedule);
    } else if (this.prompt?.schedule?.enabled) {
      this.schedulerService.unregisterSchedule(savedPrompt.id);
    }
    
    this.save.emit(savedPrompt);
  }

  /**
   * Cancel editing
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Add tag
   */
  addTag(): void {
    const tag = this.tagInput().trim();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(tags => [...tags, tag]);
      this.tagInput.set('');
    }
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  /**
   * Handle tag input keypress
   */
  onTagKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  /**
   * Show variable form
   */
  showAddVariable(): void {
    this.resetVariableForm();
    this.showVariableForm.set(true);
  }

  /**
   * Edit variable
   */
  editVariable(index: number): void {
    const variable = this.variables()[index];
    this.varName.set(variable.name);
    this.varType.set(variable.type);
    this.varLabel.set(variable.label);
    this.varPlaceholder.set(variable.placeholder || '');
    this.varRequired.set(variable.required);
    this.varDefaultValue.set(String(variable.defaultValue || ''));
    this.varOptions.set(variable.options?.join(', ') || '');
    this.editingVariableIndex.set(index);
    this.showVariableForm.set(true);
  }

  /**
   * Save variable
   */
  saveVariable(): void {
    const name = this.varName().trim();
    const label = this.varLabel().trim();
    
    if (!name || !label) {
      return;
    }
    
    const variable: PromptVariable = {
      name,
      type: this.varType(),
      label,
      placeholder: this.varPlaceholder().trim() || undefined,
      required: this.varRequired(),
      defaultValue: this.varDefaultValue().trim() || undefined,
      options: this.varType() === 'select' 
        ? this.varOptions().split(',').map(o => o.trim()).filter(o => o)
        : undefined
    };
    
    const editIndex = this.editingVariableIndex();
    
    if (editIndex !== null) {
      // Update existing
      this.variables.update(vars => {
        const newVars = [...vars];
        newVars[editIndex] = variable;
        return newVars;
      });
    } else {
      // Add new
      this.variables.update(vars => [...vars, variable]);
    }
    
    this.showVariableForm.set(false);
    this.resetVariableForm();
  }

  /**
   * Cancel variable editing
   */
  cancelVariable(): void {
    this.showVariableForm.set(false);
    this.resetVariableForm();
  }

  /**
   * Delete variable
   */
  deleteVariable(index: number): void {
    this.variables.update(vars => vars.filter((_, i) => i !== index));
  }

  /**
   * Reset variable form
   */
  private resetVariableForm(): void {
    this.varName.set('');
    this.varType.set('text');
    this.varLabel.set('');
    this.varPlaceholder.set('');
    this.varRequired.set(true);
    this.varDefaultValue.set('');
    this.varOptions.set('');
    this.editingVariableIndex.set(null);
  }

  /**
   * Insert variable into template
   */
  insertVariable(varName: string): void {
    const textarea = document.querySelector('.template-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.template();
    const before = text.substring(0, start);
    const after = text.substring(end);
    const variable = `{{${varName}}}`;
    
    this.template.set(before + variable + after);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  /**
   * Select cron preset
   */
  selectCronPreset(expression: string): void {
    this.cronExpression.set(expression);
    this.cronPreset.set(expression);
  }

  /**
   * Get cron presets
   */
  getCronPresets() {
    return this.schedulerService.getCronPresets();
  }

  /**
   * Update provider and reset model
   */
  onProviderChange(): void {
    const provider = this.provider();
    this.model.set(this.models[provider][0]);
  }

  /**
   * Toggle category
   */
  toggleCategory(category: string): void {
    const categories = this.categories();
    if (categories.includes(category)) {
      this.categories.set(categories.filter(c => c !== category));
    } else {
      this.categories.set([...categories, category]);
    }
  }

  /**
   * Toggle cron day
   */
  toggleCronDay(index: number): void {
    const days = [...this.cronDays()];
    days[index] = !days[index];
    this.cronDays.set(days);
    this.updateCronExpression();
  }

  /**
   * Update cron expression from visual builder
   */
  private updateCronExpression(): void {
    const time = this.cronTime().split(':');
    const hour = time[0];
    const minute = time[1] || '0';
    const days = this.cronDays();
    
    let dayStr = '*';
    if (this.cronFrequency() === 'weekly') {
      const selectedDays: number[] = [];
      days.forEach((selected, index) => {
        if (selected) {
          selectedDays.push(index === 6 ? 0 : index + 1); // Convert to cron format (0=Sun, 1=Mon, etc.)
        }
      });
      if (selectedDays.length > 0) {
        dayStr = selectedDays.sort().join(',');
      }
    }
    
    const expression = `${minute} ${hour} * * ${dayStr}`;
    this.cronExpression.set(expression);
  }

  /**
   * On frequency change
   */
  onFrequencyChange(): void {
    this.updateCronExpression();
  }

  /**
   * On time change
   */
  onTimeChange(): void {
    this.updateCronExpression();
  }
}
