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

  errorMessage = '';
  driveConnecting = false;
  showDriveConnect = false;

  ngOnInit(): void {
    this.drive.init();
    this.initGoogleSignIn();
  }

  loginLocally(): void {
    this.auth.loginLocal();
    this.tokenReady.emit();
  }

  /** Called when user manually clicks "Connect Drive" after popup was blocked */
  async connectDrive(): Promise<void> {
    this.driveConnecting = true;
    this.showDriveConnect = false;
    try {
      await this.drive.requestToken();
    } catch (e) {
      console.warn('Drive connect failed:', e);
    }
    this.driveConnecting = false;
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
              try {
                await this.drive.requestToken();
                this.tokenReady.emit();
              } catch (e) {
                console.warn('Drive token request failed:', e);
                // Show manual connect button instead of blocking login
                this.showDriveConnect = true;
              }
            });
          }
        });
        google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          { theme: 'outline', size: 'large', width: 280, text: 'continue_with' }
        );
      } else {
        setTimeout(tryInit, 300);
      }
    };
    tryInit();
  }
}
