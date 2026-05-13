import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { NavItem } from '../../../core/models/nav-item.model';
import { NavRailItemComponent } from './nav-rail-item/nav-rail-item.component';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { LayoutService } from '../../../core/services/layout.service';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'lore-nav-rail',
  standalone: true,
  imports: [CommonModule, NavRailItemComponent, ThemeToggleComponent],
  templateUrl: './nav-rail.component.html',
  styleUrl: './nav-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavRailComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly searchService = inject(SearchService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly items = input.required<NavItem[]>();

  // Outputs
  readonly itemSelected = output<NavItem>();

  // State
  readonly activeId = signal<string>('notes');

  // Computed: Split items into main and bottom groups
  readonly mainItems = computed(() => {
    const allItems = this.items();
    // Main items: notes, graph, html-notes, template-builder, ai-chat, prompts, tags
    return allItems.filter(item => 
      ['notes', 'graph', 'html-notes', 'template-builder', 'ai-chat', 'prompts', 'tags'].includes(item.id)
    );
  });

  readonly bottomItems = computed(() => {
    const allItems = this.items();
    // Bottom items: notifications, settings
    return allItems.filter(item => 
      ['notifications', 'settings'].includes(item.id)
    );
  });

  /** Effective active ID — merges route-based and panel-based active states */
  readonly effectiveActiveId = computed(() => {
    const panel = this.layoutService.activeRightPanel();
    if (panel === 'ai-chat') return 'ai-chat';
    if (panel === 'notifications') return 'notifications';
    return this.activeId();
  });

  ngOnInit(): void {
    // Subscribe to router events to update active item
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateActiveFromUrl(event.urlAfterRedirects);
      });

    // Set initial active state
    this.updateActiveFromUrl(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update active item based on current URL
   */
  private updateActiveFromUrl(url: string): void {
    const segment = url.split('/')[1] || 'notes';
    
    // Map URL segments to nav item IDs
    const urlToIdMap: Record<string, string> = {
      'notes': 'notes',
      'graph': 'graph',
      'html-notes': 'html-notes',
      'template-builder': 'template-builder',
      'prompts': 'prompts',
      'tags': 'tags',
      'settings': 'settings'
    };

    const activeId = urlToIdMap[segment] || 'notes';
    this.activeId.set(activeId);
  }

  /**
   * Handle item selection
   */
  onItemSelect(item: NavItem): void {
    this.itemSelected.emit(item);
    
    // Update active state for route-based items
    if (item.route) {
      this.activeId.set(item.id);
    }
  }

  /**
   * Handle search button click
   */
  onSearchClick(): void {
    this.searchService.openSearch();
  }
}
