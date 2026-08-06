'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useBoard } from '@/hooks/useBoard';
import { useDrawingTool } from '@/hooks/useDrawingTool';
import { clearBoard } from '@/lib/storage';

import Toolbar from '@/components/Toolbar';
import DefaultNode from '@/components/nodes/DefaultNode';
import ShapeNode from '@/components/nodes/ShapeNode';
import TextNode from '@/components/nodes/TextNode';
import LineNode from '@/components/nodes/LineNode';
import RegionNode from '@/components/nodes/RegionNode';
import BgShapeNode from '@/components/nodes/BgShapeNode';
import DashedEdge from '@/components/edges/DashedEdge';
import EdgeConfigModal from '@/components/EdgeConfigModal';

const nodeTypes = {
  defaultNode: DefaultNode,
  shapeNode: ShapeNode,
  textNode: TextNode,
  lineNode: LineNode,
  regionNode: RegionNode,
  bgShapeNode: BgShapeNode,
};

const edgeTypes = {
  dashed: DashedEdge,
};

// ─── Inner (has access to useReactFlow) ───────────────────────────────────
function BoardInner() {
  const {
    nodes, edges, activeTool, setActiveTool, hydrated,
    customTemplates, addCustomTemplate,
    onNodesChange, onEdgesChange, addConfiguredEdge,
    addNodeNode, addBgShapeNode, addTextNode, addLineNode,
    updateNodeData, deleteSelected, setNodes, setEdges,
  } = useBoard();

  const { screenToFlowPosition } = useReactFlow();

  const [pendingConnection, setPendingConnection] = useState(null);

  const handleConnectStart = useCallback((connection) => {
    setPendingConnection(connection);
  }, []);

  const handleEdgeSave = useCallback((config) => {
    if (pendingConnection) {
      addConfiguredEdge(pendingConnection, config);
    }
    setPendingConnection(null);
  }, [pendingConnection, addConfiguredEdge]);

  // ── Inject live callbacks into nodes ───────────────────────────────────
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((n) => {
      if (n.type === 'textNode') {
        return {
          ...n,
          data: {
            ...n.data,
            onChange: (id, updates) => updateNodeData(id, updates),
          },
        };
      }
      if (n.type === 'lineNode') {
        return {
          ...n,
          data: {
            ...n.data,
            onUpdate: (id, updates) => updateNodeData(id, updates),
          },
        };
      }
      if (n.type === 'shapeNode') {
        return {
          ...n,
          data: {
            ...n.data,
            onLabelChange: (id, label) => updateNodeData(id, { label }),
            onColorChange: (id, colors) => updateNodeData(id, colors),
            onUpdate: (id, updates) => updateNodeData(id, updates),
          },
        };
      }
      if (n.type === 'regionNode' || n.type === 'bgShapeNode') {
        return {
          ...n,
          data: {
            ...n.data,
            onUpdate: (id, updates) => updateNodeData(id, updates),
          },
        };
      }
      return n;
    });
  }, [nodes, updateNodeData]);

  // ── Drawing preview ────────────────────────────────────────────────────
  const { preview, onMouseDown, isShapeDrawing } = useDrawingTool({ activeTool, addLineNode, addBgShapeNode });

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const map = {
      s: 'select', x: 'text', l: 'line', d: 'dottedLine',
      r: 'shape-rect', o: 'shape-circle',
    };
    const handle = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (map[e.key.toLowerCase()]) setActiveTool(map[e.key.toLowerCase()]);
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if (e.key === 'Escape') setActiveTool('select');
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [setActiveTool, deleteSelected]);

  // ── Pane click — place node/shape/text ────────────────────────────────
  const handlePaneClick = useCallback(
    (e) => {
      // If we are drawing a line or drag-drawing a shape, handlePaneClick might still fire if it's a short click.
      // We can let it create a default size bgshape if they just click.
      if (activeTool === 'line' || activeTool === 'dottedLine') return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      if (activeTool === 'text') {
        addTextNode(pos);
        // text auto-resets so the user can type in the new node immediately
        setActiveTool('select');
      } else if (activeTool.startsWith('node-')) {
        const shape = activeTool.replace('node-', '');
        addNodeNode(shape, pos);
        // node tool stays active — click again to keep adding the same shape
        // press S or Escape to go back to Select
      } else if (activeTool.startsWith('custom-')) {
        const templateId = activeTool;
        const template = customTemplates.find(c => c.id === templateId);
        if (template) {
          addNodeNode(template.shape, pos, {
            shape: template.shape,
            label: template.label,
            fillColor: template.color.fill,
            borderColor: template.color.border,
            textColor: template.color.text,
            attributes: template.attributes.map(key => ({ key, value: '' })), // initialize empty values
          });
        }
      } else if (activeTool.startsWith('bgshape-')) {
        const shape = activeTool.replace('bgshape-', '');
        addBgShapeNode(shape, pos);
      }
    },
    [activeTool, screenToFlowPosition, addTextNode, addNodeNode, addBgShapeNode, setActiveTool]
  );

  const handleClear = useCallback(() => {
    if (window.confirm('Clear the entire board? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      clearBoard();
    }
  }, [setNodes, setEdges]);

  const isDrawMode = activeTool === 'line' || activeTool === 'dottedLine' || isShapeDrawing;

  const cursorMap = {
    select: 'default',
    text: 'text',
    line: 'crosshair',
    dottedLine: 'crosshair',
  };
  const cursor = (activeTool.startsWith('node-') || activeTool.startsWith('bgshape-')) ? 'crosshair'
    : cursorMap[activeTool] ?? 'default';

  const toolLabel = {
    select: '↖ Select',
    text: 'T Add Text',
    line: '╱ Draw Line',
    dottedLine: '╌ Dotted Line',
  }[activeTool] ?? (
    activeTool.startsWith('node-') ? `⬜ Place Node` : 
    activeTool.startsWith('bgshape-') ? `⬚ Place Shape` : activeTool
  );

  if (!hydrated) {
    return (
      <div className="board-loading">
        <div className="board-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="board-root">
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onClear={handleClear}
        customTemplates={customTemplates}
        onAddCustomTemplate={addCustomTemplate}
      />

      <div
        className="board-canvas"
        style={{ cursor }}
        onMouseDown={onMouseDown}
      >
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnectStart}
          onPaneClick={handlePaneClick}
          nodesDraggable={true}          // always draggable
          nodesConnectable={true}        // always connectable
          elevateNodesOnSelect={false}   // Prevent background shapes from covering nodes when clicked
          panOnDrag={!isDrawMode}
          selectionOnDrag={activeTool === 'select'}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: false }}
        >
          <Background variant="dots" gap={24} size={1.5} color="rgba(0,0,0,0.08)" />
          <Controls className="board-controls" />
          <Panel position="top-right" className="board-panel">
            <span className="tool-badge">{toolLabel}</span>
          </Panel>
        </ReactFlow>

        {/* Drawing preview — fixed overlay in screen space */}
        {preview && (
          <svg
            style={{
              position: 'fixed', inset: 0,
              width: '100vw', height: '100vh',
              pointerEvents: 'none', zIndex: 9999,
            }}
          >
            {isShapeDrawing ? (
              <rect
                x={Math.min(preview.x1, preview.x2)}
                y={Math.min(preview.y1, preview.y2)}
                width={Math.abs(preview.x2 - preview.x1)}
                height={Math.abs(preview.y2 - preview.y1)}
                fill="rgba(99,102,241,0.08)"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray={activeTool === 'bgshape-region' ? '8 5' : undefined}
              />
            ) : (
              <line
                x1={preview.x1} y1={preview.y1}
                x2={preview.x2} y2={preview.y2}
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray={activeTool === 'dottedLine' ? '8 5' : undefined}
                strokeLinecap="round"
                opacity={0.75}
              />
            )}
          </svg>
        )}
      </div>

      {pendingConnection && (
        <EdgeConfigModal
          onClose={() => setPendingConnection(null)}
          onSave={handleEdgeSave}
        />
      )}
    </div>
  );
}

// ─── Exported wrapper ──────────────────────────────────────────────────────
export default function Board() {
  return (
    <ReactFlowProvider>
      <BoardInner />
    </ReactFlowProvider>
  );
}
