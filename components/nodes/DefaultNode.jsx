'use client';
import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

// Legacy default node — kept for boards saved before v2
function DefaultNode({ data, selected }) {
  const [label, setLabel] = useState(data.label ?? 'Node');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  return (
    <div className={`default-node ${selected ? 'selected' : ''}`} onDoubleClick={() => setEditing(true)}>
      <Handle type="target" position={Position.Top} className="rf-handle" />
      <Handle type="target" position={Position.Left} className="rf-handle" />
      {editing ? (
        <input
          ref={inputRef}
          className="node-label-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => { setEditing(false); data.label = label; }}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
        />
      ) : (
        <span className="node-label">{label}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="rf-handle" />
      <Handle type="source" position={Position.Right} className="rf-handle" />
    </div>
  );
}

export default memo(DefaultNode);
