'use client';
import { useState } from 'react';

// ── Static account → equipment data ──────────────────────────────────────────
const ACCOUNTS = [
  {
    number: 'ACC-1001',
    equipment: [
      { id: 'a1e1', serial: 'EQ-1', name: 'Main Pump' },
      { id: 'a1e2', serial: 'EQ-2', name: 'Pressure Valve' },
      { id: 'a1e3', serial: 'EQ-3', name: 'Flow Meter' },
      { id: 'a1e4', serial: 'EQ-4', name: 'Control Panel' },
    ],
  },
  {
    number: 'ACC-1002',
    equipment: [
      { id: 'a2e1', serial: 'EQ-1', name: 'Booster Pump' },
      { id: 'a2e2', serial: 'EQ-2', name: 'Sand Filter' },
      { id: 'a2e3', serial: 'EQ-3', name: 'Level Sensor' },
      { id: 'a2e4', serial: 'EQ-4', name: 'UV Disinfector' },
    ],
  },
  {
    number: 'ACC-1003',
    equipment: [
      { id: 'a3e1', serial: 'EQ-1', name: 'Distribution Valve' },
      { id: 'a3e2', serial: 'EQ-2', name: 'Pressure Gauge' },
      { id: 'a3e3', serial: 'EQ-3', name: 'Water Meter' },
      { id: 'a3e4', serial: 'EQ-4', name: 'SCADA Terminal' },
    ],
  },
  {
    number: 'ACC-1004',
    equipment: [
      { id: 'a4e1', serial: 'EQ-1', name: 'Submersible Pump' },
      { id: 'a4e2', serial: 'EQ-2', name: 'Float Switch' },
      { id: 'a4e3', serial: 'EQ-3', name: 'Chlorine Dosing Unit' },
    ],
  },
];

const NODES = [
  { id: 'rect',          icon: '⇒', label: 'Source',       shortcut: 'R' },
  { id: 'rounded',       icon: '↻', label: 'Transform',    shortcut: null },
  { id: 'circle',        icon: '⊘', label: 'Filter',       shortcut: 'O' },
  { id: 'diamond',       icon: '⊕', label: 'Router',       shortcut: null },
  { id: 'parallelogram', icon: '≋', label: 'Stream',       shortcut: null },
  { id: 'database',      icon: '⊟', label: 'Store',        shortcut: null },
];

const SHAPES = [
  { id: 'line',       icon: '╱', label: 'Line',        shortcut: 'L' },
  { id: 'dottedLine', icon: '╌', label: 'Dotted Line', shortcut: 'D' },
  { id: 'rect',       icon: '▭', label: 'Container',   shortcut: null },
];

import CustomNodeModal from './CustomNodeModal';

const handleDragStart = (e, type, payload) => {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('application/reactflow-type', type);
  e.dataTransfer.setData('application/reactflow-payload', JSON.stringify(payload));
};

