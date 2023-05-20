export const STAIC_FILE_TYPES_EXTENSIONS = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    json: 'application/json',
    xml: 'application/xml',
  };

  export type StaticFiles = keyof typeof STAIC_FILE_TYPES_EXTENSIONS