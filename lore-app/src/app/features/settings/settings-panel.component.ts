import { Component, signal, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplateService, Template } from '../../core/services/template.service';
import { StorageSyncService, StorageTier, SyncInterval } from '../../core/services/storage-sync.service';
import { ThemeService, type Theme } from '../../core/services/theme.service';
import { AIService, AIProvider } from '../../core/services/ai.service';

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
  storageSyncService = inject(StorageSyncService);
  private themeService = inject(ThemeService);
  aiService = inject(AIService);
  
  // Active panel
  activePanel = signal<SettingsPanel>('ai-providers');
  
  // Template management
  templates = this.templateService.templates;
  selectedCategory = signal('All');
  
  // Categories
  categories = signal(['All', ...this.templateService.categories()]);

  // AI Providers state (from AIService)
  aiProviders = this.aiService.providers;

  // Default model (from AIService)
  defaultModel = this.aiService.defaultModel;
  
  // All available models (computed from providers)
  allModels = signal<any[]>([]);

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
  theme = signal<Theme>('light');
  fontSize = signal('medium');
  density = signal('comfortable');

  constructor() {
    // Sync theme with ThemeService
    effect(() => {
      const themePreference = this.themeService.getThemePreference();
      this.theme.set(themePreference);
    });

    // Build models list from all providers
    effect(() => {
      const providers = this.aiProviders();
      const models: any[] = [];
      
      for (const provider of providers) {
        for (const model of provider.models) {
          models.push({
            id: model.id,
            name: model.name,
            description: `${provider.name} · ${model.maxTokens.toLocaleString()} tokens`,
            selected: model.id === this.defaultModel(),
            providerId: provider.id
          });
        }
      }
      
      this.allModels.set(models);
    });
  }

  // ─── Panel Navigation ──────────────────────────────────────────

  /**
   * Set active panel
   */
  setPanel(panel: SettingsPanel): void {
    this.activePanel.set(panel);
  }

  // ─── AI Providers ─────────────────────────────────────────────

  /**
   * Update API key for provider
   */
  updateApiKey(providerId: string, apiKey: string): void {
    this.aiService.setApiKey(providerId, apiKey);
  }

  /**
   * Test connection to provider
   */
  async testProviderConnection(providerId: string): Promise<void> {
    try {
      const success = await this.aiService.testConnection(providerId);
      if (success) {
        alert(`Successfully connected to ${providerId}!`);
      } else {
        alert(`Failed to connect to ${providerId}. Please check your API key.`);
      }
    } catch (error: any) {
      alert(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Select default model
   */
  selectModel(modelId: string): void {
    this.aiService.setDefaultModel(modelId);
  }

  /**
   * Get masked API key for display
   */
  getMaskedApiKey(provider: AIProvider): string {
    if (!provider.apiKey) {
      return '';
    }
    const key = provider.apiKey;
    if (key.length <= 8) {
      return '••••••••';
    }
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  }

  /**
   * Get provider status text
   */
  getProviderStatus(provider: AIProvider): string {
    if (!provider.apiKey) {
      return 'Not configured';
    }
    if (provider.connected) {
      return 'Connected ✓';
    }
    return 'API key set (not tested)';
  }

  /**
   * Get provider logo background color
   */
  getProviderLogoBg(providerId: string): string {
    const colors: Record<string, string> = {
      'anthropic': '#7C3AED',
      'openai': '#10A37F',
      'google': '#4285F4',
      'groq': '#F55036'
    };
    return colors[providerId] || '#1A1A2E';
  }

  /**
   * Get provider logo text
   */
  getProviderLogoText(providerId: string): string {
    const logos: Record<string, string> = {
      'anthropic': 'C',
      'openai': 'G',
      'google': 'G',
      'groq': 'Q'
    };
    return logos[providerId] || '?';
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
   * Set storage tier
   */
  setStorageTier(tier: StorageTier): void {
    this.storageSyncService.setStorageTier(tier);
  }

  /**
   * Select folder for local sync
   */
  async selectLocalFolder(): Promise<void> {
    try {
      await this.storageSyncService.selectFolder();
    } catch (error: any) {
      alert(`Failed to select folder: ${error.message}`);
    }
  }

  /**
   * Toggle local auto-sync
   */
  toggleLocalAutoSync(): void {
    const settings = this.storageSyncService.syncSettings();
    if (settings.localSync.autoSyncEnabled) {
      this.storageSyncService.disableLocalAutoSync();
    } else {
      this.storageSyncService.enableLocalAutoSync(settings.localSync.syncInterval);
    }
  }

  /**
   * Set local sync interval
   */
  setLocalSyncInterval(interval: SyncInterval): void {
    const settings = this.storageSyncService.syncSettings();
    this.storageSyncService.enableLocalAutoSync(interval);
  }

  /**
   * Sync to local folder now
   */
  async syncToLocalFolderNow(): Promise<void> {
    try {
      await this.storageSyncService.syncToLocalFolder();
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    }
  }

  /**
   * Sign in with GitHub
   */
  async signInWithGitHub(): Promise<void> {
    try {
      await this.storageSyncService.signInWithGitHub();
    } catch (error: any) {
      alert(`GitHub sign-in failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from GitHub
   */
  disconnectGitHub(): void {
    if (confirm('Are you sure you want to disconnect from GitHub?')) {
      this.storageSyncService.disconnectGitHub();
    }
  }

  /**
   * Toggle GitHub auto-sync
   */
  toggleGitHubAutoSync(): void {
    const settings = this.storageSyncService.syncSettings();
    if (settings.githubSync.autoSyncEnabled) {
      this.storageSyncService.disableGitHubAutoSync();
    } else {
      this.storageSyncService.enableGitHubAutoSync(settings.githubSync.syncInterval);
    }
  }

  /**
   * Set GitHub sync interval
   */
  setGitHubSyncInterval(interval: SyncInterval): void {
    this.storageSyncService.enableGitHubAutoSync(interval);
  }

  /**
   * Sync to GitHub now
   */
  async syncToGitHubNow(): Promise<void> {
    try {
      await this.storageSyncService.syncToGitHub();
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    }
  }

  /**
   * Check if File System Access API is supported
   */
  isFileSystemAccessSupported(): boolean {
    return this.storageSyncService.isFileSystemAccessSupported();
  }

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
  async importNotes(): Promise<void> {
    try {
      await this.storageSyncService.importFromFolder();
      // Success - page will reload automatically
    } catch (error: any) {
      if (error.message && !error.message.includes('cancelled')) {
        alert(`Import failed: ${error.message}`);
      }
    }
  }

  // ─── Appearance ──────────────────────────────────────────────

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.themeService.setTheme(theme);
  }

  /**
   * Get current applied theme (resolves 'system' to actual theme)
   */
  getAppliedTheme(): 'light' | 'dark' {
    return this.themeService.appliedTheme();
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
