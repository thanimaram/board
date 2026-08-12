/**
 * exportDiagram.js
 * Captures the ReactFlow board (including SVG edges/connections) and exports
 * as PNG or PDF.
 *
 * Uses `html-to-image` (ReactFlow's recommended export library) instead of
 * html2canvas.  html-to-image serialises the full DOM — including <svg> edges
 * — via a foreignObject-based approach, which html2canvas cannot do.
 *
 * Both libraries are loaded dynamically from CDN; no npm install required.
 */

// html-to-image exposes window.htmlToImage when loaded as UMD
const HTML_TO_IMAGE_CDN =
  'https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.js';

const JSPDF_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

/* ── Script loader ──────────────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

/* ── UI chrome to hide during capture ──────────────────────────────────── */
const HIDE_SELECTORS = [
  '.toolbar',
  '.react-flow__controls',
  '.react-flow__attribution',
  '.board-panel',
  '.react-flow__minimap',
];

function hideChrome() {
  const snapshot = [];
  HIDE_SELECTORS.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      snapshot.push({ el, prev: el.style.visibility });
      el.style.visibility = 'hidden';
    });
  });
  return snapshot;
}

function restoreChrome(snapshot) {
  snapshot.forEach(({ el, prev }) => (el.style.visibility = prev));
}

/* ── Core capture ───────────────────────────────────────────────────────── */
/**
 * Captures the current board view as a PNG data-URL.
 *
 * html-to-image is called twice (a known workaround for the library's
 * first-render font/image caching quirk) to guarantee a complete image.
 *
 * @returns {Promise<string>} PNG data-URL
 */
async function captureBoardDataUrl() {
  await loadScript(HTML_TO_IMAGE_CDN);

  // Target the outer .react-flow container so the SVG edges layer is included
  const el = document.querySelector('.react-flow');
  if (!el) throw new Error('Board element (.react-flow) not found.');

  const snapshot = hideChrome();

  const options = {
    backgroundColor: '#ffffff',
    pixelRatio: 2,        // 2× resolution for crisp output
    cacheBust: true,
    skipFonts: false,
    // Preserve the full computed style so SVG markers / CSS vars are resolved
    filter: () => true,
  };

  try {
    // First pass — warms up font/image cache inside html-to-image
    await window.htmlToImage.toPng(el, options);
    // Second pass — actual, fully rendered output
    const dataUrl = await window.htmlToImage.toPng(el, options);
    return dataUrl;
  } finally {
    restoreChrome(snapshot);
  }
}

/* ── Public API ─────────────────────────────────────────────────────────── */

/**
 * Download the board as a PNG image.
 * @param {string} [filename='diagram']
 */
export async function exportAsPNG(filename = 'diagram') {
  const dataUrl = await captureBoardDataUrl();
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Download the board as a PDF document.
 * Page orientation and size match the board canvas dimensions.
 * @param {string} [filename='diagram']
 */
export async function exportAsPDF(filename = 'diagram') {
  // Load jsPDF in parallel with the image capture
  const [dataUrl] = await Promise.all([
    captureBoardDataUrl(),
    loadScript(JSPDF_CDN),
  ]);

  const el = document.querySelector('.react-flow');
  const { width: cssW, height: cssH } = el.getBoundingClientRect();

  const { jsPDF } = window.jspdf;
  const orientation = cssW >= cssH ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [cssW, cssH],
    hotfixes: ['px_scaling'],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, cssW, cssH);
  pdf.save(`${filename}.pdf`);
}
