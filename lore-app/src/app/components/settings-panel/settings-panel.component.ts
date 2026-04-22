import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppState, CustomTemplate } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DriveService } from '../../services/drive.service';
import { FileSyncService } from '../../services/file-sync.service';
import { GistSyncService } from '../../services/gist-sync.service';
import { ExportImportService } from '../../services/export-import.service';
import { AnthropicService, AI_PROVIDERS, AiProvider } from '../../services/anthropic.service';
import { DataService } from '../../services/data.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';
import { APP_VERSION } from '../../version';

interface ThemeOption { id: string; name: string; dot: string; }

const THEMES: ThemeOption[] = [
  { id: 'default',      name: 'Default',       dot: 'linear-gradient(135deg,#191919,#7C6AF6)' },
  { id: 'light',        name: 'Light',         dot: 'linear-gradient(135deg,#fff,#7C6AF6)' },
  { id: 'dark',         name: 'Dark',          dot: 'linear-gradient(135deg,#111,#9D8FF8)' },
  { id: 'warm',         name: 'Warm Paper',    dot: 'linear-gradient(135deg,#1C1510,#A0886A)' },
  { id: 'purple-light', name: 'Purple Light',  dot: 'linear-gradient(135deg,#EAE5FF,#7C6AF6)' },
  { id: 'purple-dark',  name: 'Purple Dark',   dot: 'linear-gradient(135deg,#0E0A1F,#A78BFA)' },
];

