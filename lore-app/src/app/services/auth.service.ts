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
