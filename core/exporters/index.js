import { generateDocxBlob } from './docx-exporter.js';
import { printCv, VECTOR_PRINT_CSS } from './pdf-print-exporter.js';

export const Exporters = {
  html: (markup) => markup,
  json: (profile) => JSON.stringify(profile, null, 2),
  docx: generateDocxBlob,
  printPdf: printCv,
  printCss: VECTOR_PRINT_CSS
};