const SECTION_COLOR_MAP: Record<string, { bg: string; border: string }> = {
  purple: { bg: '#EEEDFE', border: '#AFA9EC' },
  teal:   { bg: '#E1F5EE', border: '#5DCAA5' },
  blue:   { bg: '#E6F1FB', border: '#85B7EB' },
  amber:  { bg: '#FAEEDA', border: '#EF9F27' },
  coral:  { bg: '#FAECE7', border: '#F0997B' },
  green:  { bg: '#EAF3DE', border: '#97C459' },
  pink:   { bg: '#FBEAF0', border: '#ED93B1' },
  gray:   { bg: '#F1EFE8', border: '#B4B2A9' },
};

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss'],
})
export class SettingsPanelComponent implements OnChanges, OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() state!: AppState;
  @Input() customTemplates: CustomTemplate[] = [];
  @Input() syncStatus: string = 'idle';

  @Output() closed = new EventEmitter<void>();
  @Output() themeChanged = new EventEmitter<string>();
  @Output() fontSizeChanged = new EventEmitter<number>();
  @Output() nameChanged = new EventEmitter<string>();
  @Output() templateDeleted = new EventEmitter<string>();
  @Output() templateEdited = new EventEmitter<CustomTemplate>();
  @Output() templateExported = new EventEmitter<CustomTemplate>();
  @Output() logout = new EventEmitter<void>();
  @Output() exportWorkspace = new EventEmitter<void>();
  @Output() driveReconnected = new EventEmitter<void>();

  private authService = inject(AuthService);
  private driveService = inject(DriveService);
  readonly fileSync = inject(FileSyncService);
  readonly gistSync = inject(GistSyncService);
  private exportImportService = inject(ExportImportService);
  private anthropicService = inject(AnthropicService);
  private dataService = inject(DataService);

  readonly appVersion = APP_VERSION;

  // Drive
  driveConnecting = false;
  driveConnected = false;

  // File sync
  fileSyncStatus = 'no-file';
  fileSyncFileName = '';

  // Gist sync
  gistSyncStatus = 'disconnected';
  gistUsername = '';
  readonly gistConfigured = this.gistSync.isConfigured;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(
      this.driveService.driveConnected$.subscribe(v => this.driveConnected = v),
      this.fileSync.status$.subscribe(s => {
        this.fileSyncStatus = s;
        this.fileSyncFileName = this.fileSync.getFileName();
      }),
      this.gistSync.status$.subscribe(s => this.gistSyncStatus = s),
      this.gistSync.username$.subscribe(u => this.gistUsername = u),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ── AI ────────────────────────────────────────────────────────────────────

  apiKey: string = '';
  apiEndpoint: string = '';
  apiKeySyncDrive: boolean = false;
  apiKeyStatus: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  availableModels: string[] = [];
  selectedModel: string = '';
  modelsLoading = false;
  providers = AI_PROVIDERS;
  selectedProviderId: string = 'anthropic';

  get selectedProvider(): AiProvider {
    return this.providers.find(p => p.id === this.selectedProviderId) ?? this.providers[0];
  }

  themes = THEMES;
  fontSizes = [
    { value: 13, label: 'Small' },
    { value: 14, label: 'Medium' },
    { value: 15, label: 'Large' },
  ];

  displayName: string = '';
  userEmail: string = '';
  confirmDeleteId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.confirmDeleteId = null;
      const user = this.authService.getCurrentUser();
      this.displayName = user?.name ?? '';
      this.userEmail = user?.email ?? '';
      this.apiKey = this.anthropicService.getApiKey() ?? '';
      this.selectedProviderId = this.anthropicService.getProviderId();
      this.apiEndpoint = this.anthropicService.getEndpoint();
      this.apiKeySyncDrive = localStorage.getItem('lore_anthropic_key_sync_drive') === 'true';
      this.apiKeyStatus = 'idle';
      this.selectedModel = this.anthropicService.getModel();
      this.availableModels = [];
      if (this.apiKey) this.loadModels();

      // Smart Notes settings
      this.smartNotesAiMatching = localStorage.getItem('lore_smart_notes_ai_matching') === 'true';
      this.smartNotesAutoApply  = localStorage.getItem('lore_smart_notes_auto_apply')  === 'true';
    }
  }

  // ── General ───────────────────────────────────────────────────────────────

  onClose(): void { this.closed.emit(); }
  onThemeSelect(themeId: string): void { this.themeChanged.emit(themeId); }
  onFontSizeChange(size: number): void { this.fontSizeChanged.emit(Number(size)); }

  onNameBlur(): void {
    const trimmed = this.displayName.trim();
    if (trimmed) this.nameChanged.emit(trimmed);
  }

  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
  }

  onEditTemplate(tpl: CustomTemplate): void { this.templateEdited.emit(tpl); }

  onExportTemplate(tpl: CustomTemplate): void {
    this.templateExported.emit(tpl);
    this.exportImportService.exportTemplate(tpl);
  }

  onDeleteTemplate(tpl: CustomTemplate): void { this.confirmDeleteId = tpl.id; }
  onConfirmDelete(tpl: CustomTemplate): void { this.confirmDeleteId = null; this.templateDeleted.emit(tpl.id); }
  onCancelDelete(): void { this.confirmDeleteId = null; }

  onLogout(): void { this.logout.emit(); this.authService.logout(); }

  onExportWorkspace(): void {
    this.exportWorkspace.emit();
    this.exportImportService.exportWorkspace();
  }

  // ── Drive ─────────────────────────────────────────────────────────────────

  async onReconnectDrive(): Promise<void> {
    this.driveConnecting = true;
    try {
      await this.driveService.requestToken();
      this.driveConnecting = false;
      this.driveReconnected.emit();
    } catch (e) {
      console.warn('Drive reconnect failed:', e);
      this.driveConnecting = false;
    }
  }

  // ── File Sync (Option 2) ──────────────────────────────────────────────────

  get fileSyncSupported(): boolean { return this.fileSync.isSupported; }

  async onPickSyncFile(): Promise<void> {
    const ok = await this.fileSync.pickFile();
    if (ok) {
      const data = await this.fileSync.load();
      if (data?.state) {
        this.dataService.loadFromObject(data.state, data.prompts);
        this.dataService.showToast('✓ Loaded from local file');
      }
    }
  }

  async onCreateSyncFile(): Promise<void> {
    const ok = await this.fileSync.createFile();
    if (ok) {
      await this.fileSync.save(this.buildSyncPayload());
      this.dataService.showToast('✓ Sync file created');
    }
  }

  async onSaveToFile(): Promise<void> {
    if (this.fileSync.hasFile()) {
      await this.fileSync.save(this.buildSyncPayload());
      this.dataService.showToast('✓ Saved to local file');
    } else {
      this.fileSync.downloadBackup(this.buildSyncPayload());
      this.dataService.showToast('✓ Backup downloaded');
    }
  }

  async onLoadFromFile(): Promise<void> {
    if (this.fileSync.hasFile()) {
      const data = await this.fileSync.load();
      if (data?.state) {
        this.dataService.loadFromObject(data.state, data.prompts);
        this.dataService.showToast('✓ Loaded from local file');
      }
    } else {
      const data = await this.fileSync.uploadBackup();
      if (data?.state) {
        this.dataService.loadFromObject(data.state, data.prompts);
        this.dataService.showToast('✓ Loaded from backup file');
      }
    }
  }

  onDisconnectFile(): void { this.fileSync.clearHandle(); }

  // ── Gist Sync (Option 3) ──────────────────────────────────────────────────

  async onConnectGist(): Promise<void> { this.gistSync.startOAuth(); }

  async onSaveToGist(): Promise<void> {
    await this.gistSync.save(this.buildSyncPayload());
    this.dataService.showToast('✓ Saved to GitHub Gist');
  }

  async onLoadFromGist(): Promise<void> {
    const data = await this.gistSync.load();
    if (data?.state) {
      this.dataService.loadFromObject(data.state, data.prompts);
      this.dataService.showToast('✓ Loaded from GitHub Gist');
    }
  }

  onDisconnectGist(): void { this.gistSync.disconnect(); }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildSyncPayload(): any {
    return {
      state: this.dataService.getState(),
      customTemplates: JSON.parse(localStorage.getItem('lore_custom_templates') || '[]'),
      prompts: JSON.parse(localStorage.getItem('lore_prompts') || '[]'),
    };
  }

  getTemplateColorStyle(tpl: CustomTemplate): { background: string; border: string } {
    const c = SECTION_COLOR_MAP[tpl.color] ?? SECTION_COLOR_MAP['gray'];
    return { background: c.bg, border: `1px solid ${c.border}` };
  }

  getTemplateFieldSummary(tpl: CustomTemplate): string {
    const nonTitle = tpl.fields.filter(f => f.id !== 'title');
    const preview = nonTitle.slice(0, 3).map(f => f.label).join(', ');
    return `${nonTitle.length} field${nonTitle.length !== 1 ? 's' : ''}${preview ? ' · ' + preview : ''}`;
  }

  get currentTheme(): string { return this.state?.theme ?? 'default'; }
  get currentFontSize(): number { return this.state?.fontSize ?? 14; }
  get isLocalMode(): boolean { return this.authService.isLocalMode; }
  get isGitHubMode(): boolean { return this.authService.isGitHubMode; }
  get totalTemplateCount(): number { return 6 + (this.customTemplates?.length ?? 0); }

  // ── AI ────────────────────────────────────────────────────────────────────

  onSelectProvider(id: string): void {
    this.selectedProviderId = id;
    this.apiKeyStatus = 'idle';
    this.availableModels = [];
    this.selectedModel = '';
    const p = this.selectedProvider;
    if (p.supportsCustomEndpoint) this.apiEndpoint = p.defaultEndpoint;
  }

  async loadModels(): Promise<void> {
    if (!this.apiKey.trim()) return;
    this.modelsLoading = true;
    const p = this.selectedProvider;
    const endpoint = p.supportsCustomEndpoint && this.apiEndpoint.trim()
      ? this.apiEndpoint.trim() : p.defaultEndpoint;
    this.availableModels = await this.anthropicService.fetchModels(this.apiKey.trim(), p.id, endpoint);
    this.modelsLoading = false;
    if (this.selectedModel && this.availableModels.includes(this.selectedModel)) return;
    if (this.availableModels.length) {
      this.selectedModel = this.availableModels[0];
      this.anthropicService.setModel(this.selectedModel);
    }
  }

  onModelChange(model: string): void {
    this.selectedModel = model;
    this.anthropicService.setModel(model);
  }

  async onSaveApiKey(): Promise<void> {
    if (!this.apiKey.trim()) return;
    this.apiKeyStatus = 'validating';
    const p = this.selectedProvider;
    const endpoint = p.supportsCustomEndpoint && this.apiEndpoint.trim()
      ? this.apiEndpoint.trim() : p.defaultEndpoint;
    const valid = await this.anthropicService.validateApiKey(this.apiKey.trim(), p.id, endpoint);
    if (valid) {
      this.anthropicService.setApiKey(this.apiKey.trim());
      this.anthropicService.setProviderId(p.id);
      this.anthropicService.setEndpoint(endpoint);
      this.apiKeyStatus = 'valid';
      await this.loadModels();
    } else {
      this.apiKeyStatus = 'invalid';
    }
  }

  onRemoveApiKey(): void {
    this.anthropicService.clearApiKey();
    this.apiKey = '';
    this.apiKeyStatus = 'idle';
    this.availableModels = [];
    this.selectedModel = '';
  }

  onApiKeySyncChange(): void {
    if (this.apiKeySyncDrive) {
      localStorage.setItem('lore_anthropic_key_sync_drive', 'true');
    } else {
      localStorage.removeItem('lore_anthropic_key_sync_drive');
    }
  }

  get hasApiKey(): boolean { return !!this.anthropicService.getApiKey(); }

  // ── Smart Notes ───────────────────────────────────────────────────────────

  smartNotesAiMatching = false;
  smartNotesAutoApply = false;

  onSmartNotesAiMatchingChange(): void {
    if (this.smartNotesAiMatching) {
      localStorage.setItem('lore_smart_notes_ai_matching', 'true');
    } else {
      localStorage.removeItem('lore_smart_notes_ai_matching');
    }
  }

  onSmartNotesAutoApplyChange(): void {
    if (this.smartNotesAutoApply) {
      localStorage.setItem('lore_smart_notes_auto_apply', 'true');
    } else {
      localStorage.removeItem('lore_smart_notes_auto_apply');
    }
  }
}
