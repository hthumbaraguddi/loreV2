import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { TemplateService } from './services/template.service';
import { ExportImportService } from './services/export-import.service';
import { DriveService, SyncStatus } from './services/drive.service';
import { AppState, Shelf, Notebook, Section, Note, CustomTemplate, SECTION_COLORS, SectionColorMap } from './models';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { ContentAreaComponent } from './components/content-area/content-area.component';
import { EditPanelComponent } from './components/edit-panel/edit-panel.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { ShelfModalComponent } from './components/modals/shelf-modal/shelf-modal.component';
import { NotebookModalComponent } from './components/modals/notebook-modal/notebook-modal.component';
import { SectionModalComponent } from './components/modals/section-modal/section-modal.component';
import { TemplateBrowserModalComponent } from './components/modals/template-browser-modal/template-browser-modal.component';
import { TemplateBuilderModalComponent } from './components/modals/template-builder-modal/template-builder-modal.component';
import { TemplateDefinition } from './services/template.service';
import { LoreIconComponent } from './components/lore-icon/lore-icon.component';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    SidebarComponent,
    TopbarComponent,
    ContentAreaComponent,
    EditPanelComponent,
    SettingsPanelComponent,
    ShelfModalComponent,
    NotebookModalComponent,
    SectionModalComponent,
    TemplateBrowserModalComponent,
    TemplateBuilderModalComponent,
    LoreIconComponent,
    ChatPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private templateService = inject(TemplateService);
  private exportImport = inject(ExportImportService);
  private drive = inject(DriveService);

  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  isLoggedIn = false;
  displayName = '';
  syncStatus: SyncStatus = 'idle';
  get isLocalMode(): boolean { return this.auth.isLocalMode; }
  state$!: Observable<AppState>;
  readonly sectionColors: SectionColorMap = SECTION_COLORS;

  // Modal state
  showShelfModal = false;
  editingShelf: Shelf | null = null;

  showNotebookModal = false;
  editingNotebook: Notebook | null = null;
  notebookTargetShelfId = '';

  showSectionModal = false;
  editingSection: Section | null = null;

  showTemplateBrowserModal = false;

  showTemplateBuilderModal = false;
  editingTemplate: CustomTemplate | null = null;

  // Panel state
  isEditPanelOpen = false;
  editingNote: Note | null = null;
  editingNoteSection: Section | null = null;

  isSettingsPanelOpen = false;

  isChatPanelOpen = false;

  // Search
  searchQuery = '';

  // Import context: 'shelf' | 'notebook' | 'template'
  private importContext: 'shelf' | 'notebook' | 'template' = 'template';

  // Export format picker
  showExportModal = false;
  exportTarget: { type: 'shelf' | 'notebook'; shelf?: Shelf; notebook?: Notebook } | null = null;

  // Shelf picker for notebook import
  showShelfPickerModal = false;
  shelfPickerShelves: Shelf[] = [];
  private pendingNotebookImportJson: unknown = null;

  private sub!: Subscription;

  private sessionRestored = false;

  ngOnInit(): void {
    this.applyStoredAppearance();
    this.registerWindowHelpers();
    this.state$ = this.data.state$;

    // Check if there's already a session before subscribing
    // (isLoggedIn$ fires synchronously from BehaviorSubject)
    this.sessionRestored = this.auth.isLoggedIn$.getValue();

    this.sub = this.auth.isLoggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (!loggedIn) {
        this.displayName = '';
        this.drive.clearToken();
        this.sessionRestored = false;
      } else if (this.sessionRestored) {
        // Page reload with existing session — load from localStorage immediately
        // so the UI isn't blank, then sync from Drive in background
        const user = this.auth.getCurrentUser();
        if (user) {
          this.displayName = user.name;
          this.data.setCurrentUser(user.username);
          this.data.loadAll(user.username);
          if (this.data.getState().shelves.length === 0) {
            this.data.seedDemoData();
          }
          // For Google users: re-acquire Drive token silently and sync from Drive
          if (!this.auth.isLocalMode) {
            this.drive.requestTokenSilent()
              .then(() => this.drive.load())
              .then(driveData => {
                if (driveData?.state) {
                  console.log('[App] session restore: loaded from Drive');
                  this.data.loadFromObject(driveData.state);
                  if (Array.isArray(driveData.customTemplates)) {
                    localStorage.setItem('lore_custom_templates', JSON.stringify(driveData.customTemplates));
                  }
                }
              })
              .catch(e => console.warn('[App] session restore: Drive sync skipped (silent token failed):', e));
          }
        }
      }
      // Fresh login: loadUserData() is called via (tokenReady) output after token is ready
    });    this.drive.syncStatus$.subscribe(s => this.syncStatus = s);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Called by LoginComponent after Drive token is obtained (or local login). */
  async loadUserData(): Promise<void> {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.displayName = user.name;
    this.data.setCurrentUser(user.username);

    if (this.auth.isLocalMode) {
      // Local mode: load from localStorage only, skip Drive
      this.data.loadAll(user.username);
      if (this.data.getState().shelves.length === 0) {
        this.data.seedDemoData();
      }
      return;
    }

    const driveData = await this.drive.load();
    if (driveData?.state) {
      this.data.loadFromObject(driveData.state);
      if (Array.isArray(driveData.customTemplates)) {
        localStorage.setItem('lore_custom_templates', JSON.stringify(driveData.customTemplates));
      }
    } else {
      this.data.loadAll(user.username);
    }

    if (this.data.getState().shelves.length === 0) {
      this.data.seedDemoData();
    }
  }

  // ── State helpers ─────────────────────────────────────────────────────────

  getActiveNotebook(state: AppState): Notebook | null {
    if (!state.activeNotebookId) return null;
    return state.notebooks.find(nb => nb.id === state.activeNotebookId) ?? null;
  }

  getActiveShelfName(state: AppState): string {
    const nb = this.getActiveNotebook(state);
    if (!nb) return '';
    return state.shelves.find(sh => sh.id === nb.shelfId)?.name ?? '';
  }

  getActiveNotebookName(state: AppState): string {
    return this.getActiveNotebook(state)?.name ?? '';
  }

  getActiveNotebookIcon(state: AppState): string {
    return this.getActiveNotebook(state)?.icon ?? '';
  }

  getCustomTemplates(): CustomTemplate[] {
    return this.templateService.getCustomTemplates();
  }

  getAllTemplates(): TemplateDefinition[] {
    return this.templateService.getTemplates();
  }

  // ── Sidebar events ────────────────────────────────────────────────────────

  onNotebookSelected(): void {
    // DataService.setActiveNotebook is called inside SidebarComponent
  }

  onAddShelf(): void {
    this.editingShelf = null;
    this.showShelfModal = true;
  }

  onAddNotebook(shelf: Shelf): void {
    this.editingNotebook = null;
    this.notebookTargetShelfId = shelf.id;
    this.showNotebookModal = true;
  }

  onEditShelf(shelf: Shelf): void {
    this.editingShelf = shelf;
    this.showShelfModal = true;
  }

  onEditNotebook(notebook: Notebook): void {
    this.editingNotebook = notebook;
    this.notebookTargetShelfId = notebook.shelfId;
    this.showNotebookModal = true;
  }

  onOpenSettings(): void {
    this.isSettingsPanelOpen = true;
  }

  onOpenChat(): void {
    this.isChatPanelOpen = true;
  }

  onOpenTemplates(): void {
    this.showTemplateBrowserModal = true;
  }

  onOpenTemplateBuilder(): void {
    this.editingTemplate = null;
    this.showTemplateBuilderModal = true;
  }

  onOpenImportTemplate(): void {
    this.importContext = 'template';
    this.showTemplateBrowserModal = false;
    setTimeout(() => this.importFileInput?.nativeElement.click(), 50);
  }

  onImportShelf(): void {
    this.importContext = 'shelf';
    setTimeout(() => this.importFileInput?.nativeElement.click(), 50);
  }

  onImportNotebook(): void {
    this.importContext = 'notebook';
    setTimeout(() => this.importFileInput?.nativeElement.click(), 50);
  }

  onExportShelf(shelf: Shelf): void {
    this.exportTarget = { type: 'shelf', shelf };
    this.showExportModal = true;
  }

  onExportNotebook(notebook: Notebook): void {
    this.exportTarget = { type: 'notebook', notebook };
    this.showExportModal = true;
  }

  onExportFormatSelected(format: 'json' | 'html'): void {
    this.showExportModal = false;
    if (!this.exportTarget) return;
    if (this.exportTarget.type === 'shelf' && this.exportTarget.shelf) {
      format === 'html'
        ? this.exportImport.exportShelfAsHtml(this.exportTarget.shelf)
        : this.exportImport.exportShelf(this.exportTarget.shelf);
    } else if (this.exportTarget.type === 'notebook' && this.exportTarget.notebook) {
      format === 'html'
        ? this.exportImport.exportNotebookAsHtml(this.exportTarget.notebook)
        : this.exportImport.exportNotebook(this.exportTarget.notebook);
    }
    this.exportTarget = null;
  }

  onExportModalCancelled(): void {
    this.showExportModal = false;
    this.exportTarget = null;
  }

  onShelfPickerSelected(shelfId: string): void {
    this.showShelfPickerModal = false;
    if (!this.pendingNotebookImportJson) return;
    try {
      const newNbId = this.exportImport.importNotebook(this.pendingNotebookImportJson, shelfId);
      this.data.setActiveNotebook(newNbId);
      this.data.showToast('Notebook imported successfully.');
    } catch {
      // toast already shown by service
    }
    this.pendingNotebookImportJson = null;
  }

  onShelfPickerCancelled(): void {
    this.showShelfPickerModal = false;
    this.pendingNotebookImportJson = null;
  }

  // ── Topbar events ─────────────────────────────────────────────────────────

  onSearchChanged(query: string): void {
    this.searchQuery = query;
  }

  onSaveNow(): void {
    if (this.auth.isLocalMode) {
      // Local mode: data is already saved to localStorage on every mutation
      this.data.showToast('✓ Saved locally');
      return;
    }
    this.drive.save({
      state: this.data.getState(),
      customTemplates: JSON.parse(localStorage.getItem('lore_custom_templates') || '[]'),
    });
  }

  onAddSection(): void {
    this.editingSection = null;
    this.showSectionModal = true;
  }

  onAddNote(section: Section | null): void {
    this.editingNote = null;
    this.editingNoteSection = section;
    this.isEditPanelOpen = true;
  }

  // ── ContentArea events ────────────────────────────────────────────────────

  onEditNote(event: { note: Note; section: Section }): void {
    this.editingNote = event.note;
    this.editingNoteSection = event.section;
    this.isEditPanelOpen = true;
  }

  onDeleteNote(event: { note: Note; section: Section }, state: AppState): void {
    const nb = this.getActiveNotebook(state);
    if (!nb) return;
    this.data.deleteNote(nb.id, event.section.id, event.note.id);
  }

  onEditSection(section: Section): void {
    this.editingSection = section;
    this.showSectionModal = true;
  }

  onDeleteSection(section: Section, state: AppState): void {
    const nb = this.getActiveNotebook(state);
    if (!nb) return;
    this.data.deleteSection(nb.id, section.id);
  }

  onSearchCleared(): void {
    this.searchQuery = '';
  }

  // ── EditPanel events ──────────────────────────────────────────────────────

  onNoteSaved(payload: { title: string; templateId: string; data: Record<string, any> }, state: AppState): void {
    const nb = this.getActiveNotebook(state);
    if (!nb) return;

    const sectionId = this.editingNoteSection?.id ?? nb.sections[0]?.id;
    if (!sectionId) return;

    if (this.editingNote) {
      this.data.updateNote(nb.id, sectionId, this.editingNote.id, payload.title, payload.templateId, payload.data);
    } else {
      this.data.addNote(nb.id, sectionId, payload.title, payload.templateId, payload.data);
    }
    this.isEditPanelOpen = false;
    this.editingNote = null;
    this.editingNoteSection = null;
  }

  onNoteDeleted(state: AppState): void {
    if (!this.editingNote || !this.editingNoteSection) return;
    const nb = this.getActiveNotebook(state);
    if (!nb) return;
    this.data.deleteNote(nb.id, this.editingNoteSection.id, this.editingNote.id);
    this.isEditPanelOpen = false;
    this.editingNote = null;
    this.editingNoteSection = null;
  }

  onEditPanelClosed(): void {
    this.isEditPanelOpen = false;
    this.editingNote = null;
    this.editingNoteSection = null;
  }

  // ── SettingsPanel events ──────────────────────────────────────────────────

  onSettingsClosed(): void {
    this.isSettingsPanelOpen = false;
  }

  async onDriveReconnected(): Promise<void> {
    // User reconnected Drive from settings — load latest data from Drive
    const driveData = await this.drive.load();
    if (driveData?.state) {
      this.data.loadFromObject(driveData.state);
      if (Array.isArray(driveData.customTemplates)) {
        localStorage.setItem('lore_custom_templates', JSON.stringify(driveData.customTemplates));
      }
      this.data.showToast('✓ Synced from Google Drive');
    }
  }

  onThemeChanged(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.data.updateTheme(theme);
  }

  onFontSizeChanged(size: number): void {
    document.documentElement.style.setProperty('--fs', `${size}px`);
    this.data.updateFontSize(size);
  }

  onNameChanged(name: string): void {
    this.displayName = name;
    this.data.updateUserName(name);
  }

  onTemplateDeleted(id: string): void {
    this.templateService.deleteCustomTemplate(id);
  }

  onTemplateEdited(tpl: CustomTemplate): void {
    this.editingTemplate = tpl;
    this.isSettingsPanelOpen = false;
    this.showTemplateBuilderModal = true;
  }

  onLogout(): void {
    this.auth.logout();
  }

  // ── Shelf Modal events ────────────────────────────────────────────────────

  onShelfSaved(payload: { name: string; icon: string }): void {
    if (this.editingShelf) {
      this.data.updateShelf(this.editingShelf.id, payload.name, payload.icon);
    } else {
      this.data.addShelf(payload.name, payload.icon);
    }
    this.showShelfModal = false;
    this.editingShelf = null;
  }

  onShelfDeleted(): void {
    if (this.editingShelf) {
      this.data.deleteShelf(this.editingShelf.id);
    }
    this.showShelfModal = false;
    this.editingShelf = null;
  }

  onShelfCancelled(): void {
    this.showShelfModal = false;
    this.editingShelf = null;
  }

  // ── Notebook Modal events ─────────────────────────────────────────────────

  onNotebookSaved(payload: { name: string; icon: string; shelfId: string }): void {
    if (this.editingNotebook) {
      this.data.updateNotebook(this.editingNotebook.id, payload.name, payload.icon);
    } else {
      this.data.addNotebook(payload.name, payload.icon, payload.shelfId);
    }
    this.showNotebookModal = false;
    this.editingNotebook = null;
  }

  onNotebookDeleted(): void {
    if (this.editingNotebook) {
      this.data.deleteNotebook(this.editingNotebook.id);
    }
    this.showNotebookModal = false;
    this.editingNotebook = null;
  }

  onNotebookCancelled(): void {
    this.showNotebookModal = false;
    this.editingNotebook = null;
  }

  // ── Section Modal events ──────────────────────────────────────────────────

  onSectionSaved(payload: { title: string; subtitle: string; color: string }, state: AppState): void {
    const nb = this.getActiveNotebook(state);
    if (!nb) return;
    if (this.editingSection) {
      this.data.updateSection(nb.id, this.editingSection.id, payload.title, payload.subtitle, payload.color);
    } else {
      this.data.addSection(nb.id, payload.title, payload.subtitle, payload.color);
    }
    this.showSectionModal = false;
    this.editingSection = null;
  }

  onSectionDeleted(state: AppState): void {
    if (!this.editingSection) return;
    const nb = this.getActiveNotebook(state);
    if (!nb) return;
    this.data.deleteSection(nb.id, this.editingSection.id);
    this.showSectionModal = false;
    this.editingSection = null;
  }

  onSectionCancelled(): void {
    this.showSectionModal = false;
    this.editingSection = null;
  }

  // ── Template Browser Modal events ─────────────────────────────────────────

  onTemplateBrowserSelected(_templateId: string): void {
    this.showTemplateBrowserModal = false;
  }

  onTemplateBrowserCancelled(): void {
    this.showTemplateBrowserModal = false;
  }

  onBuildTemplate(): void {
    this.showTemplateBrowserModal = false;
    this.editingTemplate = null;
    this.showTemplateBuilderModal = true;
  }

  // ── Template Builder Modal events ─────────────────────────────────────────

  onTemplateBuilderSaved(template: CustomTemplate): void {
    this.templateService.saveCustomTemplate(template);
    this.showTemplateBuilderModal = false;
    this.editingTemplate = null;
  }

  onTemplateBuilderCancelled(): void {
    this.showTemplateBuilderModal = false;
    this.editingTemplate = null;
  }

  // ── Import file handling ──────────────────────────────────────────────────

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (this.importContext === 'template') {
          this.exportImport.importTemplate(json);
          this.data.showToast('Template imported successfully.');
        } else if (this.importContext === 'shelf') {
          const newShelfId = this.exportImport.importShelf(json);
          this.data.showToast('Shelf imported successfully.');
          // Activate first notebook of the imported shelf
          const state = this.data.getState();
          const firstNb = state.notebooks.find(nb => nb.shelfId === newShelfId);
          if (firstNb) this.data.setActiveNotebook(firstNb.id);
        } else if (this.importContext === 'notebook') {
          const state = this.data.getState();
          if (state.shelves.length === 0) {
            this.data.showToast('Create a shelf first before importing a notebook.');
          } else if (state.shelves.length === 1) {
            const newNbId = this.exportImport.importNotebook(json, state.shelves[0].id);
            this.data.setActiveNotebook(newNbId);
            this.data.showToast('Notebook imported successfully.');
          } else {
            // Show shelf picker
            this.pendingNotebookImportJson = json;
            this.shelfPickerShelves = state.shelves;
            this.showShelfPickerModal = true;
          }
        }
      } catch (err: any) {
        if (err?.message && !err.message.startsWith('Invalid')) {
          this.data.showToast('Import failed: invalid JSON file.');
        }
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private applyStoredAppearance(): void {
    try {
      const cu = localStorage.getItem('lore_cu') || '';
      if (!cu) return;
      const raw = localStorage.getItem('lore_users');
      if (!raw) return;
      const users = JSON.parse(raw);
      const userData = users[cu]?.data;
      if (!userData) return;
      const html = document.documentElement;
      if (userData.theme && typeof userData.theme === 'string') {
        html.setAttribute('data-theme', userData.theme);
      }
      if (userData.fontSize && typeof userData.fontSize === 'number') {
        html.style.setProperty('--fs', `${userData.fontSize}px`);
      }
    } catch {
      // Silently ignore — defaults apply via CSS
    }
  }

  private registerWindowHelpers(): void {
    const w = window as any;

    w.addRow = (cId: string, ph: string) => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<input class="fin" placeholder="${ph}"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById(cId)?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addLinkRow = (cId: string, ph1: string, ph2: string) => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<input class="fin" placeholder="${ph1}" style="flex:1"><input class="fin" placeholder="${ph2}" style="flex:2"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById(cId)?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addAmtRow = (cId: string, ph: string) => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<input class="fin" placeholder="${ph}" style="flex:1"><input class="amt-in" placeholder="₹ 0"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById(cId)?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addWatchRow = () => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.style.cssText = 'align-items:center;gap:5px';
      d.innerHTML = `<input class="fin" placeholder="Movie / Show title" style="flex:2"><select class="fsel" style="width:100px"><option>Movie</option><option>Series</option><option>Documentary</option><option>Short Film</option></select><input class="fin" placeholder="Netflix…" style="width:85px"><input class="fin" placeholder="★ 1-5" style="width:50px"><label class="tog"><input type="checkbox"><span class="tog-tr"></span></label><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('f_items')?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addActionRow = () => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<input class="fin" placeholder="Action item…" style="flex:2"><input class="fin" placeholder="@Owner" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('f_actions')?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addTickerRow = () => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<input class="fin" placeholder="TICKER" style="width:72px"><input class="fin" placeholder="₹ / $" style="width:80px"><select class="fsel" style="width:78px"><option value="up">↑ Up</option><option value="down">↓ Down</option><option value="flat" selected>→ Flat</option></select><input class="fin" placeholder="Brief thesis…" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('f_watchlist')?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addTradeRow = () => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<input class="fin" placeholder="TICKER" style="width:72px"><select class="fsel" style="width:75px"><option>BUY</option><option>SELL</option><option>HOLD</option></select><input class="fin" placeholder="Price" style="width:80px"><input class="fin" placeholder="Qty" style="width:58px"><input class="fin" placeholder="Reason…" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('f_trades')?.appendChild(d);
      (d.querySelector('input') as HTMLInputElement)?.focus();
    };

    w.addChecklistRow = (cId: string, ph: string) => {
      const d = document.createElement('div');
      d.className = 'irow';
      d.innerHTML = `<label class="tog"><input type="checkbox"><span class="tog-tr"></span></label><input class="fin" placeholder="${ph}" style="flex:1"><button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById(cId)?.appendChild(d);
      (d.querySelector('input.fin') as HTMLInputElement)?.focus();
    };
  }
}
