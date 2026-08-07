'use client';
import { memo, useState, useRef, useEffect } from 'react';
import { NodeResizer } from '@xyflow/react';

const REGION_COLORS = [
  'rgba(71,140,202,0.08)', 'rgba(37,99,235,0.08)', 'rgba(5,150,105,0.08)',
  'rgba(217,119,6,0.08)', 'rgba(220,38,38,0.08)', 'rgba(124,58,237,0.08)',
  'rgba(100,116,139,0.08)', 'rgba(0,0,0,0.04)'
];

function RegionNode({ data, selected, id }) {
  const {
    label = 'Region',
    fillColor = 'rgba(71,140,202,0.08)',
    borderColor = '#478cca',
    textColor = '#478cca',
    width = 400,
    height = 300,
  } = data;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(label);
  const inputRef = useRef(null);

  useEffect(() => { setText(label); }, [label]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    data.onUpdate?.(id, { label: text });
  };

  return (
    <div
      className={`region-node ${selected ? 'selected' : ''}`}
      style={{
        width, height,
        backgroundColor: fillColor,
        borderColor: borderColor,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        onResize={(e, params) => {
          data.onUpdate?.(id, { width: params.width, height: params.height });
        }}
      />
      
      <div className="region-header" style={{ color: textColor }}>
        {editing ? (
          <input
            ref={inputRef}
            className="region-label-input"
            style={{ color: textColor }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
        ) : (
          <span className="region-label">{text}</span>
        )}
      </div>

      {selected && (
        <div className="region-color-picker" onClick={(e) => e.stopPropagation()}>
          {REGION_COLORS.map((bg, i) => {
            // simple trick: extract rgb to make matching border
            const colorMatch = bg.match(/rgba\((\d+),(\d+),(\d+)/);
            const border = colorMatch ? `rgb(${colorMatch[1]},${colorMatch[2]},${colorMatch[3]})` : borderColor;
            return (
              <button
                key={i}
                className={`color-swatch ${fillColor === bg ? 'active' : ''}`}
                style={{ background: bg, borderColor: border }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  data.onUpdate?.(id, { fillColor: bg, borderColor: border, textColor: border });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(RegionNode);
