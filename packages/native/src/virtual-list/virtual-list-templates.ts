import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuOption } from '../foundation/mobile.js';

export interface NeuVirtualListItemContext {
  readonly $implicit: NeuOption;
  /** Original position in items, independent of the recycled row slot. */
  readonly index: number;
  readonly disabled: boolean;
}

/** Custom row content; Virtual List retains recycling, measurement and selection. */
@Directive({ selector: 'ng-template[neuVirtualListItem]' })
export class NeuVirtualListItemDirective {
  readonly templateRef = inject<TemplateRef<NeuVirtualListItemContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuVirtualListItemDirective, _context: unknown): _context is NeuVirtualListItemContext { return true; }
}
