import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'notes',
    pathMatch: 'full'
  },
  {
    path: 'notes',
    loadChildren: () => import('./features/editor/editor.routes').then(m => m.editorRoutes)
  },
  {
    path: 'graph',
    loadComponent: () => import('./features/graph/knowledge-graph.component').then(m => m.KnowledgeGraphComponent)
  },
  {
    path: 'html-notes',
    loadComponent: () => import('./features/html-notes/html-notes-gallery.component').then(m => m.HtmlNotesGalleryComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-panel.component').then(m => m.SettingsPanelComponent)
  },
  {
    path: '**',
    redirectTo: 'notes'
  }
];
