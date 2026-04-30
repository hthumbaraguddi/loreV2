# Lore Design Specifications
Extracted from mock v3 for pixel-perfect implementation

## Icon Sizes Reference

### Nav Rail
- **Nav Logo**: 34px × 34px
- **Nav Button**: 40px × 40px
- **Nav Button SVG**: 18px × 18px
- **Nav Divider**: 28px × 1px
- **Nav Avatar**: 30px × 30px

### Sidebar Topbar
- **Search Icon SVG**: 12px × 12px
- **View Toggle Button**: 26px × 22px
- **View Toggle SVG**: 13px × 13px
- **New Button**: 26px × 26px
- **New Button SVG**: 14px × 14px
- **Search Close Button**: 22px × 22px

### Sidebar Tree - Shelf
- **Shelf Chevron Container**: 16px × 16px
- **Shelf Chevron SVG**: 9px × 9px
- **Shelf Dot**: 8px × 8px (border-radius: 50%)
- **Shelf Add Button**: 18px × 18px
- **Shelf Add SVG**: 10px × 10px

### Sidebar Tree - Notebook
- **Notebook Chevron Container**: 14px × 14px
- **Notebook Chevron SVG**: 9px × 9px
- **Notebook Icon**: 12px (font-size for emoji)
- **Notebook Add Button**: 16px × 16px
- **Notebook Add SVG**: 9px × 9px

### Sidebar Tree - Note Item
- **Note Type Dot (compact)**: 6px × 6px

## Spacing & Layout

### Sidebar
- **Width**: 268px (--sb-w)
- **Topbar Padding**: 10px 12px 8px
- **Topbar Gap**: 6px
- **Tree Padding**: 6px 0 16px

### Shelf
- **Header Padding**: 5px 8px 5px 6px
- **Margin**: 1px 4px
- **Border Radius**: 6px
- **Dot Margin**: 0 7px 0 1px
- **Count Padding**: 1px 5px
- **Count Border Radius**: 3px

### Notebook
- **Margin Left**: 8px (nested under shelf)
- **Header Padding**: 4px 8px 4px 4px
- **Margin**: 1px 4px
- **Border Radius**: 6px
- **Icon Margin**: 0 5px 0 1px

### Note Item (Expanded)
- **Margin**: 1px 4px 1px 18px (18px left for nesting)
- **Padding**: 7px 10px 7px 8px
- **Border Radius**: 9px (--r-md)
- **Border Left**: 2px solid (active state)

### Note Item (Compact)
- **Padding**: 4px 10px 4px 8px
- **Margin**: 0 4px 0 18px
- **Border Radius**: 5px

## Typography

### Sidebar
- **Search Input**: 12.5px
- **Shelf Name**: 12px, font-weight: 600
- **Shelf Count**: 10px, JetBrains Mono
- **Notebook Name**: 12.5px
- **Notebook Count**: 10px, JetBrains Mono
- **Note Badge**: 9px, font-weight: 600, JetBrains Mono
- **Note Date**: 10px, JetBrains Mono
- **Note Title**: 12.5px, font-weight: 500
- **Note Preview**: 11px, line-height: 1.4

## Colors (Light Mode)

### Purple Palette
- **p50**: #F5F3FF
- **p100**: #EDE9FE
- **p200**: #DDD6FE
- **p300**: #C4B5FD
- **p400**: #A78BFA
- **p500**: #8B5CF6
- **p600**: #7C3AED (primary accent)
- **p700**: #6D28D9
- **p900**: #2E1065 (nav rail)

### Neutrals
- **bg**: #F8F7FC
- **surface**: #FFFFFF
- **surface2**: #FAFAF9
- **border**: rgba(109,40,217,0.1)
- **border2**: rgba(109,40,217,0.18)
- **t1**: #1A1529 (primary text)
- **t2**: #4B4568 (secondary text)
- **t3**: #8C84A8 (tertiary text)
- **t4**: #BCB6D4 (quaternary text)

### Note Type Colors
- **Research (Teal)**: #0F766E, bg: #F0FDFA
- **Journal (Amber)**: #D97706, bg: #FFFBEB
- **Task (Blue)**: #1D4ED8, bg: #EFF6FF
- **Idea (Rose)**: #BE185D, bg: #FFF1F2
- **Reference (Purple)**: #8B5CF6, bg: #EDE9FE
- **HTML (Green)**: #15803D, bg: #F0FDF4

## Animations

### Transitions
- **Sidebar Width**: 0.2s
- **Shelf/Notebook Expand**: 0.25s ease (shelf), 0.22s ease (notebook)
- **Chevron Rotate**: 0.2s
- **Hover States**: 0.15s (buttons), 0.12s (items), 0.1s (note items)
- **Border Color**: 0.15s

### Transform
- **Chevron Open**: rotate(90deg)
- **Max Height**: 3000px (shelf), 600px (notebook)

## Border Radius Scale
- **r-sm**: 5px
- **r-md**: 9px
- **r-lg**: 14px

## Shadows
- **shadow**: 0 1px 3px rgba(109,40,217,0.06), 0 4px 16px rgba(109,40,217,0.05)
- **shadow-lg**: 0 8px 32px rgba(109,40,217,0.18), 0 2px 8px rgba(0,0,0,0.08)

## Z-Index Scale
- **Nav Rail**: 20
- **Sidebar**: default
- **Search Results Overlay**: 50
- **Context Menu**: 1000
- **Nav Tip**: 200
- **Mention Dropdown**: 200

## Scrollbar
- **Width/Height**: 5px
- **Track**: transparent
- **Thumb**: var(--p200), border-radius: 3px
