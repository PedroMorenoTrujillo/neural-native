import { DestroyRef, Directive, afterRenderEffect, inject, input, output, signal } from '@angular/core';
import { TextInput, type TextInputChangePayload } from '@ng-native/components';
import type { NativeSyntheticEvent } from '@ng-native/fabric';
import { registerNativeTextSnapshot } from './native-text-snapshot.ts';

/** Internal text bridge: retain the native editing buffer until explicit reconciliation. */
@Directive({ selector: 'text-input' })
export class NeuNativeTextInput extends TextInput {
  readonly neuralValue = input.required<string>();
  readonly neuralValueChange = output<string>();
  // Stable single-line controls can rely on the normal batched props commit.
  // Keep explicit remeasurement by default for content-dependent controls.
  readonly neuralRemeasure = input(true);
  private readonly reportedText = signal<string | null>(null);
  private nativeEventCount = 0;
  private hasNativeEdits = false;
  private nativeTextReleased = false;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(registerNativeTextSnapshot(this.node, () => this.snapshotReleasedText()));
    this.touch.subscribe(() => {
      // A presentation can recreate its native text view while retaining this
      // directive. Snapshot the accepted buffer once editing has ended so the
      // new view receives current text rather than an empty or outdated seed.
      // Keep this out of the keystroke path to preserve iOS predictive selection.
      this.snapshotReleasedText();
    });
    afterRenderEffect({
      write: () => {
        const desired = this.neuralValue();
        const reported = this.reportedText();
        if (reported === desired) return;
        this.reportedText.set(desired);
        // A focused, initially empty field owns its text. Keep its inherited host
        // binding stable; later app values reach native through the counted command.
        if (!this.nativeTextReleased) this.value.set(desired);
        // Untouched fields need only the normal text prop. In particular, a
        // modal may not have mounted its native field yet. Reconcile by command
        // once native has an editing buffer, or focus has released the text prop.
        if (reported !== null && (this.hasNativeEdits || this.nativeTextReleased)) {
          this.eventCount.set(this.nativeEventCount);
          // Use the current native counter and preserve the native selection.
          this.engine.dispatchCommand(this.node, 'setTextAndSelection', [
            this.nativeEventCount, desired, -1, -1,
          ]);
          if (this.neuralRemeasure()) this.engine.remeasure(this.node);
        }
      },
    });
  }

  private snapshotReleasedText(): void {
    this.nativeTextReleased = false;
    this.eventCount.set(this.nativeEventCount);
    this.value.set(this.neuralValue());
  }

  protected override onFocus(): void {
    // Clearing an initial nonempty text prop would erase a seeded field on focus.
    if (!this.nativeTextReleased && this.neuralValue() === '') {
      this.nativeTextReleased = true;
      this.engine.setProp(this.node, 'text', undefined);
    }
    super.onFocus();
  }

  override setSelection(start: number, end = start): void {
    this.engine.dispatchCommand(this.node, 'setTextAndSelection', [
      this.nativeEventCount, null, start, end,
    ]);
  }

  protected override onNativeChange(
    event: NativeSyntheticEvent<Partial<TextInputChangePayload>>,
  ): void {
    const text = event.nativeEvent?.text ?? '';
    this.hasNativeEdits = true;
    this.reportedText.set(text);
    // Accepted edits already live in the native field. Keep its programmatic text
    // prop stable: echoing each keystroke can move the iOS predictive-text cursor.
    // The render effect still reconciles rejected, transformed and external values.
    // Track every native counter for commands without committing a counter-only
    // props update on accepted edits. That commit can replay an iOS predictive
    // text snapshot and move the cursor even when the text prop did not change.
    this.nativeEventCount = event.nativeEvent?.eventCount ?? this.nativeEventCount + 1;
    if (this.resolvedEditable() !== false) this.neuralValueChange.emit(text);
    // The shared directive retains its guarded ApplicationRef.tick() after this.
    this.changeText.emit(text);
  }
}
