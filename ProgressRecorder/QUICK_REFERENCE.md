# Lore Design System - Quick Reference

## 🎨 Colors

### Light Theme
```scss
--bg: #F6F4FF;              // Canvas background
--surface: #FFFFFF;         // Card/panel background
--t1: #1A1130;              // Primary text
--t2: #3B2F62;              // Secondary text
--t3: #7B6F9A;              // Muted text
--border: rgba(124, 58, 237, 0.12);  // Borders
--p600: #7C3AED;            // Primary accent
```

### Dark Theme
```scss
--bg: #0F0D1A;              // Canvas background
--surface: #1E1A2E;         // Card/panel background
--t1: #F0EEFF;              // Primary text
--t2: #C4B5FD;              // Secondary text
--t3: #7B6F9A;              // Muted text
--border: rgba(139, 92, 246, 0.14);  // Borders
--p500: #8B5CF6;            // Primary accent
```

## 📝 Typography

```scss
font-family: var(--lore-font-serif);   // Lora - headings
font-family: var(--lore-font-sans);    // DM Sans - body
font-family: var(--lore-font-mono);    // JetBrains Mono - code
```

## 📏 Spacing

```scss
--lore-space-4: 0.25rem;    // 4px
--lore-space-8: 0.5rem;     // 8px
--lore-space-12: 0.75rem;   // 12px
--lore-space-16: 1rem;      // 16px
--lore-space-24: 1.5rem;    // 24px
--lore-space-32: 2rem;      // 32px
```

## 🔲 Border Radius

```scss
--r-sm: 5px;    // Small
--r-md: 10px;   // Medium
--r-lg: 14px;   // Large
--r-xl: 20px;   // Extra large
```

## 💫 Shadows

```scss
--shadow: 0 4px 24px rgba(80, 40, 180, 0.08);
--shadow-card: 0 1px 4px rgba(80, 40, 180, 0.07), 0 4px 16px rgba(80, 40, 180, 0.06);
```

## 🎯 Theme Service

```typescript
import { ThemeService } from '@app/core';

// Inject service
private themeService = inject(ThemeService);

// Set theme
this.themeService.setTheme('dark');

// Toggle theme
this.themeService.toggleTheme();

// Get current theme
const theme = this.themeService.appliedTheme(); // 'light' | 'dark'
```

## 🎨 Component Styling

```scss
.my-component {
  background: var(--surface);
  color: var(--t1);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--lore-space-16);
  box-shadow: var(--shadow);
}

.my-button {
  background: var(--p600);
  color: white;
  
  &:hover {
    background: var(--p500);
  }
}
```

## 🏷️ Note Type Colors

```scss
--teal: #0D9488;    // Light | #34D399 Dark
--amber: #D97706;   // Light | #FCD34D Dark
--blue: #2563EB;    // Light | #60A5FA Dark
--rose: #DB2777;    // Light | #F472B6 Dark
--orange: #EA580C;  // Light | #FB923C Dark
--green: #16A34A;   // Light | #4ADE80 Dark
```

## ⚡ Quick Component Template

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from '@app/core';

@Component({
  selector: 'app-my-component',
  standalone: true,
  template: `
    <div class="container">
      <h2 class="title">{{ title }}</h2>
      <p class="description">{{ description }}</p>
    </div>
  `,
  styles: [`
    .container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: var(--lore-space-24);
      box-shadow: var(--shadow-card);
    }

    .title {
      font-family: var(--lore-font-serif);
      font-size: var(--lore-font-size-xl);
      color: var(--t1);
      margin-bottom: var(--lore-space-8);
    }

    .description {
      font-family: var(--lore-font-sans);
      font-size: var(--lore-font-size-md);
      color: var(--t2);
      line-height: var(--lore-line-height-relaxed);
    }
  `]
})
export class MyComponent {
  title = 'Component Title';
  description = 'Component description';
}
```

## 📂 File Locations

```
lore-app/
├── public/
│   ├── index.html              # Light landing page
│   └── index-dark.html         # Dark landing page
├── src/
│   ├── styles/
│   │   └── _tokens.scss        # All design tokens
│   └── app/core/services/
│       └── theme.service.ts    # Theme management
```

## 📚 Documentation

- **DESIGN_SYSTEM.md** - Complete design system guide
- **THEME_USAGE_EXAMPLE.md** - Code examples
- **LANDING_PAGES_SETUP.md** - Setup details
- **IMPLEMENTATION_SUMMARY.md** - Overview

## ⌨️ Keyboard Shortcuts

```typescript
// Add to app.component.ts
@HostListener('window:keydown', ['$event'])
handleKeyboard(event: KeyboardEvent) {
  // Cmd/Ctrl + Shift + D = Toggle theme
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'D') {
    this.themeService.toggleTheme();
  }
}
```

## ✅ Best Practices

1. ✅ Always use CSS custom properties
2. ✅ Test in both light and dark themes
3. ✅ Use semantic tokens over short aliases
4. ✅ Follow the spacing scale
5. ✅ Use provided shadows
6. ✅ Respect the typography system
7. ✅ Add smooth transitions
8. ✅ Test accessibility/contrast

## ❌ Common Mistakes

```scss
// ❌ Don't hardcode colors
background: #FFFFFF;
color: #000000;

// ✅ Use tokens
background: var(--surface);
color: var(--t1);

// ❌ Don't use arbitrary spacing
padding: 13px;

// ✅ Use spacing scale
padding: var(--lore-space-12);

// ❌ Don't create custom shadows
box-shadow: 0 2px 8px rgba(0,0,0,0.1);

// ✅ Use provided shadows
box-shadow: var(--shadow);
```

## 🚀 Getting Started

1. Import ThemeService in your component
2. Use CSS custom properties for styling
3. Test in both themes
4. Add theme toggle to settings
5. Enjoy! 🎉
