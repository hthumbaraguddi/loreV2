/**
 * FileSyncService — Option 2: Local file sync via File System Access API.
 *
 * Strategy:
 *  - User picks a file on their disk once (or we create a new one).
 *  - We hold a FileSystemFileHandle in memory and in IndexedDB (via opfs-like storage).
 *  - On every save we write the JSON directly to that file.
 *  - On load we read from that file.
 *  - Falls back to a plain download/upload if the API is not supported (Safari, Firefox).
 *
 * The file is 100% owned by the user — it lives on their disk, not in any cloud.
 */
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FileSyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'no-file';

const IDB_DB = 'lore-file-sync';
const IDB_STORE = 'handles';
const IDB_KEY = 'lore-data-handle';
const FALLBACK_FILENAME = 'lore-data.json';

@Injectable({ providedIn: 'root' })
export class FileSyncService {
  status$ = new BehaviorSubject<FileSyncStatus>('no-file');

  /** True when the File System Access API is available (Chrome/Edge). */
  readonly isSupported = 'showOpenFilePicker' in window || 'showSaveFilePicker' in window;

  private fileHandle: FileSystemFileHandle | null = null;

  constructor(private zone: NgZone) {}

  // ── Initialisation ────────────────────────────────────────────────────────

  /** Restore a previously-granted file handle from IndexedDB. */
  async restoreHandle(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const handle = await this.loadHandleFromIdb();
      if (!handle) return false;
      // Verify we still have permission
      const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        this.fileHandle = handle;
        this.status$.next('idle');
        return true;
      }
      // Permission was revoked — ask again silently (requires user gesture, so just flag it)
      return false;
    } catch {
      return false;
    }
  }

  /** Ask the user to pick an existing lore-data.json or create a new one. */
  async pickFile(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Lore Data', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      });
      this.fileHandle = handle;
      await this.saveHandleToIdb(handle);
      this.status$.next('idle');
      return true;
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.warn('[FileSync] pickFile error:', e);
      return false;
    }
  }

  /** Create a new file at a user-chosen location. */
  async createFile(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: FALLBACK_FILENAME,
        types: [{ description: 'Lore Data', accept: { 'application/json': ['.json'] } }],
      });
      this.fileHandle = handle;
      await this.saveHandleToIdb(handle);
      this.status$.next('idle');
      return true;
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.warn('[FileSync] createFile error:', e);
      return false;
    }
  }

  hasFile(): boolean {
    return !!this.fileHandle;
  }

  getFileName(): string {
    return this.fileHandle?.name ?? '';
  }

  // ── Read / Write ──────────────────────────────────────────────────────────

  async load(): Promise<any | null> {
    if (!this.fileHandle) return null;
    this.zone.run(() => this.status$.next('syncing'));
    try {
      const file = await this.fileHandle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);
      this.zone.run(() => this.status$.next('saved'));
      return data;
    } catch (e) {
      console.error('[FileSync] load error:', e);
      this.zone.run(() => this.status$.next('error'));
      return null;
    }
  }

  async save(data: any): Promise<void> {
    if (!this.fileHandle) return;
    this.zone.run(() => this.status$.next('syncing'));
    try {
      const writable = await (this.fileHandle as any).createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      this.zone.run(() => this.status$.next('saved'));
    } catch (e) {
      console.error('[FileSync] save error:', e);
      this.zone.run(() => this.status$.next('error'));
    }
  }

  // ── Fallback: plain download/upload (Safari / Firefox) ───────────────────

  /** Trigger a JSON file download — fallback when File System Access API is unavailable. */
  downloadBackup(data: any): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FALLBACK_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Read a user-selected JSON file — fallback for loading. */
  uploadBackup(): Promise<any | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        try {
          const text = await file.text();
          resolve(JSON.parse(text));
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  }

  // ── IndexedDB helpers ─────────────────────────────────────────────────────

  private openIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async saveHandleToIdb(handle: FileSystemFileHandle): Promise<void> {
    try {
      const db = await this.openIdb();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
      db.close();
    } catch (e) {
      console.warn('[FileSync] saveHandleToIdb error:', e);
    }
  }

  private async loadHandleFromIdb(): Promise<FileSystemFileHandle | null> {
    try {
      const db = await this.openIdb();
      const tx = db.transaction(IDB_STORE, 'readonly');
      const handle = await new Promise<any>((res, rej) => {
        const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
        req.onsuccess = () => res(req.result ?? null);
        req.onerror = () => rej(req.error);
      });
      db.close();
      return handle;
    } catch {
      return null;
    }
  }

  async clearHandle(): Promise<void> {
    this.fileHandle = null;
    this.status$.next('no-file');
    try {
      const db = await this.openIdb();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      db.close();
    } catch {}
  }
}
