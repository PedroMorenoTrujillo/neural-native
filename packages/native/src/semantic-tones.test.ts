import { Component, signal } from '@angular/core';
import { cleanup, render, screen, settle } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NeuButtonComponent } from './button/button.ts';
import { NeuAlertComponent } from './alert/alert.ts';
import { NeuIconButtonComponent } from './icon-button/icon-button.ts';
import { NeuProgressBarComponent } from './progress-bar/progress-bar.ts';
import { NeuMeterGroupComponent } from './meter-group/meter-group.ts';
import { NeuSpinnerComponent } from './spinner/spinner.ts';
import { NeuAvatarComponent } from './avatar/avatar.ts';
import { NeuAvatarGroupComponent } from './avatar-group/avatar-group.ts';
import { NeuBadgeComponent } from './badge/badge.ts';
import { NEU_LIGHT_TOKENS, NEU_DARK_TOKENS } from './foundation/index.ts';
import { neuContrastRatio, neuTonePalette } from './foundation/tone.ts';
import { NeuThemeComponent } from './theme/theme.ts';
import { NeuCardComponent } from './card/card.ts';
import { NeuInputComponent } from './input/input.ts';
import type { NeuTokens, NeuTone } from './foundation/index.ts';

afterEach(cleanup);

@Component({
  selector: 'test-badge-live-palette',
  imports: [NeuThemeComponent, NeuBadgeComponent],
  template: `<neu-theme [scheme]="scheme()" [tokens]="tokens()"><neu-badge label="Project status" [tone]="tone()" /></neu-theme>`,
})
class BadgePaletteHost {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly tokens = signal<Partial<NeuTokens>>({});
  readonly tone = signal<NeuTone>('neutral');
}

test('badge background and ink both follow every semantic tone, live theme and custom colors', async () => {
  await render(BadgePaletteHost).then(async r => {
    const verify = (tokens: Readonly<NeuTokens>, tone: NeuTone) => {
      const label = screen.getByText('Project status');
      expect(label.props.color).toBe(neuTonePalette(tokens, tone).ink);
      expect(label.parent?.props.backgroundColor).toBe(neuTonePalette(tokens, tone).tonal);
    };
    for (const scheme of ['light', 'dark'] as const) {
      r.instance.scheme.set(scheme);
      for (const tone of ['neutral', 'brand', 'accent', 'success', 'info', 'warning', 'danger'] as const) {
        r.instance.tone.set(tone);
        await settle();
        verify(scheme === 'light' ? NEU_LIGHT_TOKENS : NEU_DARK_TOKENS, tone);
      }
    }
    r.instance.tokens.set({ danger: '#6b21a8', surface: '#121212' });
    await settle();
    verify({ ...NEU_DARK_TOKENS, danger: '#6b21a8', surface: '#121212' }, 'danger');
  });
});

@Component({
  selector: 'test-semantic-theme',
  imports: [NeuThemeComponent, NeuButtonComponent],
  template: `<neu-theme [scheme]="scheme()" [tokens]="tokens()"
    ><neu-button label="Save" tone="success"
  /></neu-theme>`,
})
class SemanticThemeHost {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly tokens = signal<Partial<NeuTokens>>({ success: '#6b21a8' });
}

@Component({
  selector: 'test-display-tones',
  imports: [
    NeuThemeComponent,
    NeuProgressBarComponent,
    NeuMeterGroupComponent,
    NeuSpinnerComponent,
    NeuAvatarComponent,
    NeuAvatarGroupComponent,
  ],
  template: `<neu-theme [scheme]="scheme()" [tokens]="tokens()">
    <neu-progress-bar label="Download" [value]="65" [tone]="tone()" />
    <neu-meter-group [items]="segments" [tone]="tone()" />
    <neu-spinner label="Loading projects" [tone]="tone()" />
    <neu-avatar label="Ada Lovelace" [tone]="tone()" />
    <neu-avatar-group [items]="people" [max]="1" [tone]="tone()" />
  </neu-theme>`,
})
class DisplayTonesHost {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly tokens = signal<Partial<NeuTokens>>({});
  readonly tone = signal<NeuTone>('brand');
  readonly segments = [
    { id: 'used', label: 'Used', value: 25 },
    { id: 'free', label: 'Free', value: 75 },
  ];
  readonly people = [
    { id: 'grace', label: 'Grace Hopper' },
    { id: 'alan', label: 'Alan Turing' },
  ];
}

