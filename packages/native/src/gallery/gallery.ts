import {
  Component,
  contentChild,
  booleanAttribute,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { View, Text, Image, type LayoutEvent } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { neuCrossfade } from '../foundation/motion.js';
import { NeuImageItem } from '../foundation/mobile.js';
import { NeuImageViewerComponent } from '../image-viewer/image-viewer.js';
import { NgTemplateOutlet } from '@angular/common';
import { NeuGalleryItemDirective, NeuGalleryCaptionDirective } from './gallery-templates.js';

export type NeuGalleryLayout = 'grid' | 'mosaic';
/** Consumer-owned copy for the full-screen viewer opened by Gallery. */
export interface NeuGalleryViewerLabels {
  readonly label?: string;
  readonly closeLabel?: string;
  readonly previousLabel?: string;
  readonly nextLabel?: string;
  readonly zoomLabel?: string;
  readonly zoomOutLabel?: string;
  readonly errorLabel?: string;
}
type GalleryTile = { item: NeuImageItem; index: number };
type GalleryScene = {
  groups: (GalleryTile | null)[][]; layout: NeuGalleryLayout;
  gap: number; radius: number; ratio: number; captions: boolean;
};

@Component({
  selector: 'neu-gallery',
  imports: [View, Text, Image, Pressable, NeuImageViewerComponent, AnimatedStyle, NgTemplateOutlet],
  template: `<view class="gallery-stage" [accessibilityLabel]="label()" (layout)="measure($event)">
    @for (layer of layers(); track layer.outgoing) {
    <view class="gallery" [class.gallery-outgoing]="layer.outgoing" [class.gallery-mosaic]="layer.scene.layout === 'mosaic'"
      [style.gap]="layer.scene.gap" [animatedStyle]="layer.outgoing ? motion.settledStyle : motion.incomingStyle"
      [pointerEvents]="layer.outgoing ? 'none' : 'auto'" [accessibilityElementsHidden]="layer.outgoing"
      [importantForAccessibility]="layer.outgoing ? 'no-hide-descendants' : 'auto'">
      @for (group of layer.scene.groups; track $index) {
        <view class="gallery-group" [class.gallery-column]="layer.scene.layout === 'mosaic'" [style.gap]="layer.scene.gap">
        @for (tile of group; track tile ? tile.item.id : $index) {
        @if (tile) {
        <pressable
          class="gallery-item"
          [class.mosaic-item]="layer.scene.layout === 'mosaic'"
          accessibilityRole="button"
          [accessibilityLabel]="tile.item.label"
          (press)="show(tile.index)"
          >@if (itemContent(); as customItem) {
            <ng-container [ngTemplateOutlet]="customItem.templateRef" [ngTemplateOutletContext]="{ $implicit: tile.item, index: tile.index, aspectRatio: tileRatio(tile.index, layer.scene), borderRadius: layer.scene.radius }" />
          } @else { <image
            class="gallery-image"
            [style.aspectRatio]="tileRatio(tile.index, layer.scene)"
            [style.borderRadius]="layer.scene.radius"
            [source]="{ uri: tile.item.uri }"
            resizeMode="cover"
            [alt]="tile.item.label"
          /> }
          @if (layer.scene.captions) {
            @if (captionContent(); as customCaption) {
              <ng-container [ngTemplateOutlet]="customCaption.templateRef" [ngTemplateOutletContext]="{ $implicit: tile.item, index: tile.index, aspectRatio: tileRatio(tile.index, layer.scene), borderRadius: layer.scene.radius }" />
            } @else { <text class="muted" [numberOfLines]="2">{{ tile.item.label }}</text> }
          }</pressable
        >
        } @else { <view class="gallery-placeholder" /> }
        }
        </view>
      } @empty {
        <text class="muted">{{ emptyLabel() }}</text>
      }</view>
    }</view
    ><neu-image-viewer [items]="items()" [(index)]="index" [(open)]="open"
      [label]="viewerLabels().label ?? label()"
      [closeLabel]="viewerLabels().closeLabel ?? 'Close viewer'"
      [previousLabel]="viewerLabels().previousLabel ?? 'Previous image'"
      [nextLabel]="viewerLabels().nextLabel ?? 'Next image'"
      [zoomLabel]="viewerLabels().zoomLabel ?? 'Zoom in'"
      [zoomOutLabel]="viewerLabels().zoomOutLabel ?? 'Zoom out'"
      [errorLabel]="viewerLabels().errorLabel ?? 'Image could not be loaded'" />`,
  styleUrls: ['../foundation/mobile.css', './gallery.css'],
})
export class NeuGalleryComponent {
  protected readonly itemContent = contentChild(NeuGalleryItemDirective);
  protected readonly captionContent = contentChild(NeuGalleryCaptionDirective);
  readonly label = input('Gallery');
  readonly viewerLabels = input<NeuGalleryViewerLabels>({});
  readonly items = input<readonly NeuImageItem[]>([]);
  readonly emptyLabel = input('No images');
  readonly layout = input<NeuGalleryLayout>('grid');
  readonly columns = input(2);
  readonly gap = input(10);
  readonly aspectRatio = input(1);
  readonly borderRadius = input(12);
  readonly showCaptions = input(true, { transform: booleanAttribute });
  readonly index = model(0);
  readonly open = model(false);
  private readonly measuredWidth = signal(0);
  protected readonly resolvedGap = computed(() => this.bounded(this.gap(), 10, 0, 48));
  protected readonly resolvedRadius = computed(() => this.bounded(this.borderRadius(), 12, 0, 1000));
  private readonly resolvedColumns = computed(() => {
    const requested = Math.floor(this.bounded(this.columns(), 2, 1, 4));
    const width = this.measuredWidth(), gap = this.resolvedGap();
    return width > 0 ? Math.max(1, Math.min(requested, Math.floor((width + gap) / (48 + gap)))) : requested;
  });
  protected readonly groups = computed(() => {
    const tiles = this.items().map((item, index) => ({ item, index }));
    const columns = this.resolvedColumns();
    if (!tiles.length) return [];
    if (this.layout() === 'mosaic') {
      return Array.from({ length: Math.min(columns, tiles.length) }, (_, column) => tiles.filter((_, index) => index % columns === column));
    }
    const rows: (GalleryTile | null)[][] = [];
    for (let start = 0; start < tiles.length; start += columns) {
      rows.push(Array.from({ length: columns }, (_, offset) => tiles[start + offset] ?? null));
    }
    return rows;
  });
  protected readonly scene = computed<GalleryScene>(() => ({
    groups: this.groups(), layout: this.layout(), gap: this.resolvedGap(),
    radius: this.resolvedRadius(), ratio: this.bounded(this.aspectRatio(), 1, 0.25, 4), captions: this.showCaptions(),
  }));
  protected readonly motion = neuCrossfade(this.scene, signal(true), (a, b) =>
    a.groups === b.groups && a.layout === b.layout && a.gap === b.gap && a.radius === b.radius && a.ratio === b.ratio && a.captions === b.captions);
  protected readonly layers = computed(() => {
    const previous = this.motion.outgoing();
    return [
      ...(previous ? [{ scene: previous, outgoing: true }] : []),
      { scene: this.scene(), outgoing: false },
    ];
  });
  protected tileRatio(index: number, scene: GalleryScene): number {
    return scene.layout === 'mosaic' ? scene.ratio / (index % 3 === 0 ? 1.5 : index % 3 === 1 ? 1 : 0.8) : scene.ratio;
  }
  protected measure(event: LayoutEvent): void {
    const width = event.nativeEvent.layout.width;
    if (Number.isFinite(width) && width >= 0) this.measuredWidth.set(width);
  }
  private bounded(value: number, fallback: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));
  }
  protected show(index: number): void {
    if (index >= 0 && index < this.items().length) {
      this.index.set(index);
      this.open.set(true);
    }
  }
}
