import { cleanup, fireEvent, render, screen, userEvent, type FakeFabric, type FakeFabricNode } from '@ng-native/testing';
import { signal, type Type } from '@angular/core';
import { Modal } from '@ng-native/components';
import { NeuModalComponent } from './modal/modal.ts';
import { NeuBottomSheetComponent } from './bottom-sheet/bottom-sheet.ts';
import { NeuConfirmDialogComponent } from './confirm-dialog/confirm-dialog.ts';
import { NeuSidebarComponent } from './sidebar/sidebar.ts';
import { NeuImageViewerComponent } from './image-viewer/image-viewer.ts';
import { NeuGalleryComponent } from './gallery/gallery.ts';
import { NeuPopoverComponent } from './popover/popover.ts';
import { afterEach, expect, test, vi } from 'vitest';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);

// These checks isolate the native visible=false commit from decorative motion.
const instantMotion = [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) }];

test.each([
  ['modal', NeuModalComponent, { title: 'Orientation' }],
  ['bottom sheet', NeuBottomSheetComponent, { title: 'Orientation' }],
  ['sidebar', NeuSidebarComponent, { title: 'Orientation' }],
  ['image viewer', NeuImageViewerComponent, { label: 'Orientation' }],
  ['popover', NeuPopoverComponent, { title: 'Orientation', label: 'Orientation' }],
] as const)(
  '%s permits portrait and landscape instead of forcing portrait',
  async (_name, component, inputs) => {
    const r = await render(component as Type<unknown>, {
      inputs: { ...inputs, open: true },
      providers: instantMotion,
    });
    expect(r.fabric.find('ModalHostView')?.props.supportedOrientations).toEqual(['portrait', 'landscape']);
  },
);

function recordModalCommits(fabric: FakeFabric) {
  const commits: { reactTag: number; visible: unknown }[] = [];
  const completeRoot = fabric.completeRoot.bind(fabric);
  fabric.completeRoot = (tag, childSet) => {
    const visit = (nodes: readonly FakeFabricNode[]) => {
      for (const node of nodes) {
        if (node.viewName === 'ModalHostView') {
          commits.push({ reactTag: node.reactTag, visible: node.props['visible'] });
        }
        visit(node.children);
      }
    };
    visit(childSet as unknown as readonly FakeFabricNode[]);
    completeRoot(tag, childSet);
  };
  return commits;
}

test('base modal commits visible=false before simulated native dismissal and can reopen', async () => {
  const r = await render(Modal, { inputs: { visible: true } });
  const shown = r.fabric.find('ModalHostView')!;
  const commits = recordModalCommits(r.fabric);
  await r.rerender({ inputs: { visible: false } });
  expect(commits).toContainEqual({ reactTag: shown.reactTag, visible: false });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
  await r.rerender({ inputs: { visible: true } });
  expect(r.fabric.find('ModalHostView')?.reactTag).not.toBe(shown.reactTag);
});

test('modal sends visible=false before native dismissal', async () => {
  const r = await render(NeuModalComponent, { inputs: { title: 'Lifecycle', open: true }, providers: instantMotion });
  const shown = r.fabric.find('ModalHostView')!;
  const commits = recordModalCommits(r.fabric);
  await r.rerender({ inputs: { open: false } });
  expect(commits).toContainEqual({ reactTag: shown.reactTag, visible: false });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
});

test('bottom sheet sends visible=false before native dismissal', async () => {
  const r = await render(NeuBottomSheetComponent, { inputs: { title: 'Lifecycle', open: true }, providers: instantMotion });
  const shown = r.fabric.find('ModalHostView')!;
  const commits = recordModalCommits(r.fabric);
  await r.rerender({ inputs: { open: false } });
  expect(commits).toContainEqual({ reactTag: shown.reactTag, visible: false });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
});

test.each([
  ['image viewer', NeuImageViewerComponent],
  ['gallery', NeuGalleryComponent],
  ['popover', NeuPopoverComponent],
] as const)('%s sends visible=false before native dismissal and can reopen', async (_name, component) => {
  const r = await render(component as Type<unknown>, {
    inputs: { label: 'Lifecycle', open: true },
    providers: instantMotion,
  });
  const shown = r.fabric.find('ModalHostView')!;
  const commits = recordModalCommits(r.fabric);
  await r.rerender({ inputs: { open: false } });
  expect(commits).toContainEqual({ reactTag: shown.reactTag, visible: false });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
  await r.rerender({ inputs: { open: true } });
  expect(r.fabric.find('ModalHostView')?.reactTag).not.toBe(shown.reactTag);
});

test.each([
  ['modal', NeuModalComponent],
  ['bottom sheet', NeuBottomSheetComponent],
  ['image viewer', NeuImageViewerComponent],
] as const)('%s distinguishes native presentation, close intent and native dismissal', async (_name, component) => {
  const events:string[]=[];
  const r=await render(component as Type<unknown>, {
    inputs:_name==='image viewer'?{label:'Lifecycle',open:true}:{title:'Lifecycle',open:true},
    providers: instantMotion,
    on:{opened:()=>events.push('shown'),closed:()=>events.push('intent'),dismissed:()=>events.push('dismissed')},
  });
  const shown=r.fabric.find('ModalHostView')!;
  await fireEvent(shown,'show',{});
  expect(events).toEqual(['shown']);
  await userEvent.setup().press(screen.getByRole('button',{name:_name==='image viewer'?'Close viewer':'Close'}));
  expect(events).toEqual(['shown','intent','dismissed']);
  await fireEvent(shown,'dismiss',{});
  expect(events).toEqual(['shown','intent','dismissed']);
});

test.each([
  ['dialog', NeuConfirmDialogComponent],
  ['sidebar', NeuSidebarComponent],
] as const)('%s forwards presentation and completed dismissal from its native surface', async (name, component) => {
  const events:string[]=[];
  const inputs=name==='dialog'?{title:'Lifecycle',message:'Confirm',open:true}:{title:'Lifecycle',open:true};
  const r=await render(component as Type<unknown>, {
    inputs,
    on:{opened:()=>events.push('shown'),dismissed:()=>events.push('dismissed')},
  });
  await fireEvent(r.fabric.find('ModalHostView')!,'show',{});
  expect(events).toEqual(['shown']);
  await r.rerender({inputs:{open:false}});
  await vi.waitFor(() => expect(events).toEqual(['shown','dismissed']));
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
});
