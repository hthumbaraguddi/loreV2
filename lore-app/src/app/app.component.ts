import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: []
})
export class AppComponent {
  title = 'Lore';
  private themeService = inject(ThemeService);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Cmd/Ctrl + Shift + D to toggle theme
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      this.themeService.toggleTheme();
    }
  }
}
