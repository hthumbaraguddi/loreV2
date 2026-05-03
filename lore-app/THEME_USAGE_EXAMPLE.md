# Theme Usage Examples

## Basic Theme Toggle Component

Here's how to create a simple theme toggle button:

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from '@app/core';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button 
      (click)="toggleTheme()"
      class="theme-toggle"
      [attr.aria-label]="'Switch to ' + (isDark() ? 'light' : 'dark') + ' theme'">
      <span class="material-symbols-outlined">
        {{ isDark() ? 'light_mode' : 'dark_mode' }}
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: var(--r-md);
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--t2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--lore-anim-duration-fast) var(--lore-anim-ease-standard);
    }

    .theme-toggle:hover {
      background: var(--lore-color-state-hover);
      color: var(--t1);
      border-color: var(--border2);
    }

    .theme-toggle:active {
      background: var(--lore-color-state-active);
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  isDark() {
    return this.themeService.appliedTheme() === 'dark';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

## Theme Selector with Three Options

For a more complete theme selector (light/dark/system):

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, type Theme } from '@app/core';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-selector">
      <label class="theme-label">Theme</label>
      <div class="theme-options">
        <button
          *ngFor="let option of themeOptions"
          (click)="selectTheme(option.value)"
          [class.active]="currentTheme() === option.value"
          class="theme-option">
          <span class="material-symbols-outlined">{{ option.icon }}</span>
          <span class="theme-option-label">{{ option.label }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .theme-selector {
      display: flex;
      flex-direction: column;
      gap: var(--lore-space-8);
    }

    .theme-label {
      font-size: var(--lore-font-size-sm);
      font-weight: 500;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .theme-options {
      display: flex;
      gap: var(--lore-space-8);
    }

    .theme-option {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--lore-space-4);
      padding: var(--lore-space-12);
      border-radius: var(--r-md);
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--t3);
      cursor: pointer;
      transition: all var(--lore-anim-duration-fast) var(--lore-anim-ease-standard);
    }

    .theme-option:hover {
      background: var(--lore-color-state-hover);
      border-color: var(--border2);
      color: var(--t2);
    }

    .theme-option.active {
      background: var(--lore-color-accent-bg);
      border-color: var(--lore-color-accent);
      color: var(--lore-color-accent);
    }

    .theme-option-label {
      font-size: var(--lore-font-size-sm);
      font-weight: 500;
    }

    .material-symbols-outlined {
      font-size: 20px;
    }
  `]
})
export class ThemeSelectorComponent {
  private themeService = inject(ThemeService);

  themeOptions = [
    { value: 'light' as Theme, label: 'Light', icon: 'light_mode' },
    { value: 'dark' as Theme, label: 'Dark', icon: 'dark_mode' },
    { value: 'system' as Theme, label: 'System', icon: 'computer' }
  ];

  currentTheme() {
    return this.themeService.getThemePreference();
  }

  selectTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }
}
```

## Using Theme in Component Logic

If you need to react to theme changes in your component logic:

```typescript
import { Component, inject, effect } from '@angular/core';
import { ThemeService } from '@app/core';

@Component({
  selector: 'app-my-component',
  template: `...`
})
export class MyComponent {
  private themeService = inject(ThemeService);

  constructor() {
    // React to theme changes
    effect(() => {
      const theme = this.themeService.appliedTheme();
      console.log('Theme changed to:', theme);
      
      // Do something based on theme
      if (theme === 'dark') {
        // Dark theme specific logic
      } else {
        // Light theme specific logic
      }
    });
  }
}
```

## Styling Components for Both Themes

Always use CSS custom properties that automatically adapt to the theme:

```scss
.my-component {
  // ✅ Good - uses theme-aware tokens
  background: var(--surface);
  color: var(--t1);
  border: 1px solid var(--border);
  
  // ❌ Bad - hardcoded colors
  background: #FFFFFF;
  color: #000000;
  border: 1px solid #E5E5E5;
}

.my-button {
  // ✅ Good - uses semantic tokens
  background: var(--lore-color-accent);
  color: var(--lore-color-text-on-accent);
  
  &:hover {
    background: var(--lore-color-accent-hover);
  }
}

.my-card {
  // ✅ Good - uses theme-aware shadows
  box-shadow: var(--shadow-card);
  border-radius: var(--r-lg);
  
  // ❌ Bad - hardcoded shadow
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Adding Theme Transition

For smooth theme transitions, add this to your global styles:

```scss
// In styles.scss
* {
  transition: 
    background-color var(--lore-anim-duration-theme) var(--lore-anim-ease-standard),
    border-color var(--lore-anim-duration-theme) var(--lore-anim-ease-standard),
    color var(--lore-anim-duration-theme) var(--lore-anim-ease-standard);
}

// Disable transitions for elements that shouldn't animate
.no-theme-transition,
.no-theme-transition * {
  transition: none !important;
}
```

## Testing Both Themes

When developing components, always test in both themes:

```typescript
// In your component's spec file
import { ThemeService } from '@app/core';

describe('MyComponent', () => {
  let themeService: ThemeService;

  beforeEach(() => {
    themeService = TestBed.inject(ThemeService);
  });

  it('should render correctly in light theme', () => {
    themeService.setTheme('light');
    // Test light theme rendering
  });

  it('should render correctly in dark theme', () => {
    themeService.setTheme('dark');
    // Test dark theme rendering
  });
});
```

## Keyboard Shortcut for Theme Toggle

Add a keyboard shortcut for quick theme switching:

```typescript
import { Component, HostListener, inject } from '@angular/core';
import { ThemeService } from '@app/core';

@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent {
  private themeService = inject(ThemeService);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Cmd/Ctrl + Shift + D to toggle theme
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      this.themeService.toggleTheme();
    }
  }
}
```

## Integration with Settings Panel

Add theme selector to your settings panel:

```typescript
import { Component } from '@angular/core';
import { ThemeSelectorComponent } from './theme-selector.component';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [ThemeSelectorComponent],
  template: `
    <div class="settings-panel">
      <section class="settings-section">
        <h2 class="settings-section-title">Appearance</h2>
        <app-theme-selector />
      </section>
      
      <!-- Other settings sections -->
    </div>
  `
})
export class SettingsPanelComponent {}
```

## Best Practices

1. **Always use CSS custom properties** for colors, never hardcode
2. **Test in both themes** before committing
3. **Use semantic tokens** (--lore-color-*) over short aliases when possible
4. **Provide theme toggle** in an accessible location (settings, toolbar)
5. **Add keyboard shortcut** for power users
6. **Consider system theme** as default for new users
7. **Persist theme preference** (handled automatically by ThemeService)
8. **Add smooth transitions** for better UX
9. **Test contrast ratios** in both themes for accessibility
10. **Document theme-specific behavior** in component comments
