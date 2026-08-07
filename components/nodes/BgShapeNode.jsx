'use client';
import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';

const REGION_COLORS = [
  'rgba(71,140,202,0.08)', 'rgba(37,99,235,0.08)', 'rgba(5,150,105,0.08)',
  'rgba(217,119,6,0.08)', 'rgba(220,38,38,0.08)', 'rgba(124,58,237,0.08)',
  'rgba(100,116,139,0.08)', 'rgba(0,0,0,0.04)'
];

function BgShapeNode({ data, selected, id }) {
  const {
    shape = 'rect',
    fillColor = 'rgba(71,140,202,0.08)',
    borderColor = '#478cca',
    width = 200,
    height = 150,
  } = data;

  return (
    <div
      className={`bg-shape-node bg-shape-${shape} ${selected ? 'selected' : ''}`}
      style={{
        width, height,
        backgroundColor: shape === 'rect' || shape === 'circle' ? fillColor : 'transparent',
        borderColor: shape === 'rect' || shape === 'circle' ? borderColor : 'transparent',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        onResize={(e, params) => {
          data.onUpdate?.(id, { width: params.width, height: params.height });
        }}
      />
      
      {/* Visual background for clip-path shapes */}
      {(shape === 'diamond' || shape === 'parallelogram') && (
        <div
          className={`bg-shape-inner bg-shape-inner-${shape}`}
          style={{ backgroundColor: fillColor, border: `2px solid ${borderColor}` }}
        />
      )}

      {selected && (
        <div className="region-color-picker" onClick={(e) => e.stopPropagation()}>
          {REGION_COLORS.map((bg, i) => {
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

export default memo(BgShapeNode);
