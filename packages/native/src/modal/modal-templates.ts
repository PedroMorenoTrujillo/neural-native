import { Directive, TemplateRef, inject } from '@angular/core';

/** Replaces the heading content; the close control remains owned by Modal. */
@Directive({ selector: 'ng-template[neuModalHeader]' })
export class NeuModalHeaderDirective {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

/** Fixed action region outside the scrollable modal body. */
@Directive({ selector: 'ng-template[neuModalFooter]' })
export class NeuModalFooterDirective {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
