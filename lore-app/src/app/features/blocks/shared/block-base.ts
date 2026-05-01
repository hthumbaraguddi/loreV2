import { Directive, input, output } from '@angular/core';
import { Block } from '../../../core/models/shelf.model';

/**
 * Shared base inputs/outputs for all block type components.
 * Use as a mixin via composition (not inheritance) — import and re-declare.
 */
export interface BlockChangeEvent {
  blockId: string;
  content?: string;
  metadata?: Record<string, any>;
}
