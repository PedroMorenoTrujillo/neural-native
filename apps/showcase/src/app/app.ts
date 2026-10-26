import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import {
  SafeAreaProvider,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@ng-native/components';
import { StatusBar } from '@ng-native/device';
import { NeuButtonComponent } from '@neural-ui/native/button';
import { NeuIconButtonComponent } from '@neural-ui/native/icon-button';
import { NeuInputComponent } from '@neural-ui/native/input';
import { NeuTextareaComponent } from '@neural-ui/native/textarea';
import { NeuCheckboxComponent } from '@neural-ui/native/checkbox';
import { NeuSwitchComponent } from '@neural-ui/native/switch';
import { NeuCardComponent } from '@neural-ui/native/card';
import { NeuBadgeComponent } from '@neural-ui/native/badge';
import { NeuSpinnerComponent } from '@neural-ui/native/spinner';
import { NeuDividerComponent } from '@neural-ui/native/divider';
import { NeuThemeComponent } from '@neural-ui/native/theme';
import { NEU_PLUS_ICON } from '@neural-ui/native/foundation';
import { NativeCatalogueComponent } from './catalogue.js';

@Component({
  selector: 'app-root',
  imports: [
    SafeAreaProvider,
    SafeAreaView,
    ScrollView,
    Text,
    View,
    FormField,
    NeuButtonComponent,
    NeuIconButtonComponent,
    NeuInputComponent,
    NeuTextareaComponent,
    NeuCheckboxComponent,
    NeuSwitchComponent,
    NeuCardComponent,
    NeuBadgeComponent,
    NeuSpinnerComponent,
    NeuDividerComponent,
    NeuThemeComponent,
    NativeCatalogueComponent,
  ],
  template: `
    <safe-area-provider>
      <neu-theme [scheme]="dark() ? 'dark' : 'light'">
        <safe-area-view class="screen">
          <scroll-view class="screen">
            <view class="page">
              <text class="title" accessibilityRole="header"
                >Neural Native</text
              >
              <text class="intro"
                >A native component workbench, built with Angular.</text
              >
              <neu-switch label="Dark appearance" [(checked)]="dark" />
              <view class="navigation">
                @for (item of categories; track item) {
                  <neu-button
                    [label]="item"
                    [variant]="category() === item ? 'solid' : 'text'"
                    size="sm"
                    (pressed)="category.set(item)"
                  />
                }
              </view>
              <neu-divider />
              @switch (category()) {
                @case ('Catálogo') {
                  <native-catalogue />
                }
                @case ('Actions') {
                  <text class="section" accessibilityRole="header"
                    >Actions</text
                  >
                  <text class="intro"
                    >Tap a specimen to inspect its behavior.</text
                  >
                  <view class="specimen"
                    ><neu-button
                      label="Primary action"
                      (pressed)="count.update(increment)" /><neu-button
                      label="Tonal action"
                      variant="tonal" /><neu-button
                      label="Outlined action"
                      variant="outline" /><neu-button
                      label="Text action"
                      variant="text"
                  /></view>
                  <view class="row"
                    ><neu-icon-button
                      label="Add item"
                      [svg]="plusIcon"
                      (pressed)="count.update(increment)"
                    /><text class="body">{{ count() }} interactions</text></view
                  >
                  <view class="specimen"
                    ><neu-button label="Disabled action" disabled /><neu-button
                      label="Saving"
                      loading
                  /></view>
                }
                @case ('Forms') {
                  <text class="section" accessibilityRole="header">Forms</text>
                  <neu-input
                    label="Your name"
                    placeholder="Ada Lovelace"
                    [formField]="fields.name"
                    hint="Signal Forms controls this field."
                    [error]="
                      fields.name().invalid()
                        ? 'Enter your name to continue.'
                        : ''
                    "
                  />
                  <neu-textarea
                    label="Notes"
                    placeholder="Write a note…"
                    [(value)]="notes"
                  />
                  <neu-checkbox
                    label="I accept the terms"
                    [formField]="fields.accepted"
                  />
                  <neu-switch
                    label="Notifications"
                    hint="Uses the platform's native switch."
                    [formField]="fields.notify"
                  />
                  <neu-button
                    label="Validate form"
                    [disabled]="fields().invalid()"
                    (pressed)="saved.set(true)"
                  />
                  @if (saved() && !fields().invalid()) {
                    <neu-badge label="Form validated" tone="success" />
                  }
                }
                @case ('Display') {
                  <text class="section" accessibilityRole="header"
                    >Presentation</text
                  >
                  <neu-card
                    title="A quiet surface"
                    description="Cards group related content without decorative shadows."
                    ><neu-badge label="Native" tone="accent" /><text
                      class="body"
                      >Content is projected into the public component.</text
                    ></neu-card
                  >
                  <view class="row"
                    ><neu-badge label="Ready" tone="success" /><neu-badge
                      label="Review"
                      tone="warning" /><neu-badge label="Error" tone="danger"
                  /></view>
                  <neu-divider /><neu-spinner
                    label="Loading content"
                    showLabel
                  />
                }
              }
              <text class="footnote"
                >Development build · Angular Native 0.8 · Full device and
                accessibility validation pending</text
              >
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
      gap: 20px;
    }
    .title {
      color: var(--neu-text, #172033);
      font-size: 34px;
      font-weight: 700;
    }
    .section {
      color: var(--neu-text, #172033);
      font-size: 24px;
      font-weight: 600;
      margin-top: 8px;
    }
    .intro,
    .body {
      color: var(--neu-muted, #596477);
      font-size: 16px;
    }
    .navigation {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px;
    }
    .specimen {
      gap: 12px;
    }
    .row {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footnote {
      color: var(--neu-muted, #596477);
      font-size: 12px;
      margin-top: 24px;
    }
  `,
})
export class App {
  protected readonly dark = signal(false);
  protected readonly count = signal(0);
  protected readonly category = signal('Catálogo');
  protected readonly categories = ['Catálogo', 'Actions', 'Forms', 'Display'];
  protected readonly plusIcon = NEU_PLUS_ICON;
  protected readonly increment = (value: number) => value + 1;
  protected readonly notes = signal('');
  protected readonly saved = signal(false);
  protected readonly data = signal({
    name: '',
    accepted: false,
    notify: false,
  });
  protected readonly fields = form(this.data, (p) => required(p.name));
  constructor() {
    const statusBar = inject(StatusBar);
    effect(() => statusBar.set({ style: this.dark() ? 'light' : 'dark' }));
  }
}
