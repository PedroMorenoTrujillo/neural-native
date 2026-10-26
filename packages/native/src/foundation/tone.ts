import type { NeuTokens, NeuTone } from './index.js';

/** Resolve semantic colors from the current theme, including runtime overrides. */
export function neuTonePalette(tokens: Readonly<NeuTokens>, tone: NeuTone) {
  const brand = tone === 'brand' || tone === 'accent';
  const color = brand ? tokens.accent : tone === 'neutral' ? tokens.text : tokens[tone];
  const tonal = brand ? tokens.tonal : tone === 'neutral' ? tokens.canvas : tint(color, tokens.surface);
  const text = brand ? tokens.accentText : tone === 'danger' ? tokens.dangerText
    : tone === 'success' ? tokens.successText : tone === 'info' ? tokens.infoText : undefined;
  return {
    color,
    onColor: brand ? tokens.onAccent : tone === 'warning' ? tokens.onWarning : tokens.surface,
    ink: text ?? readableInk(tone === 'warning' ? tokens.warningText : color, [tonal, tokens.canvas, tokens.surface]),
    tonal,
  };
}

function rgb(value: string): number[] | undefined {
  const hex = value.replace(/^#/, '');
  const expanded = /^[\da-f]{3}$/i.test(hex) ? hex.split('').map(value => value + value).join('') : hex;
  return /^[\da-f]{6}$/i.test(expanded) ? [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16)) : undefined;
}

/** Relative luminance for opaque sRGB theme colors. Platform colors remain untouched. */
export function neuContrastRatio(foreground: string, background: string): number | undefined {
  const luminance = (color: string) => rgb(color)?.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
  const front = luminance(foreground), back = luminance(background);
  return front === undefined || back === undefined ? undefined : (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
}

function readableInk(color: string, surfaces: readonly string[]): string {
  const channels = rgb(color);
  if (!channels || surfaces.some(surface => !rgb(surface))) return color;
  const contrast = (candidate: string) => Math.min(...surfaces.map(surface => neuContrastRatio(candidate, surface)!));
  if (contrast(color) >= 4.5) return color;
  const target = contrast('#000000') > contrast('#ffffff') ? 0 : 255;
  // Keep semantic fills unchanged; only move text ink enough to clear the threshold.
  for (let amount = 0.01; amount <= 1; amount += 0.01) {
    const candidate = '#' + channels.map(channel => Math.round(channel + (target - channel) * amount).toString(16).padStart(2, '0')).join('');
    if (contrast(candidate) >= 4.6) return candidate;
  }
  return color;
}

function tint(color: string, surface: string): string {
  const front = rgb(color), back = rgb(surface);
  // Non-hex platform colors retain their semantic ink on the configured surface.
  if (!front || !back) return surface;
  return '#' + front.map((channel, index) => Math.round(channel * 0.12 + back[index]! * 0.88).toString(16).padStart(2, '0')).join('');
}
