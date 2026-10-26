import { NgComponentOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ErrorHandler,
  effect,
  inject,
  Injectable,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  SafeAreaProvider,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@ng-native/components';
import { StatusBar } from '@ng-native/device';
import { NeuThemeComponent } from '@neural-ui/native/theme';
import { NATIVE_DEMOS } from './catalogue-data.js';

export const DEVICE_VALIDATION_MARKER = '[NEURAL_DEVICE_VALIDATION]';
type Appearance = 'light' | 'dark';
export interface DeviceValidationRequest {
  entry: string;
  appearance: Appearance | 'both';
  hold: boolean;
}

export function deviceValidationRequest(
  initialUri: string | undefined,
): DeviceValidationRequest | null {
  if (!initialUri) return null;
  try {
    const url = new URL(initialUri);
    if (url.pathname !== '/--/validate-catalogue') return null;
    const entry = url.searchParams.get('entry') ?? '';
    const appearance = url.searchParams.get('appearance') ?? 'both';
    const hold = url.searchParams.get('hold') === '1';
    if (entry && !NATIVE_DEMOS.some((demo) => demo.entry === entry))
      return null;
    if (!['light', 'dark', 'both'].includes(appearance)) return null;
    if (hold && (!entry || appearance === 'both')) return null;
    return { entry, appearance: appearance as Appearance | 'both', hold };
  } catch {
    return null;
  }
}

@Injectable()
export class DeviceValidationErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    console.error(
      DEVICE_VALIDATION_MARKER,
      JSON.stringify({
        stage: 'error',
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    super.handleError(error);
  }
}

@Component({
  selector: 'native-device-validation',
  imports: [
    NgComponentOutlet,
    SafeAreaProvider,
    SafeAreaView,
    ScrollView,
    Text,
    View,
    NeuThemeComponent,
  ],
  template: `
    <safe-area-provider>
      <neu-theme [scheme]="currentAppearance()">
        <safe-area-view class="screen">
          <scroll-view class="screen">
            <view class="page">
              <text class="heading" accessibilityRole="header"
                >Validación nativa · {{ platform() }}</text
              >
              <text class="label">{{ progress() }}</text>
              @if (active(); as demo) {
                <text class="heading">{{ demo.name }}</text>
                <view class="specimen" testID="neural-device-specimen">
                  <ng-container
                    *ngComponentOutlet="demo.component; inputs: demo.inputs"
                  />
                </view>
              }
            </view>
          </scroll-view>
        </safe-area-view>
      </neu-theme>
    </safe-area-provider>
  `,
  styles: `
    :host,
    .screen {
      flex: 1;
    }
    .page {
      padding: 24px;
      gap: 16px;
    }
    .heading {
      color: var(--neu-text, #172033);
      font-size: 22px;
      font-weight: 600;
    }
    .label {
      color: var(--neu-muted, #596477);
      font-size: 14px;
    }
    .specimen {
      background-color: var(--neu-surface, #fff);
      border-radius: 16px;
      padding: 12px;
      gap: 16px;
    }
  `,
})
export class NativeDeviceValidationComponent {
  readonly entry = input('');
  readonly appearance = input<Appearance | 'both'>('both');
  readonly hold = input(false);
  readonly platform = input('native');
  protected readonly active = signal<(typeof NATIVE_DEMOS)[number] | null>(
    null,
  );
  protected readonly currentAppearance = signal<Appearance>('light');
  protected readonly progress = signal('Preparando el catálogo…');
  private readonly outlet = viewChild(NgComponentOutlet);
  private cases: {
    demo: (typeof NATIVE_DEMOS)[number];
    appearance: Appearance;
  }[] = [];
  private cursor = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  constructor() {
    const statusBar = inject(StatusBar);
    effect(() =>
      statusBar.set({
        style: this.currentAppearance() === 'dark' ? 'light' : 'dark',
      }),
    );
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.timer);
    });
    afterNextRender(() => {
      const demos = NATIVE_DEMOS.filter(
        (demo) => !this.entry() || demo.entry === this.entry(),
      );
      const appearances: Appearance[] =
        this.appearance() === 'both'
          ? ['light', 'dark']
          : [this.appearance() as Appearance];
      this.cases = appearances.flatMap((appearance) =>
        demos.map((demo) => ({ demo, appearance })),
      );
      this.log('start', { cases: this.cases.length });
      this.timer = setTimeout(() => this.next(), 1200);
    });
  }

  private next(): void {
    if (this.destroyed) return;
    const next = this.cases[this.cursor];
    if (!next) {
      this.progress.set(`Completado · ${this.cursor} montajes nativos`);
      this.log('complete', { cases: this.cursor });
      return;
    }
    this.active.set(null);
    this.currentAppearance.set(next.appearance);
    this.timer = setTimeout(() => {
      if (this.destroyed) return;
      this.active.set(next.demo);
      this.progress.set(
        `${this.cursor + 1}/${this.cases.length} · ${next.appearance}`,
      );
      this.log('mount', {
        entry: next.demo.entry,
        appearance: next.appearance,
      });
      this.timer = setTimeout(() => {
        if (this.destroyed) return;
        if (!this.outlet()?.componentInstance) {
          this.log('error', {
            entry: next.demo.entry,
            message: 'No component instance after native render',
          });
          return;
        }
        this.log('rendered', {
          entry: next.demo.entry,
          appearance: next.appearance,
        });
        this.cursor++;
        if (this.hold()) {
          this.progress.set(`Completado · ${next.demo.name}`);
          this.log('complete', { cases: this.cursor });
        } else {
          this.active.set(null);
          this.next();
        }
      }, 900);
    }, 200);
  }

  private log(stage: string, values: Record<string, unknown>): void {
    console.info(
      DEVICE_VALIDATION_MARKER,
      JSON.stringify({ stage, platform: this.platform(), ...values }),
    );
  }
}
