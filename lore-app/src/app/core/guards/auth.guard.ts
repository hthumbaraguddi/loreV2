import { CanActivateFn } from '@angular/router';

/**
 * Auth guard - stub implementation
 * TODO: Implement actual authentication logic
 */
export const authGuard: CanActivateFn = (route, state) => {
  // For now, always allow access
  // In future phases, check authentication status
  return true;
};
