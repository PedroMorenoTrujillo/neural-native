import { Directive } from '@angular/core';

/** Project a custom heading; retain the component title for its accessible name. */
@Directive({ selector: '[neuPanelHeader]' })
export class NeuPanelHeaderDirective {}

/** Project actions or supporting content after the body. */
@Directive({ selector: '[neuPanelFooter]' })
export class NeuPanelFooterDirective {}
