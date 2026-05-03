import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal to track the current theme preference
  private themePreference = signal<Theme>('light');

  // Computed signal that resolves 'system' to the actual theme.
  // This is reactive — any component reading it will update automatically.
  public appliedTheme = computed<'light' | 'dark'>(() => {
    const pref = this.themePreference();
    if (pref === 'system') {
      return this.systemThemeIsDark() ? 'dark' : 'light';
    }
    return pref;
  });

  // Tracks the OS-level dark mode preference so appliedTheme recomputes on change
  private systemThemeIsDark = signal(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  constructor() {
    // Load saved preference and apply immediately
    this.loadThemePreference();
    this.applyToDom(this.appliedTheme());

    // Listen for OS-level theme changes
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
    // Eagerly apply to the DOM so it takes effect immediately
    this.applyToDom(this.appliedTheme());
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const current = this.appliedTheme();
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
      this.themePreference.set('light');
    }
  }

  /**
   * Set the data-theme attribute on <html>
   */
  private applyToDom(resolved: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', resolved);
  }

  /**
   * Listen for system theme changes
   */
  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this.systemThemeIsDark.set(e.matches);
      // If user chose 'system', re-apply the DOM attribute
      if (this.themePreference() === 'system') {
        this.applyToDom(this.appliedTheme());
      }
    });
  }
}

