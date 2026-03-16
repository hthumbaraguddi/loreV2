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

  /** Request an access token (shows Google consent popup if needed). */
  requestToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) { reject('Token client not ready'); return; }
      const original = this.tokenClient.callback;
      this.tokenClient.callback = (resp: any) => {
        this.zone.run(() => {
          if (resp.error) { reject(resp.error); return; }
          this.accessToken = resp.access_token;
          this.tokenClient.callback = original;
          resolve();
        });
      };
      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  hasToken(): boolean {
    return !!this.accessToken;
  }

  /** Load data from Drive. Returns null if no file exists yet. */
  async load(): Promise<any | null> {
    if (!this.accessToken) return null;
    this.syncStatus$.next('syncing');
    try {
      // Find the file
      const listRes = await fetch(
        `${DRIVE_API}/files?spaces=appDataFolder&q=name='${FILE_NAME}'&fields=files(id)`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const list = await listRes.json();
      if (!list.files?.length) {
        this.syncStatus$.next('idle');
        return null;
      }
      this.fileId = list.files[0].id;

      // Download content
      const dlRes = await fetch(
        `${DRIVE_API}/files/${this.fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await dlRes.json();
      this.syncStatus$.next('saved');
      return data;
    } catch {
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

      if (this.fileId) {
        // Update existing file
        await fetch(`${UPLOAD_API}/files/${this.fileId}?uploadType=media`, {
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
        const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form,
        });
        const created = await res.json();
        this.fileId = created.id;
      }
      this.zone.run(() => this.syncStatus$.next('saved'));
    } catch {
      this.zone.run(() => this.syncStatus$.next('error'));
    }
  }

  clearToken(): void {
    this.accessToken = '';
    this.fileId = '';
    this.syncStatus$.next('idle');
  }
}
