import { ApplicationRef, Directive, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
class NeuNativeTextSynchronization {
  private readonly application = inject(ApplicationRef);
  private synchronizing = false;

  synchronize(): void {
    if (this.synchronizing || this.application.destroyed) return;
    this.synchronizing = true;
    try {
      // Native changeText follows the text and event-count update. Finish Angular's
      // after-render reconciliation before the OS delivers the next key; a local
      // detectChanges() alone does not run that reconciliation. OnPush still skips
      // clean views. This explicit boundary is limited to native text edits.
      this.application.tick();
    } finally {
      this.synchronizing = false;
    }
  }
}

/** Internal bridge for the controlled text-input protocol in Angular Native. */
@Directive({ selector: 'text-input[neuSyncText]', exportAs: 'neuSyncText' })
export class NeuNativeTextSyncDirective {
  private readonly synchronization = inject(NeuNativeTextSynchronization);

  synchronize(): void {
    this.synchronization.synchronize();
  }
}
