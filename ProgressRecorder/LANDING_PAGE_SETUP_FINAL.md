# Landing Page Setup - Final Configuration

## ✅ What's Configured

The landing page (dark theme) is now set up as the main entry point for Lore.

### File Structure

```
lore-app/
├── public/
│   ├── landing-dark.html     ← Dark theme landing page (DEFAULT)
│   └── landing-light.html    ← Light theme landing page
├── src/
│   └── index.html            ← Angular app entry point
```

### How It Works

1. **User visits the site** → Sees `landing-dark.html` (dark theme)
2. **User clicks "Continue with GitHub"** → Goes to `/app?auth=github`
3. **User clicks "Use Locally"** → Goes to `/app?auth=local`
4. **Angular app loads** at `/app` route

## 🚀 Development

### Start Dev Server

```bash
cd lore-app
npm start
```

**URLs**:
- Landing page (dark): http://localhost:4200/landing-dark.html
- Landing page (light): http://localhost:4200/landing-light.html
- Angular app: http://localhost:4200/ (or any app route)

### Build for Production

```bash
cd lore-app
npm run build
```

This will:
1. Build the Angular app
2. Run post-build script to set up landing page as index.html

**Result**:
```
dist/lore-app/browser/
├── index.html            ← Landing page (dark) - MAIN ENTRY
├── app.html              ← Angular app entry point
├── landing-dark.html     ← Landing page (dark)
├── landing-light.html    ← Landing page (light)
└── ... (other app files)
```

## 🌐 Deployment Configuration

### Option 1: Simple Static Hosting (Recommended)

Deploy the `dist/lore-app/browser` folder to any static host:
- Netlify
- Vercel
- GitHub Pages
- Azure Static Web Apps

**URLs will be**:
- `/` → Landing page (dark theme)
- `/landing-light.html` → Landing page (light theme)
- `/app` → Angular app (needs server config)

### Option 2: With Server Configuration

Configure your web server to route `/app` to `app.html`:

#### Nginx

```nginx
server {
    listen 80;
    server_name lore.app;
    root /var/www/lore/dist/lore-app/browser;

    # Landing page at root
    location = / {
        try_files /index.html =404;
    }

    # Angular app at /app
    location /app {
        try_files $uri /app.html;
    }

    # Static assets
    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Azure Static Web Apps

Create `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/app*",
      "rewrite": "/app.html"
    }
  ],
  "navigationFallback": {
    "rewrite": "/app.html",
    "exclude": ["/index.html", "/landing-*.html", "/*.{css,js,png,gif,ico,jpg,svg}"]
  }
}
```

#### Netlify

Create `_redirects`:

```
/app/*    /app.html    200
/*        /index.html   200
```

#### Vercel

Create `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/app/:path*",
      "destination": "/app.html"
    }
  ]
}
```

## 🔗 Landing Page Links

The landing page has been updated with these links:

| Button | Link | Description |
|--------|------|-------------|
| Get Started (header) | `/app` | Opens Angular app |
| Continue with GitHub | `/app?auth=github` | Opens app with GitHub auth intent |
| Use Locally | `/app?auth=local` | Opens app with local storage |

## 🎨 Switching Between Themes

Users can access both landing page themes:

- **Dark theme** (default): `/` or `/landing-dark.html`
- **Light theme**: `/landing-light.html`

You can add a theme toggle button to the landing page if desired.

## 📝 Customizing Landing Page

To update the landing page:

1. **Edit the source**:
   ```bash
   # Edit the landing page
   code lore-app/public/landing-dark.html
   ```

2. **Update links** (if needed):
   ```bash
   # Run the update script
   cd lore-app
   node update-landing-links.js
   ```

3. **Test**:
   ```bash
   npm start
   # Visit: http://localhost:4200/landing-dark.html
   ```

4. **Build**:
   ```bash
   npm run build
   ```

## 🧪 Testing

### Test Landing Page

```bash
cd lore-app
npm start

# Open in browser:
# http://localhost:4200/landing-dark.html
```

### Test App Entry

```bash
# Click "Continue with GitHub" or "Use Locally" on landing page
# Should navigate to Angular app
```

### Test Production Build

```bash
cd lore-app
npm run build
npm run preview:landing

# Should open landing page
# Click buttons to test navigation
```

## ✅ Checklist

- [x] Landing page (dark) created
- [x] Landing page (light) created
- [x] Links updated to point to `/app`
- [x] Post-build script created
- [x] Package.json scripts updated
- [x] Documentation created

## 🎯 User Flow

```
1. User visits lore.app
   ↓
2. Sees dark landing page (index.html)
   ↓
3. Reads about features
   ↓
4. Clicks "Continue with GitHub" or "Use Locally"
   ↓
5. Navigates to /app?auth=github or /app?auth=local
   ↓
6. Angular app loads
   ↓
7. User starts using Lore!
```

## 🚧 Next Steps

1. **Test the setup**:
   ```bash
   npm start
   # Visit: http://localhost:4200/landing-dark.html
   # Click buttons to test navigation
   ```

2. **Build and deploy**:
   ```bash
   npm run build
   # Deploy dist/lore-app/browser folder
   ```

3. **Configure server** (if needed) to route `/app` to `app.html`

4. **Add authentication** logic to handle `?auth=github` and `?auth=local` parameters

5. **Add analytics** to track landing page visits and conversions

---

**Status**: ✅ Complete and Ready for Testing

**Quick Test**:
```bash
cd lore-app
npm start
# Visit: http://localhost:4200/landing-dark.html
# Click "Continue with GitHub" or "Use Locally"
```
