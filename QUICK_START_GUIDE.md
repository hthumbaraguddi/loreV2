# Quick Start Guide - Landing Page

## Access the App

🚀 **Development Server**: http://localhost:4201/

## What You'll See

### 1. Landing Page (First Visit)
- **URL**: `/`
- **View**: Full landing page, NO sidebar
- **Actions**: Choose authentication method

### 2. App Interface (After Authentication)
- **URL**: `/notes` (or other routes)
- **View**: Full app WITH sidebar
- **Actions**: Create notes, shelves, notebooks

## Authentication Options

### Option 1: GitHub (Recommended)
```
1. Click "Continue with GitHub"
2. GitHub OAuth popup opens
3. Authorize the app
4. Data syncs from your private Gist
5. Enter the app with sidebar
```

**Benefits:**
- ✅ Data backed up to GitHub
- ✅ Access from any device
- ✅ Auto-sync on changes
- ✅ Version history

### Option 2: Local Storage
```
1. Click "Use Locally"
2. Data stored in browser
3. Enter the app immediately
```

**Benefits:**
- ✅ No account needed
- ✅ Works offline
- ✅ Instant access
- ✅ Privacy-focused

## Key Features

### Landing Page Shows:
- Hero section with feature highlights
- AI capabilities (Claude, GPT-4o, Gemini, Groq)
- Core features (shelves, notebooks, split panes)
- Block types (14 different types)
- Knowledge graph visualization
- Scheduled prompts and cron jobs
- HTML note generation
- Settings and customization options

### App Interface Includes:
- **Sidebar**: Navigation to all features
- **Nav Rail**: Quick access icons
- **Editor**: Split pane note editing
- **Graph**: Knowledge graph visualization
- **Settings**: Full configuration panel
- **Templates**: 8 built-in templates
- **AI Chat**: Inline AI assistance

## Quick Commands

### Start Development Server
```bash
cd lore-app
npm start
```

### Build for Production
```bash
cd lore-app
npm run build:app
```

### Run Tests
```bash
cd lore-app
npm test
```

## Troubleshooting

### Landing Page Shows Sidebar
- Clear browser cache
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Check you're on root URL (`/`)

### Authentication Not Working
- Check browser console for errors
- Verify storage sync service is loaded
- Try the other authentication method

### Styles Not Loading
- Clear browser cache
- Check dev server is running
- Verify no build errors in terminal

## File Locations

### Landing Component
```
lore-app/src/app/features/landing/
├── landing.component.ts       # Logic
├── landing.component.html     # Template
└── landing.component.scss     # Styles
```

### App Structure
```
lore-app/src/app/
├── app.component.ts           # Root component
├── app.routes.ts              # Route configuration
└── features/
    ├── landing/               # Landing page
    ├── shell/                 # App shell (sidebar)
    ├── editor/                # Note editor
    ├── graph/                 # Knowledge graph
    └── settings/              # Settings panel
```

## Documentation

- `LANDING_PAGE_FINAL_IMPLEMENTATION.md` - Complete technical details
- `LANDING_PAGE_BEFORE_AFTER.md` - Visual comparison
- `LANDING_PAGE_VISUAL_GUIDE.md` - Design and structure
- `LANDING_PAGE_INTEGRATION_COMPLETE.md` - Initial integration

## Status

✅ **Landing page**: Standalone, no sidebar
✅ **Authentication**: GitHub and local storage
✅ **Routing**: Proper shell wrapping
✅ **Build**: Successful
✅ **Server**: Running on port 4201

---

**Last Updated**: May 3, 2026
**Version**: 3.0.0
**Status**: Production ready
