import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuOption } from '../foundation/mobile.js';

export interface NeuListboxItemContext {
  readonly $implicit: NeuOption;
  /** Position in the displayed options, after filtering. */
  readonly index: number;
  readonly selected: boolean;
  readonly disabled: boolean;
}

/** Custom visual content; Listbox retains the interactive and accessible row. */
@Directive({ selector: 'ng-template[neuListboxItem]' })
export class NeuListboxItemDirective {
  readonly templateRef = inject<TemplateRef<NeuListboxItemContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuListboxItemDirective, _context: unknown): _context is NeuListboxItemContext { return true; }
}
