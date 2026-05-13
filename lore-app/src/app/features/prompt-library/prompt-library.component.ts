import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptService } from '../../core/services/prompt.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import { Prompt } from '../../core/models/prompt.model';
import { PromptEditorComponent } from './prompt-editor/prompt-editor.component';
import { PromptRunnerComponent } from './prompt-runner/prompt-runner.component';

/**
 * PromptLibraryComponent
 * Main view for browsing and managing prompt templates
 */
@Component({
  selector: 'lore-prompt-library',
  standalone: true,
  imports: [CommonModule, FormsModule, PromptEditorComponent, PromptRunnerComponent],
  templateUrl: './prompt-library.component.html',
  styleUrls: ['./prompt-library.component.scss']
})
export class PromptLibraryComponent {
  // Signals
  searchQuery = signal('');
  selectedTag = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  sortBy = signal<'recent' | 'name' | 'usage'>('recent');
  showScheduledOnly = signal(false);
  showFavoritesOnly = signal(false);
  selectedPrompt = signal<Prompt | null>(null);
  showEditor = signal(false);
  showRunModal = signal(false);

  // Computed signals
  filteredPrompts = computed(() => {
    let prompts = this.promptService.prompts();
    
    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      prompts = prompts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by tag
    const tag = this.selectedTag();
    if (tag) {
      prompts = prompts.filter(p => p.tags.includes(tag));
    }
    
    // Filter by scheduled
    if (this.showScheduledOnly()) {
      prompts = prompts.filter(p => p.schedule?.enabled);
    }
    
    // Filter by favorites
    if (this.showFavoritesOnly()) {
      prompts = prompts.filter(p => p.isFavorite);
    }
    
    // Sort
    const sortBy = this.sortBy();
    if (sortBy === 'name') {
      prompts = [...prompts].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'usage') {
      prompts = [...prompts].sort((a, b) => b.useCount - a.useCount);
    } else {
      // recent (by lastUsed or updatedAt)
      prompts = [...prompts].sort((a, b) => {
        const aTime = a.lastUsed?.getTime() || a.updatedAt.getTime();
        const bTime = b.lastUsed?.getTime() || b.updatedAt.getTime();
        return bTime - aTime;
      });
    }
    
    return prompts;
  });

  scheduledPrompts = computed(() => {
    return this.filteredPrompts().filter(p => p.schedule?.enabled);
  });

  regularPrompts = computed(() => {
    return this.filteredPrompts().filter(p => !p.schedule?.enabled);
  });

  hasScheduledPrompts = computed(() => {
    return this.scheduledPrompts().length > 0;
  });

  allTags = computed(() => this.promptService.getAllTags());
  stats = computed(() => this.promptService.stats());

  constructor(
    public promptService: PromptService,
    public schedulerService: SchedulerService
  ) {}

  /**
   * Create new prompt
   */
  createPrompt(): void {
    this.selectedPrompt.set(null);
    this.showEditor.set(true);
  }

  /**
   * Edit prompt
   */
  editPrompt(prompt: Prompt): void {
    this.selectedPrompt.set(prompt);
    this.showEditor.set(true);
  }

  /**
   * Run prompt
   */
  runPrompt(prompt: Prompt): void {
    this.selectedPrompt.set(prompt);
    this.showRunModal.set(true);
  }

  /**
   * Duplicate prompt
   */
  duplicatePrompt(prompt: Prompt): void {
    this.promptService.duplicatePrompt(prompt.id);
  }

  /**
   * Delete prompt
   */
  deletePrompt(prompt: Prompt): void {
    if (confirm(`Delete prompt "${prompt.title}"?`)) {
      this.promptService.deletePrompt(prompt.id);
    }
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(prompt: Prompt, event: Event): void {
    event.stopPropagation();
    this.promptService.toggleFavorite(prompt.id);
  }

  /**
   * Toggle schedule
   */
  toggleSchedule(prompt: Prompt, event: Event): void {
    event.stopPropagation();
    
    if (prompt.schedule) {
      const enabled = !prompt.schedule.enabled;
      this.promptService.updatePrompt(prompt.id, {
        schedule: { ...prompt.schedule, enabled }
      });
      
      if (enabled) {
        this.schedulerService.registerSchedule(prompt.id, prompt.schedule);
      } else {
        this.schedulerService.unregisterSchedule(prompt.id);
      }
    }
  }

  /**
   * Select tag filter
   */
  selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedTag.set(null);
    this.showScheduledOnly.set(false);
    this.showFavoritesOnly.set(false);
  }

  /**
   * Export prompts
   */
  exportPrompts(): void {
    const json = this.promptService.exportPrompts();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lore-prompts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import prompts
   */
  importPrompts(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const result = this.promptService.importPrompts(json);
      
      if (result.success) {
        alert(`Successfully imported ${result.count} prompts`);
      } else {
        alert(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Get provider color
   */
  getProviderColor(provider: string): string {
    const colors: Record<string, string> = {
      anthropic: '#D97757',
      openai: '#10A37F',
      google: '#4285F4',
      groq: '#F55036'
    };
    return colors[provider] || '#666';
  }

  /**
   * Format date
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  /**
   * Get next run description
   */
  getNextRunDescription(prompt: Prompt): string {
    if (!prompt.schedule?.enabled || !prompt.schedule.nextRun) {
      return 'Not scheduled';
    }
    
    return this.schedulerService.getTimeUntilNextRun(prompt.schedule.nextRun);
  }

  /**
   * Close editor
   */
  closeEditor(): void {
    this.showEditor.set(false);
    this.selectedPrompt.set(null);
  }

  /**
   * Handle editor save
   */
  onEditorSave(prompt: Prompt): void {
    this.closeEditor();
  }

  /**
   * Handle editor cancel
   */
  onEditorCancel(): void {
    this.closeEditor();
  }

  /**
   * Close run modal
   */
  closeRunModal(): void {
    this.showRunModal.set(false);
    this.selectedPrompt.set(null);
  }
}
