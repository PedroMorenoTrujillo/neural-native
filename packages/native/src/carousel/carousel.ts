import {
  booleanAttribute,
  Component,
  input,
  model,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { View, Text, Image, type TouchEvent } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { NeuImageItem, clamp } from '../foundation/mobile.js';
import { neuCrossfade } from '../foundation/motion.js';
import { NeuImageViewerComponent, type NeuImageViewerLabels } from '../image-viewer/image-viewer.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NEU_CHEVRON_LEFT, NEU_CHEVRON_RIGHT } from '../foundation/icons.js';

const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 5v14M16 5v14"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m8 4 12 8-12 8Z"/></svg>';

@Component({
  selector: 'neu-carousel',
  imports: [View, Text, Image, Pressable, NeuIconButtonComponent, NeuImageViewerComponent, AnimatedStyle],
  template: `<view class="stack"
    ><view
      class="surface"
      (touchStart)="start($event)"
      (touchEnd)="end($event)"
      (touchCancel)="cancelTouch()"
    >
      @if (current(); as item) {
        <pressable class="carousel-stage" [accessibilityRole]="preview() ? 'button' : undefined" [accessible]="preview()"
          [accessibilityLabel]="item.label" [disabled]="!preview()" (press)="show()">
        @if (images.outgoing(); as previous) {
          <image class="carousel-outgoing" [source]="{ uri: previous.uri }" resizeMode="contain"
            [accessible]="false" [accessibilityElementsHidden]="true" importantForAccessibility="no-hide-descendants"
            [animatedStyle]="images.settledStyle" pointerEvents="none" />
        }
        @for (photo of [item]; track photo.uri) {
        <image
          class="hero"
          accessibilityRole="image"
          [source]="{ uri: photo.uri }"
          resizeMode="contain"
          [alt]="photo.label"
          [animatedStyle]="images.incomingStyle"
          (load)="images.loaded(photo)"
          (error)="images.loaded(photo)"
        />
        }</pressable><text class="label">{{ item.label }}</text>
      } @else {
        <text class="muted">{{ emptyLabel() }}</text>
      }</view
    ><view class="carousel-controls"
      ><view class="carousel-navigation"><neu-icon-button
        [label]="previousLabel()"
        [svg]="previousIcon"
        variant="text"
        [disabled]="items().length < 2 || (!loop() && position() <= 0)"
        (pressed)="move(-1)" /><text class="label carousel-count" [numberOfLines]="1"
        >{{ items().length ? position() + 1 : 0 }} / {{ items().length }}</text
      ><neu-icon-button
        [label]="nextLabel()"
        [svg]="nextIcon"
        variant="text"
        [disabled]="
          items().length < 2 || (!loop() && position() >= items().length - 1)
        "
        (pressed)="move(1)" /></view>
      @if (autoplay() && items().length > 1) {
        <neu-icon-button [label]="paused() ? playLabel() : pauseLabel()" [svg]="paused() ? playIcon : pauseIcon" variant="text" [disabled]="playbackDisabled()" (pressed)="paused.set(!paused())" />
      }
      </view
  ></view>
  <neu-image-viewer [items]="items()" [(index)]="index" [(open)]="open"
    [label]="viewerLabels().label ?? 'Image viewer'"
    [closeLabel]="viewerLabels().closeLabel ?? 'Close viewer'"
    [previousLabel]="viewerLabels().previousLabel ?? previousLabel()"
    [nextLabel]="viewerLabels().nextLabel ?? nextLabel()"
    [zoomLabel]="viewerLabels().zoomLabel ?? 'Zoom in'"
    [zoomOutLabel]="viewerLabels().zoomOutLabel ?? 'Zoom out'"
    [errorLabel]="viewerLabels().errorLabel ?? 'Image could not be loaded'" />`,
  styleUrls: ['../foundation/mobile.css', './carousel.css'],
})
export class NeuCarouselComponent {
  protected readonly previousIcon = NEU_CHEVRON_LEFT;
  protected readonly nextIcon = NEU_CHEVRON_RIGHT;
  protected readonly pauseIcon = PAUSE_ICON;
  protected readonly playIcon = PLAY_ICON;
  protected readonly paused = signal(false);
  private readonly touching = signal(false);
  private readonly accessibility = inject(Accessibility);
  readonly items = input<readonly NeuImageItem[]>([]);
  readonly index = model(0);
  readonly open = model(false);
  readonly preview = input(true, { transform: booleanAttribute });
  readonly viewerLabels = input<NeuImageViewerLabels>({});
  readonly loop = input(false, { transform: booleanAttribute });
  readonly autoplay = input(false, { transform: booleanAttribute });
  readonly autoplayInterval = input(4000);
  readonly pauseLabel = input('Pause slideshow');
  readonly playLabel = input('Play slideshow');
  readonly previousLabel = input('Previous image');
  readonly nextLabel = input('Next image');
  readonly emptyLabel = input('No images');
  private startX: number | undefined;
  private startY: number | undefined;
  private suppressPressUntil = 0;
  protected readonly cycleInterval = computed(() => {
    const value = this.autoplayInterval();
    return !Number.isFinite(value) ? 4000 : value <= 0 ? 0 : Math.max(1000, Math.min(60000, value));
  });
  protected readonly position = computed(() =>
    Math.floor(clamp(this.index(), 0, Math.max(0, this.items().length - 1))),
  );
  protected readonly current = computed<NeuImageItem | undefined>(
    () => this.items()[this.position()],
  );
  protected readonly images = neuCrossfade(this.current, signal(true), (a, b) => a.id === b.id && a.uri === b.uri, true);
  protected readonly playbackDisabled = computed(() => this.cycleInterval() <= 0 || this.accessibility.reduceMotion() || (!this.loop() && this.position() >= this.items().length - 1));
  constructor() {
    effect(() => {
      if (!this.autoplay()) this.paused.set(false);
    });
    effect(onCleanup => {
      const enabled = this.autoplay(), interval = this.cycleInterval();
      const count = this.items().length, position = this.position(), loop = this.loop();
      const paused = this.paused(), touching = this.touching(), reduced = this.accessibility.reduceMotion(), viewing = this.open();
      if (!enabled || !interval || paused || touching || reduced || viewing || count < 2 || (!loop && position >= count - 1)) return;
      const timer = setTimeout(() => this.move(1), interval);
      onCleanup(() => clearTimeout(timer));
    });
  }
  protected move(delta: number): void {
    const count = this.items().length;
    if (!count) return;
    const next = this.position() + delta;
    this.index.set(
      this.loop() ? (next + count) % count : clamp(next, 0, count - 1),
    );
  }
  protected start(event: TouchEvent): void {
    this.touching.set(true);
    this.suppressPressUntil = 0;
    this.startX = event.nativeEvent.pageX;
    this.startY = event.nativeEvent.pageY;
  }
  protected end(event: TouchEvent): void {
    const x = event.nativeEvent.pageX;
    const y = event.nativeEvent.pageY;
    const dx = x !== undefined && this.startX !== undefined ? x - this.startX : 0;
    const dy = y !== undefined && this.startY !== undefined ? y - this.startY : 0;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) this.suppressPressUntil = Date.now() + 350;
    if (
      x !== undefined &&
      this.startX !== undefined &&
      Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)
    )
      this.move(x < this.startX ? 1 : -1);
    this.startX = undefined;
    this.startY = undefined;
    this.touching.set(false);
  }
  protected cancelTouch(): void {
    this.startX = undefined;
    this.startY = undefined;
    this.suppressPressUntil = Date.now() + 350;
    this.touching.set(false);
  }
  protected show(): void {
    if (this.preview() && this.current() && Date.now() >= this.suppressPressUntil) this.open.set(true);
  }
}
