import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

declare const google: any;

const GOOGLE_CLIENT_ID = '957655849309-1hbcnadm5kebdr56o34nbosc81n1alau.apps.googleusercontent.com';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoreIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private zone = inject(NgZone);

  errorMessage = '';

  ngOnInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            this.zone.run(() => {
              const err = this.auth.loginWithGoogle(response.credential);
              this.errorMessage = err ?? '';
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
