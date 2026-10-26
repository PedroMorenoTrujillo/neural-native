import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  computed,
  ElementRef,
  inject,
  viewChild,
  type AfterViewInit,
  type OnDestroy,
} from '@angular/core';
import { View, Text, type LayoutEvent } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import {
  HostEngine,
  type HostNode,
  type ResponderEvent,
} from '@ng-native/fabric';
import { finite, clamp, bounded } from '../foundation/mobile.js';

@Component({
  selector: 'neu-slider',
  imports: [View, Text, Pressable],
  template: `<view class="stack"
    ><text class="label">{{ label() }} · {{ value() }}</text
    ><view class="row">
      @if (showButtons()) {
        <pressable
          class="action"
          accessibilityRole="button"
          [accessibilityLabel]="decreaseLabel() + ' ' + label()"
          [disabled]="disabled() || readonly() || value() <= min()"
          (press)="change(-1)"
          ><text class="label">−</text></pressable
        >
      }
      <view
        #track
        class="grow action"
        [accessible]="true"
        accessibilityRole="adjustable"
        [accessibilityLabel]="label()"
        [accessibilityValue]="{ min: min(), max: max(), now: value() }"
        [accessibilityState]="{ disabled: disabled() || readonly() }"
        [accessibilityActions]="[{ name: 'increment' }, { name: 'decrement' }]"
        (accessibilityAction)="adjust($event)"
        (layout)="layout($event)"
        ><view class="slider-track" pointerEvents="none"
          ><view class="track slider-rail" [style.width]="'100%'"
            ><view class="fill" [style.width]="percent() + '%'" /></view
          ><view
            class="slider-thumb"
            [style.left]="percent() + '%'"
            [style.marginLeft]="-12" /></view
      ></view>
      @if (showButtons()) {
        <pressable
          class="action"
          accessibilityRole="button"
          [accessibilityLabel]="increaseLabel() + ' ' + label()"
          [disabled]="disabled() || readonly() || value() >= max()"
          (press)="change(1)"
          ><text class="label">+</text></pressable
        >
      }
    </view></view
  >`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuSliderComponent implements AfterViewInit, OnDestroy {
  readonly label = input.required<string>();
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly showButtons = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly increaseLabel = input('Increase');
  readonly decreaseLabel = input('Decrease');
  readonly touch = output<void>();
  private readonly engine = inject(HostEngine);
  private readonly track = viewChild.required<ElementRef<HostNode>>('track');
  private releaseResponder?: () => void;
  private width = 0;
  ngAfterViewInit(): void {
    const node = this.track().nativeElement;
    this.releaseResponder = (node.engine ?? this.engine).setResponder(node, {
      onStartShouldSetResponder: () =>
        !this.disabled() && !this.readonly() && this.width > 24,
      onResponderGrant: (event) => this.drag(event),
      onResponderMove: (event) => this.drag(event),
      onResponderRelease: (event) => this.drag(event),
      // Keep the current horizontal gesture when a surrounding list can scroll.
      onResponderTerminationRequest: () => false,
      blockNativeResponder: true,
    });
  }
  ngOnDestroy(): void {
    this.releaseResponder?.();
  }
  protected readonly percent = computed(() =>
    clamp(
      ((this.value() - this.min()) /
        Math.max(Number.EPSILON, this.max() - this.min())) *
        100,
      0,
      100,
    ),
  );
  protected layout(event: LayoutEvent): void {
    this.width = event.nativeEvent.layout.width;
  }
  private drag(event: ResponderEvent): void {
    if (this.width <= 24) return;
    const x = event.nativeEvent.locationX;
    if (x === undefined || !Number.isFinite(x)) return;
    this.commit(
      this.min() +
        clamp((x - 12) / (this.width - 24), 0, 1) * (this.max() - this.min()),
    );
  }
  protected adjust(event: { nativeEvent: { actionName: string } }): void {
    if (event.nativeEvent.actionName === 'increment') this.change(1);
    if (event.nativeEvent.actionName === 'decrement') this.change(-1);
    if (event.nativeEvent.actionName === 'setMinimum') this.commit(this.min());
    if (event.nativeEvent.actionName === 'setMaximum') this.commit(this.max());
  }
  protected change(direction: number): void {
    this.commit(this.value() + direction * Math.abs(finite(this.step(), 1)));
  }
  private commit(value: number): void {
    if (this.disabled() || this.readonly()) return;
    const next = bounded(value, this.min(), this.max(), this.step());
    if (next === this.value()) return;
    this.value.set(next);
    this.touch.emit();
  }
}
