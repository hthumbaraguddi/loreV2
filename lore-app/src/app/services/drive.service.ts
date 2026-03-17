import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare const google: any;

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'offline';

const CLIENT_ID = '20077195169-sookf9svl2i34t2lvbb2td9p01a4j05l.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'lore-data.json';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

@Injectable({ providedIn: 'root' })
export class DriveService {
  syncStatus$ = new BehaviorSubject<SyncStatus>('idle');

  private accessToken = '';
  private tokenClient: any = null;
  private saveTimer: any = null;
  private fileId = '';

  constructor(private zone: NgZone) {}

  /** Initialize the OAuth token client. Call once after GSI loads. */
  init(): void {
    const tryInit = () => {
      if (typeof google !== 'undefined' && google.accounts?.oauth2) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (resp: any) => {
            this.zone.run(() => {
              if (resp.error) {
                this.syncStatus$.next('error');
                return;
              }
              this.accessToken = resp.access_token;
            });
          },
        });
      } else {
        setTimeout(tryInit, 300);
      }
    };
    tryInit();
  }

  /** Request an access token. Tries silent first, falls back to consent popup. */
  requestToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) { reject('Token client not ready'); return; }

      const attempt = (prompt: string) => {
        this.tokenClient.callback = (resp: any) => {
          this.zone.run(() => {
            if (resp.error) {
              if (prompt === '' && resp.error === 'interaction_required') {
                // Silent failed — retry with explicit consent popup
                attempt('consent');
              } else {
                reject(resp.error);
              }
              return;
            }
            this.accessToken = resp.access_token;
            resolve();
          });
        };
        this.tokenClient.requestAccessToken({ prompt });
      };

      attempt('');
    });
  }

  hasToken(): boolean {
    return !!this.accessToken;
  }

  /** Find the Drive file ID, resolving duplicates by keeping only the newest. */
  private async resolveFileId(): Promise<string> {
    if (this.fileId) return this.fileId;

    const res = await fetch(
      `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILE_NAME}'&fields=files(id,createdTime)&orderBy=createdTime+desc`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const list = await res.json();
    const files: Array<{ id: string; createdTime: string }> = list.files ?? [];

    if (!files.length) return '';

    // Keep the newest, delete any duplicates
    this.fileId = files[0].id;
    for (let i = 1; i < files.length; i++) {
      fetch(`${DRIVE_API}/files/${files[i].id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }).catch(() => {});
    }

    return this.fileId;
  }

  /** Load data from Drive. Returns null if no file exists yet. */
  async load(): Promise<any | null> {
    if (!this.accessToken) return null;
    this.syncStatus$.next('syncing');
    try {
      const fileId = await this.resolveFileId();
      if (!fileId) {
        this.syncStatus$.next('idle');
        return null;
      }

      const dlRes = await fetch(
        `${DRIVE_API}/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );

      if (!dlRes.ok) {
        console.error('[Drive] load failed, status:', dlRes.status);
        this.syncStatus$.next('error');
        return null;
      }

      const data = await dlRes.json();
      console.log('[Drive] loaded successfully, shelves:', data?.state?.shelves?.length ?? 0);
      this.syncStatus$.next('saved');
      return data;
    } catch (e) {
      console.error('[Drive] load error:', e);
      this.syncStatus$.next('error');
      return null;
    }
  }

  /** Save data to Drive (debounced by 800ms). */
  scheduleSave(data: any): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(data), 800);
  }

  /** Immediately save data to Drive. */
  async save(data: any): Promise<void> {
    if (!this.accessToken) return;
    this.zone.run(() => this.syncStatus$.next('syncing'));
    try {
      const body = JSON.stringify(data);
      const blob = new Blob([body], { type: 'application/json' });

      // Always resolve fileId before saving — handles fresh browser sessions
      const existingId = await this.resolveFileId();

      let res: Response;
      if (existingId) {
        // Update existing file
        res = await fetch(`${UPLOAD_API}/files/${existingId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body,
        });
      } else {
        // Create new file in appDataFolder
        const meta = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] });
        const form = new FormData();
        form.append('metadata', new Blob([meta], { type: 'application/json' }));
        form.append('file', blob);
        res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form,
        });
        if (res.ok) {
          const created = await res.json();
          this.fileId = created.id;
        }
      }

      if (!res.ok) {
        console.error('[Drive] save failed, status:', res.status, await res.text());
        throw new Error(`HTTP ${res.status}`);
      }

      console.log('[Drive] saved successfully');
      this.zone.run(() => this.syncStatus$.next('saved'));
      window.dispatchEvent(new CustomEvent('lore-toast', { detail: '✓ Saved to Google Drive' }));
    } catch (e) {
      console.error('[Drive] save error:', e);
      this.zone.run(() => this.syncStatus$.next('error'));
      window.dispatchEvent(new CustomEvent('lore-toast', { detail: '⚠ Drive sync failed — check connection' }));
    }
  }

  clearToken(): void {
    this.accessToken = '';
    this.fileId = '';
    this.syncStatus$.next('idle');
  }
}
