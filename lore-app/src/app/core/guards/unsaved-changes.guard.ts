import { CanDeactivateFn } from '@angular/router';

/**
 * Unsaved changes guard - stub implementation
 * TODO: Implement actual unsaved changes detection
 */
export const unsavedChangesGuard: CanDeactivateFn<unknown> = (component, currentRoute, currentState, nextState) => {
  // For now, always allow navigation
  // In future phases, check for unsaved changes and prompt user
  return true;
};
