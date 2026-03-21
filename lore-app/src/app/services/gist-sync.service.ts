/**
 * GistSyncService — Option 3: GitHub Gist sync.
 *
 * Flow:
 *  1. User clicks "Connect GitHub" → we redirect to GitHub OAuth.
 *  2. GitHub redirects back with ?code=... → we exchange it for a token
 *     via a tiny Cloudflare Worker proxy (no server needed beyond that).
 *  3. We store the token in localStorage and use it to read/write a
 *     secret Gist named "lore-data.json".
 *
 * The Gist is private (secret), owned by the user's GitHub account.
 * If Lore shuts down, the user still has their Gist with all their data.
 *
 * Token storage: localStorage under 'lore_gh_token'.
 * Gist ID storage: localStorage under 'lore_gh_gist_id'.
 *
 * IMPORTANT: You need to register a GitHub OAuth App and set up a
 * Cloudflare Worker (or any tiny proxy) to exchange the code for a token.
 * See GITHUB_OAUTH_SETUP.md for instructions.
 */
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type GistSyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'disconnected';

// ── Configuration — fill these in after creating your GitHub OAuth App ────────
// GitHub OAuth App: https://github.com/settings/developers
// Callback URL: https://lore.thumbaraguddi.in/auth/github/callback
export const GITHUB_CLIENT_ID = 'Ov23liOVmxKYI2lELjfX';

// Cloudflare Worker URL that exchanges the code for a token.
// Deploy the worker from lore-app/workers/github-oauth.js
export const GITHUB_TOKEN_PROXY = ''; // TODO: fill after deploying worker

const GIST_FILENAME = 'lore-data.json';
const GIST_DESCRIPTION = 'Lore notes backup — do not delete';
const TOKEN_KEY = 'lore_gh_token';
const GIST_ID_KEY = 'lore_gh_gist_id';
const GITHUB_API = 'https://api.github.com';

@Injectable({ providedIn: 'root' })
export class GistSyncService {
  status$ = new BehaviorSubject<GistSyncStatus>('disconnected');
  username$ = new BehaviorSubject<string>('');

  private token = '';
  private gistId = '';

  constructor(private zone: NgZone) {
    this.token = localStorage.getItem(TOKEN_KEY) ?? '';
    this.gistId = localStorage.getItem(GIST_ID_KEY) ?? '';
    if (this.token) {
      this.status$.next('idle');
      this.fetchUsername().catch(() => {});
    }
  }

  get isConnected(): boolean {
    return !!this.token;
  }

  get isConfigured(): boolean {
    return !!(GITHUB_CLIENT_ID && GITHUB_TOKEN_PROXY);
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────

  /** Redirect to GitHub OAuth. Call from a click handler. */
  startOAuth(): void {
    if (!GITHUB_CLIENT_ID) {
      console.warn('[GistSync] GITHUB_CLIENT_ID not configured');
      return;
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem('gh_oauth_state', state);
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'gist',
      state,
      redirect_uri: location.origin,
    });
    location.href = `https://github.com/login/oauth/authorize?${params}`;
  }

  /**
   * Call this on app init if the URL contains ?code=... (GitHub callback).
   * Returns true if a code was found and exchanged.
   */
  async handleOAuthCallback(): Promise<boolean> {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return false;

    const savedState = sessionStorage.getItem('gh_oauth_state');
    sessionStorage.removeItem('gh_oauth_state');
    if (state !== savedState) {
      console.warn('[GistSync] OAuth state mismatch');
      return false;
    }

    // Exchange code for token via proxy worker
    if (!GITHUB_TOKEN_PROXY) {
      console.warn('[GistSync] GITHUB_TOKEN_PROXY not configured');
      return false;
    }

    try {
      const res = await fetch(GITHUB_TOKEN_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.access_token) throw new Error('No token in response');

      this.token = data.access_token;
      localStorage.setItem(TOKEN_KEY, this.token);

      // Clean up URL
      const clean = location.pathname;
      history.replaceState({}, '', clean);

      this.zone.run(() => this.status$.next('idle'));
      await this.fetchUsername();
      return true;
    } catch (e) {
      console.error('[GistSync] token exchange failed:', e);
      return false;
    }
  }

  disconnect(): void {
    this.token = '';
    this.gistId = '';
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GIST_ID_KEY);
    this.status$.next('disconnected');
    this.username$.next('');
  }

  // ── Read / Write ──────────────────────────────────────────────────────────

  async load(): Promise<any | null> {
    if (!this.token) return null;
    this.zone.run(() => this.status$.next('syncing'));
    try {
      const gistId = await this.resolveGistId();
      if (!gistId) {
        this.zone.run(() => this.status$.next('idle'));
        return null;
      }
      const res = await this.ghFetch(`/gists/${gistId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const gist = await res.json();
      const raw = gist.files?.[GIST_FILENAME]?.content;
      if (!raw) throw new Error('File not found in gist');
      const data = JSON.parse(raw);
      this.zone.run(() => this.status$.next('saved'));
      return data;
    } catch (e) {
      console.error('[GistSync] load error:', e);
      this.zone.run(() => this.status$.next('error'));
      return null;
    }
  }

  async save(data: any): Promise<void> {
    if (!this.token) return;
    this.zone.run(() => this.status$.next('syncing'));
    try {
      const body = JSON.stringify(data, null, 2);
      const gistId = await this.resolveGistId();

      let res: Response;
      if (gistId) {
        // Update existing gist
        res = await this.ghFetch(`/gists/${gistId}`, {
          method: 'PATCH',
          body: JSON.stringify({ files: { [GIST_FILENAME]: { content: body } } }),
        });
      } else {
        // Create new secret gist
        res = await this.ghFetch('/gists', {
          method: 'POST',
          body: JSON.stringify({
            description: GIST_DESCRIPTION,
            public: false,
            files: { [GIST_FILENAME]: { content: body } },
          }),
        });
        if (res.ok) {
          const created = await res.json();
          this.gistId = created.id;
          localStorage.setItem(GIST_ID_KEY, this.gistId);
        }
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.zone.run(() => this.status$.next('saved'));
    } catch (e) {
      console.error('[GistSync] save error:', e);
      this.zone.run(() => this.status$.next('error'));
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resolveGistId(): Promise<string> {
    if (this.gistId) return this.gistId;

    // Search user's gists for one with our description
    const res = await this.ghFetch('/gists?per_page=100');
    if (!res.ok) return '';
    const gists: any[] = await res.json();
    const found = gists.find(g =>
      g.description === GIST_DESCRIPTION ||
      Object.keys(g.files ?? {}).includes(GIST_FILENAME)
    );
    if (found) {
      this.gistId = found.id;
      localStorage.setItem(GIST_ID_KEY, this.gistId);
    }
    return this.gistId;
  }

  private async fetchUsername(): Promise<void> {
    try {
      const res = await this.ghFetch('/user');
      if (!res.ok) return;
      const user = await res.json();
      this.zone.run(() => this.username$.next(user.login ?? ''));
    } catch {}
  }

  private ghFetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  }
}
