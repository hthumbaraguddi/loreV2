# How to Access the Landing Page

## Quick Start

### Option 1: Development Server (Already Running)
The development server is currently running on:
```
http://localhost:4201/
```
Just open this URL in your browser to see the landing page!

### Option 2: Start Fresh
If you need to restart the server:

```bash
cd lore-app
npm start
```

Then open: http://localhost:4200/ (or the port shown in terminal)

### Option 3: Specific Port
To run on a specific port:

```bash
cd lore-app
ng serve --port 4201
```

## What You'll See

### Landing Page Features
1. **Dark Theme** - Purple-accented dark background
2. **Hero Section** - Main content with feature highlights
3. **Auth Card** - Two authentication options:
   - "Continue with GitHub" button
   - "Use Locally" button
4. **Feature Showcases** - Scrollable content showing all app capabilities
5. **Footer** - Links and version info

### Navigation Flow
```
Landing Page (/)
    ↓
    ├─→ Click "Continue with GitHub" → /notes?auth=github
    └─→ Click "Use Locally" → /notes?auth=local
```

## Testing the Integration

### 1. View Landing Page
- Open http://localhost:4201/
- Verify dark theme with purple accents
- Check that all sections load correctly

### 2. Test Navigation
- Click "Continue with GitHub" button
  - Should navigate to `/notes?auth=github`
- Click "Use Locally" button
  - Should navigate to `/notes?auth=local`
- Click "Get Started →" in top navigation
  - Should navigate to `/notes?auth=local`

### 3. Verify Theme
- Check that colors match the design system
- Verify typography (Lora, DM Sans, JetBrains Mono)
- Test hover effects on buttons and cards

## Build for Production

### Build Command
```bash
cd lore-app
npm run build:app
```

### Output Location
```
lore-app/dist/lore-app/
```

### Deploy
The built files can be deployed to:
- Azure Static Web Apps (already configured)
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

## Troubleshooting

### Port Already in Use
If port 4200 is already in use:
```bash
ng serve --port 4201
```

### Build Errors
If you encounter build errors:
```bash
cd lore-app
rm -rf node_modules package-lock.json
npm install
npm run build:app
```

### Landing Page Not Showing
1. Check that you're on the root URL (`/`)
2. Clear browser cache
3. Check browser console for errors
4. Verify the development server is running

### Styles Not Loading
1. Check that `landing.component.scss` exists
2. Verify no SCSS syntax errors
3. Check browser DevTools for CSS loading issues

## File Locations

### Component Files
```
lore-app/src/app/features/landing/
├── landing.component.ts       # Component logic
├── landing.component.html     # Template (594 lines)
└── landing.component.scss     # Styles (477 lines)
```

### Route Configuration
```
lore-app/src/app/app.routes.ts
```

### Build Configuration
```
lore-app/angular.json
```

## Documentation

For more details, see:
- `LANDING_PAGE_INTEGRATION_COMPLETE.md` - Full implementation details
- `LANDING_PAGE_VISUAL_GUIDE.md` - Visual structure and design
- `TASK_3_COMPLETE.md` - Task completion summary

## Quick Commands Reference

```bash
# Start development server
cd lore-app && npm start

# Start on specific port
cd lore-app && ng serve --port 4201

# Build for production
cd lore-app && npm run build:app

# Run tests (if needed)
cd lore-app && npm test

# Check for errors
cd lore-app && ng build --configuration development
```

## Current Status

✅ **Landing page is live and accessible**
✅ **Development server running on http://localhost:4201/**
✅ **All navigation working correctly**
✅ **Theme integration complete**

---

**Last Updated**: May 3, 2026
**Status**: Fully functional
