import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRecord } from '../models';

const USERS_KEY = 'lore_users';
const CU_KEY = 'lore_cu';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  currentUser$ = new BehaviorSubject<UserRecord | null>(null);

  constructor() {
    this.restoreSession();
  }

  private getUsers(): Record<string, UserRecord> {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private saveUsers(users: Record<string, UserRecord>): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  private restoreSession(): void {
    const cu = localStorage.getItem(CU_KEY) || '';
    if (!cu) return;
    const users = this.getUsers();
    const user = users[cu];
    if (user) {
      this.currentUser$.next(user);
      this.isLoggedIn$.next(true);
    }
  }

  /** Decode a Google JWT credential (no signature verification needed — GSI already verified it) */
  private decodeJwt(token: string): Record<string, any> {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return {};
    }
  }

  loginWithGoogle(credential: string): string | null {
    const payload = this.decodeJwt(credential);
    const sub: string = payload['sub'];
    const name: string = payload['name'] || payload['email'] || 'Google User';
    const email: string = payload['email'] || '';

    if (!sub) return 'Invalid Google credential';

    const googleKey = `google_${sub}`;
    const users = this.getUsers();

    if (!users[googleKey]) {
      // First-time Google sign-in — create account
      users[googleKey] = {
        username: googleKey,
        password: '',       // no password for Google accounts
        name,
        data: {}
      };
      this.saveUsers(users);
    } else {
      // Update name in case it changed
      users[googleKey].name = name;
      this.saveUsers(users);
    }

    localStorage.setItem(CU_KEY, googleKey);
    this.currentUser$.next(users[googleKey]);
    this.isLoggedIn$.next(true);
    return null;
  }

  register(name: string, username: string, password: string): string | null {
    if (!name.trim() || !username.trim() || !password.trim()) {
      return 'Fill all fields';
    }
    if (username.trim().length < 3) {
      return 'Username: min 3 chars';
    }
    if (password.length < 6) {
      return 'Password: min 6 chars';
    }
    const users = this.getUsers();
    if (users[username]) {
      return 'Username taken';
    }

    const record: UserRecord = {
      username,
      password: btoa(password),
      name: name.trim(),
      data: {}
    };
    users[username] = record;
    this.saveUsers(users);

    // Auto sign-in
    localStorage.setItem(CU_KEY, username);
    this.currentUser$.next(record);
    this.isLoggedIn$.next(true);

    return null;
  }

  login(username: string, password: string): string | null {
    const users = this.getUsers();
    const user = users[username];
    if (!user) {
      return 'Username not found';
    }
    if (user.password !== btoa(password)) {
      return 'Wrong password';
    }

    localStorage.setItem(CU_KEY, username);
    this.currentUser$.next(user);
    this.isLoggedIn$.next(true);

    return null;
  }

  logout(): void {
    localStorage.setItem(CU_KEY, '');
    this.currentUser$.next(null);
    this.isLoggedIn$.next(false);
  }

  getCurrentUser(): UserRecord | null {
    return this.currentUser$.getValue();
  }
}
