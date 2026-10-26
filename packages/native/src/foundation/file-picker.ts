import { InjectionToken } from '@angular/core';
export interface NeuFile {
  readonly uri: string;
  readonly name: string;
  readonly size?: number;
  readonly mimeType?: string;
}
export interface NeuFilePicker {
  pick(options: {
    type: readonly string[];
    multiple: boolean;
  }): Promise<readonly NeuFile[] | null>;
}
export const NEU_FILE_PICKER = new InjectionToken<NeuFilePicker>(
  'Neural file picker',
  {
    providedIn: 'root',
    factory: () => ({
      async pick(options) {
        const { getDocumentAsync } = await import('expo-document-picker');
        const result = await getDocumentAsync({
          type: [...options.type],
          multiple: options.multiple,
          copyToCacheDirectory: true,
        });
        return result.canceled
          ? null
          : result.assets.map((x) => ({
              uri: x.uri,
              name: x.name,
              size: x.size,
              mimeType: x.mimeType,
            }));
      },
    }),
  },
);
export type NeuUpload = (
  file: NeuFile,
  progress: (percent: number) => void,
  signal: AbortSignal,
) => Promise<void>;
export interface NeuUploadItem {
  readonly id: string;
  readonly file: NeuFile;
  readonly state: 'selected' | 'uploading' | 'complete' | 'error';
  readonly progress: number;
  readonly error?: string;
}
