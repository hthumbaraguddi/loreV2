import { Component, ChangeDetectionStrategy, inject, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { LayoutService } from '../../core/services/layout.service';
import { SearchService } from '../../core/services/search.service';
import { EditorService } from '../../core/services/editor.service';
import { TagService } from '../../core/services/tag.service';
import { NavItem } from '../../core/models/nav-item.model';
import { NavRailComponent } from './nav-rail/nav-rail.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { GlobalSearchComponent } from '../search/global-search/global-search.component';
import { ContextPanelComponent } from '../editor/context-panel/context-panel.component';

@Component({
  selector: 'lore-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavRailComponent, SidebarComponent, AiChatComponent, GlobalSearchComponent, ContextPanelComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  readonly layoutService = inject(LayoutService);
  readonly searchService = inject(SearchService);
  readonly editorService = inject(EditorService);
  private readonly tagService = inject(TagService);
  private readonly router = inject(Router);

  // Layout state
  readonly sidebarOpen = this.layoutService.sidebarOpen;
  readonly rightPanelOpen = this.layoutService.rightPanelOpen;
  readonly zenMode = this.layoutService.zenMode;

  // Navigation items
  readonly navItems: NavItem[] = [
    { id: 'notes', icon: 'description', label: 'Notes', route: '/notes' },
    { id: 'graph', icon: 'hub', label: 'Graph', route: '/graph' },
    { id: 'html-notes', icon: 'web', label: 'HTML Notes', route: '/html-notes' },
    { id: 'template-builder', icon: 'dashboard_customize', label: 'Template Builder', route: '/template-builder' },
    { id: 'ai-chat', icon: 'smart_toy', label: 'AI Chat', route: '' },
    { id: 'prompts', icon: 'library_books', label: 'Prompt Library', route: '/prompts' },
    { id: 'tags', icon: 'label', label: 'Tags', route: '/tags' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications', route: '' },
    { id: 'settings', icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  /**
   * Handle navigation item selection
   */
  onNavSelect(item: NavItem): void {
    if (item.route) {
      // Navigate to route
      this.router.navigate([item.route]);
    } else {
      // Handle action items (panels)
      switch (item.id) {
        case 'ai-chat':
          this.layoutService.toggleRightPanel('ai-chat');
          break;
        case 'notifications':
          this.layoutService.toggleRightPanel('notifications');
          break;
        case 'prompts':
          // TODO: Open prompts modal/panel in future phase
          console.log('Prompts feature coming in Phase 8');
          break;
      }
    }
  }

  /**
   * Global keyboard shortcuts
   */
  @HostListener('document:keydown.meta.k', ['$event'])
  @HostListener('document:keydown.ctrl.k', ['$event'])
  onGlobalSearch(event: KeyboardEvent): void {
    event.preventDefault();
    this.searchService.toggleSearch();
  }

  /**
   * Toggle context panel (⌘I / Ctrl+I)
   */
  @HostListener('document:keydown.meta.i', ['$event'])
  @HostListener('document:keydown.ctrl.i', ['$event'])
  onToggleContextPanel(event: KeyboardEvent): void {
    event.preventDefault();
    this.layoutService.toggleRightPanel('context-panel');
  }

  /**
   * Handle context panel close
   */
  onContextPanelClose(): void {
    this.layoutService.closeRightPanel();
  }

  /**
   * Handle tag added from context panel
   */
  onContextTagAdded(tag: string): void {
    const note = this.editorService.activeNoteObject();
    if (note) {
      this.tagService.addTagToNote(note, tag);
    }
  }

  /**
   * Handle tag removed from context panel
   */
  onContextTagRemoved(tag: string): void {
    const note = this.editorService.activeNoteObject();
    if (note) {
      this.tagService.removeTagFromNote(note, tag);
    }
  }

  /**
   * Handle navigation to a linked note
   */
  onNavigateToNote(noteId: string): void {
    this.editorService.openNoteInPane(noteId, this.editorService.activePane());
  }
}

