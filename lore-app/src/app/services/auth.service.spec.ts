/**
 * Unit Tests: AuthService Validation Rules
 *
 * Validates: Requirements 1.2–1.9
 */

import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    // In-memory localStorage mock
    localStorageStore = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) =>
      localStorageStore[key] ?? null
    );
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStore[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageStore[key];
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  // ── Empty field validation ──────────────────────────────────────────────────

  it('should return "Fill all fields" when name is empty (Req 1.4)', () => {
    expect(service.register('', 'alice', 'password123')).toBe('Fill all fields');
  });

  it('should return "Fill all fields" when username is empty (Req 1.4)', () => {
    expect(service.register('Alice', '', 'password123')).toBe('Fill all fields');
  });

  it('should return "Fill all fields" when password is empty (Req 1.4)', () => {
    expect(service.register('Alice', 'alice', '')).toBe('Fill all fields');
  });

  // ── Username length validation ──────────────────────────────────────────────

  it('should return "Username: min 3 chars" for a 1-char username (Req 1.5)', () => {
    expect(service.register('Alice', 'a', 'password123')).toBe('Username: min 3 chars');
  });

  it('should return "Username: min 3 chars" for a 2-char username (Req 1.5)', () => {
    expect(service.register('Alice', 'ab', 'password123')).toBe('Username: min 3 chars');
  });

  // ── Password length validation ──────────────────────────────────────────────

  it('should return "Password: min 6 chars" for a 5-char password (Req 1.6)', () => {
    expect(service.register('Alice', 'alice', 'pass1')).toBe('Password: min 6 chars');
  });

  it('should return "Password: min 6 chars" for a 1-char password (Req 1.6)', () => {
    expect(service.register('Alice', 'alice', 'x')).toBe('Password: min 6 chars');
  });

  // ── Duplicate username ──────────────────────────────────────────────────────

  it('should return "Username taken" when registering an existing username (Req 1.3)', () => {
    service.register('Alice', 'alice', 'password123');
    expect(service.register('Alice2', 'alice', 'differentpass')).toBe('Username taken');
  });

  // ── Successful registration ─────────────────────────────────────────────────

  it('should return null on successful registration (Req 1.2)', () => {
    expect(service.register('Alice', 'alice', 'password123')).toBeNull();
  });

  it('should sign the user in after successful registration (Req 1.2)', () => {
    service.register('Alice', 'alice', 'password123');
    expect(service.isLoggedIn$.getValue()).toBeTrue();
  });

  // ── Login: unknown username ─────────────────────────────────────────────────

  it('should return "Username not found" for an unregistered username (Req 1.8)', () => {
    expect(service.login('nobody', 'password123')).toBe('Username not found');
  });

  // ── Login: wrong password ───────────────────────────────────────────────────

  it('should return "Wrong password" when password does not match (Req 1.9)', () => {
    service.register('Alice', 'alice', 'password123');
    expect(service.login('alice', 'wrongpass')).toBe('Wrong password');
  });

  // ── Successful login ────────────────────────────────────────────────────────

  it('should return null on successful login (Req 1.7)', () => {
    service.register('Alice', 'alice', 'password123');
    // Reset session so we can test login independently
    service.logout();
    expect(service.login('alice', 'password123')).toBeNull();
  });

  it('should set isLoggedIn$ to true after successful login (Req 1.7)', () => {
    service.register('Alice', 'alice', 'password123');
    service.logout();
    service.login('alice', 'password123');
    expect(service.isLoggedIn$.getValue()).toBeTrue();
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  it('should set isLoggedIn$ to false after logout (Req 1.10)', () => {
    service.register('Alice', 'alice', 'password123');
    service.logout();
    expect(service.isLoggedIn$.getValue()).toBeFalse();
  });

  it('should clear currentUser$ after logout (Req 1.10)', () => {
    service.register('Alice', 'alice', 'password123');
    service.logout();
    expect(service.currentUser$.getValue()).toBeNull();
  });
});
