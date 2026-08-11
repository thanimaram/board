'use client';
import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

// Semantic metadata per shape type
const SHAPE_META = {
  rect:          { icon: '⇒', typeName: 'Source'   },
  rounded:       { icon: '↻', typeName: 'Transform' },
  circle:        { icon: '⊘', typeName: 'Filter'   },
  diamond:       { icon: '⊕', typeName: 'Router'   },
  parallelogram: { icon: '≋', typeName: 'Stream'   },
  database:      { icon: '⊟', typeName: 'Store'    },
  sticky:        { icon: '✦', typeName: 'Note'     },
};

const COLOR_PRESETS = [
  { fill: '#ffffff', border: '#478cca', text: '#1a1a2e' },
  { fill: '#ffffff', border: '#2563eb', text: '#1e3a8a' },
  { fill: '#ffffff', border: '#059669', text: '#14532d' },
  { fill: '#ffffff', border: '#d97706', text: '#78350f' },
  { fill: '#ffffff', border: '#dc2626', text: '#7f1d1d' },
  { fill: '#ffffff', border: '#7c3aed', text: '#3b0764' },
  { fill: '#1e1b4b', border: '#818cf8', text: '#e0e7ff' },
  { fill: '#ffffff', border: '#64748b', text: '#374151' },
];

function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(71,140,202,${alpha})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
}

function ShapeNode({ data, selected, id }) {
  const {
    shape = 'rect',
    label = 'Node',
    fillColor = '#ffffff',
    borderColor = '#478cca',
    textColor = '#1a1a2e',
    collapsed = false,
    nonEditable = false,
  } = data;

  const meta = SHAPE_META[shape] || { icon: '◎', typeName: shape };
  const headerBg     = hexToRgba(borderColor, 0.07);
  const headerBorder = hexToRgba(borderColor, 0.18);
  const isSticky     = shape === 'sticky';

  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(label);
  const inputRef              = useRef(null);

  useEffect(() => { setText(label); }, [label]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => { setEditing(false); data.onLabelChange?.(id, text); };

  return (
    <div
      className={`shape-node shape-${shape} ${selected ? 'selected' : ''}`}
      style={{ '--node-fill': fillColor, '--node-border': borderColor, '--node-text': textColor }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => { if (nonEditable) return; e.stopPropagation(); setEditing(true); }}
    >
      {/* ── Visual background — clip-path only on this element ── */}
      <div className={`shape-bg shape-bg-${shape}`} />

      {/* ── React Flow connection handles ── */}
      <Handle type="target" position={Position.Top}    id="t" className="rf-handle" />
      <Handle type="target" position={Position.Left}   id="l" className="rf-handle" />
      <Handle type="source" position={Position.Bottom} id="b" className="rf-handle" />
      <Handle type="source" position={Position.Right}  id="r" className="rf-handle" />

      {/* ── Premium card content ── */}
      <div className="shape-card">
        {!isSticky && (
          <div
            className="shape-header"
            style={{ 
              background: headerBg, 
              borderBottom: collapsed ? 'none' : `1px solid ${headerBorder}`,
              borderRadius: collapsed ? 'calc(var(--r-md) - 2px)' : 'calc(var(--r-md) - 2px) calc(var(--r-md) - 2px) 0 0',
              cursor: 'pointer',
              justifyContent: 'center'
            }}
            onPointerDown={(e) => { e.stopPropagation(); data.onUpdate?.(id, { collapsed: !collapsed }); }}
          >
            <span className="shape-type-name" style={{ color: borderColor }}>
              {data.headerLabel || meta.typeName}
            </span>
          </div>
        )}

        {(!collapsed || isSticky) && (
          <div className={`shape-body${isSticky ? ' sticky-body' : ''}`}>
            {editing && !nonEditable ? (
              <input
                ref={inputRef}
                className="shape-label-input"
                style={{ color: textColor }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && commit()}
              />
            ) : (
              <span className="shape-label" style={{ color: textColor }}>
                {text || (isSticky ? 'Add a note…' : '')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Attributes Editor (shown when selected and has attributes) ── */}
      {selected && data.attributes && data.attributes.length > 0 && (
        <div
          className="node-attributes-panel"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <div className="attr-panel-title">Attributes</div>
          {data.attributes.map((attr, i) => (
            <div key={attr.key} className="attr-field">
              <label className="attr-label">{attr.key}</label>
              <input
                className="attr-input"
                value={attr.value}
                placeholder="Value..."
                onChange={(e) => {
                  const newAttrs = [...data.attributes];
                  newAttrs[i] = { ...newAttrs[i], value: e.target.value };
                  data.onUpdate?.(id, { attributes: newAttrs });
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ShapeNode);