export default function Toolbar({ activeTool, setActiveTool, onClear, customTemplates = [], onAddCustomTemplate }) {
  const [showModal, setShowModal] = useState(false);
  const [collapsed, setCollapsed] = useState({ equipment: false, nodes: false, shapes: false });
  const [selectedAccount, setSelectedAccount] = useState('');

  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeAccount = ACCOUNTS.find(a => a.number === selectedAccount);

  return (
    <aside className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-title">Water Mapping System</span>
      </div>

      {/* ── Equipment List ──────────────────────────────── */}
      <div
        className="toolbar-section-label"
        onClick={() => toggleSection('equipment')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{collapsed.equipment ? '▶' : '▼'}</span>
        Equipment List
      </div>
      {!collapsed.equipment && (
        <div className="equipment-section">
          <select
            className="account-select"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">— Select Account —</option>
            {ACCOUNTS.map(a => (
              <option key={a.number} value={a.number}>{a.number}</option>
            ))}
          </select>

          {!selectedAccount && (
            <p className="equipment-empty">Select an account to view equipment.</p>
          )}
          {activeAccount && (
            <ul className="equipment-list">
              {activeAccount.equipment.map((item) => (
                <li
                  key={item.id}
                  className="equipment-item draggable-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'equipment', { serial: item.serial, name: item.name })}
                  title={`${item.serial} — drag to board`}
                >
                  <span className="equip-serial" style={{ flex: 1, textAlign: 'center' }}>{item.serial}</span>
                  <span className="drag-hint">drag</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
            <div
              key={n.id}
              className="tool-btn draggable-item"
              draggable
              onDragStart={(e) => handleDragStart(e, 'node', { shape: n.id })}
              title={`${n.label} — drag to board`}
              aria-label={n.label}
            >
              <span className="tool-label">{n.label}</span>
              <span className="drag-hint">drag</span>
            </div>
          ))}
          {customTemplates.map((c) => (
            <div
              key={c.id}
              className="tool-btn draggable-item"
              draggable
              onDragStart={(e) => handleDragStart(e, 'custom', { templateId: c.id })}
              title={`${c.label} — drag to board`}
            >
              <span className="tool-label">{c.label}</span>
              <span className="drag-hint">drag</span>
            </div>
          ))}
          <button
            className="tool-btn"
            onClick={() => setShowModal(true)}
            style={{ color: 'var(--accent-primary)', fontWeight: 600, border: '1px dashed var(--accent-primary)', marginTop: '4px' }}
          >
            <span className="tool-label">+ Create Custom</span>
          </button>
        </nav>
      )}

      <div className="toolbar-divider" />

      {/* ── Utils ──────────────────────────────────────── */}
      <div
        className="toolbar-section-label"
        onClick={() => toggleSection('shapes')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{collapsed.shapes ? '▶' : '▼'}</span>
        Utils
      </div>
      {!collapsed.shapes && (
        <nav className="toolbar-tools">
          {/* Select */}
          <button
            className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
            title="Select (S)"
            aria-label="Select"
          >
            <span className="tool-icon">↖</span>
            <span className="tool-label">Select</span>
            <span className="tool-shortcut">S</span>
          </button>
          {/* Text */}
          <button
            className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTool('text')}
            title="Add Text (X)"
            aria-label="Add Text"
          >
            <span className="tool-icon">T</span>
            <span className="tool-label">Add Text</span>
            <span className="tool-shortcut">X</span>
          </button>
          {/* Note — draggable */}
          <div
            className="tool-btn draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, 'node', { shape: 'sticky' })}
            title="Note — drag to board"
            aria-label="Note"
          >
            <span className="tool-icon">✦</span>
            <span className="tool-label">Note</span>
            <span className="drag-hint">drag</span>
          </div>
          {/* Line & Dotted Line + background shapes */}
          {SHAPES.map((s) => (
            s.id === 'line' || s.id === 'dottedLine' || s.id === 'rect' ? (
              <button
                key={s.id}
                className={`tool-btn ${activeTool === s.id || activeTool === `bgshape-${s.id}` ? 'active' : ''}`}
                onClick={() => {
                  if (s.id === 'rect') {
                    setActiveTool('bgshape-rect');
                  } else {
                    setActiveTool(s.id);
                  }
                }}
                title={s.label}
                aria-label={s.label}
              >
                <span className="tool-icon">{s.icon}</span>
                <span className="tool-label">{s.label}</span>
                {s.shortcut && <span className="tool-shortcut">{s.shortcut}</span>}
              </button>
            ) : (
              <div
                key={s.id}
                className="tool-btn draggable-item"
                draggable
                onDragStart={(e) => handleDragStart(e, 'bgshape', { shape: s.id })}
                title={`${s.label} — drag to board`}
                aria-label={s.label}
              >
                <span className="tool-icon">{s.icon}</span>
                <span className="tool-label">{s.label}</span>
                <span className="drag-hint">drag</span>
              </div>
            )
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
