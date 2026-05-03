import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { StorageSyncService } from '../../core/services/storage-sync.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'lore-landing',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private storageSyncService = inject(StorageSyncService);

  /**
   * Navigate to app with GitHub auth
   * This will initiate GitHub OAuth flow and fetch data from Gist
   */
  async continueWithGitHub(): Promise<void> {
    try {
      // Set storage tier to GitHub
      this.storageSyncService.setStorageTier('github');
      
      // Initiate GitHub sign-in (OAuth flow)
      await this.storageSyncService.signInWithGitHub();
      
      // Navigate to the app
      this.router.navigate(['/notes']);
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      // TODO: Show error message to user
    }
  }

  /**
   * Navigate to app with local storage
   * This will load data from browser's local storage/IndexedDB
   */
  useLocally(): void {
    // Set storage tier to local
    this.storageSyncService.setStorageTier('local');
    
    // Navigate to the app
    this.router.navigate(['/notes']);
  }

  /**
   * Get current theme for styling
   */
  isDark(): boolean {
    return this.themeService.appliedTheme() === 'dark';
  }
}
