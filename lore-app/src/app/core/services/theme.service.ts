import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal to track the current theme preference
  private themePreference = signal<Theme>('light');
  
  // Signal to track the actual applied theme (resolves 'system' to 'light' or 'dark')
  public appliedTheme = signal<'light' | 'dark'>('light');

  constructor() {
    // Load theme preference from localStorage
    this.loadThemePreference();
    
    // Set up effect to apply theme when preference changes
    effect(() => {
      const preference = this.themePreference();
      this.applyTheme(preference);
    });
    
    // Listen for system theme changes
    this.setupSystemThemeListener();
  }

  /**
   * Get the current theme preference
   */
  getThemePreference(): Theme {
    return this.themePreference();
  }

  /**
   * Set the theme preference
   */
  setTheme(theme: Theme): void {
    this.themePreference.set(theme);
    localStorage.setItem('lore-theme', theme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const current = this.themePreference();
    // Always toggle between light and dark (ignore system)
    if (current === 'dark') {
      this.setTheme('light');
    } else {
      this.setTheme('dark');
    }
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    const stored = localStorage.getItem('lore-theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      this.themePreference.set(stored);
    } else {
      // Default to light theme
      this.themePreference.set('light');
    }
  }

  /**
   * Apply the theme to the document
   */
  private applyTheme(theme: Theme): void {
    const htmlElement = document.documentElement;
    
    if (theme === 'system') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolvedTheme = systemPrefersDark ? 'dark' : 'light';
      htmlElement.setAttribute('data-theme', resolvedTheme);
      this.appliedTheme.set(resolvedTheme);
    } else {
      // Use explicit theme
      htmlElement.setAttribute('data-theme', theme);
      this.appliedTheme.set(theme);
    }
  }

  /**
   * Listen for system theme changes
   */
  private setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Only react if current preference is 'system'
      if (this.themePreference() === 'system') {
        const resolvedTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        this.appliedTheme.set(resolvedTheme);
      }
    });
  }
}
