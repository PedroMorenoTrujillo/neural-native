import { Component, signal } from '@angular/core';
import {
  SafeAreaProvider,
  SafeAreaView,
  Text,
  View,
} from '@ng-native/components';
import { NeuThemeComponent } from '@neural-ui/native/theme';
import { NeuButtonComponent } from '@neural-ui/native/button';
import { NeuInputComponent } from '@neural-ui/native/input';
import { NeuSwitchComponent } from '@neural-ui/native/switch';
import { NeuCardComponent } from '@neural-ui/native/card';
import { CatalogueConsumer } from './catalogue-consumer.js';
@Component({
  selector: 'consumer-root',
  imports: [
    SafeAreaProvider,
    SafeAreaView,
    View,
    Text,
    NeuThemeComponent,
    NeuButtonComponent,
    NeuInputComponent,
    NeuSwitchComponent,
    NeuCardComponent,
    CatalogueConsumer,
  ],
  template: `<safe-area-provider
    ><neu-theme
      ><safe-area-view class="screen"
        ><view class="body"
          ><catalogue-consumer/><view
          ><neu-card title="Independent consumer"
            ><neu-input label="Name" [(value)]="name" /><neu-switch
              label="Enabled"
              [(checked)]="enabled"
            /><neu-button
              label="Count"
              (pressed)="count.update(increment)"
            /><text>{{ count() }} · {{ name() }}</text></neu-card
          ></view></view
        ></safe-area-view
      ></neu-theme
    ></safe-area-provider
  >`,
  styles: `
    :host,
    .screen {
      flex: 1;
    }
    .body {
      padding: 24px;
    }
  `,
})
export class App {
  readonly name = signal('');
  readonly enabled = signal(false);
  readonly count = signal(0);
  readonly increment = (n: number) => n + 1;
}
