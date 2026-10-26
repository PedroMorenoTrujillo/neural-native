import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuOption } from '../foundation/mobile.js';
import type { NeuListboxItemContext } from '../listbox/listbox-templates.js';

export type NeuSelectItemContext = NeuListboxItemContext;
export interface NeuSelectSelectedContext {
  /** Resolved selected options in their original option order; empty for the placeholder. */
  readonly $implicit: readonly NeuOption[];
  readonly value: string;
  readonly values: readonly string[];
  readonly placeholder: string;
}

@Directive({ selector: 'ng-template[neuSelectItem]' })
export class NeuSelectItemDirective {
  readonly templateRef = inject<TemplateRef<NeuSelectItemContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuSelectItemDirective, _context: unknown): _context is NeuSelectItemContext { return true; }
}

@Directive({ selector: 'ng-template[neuSelectSelected]' })
export class NeuSelectSelectedDirective {
  readonly templateRef = inject<TemplateRef<NeuSelectSelectedContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuSelectSelectedDirective, _context: unknown): _context is NeuSelectSelectedContext { return true; }
}
