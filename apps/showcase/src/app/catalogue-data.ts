import { type Type } from '@angular/core';
import {NativeCardDemo,NativeFormFieldDemo,NativePanelDemo,NativeTabsDemo,NativeModalDemo,NativeBottomSheetDemo,NativePopoverDemo,NativeStepperDemo,NativeToolbarDemo} from './slot-demos.js';
import {
  NeuAccordionComponent,
  NeuAlertComponent,
  NeuAutocompleteComponent,
  NeuAvatarComponent,
  NeuAvatarGroupComponent,
  NeuBadgeComponent,

  NeuButtonComponent,
  NeuButtonGroupComponent,
  NeuCalendarComponent,

  NeuCarouselComponent,
  NeuCascadeSelectComponent,
  NeuCheckboxComponent,
  NeuChipComponent,
  NeuConfirmDialogComponent,
  NeuContextMenuComponent,
  NeuDataViewComponent,
  NeuDateInputComponent,
  NeuDividerComponent,
  NeuEmptyStateComponent,
  NeuFilterBarComponent,

  NeuGalleryComponent,
  NeuIconButtonComponent,
  NeuImageViewerComponent,
  NeuInlineEditorComponent,
  NeuInputComponent,
  NeuInputMaskComponent,
  NeuInputOtpComponent,
  NeuInputTagsComponent,
  NeuListboxComponent,
  NeuMenuComponent,
  NeuMeterGroupComponent,

  NeuNavComponent,
  NeuNotificationCenterComponent,
  NeuNumberInputComponent,

  NeuPasswordComponent,
  NeuPickListComponent,

  NeuProgressBarComponent,
  NeuRadioGroupComponent,
  NeuRatingComponent,
  NeuSelectComponent,
  NeuSidebarComponent,
  NeuSkeletonComponent,
  NeuSliderComponent,
  NeuSpeedDialComponent,
  NeuSpinnerComponent,
  NeuStatsCardComponent,

  NeuSwitchComponent,

  NeuTextareaComponent,
  NeuTimelineComponent,
  NeuToastComponent,
  NeuToggleButtonGroupComponent,

  NeuTreeComponent,
  NeuTreeSelectComponent,
  NeuUploaderComponent,
  NeuVirtualListComponent,
} from '@neural-ui/native';
const DEMO_RED_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeUlEQVR4nO3PwQkAIBDAsFvQn8u7jUP4CEKhA6Rz9vq64YIGtKABLWhACxrQgga0oAEtaEALGtCCBrSgAS1oQAsa0IIGtKABLWhACxrQgga0oAEtaEALGtCCBrSgAS1oQAsa0IIGtKABLWhACxrQgga0oAEtaEALHrtYAqFa9GofXgAAAABJRU5ErkJggg==';
const DEMO_BLUE_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwFfJMIa3jSH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYBtA7xPFRxhegAAAAASUVORK5CYII=';
export interface NativeDemo {
  readonly entry: string;
  readonly name: string;
  readonly component: Type<unknown>;
  readonly inputs: Record<string, unknown>;
}
export const NATIVE_DEMOS: readonly NativeDemo[] = [
  {
    entry: 'accordion',
    name: 'Accordion',
    component: NeuAccordionComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'alert',
    name: 'Alert',
    component: NeuAlertComponent,
    inputs: { message: 'Operación completada', closable: true },
  },
  {
    entry: 'autocomplete',
    name: 'Autocomplete',
    component: NeuAutocompleteComponent,
    inputs: {
      label: 'Buscar una opción',
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'avatar',
    name: 'Avatar',
    component: NeuAvatarComponent,
    inputs: { label: 'Ada Lovelace' },
  },
  {
    entry: 'avatar-group',
    name: 'Avatar Group',
    component: NeuAvatarGroupComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
      max: 2,
    },
  },
  {
    entry: 'badge',
    name: 'Badge',
    component: NeuBadgeComponent,
    inputs: { label: 'Nuevo' },
  },
  {
    entry: 'bottom-sheet',
    name: 'Bottom Sheet',
    component: NativeBottomSheetDemo,
    inputs: { title: 'Hoja nativa', open: true },
  },
  {
    entry: 'button',
    name: 'Button',
    component: NeuButtonComponent,
    inputs: { label: 'Guardar' },
  },
  {
    entry: 'button-group',
    name: 'Button Group',
    component: NeuButtonGroupComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'calendar',
    name: 'Calendar',
    component: NeuCalendarComponent,
    inputs: {
      locale: 'es',
      events: [{ id: 'meet', label: 'Revisión', date: '2026-10-09' }],
    },
  },
  {
    entry: 'card',
    name: 'Card',
    component: NativeCardDemo,
    inputs: {
      title: 'Tarjeta',
      description: 'Superficie nativa para contenido',
    },
  },
  {
    entry: 'carousel',
    name: 'Carousel',
    component: NeuCarouselComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Imagen roja',
          uri: DEMO_RED_IMAGE,
        },
        {
          id: 'two',
          label: 'Segunda imagen',
          uri: DEMO_BLUE_IMAGE,
        },
      ],
    },
  },
  {
    entry: 'cascade-select',
    name: 'Cascade Select',
    component: NeuCascadeSelectComponent,
    inputs: {
      label: 'Equipo',
      nodes: [
        {
          id: 'folder',
          label: 'Equipo',
          children: [
            { id: 'one', label: 'Ada' },
            { id: 'two', label: 'Grace' },
          ],
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'checkbox',
    name: 'Checkbox',
    component: NeuCheckboxComponent,
    inputs: { label: 'Acepto las condiciones' },
  },
  {
    entry: 'chip',
    name: 'Chip',
    component: NeuChipComponent,
    inputs: { label: 'Angular', removable: true },
  },
  {
    entry: 'confirm-dialog',
    name: 'Confirm Dialog',
    component: NeuConfirmDialogComponent,
    inputs: {
      title: 'Eliminar elemento',
      message: 'La aplicación decide qué hacer al confirmar.',
      open: true,
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
    },
  },
  {
    entry: 'context-menu',
    name: 'Context Menu',
    component: NeuContextMenuComponent,
    inputs: {
      label: 'Mantén pulsado este mensaje',
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'data-view',
    name: 'Data View',
    component: NeuDataViewComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'date-input',
    name: 'Date Input',
    component: NeuDateInputComponent,
    inputs: { label: 'Fecha', locale: 'es', value: '2026-10-09' },
  },
  {
    entry: 'divider',
    name: 'Divider',
    component: NeuDividerComponent,
    inputs: {},
  },
  {
    entry: 'empty-state',
    name: 'Empty State',
    component: NeuEmptyStateComponent,
    inputs: {
      title: 'No hay resultados',
      description: 'Puedes volver a intentarlo',
      actionLabel: 'Reintentar',
    },
  },
  {
    entry: 'filter-bar',
    name: 'Filter Bar',
    component: NeuFilterBarComponent,
    inputs: {
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'form-field',
    name: 'Form Field',
    component: NativeFormFieldDemo,
    inputs: {
      label: 'Correo',
      hint: 'El control se proyecta dentro del campo',
    },
  },
  {
    entry: 'gallery',
    name: 'Gallery',
    component: NeuGalleryComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Imagen roja',
          uri: DEMO_RED_IMAGE,
        },
        {
          id: 'two',
          label: 'Segunda imagen',
          uri: DEMO_BLUE_IMAGE,
        },
      ],
    },
  },
  {
    entry: 'icon-button',
    name: 'Icon Button',
    component: NeuIconButtonComponent,
    inputs: {
      label: 'Añadir',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    },
  },
  {
    entry: 'image-viewer',
    name: 'Image Viewer',
    component: NeuImageViewerComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Imagen roja',
          uri: DEMO_RED_IMAGE,
        },
        {
          id: 'two',
          label: 'Segunda imagen',
          uri: DEMO_BLUE_IMAGE,
        },
      ],
      open: true,
    },
  },
  {
    entry: 'inline-editor',
    name: 'Inline Editor',
    component: NeuInlineEditorComponent,
    inputs: {
      label: 'Editar título',
      value: 'Título original',
      required: true,
    },
  },
  {
    entry: 'input',
    name: 'Input',
    component: NeuInputComponent,
    inputs: { label: 'Nombre' },
  },
  {
    entry: 'input-mask',
    name: 'Input Mask',
    component: NeuInputMaskComponent,
    inputs: {
      mask: '### ### ###',
      label: 'Teléfono',
      keyboardType: 'phone-pad',
    },
  },
  {
    entry: 'input-otp',
    name: 'Input Otp',
    component: NeuInputOtpComponent,
    inputs: { label: 'Código de acceso', length: 6 },
  },
  {
    entry: 'input-tags',
    name: 'Input Tags',
    component: NeuInputTagsComponent,
    inputs: {
      label: 'Etiquetas',
      value: ['Angular', 'Native'],
      addLabel: 'Añadir',
    },
  },
  {
    entry: 'listbox',
    name: 'Listbox',
    component: NeuListboxComponent,
    inputs: {
      label: 'Opciones',
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
      multiple: true,
    },
  },
  {
    entry: 'menu',
    name: 'Menu',
    component: NeuMenuComponent,
    inputs: {
      label: 'Acciones',
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'meter-group',
    name: 'Meter Group',
    component: NeuMeterGroupComponent,
    inputs: {
      items: [
        { id: 'a', label: 'Usado', value: 30 },
        { id: 'b', label: 'Disponible', value: 70 },
      ],
    },
  },
  {
    entry: 'modal',
    name: 'Modal',
    component: NativeModalDemo,
    inputs: { title: 'Ventana nativa', open: true },
  },
  {
    entry: 'nav',
    name: 'Nav',
    component: NeuNavComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
      value: 'one',
    },
  },
  {
    entry: 'notification-center',
    name: 'Notification Center',
    component: NeuNotificationCenterComponent,
    inputs: {
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'number-input',
    name: 'Number Input',
    component: NeuNumberInputComponent,
    inputs: { label: 'Cantidad', value: 2, min: 0, max: 10, step: 0.5 },
  },
  {
    entry: 'panel',
    name: 'Panel',
    component: NativePanelDemo,
    inputs: { title: 'Detalles del panel' },
  },
  {
    entry: 'password',
    name: 'Password',
    component: NeuPasswordComponent,
    inputs: { label: 'Contraseña', value: 'Neural57' },
  },
  {
    entry: 'pick-list',
    name: 'Pick List',
    component: NeuPickListComponent,
    inputs: {
      label: 'Integrantes',
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'popover',
    name: 'Popover',
    component: NativePopoverDemo,
    inputs: { label: 'Información', title: 'Ayuda' },
  },
  {
    entry: 'progress-bar',
    name: 'Progress Bar',
    component: NeuProgressBarComponent,
    inputs: { label: 'Descarga', value: 65 },
  },
  {
    entry: 'radio',
    name: 'Radio',
    component: NeuRadioGroupComponent,
    inputs: {
      label: 'Plan',
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'rating',
    name: 'Rating',
    component: NeuRatingComponent,
    inputs: { label: 'Valoración', value: 3 },
  },
  {
    entry: 'select',
    name: 'Select',
    component: NeuSelectComponent,
    inputs: {
      label: 'Persona',
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'sidebar',
    name: 'Sidebar',
    component: NeuSidebarComponent,
    inputs: {
      title: 'Navegación',
      items: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
      open: true,
    },
  },
  {
    entry: 'skeleton',
    name: 'Skeleton',
    component: NeuSkeletonComponent,
    inputs: {},
  },
  {
    entry: 'slider',
    name: 'Slider',
    component: NeuSliderComponent,
    inputs: { label: 'Volumen', value: 40 },
  },
  {
    entry: 'speed-dial',
    name: 'Speed Dial',
    component: NeuSpeedDialComponent,
    inputs: {
      label: 'Crear',
      actions: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'spinner',
    name: 'Spinner',
    component: NeuSpinnerComponent,
    inputs: { label: 'Cargando' },
  },
  {
    entry: 'stats-card',
    name: 'Stats Card',
    component: NeuStatsCardComponent,
    inputs: { label: 'Ingresos', value: '1.250 €', change: '+12% este mes' },
  },
  {
    entry: 'stepper',
    name: 'Stepper',
    component: NativeStepperDemo,
    inputs: {
      steps: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
      ],
    },
  },
  {
    entry: 'switch',
    name: 'Switch',
    component: NeuSwitchComponent,
    inputs: { label: 'Notificaciones' },
  },
  {
    entry: 'tabs',
    name: 'Tabs',
    component: NativeTabsDemo,
    inputs: {
      tabs: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'textarea',
    name: 'Textarea',
    component: NeuTextareaComponent,
    inputs: { label: 'Descripción' },
  },
  {
    entry: 'timeline',
    name: 'Timeline',
    component: NeuTimelineComponent,
    inputs: {
      items: [
        { id: 'a', label: 'Pedido confirmado', date: 'Hoy', done: true },
        { id: 'b', label: 'Entrega prevista', date: 'Mañana' },
      ],
    },
  },
  {
    entry: 'toast',
    name: 'Toast',
    component: NeuToastComponent,
    inputs: { message: 'Cambios guardados', open: true, duration: 0 },
  },
  {
    entry: 'toggle-button-group',
    name: 'Toggle Button Group',
    component: NeuToggleButtonGroupComponent,
    inputs: {
      label: 'Filtros',
      options: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
      multiple: true,
    },
  },
  {
    entry: 'toolbar',
    name: 'Toolbar',
    component: NativeToolbarDemo,
    inputs: {
      actions: [
        {
          id: 'one',
          label: 'Primera opción',
          description: 'Una opción disponible',
        },
        {
          id: 'two',
          label: 'Segunda opción',
          description: 'Otra opción disponible',
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'tree',
    name: 'Tree',
    component: NeuTreeComponent,
    inputs: {
      nodes: [
        {
          id: 'folder',
          label: 'Equipo',
          children: [
            { id: 'one', label: 'Ada' },
            { id: 'two', label: 'Grace' },
          ],
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'tree-select',
    name: 'Tree Select',
    component: NeuTreeSelectComponent,
    inputs: {
      label: 'Elegir integrante',
      nodes: [
        {
          id: 'folder',
          label: 'Equipo',
          children: [
            { id: 'one', label: 'Ada' },
            { id: 'two', label: 'Grace' },
          ],
        },
        { id: 'off', label: 'No disponible', disabled: true },
      ],
    },
  },
  {
    entry: 'uploader',
    name: 'Uploader',
    component: NeuUploaderComponent,
    inputs: { label: 'Documentos', chooseLabel: 'Elegir archivos' },
  },
  {
    entry: 'virtual-list',
    name: 'Virtual List',
    component: NeuVirtualListComponent,
    inputs: {
      items: Array.from({ length: 1000 }, (_, index) => ({
        id: String(index), label: 'Contacto ' + index,
        description: 'Lista con vistas recicladas',
      })),
      height: 360,
    },
  },
];
