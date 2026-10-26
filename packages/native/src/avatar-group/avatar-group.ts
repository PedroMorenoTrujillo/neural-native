import { Component, input, computed, inject } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuOption, finite } from '../foundation/mobile.js';
import { NeuAvatarComponent } from '../avatar/avatar.js';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
  type NeuSize,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-avatar-group',
  imports: [View, Text, NeuAvatarComponent],
  template: `<view class="avatar-group">
    @for (person of shown(); track person.id; let first = $first) {
      <view class="avatar-entry" [class.avatar-overlap]="!first" [style.width]="diameter() + 4" [style.height]="diameter() + 4">
        <neu-avatar
          [label]="person.label"
          [uri]="person.uri ?? ''"
          [tone]="person.tone ?? tone()"
          [size]="size()"
        />
      </view>
    }
    @if (remaining() > 0) {
      <view
        class="avatar-entry avatar-overlap avatar-remainder"
        [style.width]="diameter() + 4"
        [style.height]="diameter() + 4"
        [accessibilityLabel]="remaining() + ' ' + moreLabel()"
        [style.backgroundColor]="palette().tonal"
        ><text class="remainder-label" [style.color]="palette().ink" [style.fontSize]="initialSize()"
          >+{{ remaining() }}</text
        ></view
      >
    }
  </view>`,
  styleUrl: './avatar-group.css',
})
export class NeuAvatarGroupComponent {
  readonly items = input<readonly (NeuOption & { readonly uri?: string; readonly tone?: NeuTone })[]>(
    [],
  );
  readonly max = input(4);
  readonly moreLabel = input('more people');
  readonly tone = input<NeuTone>('brand');
  readonly size = input<NeuSize>('md');
  protected readonly diameter = computed(() =>
    this.size() === 'sm' ? 32 : this.size() === 'lg' ? 48 : 40,
  );
  protected readonly initialSize = computed(() =>
    this.size() === 'sm' ? 12 : this.size() === 'lg' ? 16 : 14,
  );
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() =>
    neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()),
  );
  protected readonly shown = computed(() =>
    this.items().slice(0, Math.max(1, Math.floor(finite(this.max(), 4)))),
  );
  protected readonly remaining = computed(
    () => this.items().length - this.shown().length,
  );
}
