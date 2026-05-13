import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Prompt, PromptRun } from '../../../core/models/prompt.model';
import { PromptService } from '../../../core/services/prompt.service';

/**
 * PromptRunnerComponent
 * Modal component for executing prompts with variable substitution
 */
@Component({
  selector: 'lore-prompt-runner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-runner.component.html',
  styleUrls: ['./prompt-runner.component.scss']
})
export class PromptRunnerComponent implements OnInit {
  @Input() prompt: Prompt | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() complete = new EventEmitter<PromptRun>();

  // State signals
  runState = signal<'confirm' | 'generating' | 'done'>('confirm');
  variableValues = signal<Record<string, string>>({});
  generatedOutput = signal('');
  currentStep = signal(0);
  progress = signal(0);
  error = signal<string | null>(null);

  // Steps for generation
  steps = [
    { label: 'Sending prompt to AI', icon: '✓' },
    { label: 'Processing request', icon: '⟳' },
    { label: 'Generating output', icon: '3' },
    { label: 'Saving result', icon: '4' }
  ];

  constructor(private promptService: PromptService) {}

  ngOnInit(): void {
    if (this.prompt) {
      // Initialize variable values with defaults
      const values: Record<string, string> = {};
      this.prompt.variables.forEach(variable => {
        values[variable.name] = String(variable.defaultValue || '');
      });
      this.variableValues.set(values);
    }
  }

  /**
   * Update variable value
   */
  updateVariable(name: string, value: string): void {
    this.variableValues.update(values => ({
      ...values,
      [name]: value
    }));
  }

  /**
   * Start prompt execution
   */
  async runPrompt(): Promise<void> {
    if (!this.prompt) return;

    this.runState.set('generating');
    this.currentStep.set(0);
    this.progress.set(0);
    this.error.set(null);

    try {
      // Simulate AI generation with steps
      await this.simulateGeneration();

      // Record the run
      const run: Omit<PromptRun, 'id' | 'timestamp'> = {
        promptId: this.prompt.id,
        status: 'success',
        provider: this.prompt.provider,
        model: this.prompt.model || '',
        input: this.variableValues(),
        output: this.generatedOutput(),
        duration: 2500 // milliseconds
      };

      // Update prompt with run history
      this.promptService.recordRun(run);

      this.runState.set('done');
      // Don't emit the run, just close
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
      this.runState.set('confirm');
    }
  }

  /**
   * Simulate AI generation with progress
   */
  private async simulateGeneration(): Promise<void> {
    const steps = this.steps.length;
    
    for (let i = 0; i < steps; i++) {
      this.currentStep.set(i);
      this.progress.set((i / steps) * 100);
      
      // Simulate processing time
      await this.delay(600 + Math.random() * 400);
      
      // Generate output on final step
      if (i === steps - 1) {
        this.generatedOutput.set(this.generateOutput());
      }
    }
    
    this.progress.set(100);
  }

  /**
   * Generate output by substituting variables
   */
  private generateOutput(): string {
    if (!this.prompt) return '';

    let output = this.prompt.template;
    const values = this.variableValues();

    // Substitute all variables
    this.prompt.variables.forEach(variable => {
      const value = values[variable.name] || variable.defaultValue || '';
      const regex = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g');
      output = output.replace(regex, String(value));
    });

    // Add simulated AI response
    output += '\n\n---\n\n';
    output += '**AI Generated Response:**\n\n';
    output += 'This is a simulated AI response. In production, this would be the actual output from the selected AI provider (';
    output += this.prompt.provider + ').\n\n';
    output += 'The prompt has been processed with the provided variables and would generate contextual, relevant content based on the template.';

    return output;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close modal
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Get step status
   */
  getStepStatus(index: number): 'done' | 'active' | 'pending' {
    const current = this.currentStep();
    if (index < current) return 'done';
    if (index === current) return 'active';
    return 'pending';
  }

  /**
   * Get step icon
   */
  getStepIcon(index: number): string {
    const status = this.getStepStatus(index);
    if (status === 'done') return '✓';
    if (status === 'active') return '⟳';
    return String(index + 1);
  }

  /**
   * Get current timestamp
   */
  getCurrentTimestamp(): number {
    return Date.now();
  }

  /**
   * Get file extension based on prompt tags
   */
  getFileExtension(): string {
    if (this.prompt && this.prompt.tags && this.prompt.tags.includes('HTML Reports')) {
      return 'html';
    }
    return 'note';
  }
}
