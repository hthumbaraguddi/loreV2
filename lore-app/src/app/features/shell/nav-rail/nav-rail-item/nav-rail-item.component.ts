import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavItem } from '../../../../core/models/nav-item.model';

@Component({
  selector: 'lore-nav-rail-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-rail-item.component.html',
  styleUrl: './nav-rail-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavRailItemComponent {
  // Inputs
  readonly item = input.required<NavItem>();
  readonly active = input<boolean>(false);

  // Outputs
  readonly selected = output<void>();

  // Computed
  readonly showBadge = computed(() => {
    const count = this.item().badgeCount;
    return count !== undefined && count > 0;
  });

  readonly badgeText = computed(() => {
    const count = this.item().badgeCount ?? 0;
    return count > 99 ? '99+' : count.toString();
  });

  /**
   * Handle click event
   */
  onClick(): void {
    this.selected.emit();
  }

  /**
   * Handle keyboard events
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selected.emit();
    }
  }
}
