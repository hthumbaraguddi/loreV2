import { Injectable, signal } from '@angular/core';

export type RightPanelType = 'ai-chat' | 'backlinks' | 'context-panel' | 'notifications' | null;

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Sidebar state
  readonly sidebarOpen = signal<boolean>(true);
  
  // Right panel state
  readonly rightPanelOpen = signal<boolean>(false);
  readonly activeRightPanel = signal<RightPanelType>(null);
  
  // Zen mode state
  readonly zenMode = signal<boolean>(false);

  /**
   * Toggle sidebar open/closed
   */
  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  /**
   * Toggle right panel with specific panel type
   * If the same panel is already open, close it
   * Otherwise, open the new panel
   */
  toggleRightPanel(panel: Exclude<RightPanelType, null>): void {
    if (this.activeRightPanel() === panel) {
      // Close if same panel
      this.rightPanelOpen.set(false);
      this.activeRightPanel.set(null);
    } else {
      // Open new panel
      this.activeRightPanel.set(panel);
      this.rightPanelOpen.set(true);
    }
  }

  /**
   * Close right panel
   */
  closeRightPanel(): void {
    this.rightPanelOpen.set(false);
    this.activeRightPanel.set(null);
  }

  /**
   * Enable Zen/Focus mode
   * Hides all chrome except editor
   */
  enableZen(): void {
    this.zenMode.set(true);
    // Auto-close panels in zen mode
    this.sidebarOpen.set(false);
    this.closeRightPanel();
  }

  /**
   * Disable Zen/Focus mode
   * Restores normal layout
   */
  disableZen(): void {
    this.zenMode.set(false);
    // Restore sidebar
    this.sidebarOpen.set(true);
  }

  /**
   * Toggle Zen mode
   */
  toggleZen(): void {
    if (this.zenMode()) {
      this.disableZen();
    } else {
      this.enableZen();
    }
  }
}
