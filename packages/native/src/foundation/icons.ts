const svg = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
export const NEU_CHEVRON_DOWN = svg('<path d="m6 9 6 6 6-6"/>');
export const NEU_CHEVRON_RIGHT = svg('<path d="m9 6 6 6-6 6"/>');
export const NEU_CHEVRON_LEFT = svg('<path d="m15 6-6 6 6 6"/>');
export const NEU_ARROW_UP = svg('<path d="m6 12 6-6 6 6M12 6v12"/>');
export const NEU_ARROW_DOWN = svg('<path d="m6 12 6 6 6-6M12 6v12"/>');
export {
  NEU_PLUS_ICON as NEU_PLUS,
  NEU_CHECK_ICON as NEU_CHECK,
} from './index.js';
export const NEU_EDIT = svg('<path d="m16 3 5 5-13 13H3v-5zM14 5l5 5"/>');
export const NEU_CLOSE = svg('<path d="m6 6 12 12M18 6 6 18"/>');
export const NEU_SEARCH = svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>');
export const NEU_FOLDER = svg(
  '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10H3Z"/>',
);
export const NEU_FILE = svg(
  '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
);
export const NEU_MORE = svg(
  '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
);
export const NEU_EYE = svg(
  '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
);
export const NEU_EYE_OFF = svg(
  '<path d="m3 3 18 18M10.6 5.1A11.7 11.7 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.3 4.3M6.2 6.2A20 20 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.8-1.8M10 10a3 3 0 0 0 4 4"/>',
);
