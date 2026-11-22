export const VECTOR_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }

  @media print {
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-size: 10pt !important;
      line-height: 1.4 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .no-print, .cv-toolbar, .workbench-canvas, .navbar {
      display: none !important;
    }

    .cv-sheet-container {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      background: transparent !important;
    }

    .cv-section-heading {
      break-after: avoid;
      page-break-after: avoid;
    }

    .cv-entry-item, .cv-pub-item, .cv-ref-card {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    a {
      color: inherit !important;
      text-decoration: none !important;
    }

    .cv-divider {
      border-color: #cbd5e1 !important;
    }
  }
`;

export function printCv(targetWindowOrIframe) {
  if (!targetWindowOrIframe) {
    if (typeof window !== 'undefined') window.print();
    return;
  }

  const win = targetWindowOrIframe.contentWindow || targetWindowOrIframe;
  if (win && typeof win.print === 'function') {
    win.focus();
    win.print();
  }
}
