# Long and grouped lists

## Data View

Use `@neural-ui/native/data-view` for searchable, sortable rows. For a long list, give the results their own vertical scroll viewport:

```html
<neu-data-view
  [items]="people()"
  [virtualHeight]="360"
  [(query)]="query"
  (selected)="openProfile($event)"
/>
```

`virtualHeight` is a positive finite height in native layout units. Size it to the available space and let the component own vertical scrolling of the results. The search and action buttons remain above it. Rows are measured, including custom `neuDataViewItem` templates. The template's `index` is the position in the filtered, sorted result. Store row state by item ID if it needs to survive scrolling out of the rendered window. Omitting `virtualHeight` keeps the existing list layout so a parent scroll view can own scrolling.

## Section List

Import `NeuSectionListComponent` and the types `NeuSectionListSection` and `NeuSectionListSelection` from `@neural-ui/native/section-list`. Each section has a stable `key`, a localized `title` and `data` using the standard `NeuOption` row shape. Keep section keys unique and row IDs unique within their section. A row ID may be reused in a different section. The `selected` event gives both `sectionKey` and `itemId`.

```ts
readonly activity: readonly NeuSectionListSection[] = [
  { key: 'today', title: 'Today', data: [{ id: 'order', label: 'Order packed' }] },
  { key: 'yesterday', title: 'Yesterday', data: [{ id: 'order', label: 'Order received' }] },
];
readonly refreshing = signal(false);

async update(): Promise<void> {
  this.refreshing.set(true);
  try {
    await this.reloadActivity();
  } finally {
    this.refreshing.set(false);
  }
}
```

```html
<neu-section-list
  [sections]="activity"
  [height]="360"
  refreshEnabled
  [refreshing]="refreshing()"
  refreshLabel="Update activity"
  emptyLabel="No activity yet"
  (refresh)="update()"
  (selected)="openActivity($event)"
/>
```

Sticky headings are enabled on iOS and Android by default. Set `[stickyHeaders]="false"` for a list without that behavior. `refreshEnabled` enables the native pull gesture and a button with the same action. Set `refreshing` while updating existing data, `loading` during the initial load, and `error` to display a localized load error. Section headings and row labels expose native accessibility roles. Rows display the label and optional description on one line each, with their full text in the accessible name. Default heights follow system font scale. If you supply `itemHeight` or `headerHeight`, allow room for your theme and the text sizes you support.
