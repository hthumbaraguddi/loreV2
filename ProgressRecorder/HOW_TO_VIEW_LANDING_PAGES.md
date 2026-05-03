# 🎨 How to View the Landing Pages

## Quick Start

### Option 1: View During Development (Easiest)

1. **Start the dev server** (if not already running):
   ```bash
   cd lore-app
   npm start
   ```

2. **Open in your browser**:
   - **Light theme**: http://localhost:4200/landing-light.html
   - **Dark theme**: http://localhost:4200/landing-dark.html

That's it! The landing pages will load with all their beautiful styling.

---

### Option 2: Build and Preview

```bash
cd lore-app

# Build the production app
npm run build

# Preview the landing page
npm run preview:landing
```

This will build the app and automatically open the light landing page in your browser.

---

### Option 3: Manual Build and Serve

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

---

## 📁 File Locations

### Source Files
```
lore-app/public/
├── landing-light.html    ← Light theme landing page
├── landing-dark.html     ← Dark theme landing page
└── favicon.ico
```

### After Build
```
lore-app/dist/lore-app/browser/
├── landing-light.html    ← Light theme landing page
├── landing-dark.html     ← Dark theme landing page
├── index.html            ← Angular app entry point
└── ... (other app files)
```

---

## 🎨 What You'll See

### Light Theme Landing Page
- Soft lavender background (#F6F4FF)
- Purple-tinted UI elements
- Clean, modern design
- Feature showcase
- Call-to-action buttons

### Dark Theme Landing Page
- Deep purple-black background (#0F0D1A)
- Purple glow effects
- Rich, immersive design
- Same features as light theme
- Optimized for low-light viewing

---

## 🔗 URLs Reference

| Environment | Light Theme | Dark Theme |
|-------------|-------------|------------|
| **Development** | http://localhost:4200/landing-light.html | http://localhost:4200/landing-dark.html |
| **Preview** | http://localhost:8080/landing-light.html | http://localhost:8080/landing-dark.html |
| **Production** | https://yourdomain.com/landing-light.html | https://yourdomain.com/landing-dark.html |

---

## 🚀 Features Showcased

Both landing pages highlight:

- ✨ **Split Pane Editor** - 1, 2, or 3 simultaneous panes
- 📝 **14 Block Types** - Hypothesis, Conclusion, Key Diff, etc.
- 🤖 **AI Integration** - Claude, GPT-4o, Gemini, Groq
- 🕸️ **Knowledge Graph** - Live visualization of note connections
- 📚 **Prompt Library** - Reusable prompts with variables
- ⏱️ **Scheduled Prompts** - Cron jobs for automated AI tasks
- 📄 **HTML Note Generation** - Rich, self-contained reports
- 🔄 **GitHub Gist Sync** - Auto-sync to private Gist
- 🔗 **Note Linking** - [[Wiki-style]] bidirectional links
- 🎨 **8 Built-in Templates** - Research, Journal, Finance, etc.

---

## 💡 Tips

### Viewing Both Themes Side-by-Side

Open two browser windows:
1. http://localhost:4200/landing-light.html
2. http://localhost:4200/landing-dark.html

Compare the themes and see which one you prefer!

### Testing Responsiveness

Use browser dev tools to test different screen sizes:
1. Open landing page
2. Press F12 (or Cmd+Option+I on Mac)
3. Click device toolbar icon
4. Select different devices (iPhone, iPad, etc.)

### Sharing with Others

If you want to share the landing pages with others:

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist/lore-app/browser` folder** to any static hosting:
   - Netlify
   - Vercel
   - GitHub Pages
   - Azure Static Web Apps
   - AWS S3 + CloudFront

3. **Share the URLs**:
   - `https://yourdomain.com/landing-light.html`
   - `https://yourdomain.com/landing-dark.html`

---

## 🐛 Troubleshooting

### "Cannot GET /landing-light.html"

**Solution**: Make sure the dev server is running:
```bash
cd lore-app
npm start
```

### "404 Not Found"

**Solution**: Check that you're using the correct URL:
- ✅ http://localhost:4200/landing-light.html
- ❌ http://localhost:4200/index.html (this is the Angular app)

### Landing page looks broken

**Solution**: Clear your browser cache:
1. Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Or open in incognito/private mode

### Port 4200 is already in use

**Solution**: Either:
1. Stop the other process using port 4200
2. Or use a different port:
   ```bash
   ng serve --port 4201
   # Then visit: http://localhost:4201/landing-light.html
   ```

---

## 📚 More Information

For detailed deployment instructions and configuration examples, see:
- **LANDING_PAGES_ACCESS.md** - Complete access guide
- **LANDING_PAGES_SETUP.md** - Setup and implementation details
- **DESIGN_SYSTEM.md** - Design system reference

---

## ✅ Quick Checklist

- [ ] Dev server is running (`npm start`)
- [ ] Opened http://localhost:4200/landing-light.html
- [ ] Opened http://localhost:4200/landing-dark.html
- [ ] Landing pages display correctly
- [ ] All features are showcased
- [ ] Call-to-action buttons are visible

---

**Ready to view?** Just run `npm start` and visit:
- 🌞 http://localhost:4200/landing-light.html
- 🌙 http://localhost:4200/landing-dark.html

Enjoy! 🎉
