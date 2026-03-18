import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppState, CustomTemplate } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DriveService } from '../../services/drive.service';
import { ExportImportService } from '../../services/export-import.service';
import { AnthropicService, AI_PROVIDERS, AiProvider } from '../../services/anthropic.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

interface ThemeOption {
  id: string;
  name: string;
  dot: string;
}

const THEMES: ThemeOption[] = [
  { id: 'default', name: 'Default',    dot: 'linear-gradient(135deg,#191919,#7C6AF6)' },
  { id: 'light',   name: 'Light',      dot: 'linear-gradient(135deg,#fff,#7C6AF6)' },
  { id: 'dark',    name: 'Dark',       dot: 'linear-gradient(135deg,#111,#9D8FF8)' },
  { id: 'warm',    name: 'Warm Paper', dot: 'linear-gradient(135deg,#1C1510,#A0886A)' },
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
export class SettingsPanelComponent implements OnChanges {
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
  private exportImportService = inject(ExportImportService);
  private anthropicService = inject(AnthropicService);

  driveConnecting = false;

  apiKey: string = '';
  apiEndpoint: string = '';
  apiKeySyncDrive: boolean = false;
  apiKeyStatus: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';

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

  /** Track which template rows are in "confirm delete" state */
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
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  onThemeSelect(themeId: string): void {
    this.themeChanged.emit(themeId);
  }

  onFontSizeChange(size: number): void {
    this.fontSizeChanged.emit(Number(size));
  }

  onNameBlur(): void {
    const trimmed = this.displayName.trim();
    if (trimmed) {
      this.nameChanged.emit(trimmed);
    }
  }

  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    }
  }

  onEditTemplate(tpl: CustomTemplate): void {
    this.templateEdited.emit(tpl);
  }

  onExportTemplate(tpl: CustomTemplate): void {
    this.templateExported.emit(tpl);
    this.exportImportService.exportTemplate(tpl);
  }

  onDeleteTemplate(tpl: CustomTemplate): void {
    this.confirmDeleteId = tpl.id;
  }

  onConfirmDelete(tpl: CustomTemplate): void {
    this.confirmDeleteId = null;
    this.templateDeleted.emit(tpl.id);
  }

  onCancelDelete(): void {
    this.confirmDeleteId = null;
  }

  onLogout(): void {
    this.logout.emit();
    this.authService.logout();
  }

  onExportWorkspace(): void {
    this.exportWorkspace.emit();
    this.exportImportService.exportWorkspace();
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

  get currentTheme(): string {
    return this.state?.theme ?? 'default';
  }

  get currentFontSize(): number {
    return this.state?.fontSize ?? 14;
  }

  get isLocalMode(): boolean {
    return this.authService.isLocalMode;
  }

  get driveConnected(): boolean {
    return this.driveService.hasToken();
  }

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

  get totalTemplateCount(): number {
    return 6 + (this.customTemplates?.length ?? 0);
  }

  onSelectProvider(id: string): void {
    this.selectedProviderId = id;
    this.apiKeyStatus = 'idle';
    const p = this.selectedProvider;
    // Pre-fill endpoint with provider default if it's a custom-endpoint provider
    if (p.supportsCustomEndpoint) {
      this.apiEndpoint = p.defaultEndpoint;
    }
  }

  async onSaveApiKey(): Promise<void> {
    if (!this.apiKey.trim()) return;
    this.apiKeyStatus = 'validating';
    const p = this.selectedProvider;
    const endpoint = p.supportsCustomEndpoint && this.apiEndpoint.trim()
      ? this.apiEndpoint.trim()
      : p.defaultEndpoint;
    const valid = await this.anthropicService.validateApiKey(this.apiKey.trim(), p.id, endpoint);
    if (valid) {
      this.anthropicService.setApiKey(this.apiKey.trim());
      this.anthropicService.setProviderId(p.id);
      this.anthropicService.setEndpoint(endpoint);
      this.apiKeyStatus = 'valid';
    } else {
      this.apiKeyStatus = 'invalid';
    }
  }

  onRemoveApiKey(): void {
    this.anthropicService.clearApiKey();
    this.apiKey = '';
    this.apiKeyStatus = 'idle';
  }

  onApiKeySyncChange(): void {
    if (this.apiKeySyncDrive) {
      localStorage.setItem('lore_anthropic_key_sync_drive', 'true');
    } else {
      localStorage.removeItem('lore_anthropic_key_sync_drive');
    }
  }

  get hasApiKey(): boolean {
    return !!this.anthropicService.getApiKey();
  }
}
