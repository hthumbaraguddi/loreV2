import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoreIconComponent } from '../lore-icon/lore-icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoreIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);

  activeTab: 'signin' | 'register' = 'signin';
  errorMessage = '';

  // Sign-in fields
  loginUsername = '';
  loginPassword = '';

  // Register fields
  registerName = '';
  registerUsername = '';
  registerPassword = '';

  switchTab(tab: 'signin' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  doLogin(): void {
    const err = this.auth.login(this.loginUsername, this.loginPassword);
    this.errorMessage = err ?? '';
  }

  doRegister(): void {
    const err = this.auth.register(this.registerName, this.registerUsername, this.registerPassword);
    this.errorMessage = err ?? '';
  }
}
