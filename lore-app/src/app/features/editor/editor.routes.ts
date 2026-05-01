import { Routes } from '@angular/router';

/**
 * Editor feature routes
 * Phase 3: Editor Foundation
 */
export const editorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./split-editor/split-editor.component').then(m => m.SplitEditorComponent)
  }
];
