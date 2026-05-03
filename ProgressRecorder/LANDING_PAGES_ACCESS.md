# How to Access the Landing Pages

The landing pages are standalone HTML files located in `lore-app/public/`.

## 📁 Files

- **landing-light.html** - Light theme landing page (soft lavender)
- **landing-dark.html** - Dark theme landing page (deep purple-black)

## 🌐 Accessing During Development

### Method 1: Direct File Access

When the dev server is running (`npm start`), access the landing pages at:

- **Light theme**: http://localhost:4200/landing-light.html
- **Dark theme**: http://localhost:4200/landing-dark.html

### Method 2: Build and Preview

```bash
cd lore-app

# Build the app
npm run build

# Preview with landing page
npm run preview:landing
```

This will:
1. Build the production app
2. Start a local server
3. Open the light landing page in your browser

### Method 3: Manual Preview

```bash
cd lore-app

# Build the app
npm run build

# Serve the dist folder
npx http-server dist/lore-app/browser -p 8080

# Then open in browser:
# http://localhost:8080/landing-light.html
# http://localhost:8080/landing-dark.html
```

## 🚀 Production Deployment

After building, the landing pages will be in:
```
dist/lore-app/browser/
├── landing-light.html
├── landing-dark.html
└── index.html (Angular app)
```

### Deployment Strategies

#### Strategy 1: Separate Domains

Deploy landing and app separately:
- Landing: `https://lore.app` → `landing-light.html`
- App: `https://app.lore.app` → `index.html`

#### Strategy 2: Same Domain with Routes

Configure your web server:
- `/` → `landing-light.html`
- `/dark` → `landing-dark.html`
- `/app` → `index.html` (Angular app)

#### Strategy 3: Landing as Main Entry

Use the landing page as the main entry point:

1. After build, copy landing page:
   ```bash
   cp dist/lore-app/browser/landing-light.html dist/lore-app/browser/main.html
   ```

2. Update links in landing page to point to `/app`

3. Configure web server to serve `main.html` at root

## 🔧 Web Server Configuration Examples

### Nginx

```nginx
server {
    listen 80;
    server_name lore.app;
    root /var/www/lore/dist/lore-app/browser;

    # Landing page at root
    location = / {
        try_files /landing-light.html =404;
    }

    # Dark landing page
    location = /dark {
        try_files /landing-dark.html =404;
    }

    # Angular app
    location /app {
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Apache (.htaccess)

```apache
RewriteEngine On

# Landing page at root
RewriteRule ^$ landing-light.html [L]

# Dark landing page
RewriteRule ^dark$ landing-dark.html [L]

# Angular app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^app/ index.html [L]
```

### Azure Static Web Apps

Create `staticwebapp.config.json` in the root:

```json
{
  "routes": [
    {
      "route": "/",
      "rewrite": "/landing-light.html"
    },
    {
      "route": "/dark",
      "rewrite": "/landing-dark.html"
    },
    {
      "route": "/app/*",
      "rewrite": "/index.html"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/landing-light.html", "/landing-dark.html", "/*.{css,scss,js,png,gif,ico,jpg,svg}"]
  }
}
```

### Vercel

Create `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/landing-light.html"
    },
    {
      "source": "/dark",
      "destination": "/landing-dark.html"
    },
    {
      "source": "/app/:path*",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify

Create `_redirects` file:

```
/              /landing-light.html    200
/dark          /landing-dark.html     200
/app/*         /index.html            200
```

## 📝 Quick Start

### View Landing Pages Now

1. **Start dev server** (if not running):
   ```bash
   cd lore-app
   npm start
   ```

2. **Open in browser**:
   - Light: http://localhost:4200/landing-light.html
   - Dark: http://localhost:4200/landing-dark.html

### View Production Build

1. **Build and preview**:
   ```bash
   cd lore-app
   npm run preview:landing
   ```

2. **Browser will open automatically** to the light landing page

## 🎨 Landing Page Features

Both landing pages showcase:
- ✨ Split pane editor (1-3 columns)
- 📝 14 block types
- 🤖 AI integration (Claude, GPT, Gemini, Groq)
- 🕸️ Knowledge graph
- 📚 Prompt library with cron scheduling
- 📄 HTML note generation
- 🔄 GitHub Gist sync

## 🔗 Linking Between Landing and App

To link from landing page to the Angular app:

1. **Edit landing page** (landing-light.html or landing-dark.html)

2. **Update "Get Started" button**:
   ```html
   <!-- Change this: -->
   <a href="#" class="cta-button">Get Started →</a>
   
   <!-- To this: -->
   <a href="/app" class="cta-button">Get Started →</a>
   ```

3. **Or use full URL**:
   ```html
   <a href="https://app.lore.app" class="cta-button">Get Started →</a>
   ```

## 🎯 Recommended Setup

For the best user experience:

1. **Landing page at root** (`/`)
   - First-time visitors see the landing page
   - Explains features and benefits
   - "Get Started" button leads to `/app`

2. **Angular app at `/app`**
   - Main application
   - Requires authentication (optional)
   - Full functionality

3. **Direct access to both landing pages**
   - `/` or `/light` → Light landing page
   - `/dark` → Dark landing page
   - Allows users to preview both themes

## 📊 Current Status

- ✅ Landing pages created and styled
- ✅ Light theme: Soft lavender (#F6F4FF)
- ✅ Dark theme: Deep purple-black (#0F0D1A)
- ✅ Responsive design
- ✅ Feature showcase
- ✅ Call-to-action buttons
- ✅ Accessible via direct URLs

## 🚧 Next Steps

1. **Test landing pages**:
   ```bash
   cd lore-app
   npm start
   # Visit: http://localhost:4200/landing-light.html
   ```

2. **Update links** in landing pages to point to your app

3. **Configure deployment** based on your hosting provider

4. **Set up analytics** to track landing page visits

5. **A/B test** light vs dark landing pages

---

**Quick Access URLs** (when dev server is running):
- 🌞 Light: http://localhost:4200/landing-light.html
- 🌙 Dark: http://localhost:4200/landing-dark.html
- 🚀 App: http://localhost:4200/
