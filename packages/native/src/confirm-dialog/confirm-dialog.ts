import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuModalComponent } from '../modal/modal.js';
import { NeuModalFooterDirective } from '../modal/modal-templates.js';
import { NeuButtonComponent } from '../button/button.js';

@Component({
  selector: 'neu-confirm-dialog',
  imports: [NeuModalComponent, NeuModalFooterDirective, Text, View, NeuButtonComponent],
  template: `<neu-modal
    [(open)]="open"
    [title]="title()"
    [dismissible]="!busy()"
    [showCloseButton]="showCloseButton()"
    [closeLabel]="closeLabel()"
    (closed)="cancelled.emit()"
    (opened)="opened.emit()"
    (dismissed)="dismissed.emit()"
    ><text class="confirmation-message">{{ message() }}</text
    ><ng-template neuModalFooter><view class="confirmation-actions"
      ><neu-button
        [label]="cancelLabel()"
        variant="text"
        size="sm"
        [disabled]="busy()"
        (pressed)="cancel()" /><neu-button
        size="sm"
        [label]="confirmLabel()"
        [tone]="intent() === 'danger' ? 'danger' : 'brand'"
        [loading]="busy()"
        (pressed)="confirm()" /></view
  ></ng-template></neu-modal>`,
  styleUrls: ['../foundation/mobile.css', './confirm-dialog.css'],
})
export class NeuConfirmDialogComponent {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly intent = input<'default' | 'danger'>('default');
  readonly busy = input(false, { transform: booleanAttribute });
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Close');
  readonly closeOnConfirm = input(true, { transform: booleanAttribute });
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly opened = output<void>();
  readonly dismissed = output<void>();
  protected confirm(): void {
    if (!this.busy() && this.open()) {
      if (this.closeOnConfirm()) this.open.set(false);
      this.confirmed.emit();
    }
  }
  protected cancel(): void {
    if (!this.busy() && this.open()) {
      this.open.set(false);
      this.cancelled.emit();
    }
  }
}
