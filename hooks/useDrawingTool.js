'use client';
import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export function useDrawingTool({ activeTool, addLineNode, addBgShapeNode, setActiveTool }) {
  const { screenToFlowPosition } = useReactFlow();
  const [preview, setPreview] = useState(null);
  const isLineDrawing = activeTool === 'line' || activeTool === 'dottedLine' || activeTool === 'arrow' || activeTool === 'doubleArrow';
  const isShapeDrawing = activeTool.startsWith('bgshape-');
  const isDrawing = isLineDrawing || isShapeDrawing;

  const onMouseDown = useCallback(
    (e) => {
      if (!isDrawing || e.button !== 0) return;

      // If drag starts on a node handle — let ReactFlow create a connection, not draw a line
      if (e.target.closest('.react-flow__handle')) {
        if (setActiveTool) setActiveTool('select');
        return;
      }

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
            const style = activeTool === 'dottedLine' ? 'dotted' : 
                          activeTool === 'arrow' ? 'arrow' : 
                          activeTool === 'doubleArrow' ? 'doubleArrow' : 'solid';
            addLineNode(flowStart.x, flowStart.y, flowEnd.x, flowEnd.y, style);
          } else if (isShapeDrawing) {

            const shape = activeTool.replace('bgshape-', '');
            const minX = Math.min(flowStart.x, flowEnd.x);
            const minY = Math.min(flowStart.y, flowEnd.y);
            const width = Math.abs(flowEnd.x - flowStart.x);
            const height = Math.abs(flowEnd.y - flowStart.y);
            addBgShapeNode(shape, { x: minX, y: minY }, width, height);
          }
          // Reset sidebar to Select after drawing finishes
          if (setActiveTool) setActiveTool('select');
        }
        
        setPreview(null);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [isDrawing, isLineDrawing, isShapeDrawing, activeTool, addLineNode, addBgShapeNode, setActiveTool, screenToFlowPosition]
  );

  return { preview, onMouseDown, isShapeDrawing };
}

