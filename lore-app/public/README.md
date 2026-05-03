# Landing Pages

This folder contains the standalone landing pages for Lore.

## Files

- **landing-light.html** - Light theme landing page
- **landing-dark.html** - Dark theme landing page

## How to View

### During Development

When running `npm start`, the landing pages are accessible at:

- Light theme: http://localhost:4200/landing-light.html
- Dark theme: http://localhost:4200/landing-dark.html

### In Production

After building (`npm run build`), the landing pages will be in the `dist/lore-app/browser/` folder:

- `dist/lore-app/browser/landing-light.html`
- `dist/lore-app/browser/landing-dark.html`

## Deployment Options

### Option 1: Separate Landing Page Deployment

Deploy the landing pages to a separate domain or subdomain:
- Landing: `https://lore.app` → `landing-light.html`
- App: `https://app.lore.app` → Angular app

### Option 2: Same Domain with Routing

Configure your web server to serve:
- `/` → `landing-light.html` (or `landing-dark.html` based on user preference)
- `/app` → Angular app

### Option 3: Use Landing as Index

If you want the landing page as the main entry point:

1. Copy `landing-light.html` to `index.html` in the dist folder after build
2. Update links in the landing page to point to `/app` for the Angular app
3. Configure Angular to use a base href of `/app`

## Example: Nginx Configuration

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

## Example: Azure Static Web Apps

In `staticwebapp.config.json`:

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
  ]
}
```

## Development Preview

To preview the landing pages locally:

1. Build the app: `npm run build`
2. Serve the dist folder: `npx http-server dist/lore-app/browser`
3. Open: http://localhost:8080/landing-light.html

Or use the provided script:

```bash
npm run preview:landing
```
