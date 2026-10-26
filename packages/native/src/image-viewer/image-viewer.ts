import {
  Component,
  input,
  model,
  output,
  computed,
  signal,
  effect,
  inject,
  DestroyRef,
} from '@angular/core';
import {
  View,
  Text,
  Image,
  Modal,
  SafeAreaProvider,
  SafeAreaView,
  type TouchEvent,
} from '@ng-native/components';
import { Animated, AnimatedStyle, Easing } from '@ng-native/components/animations';
import { Accessibility, StatusBar } from '@ng-native/device';
import { NeuThemeComponent } from '../theme/theme.js';
import { NEU_THEME, NEU_LIGHT_TOKENS } from '../foundation/index.js';
import { neuCrossfade, neuMotionDuration, neuPresence } from '../foundation/motion.js';
import { NeuImageItem, clamp } from '../foundation/mobile.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NEU_CLOSE, NEU_CHEVRON_RIGHT } from '../foundation/icons.js';
const PREVIOUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>';
const ZOOM_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/></svg>';
const ZOOM_OUT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6"/></svg>';
/** Consumer-owned labels for an embedded full-screen image viewer. */
export interface NeuImageViewerLabels {
  readonly label?: string;
  readonly closeLabel?: string;
  readonly previousLabel?: string;
  readonly nextLabel?: string;
  readonly zoomLabel?: string;
  readonly zoomOutLabel?: string;
  readonly errorLabel?: string;
}
function touchDistance(event: TouchEvent): number {
  const touches = event.nativeEvent.touches;
  if (!touches || touches.length < 2) return 0;
  const a = touches[0]!,
    b = touches[1]!;
  if (
    a.pageX === undefined ||
    a.pageY === undefined ||
    b.pageX === undefined ||
    b.pageY === undefined
  )
    return 0;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}
