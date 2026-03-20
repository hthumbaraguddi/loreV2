import { Component, inject, OnInit, NgZone, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DriveService } from '../../services/drive.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

declare const google: any;

const GOOGLE_CLIENT_ID = '20077195169-sookf9svl2i34t2lvbb2td9p01a4j05l.apps.googleusercontent.com';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoreIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private drive = inject(DriveService);
  private zone = inject(NgZone);

  @Output() tokenReady = new EventEmitter<void>();
  @Output() driveConnectNeeded = new EventEmitter<void>();

  errorMessage = '';
  driveConnecting = false;
  showDriveConnect = false;  // shown after Google sign-in if Drive token fails

  ngOnInit(): void {
    this.drive.init();
    this.initGoogleSignIn();
  }

  loginLocally(): void {
    this.auth.loginLocal();
    this.tokenReady.emit();
  }

  /** User explicitly clicks to authorize Drive — user gesture bypasses Safari popup block */
  async connectDrive(): Promise<void> {
    this.driveConnecting = true;
    try {
      await this.drive.requestToken();
      this.showDriveConnect = false;
      // Only emit tokenReady if we haven't already (i.e. silent token failed path)
      // In the new flow tokenReady was already emitted, so just trigger a Drive load
      // by emitting again — app.component.loadUserData() will re-load from Drive
      this.tokenReady.emit();
    } catch (e) {
      console.warn('Drive connect failed:', e);
      this.errorMessage = 'Drive access denied. Your local data is still available.';
      this.driveConnecting = false;
    }
  }

  skipDrive(): void {
    this.showDriveConnect = false;
    this.tokenReady.emit();
  }

  private initGoogleSignIn(): void {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            this.zone.run(async () => {
              const err = this.auth.loginWithGoogle(response.credential);
              if (err) { this.errorMessage = err; return; }

              // Try silent token first (no popup — works if already authorized on this browser)
              try {
                await this.drive.requestTokenSilent();
                // Silent succeeded — emit tokenReady so app loads Drive data immediately
                this.tokenReady.emit();
              } catch (e) {
                // Silent failed — emit tokenReady anyway so app loads from localStorage
                // and show the Drive connect button as a non-blocking option
                console.warn('Silent Drive token failed, loading from localStorage:', e);
                this.tokenReady.emit();
                this.driveConnectNeeded.emit();
              }
            });
          }
        });
        google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          { theme: 'outline', size: 'large', width: 220, text: 'signin' }
        );
      } else {
        setTimeout(tryInit, 300);
      }
    };
    tryInit();
  }
}
