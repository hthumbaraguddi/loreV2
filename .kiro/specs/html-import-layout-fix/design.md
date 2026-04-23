# HTML Import Layout Fix Design

## Overview

This design addresses layout inconsistencies in the Lore app's topbar and content area when the sidebar is toggled and when HTML files are imported as notes. The root cause is that the topbar and page editor use fixed padding values that don't respond to sidebar state changes, and the CSS rules for sidebar collapse are incomplete. The fix involves making the topbar and content area width calculations responsive to sidebar state using CSS custom properties and ensuring HTML content adapts to available space.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the layout bug - when the sidebar is toggled or when HTML content is displayed, the topbar and content area fail to adjust their width appropriately
- **Property (P)**: The desired behavior - topbar and content areas should dynamically adjust their width based on sidebar state, maintaining consistent layout
- **Preservation**: Existing layout behavior for default sidebar-open state and non-HTML notes must remain unchanged
- **Topbar**: The horizontal bar at the top of the main content area (`#topbar`) containing breadcrumbs, search, and action buttons
- **Page Editor Topbar**: The topbar within the page editor component (`.pg-editor-topbar`) with Back, Delete, and Save buttons
- **Sidebar State**: Whether the sidebar is collapsed (`state.sidebarCollapsed === true`) or open (default)
- **HTML Content**: Notes imported from HTML files that contain rich formatted content with embedded styles

## Bug Details

### Bug Condition

The bug manifests when the sidebar state changes or when HTML content is displayed. The topbar and page editor components use fixed padding values that don't respond to the sidebar's collapsed state, and there's no mechanism to notify child components of layout changes.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { sidebarState: 'open' | 'collapsed', contentType: 'html' | 'standard', notesAdded: boolean }
  OUTPUT: boolean
  
  RETURN (input.sidebarState == 'collapsed' AND topbarWidth != expectedWidthForCollapsed)
         OR (input.notesAdded AND topbarWidth != consistentWidth)
         OR (input.contentType == 'html' AND NOT contentRespondsToSidebarToggle)
END FUNCTION
```

### Examples

- **Topbar width inconsistency**: When notes are added to a notebook, the topbar width changes instead of maintaining consistent width across the full available space
- **Sidebar collapse non-responsive**: When the sidebar is toggled off (collapsed), the topbar maintains its original padding (36px left) instead of adjusting to 24px, failing to expand into the newly available space
- **Controls positioning**: When the sidebar is collapsed, topbar controls don't reposition to utilize the full width appropriately
- **HTML content non-responsive**: When HTML files are imported as notes and the sidebar is toggled, the HTML content doesn't expand to fill available space or center appropriately
- **Page editor layout**: When the page editor is open with HTML content and the sidebar state changes, the content area doesn't respond to the layout change

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When the sidebar is in its default open state, the topbar SHALL CONTINUE TO display with its current width and padding (36px left, 20px right)
- When regular (non-HTML) notes are displayed, they SHALL CONTINUE TO render with their existing layout behavior
- When the page editor is used for standard block-based notes, it SHALL CONTINUE TO function with its current layout constraints (max-width: 720px)
- When the mobile view is active, the sidebar and topbar SHALL CONTINUE TO behave according to the existing mobile-specific layout rules
- When users interact with topbar controls (search, buttons, etc.), these controls SHALL CONTINUE TO function as they currently do
- When the app switches between different view modes (content area, page editor, settings panel), the transitions SHALL CONTINUE TO work smoothly

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Fixed Padding Values**: The topbar and page editor topbar use fixed padding values (36px left) that don't respond to sidebar state
   - `#topbar` has `padding: 9px 20px 9px 36px` which is static
   - `.pg-editor-topbar` has `padding: 9px 24px 9px 36px` which is also static
   - The CSS rule `#app.sb-collapsed #topbar { padding-left: 24px; }` exists but may not be applied correctly

2. **Incomplete CSS Selectors**: The sidebar collapse class (`sb-collapsed`) is applied to `#app`, but not all child components respond to this class
   - The page editor topbar has a rule for `.pg-editor-topbar` under `#app.sb-collapsed`, but it may not be specific enough
   - HTML content containers don't have responsive width rules

