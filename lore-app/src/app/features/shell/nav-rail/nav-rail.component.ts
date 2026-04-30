import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { NavItem } from '../../../core/models/nav-item.model';
import { NavRailItemComponent } from './nav-rail-item/nav-rail-item.component';

@Component({
  selector: 'lore-nav-rail',
  standalone: true,
  imports: [CommonModule, NavRailItemComponent],
  templateUrl: './nav-rail.component.html',
  styleUrl: './nav-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavRailComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly items = input.required<NavItem[]>();

  // Outputs
  readonly itemSelected = output<NavItem>();

  // State
  readonly activeId = signal<string>('notes');

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
}
