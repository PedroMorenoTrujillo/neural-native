import { Directive } from '@angular/core';

/** Project a custom heading with semantic native text. */
@Directive({ selector: '[neuCardHeader]' })
export class NeuCardHeaderDirective {}

/** Project actions or supporting content after the body. */
@Directive({ selector: '[neuCardFooter]' })
export class NeuCardFooterDirective {}
