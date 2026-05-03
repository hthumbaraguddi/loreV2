import { Routes } from '@angular/router';

export const routes: Routes = [
  // Landing page - no shell
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  // Authenticated routes - wrapped in shell
  {
    path: '',
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
    children: [
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
        path: 'template-builder',
        loadComponent: () => import('./features/template-builder/template-builder.component').then(m => m.TemplateBuilderComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
