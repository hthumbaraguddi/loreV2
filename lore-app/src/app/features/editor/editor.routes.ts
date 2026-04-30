import { Routes } from '@angular/router';

/**
 * Editor feature routes
 * Will be fully implemented in Phase 3
 */
export const editorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./editor-placeholder/editor-placeholder.component').then(m => m.EditorPlaceholderComponent)
  }
];