test('display colors update in place across every tone, dark mode and theme overrides without changing values', async () => {
  const r = await render(DisplayTonesHost);
  const verify = (tokens: Readonly<NeuTokens>, tone: NeuTone) => {
    const palette = neuTonePalette(tokens, tone);
    const progress = screen.getByRole('progressbar', { name: 'Download' });
    expect(progress.props.accessibilityValue).toMatchObject({ now: 65 });
    expect(progress.children[0]?.props).toMatchObject({
      backgroundColor: palette.color,
      width: '65%',
    });
    expect(
      screen.getByRole('progressbar', { name: 'Used' }).children[0]?.props,
    ).toMatchObject({ backgroundColor: palette.color, width: '25%' });
    expect(r.fabric.find('ActivityIndicatorView')?.props.color).toBe(
      palette.color,
    );
    expect(
      screen.getByRole('image', { name: 'Ada Lovelace' }).props.backgroundColor,
    ).toBe(palette.tonal);
    expect(screen.getByText('AL').props.color).toBe(palette.ink);
    expect(screen.getByText('GH').props.color).toBe(palette.ink);
    expect(screen.getByText('+1').props.color).toBe(palette.ink);
  };
  for (const scheme of ['light', 'dark'] as const) {
    r.instance.scheme.set(scheme);
    for (const tone of [
      'neutral',
      'brand',
      'success',
      'info',
      'warning',
      'danger',
    ] as const) {
      r.instance.tone.set(tone);
      await settle();
      verify(scheme === 'light' ? NEU_LIGHT_TOKENS : NEU_DARK_TOKENS, tone);
    }
  }
  r.instance.tone.set('success');
  r.instance.tokens.set({ success: '#6b21a8' });
  await settle();
  verify({ ...NEU_DARK_TOKENS, success: '#6b21a8' }, 'success');
});

test('icon button color applies to its surface, icon and loading indicator', async () => {
  const r = await render(NeuIconButtonComponent, {
    inputs: {
      label: 'Add',
      svg: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/></svg>',
      tone: 'danger',
      variant: 'solid',
    },
  });
  expect(
    screen.getByRole('button', { name: 'Add' }).props.backgroundColor,
  ).toBe(NEU_LIGHT_TOKENS.danger);
  await r.rerender({
    inputs: { tone: 'success', variant: 'outline', loading: true },
  });
  expect(screen.getByRole('button', { name: 'Add' }).props).toMatchObject({
    backgroundColor: 'transparent',
    borderColor: NEU_LIGHT_TOKENS.success,
  });
  expect(r.fabric.find('ActivityIndicatorView')?.props.color).toBe(
    NEU_LIGHT_TOKENS.success,
  );
});

test('live theme overrides and dark mode update an existing semantic button', async () => {
  const r = await render(SemanticThemeHost);
  expect(
    screen.getByRole('button', { name: 'Save' }).props.backgroundColor,
  ).toBe('#6b21a8');
  r.instance.tokens.set({ success: '#0d9488', fontSize: 20 });
  await settle();
  expect(
    screen.getByRole('button', { name: 'Save' }).props.backgroundColor,
  ).toBe('#0d9488');
  expect(screen.getByText('Save').props.fontSize).toBe(20);
  r.instance.tokens.set({});
  r.instance.scheme.set('dark');
  await settle();
  expect(
    screen.getByRole('button', { name: 'Save' }).props.backgroundColor,
  ).toBe(NEU_DARK_TOKENS.success);
  expect(screen.getByText('Save').props.color).toBe(NEU_DARK_TOKENS.surface);
});

test('button sizes distinguish height and typography while retaining their touch target', async () => {
  const r = await render(NeuButtonComponent, {
    inputs: { label: 'Save', size: 'sm' },
  });
  expect(screen.getByText('Save').props.fontSize).toBe(14);
  expect(screen.getByRole('button', { name: 'Save' }).props.minHeight).toBe(48);
  await r.rerender({ inputs: { size: 'md' } });
  expect(screen.getByText('Save').props.fontSize).toBe(16);
  expect(screen.getByRole('button', { name: 'Save' }).props.minHeight).toBe(56);
  await r.rerender({ inputs: { size: 'lg' } });
  expect(screen.getByText('Save').props.fontSize).toBe(18);
  expect(screen.getByRole('button', { name: 'Save' }).props.minHeight).toBe(64);
});

test('warning uses an amber surface and readable ink for solid and text variants', async () => {
  const r = await render(NeuButtonComponent, {
    inputs: { label: 'Review', tone: 'warning' },
  });
  expect(
    screen.getByRole('button', { name: 'Review' }).props.backgroundColor,
  ).toBe('#f59e0b');
  expect(screen.getByText('Review').props.color).toBe(
    NEU_LIGHT_TOKENS.onWarning,
  );
  await r.rerender({ inputs: { variant: 'text' } });
  expect(screen.getByText('Review').props.color).toBe('#92400e');
});

test('fullWidth stretches the button and can be disabled without changing its size', async () => {
  const r = await render(NeuButtonComponent, {
    inputs: { label: 'Continue', fullWidth: true, size: 'sm' },
  });
  expect(screen.getByRole('button', { name: 'Continue' }).props).toMatchObject({
    width: '100%',
    minHeight: 48,
  });
  await r.rerender({ inputs: { fullWidth: false } });
  expect(
    screen.getByRole('button', { name: 'Continue' }).props.width,
  ).toBeNull();
  expect(screen.getByRole('button', { name: 'Continue' }).props.minHeight).toBe(
    48,
  );
});

