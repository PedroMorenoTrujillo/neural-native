import { Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { View } from '@ng-native/components';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
} from '@ng-native/testing';
import { afterEach, describe, expect, test } from 'vitest';
import { NeuButtonComponent } from './button/button.ts';
import { NeuIconButtonComponent } from './icon-button/icon-button.ts';
import { NeuInputComponent } from './input/input.ts';
import { NeuTextareaComponent } from './textarea/textarea.ts';
import { NeuDataViewComponent } from './data-view/data-view.ts';
import { NeuFilterBarComponent } from './filter-bar/filter-bar.ts';
import { NeuCheckboxComponent } from './checkbox/checkbox.ts';
import { NeuSwitchComponent } from './switch/switch.ts';
import { NeuCardComponent } from './card/card.ts';
import { NeuBadgeComponent } from './badge/badge.ts';
import { NeuSpinnerComponent } from './spinner/spinner.ts';
import { NeuDividerComponent } from './divider/divider.ts';
import { NeuThemeComponent } from './theme/theme.ts';
import { neuTonePalette } from './foundation/tone.ts';
import {
  NEU_DARK_TOKENS,
  NEU_LIGHT_TOKENS,
  NEU_PLUS_ICON,
  type NeuTone,
} from './foundation/index.ts';
afterEach(cleanup);

describe('actions', () => {
  test('emits once for a real native press', async () => {
    let count = 0;
    await render(NeuButtonComponent, {
      inputs: { label: 'Save' },
      on: { pressed: () => count++ },
    });
    await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));
    expect(count).toBe(1);
  });
  test.each(['solid', 'tonal', 'outline', 'text'])(
    'renders the %s variant with native styles',
    async (variant) => {
      await render(NeuButtonComponent, { inputs: { label: 'Save', variant } });
      expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    },
  );
  test.each([{ disabled: true }, { loading: true }])(
    'refuses presses when unavailable: %j',
    async (state) => {
      let count = 0;
      await render(NeuButtonComponent, {
        inputs: { label: 'Save', ...state },
        on: { pressed: () => count++ },
      });
      const button = screen.getByRole('button', { name: 'Save' });
      expect(button.props['accessibilityState']).toMatchObject({
        disabled: true,
      });
      await userEvent.setup().press(button);
      expect(count).toBe(0);
    },
  );
  test('announces loading, and can become actionable again', async () => {
    const result = await render(NeuButtonComponent, {
      inputs: { label: 'Save', loading: true },
    });
    expect(
      screen.getByRole('button').props['accessibilityState'],
    ).toMatchObject({ busy: true });
    await result.rerender({ inputs: { loading: false } });
    expect(
      screen.getByRole('button').props['accessibilityState'],
    ).toMatchObject({ disabled: false, busy: false });
  });
  test('icon button exposes a label and renders a native vector', async () => {
    let count = 0;
    await render(NeuIconButtonComponent, {
      inputs: { label: 'Add item', svg: NEU_PLUS_ICON },
      on: { pressed: () => count++ },
    });
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Add item' }));
    expect(count).toBe(1);
  });
});

