import { Component, DestroyRef, ElementRef, computed, effect, inject, input, model, signal, viewChild } from '@angular/core';
import { Modal, ScrollView, View, type LayoutEvent } from '@ng-native/components';
import { NeuNativePressable as Pressable } from './native-pressable.js';
import { HostEngine, type HostNode } from '@ng-native/fabric';
import { Keyboard, SafeArea } from '@ng-native/device';
import { anchoredLayout } from './anchored-layout.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { neuPresence } from './motion.js';

/** Internal anchored surface shared by native popup controls. */
@Component({
  selector: 'neu-anchored-overlay',
  imports: [Modal, Pressable, ScrollView, View, AnimatedStyle],
  template: `<modal [supportedOrientations]="['portrait', 'landscape']" [visible]="motion.visible()" [transparent]="true" animationType="none"
    presentationStyle="overFullScreen" [statusBarTranslucent]="false"
    (requestClose)="open.set(false)" (show)="measure()">
    <view class="overlay-root" [collapsable]="false" (layout)="layout($event)"
      [pointerEvents]="open() ? 'auto' : 'none'" [accessibilityElementsHidden]="!open()"
      [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'">
      <pressable class="overlay-dismiss" accessibilityRole="button"
        [accessibilityLabel]="closeLabel()" (press)="open.set(false)" />
      <view class="overlay-popup" [style.left]="position().left" [style.width]="position().width"
        [animatedStyle]="popupStyle"
        [style.top]="position().top" [style.bottom]="position().bottom"
        [style.height]="popupHeight()"
        [style.maxHeight]="position().height" [accessibilityViewIsModal]="open()">
        <scroll-view class="overlay-scroll" keyboardShouldPersistTaps="handled"
          (contentSizeChange)="contentHeight.set($event.height)">
          <view class="overlay-content"><ng-content /></view>
        </scroll-view>
      </view>
    </view>
  </modal>`,
  styleUrl: './anchored-overlay.css',
})
export class NeuAnchoredOverlayComponent {
  readonly open = model(false);
  // The popup is remeasured after its Modal mounts. JS frames keep opacity in sync
  // with those layout commits instead of reconnecting a native animation tag.
  protected readonly motion = neuPresence(this.open, false);
  protected readonly popupStyle = { opacity: this.motion.progress };
  readonly anchor = input<HostNode>();
  readonly closeLabel = input('Dismiss options');
  readonly minimumWidth = input(160);
  readonly gap = input(8);
  private readonly engine = inject(HostEngine);
  private readonly keyboard = inject(Keyboard);
  private readonly safeArea = inject(SafeArea);
  private readonly destroy = inject(DestroyRef);
  private readonly origin = viewChild(View, { read: ElementRef<HostNode> });
  private measurement = 0;
  private readonly viewport = signal({ width: 360, height: 800 });
  private readonly frame = signal({ x: 16, y: 64, width: 328, height: 48 });
  private readonly windowOrigin = signal({ x: 0, y: 0 });
  protected readonly position = signal<{ left: number; width: number; top: number | null; bottom: number | null; height: number }>({ left: 16, width: 328, top: 120, bottom: null, height: 320 });
  protected readonly contentHeight = signal(0);
  // A native ScrollView needs a bounded viewport before it can measure its content.
  protected readonly popupHeight = computed(() => {
    const height = this.contentHeight(), available = this.position().height;
    return height > 0 ? Math.min(available, height + 2) : available;
  });
  constructor() {
    effect(() => {
      if (this.open() && this.anchor() && this.origin()) this.measure();
      else this.measurement++;
    });
    effect(() => {
      const view = this.viewport(), anchor = this.frame();
      const keyboard = this.keyboard.position();
      const keyboardTop = this.keyboard.visible()
        ? (keyboard.screenY ?? view.height - keyboard.height) - this.windowOrigin().y
        : undefined;
      this.position.set(anchoredLayout(view, anchor, this.minimumWidth(), this.gap(), keyboardTop, this.safeArea.insets()));
    });
  }
  protected layout(event: LayoutEvent): void {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) { this.viewport.set({ width, height }); this.measure(); }
  }
  protected measure(): void {
    const anchor = this.anchor(), origin = this.origin()?.nativeElement;
    if (!anchor || !origin || !this.open()) return;
    const measurement = ++this.measurement;
    const active = () => !this.destroy.destroyed && this.open() && this.anchor() === anchor && measurement === this.measurement;
    this.engine.measure(origin, originFrame => {
      if (!active()) return;
      this.windowOrigin.set({ x: originFrame.x, y: originFrame.y });
      if (originFrame.width > 0 && originFrame.height > 0) this.viewport.set({ width: originFrame.width, height: originFrame.height });
      this.engine.measure(anchor, frame => {
        if (active()) this.frame.set({ ...frame, x: frame.x - originFrame.x, y: frame.y - originFrame.y });
      });
    });
  }
}
