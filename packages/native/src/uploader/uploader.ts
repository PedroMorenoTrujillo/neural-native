import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { clamp } from '../foundation/mobile.js';
import { NeuButtonComponent } from '../button/button.js';
import { NeuProgressBarComponent } from '../progress-bar/progress-bar.js';
import {
  NEU_FILE_PICKER,
  type NeuFile,
  type NeuUpload,
  type NeuUploadItem,
} from '../foundation/file-picker.js';

@Component({
  selector: 'neu-uploader',
  imports: [View, Text, NeuButtonComponent, NeuProgressBarComponent],
  template: `<view class="stack"
    ><text class="title">{{ label() }}</text
    ><neu-button
      [label]="chooseLabel()"
      [disabled]="disabled() || picking()"
      [loading]="picking()"
      (pressed)="pick()"
    />
    @if (error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    }
    @for (item of files(); track item.id) {
      <view class="surface outline"
        ><text class="label">{{ item.file.name }}</text
        ><text class="muted">{{ stateLabels()[item.state] }}</text>
        @if (item.state === 'uploading' || item.state === 'complete') {
          <neu-progress-bar [label]="item.file.name" [value]="item.progress" />
        }
        @if (item.error) {
          <text class="error" accessibilityRole="alert">{{ item.error }}</text>
        }
        <view class="row wrap">
          @if (
            upload() && (item.state === 'selected' || item.state === 'error')
          ) {
            <neu-button
              [label]="uploadLabel()"
              [accessibilityLabel]="uploadLabel() + ' ' + item.file.name"
              [disabled]="disabled()"
              (pressed)="start(item)"
            />
          }
          <neu-button
            [label]="removeLabel()"
            [accessibilityLabel]="removeLabel() + ' ' + item.file.name"
            variant="text"
            [disabled]="disabled()"
            (pressed)="remove(item.id)" /></view
      ></view>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuUploaderComponent {
  readonly label = input('Files');
  readonly files = model<readonly NeuUploadItem[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly types = input<readonly string[]>(['*/*']);
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly maxFiles = input(10);
  readonly maxBytes = input(10 * 1024 * 1024);
  readonly chooseLabel = input('Choose files');
  readonly uploadLabel = input('Upload');
  readonly removeLabel = input('Remove');
  readonly stateLabels = input<Readonly<Record<NeuUploadItem['state'], string>>>({
    selected: 'File selected',
    uploading: 'Uploading',
    complete: 'Upload complete',
    error: 'Upload failed',
  });
  readonly upload = input<NeuUpload>();
  readonly selected = output<readonly NeuFile[]>();
  readonly completed = output<NeuFile>();
  readonly rejected = output<string>();
  protected readonly picking = signal(false);
  protected readonly error = signal('');
  private readonly picker = inject(NEU_FILE_PICKER);
  private readonly controllers = new Map<string, AbortController>();
  private readonly activeFiles = new Map<string, NeuFile>();
  private readonly fileIndex = computed(() => {
    const index = new Map<string, Set<string>>();
    for (const item of this.files()) {
      const uris = index.get(item.id);
      if (uris) uris.add(item.file.uri);
      else index.set(item.id, new Set([item.file.uri]));
    }
    return index;
  });
  private alive = true;
  private counter = 0;
  constructor() {
    effect(() => {
      const files = this.fileIndex();
      for (const [id, controller] of this.controllers) {
        if (
          !files.get(id)?.has(this.activeFiles.get(id)?.uri ?? '')
        ) {
          controller.abort();
          this.controllers.delete(id);
          this.activeFiles.delete(id);
        }
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.alive = false;
      for (const controller of this.controllers.values()) controller.abort();
      this.controllers.clear();
      this.activeFiles.clear();
    });
  }
  protected async pick(): Promise<void> {
    if (this.disabled() || this.picking()) return;
    this.picking.set(true);
    this.error.set('');
    try {
      const picked = await this.picker.pick({
        type: this.types(),
        multiple: this.multiple(),
      });
      if (!this.alive || this.disabled() || !picked) return;
      const accepted: NeuFile[] = [];
      const existingUris = new Set(this.files().map((item) => item.file.uri));
      let room = Math.max(0, this.maxFiles() - this.files().length);
      for (const file of picked) {
        if (
          !room ||
          !file.uri ||
          !file.name ||
          (file.size !== undefined && file.size > this.maxBytes())
        ) {
          this.fail('File rejected: ' + file.name);
          continue;
        }
        if (existingUris.has(file.uri)) continue;
        accepted.push(file);
        existingUris.add(file.uri);
        room--;
      }
      this.files.update((items) => [
        ...items,
        ...accepted.map((file) => ({
          id: this.nextId(),
          file,
          state: 'selected' as const,
          progress: 0,
        })),
      ]);
      if (accepted.length) this.selected.emit(accepted);
    } catch (error) {
      if (this.alive)
        this.fail(
          error instanceof Error ? error.message : 'Could not choose files',
        );
    } finally {
      if (this.alive) this.picking.set(false);
    }
  }
  protected async start(item: NeuUploadItem): Promise<void> {
    const upload = this.upload();
    if (
      this.disabled() ||
      !upload ||
      this.controllers.has(item.id) ||
      !this.fileIndex().has(item.id)
    )
      return;
    const controller = new AbortController();
    this.controllers.set(item.id, controller);
    this.activeFiles.set(item.id, item.file);
    this.update(item.id, { state: 'uploading', progress: 0, error: undefined });
    try {
      await upload(
        item.file,
        (progress) => {
          if (this.isCurrent(item, controller))
            this.update(item.id, { progress: clamp(progress, 0, 100) });
        },
        controller.signal,
      );
      if (!this.isCurrent(item, controller)) return;
      this.update(item.id, { state: 'complete', progress: 100 });
      this.completed.emit(item.file);
    } catch (error) {
      if (this.isCurrent(item, controller))
        this.update(item.id, {
          state: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
    } finally {
      if (this.controllers.get(item.id) === controller) {
        this.controllers.delete(item.id);
        this.activeFiles.delete(item.id);
      }
    }
  }
  protected remove(id: string): void {
    if (this.disabled()) return;
    this.controllers.get(id)?.abort();
    this.controllers.delete(id);
    this.activeFiles.delete(id);
    this.files.update((items) => items.filter((x) => x.id !== id));
  }
  private nextId(): string {
    let id: string;
    do {
      id = 'file-' + ++this.counter;
    } while (this.fileIndex().has(id));
    return id;
  }
  private update(id: string, patch: Partial<NeuUploadItem>): void {
    if (this.alive)
      this.files.update((items) =>
        items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
  }
  private isCurrent(item: NeuUploadItem, controller: AbortController): boolean {
    return (
      this.alive &&
      !controller.signal.aborted &&
      this.controllers.get(item.id) === controller &&
      !!this.fileIndex().get(item.id)?.has(item.file.uri)
    );
  }
  private fail(message: string): void {
    this.error.set(message);
    this.rejected.emit(message);
  }
}
