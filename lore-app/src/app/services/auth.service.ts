import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRecord } from '../models';

const USERS_KEY = 'lore_users';
const CU_KEY = 'lore_cu';
const MODE_KEY = 'lore_mode';
const LOCAL_USER_KEY = 'local_user';

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
    // Restore local mode session
    if (localStorage.getItem(MODE_KEY) === 'local') {
      const localUser = this.getLocalUser();
      if (localUser) {
        this.currentUser$.next(localUser);
        this.isLoggedIn$.next(true);
        return;
      }
    }
    const cu = localStorage.getItem(CU_KEY) || '';
    if (!cu) return;
    const users = this.getUsers();
    const user = users[cu];
    if (user) {
      this.currentUser$.next(user);
      this.isLoggedIn$.next(true);
    }
  }

  private getLocalUser(): UserRecord | null {
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

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
      users[googleKey] = { username: googleKey, password: '', name, email, data: {} };
    } else {
      users[googleKey].name = name;
      users[googleKey].email = email;
    }
    this.saveUsers(users);

    localStorage.setItem(CU_KEY, googleKey);
    this.currentUser$.next(users[googleKey]);
    this.isLoggedIn$.next(true);
    return null;
  }

  loginLocal(): void {
    const localUser: UserRecord = {
      username: 'local',
      password: '',
      name: 'Local User',
      isLocal: true,
      data: {},
    };
    localStorage.setItem(MODE_KEY, 'local');
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    this.currentUser$.next(localUser);
    this.isLoggedIn$.next(true);
  }

  get isLocalMode(): boolean {
    return localStorage.getItem(MODE_KEY) === 'local';
  }

  logout(): void {
    localStorage.setItem(CU_KEY, '');
    localStorage.removeItem(MODE_KEY);
    this.currentUser$.next(null);
    this.isLoggedIn$.next(false);
  }

  getCurrentUser(): UserRecord | null {
    return this.currentUser$.getValue();
  }
}