3. **Missing Width Calculations**: There's no dynamic width calculation based on sidebar state
   - The sidebar width is defined as `--sbw: 262px` but this isn't used in width calculations for main content
   - When sidebar is collapsed, the main area should expand by 262px but this isn't implemented

4. **Component Isolation**: The page editor component doesn't receive sidebar state as an input, so it can't respond to changes
   - The component relies on global CSS rules which may not cascade properly
   - HTML content within notes doesn't have responsive container rules

## Correctness Properties

Property 1: Bug Condition - Topbar Width Consistency and Responsiveness

_For any_ layout state where the sidebar is toggled (collapsed or expanded) or notes are added/removed, the topbar and page editor topbar SHALL maintain consistent width across the full available horizontal space, adjusting their left padding from 36px (sidebar open) to 24px (sidebar collapsed), and all controls SHALL reposition appropriately to utilize the full width.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition - HTML Content Responsiveness

_For any_ HTML content displayed in notes where the sidebar state changes, the HTML content container SHALL dynamically adjust its width to either expand to fill the available space or align to center based on the content's natural width, ensuring the content responds to layout changes without overflow or misalignment.

**Validates: Requirements 2.4, 2.5**

Property 3: Preservation - Default Layout Behavior

_For any_ layout state where the sidebar is in its default open position and standard (non-HTML) notes are displayed, the topbar and content areas SHALL produce exactly the same layout as the original implementation, preserving all existing padding, width constraints, and visual appearance.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `lore-app/src/styles.scss`

**Section**: Topbar and Main Area Layout

**Specific Changes**:

1. **Add CSS Custom Property for Dynamic Padding**: Define a custom property that changes based on sidebar state
   ```scss
   :root {
     --topbar-left-padding: 36px;
   }
   
   #app.sb-collapsed {
     --topbar-left-padding: 24px;
   }
   ```

2. **Update Topbar Padding to Use Custom Property**: Replace fixed padding with the dynamic custom property
   ```scss
   #topbar {
     padding: 9px 20px 9px var(--topbar-left-padding);
     // ... rest of existing rules
   }
   ```

3. **Update Page Editor Topbar Padding**: Ensure the page editor topbar also uses the dynamic padding
   ```scss
   .pg-editor-topbar {
     padding: 9px 24px 9px var(--topbar-left-padding);
     // ... rest of existing rules
   }
   ```

4. **Add Width Calculation for Main Content**: Ensure the main content area expands when sidebar is collapsed
   ```scss
   #main {
     flex: 1;
     display: flex;
     flex-direction: column;
     overflow: hidden;
     min-width: 0;
     position: relative;
     width: calc(100vw - var(--sbw)); // When sidebar is open
   }
   
   #app.sb-collapsed #main {
     width: 100vw; // When sidebar is collapsed
   }
   ```

5. **Add Responsive Rules for HTML Content**: Ensure HTML content containers respond to sidebar state
   ```scss
   .card-body--html {
     overflow: hidden;
     border-radius: 0 0 12px 12px;
     max-width: 100%;
     
     iframe, .html-content {
       max-width: 100%;
       width: 100%;
     }
   }
   
   .pg-editor-body--wide {
     max-width: none;
     width: 100%;
     
     .card-body--html {
       width: 100%;
     }
   }
   ```

6. **Ensure Topbar Controls Adjust**: Verify that topbar controls use flexbox properly to adjust positioning
   ```scss
   #topbar {
     // ... existing rules
     justify-content: space-between; // Ensure controls spread across available width
   }
   
   .tb-crumb {
     flex: 1;
     min-width: 0;
     overflow: hidden;
     max-width: none; // Allow breadcrumb to use available space
   }
   ```

**File**: `lore-app/src/app/components/page-editor/page-editor.component.scss`

**Section**: Page Editor Layout

**Specific Changes**:

1. **Remove Fixed Padding from Component Styles**: Let the global styles handle padding
   ```scss
   .pg-editor-topbar {
     display: flex;
     align-items: center;
     justify-content: space-between;
     // Remove: padding: 9px 24px 9px 36px;
     // This will be inherited from global styles
     border-bottom: 1px solid var(--border);
     flex-shrink: 0;
     gap: 12px;
   }
   ```

