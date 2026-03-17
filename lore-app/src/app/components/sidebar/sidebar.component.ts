import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppState, Shelf, Notebook } from '../../models';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LoreIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() state!: AppState;
  @Input() displayName: string = '';

  @Output() notebookSelected = new EventEmitter<Notebook>();
  @Output() addShelf = new EventEmitter<void>();
  @Output() addNotebook = new EventEmitter<Shelf>();
  @Output() editShelf = new EventEmitter<Shelf>();
  @Output() editNotebook = new EventEmitter<Notebook>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() openTemplates = new EventEmitter<void>();
  @Output() openTemplateBuilder = new EventEmitter<void>();
  @Output() openImportTemplate = new EventEmitter<void>();
  @Output() importShelf = new EventEmitter<void>();
  @Output() importNotebook = new EventEmitter<void>();
  @Output() exportShelf = new EventEmitter<Shelf>();
  @Output() exportNotebook = new EventEmitter<Notebook>();

  private data = inject(DataService);
  private auth = inject(AuthService);

  isMobileOpen = false;

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  get userInitial(): string {
    const name = this.displayName || this.auth.getCurrentUser()?.name || '';
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  get resolvedDisplayName(): string {
    return this.displayName || this.auth.getCurrentUser()?.name || 'User';
  }

  getNotebooksForShelf(shelfId: string): Notebook[] {
    return this.state?.notebooks?.filter(nb => nb.shelfId === shelfId) ?? [];
  }

  isActiveNotebook(notebookId: string): boolean {
    return this.state?.activeNotebookId === notebookId;
  }

  onToggleSidebar(): void {
    if (this.isMobile) {
      this.isMobileOpen = !this.isMobileOpen;
    } else {
      this.data.toggleSidebar();
    }
  }

  closeMobileSidebar(): void {
    this.isMobileOpen = false;
  }

  onToggleShelf(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.data.toggleShelf(shelf.id);
  }

  onSelectNotebook(notebook: Notebook): void {
    this.data.setActiveNotebook(notebook.id);
    this.notebookSelected.emit(notebook);
    // Close drawer on mobile after selecting a notebook
    if (this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  onAddShelf(): void {
    this.addShelf.emit();
  }

  onAddNotebook(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.addNotebook.emit(shelf);
  }

  onEditShelf(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.editShelf.emit(shelf);
  }

  onEditNotebook(notebook: Notebook, event: Event): void {
    event.stopPropagation();
    this.editNotebook.emit(notebook);
  }

  onOpenSettings(): void {
    this.openSettings.emit();
  }

  onOpenTemplates(): void {
    this.openTemplates.emit();
  }

  onOpenTemplateBuilder(): void {
    this.openTemplateBuilder.emit();
  }

  onOpenImportTemplate(): void {
    this.openImportTemplate.emit();
  }

  onImportShelf(): void {
    this.importShelf.emit();
  }

  onImportNotebook(): void {
    this.importNotebook.emit();
  }

  onExportShelf(shelf: Shelf, event: Event): void {
    event.stopPropagation();
    this.exportShelf.emit(shelf);
  }

  onExportNotebook(notebook: Notebook, event: Event): void {
    event.stopPropagation();
    this.exportNotebook.emit(notebook);
  }
}
