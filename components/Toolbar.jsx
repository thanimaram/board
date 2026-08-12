'use client';
import { useState, useRef } from 'react';
import CustomNodeModal from './CustomNodeModal';

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
  { id: 'rect',          icon: '⇒', label: 'Source'       },
  { id: 'rounded',       icon: '↻', label: 'Transform'    },
  { id: 'circle',        icon: '⊘', label: 'Filter'       },
  { id: 'diamond',       icon: '⊕', label: 'Router'       },
  { id: 'parallelogram', icon: '≋', label: 'Stream'       },
  { id: 'database',      icon: '⊟', label: 'Store'        },
];

const SHAPES = [
  { id: 'line',       icon: '╱', label: 'Line'        },
  { id: 'dottedLine', icon: '╌', label: 'Dotted Line' },
  { id: 'rect',       icon: '▭', label: 'Container'   },
];

// ── Desktop drag ──────────────────────────────────────────────────────────────
const handleDragStart = (e, type, payload) => {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('application/reactflow-type', type);
  e.dataTransfer.setData('application/reactflow-payload', JSON.stringify(payload));
};

// ── Touch drag — works on iOS / Android ──────────────────────────────────────
/**
 * Starts a touch-drag for a sidebar item.
 * Creates a floating ghost element that follows the finger.
 * On release over the canvas, calls onTouchDrop(type, payload, clientX, clientY).
 */
function startTouchDrag(e, type, payload, label, onTouchDrop, onSidebarClose) {
  e.preventDefault(); // block page scroll while dragging

  const touch = e.touches[0];
  const touchId = touch.identifier;

  // Ghost label following the finger
  const ghost = document.createElement('div');
  ghost.className = 'touch-drag-ghost';
  ghost.textContent = label;
  ghost.style.left = (touch.clientX - 50) + 'px';
  ghost.style.top  = (touch.clientY - 20) + 'px';
  document.body.appendChild(ghost);

  // Track which elements are under the finger so we can highlight the canvas
  let overCanvas = false;

  const onMove = (ev) => {
    ev.preventDefault();
    const t = Array.from(ev.touches).find(t => t.identifier === touchId);
    if (!t) return;
    ghost.style.left = (t.clientX - 50) + 'px';
    ghost.style.top  = (t.clientY - 20) + 'px';

    // Highlight canvas drop zone
    const el = document.querySelector('.board-canvas');
    if (el) {
      const r = el.getBoundingClientRect();
      overCanvas = (t.clientX >= r.left && t.clientX <= r.right &&
                    t.clientY >= r.top  && t.clientY <= r.bottom);
      el.classList.toggle('drag-over', overCanvas);
    }
  };

  const onEnd = (ev) => {
    document.removeEventListener('touchmove', onMove, { passive: false });
    document.removeEventListener('touchend',  onEnd);
    ghost.remove();

    // Remove canvas highlight
    document.querySelector('.board-canvas')?.classList.remove('drag-over');

    const t = Array.from(ev.changedTouches).find(t => t.identifier === touchId);
    if (!t || !onTouchDrop) return;

    const el = document.querySelector('.board-canvas');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const inside = (t.clientX >= r.left && t.clientX <= r.right &&
                    t.clientY >= r.top  && t.clientY <= r.bottom);
    if (inside) {
      onTouchDrop(type, payload, t.clientX, t.clientY);
      onSidebarClose?.(); // close sidebar on mobile after a successful drop
    }
  };

  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend',  onEnd,  { once: false });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Toolbar({
  activeTool, setActiveTool, onClear,
  customTemplates = [], onAddCustomTemplate,
  // Mobile props
  isOpen,          // boolean — sidebar visible on mobile
  onSidebarClose,  // () => void — called to close sidebar
  onTouchDrop,     // (type, payload, x, y) => void
}) {
  const [showModal, setShowModal] = useState(false);
  const [collapsed, setCollapsed] = useState({ equipment: false, nodes: false, shapes: false });
  const [selectedAccount, setSelectedAccount] = useState('');

  const toggleSection = (section) =>
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));

  const activeAccount = ACCOUNTS.find(a => a.number === selectedAccount);

  // Helper: attach both desktop and touch drag to a draggable item
  const dragProps = (type, payload, label) => ({
    draggable: true,
    onDragStart: (e) => handleDragStart(e, type, payload),
    onTouchStart: (e) => startTouchDrag(e, type, payload, label, onTouchDrop, onSidebarClose),
  });

  return (
    <aside className={`toolbar${isOpen ? ' sidebar-open' : ''}`}>
      {/* Close button visible on mobile */}
      <div className="toolbar-brand">
        <span className="toolbar-title">Water Mapping System</span>
        <button
          className="sidebar-close-btn"
          onClick={onSidebarClose}
          aria-label="Close sidebar"
        >✕</button>
      </div>

      {/* ── Equipment List ────────────────────────────────── */}
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
                  title={`${item.serial} — drag to board`}
                  {...dragProps('equipment', { serial: item.serial, name: item.name }, item.serial)}
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

      {/* ── Nodes ─────────────────────────────────────────── */}
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
              title={`${n.label} — drag to board`}
              aria-label={n.label}
              {...dragProps('node', { shape: n.id }, n.label)}
            >
              <span className="tool-label">{n.label}</span>
              <span className="drag-hint">drag</span>
            </div>
          ))}
          {customTemplates.map((c) => (
            <div
              key={c.id}
              className="tool-btn draggable-item"
              title={`${c.label} — drag to board`}
              {...dragProps('custom', { templateId: c.id }, c.label)}
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

      {/* ── Utils ─────────────────────────────────────────── */}
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
            onClick={() => { setActiveTool('select'); onSidebarClose?.(); }}
            title="Select (S)" aria-label="Select"
          >
            <span className="tool-icon">↖</span>
            <span className="tool-label">Select</span>
          </button>
          {/* Text */}
          <button
            className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => { setActiveTool('text'); onSidebarClose?.(); }}
            title="Add Text (X)" aria-label="Add Text"
          >
            <span className="tool-icon">T</span>
            <span className="tool-label">Add Text</span>
          </button>
          {/* Note — draggable */}
          <div
            className="tool-btn draggable-item"
            title="Note — drag to board"
            aria-label="Note"
            {...dragProps('node', { shape: 'sticky' }, 'Note')}
          >
            <span className="tool-icon">+</span>
            <span className="tool-label">Note</span>
            <span className="drag-hint">drag</span>
          </div>
          {/* Line / Dotted Line / Container */}
          {SHAPES.map((s) => (
            s.id === 'line' || s.id === 'dottedLine' || s.id === 'rect' ? (
              <button
                key={s.id}
                className={`tool-btn ${activeTool === s.id || activeTool === `bgshape-${s.id}` ? 'active' : ''}`}
                onClick={() => {
                  setActiveTool(s.id === 'rect' ? 'bgshape-rect' : s.id);
                  onSidebarClose?.();
                }}
                title={s.label} aria-label={s.label}
              >
                <span className="tool-icon">{s.icon}</span>
                <span className="tool-label">{s.label}</span>
              </button>
            ) : (
              <div
                key={s.id}
                className="tool-btn draggable-item"
                title={`${s.label} — drag to board`}
                aria-label={s.label}
                {...dragProps('bgshape', { shape: s.id }, s.label)}
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

      {/* ── Footer ────────────────────────────────────────── */}
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
