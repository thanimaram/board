'use client';
import { useState } from 'react';

const SHAPES = ['rect', 'rounded', 'circle', 'diamond', 'parallelogram', 'database'];
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

export default function CustomNodeModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [headerLabel, setHeaderLabel] = useState('');
  const [shape, setShape] = useState('rect');
  const [colorIdx, setColorIdx] = useState(0);
  const [attributes, setAttributes] = useState([]); // Array of strings (keys)
  const [newAttr, setNewAttr] = useState('');

  const handleAddAttr = () => {
    if (newAttr.trim() && !attributes.includes(newAttr.trim())) {
      setAttributes([...attributes, newAttr.trim()]);
      setNewAttr('');
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      label: name.trim(),
      headerLabel: headerLabel.trim() || name.trim(),
      shape,
      color: COLOR_PRESETS[colorIdx],
      attributes,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onPointerDown={onClose}>
      <div className="modal-content" onPointerDown={(e) => e.stopPropagation()}>
        <h2>Create Custom Node</h2>
        
        <div className="modal-form-group">
          <label>Header Label</label>
          <input 
            type="text" 
            value={headerLabel} 
            onChange={(e) => setHeaderLabel(e.target.value)} 
            placeholder="e.g. DB Server" 
            autoFocus
          />
        </div>

        <div className="modal-form-group">
          <label>Node Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Database Server" 
          />
        </div>

        <div className="modal-form-group">
          <label>Base Shape</label>
          <div className="modal-shape-grid">
            {SHAPES.map((s) => (
              <button 
                key={s} 
                className={`shape-select-btn ${shape === s ? 'active' : ''}`}
                onClick={() => setShape(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-form-group">
          <label>Theme Color</label>
          <div className="modal-color-grid">
            {COLOR_PRESETS.map((p, i) => (
              <button
                key={i}
                className={`color-swatch ${colorIdx === i ? 'active' : ''}`}
                style={{ background: p.fill === '#1e1b4b' ? p.fill : p.border, borderColor: p.border }}
                onClick={() => setColorIdx(i)}
              />
            ))}
          </div>
        </div>

        <div className="modal-form-group">
          <label>Attributes</label>
          <div className="attr-add-row">
            <input 
              type="text" 
              value={newAttr} 
              onChange={(e) => setNewAttr(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddAttr()}
              placeholder="e.g. IP Address" 
            />
            <button type="button" className="btn-secondary" onClick={handleAddAttr}>Add</button>
          </div>
          <div className="attr-list">
            {attributes.map((attr) => (
              <div key={attr} className="attr-pill">
                {attr}
                <button onClick={() => setAttributes(attributes.filter(a => a !== attr))}>&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim()}>Save Node</button>
        </div>
      </div>
    </div>
  );
}
