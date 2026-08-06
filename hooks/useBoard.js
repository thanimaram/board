'use client';
import { useState, useEffect, useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { saveBoard, loadBoard } from '@/lib/storage';

let nodeIdCounter = 1;
let edgeIdCounter = 1;

const DEFAULT_SHAPE_LABELS = {
  rect: 'Source', rounded: 'Transform', circle: 'Filter',
  diamond: 'Router', parallelogram: 'Stream', sticky: 'Note', database: 'Store',
  region: 'System Zone'
};

export function useBoard() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadBoard();
    if (saved) {
      if (saved.nodes) setNodes(saved.nodes);
      if (saved.edges) setEdges(saved.edges);
      if (saved.customTemplates) setCustomTemplates(saved.customTemplates);
      const maxNode = saved.nodes?.reduce((m, n) => Math.max(m, parseInt(n.id?.replace(/\D/g, '') || '0')), 0) ?? 0;
      const maxEdge = saved.edges?.reduce((m, e) => Math.max(m, parseInt(e.id?.replace(/\D/g, '') || '0')), 0) ?? 0;
      nodeIdCounter = maxNode + 1;
      edgeIdCounter = maxEdge + 1;
    }
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) saveBoard({ nodes, edges, customTemplates });
  }, [nodes, edges, customTemplates, hydrated]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );
  const onConnect = useCallback((connection) => {
    const id = `e${edgeIdCounter++}`;
    setEdges((eds) => addEdge({ ...connection, id, type: 'smoothstep', animated: false }, eds));
  }, []);

  const addConfiguredEdge = useCallback((connection, config) => {
    const id = `e${edgeIdCounter++}`;
    setEdges((eds) => addEdge({
      ...connection,
      id,
      type: 'smoothstep',
      animated: config.animated,
      ...(config.label ? {
        label: config.label,
        labelStyle: { fill: 'var(--text-primary)', fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: 'var(--bg-canvas)', fillOpacity: 0.8, rx: 4, ry: 4 },
        labelBgPadding: [4, 2],
      } : {}),
      style: { stroke: config.color, strokeWidth: 2 }
    }, eds));
  }, []);

  // ── Add semantic node (rect, circle, diamond, etc.) ───────────────────────
  const addNodeNode = useCallback((shape, position, customData = null) => {
    const id = `n${nodeIdCounter++}`;
    setNodes((nds) => [...nds, {
      id, type: 'shapeNode', position,
      data: customData || {
        shape,
        label: DEFAULT_SHAPE_LABELS[shape] || 'Node',
        fillColor: shape === 'sticky' ? '#fef9c3' : '#ffffff',
        borderColor: shape === 'sticky' ? '#facc15' : '#6366f1',
        textColor: '#1a1a2e',
      },
    }]);
  }, []);

  // ── Add background shape (region, rect, circle, etc.) ────────────────────
  const addBgShapeNode = useCallback((shape, position, width = 200, height = 150) => {
    const id = `n${nodeIdCounter++}`;
    if (shape === 'region') {
      setNodes((nds) => [...nds, {
        id, type: 'regionNode', position, zIndex: -1,
        data: { label: DEFAULT_SHAPE_LABELS.region, width, height }
      }]);
      return;
    }
    
    // For pure geometric background shapes (rect, circle, diamond, parallelogram)
    setNodes((nds) => [...nds, {
      id, type: 'bgShapeNode', position, zIndex: -1,
      data: {
        shape,
        label: '',
        fillColor: 'rgba(99,102,241,0.08)',
        borderColor: '#6366f1',
        textColor: '#6366f1',
        width,
        height,
      }
    }]);
  }, []);

  // ── Add free text node ──────────────────────────────────────────────────
  const addTextNode = useCallback((position) => {
    const id = `n${nodeIdCounter++}`;
    setNodes((nds) => [...nds, {
      id,
      type: 'textNode',
      position,
      data: { text: '', fontSize: 16, textColor: '#1a1a2e', bold: false, italic: false, autoFocus: true },
    }]);
  }, []);

  // ── Add line node (stores relative dx/dy from start position) ──────────
  const addLineNode = useCallback((x1, y1, x2, y2, style = 'solid') => {
    const id = `n${nodeIdCounter++}`;
    setNodes((nds) => [...nds, {
      id,
      type: 'lineNode',
      position: { x: x1, y: y1 },
      data: { dx: x2 - x1, dy: y2 - y1, style, color: '#6366f1', strokeWidth: 2 },
      draggable: true,
      selectable: true,
    }]);
  }, []);

  // ── Update arbitrary node data fields ──────────────────────────────────
  const updateNodeData = useCallback((id, newData) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)
    );
  }, []);

  // ── Delete selected nodes + edges ──────────────────────────────────────
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, []);

  const addCustomTemplate = useCallback((template) => {
    setCustomTemplates((prev) => [...prev, { ...template, id: `custom-${Date.now()}` }]);
  }, []);

  return {
    nodes, edges, customTemplates, activeTool, setActiveTool, hydrated,
    onNodesChange, onEdgesChange, onConnect, addConfiguredEdge,
    addNodeNode, addBgShapeNode, addTextNode, addLineNode, addCustomTemplate,
    updateNodeData, deleteSelected, setNodes, setEdges,
  };
}
