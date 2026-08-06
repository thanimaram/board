'use client';
import { useState, useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

export function useDrawingTool({ activeTool, addLineNode, addBgShapeNode }) {
  const { screenToFlowPosition } = useReactFlow();
  // preview stores SCREEN pixel coords for the fixed SVG overlay
  const [preview, setPreview] = useState(null);
  const isLineDrawing = activeTool === 'line' || activeTool === 'dottedLine';
  const isShapeDrawing = activeTool.startsWith('bgshape-');
  const isDrawing = isLineDrawing || isShapeDrawing;

  const onMouseDown = useCallback(
    (e) => {
      if (!isDrawing || e.button !== 0) return;

      // Capture flow position at start
      const flowStart = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setPreview({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY });

      const handleMove = (me) => {
        setPreview((p) => p ? { ...p, x2: me.clientX, y2: me.clientY } : null);
      };

      const handleUp = (me) => {
        const flowEnd = screenToFlowPosition({ x: me.clientX, y: me.clientY });
        const dist = Math.hypot(flowEnd.x - flowStart.x, flowEnd.y - flowStart.y);
        
        if (dist > 5) {
          if (isLineDrawing) {
            addLineNode(flowStart.x, flowStart.y, flowEnd.x, flowEnd.y,
              activeTool === 'dottedLine' ? 'dotted' : 'solid');
          } else if (isShapeDrawing) {
            const shape = activeTool.replace('bgshape-', '');
            // Calculate top-left pos and width/height from the drag points
            const minX = Math.min(flowStart.x, flowEnd.x);
            const minY = Math.min(flowStart.y, flowEnd.y);
            const width = Math.abs(flowEnd.x - flowStart.x);
            const height = Math.abs(flowEnd.y - flowStart.y);
            addBgShapeNode(shape, { x: minX, y: minY }, width, height);
          }
        }
        
        setPreview(null);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [isDrawing, isLineDrawing, isShapeDrawing, activeTool, addLineNode, addBgShapeNode, screenToFlowPosition]
  );

  return { preview, onMouseDown, isShapeDrawing };
}
