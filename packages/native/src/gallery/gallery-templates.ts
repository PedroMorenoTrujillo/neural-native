import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuImageItem } from '../foundation/mobile.js';

export interface NeuGalleryItemContext {
  readonly $implicit: NeuImageItem;
  /** Position in the original items array, independent of the visual layout. */
  readonly index: number;
  readonly aspectRatio: number;
  readonly borderRadius: number;
}

/** Custom thumbnail content inside the gallery-owned image-opening action. */
@Directive({ selector: 'ng-template[neuGalleryItem]' })
export class NeuGalleryItemDirective {
  readonly templateRef = inject<TemplateRef<NeuGalleryItemContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuGalleryItemDirective, _context: unknown): _context is NeuGalleryItemContext { return true; }
}

/** Replaces the caption when showCaptions is enabled. */
@Directive({ selector: 'ng-template[neuGalleryCaption]' })
export class NeuGalleryCaptionDirective {
  readonly templateRef = inject<TemplateRef<NeuGalleryItemContext>>(TemplateRef);
  static ngTemplateContextGuard(_directive: NeuGalleryCaptionDirective, _context: unknown): _context is NeuGalleryItemContext { return true; }
}
