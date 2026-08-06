'use client';
import { useState } from 'react';

const BASIC_TOOLS = [
  { id: 'select',     icon: '↖', label: 'Select',      shortcut: 'S' },
  { id: 'text',       icon: 'T',  label: 'Add Text',    shortcut: 'X' },
  { id: 'sticky',     icon: '✦', label: 'Note',         shortcut: 'N' },
];

const NODES = [
  { id: 'rect',         icon: '⇒', label: 'Source',       shortcut: 'R' },
  { id: 'rounded',      icon: '↻', label: 'Transform',    shortcut: null },
  { id: 'circle',       icon: '⊘', label: 'Filter',       shortcut: 'O' },
  { id: 'diamond',      icon: '⊕', label: 'Router',       shortcut: null },
  { id: 'parallelogram',icon: '≋', label: 'Stream',       shortcut: null },
  { id: 'database',     icon: '⊟', label: 'Store',        shortcut: null },
];

const SHAPES = [
  { id: 'line',         icon: '╱', label: 'Line',         shortcut: 'L' },
  { id: 'dottedLine',   icon: '╌', label: 'Dotted Line',  shortcut: 'D' },
  { id: 'rect',         icon: '▭', label: 'Rectangle',    shortcut: null },
  { id: 'circle',       icon: '◯', label: 'Circle',       shortcut: null },
  { id: 'diamond',      icon: '◇', label: 'Diamond',      shortcut: null },
  { id: 'parallelogram',icon: '▱', label: 'Parallelogram', shortcut: null },
  { id: 'region',       icon: '⬚', label: 'Zone Region',  shortcut: null },
];

import CustomNodeModal from './CustomNodeModal';

export default function Toolbar({ activeTool, setActiveTool, onClear, customTemplates = [], onAddCustomTemplate }) {
  const [showModal, setShowModal] = useState(false);
  const [collapsed, setCollapsed] = useState({ tools: false, nodes: false, shapes: false });

  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-title">Water Mapping System</span>
      </div>

      {/* ── Basic Tools ──────────────────────────────── */}
      <div 
        className="toolbar-section-label" 
        onClick={() => toggleSection('tools')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{collapsed.tools ? '▶' : '▼'}</span>
        Tools
      </div>
      {!collapsed.tools && (
        <nav className="toolbar-tools">
          {BASIC_TOOLS.map((t) => (
            <button
              key={t.id}
              className={`tool-btn ${
                (activeTool === t.id || activeTool === `node-${t.id}`) ? 'active' : ''
              }`}
              onClick={() => {
                if (t.id === 'sticky') {
                  setActiveTool(`node-sticky`);
                } else {
                  setActiveTool(t.id);
                }
              }}
              title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
              aria-label={t.label}
            >
              <span className="tool-label">{t.label}</span>
              {t.shortcut && <span className="tool-shortcut">{t.shortcut}</span>}
            </button>
          ))}
        </nav>
      )}

      <div className="toolbar-divider" />

      {/* ── Nodes ───────────────────────────────────── */}
      <div 
        className="toolbar-section-label"
        onClick={() => toggleSection('nodes')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{collapsed.nodes ? '▶' : '▼'}</span>
        Nodes
      </div>
      {!collapsed.nodes && (
        <nav className="toolbar-tools">
          {NODES.map((n) => (
            <button
              key={n.id}
              className={`tool-btn ${activeTool === `node-${n.id}` ? 'active' : ''}`}
              onClick={() => setActiveTool(`node-${n.id}`)}
              title={n.label}
              aria-label={n.label}
            >
              <span className="tool-label">{n.label}</span>
              {n.shortcut && <span className="tool-shortcut">{n.shortcut}</span>}
            </button>
          ))}
          {customTemplates.map((c) => (
            <button
              key={c.id}
              className={`tool-btn ${activeTool === c.id ? 'active' : ''}`}
              onClick={() => setActiveTool(c.id)}
              title={c.label}
            >
              <span className="tool-label">{c.label}</span>
            </button>
          ))}
          <button 
            className="tool-btn" 
            onClick={() => setShowModal(true)} 
            style={{ color: 'var(--accent-violet)', fontWeight: 600, border: '1px dashed var(--accent-violet)', marginTop: '4px' }}
          >
            <span className="tool-label">+ Create Custom</span>
          </button>
        </nav>
      )}

      <div className="toolbar-divider" />

      {/* ── Shapes (Background) ──────────────────────── */}
      <div 
        className="toolbar-section-label"
        onClick={() => toggleSection('shapes')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{collapsed.shapes ? '▶' : '▼'}</span>
        Shapes (Background)
      </div>
      {!collapsed.shapes && (
        <nav className="toolbar-tools">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              className={`tool-btn ${
                (activeTool === s.id || activeTool === `bgshape-${s.id}`) ? 'active' : ''
              }`}
              onClick={() => {
                if (s.id === 'line' || s.id === 'dottedLine') {
                  setActiveTool(s.id);
                } else {
                  setActiveTool(`bgshape-${s.id}`);
                }
              }}
              title={s.label}
              aria-label={s.label}
            >
              <span className="tool-label">{s.label}</span>
              {s.shortcut && <span className="tool-shortcut">{s.shortcut}</span>}
            </button>
          ))}
        </nav>
      )}

      <div className="toolbar-divider" />

      {/* ── Footer ───────────────────────────────────── */}
      <div className="toolbar-footer">
        <button className="tool-btn danger" onClick={onClear} aria-label="Clear board">
          <span className="tool-label">Clear Board</span>
        </button>
        <div className="toolbar-hint">
          <p>Del — remove selected</p>
          <p>Scroll — zoom</p>
          <p>Drag handle — connect</p>
          <p>Dbl-click — edit label</p>
        </div>
      </div>

      {showModal && (
        <CustomNodeModal 
          onClose={() => setShowModal(false)}
          onSave={onAddCustomTemplate}
        />
      )}
    </aside>
  );
}
