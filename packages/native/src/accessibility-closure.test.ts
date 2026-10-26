import { cleanup, render, screen, settle } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuInputComponent } from './input/input.ts';
import { NeuTextareaComponent } from './textarea/textarea.ts';
import { NeuPasswordComponent } from './password/password.ts';
import { NeuInputMaskComponent } from './input-mask/input-mask.ts';
import { NeuInputTagsComponent } from './input-tags/input-tags.ts';
import { NeuSliderComponent } from './slider/slider.ts';
import { NeuInlineEditorComponent } from './inline-editor/inline-editor.ts';
import { Component } from '@angular/core';
import { TextInput } from '@ng-native/components';
import { NeuFormFieldComponent } from './form-field/form-field.ts';

afterEach(cleanup);

@Component({
  imports: [NeuFormFieldComponent, TextInput],
  template: `
    <neu-form-field #first label="First name"><text-input accessibilityLabel="First name" [accessibilityLabelledBy]="first.labelId" /></neu-form-field>
    <neu-form-field #last label="Last name"><text-input accessibilityLabel="Last name" [accessibilityLabelledBy]="last.labelId" /></neu-form-field>
  `,
})
class ProjectedLabels {}

test('projected controls reference separate native labels without transferring wrapper state implicitly', async () => {
  await render(ProjectedLabels);
  const first = screen.getByText('First name').props.nativeID;
  const last = screen.getByText('Last name').props.nativeID;
  expect(first).not.toBe(last);
  expect(screen.getByLabelText('First name').props.accessibilityLabelledBy).toBe(first);
  expect(screen.getByLabelText('Last name').props.accessibilityLabelledBy).toBe(last);
});

test.each([NeuInputComponent, NeuTextareaComponent, NeuPasswordComponent, NeuInputMaskComponent, NeuInlineEditorComponent])('filled text controls retain a native association with their visible label', async component => {
  const r = await render<object>(component, { inputs: { label: 'Project name', value: 'Mobile launch', ...(component === NeuInputMaskComponent ? { mask: 'AAAAAAAAAAAAA' } : {}), ...(component === NeuInlineEditorComponent ? { editing: true } : {}) } });
  const field = screen.getByLabelText('Project name');
  const label = screen.getByText('Project name');
  expect(label.props.nativeID).toBeTruthy();
  expect(field.props.accessibilityLabelledBy).toBe(label.props.nativeID);
  const labelId = label.props.nativeID;
  await r.rerender({ inputs: { label: 'Updated project name', value: 'Updated project' } });
  expect(screen.getByText('Updated project name').props.nativeID).toBe(labelId);
  expect(screen.getByLabelText('Updated project name').props.accessibilityLabelledBy).toBe(labelId);
});

test.each([NeuInputComponent, NeuTextareaComponent, NeuPasswordComponent, NeuInputMaskComponent])('text control announces requirement and current help, then the validation error', async component => {
  const r = await render<object>(component, { inputs: { label: 'Email', required: true, requiredLabel: 'Obligatorio', hint: 'Use your work address', error: 'Enter a valid address', ...(component === NeuInputMaskComponent ? { mask: '###-###' } : {}) } });
  expect(screen.getByLabelText('Email').props.accessibilityHint).toBe('Obligatorio. Use your work address');
  await r.rerender({ inputs: { invalid: true } });
  expect(screen.getByLabelText('Email').props.accessibilityHint).toBe('Obligatorio. Enter a valid address');
});

test('read-only tags retain values without presenting add or remove actions', async () => {
  const r = await render(NeuInputTagsComponent, { inputs: { label: 'Categories', value: ['Product', 'Mobile'], readonly: true } });
  expect(screen.getByText('Product')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Remove Product' })).toBeNull();
  await r.rerender({ inputs: { readonly: false } });
  expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
});

test('slider limit actions share bounds and emit only real enabled changes', async () => {
  const r = await render(NeuSliderComponent, { inputs: { label: 'Volume', min: 10, max: 90, step: 5, value: 50 } });
  const touched = vi.fn();
  r.instance.touch.subscribe(touched);
  const adjust = (name: string) => (r.instance as unknown as { adjust(event: { nativeEvent: { actionName: string } }): void }).adjust({ nativeEvent: { actionName: name } });
  adjust('setMaximum');
  await settle();
  expect(r.instance.value()).toBe(90);
  adjust('setMaximum');
  expect(touched).toHaveBeenCalledTimes(1);
  adjust('setMinimum');
  expect(r.instance.value()).toBe(10);
  await r.rerender({ inputs: { readonly: true } });
  adjust('setMaximum');
  expect(r.instance.value()).toBe(10);
});