describe('forms', () => {
  test('updates input model and emits valueChange', async () => {
    const changes: string[] = [];
    const result = await render(NeuInputComponent, {
      inputs: { label: 'Name' },
      on: { valueChange: (value) => changes.push(value as string) },
    });
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Ada');
    expect(result.instance.value()).toBe('Ada');
    expect(changes).toEqual(['Ada']);
  });
  test.each([{ disabled: true }, { readonly: true }])(
    'input refuses edits in %j state',
    async (state) => {
      const result = await render(NeuInputComponent, {
        inputs: { label: 'Name', value: 'Ada', ...state },
      });
      expect(screen.getByLabelText('Name').props['editable']).toBe(false);
      await userEvent.setup().type(screen.getByLabelText('Name'), 'Grace');
      expect(result.instance.value()).toBe('Ada');
    },
  );
  test('announces an error and replaces it with the hint when resolved', async () => {
    const result = await render(NeuInputComponent, {
      inputs: {
        label: 'Email',
        invalid: true,
        error: 'Enter a valid email',
        hint: 'Work email',
      },
    });
    expect(screen.getByRole('alert')).toBeTruthy();
    await result.rerender({ inputs: { invalid: false } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Work email')).toBeTruthy();
  });
  test('textarea renders a multiline native field and preserves newlines', async () => {
    const result = await render(NeuTextareaComponent, {
      inputs: { label: 'Notes' },
    });
    const field = screen.getByLabelText('Notes');
    expect(field.props['multiline']).toBe(true);
    await fireEvent.changeText(field, 'First\nSecond');
    expect(result.instance.value()).toBe('First\nSecond');
  });
  test('checkbox updates checked and touched on a press', async () => {
    let touched = 0;
    const result = await render(NeuCheckboxComponent, {
      inputs: { label: 'Accept terms' },
      on: { touch: () => touched++ },
    });
    await userEvent.setup().press(screen.getByRole('checkbox'));
    expect(result.instance.checked()).toBe(true);
    expect(
      screen.getByRole('checkbox').props['accessibilityState'],
    ).toMatchObject({ checked: true });
    expect(touched).toBe(1);
  });
  test.each([{ disabled: true }, { readonly: true }])(
    'checkbox refuses changes in %j state',
    async (state) => {
      const result = await render(NeuCheckboxComponent, {
        inputs: { label: 'Accept terms', ...state },
      });
      await userEvent.setup().press(screen.getByRole('checkbox'));
      expect(result.instance.checked()).toBe(false);
    },
  );
  test('switch forwards a native change to its model', async () => {
    const result = await render(NeuSwitchComponent, {
      inputs: { label: 'Notifications' },
    });
    await fireEvent(screen.getByRole('switch'), 'change', { value: true });
    expect(result.instance.checked()).toBe(true);
  });
  test('disabled switch ignores native changes', async () => {
    const result = await render(NeuSwitchComponent, {
      inputs: { label: 'Notifications', disabled: true },
    });
    await fireEvent(screen.getByRole('switch'), 'change', { value: true });
    expect(result.instance.checked()).toBe(false);
  });
  test('invalid checkbox keeps its selection behavior when its label moves', async () => {
    const result = await render(NeuCheckboxComponent, {
      inputs: {
        label: 'Accept terms',
        invalid: true,
        error: 'Review this choice',
        labelPosition: 'left',
      },
    });
    expect(screen.getByText('Review this choice')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'Accept terms' }));
    expect(result.instance.checked()).toBe(true);
    await result.rerender({
      inputs: { labelPosition: 'right', invalid: false },
    });
    expect(
      screen.getByRole('checkbox', { name: 'Accept terms' }).props
        .accessibilityState,
    ).toMatchObject({ checked: true });
    expect(screen.queryByRole('alert')).toBeNull();
  });
  test('invalid switch colors both native states and restores help without blocking changes', async () => {
    const result = await render(NeuSwitchComponent, {
      inputs: {
        label: 'Updates',
        invalid: true,
        error: 'Review this preference',
        hint: 'Team updates',
        size: 'sm',
        labelPosition: 'right',
      },
    });
    expect(screen.getByRole('switch').props).toMatchObject({
      trackColorForTrue: NEU_LIGHT_TOKENS.danger,
      trackColorForFalse: NEU_LIGHT_TOKENS.danger,
    });
    expect(screen.getByText('Review this preference')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Team updates')).toBeNull();
    await fireEvent(screen.getByRole('switch'), 'change', { value: true });
    expect(result.instance.checked()).toBe(true);
    await result.rerender({
      inputs: { invalid: false, size: 'lg', labelPosition: 'left' },
    });
    expect(screen.getByRole('switch').props).toMatchObject({
      trackColorForTrue: NEU_LIGHT_TOKENS.accent,
      trackColorForFalse: NEU_LIGHT_TOKENS.border,
    });
    expect(screen.getByText('Team updates')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(result.instance.checked()).toBe(true);
  });
});

@Component({
  selector: 'test-form',
  imports: [
    FormField,
    NeuInputComponent,
    NeuCheckboxComponent,
    NeuSwitchComponent,
  ],
  template: `
    <neu-input label="Name" [formField]="fields.name" />
    <neu-checkbox label="Accept" [formField]="fields.accepted" />
    <neu-switch label="Notify" [formField]="fields.notify" />
  `,
})
class FormHost {
  readonly data = signal({ name: '', accepted: false, notify: false });
  readonly fields = form(this.data, (p) => required(p.name));
}
test('integrates value, checked and validation with Angular Signal Forms', async () => {
  const result = await render(FormHost);
  expect(result.instance.fields.name().invalid()).toBe(true);
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Ada');
  await userEvent.setup().press(screen.getByRole('checkbox'));
  await fireEvent(screen.getByRole('switch'), 'change', { value: true });
  expect(result.instance.data()).toEqual({
    name: 'Ada',
    accepted: true,
    notify: true,
  });
  expect(result.instance.fields.name().valid()).toBe(true);
});

describe('presentation', () => {
  test('card exposes a semantic heading', async () => {
    await render(NeuCardComponent, {
      inputs: { title: 'Account', description: 'Your profile' },
    });
    expect(screen.getByRole('header', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Your profile')).toBeTruthy();
  });
  test.each(['neutral', 'accent', 'success', 'warning', 'danger'])(
    'badge renders %s content',
    async (tone) => {
      await render(NeuBadgeComponent, { inputs: { label: 'Ready', tone } });
      expect(screen.getByText('Ready')).toBeTruthy();
    },
  );
  test('spinner publishes progress semantics', async () => {
    await render(NeuSpinnerComponent, {
      inputs: { label: 'Saving', active: true },
    });
    expect(
      screen.getByRole('progressbar', { name: 'Saving' }).props[
        'accessibilityState'
      ],
    ).toMatchObject({ busy: true });
  });
  test('divider stays out of the accessibility tree', async () => {
    const result = await render(NeuDividerComponent);
    expect(result.fabric.committed).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

@Component({
  selector: 'test-theme',
  imports: [NeuThemeComponent, NeuButtonComponent],
  template: `<neu-theme [scheme]="scheme()" [tokens]="{ radius: 8 }"
    ><neu-button label="Themed"
  /></neu-theme>`,
})
class ThemeHost {
  readonly scheme = signal<'light' | 'dark'>('light');
}
test('rethemes compiled native styles when the preference changes', async () => {
  const result = await render(ThemeHost);
  const first = { ...screen.getByRole('button').props };
  result.instance.scheme.set('dark');
  await result.detectChanges();
  const dark = screen.getByRole('button').props;
  expect(dark).not.toEqual(first);
  expect(NEU_DARK_TOKENS.accent).toBe('#b5c4ff');
});
@Component({
  imports: [View, NeuThemeComponent, NeuBadgeComponent],
  template: `<neu-theme [scheme]="scheme()"
    ><view [class]="context()">
      <neu-badge label="Scoped badge" [tone]="tone()" /> </view
  ></neu-theme>`,
})
class BadgeScopeHost {
  readonly context = signal<NeuTone>('danger');
  readonly tone = signal<NeuTone>('neutral');
  readonly scheme = signal<'light' | 'dark'>('light');
}
const badgeTones = [
  'neutral',
  'accent',
  'success',
  'warning',
  'danger',
] as const;
const normalizeColor = (color: unknown) =>
  typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)
    ? `rgb(${[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(', ')})`
    : color;
test.each(
  badgeTones
    .slice(1)
    .flatMap((context) => badgeTones.map((tone) => ({ context, tone }))),
)(
  'badge $tone keeps its own tone inside a $context ancestor',
  async ({ context, tone }) => {
    const result = await render(BadgeScopeHost);
    result.instance.context.set(context);
    result.instance.tone.set(tone);
    await result.detectChanges();
    const expected = neuTonePalette(NEU_LIGHT_TOKENS, tone).ink;
    expect(
      normalizeColor(screen.getByText('Scoped badge').props['color']),
    ).toBe(normalizeColor(expected));
  },
);
test('badge tone and theme stay reactive inside a conflicting ancestor', async () => {
  const result = await render(BadgeScopeHost);
  result.instance.scheme.set('dark');
  await result.detectChanges();
  expect(normalizeColor(screen.getByText('Scoped badge').props['color'])).toBe(
    normalizeColor(NEU_DARK_TOKENS.text),
  );
  result.instance.tone.set('success');
  await result.detectChanges();
  expect(normalizeColor(screen.getByText('Scoped badge').props['color'])).toBe(
    normalizeColor(NEU_DARK_TOKENS.success),
  );
  result.instance.context.set('warning');
  await result.detectChanges();
  expect(normalizeColor(screen.getByText('Scoped badge').props['color'])).toBe(
    normalizeColor(NEU_DARK_TOKENS.success),
  );
});
@Component({
  selector: 'test-search-theme',
  imports: [NeuThemeComponent, NeuDataViewComponent, NeuFilterBarComponent],
  template: `<neu-theme [scheme]="scheme()" [tokens]="tokens()">
    <neu-data-view searchLabel="Data search" />
    <neu-filter-bar searchLabel="Filter search" />
  </neu-theme>`,
})
class SearchThemeHost {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly tokens = signal({});
}
test('search placeholders follow scheme changes and custom muted tokens', async () => {
  const result = await render(SearchThemeHost);
  const expectColor = (color: string) => {
    for (const label of ['Data search', 'Filter search']) {
      expect(screen.getByLabelText(label).props['placeholderTextColor']).toBe(
        color,
      );
    }
  };
  expectColor(NEU_LIGHT_TOKENS.muted);
  result.instance.scheme.set('dark');
  await result.detectChanges();
  expectColor(NEU_DARK_TOKENS.muted);
  result.instance.tokens.set({ muted: '#ffee88' });
  await result.detectChanges();
  expectColor('#ffee88');
});
test.each([
  { label: 'DataView', component: NeuDataViewComponent },
  { label: 'FilterBar', component: NeuFilterBarComponent },
])(
  'search placeholder has a visible fallback without a theme provider: $label',
  async ({ component }) => {
    await render(component, { inputs: { searchLabel: 'Search fallback' } });
    expect(
      screen.getByLabelText('Search fallback').props['placeholderTextColor'],
    ).toBe(NEU_LIGHT_TOKENS.muted);
  },
);
test('repeated mount and unmount destroys each Angular view', async () => {
  for (let i = 0; i < 25; i++) {
    const result = await render(NeuButtonComponent, {
      inputs: { label: 'Cycle ' + i },
    });
    result.unmount();
    expect(result.componentRef.hostView.destroyed).toBe(true);
  }
});
