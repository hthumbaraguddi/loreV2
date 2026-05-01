# Notes Grid Visual Guide

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                    [Stats: Total 7d AI Fav]│
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Breadcrumb: Shelf › All Notes                               │ │
│ │ 📄 Notes                                                     │ │
│ │ 12 notes across 3 notebooks                                 │ │
│ │                                                              │ │
│ │ [All] [Recent] [Favorites] [AI]                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Body                                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Toolbar                                                      │ │
│ │ [All] [Research] [Idea] [HTML]  [Sort: Recent ▼] [Grid][List]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Research │ │   Idea   │ │   HTML   │ │   Add    │           │
│ │ Mar 16   │ │ Mar 18   │ │ Apr 20   │ │   New    │           │
│ │          │ │          │ │          │ │   Note   │           │
│ │ Title    │ │ Title    │ │ Title    │ │          │           │
│ │ Preview  │ │ Preview  │ │ Preview  │ │          │           │
│ │ text...  │ │ text...  │ │ text...  │ │          │           │
│ │          │ │          │ │          │ │          │           │
│ │ [tag]    │ │ [tag]    │ │ [tag]    │ │          │           │
│ │ • 4 AI   │ │ • 2 AI   │ │ • 1 AI   │ │          │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Grid View (Default)

### Note Card Structure
```
┌─────────────────────────────────┐
│ [Research]           Mar 16  [⋮]│  ← Badge, Date, More button
│                                 │
│ Transformer Architecture        │  ← Title (Lora serif, 14px)
│ Deep Dive                       │
│                                 │
│ Attention mechanisms,           │  ← Preview (3 lines max)
│ positional encodings,           │
│ multi-head attention...         │
│                                 │
│ [attention] [NLP]      • 4 AI   │  ← Tags + AI indicator
└─────────────────────────────────┘
```

### Grid Properties
- **Columns**: `repeat(auto-fill, minmax(230px, 1fr))`
- **Gap**: 13px
- **Card Padding**: 16px
- **Border**: 1px solid var(--border)
- **Border Radius**: var(--r-lg) (12px)
- **Shadow**: var(--shadow)
- **Hover**: 
  - Border color changes to var(--p300)
  - Transforms up by 1px
  - Shadow increases

## List View

### Note Card Structure (Horizontal)
```
┌────────────────────────────────────────────────────────────────┐
│ [Research]  │ Transformer Architecture Deep Dive          [⋮] │
│  Mar 16     │ Attention mechanisms, positional encodings...   │
│             │ [attention] [NLP]                      • 4 AI   │
└────────────────────────────────────────────────────────────────┘
```

### List Properties
- **Columns**: 1fr (full width)
- **Card Layout**: Flexbox horizontal
- **Badge Column**: 70px min-width
- **Gap**: 12px between badge and content
- **Padding**: 12px 16px

## Badge Colors

| Type      | Background       | Text Color    |
|-----------|------------------|---------------|
| Research  | var(--teal-bg)   | var(--teal)   |
| Journal   | var(--amber-bg)  | var(--amber)  |
| Task      | var(--blue-bg)   | var(--blue)   |
| Idea      | var(--rose-bg)   | var(--rose)   |
| Reference | var(--p100)      | var(--p600)   |
| HTML      | var(--orange-bg) | var(--orange) |

## Interactive Elements

### Hover States
1. **Note Card**: Border color changes, lifts up, shadow increases
2. **More Button**: Appears (opacity 0 → 1), background on hover
3. **Tags**: Slight brightness change
4. **Add Card**: Background fills, border becomes solid

### Click Actions
1. **Note Card**: Opens note in editor
2. **More Button**: Shows context menu (future)
3. **Add Card**: Creates new note
4. **Tag**: Filters by tag (future)

## Stats Display

Located in top-right corner of header:
```
┌─────────────────────────────┐
│  12      8      5      3    │  ← Numbers (16px, Lora, --p600)
│ Total   7d     AI    Fav    │  ← Labels (9.5px, JetBrains Mono)
└─────────────────────────────┘
```

## Toolbar Elements

### Filter Buttons
- **Style**: Pill-shaped (border-radius: 20px)
- **Default**: White background, border
- **Active**: Purple background (--p600), white text
- **Size**: 11.5px font, 4px 11px padding

### Sort Dropdown
- **Style**: Rounded (--r-md)
- **Options**: Updated, Created, Title
- **Position**: margin-left: auto (right-aligned)

### Layout Toggle
- **Container**: Light purple background (--p50)
- **Buttons**: 26px × 22px
- **Active**: White background, purple icon, shadow
- **Icons**: Grid (4 squares) or List (4 lines)

## Typography Scale

| Element       | Font Family      | Size   | Weight | Color    |
|---------------|------------------|--------|--------|----------|
| Title         | Lora serif       | 14px   | 600    | --t1     |
| Preview       | Lora serif       | 12px   | 400    | --t3     |
| Badge         | JetBrains Mono   | 9px    | 600    | varies   |
| Date          | JetBrains Mono   | 10px   | 400    | --t4     |
| Tag           | JetBrains Mono   | 10px   | 400    | --p600   |
| AI Count      | JetBrains Mono   | 10px   | 400    | --t4     |
| Header Title  | Lora serif       | 22px   | 600    | --t1     |
| Breadcrumb    | DM Sans          | 12px   | 400    | --t3     |
| Subtitle      | DM Sans          | 12.5px | 400    | --t3     |

## Spacing System

- **Header Padding**: 18px 24px 0
- **Body Padding**: 20px 24px
- **Card Padding**: 16px (grid), 12px 16px (list)
- **Card Gap**: 13px
- **Toolbar Gap**: 7px
- **Badge Gap**: 7px
- **Tag Gap**: 5px

## Responsive Behavior

The grid automatically adjusts columns based on available width:
- **Minimum card width**: 230px
- **Maximum columns**: As many as fit
- **List view**: Always 1 column

Example breakpoints:
- **< 500px**: 1 column
- **500-730px**: 2 columns
- **730-960px**: 3 columns
- **960-1190px**: 4 columns
- **> 1190px**: 5+ columns

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators
- Color contrast compliance
