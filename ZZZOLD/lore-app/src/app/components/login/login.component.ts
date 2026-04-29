import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { GistSyncService, GITHUB_CLIENT_ID } from '../../services/gist-sync.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';
import { APP_VERSION } from '../../version';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoreIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private gistSync = inject(GistSyncService);

  @Output() tokenReady = new EventEmitter<void>();

  readonly appVersion = APP_VERSION;
  readonly githubConfigured = !!GITHUB_CLIENT_ID;
  errorMessage = '';

  ngOnInit(): void {}

  loginWithGitHub(): void {
    this.gistSync.startOAuth();
    // Page will redirect to GitHub — no further action needed here.
    // On return, app.component.ts handles the ?code= callback.
  }

  loginLocally(): void {
    this.auth.loginLocal();
    this.tokenReady.emit();
  }
}
