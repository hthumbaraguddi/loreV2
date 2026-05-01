import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplateService, Template } from '../../core/services/template.service';

@Component({
  selector: 'lore-settings-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPanelComponent {
  private templateService = inject(TemplateService);
  
  // Active tab
  activeTab = signal<'general' | 'templates' | 'appearance' | 'shortcuts'>('general');
  
  // Template management
  templates = this.templateService.templates;
  selectedCategory = signal('All');
  
  // Categories
  categories = signal(['All', ...this.templateService.categories()]);

  // ─── Template Actions ──────────────────────────────────────────

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): void {
    if (confirm('Are you sure you want to delete this template?')) {
      this.templateService.deleteTemplate(templateId);
    }
  }

  /**
   * Duplicate template
   */
  duplicateTemplate(templateId: string): void {
    this.templateService.duplicateTemplate(templateId);
  }

  /**
   * Get templates by selected category
   */
  getFilteredTemplates(): Template[] {
    const category = this.selectedCategory();
    if (category === 'All') {
      return this.templates();
    }
    return this.templates().filter(t => t.category === category);
  }

  /**
   * Get block count text
   */
  getBlockCountText(template: Template): string {
    const count = template.blocks.length;
    return `${count} block${count !== 1 ? 's' : ''}`;
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Set active tab
   */
  setTab(tab: 'general' | 'templates' | 'appearance' | 'shortcuts'): void {
    this.activeTab.set(tab);
  }

  /**
   * Set category filter
   */
  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }
}