@Component({
  selector: 'neu-image-viewer',
  imports: [
    Modal,
    SafeAreaProvider,
    SafeAreaView,
    View,
    Text,
    Image,
    NeuIconButtonComponent,
    AnimatedStyle,
    NeuThemeComponent,
  ],
  template: `
    <modal [supportedOrientations]="['portrait', 'landscape']"
      [visible]="motion.visible()"
      presentationStyle="fullScreen"
      [backdropColor]="mediaTokens().canvas"
      [statusBarTranslucent]="true"
      [navigationBarTranslucent]="true"
      animationType="none"
      (requestClose)="close()"
      (show)="opened.emit()"
      (dismiss)="dismissed.emit()"
      ><neu-theme [tokens]="mediaTokens()"><safe-area-provider class="full sheet-background" [reportInsets]="false"
        ><safe-area-view
          class="full surface page-sheet viewer"
          [animatedStyle]="viewerStyle" [pointerEvents]="open() ? 'auto' : 'none'"
          [accessibilityElementsHidden]="!open()"
          [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'"
          [accessibilityViewIsModal]="open()"
          ><view class="row viewer-header"
            ><text class="title grow" [numberOfLines]="2">{{ current()?.label || label() }}</text
            ><neu-icon-button
              [label]="closeLabel()"
              [svg]="closeIcon"
              variant="text"
              (pressed)="close()" /></view
          ><view
            class="viewer-viewport"
            [animatedStyle]="imageEntryStyle"
            (touchStart)="start($event)"
            (touchMove)="pinch($event)"
            (touchEnd)="end($event)"
            (touchCancel)="cancelTouch()"
          >
            @if (failed()) {
              <text class="error" accessibilityRole="alert">{{
                errorLabel()
              }}</text>
            } @else if (current(); as item) {
              @if (images.outgoing(); as previous) {
                <image class="viewer-image" [animatedStyle]="outgoingImageStyle"
                  [source]="{ uri: previous.uri }" resizeMode="contain"
                  [accessible]="false" pointerEvents="none"
                  [accessibilityElementsHidden]="true" importantForAccessibility="no-hide-descendants" />
              }
              @for (photo of [item]; track photo.uri) {
              <image
                class="viewer-image"
                [animatedStyle]="imageStyle"
                accessibilityRole="image"
                [source]="{ uri: photo.uri }"
                resizeMode="contain"
                [alt]="photo.label"
                (load)="imageLoaded(photo)"
                (error)="imageFailed(photo)"
              />
              }
            }
            </view
          ><view class="row viewer-controls"
            ><view class="row viewer-navigation"><neu-icon-button
              [label]="previousLabel()"
              [svg]="previousIcon"
              variant="text"
              [disabled]="position() <= 0"
              (pressed)="move(-1)" /><text class="label">{{ items().length ? position() + 1 : 0 }} / {{ items().length }}</text><neu-icon-button
              [label]="nextLabel()"
              [svg]="nextIcon"
              variant="text"
              [disabled]="position() >= items().length - 1"
              (pressed)="move(1)" /></view><view class="row viewer-zoom"><neu-icon-button
              [label]="zoomOutLabel()"
              [svg]="zoomOutIcon"
              variant="text"
              [disabled]="!current() || failed() || zoom() <= 1"
              (pressed)="adjustZoom(-1)" /><text class="label zoom-level">{{ zoomPercent() }}%</text><neu-icon-button
              [label]="zoomLabel()"
              [svg]="zoomIcon"
              variant="text"
              [disabled]="!current() || failed() || zoom() >= 4"
              (pressed)="adjustZoom(1)" /></view></view></safe-area-view></safe-area-provider></neu-theme
    ></modal>`,
  styleUrls: ['../foundation/mobile.css', './image-viewer.css'],
})
export class NeuImageViewerComponent {
  protected readonly closeIcon = NEU_CLOSE;
  protected readonly previousIcon = PREVIOUS_ICON;
  protected readonly nextIcon = NEU_CHEVRON_RIGHT;
  protected readonly zoomIcon = ZOOM_ICON;
  protected readonly zoomOutIcon = ZOOM_OUT_ICON;
  readonly open = model(false);
  protected readonly motion = neuPresence(this.open);
  protected readonly viewerStyle = { opacity: this.motion.progress };
  private readonly loadedUris = signal<ReadonlySet<string>>(new Set());
  private readonly entryReady = computed(() => this.failed() || this.loadedUris().has(this.current()?.uri ?? ''));
  private readonly imageEntry = neuPresence(computed(() => this.open() && this.entryReady()));
  protected readonly imageEntryStyle = {
    opacity: this.imageEntry.progress,
    transform: [{ scale: this.imageEntry.progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
  };
  private readonly accessibility = inject(Accessibility);
  private readonly theme = inject(NEU_THEME, { optional: true });
  private readonly statusBar = inject(StatusBar);
  protected readonly mediaTokens = computed(() => {
    const tokens = this.theme?.() ?? NEU_LIGHT_TOKENS;
    const canvas = tokens.mediaCanvas ?? '#111722';
    const ink = tokens.mediaText ?? '#edf1fa';
    return { ...tokens, surface: canvas, canvas, text: ink, muted: ink, accent: ink, onAccent: canvas };
  });
  private readonly destroy = inject(DestroyRef);
  private readonly zoomValue = new Animated.Value(1);
  private readonly pinching = signal(false);
  readonly items = input<readonly NeuImageItem[]>([]);
  readonly index = model(0);
  readonly label = input('Image viewer');
  readonly closeLabel = input('Close viewer');
  readonly previousLabel = input('Previous image');
  readonly nextLabel = input('Next image');
  readonly zoomLabel = input('Zoom in');
  readonly zoomOutLabel = input('Zoom out');
  readonly errorLabel = input('Image could not be loaded');
  readonly closed = output<void>();
  /** Native presentation has finished; separate from the requested open state. */
  readonly opened = output<void>();
  /** iOS native dismissal has finished. Android does not emit this native event. */
  readonly dismissed = output<void>();
  protected readonly zoom = signal(1);
  protected readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));
  protected readonly failed = signal(false);
  protected readonly position = computed(() =>
    Math.floor(clamp(this.index(), 0, Math.max(0, this.items().length - 1))),
  );
  protected readonly current = computed<NeuImageItem | undefined>(
    () => this.items()[this.position()],
  );
  protected readonly images = neuCrossfade(this.current, this.open, (a, b) => a.id === b.id && a.uri === b.uri, true);
  protected readonly imageStyle = { ...this.images.incomingStyle, transform: [{ scale: this.zoomValue }] };
  protected readonly outgoingImageStyle = { ...this.images.settledStyle, transform: [{ scale: this.zoomValue }] };
  private readonly currentUri = computed(() => this.current()?.uri);
  private startX: number | undefined;
  private distance = 0;
  private baseZoom = 1;
  constructor() {
    effect(onCleanup => {
      if (!this.motion.visible()) return;
      const release = this.statusBar.push({ style: this.mediaTokens().mediaBarStyle ?? 'light' });
      onCleanup(release);
    });
    effect(() => {
      this.index();
      const opening = this.open();
      this.currentUri();
      if (opening) {
        this.zoom.set(1);
        this.zoomValue.setValue(1);
      }
      this.pinching.set(false);
      this.failed.set(false);
      this.startX = undefined;
      this.distance = 0;
      this.baseZoom = 1;
    });
    effect(onCleanup => {
      const target = this.zoom();
      const duration = Math.min(1000, neuMotionDuration(this.theme?.().duration ?? NEU_LIGHT_TOKENS.duration, true) * 4 / 3);
      if (!this.open() || this.pinching() || this.accessibility.reduceMotion() || duration === 0) {
        this.zoomValue.setValue(target);
        return;
      }
      const animation = Animated.timing(this.zoomValue, {
        toValue: target, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false,
      });
      animation.start();
      onCleanup(() => animation.stop());
    });
    this.destroy.onDestroy(() => this.zoomValue.stopAnimation());
  }
  protected imageLoaded(item: NeuImageItem): void {
    this.images.loaded(item);
    this.loadedUris.update(uris => new Set([...uris, item.uri]));
  }
  protected imageFailed(item: NeuImageItem): void {
    if (this.current()?.uri !== item.uri) return;
    this.failed.set(true);
    this.images.loaded(item);
  }
  close(): void {
    if (this.open()) {
      this.open.set(false);
      this.closed.emit();
    }
  }
  protected move(delta: number): void {
    if (!this.items().length) return;
    this.index.set(clamp(this.position() + delta, 0, this.items().length - 1));
  }
  protected adjustZoom(delta: number): void {
    if (!this.current() || this.failed()) return;
    this.pinching.set(false);
    this.zoom.update(value => clamp(value + delta, 1, 4));
    this.startX = undefined;
    this.distance = 0;
  }
  protected start(event: TouchEvent): void {
    this.startX = event.nativeEvent.pageX;
    this.distance = touchDistance(event);
    this.baseZoom = this.zoom();
    if (this.distance > 0) {
      this.pinching.set(true);
      this.zoomValue.stopAnimation(value => {
        if (this.destroy.destroyed || !this.pinching()) return;
        this.baseZoom = clamp(value, 1, 4);
        this.zoom.set(this.baseZoom);
      });
    }
  }
  protected pinch(event: TouchEvent): void {
    const distance = touchDistance(event);
    if (distance > 0 && this.distance > 0) {
      const value = clamp((this.baseZoom * distance) / this.distance, 1, 4);
      this.zoomValue.setValue(value);
      this.zoom.set(value);
    }
  }
  protected end(event: TouchEvent): void {
    const x = event.nativeEvent.pageX;
    if (
      this.distance === 0 &&
      this.zoom() === 1 &&
      x !== undefined &&
      this.startX !== undefined &&
      Math.abs(x - this.startX) > 40
    )
      this.move(x < this.startX ? 1 : -1);
    this.cancelTouch();
  }
  protected cancelTouch(): void {
    this.pinching.set(false);
    this.startX = undefined;
    this.distance = 0;
  }
}
