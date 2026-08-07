'use client';
import { memo, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

const LINE_COLORS = [
  '#478cca', '#ef4444', '#10b981', '#f59e0b',
  '#06b6d4', '#1a1a2e', '#7c3aed', '#ec4899',
];

function LineNode({ data, selected, id }) {
  const { dx = 100, dy = 0, style = 'solid', color = '#478cca', strokeWidth = 2 } = data;
  const { getZoom } = useReactFlow();
  const dragState = useRef(null);

  const pad = 12;
  const w = Math.max(Math.abs(dx) + pad * 2, 24);
  const h = Math.max(Math.abs(dy) + pad * 2, 24);

  // SVG coordinates (start point is always at the "min" corner)
  const sx = pad + Math.max(0, -dx);
  const sy = pad + Math.max(0, -dy);
  const ex = pad + Math.max(0, dx);
  const ey = pad + Math.max(0, dy);

  // Drag the end-point: only dx/dy change, node position (start) stays fixed
  const handleEndpointDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const zoom = getZoom();
    const origDx = dx;
    const origDy = dy;
    const startX = e.clientX;
    const startY = e.clientY;
    dragState.current = true;

    const onMove = (me) => {
      if (!dragState.current) return;
      const newDx = origDx + (me.clientX - startX) / zoom;
      const newDy = origDy + (me.clientY - startY) / zoom;
      data.onUpdate?.(id, { dx: newDx, dy: newDy });
    };
    const onUp = () => {
      dragState.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className={`line-node ${selected ? 'selected' : ''}`} style={{ width: w, height: h }}>
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <marker id={`arrowhead-${color.replace('#', '')}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={color} />
          </marker>
          <marker id={`arrowhead-reverse-${color.replace('#', '')}`} markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto">
            <polygon points="10 0, 0 3.5, 10 7" fill={color} />
          </marker>
        </defs>
        {/* The line */}
        <line
          x1={sx} y1={sy} x2={ex} y2={ey}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={style === 'dotted' ? '8 5' : undefined}
          strokeLinecap="round"
          markerEnd={(style === 'arrow' || style === 'doubleArrow') ? `url(#arrowhead-${color.replace('#', '')})` : undefined}
          markerStart={style === 'doubleArrow' ? `url(#arrowhead-reverse-${color.replace('#', '')})` : undefined}
        />

        {/* Start dot — nodrag prevents React Flow treating it as a node-drag */}
        <circle className="nodrag" cx={sx} cy={sy} r={4} fill="white" stroke={color} strokeWidth={2} />

        {/* End dot — draggable handle to realign; nodrag prevents node-move */}
        <circle
          className="nodrag"
          cx={ex} cy={ey} r={5}
          fill={color} stroke="white" strokeWidth={2}
          style={{ cursor: 'crosshair', pointerEvents: 'all' }}
          onMouseDown={handleEndpointDown}
        />
      </svg>

      {/* Controls panel — shown when selected */}
      {selected && (
        <div className="line-controls" onPointerDown={(e) => e.stopPropagation()}>
          <div className="line-colors">
            {LINE_COLORS.map((c) => (
              <button
                key={c}
                className={`color-dot ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); data.onUpdate?.(id, { color: c }); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LineNode);
