import { Component, signal } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuThemeComponent } from '@neural-ui/native/theme';
import { NeuSelectComponent } from '@neural-ui/native/select';
import { NeuSliderComponent } from '@neural-ui/native/slider';
import { NeuTabsComponent, NeuTabPanelComponent } from '@neural-ui/native/tabs';
import {
  NeuUploaderComponent,
  NEU_FILE_PICKER,
  type NeuUploadItem,
} from '@neural-ui/native/uploader';
import { NeuInputOtpComponent } from '@neural-ui/native/input-otp';
import { NeuTreeSelectComponent } from '@neural-ui/native/tree-select';
@Component({
  selector: 'catalogue-consumer',
  imports: [
    View,
    Text,
    NeuThemeComponent,
    NeuSelectComponent,
    NeuSliderComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuUploaderComponent,
    NeuInputOtpComponent,
    NeuTreeSelectComponent,
  ],
  template: `<neu-theme scheme="dark"
    ><view
      ><neu-select
        label="Owner"
        [options]="options"
        [(value)]="owner" /><neu-slider
        label="Volume"
        [(value)]="volume" /><neu-input-otp
        label="Code"
        [(value)]="code" /><neu-tabs [tabs]="options" [(value)]="tab"
        ><neu-tab-panel id="ada"><text>Ada panel</text></neu-tab-panel
        ><neu-tab-panel id="grace"
          ><text>Grace panel</text></neu-tab-panel
        ></neu-tabs
      ><neu-tree-select
        label="Team member"
        [nodes]="nodes"
        [(value)]="member" /><neu-uploader
        label="Documents"
        [(files)]="files" /></view
  ></neu-theme>`,
})
export class CatalogueConsumer {
  readonly options = [
    { id: 'ada', label: 'Ada' },
    { id: 'grace', label: 'Grace' },
  ];
  readonly nodes = [{ id: 'team', label: 'Team', children: this.options }];
  readonly owner = signal('');
  readonly volume = signal(30);
  readonly code = signal('');
  readonly tab = signal('ada');
  readonly member = signal('');
  readonly files = signal<readonly NeuUploadItem[]>([]);
}
export { NEU_FILE_PICKER };
