import { Component, signal, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * CanvasBackgroundComponent
 * Renders 4 types of canvas backgrounds: plain, dot grid, square grid, lined
 */
@Component({
  selector: 'lore-canvas-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-background.component.html',
  styleUrl: './canvas-background.component.scss'
})
export class CanvasBackgroundComponent {
  private sanitizer = inject(DomSanitizer);
  // Inputs
  style = input<'plain' | 'dot' | 'square' | 'lined'>('plain');
  color = input<string>('var(--lore-color-grid)');
  spacing = input<number>(24);

  // Computed signals
  patternId = computed(() => `canvas-bg-${this.style()}-${this.spacing()}`);
  
  // SVG patterns
  dotPattern = computed(() => {
    const spacing = this.spacing();
    const radius = 1;
    const color = this.color();
    
    return {
      id: this.patternId(),
      width: spacing,
      height: spacing,
      radius,
      color
    };
  });

  squarePattern = computed(() => {
    const spacing = this.spacing();
    const strokeWidth = 0.5;
    const color = this.color();
    
    return {
      id: this.patternId(),
      width: spacing,
      height: spacing,
      strokeWidth,
      color
    };
  });

  linedPattern = computed(() => {
    const spacing = this.spacing();
    const strokeWidth = 0.5;
    const color = this.color();
    
    return {
      id: this.patternId(),
      spacing,
      strokeWidth,
      color
    };
  });

  /**
   * Get SVG content based on style
   */
  getSvgContent(): string {
    const style = this.style();
    
    if (style === 'plain') {
      return '';
    }
    
    if (style === 'dot') {
      const pattern = this.dotPattern();
      return `
        <defs>
          <pattern id="${pattern.id}" width="${pattern.width}" height="${pattern.height}" patternUnits="userSpaceOnUse">
            <circle cx="${pattern.width / 2}" cy="${pattern.height / 2}" r="${pattern.radius}" fill="${pattern.color}" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#${pattern.id})" />
      `;
    }
    
    if (style === 'square') {
      const pattern = this.squarePattern();
      return `
        <defs>
          <pattern id="${pattern.id}" width="${pattern.width}" height="${pattern.height}" patternUnits="userSpaceOnUse">
            <path d="M ${pattern.width} 0 L 0 0 0 ${pattern.height}" fill="none" stroke="${pattern.color}" stroke-width="${pattern.strokeWidth}" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#${pattern.id})" />
      `;
    }
    
    if (style === 'lined') {
      const pattern = this.linedPattern();
      return `
        <defs>
          <pattern id="${pattern.id}" width="${pattern.spacing}" height="${pattern.spacing}" patternUnits="userSpaceOnUse">
            <line x1="0" y1="${pattern.spacing}" x2="100%" y2="${pattern.spacing}" stroke="${pattern.color}" stroke-width="${pattern.strokeWidth}" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#${pattern.id})" />
      `;
    }
    
    return '';
  }

  /**
   * Sanitized SVG content
   */
  sanitizedSvgContent = computed(() => {
    const svgContent = this.getSvgContent();
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  });
}