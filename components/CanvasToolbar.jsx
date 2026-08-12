'use client';
import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

/* ── SVG icons (inline, no deps) ─────────────────────────────────────────── */
const IconPan = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-4 0v1M14 7V4a2 2 0 0 0-4 0v3M10 7.5V6a2 2 0 0 0-4 0v8"/>
    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);
const IconZoomOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const IconZoomIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const IconFit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/>
    <polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);
const IconPNG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IconPDF = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconSpinner = () => (
  <span className="ct-spinner" />
);

/* ── CanvasToolbar ─────────────────────────────────────────────────────────── */
export default function CanvasToolbar({
  isPanMode,
  onTogglePan,
  onExportPNG,
  onExportPDF,
  isExporting,
}) {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoomPct, setZoomPct] = useState(75);

  /* Poll zoom level every 250 ms — lightweight and reliable */
  const syncZoom = useCallback(() => {
    try { setZoomPct(Math.round(getZoom() * 100)); } catch { /* ignore */ }
  }, [getZoom]);

  useEffect(() => {
    syncZoom();
    const id = setInterval(syncZoom, 250);
    return () => clearInterval(id);
  }, [syncZoom]);

  const handleZoomIn  = () => { zoomIn();  setTimeout(syncZoom, 80); };
  const handleZoomOut = () => { zoomOut(); setTimeout(syncZoom, 80); };
  const handleFit     = () => { fitView({ padding: 0.12, duration: 350 }); setTimeout(syncZoom, 400); };

  return (
    <div className="canvas-top-bar">

      {/* Pan toggle */}
      <button
        id="ct-pan"
        className={`ctb-btn${isPanMode ? ' ctb-btn--active' : ''}`}
        onClick={onTogglePan}
        title="Pan mode"
      >
        <IconPan />
        <span className="ctb-label">Pan</span>
      </button>

      <div className="ctb-sep" />

      {/* Zoom out */}
      <button className="ctb-icon-btn" onClick={handleZoomOut} title="Zoom out">
        <IconZoomOut />
      </button>

      {/* Zoom level display */}
      <span className="ctb-zoom">{zoomPct}%</span>

      {/* Zoom in */}
      <button className="ctb-icon-btn" onClick={handleZoomIn} title="Zoom in">
        <IconZoomIn />
      </button>

      <div className="ctb-sep" />

      {/* Fit view */}
      <button className="ctb-btn" onClick={handleFit} title="Fit to screen">
        <IconFit />
        <span className="ctb-label">Fit View</span>
      </button>

      <div className="ctb-sep" />

      {/* PNG export */}
      <button
        id="ct-export-png"
        className="ctb-btn ctb-btn--png"
        onClick={onExportPNG}
        disabled={isExporting}
        title="Download PNG"
      >
        {isExporting ? <IconSpinner /> : <IconPNG />}
        <span className="ctb-label">PNG</span>
      </button>

      {/* PDF export */}
      <button
        id="ct-export-pdf"
        className="ctb-btn ctb-btn--pdf"
        onClick={onExportPDF}
        disabled={isExporting}
        title="Download PDF"
      >
        {isExporting ? <IconSpinner /> : <IconPDF />}
        <span className="ctb-label">PDF</span>
      </button>

    </div>
  );
}
