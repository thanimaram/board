'use client';
import { useState } from 'react';

const LINE_COLORS = [
  '#478cca', '#ef4444', '#10b981', '#f59e0b',
  '#06b6d4', '#1a1a2e', '#7c3aed', '#ec4899',
];

export default function EdgeConfigModal({ onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#478cca');
  const [animated, setAnimated] = useState(false);

  const handleSave = () => {
    onSave({ label: label.trim(), color, animated });
  };

  return (
    <div className="modal-overlay" onPointerDown={onClose}>
      <div className="modal-content edge-config-modal" onPointerDown={(e) => e.stopPropagation()}>
        <h2>Connection Settings</h2>
        
        <div className="modal-form-group">
          <label>Connection Label</label>
          <input 
            type="text" 
            value={label} 
            onChange={(e) => setLabel(e.target.value)} 
            placeholder="e.g. Fetches Data, API Request..." 
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="modal-form-group">
          <label>Line Color</label>
          <div className="modal-color-grid">
            {LINE_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${color === c ? 'active' : ''}`}
                style={{ background: c, borderColor: c }}
                onClick={() => setColor(c)}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="modal-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <input 
            type="checkbox" 
            id="edge-animated-cb"
            checked={animated} 
            onChange={(e) => setAnimated(e.target.checked)} 
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="edge-animated-cb" style={{ cursor: 'pointer', margin: 0, fontSize: '14px' }}>
            Animated (Flowing Data)
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="button" onClick={handleSave}>Create Connection</button>
        </div>
      </div>
    </div>
  );
}