2. **Ensure Wide Mode Respects Sidebar State**: The wide mode should still respond to sidebar collapse
   ```scss
   .pg-editor-body--wide {
     max-width: none;
     width: 100%;
     padding: 0 24px; // Consistent horizontal padding
   }
   ```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate sidebar toggle events and HTML content rendering, measuring the computed styles and layout dimensions. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Topbar Width on Sidebar Toggle**: Measure topbar width before and after sidebar collapse (will fail on unfixed code - width should increase but doesn't)
2. **Topbar Padding on Sidebar Toggle**: Measure topbar left padding before and after sidebar collapse (will fail on unfixed code - padding should change from 36px to 24px but doesn't)
3. **Page Editor Topbar Width**: Measure page editor topbar width when sidebar is collapsed (will fail on unfixed code - doesn't expand)
4. **HTML Content Width on Sidebar Toggle**: Measure HTML content container width before and after sidebar toggle (will fail on unfixed code - doesn't adjust)
5. **Topbar Width Consistency**: Add notes to a notebook and measure topbar width (may fail on unfixed code - width changes instead of staying consistent)

**Expected Counterexamples**:
- Topbar maintains 36px left padding even when sidebar is collapsed
- Topbar width doesn't increase when sidebar is collapsed
- Page editor topbar doesn't respond to sidebar state changes
- HTML content containers don't adjust width when sidebar is toggled
- Possible causes: fixed padding values, incomplete CSS selectors, missing width calculations, component isolation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed CSS produces the expected behavior.

**Pseudocode:**
```
FOR ALL layoutState WHERE isBugCondition(layoutState) DO
  result := measureLayout_fixed(layoutState)
  ASSERT expectedLayoutBehavior(result)
END FOR
```

**Test Cases**:
1. **Sidebar Collapsed - Topbar Padding**: When sidebar is collapsed, topbar left padding SHALL be 24px
2. **Sidebar Collapsed - Topbar Width**: When sidebar is collapsed, topbar SHALL expand to use full available width
3. **Sidebar Collapsed - Page Editor**: When sidebar is collapsed and page editor is open, page editor topbar SHALL use 24px left padding
4. **HTML Content Responsive**: When HTML content is displayed and sidebar is toggled, content container SHALL adjust width appropriately
5. **Notes Added - Topbar Consistency**: When notes are added to a notebook, topbar width SHALL remain consistent

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed CSS produces the same result as the original CSS.

**Pseudocode:**
```
FOR ALL layoutState WHERE NOT isBugCondition(layoutState) DO
  ASSERT measureLayout_original(layoutState) = measureLayout_fixed(layoutState)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe layout behavior on UNFIXED code first for sidebar-open state and standard notes, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Sidebar Open - Topbar Layout**: Observe that topbar has 36px left padding and standard width on unfixed code, then verify this continues after fix
2. **Standard Notes - Layout**: Observe that standard (non-HTML) notes render with existing layout on unfixed code, then verify this continues after fix
3. **Page Editor - Standard Mode**: Observe that page editor with standard blocks uses 720px max-width on unfixed code, then verify this continues after fix
4. **Mobile View - Layout**: Observe that mobile view layout works correctly on unfixed code, then verify this continues after fix
5. **Control Interactions**: Observe that topbar controls function correctly on unfixed code, then verify this continues after fix

### Unit Tests

- Test CSS custom property values in different sidebar states
- Test computed padding values for topbar in sidebar-open and sidebar-collapsed states
- Test computed width values for main content area in both states
- Test that HTML content containers have appropriate max-width and overflow rules
- Test that page editor topbar inherits correct padding from global styles

### Property-Based Tests

- Generate random sidebar state transitions and verify topbar padding adjusts correctly
- Generate random note additions and verify topbar width remains consistent
- Generate random HTML content sizes and verify containers handle overflow appropriately
- Test that all non-sidebar-related layout properties remain unchanged across many scenarios

### Integration Tests

- Test full user flow: open app → toggle sidebar → verify topbar expands
- Test HTML import flow: import HTML file → toggle sidebar → verify content adjusts
- Test page editor flow: open page editor → toggle sidebar → verify editor topbar adjusts
- Test note addition flow: add multiple notes → verify topbar width stays consistent
- Test view switching: switch between content area, page editor, settings → verify layouts work correctly
