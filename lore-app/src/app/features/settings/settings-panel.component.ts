import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplateService, Template } from '../../core/services/template.service';

export type SettingsPanel = 
  | 'ai-providers' 
  | 'profile' 
  | 'ai-behaviour' 
  | 'sync' 
  | 'templates' 
  | 'appearance';

export interface SyncSettings {
  githubConnected: boolean;
  githubUsername: string;
  gistName: string;
  lastSync: string;
  autoSync: boolean;
  includeHtmlNotes: boolean;
  encryptPrivateNotes: boolean;
}

export interface Profile {
  name: string;
  displayName: string;
  email: string;
  timezone: string;
  bio: string;
  professionalContext: string;
  responseStyles: string[];
}

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
  
  // Active panel
  activePanel = signal<SettingsPanel>('ai-providers');
  
  // Template management
  templates = this.templateService.templates;
  selectedCategory = signal('All');
  
  // Categories
  categories = signal(['All', ...this.templateService.categories()]);

  // AI Providers state
  aiProviders = signal([
    { id: 'anthropic', name: 'Anthropic · Claude', status: 'Connected ✓', model: 'claude-sonnet-4', key: 'sk-ant-••••••••••••••••', connected: true, logoBg: '#7C3AED', logoText: 'C' },
    { id: 'openai', name: 'OpenAI · ChatGPT', status: 'Connected ✓', model: 'gpt-4o', key: 'sk-••••••••••••••••', connected: true, logoBg: '#10A37F', logoText: 'G' },
    { id: 'google', name: 'Google · Gemini', status: 'Not configured', model: '', key: '', connected: false, logoBg: '#4285F4', logoText: 'G' },
    { id: 'groq', name: 'Groq · Llama 3', status: 'Not configured', model: '', key: '', connected: false, logoBg: '#F55036', logoText: 'Q' },
    { id: 'openrouter', name: 'OpenRouter', status: '50+ models via one key', model: '', key: '', connected: false, logoBg: '#1A1A2E', logoText: 'O' }
  ]);

  // Default model
  defaultModel = signal('claude-sonnet-4');
  
  // Models for selection
  models = signal([
    { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Best for research & analysis', selected: true },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Writing & code', selected: false },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '1M token context', selected: false },
    { id: 'groq-llama-3', name: 'Groq Llama 3', description: 'Fastest inference', selected: false }
  ]);

  // Profile state
  profile = signal<Profile>({
    name: 'Harsha',
    displayName: 'Harsha',
    email: 'harsha@example.com',
    timezone: 'Asia/Kolkata (IST +5:30)',
    bio: 'AI consultant at enterprise IT firm. Expertise in SAP/S4HANA, ServiceNow, Salesforce, AI/LLM engineering. Building a 36-week AI learning roadmap.',
    professionalContext: 'Enterprise AI consultant. Working across SAP BTP, ServiceNow Now Assist, Salesforce Einstein. Focus on RAG, LLM fine-tuning, prompt engineering for enterprise workflows.',
    responseStyles: ['Concise', 'Technical depth', 'Use bullet points']
  });

  // AI Behaviour toggles
  aiBehaviourToggles = signal([
    { id: 'auto-link', name: 'Auto-link AI responses to Knowledge Graph', description: 'AI replies are parsed for concepts and linked as graph nodes automatically', enabled: true },
    { id: 'note-context', name: 'Include note context in every AI prompt', description: 'The full current note content is sent as context with each @mention query', enabled: true },
    { id: 'bio-context', name: 'Include personal bio context', description: 'Inject your profile persona into AI system prompts for better responses', enabled: true },
    { id: 'save-exchanges', name: 'Save AI exchanges as sub-notes', description: 'Each @mention conversation is saved as a linked child note in the same notebook', enabled: true },
    { id: 'token-usage', name: 'Show token usage and estimated cost', description: 'Display token count and approximate cost per AI call in block footer', enabled: false },
    { id: 'auto-summary', name: 'Auto-generate note summary on save', description: 'Generates a 2-sentence summary for sidebar preview using the default model', enabled: false },
    { id: 'scheduled-prompts', name: 'Scheduled AI prompts (Cron Jobs)', description: 'Allow prompts from the Prompt Library to run on a schedule and save output as notes', enabled: true }
  ]);

  // HTML Note Generation toggles
  htmlNoteToggles = signal([
    { id: 'enable-html', name: 'Enable HTML Note generation', description: 'Allows AI to produce rich HTML reports saved as special note type', enabled: true },
    { id: 'auto-save-html', name: 'Auto-save generated HTML to notebook', description: 'Saves generated HTML immediately to the current notebook on creation', enabled: true },
    { id: 'html-preview', name: 'Show HTML preview in note sidebar', description: 'Renders a scaled iframe preview of linked HTML notes in the context panel', enabled: true }
  ]);

  // Sync & Export
  syncSettings = signal<SyncSettings>({
    githubConnected: true,
    githubUsername: '@harsha',
    gistName: 'lore-notes-backup',
    lastSync: '2 min ago',
    autoSync: true,
    includeHtmlNotes: true,
    encryptPrivateNotes: false
  });

  // Appearance
  theme = signal<'light' | 'dark' | 'auto'>('light');
  fontSize = signal('medium');
  density = signal('comfortable');

  // ─── Panel Navigation ──────────────────────────────────────────

  /**
   * Set active panel
   */
  setPanel(panel: SettingsPanel): void {
    this.activePanel.set(panel);
  }

  // ─── AI Providers ─────────────────────────────────────────────

  /**
   * Toggle AI provider connection
   */
  toggleProviderConnection(providerId: string): void {
    this.aiProviders.update(providers => 
      providers.map(p => 
        p.id === providerId ? { ...p, connected: !p.connected } : p
      )
    );
  }

  /**
   * Select default model
   */
  selectModel(modelId: string): void {
    this.defaultModel.set(modelId);
    this.models.update(models => 
      models.map(m => ({
        ...m,
        selected: m.id === modelId
      }))
    );
  }

  // ─── Profile ──────────────────────────────────────────────────

  /**
   * Update profile field
   */
  updateProfileField(field: keyof Profile, value: any): void {
    this.profile.update(profile => ({
      ...profile,
      [field]: value
    }));
  }

  /**
   * Toggle response style
   */
  toggleResponseStyle(style: string): void {
    const currentStyles = this.profile().responseStyles;
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    
    this.profile.update(profile => ({
      ...profile,
      responseStyles: newStyles
    }));
  }

  // ─── AI Behaviour ─────────────────────────────────────────────

  /**
   * Toggle AI behaviour setting
   */
  toggleAIBehaviour(settingId: string): void {
    this.aiBehaviourToggles.update(toggles =>
      toggles.map(toggle =>
        toggle.id === settingId ? { ...toggle, enabled: !toggle.enabled } : toggle
      )
    );
  }

  /**
   * Toggle HTML note setting
   */
  toggleHTMLNoteSetting(settingId: string): void {
    this.htmlNoteToggles.update(toggles =>
      toggles.map(toggle =>
        toggle.id === settingId ? { ...toggle, enabled: !toggle.enabled } : toggle
      )
    );
  }

  // ─── Templates ─────────────────────────────────────────────────

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
   * Set category filter
   */
  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  // ─── Sync & Export ──────────────────────────────────────────

  /**
   * Toggle GitHub sync connection
   */
  toggleGitHubSync(): void {
    this.syncSettings.update(settings => ({
      ...settings,
      githubConnected: !settings.githubConnected
    }));
  }

  /**
   * Toggle sync setting
   */
  toggleSyncSetting(setting: keyof SyncSettings): void {
    this.syncSettings.update(settings => ({
      ...settings,
      [setting]: !settings[setting]
    }));
  }

  /**
   * Export notes
   */
  exportNotes(format: 'json' | 'markdown' | 'zip'): void {
    // TODO: Implement actual export logic
    console.log(`Exporting notes as ${format}`);
    alert(`Exporting notes as ${format.toUpperCase()}...`);
  }

  /**
   * Import notes
   */
  importNotes(): void {
    // TODO: Implement actual import logic
    console.log('Importing notes...');
    alert('Import notes functionality coming soon');
  }

  // ─── Appearance ──────────────────────────────────────────────

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme.set(theme);
  }

  /**
   * Set font size
   */
  setFontSize(size: string): void {
    this.fontSize.set(size);
  }

  /**
   * Set density
   */
  setDensity(density: string): void {
    this.density.set(density);
  }

  // ─── Utilities ────────────────────────────────────────────────

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
   * Check if response style is active
   */
  isResponseStyleActive(style: string): boolean {
    return this.profile().responseStyles.includes(style);
  }

  // ─── Save Changes ──────────────────────────────────────────────

  /**
   * Save all settings
   */
  saveChanges(): void {
    // TODO: Implement actual save logic
    console.log('Saving settings...', {
      aiProviders: this.aiProviders(),
      profile: this.profile(),
      aiBehaviour: this.aiBehaviourToggles(),
      syncSettings: this.syncSettings(),
      theme: this.theme(),
      fontSize: this.fontSize(),
      density: this.density()
    });
    
    // Show success message
    alert('Settings saved successfully!');
  }
}
