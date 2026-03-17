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

  ngOnInit(): void {
    this.drive.init();
    this.initGoogleSignIn();
  }

  loginLocally(): void {
    this.auth.loginLocal();
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
              } catch (e) {
                // Drive token failed — user will see sync error in topbar
                console.warn('Drive token request failed:', e);
              }
              this.tokenReady.emit();
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
