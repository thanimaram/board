'use client';
import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

function DashedEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected,
  markerEnd,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeDasharray: '8 4',
          stroke: selected ? '#818cf8' : '#478cca',
          strokeWidth: selected ? 3 : 2,
        }}
      />
    </>
  );
}

export default memo(DashedEdge);
