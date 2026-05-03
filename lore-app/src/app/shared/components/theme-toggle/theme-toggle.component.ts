import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'lore-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="'Switch to ' + (themeService.appliedTheme() === 'dark' ? 'light' : 'dark') + ' theme'"
      [title]="'Switch to ' + (themeService.appliedTheme() === 'dark' ? 'light' : 'dark') + ' theme (⌘⇧D)'"
    >
      <span class="material-symbols-outlined">
        {{ themeService.appliedTheme() === 'light' ? 'dark_mode' : 'light_mode' }}
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      width: 32px;
      height: 32px;
      border-radius: var(--r-sm);
      background: transparent;
      border: none;
      color: var(--t3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--lore-anim-duration-fast) var(--lore-anim-ease-standard);
      padding: 0;
    }

    .theme-toggle:hover {
      background: var(--lore-color-state-hover);
      color: var(--t1);
    }

    .theme-toggle:active {
      background: var(--lore-color-state-active);
    }

    .material-symbols-outlined {
      font-size: 18px;
    }
  `]
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
