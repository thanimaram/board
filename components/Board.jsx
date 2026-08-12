'use client';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import { exportAsPNG, exportAsPDF } from '@/lib/exportDiagram';

import Toolbar from '@/components/Toolbar';
import CanvasToolbar from '@/components/CanvasToolbar';
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
    copySelected, pasteCopied,
    updateNodeData, deleteSelected, setNodes, setEdges,
  } = useBoard();

  const { screenToFlowPosition } = useReactFlow();

  const [pendingConnection, setPendingConnection] = useState(null);
  const [isDragOver, setIsDragOver]               = useState(false);
  const [isExporting, setIsExporting]             = useState(false);
  const [isPanMode, setIsPanMode]                 = useState(false);

  const handleTogglePan = useCallback(() => setIsPanMode(p => !p), []);

  const handleExportPNG = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportAsPNG('diagram');
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('PNG export failed. Please check your internet connection and try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportAsPDF('diagram');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please check your internet connection and try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

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
  const { preview, onMouseDown, isShapeDrawing } = useDrawingTool({ activeTool, addLineNode, addBgShapeNode, setActiveTool });

  // ── Track Mouse for Paste ──────────────────────────────────────────────
  const lastMousePos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => { lastMousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const map = {
      s: 'select', x: 'text', l: 'line', d: 'dottedLine',
      r: 'shape-rect', o: 'shape-circle',
    };
    const handle = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Copy / Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        copySelected();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const boardEl = document.querySelector('.board-canvas');
        let flowPos = null;
        if (boardEl) {
          const rect = boardEl.getBoundingClientRect();
          const mx = lastMousePos.current.x;
          const my = lastMousePos.current.y;
          if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
            flowPos = screenToFlowPosition({ x: mx, y: my });
          }
        }
        pasteCopied(flowPos);
        return;
      }

      if (map[e.key.toLowerCase()]) setActiveTool(map[e.key.toLowerCase()]);
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if (e.key === 'Escape') setActiveTool('select');
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [setActiveTool, deleteSelected, copySelected, pasteCopied, screenToFlowPosition]);

  // ── Pane click — place node/shape/text ────────────────────────────────
  const handlePaneClick = useCallback(
    (e) => {
      // Drawing tools handle shape creation via mouseup — block paneClick to prevent duplicates
      if (activeTool === 'line' || activeTool === 'dottedLine' || activeTool.startsWith('bgshape-')) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      if (activeTool === 'text') {
        addTextNode(pos);
        setActiveTool('select');
      } else if (activeTool.startsWith('node-')) {
        const shape = activeTool.replace('node-', '');
        addNodeNode(shape, pos);
        setActiveTool('select');
      } else if (activeTool.startsWith('custom-')) {
        const templateId = activeTool;
        const template = customTemplates.find(c => c.id === templateId);
        if (template) {
          addNodeNode(template.shape, pos, {
            shape: template.shape,
            label: template.label,
            headerLabel: template.headerLabel || template.label,
            fillColor: template.color.fill,
            borderColor: template.color.border,
            textColor: template.color.text,
            attributes: template.attributes.map(key => ({ key, value: '' })), // initialize empty values
          });
        }
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

  // ── Drag-and-drop from sidebar ────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // only clear when leaving the canvas entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const type = e.dataTransfer.getData('application/reactflow-type');
      const payload = JSON.parse(e.dataTransfer.getData('application/reactflow-payload') || '{}');
      if (!type) return;

      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      if (type === 'node') {
        addNodeNode(payload.shape, pos);
      } else if (type === 'bgshape') {
        addBgShapeNode(payload.shape, pos);
      } else if (type === 'equipment') {
        addNodeNode('rect', pos, {
          shape: 'rect',
          headerLabel: 'Equipment',
          label: payload.serial,
          fillColor: '#f0fdf4',
          borderColor: '#10b981',
          textColor: '#065f46',
          nonEditable: true,
        });
      } else if (type === 'custom') {
        const template = customTemplates.find((c) => c.id === payload.templateId);
        if (template) {
          addNodeNode(template.shape, pos, {
            shape: template.shape,
            label: template.label,
            headerLabel: template.headerLabel || template.label,
            fillColor: template.color.fill,
            borderColor: template.color.border,
            textColor: template.color.text,
            attributes: template.attributes.map((key) => ({ key, value: '' })),
          });
        }
      }
    },
    [screenToFlowPosition, addNodeNode, addBgShapeNode, customTemplates]
  );

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
        className={`board-canvas${isDragOver ? ' drag-over' : ''}`}
        style={{ cursor: isPanMode ? 'grab' : cursor }}
        onMouseDown={onMouseDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ── Top utility toolbar ─────────────────────────────────────── */}
        <CanvasToolbar
          isPanMode={isPanMode}
          onTogglePan={handleTogglePan}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          isExporting={isExporting}
        />
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
          panOnDrag={isPanMode || !isDrawMode}
          selectionOnDrag={!isPanMode && activeTool === 'select'}
          minZoom={0.1}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
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
                fill="rgba(71,140,202,0.08)"
                stroke="#478cca"
                strokeWidth={2}
                strokeDasharray={activeTool === 'bgshape-region' ? '8 5' : undefined}
              />
            ) : (
              <line
                x1={preview.x1} y1={preview.y1}
                x2={preview.x2} y2={preview.y2}
                stroke="#478cca"
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
