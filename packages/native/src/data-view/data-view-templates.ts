import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuOption } from '../foundation/mobile.js';

export interface NeuDataViewItemContext {
  readonly $implicit: NeuOption;
  /** Position in the currently filtered and sorted collection. */
  readonly index: number;
}

/** Custom row content; Data View retains filtering, ordering and selection. */
@Directive({ selector: 'ng-template[neuDataViewItem]' })
export class NeuDataViewItemDirective {
  readonly templateRef = inject<TemplateRef<NeuDataViewItemContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuDataViewItemDirective, _context: unknown): _context is NeuDataViewItemContext { return true; }
}