test('button tone and variant update the native surface, text and loading indicator together', async () => {
  const r = await render(NeuButtonComponent, {
    inputs: { label: 'Save', tone: 'danger' },
  });
  expect(
    screen.getByRole('button', { name: 'Save' }).props.backgroundColor,
  ).toBe(NEU_LIGHT_TOKENS.danger);
  expect(screen.getByText('Save').props.color).toBe(NEU_LIGHT_TOKENS.surface);
  await r.rerender({
    inputs: { variant: 'outline', tone: 'success', loading: true },
  });
  expect(screen.getByRole('button', { name: 'Save' }).props).toMatchObject({
    backgroundColor: 'transparent',
    borderColor: NEU_LIGHT_TOKENS.success,
  });
  expect(screen.getByText('Save').props.color).toBe(neuTonePalette(NEU_LIGHT_TOKENS, 'success').ink);
  expect(r.fabric.find('ActivityIndicatorView')?.props.color).toBe(
    neuTonePalette(NEU_LIGHT_TOKENS, 'success').ink,
  );
});

test('semantic palettes use theme overrides and keep accent as a compatible brand alias', () => {
  const theme = { ...NEU_DARK_TOKENS, success: '#0f0', surface: '#123456' };
  expect(neuTonePalette(theme, 'brand')).toEqual(
    neuTonePalette(theme, 'accent'),
  );
  expect(neuTonePalette(theme, 'success')).toMatchObject({
    color: '#0f0',
    onColor: '#123456',
  });
  expect(neuTonePalette(theme, 'success').tonal).toMatch(/^#[\da-f]{6}$/);
  expect(
    neuTonePalette({ ...theme, info: 'rgb(0, 120, 200)' }, 'info'),
  ).toMatchObject({ color: 'rgb(0, 120, 200)', tonal: '#123456' });
});

test('semantic text clears AA on every default surface without changing fill colors', () => {
  for (const tokens of [NEU_LIGHT_TOKENS, NEU_DARK_TOKENS]) {
    for (const tone of ['neutral', 'brand', 'success', 'info', 'warning', 'danger'] as const) {
      const palette = neuTonePalette(tokens, tone);
      for (const surface of [tokens.surface, tokens.canvas, palette.tonal]) {
        expect(neuContrastRatio(palette.ink, surface), `${tone} ink on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(palette.color).toBe(tone === 'brand' ? tokens.accent : tone === 'neutral' ? tokens.text : tokens[tone]);
    }
  }
  expect(neuTonePalette({ ...NEU_LIGHT_TOKENS, accentText: '#123456' }, 'brand').ink).toBe('#123456');
});

test('alert tone changes its border and variant switches between a tinted and outlined surface', async () => {
  const r = await render(NeuAlertComponent, {
    inputs: { message: 'Saved', tone: 'success' },
  });
  expect(screen.getByRole('alert').props).toMatchObject({
    borderColor: neuTonePalette(NEU_LIGHT_TOKENS, 'success').tonal,
    backgroundColor: neuTonePalette(NEU_LIGHT_TOKENS, 'success').tonal,
  });
  await r.rerender({ inputs: { tone: 'warning', variant: 'outline' } });
  expect(screen.getByRole('alert').props).toMatchObject({
    borderColor: NEU_LIGHT_TOKENS.warning,
    backgroundColor: 'transparent',
  });
});

@Component({
  selector: 'test-surface-roles',
  imports: [NeuThemeComponent, NeuCardComponent, NeuInputComponent],
  template: `<neu-theme [tokens]="tokens()"><neu-card title="Surface" variant="outlined"><neu-input label="Editable" /></neu-card></neu-theme>`,
})
class SurfaceRolesHost {
  readonly tokens = signal<Partial<NeuTokens>>({ border: '#506070', surfaceBorder: '#dce2ea' });
}

test('live decorative border overrides stay independent of editable field borders', async () => {
  const r = await render(SurfaceRolesHost);
  const cardBorder = () => {
    let node = screen.getByText('Surface').parent;
    while (node && node.props.borderTopColor === undefined) node = node.parent;
    return node?.props.borderTopColor;
  };
  expect(cardBorder()).toBe('#dce2ea');
  expect(screen.getByLabelText('Editable').props.borderTopColor).toBe('#506070');
  r.instance.tokens.set({ border: '#704050', surfaceBorder: '#405060', fontSize: 20, radius: 18 });
  await settle();
  expect(cardBorder()).toBe('#405060');
  expect(screen.getByLabelText('Editable').props).toMatchObject({ borderTopColor: '#704050', borderTopLeftRadius: 15, fontSize: 20 });
});
