# Lore App — Infrastructure & Configuration Reference

## 1. Hosting — Azure Static Web Apps

**Service:** Azure Static Web Apps (Free tier)  
**Azure app name:** `icy-tree-0c4d19100`  
**Default Azure URL:** `https://icy-tree-0c4d19100.1.azurestaticapps.net/`  
**Custom domain:** `https://lore.thumbaraguddi.in`

The app is a fully static Angular SPA — no server-side code, no API backend. Azure serves the pre-built files directly from a CDN.

---

## 2. CI/CD Pipeline — GitHub Actions

**Workflow file:** `.github/workflows/azure-static-web-apps-icy-tree-0c4d19100.yml`

### Trigger
| Event | Branch | Action |
|---|---|---|
| `push` | `main` | Build + Deploy |
| `pull_request` opened/updated | `main` | Build + Deploy (preview) |
| `pull_request` closed | `main` | Tear down preview |

### Pipeline Steps
1. Checkout code
2. Setup Node.js 20
3. `npm install` inside `lore-app/`
4. `npm run build -- --configuration production` inside `lore-app/`
5. Deploy built output from `lore-app/dist/lore-app/browser/` to Azure Static Web Apps

### Secret Required
| Secret name | Where to set | What it is |
|---|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_TREE_0C4D19100` | GitHub repo → Settings → Secrets → Actions | Deployment token from Azure portal |

To rotate this token: Azure Portal → Static Web Apps → `icy-tree-0c4d19100` → Manage deployment token → Reset.

---

## 3. Google OAuth / Authentication

**Google Cloud Project owner:** harshamla64@gmail.com  
**OAuth Client ID:** `20077195169-sookf9svl2i34t2lvbb2td9p01a4j05l.apps.googleusercontent.com`

### Where it's used in code
| File | Purpose |
|---|---|
| `lore-app/src/app/components/login/login.component.ts` | Renders the Google Sign-In button, handles the ID token callback |
| `lore-app/src/app/services/drive.service.ts` | Requests OAuth access token for Google Drive API |

### OAuth Scopes requested
| Scope | Purpose |
|---|---|
| `openid` / `profile` / `email` | Identity — name, email, profile picture (via Google Sign-In) |
| `https://www.googleapis.com/auth/drive.appdata` | Read/write to the user's hidden `appDataFolder` in Google Drive |

### Google Cloud Console settings to maintain
Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client IDs

**Authorized JavaScript origins** (must include both):
```
https://lore.thumbaraguddi.in
https://icy-tree-0c4d19100.1.azurestaticapps.net
```

**Authorized redirect URIs:** Not needed (this app uses the implicit/token flow via Google Identity Services, not redirect-based OAuth).

**OAuth consent screen settings:**
- App name: Lore
- User support email: harshamla64@gmail.com
- Publishing status: **Production** (published — required so any Google account can sign in)
- Scopes: `drive.appdata` is a restricted scope — users will see an "unverified app" warning screen until the app goes through Google's verification process

### Google APIs enabled
- Google Drive API
- Google Identity Services (loaded via `<script src="https://accounts.google.com/gsi/client">` in `index.html`)

---

## 4. Custom Domain — GoDaddy

**Domain registrar:** GoDaddy  
**Domain:** `thumbaraguddi.in`  
**Subdomain in use:** `lore.thumbaraguddi.in`

### DNS Records to maintain
Log in to GoDaddy → DNS Management for `thumbaraguddi.in`:

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `lore` | `icy-tree-0c4d19100.1.azurestaticapps.net` | 1 hour (or default) |

Azure validates domain ownership via this CNAME. If the CNAME is removed or changed, the custom domain will stop working.

### Azure side (custom domain validation)
Azure Portal → Static Web Apps → `icy-tree-0c4d19100` → Custom domains → `lore.thumbaraguddi.in` should show status **Validated**.

If it ever shows as unvalidated, re-add the CNAME in GoDaddy and wait for DNS propagation (up to 48 hours, usually minutes).

---

## 5. Data Storage

### Where user data lives

| Storage | What's stored | Scope |
|---|---|---|
| **User's Google Drive** (`appDataFolder`) | All notes, shelves, notebooks — saved as `lore-data.json` | Per user, private |
| **Browser `localStorage`** | Session token, user profile, theme/font preferences, custom templates | Per browser/device |

### Key details

**Google Drive (`appDataFolder`):**
- File name: `lore-data.json`
- Location: Hidden app-specific folder in the *user's own* Google Drive — not visible in their Drive UI
- Access: Only the Lore app (identified by the OAuth client ID) can read/write this file
- The app owner (harshamla64@gmail.com) has **no access** to any user's data
- On first login: app checks if `lore-data.json` exists → loads it. If not → starts fresh (or seeds demo data)
- On every save: debounced 800ms write via `DriveService.scheduleSave()`

**localStorage keys:**
| Key | Contents |
|---|---|
| `lore_cu` | Current username (Google sub ID) |
| `lore_users` | User profile + app state (theme, font size, shelves, notebooks) |
| `lore_custom_templates` | User-created custom templates |

localStorage is the fallback when Drive is unavailable (offline, token expired). On next login with Drive access, Drive data takes precedence over localStorage.

### Data flow on login
```
User clicks "Continue with Google"
  → Google Sign-In returns ID token (JWT)
  → AuthService decodes JWT → stores user profile in localStorage
  → DriveService.requestToken() → gets Drive access token
  → DriveService.load() → fetches lore-data.json from user's Drive
  → If found: load into app state
  → If not found: load from localStorage or seed demo data
```

### Data flow on save
```
Any note/shelf/notebook change
  → DataService saves to localStorage immediately
  → DriveService.scheduleSave() → debounced 800ms → writes lore-data.json to Drive
```
