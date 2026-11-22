import { generateDocxBlob } from './docx-exporter.js';
import { printCv, VECTOR_PRINT_CSS } from './pdf-print-exporter.js';
import {
  renderLetterHtml,
  exportLetterDocx,
  exportLetterMarkdown,
  exportLetterPlainText
} from './letter-exporter.js';

export const Exporters = {
  html: (markup) => markup,
  json: (profile) => JSON.stringify(profile, null, 2),
  docx: generateDocxBlob,
  printPdf: printCv,
  printCss: VECTOR_PRINT_CSS,
  letterHtml: renderLetterHtml,
  letterDocx: exportLetterDocx,
  letterMarkdown: exportLetterMarkdown,
  letterPlainText: exportLetterPlainText
};

export {
  generateDocxBlob,
  printCv,
  VECTOR_PRINT_CSS,
  renderLetterHtml,
  exportLetterDocx,
  exportLetterMarkdown,
  exportLetterPlainText
};
