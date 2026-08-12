'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [clipboard, setClipboard] = useState({ nodes: [] });
  const [, forceRender] = useState(0); // used to trigger re-renders for canUndo/canRedo

  // ── History refs ────────────────────────────────────────────────
  const historyRef = useRef({ past: [], future: [] });
  // Always-fresh snapshots of nodes/edges without needing them in dep arrays
  const nodesRef   = useRef([]);
  const edgesRef   = useRef([]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  /** Snapshot current state into past[], clear future[] */
  const snapshot = useCallback(() => {
    historyRef.current.past.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    });
    historyRef.current.future = [];
    if (historyRef.current.past.length > 60) historyRef.current.past.shift();
  }, []);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    future.unshift({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    });
    const prev = past.pop();
    setNodes(prev.nodes);
    setEdges(prev.edges);
    forceRender(v => v + 1);
  }, []);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    past.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    });
    const next = future.shift();
    setNodes(next.nodes);
    setEdges(next.edges);
    forceRender(v => v + 1);
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

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
    snapshot();
    const id = `e${edgeIdCounter++}`;
    setEdges((eds) => addEdge({ ...connection, id, type: 'smoothstep', animated: false }, eds));
  }, [snapshot]);

  const addConfiguredEdge = useCallback((connection, config) => {
    snapshot();
    const id = `e${edgeIdCounter++}`;
    setEdges((eds) => addEdge({
      ...connection, id, type: 'smoothstep', animated: config.animated,
      ...(config.label ? {
        label: config.label,
        labelStyle: { fill: 'var(--text-primary)', fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: 'var(--bg-canvas)', fillOpacity: 0.8, rx: 4, ry: 4 },
        labelBgPadding: [4, 2],
      } : {}),
      style: { stroke: config.color, strokeWidth: 2 }
    }, eds));
  }, [snapshot]);

  // ── Add semantic node (rect, circle, diamond, etc.) ───────────────────────
  const addNodeNode = useCallback((shape, position, customData = null) => {
    snapshot();
    const id = `n${nodeIdCounter++}`;
    setNodes((nds) => [...nds, {
      id, type: 'shapeNode', position,
      data: customData || {
        shape,
        label: DEFAULT_SHAPE_LABELS[shape] || 'Node',
        fillColor: shape === 'sticky' ? '#fef9c3' : '#ffffff',
        borderColor: shape === 'sticky' ? '#facc15' : '#478cca',
        textColor: '#1a1a2e',
      },
    }]);
  }, [snapshot]);

  // ── Add background shape (region, rect, circle, etc.) ────────────────────
  const addBgShapeNode = useCallback((shape, position, width = 200, height = 150) => {
    snapshot();
    const id = `n${nodeIdCounter++}`;
    if (shape === 'region') {
      setNodes((nds) => [...nds, {
        id, type: 'regionNode', position, zIndex: -1,
        data: { label: DEFAULT_SHAPE_LABELS.region, width, height }
      }]);
      return;
    }
    setNodes((nds) => [...nds, {
      id, type: 'bgShapeNode', position, zIndex: -1,
      data: {
        shape, label: '',
        fillColor: 'rgba(71,140,202,0.08)', borderColor: '#478cca',
        textColor: '#478cca', width, height,
      }
    }]);
  }, [snapshot]);

  // ── Add free text node ──────────────────────────────────────────────────
  const addTextNode = useCallback((position) => {
    snapshot();
    const id = `n${nodeIdCounter++}`;
    setNodes((nds) => [...nds, {
      id, type: 'textNode', position,
      data: { text: '', fontSize: 16, textColor: '#1a1a2e', bold: false, italic: false, autoFocus: true },
    }]);
  }, [snapshot]);

  // ── Add line node (stores relative dx/dy from start position) ──────────
  const addLineNode = useCallback((x1, y1, x2, y2, style = 'solid') => {
    snapshot();
    const id = `n${nodeIdCounter++}`;
    setNodes((nds) => [...nds, {
      id, type: 'lineNode', position: { x: x1, y: y1 },
      data: { dx: x2 - x1, dy: y2 - y1, style, color: '#478cca', strokeWidth: 2 },
      draggable: true, selectable: true,
    }]);
  }, [snapshot]);

  // ── Update arbitrary node data fields ──────────────────────────────────
  const updateNodeData = useCallback((id, newData) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)
    );
  }, []);

  // ── Delete selected nodes + edges ──────────────────────────────────────
  const deleteSelected = useCallback(() => {
    snapshot();
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [snapshot]);

  // ── Copy / Paste ────────────────────────────────────────────────────────
  const copySelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length > 0) {
      // Deep clone so changes after copy don't mutate clipboard
      setClipboard({ nodes: JSON.parse(JSON.stringify(selectedNodes)) });
    }
  }, [nodes]);

  const pasteCopied = useCallback((cursorFlowPos = null) => {
    if (clipboard.nodes.length === 0) return;
    snapshot();
    setNodes((nds) => {
      let dx = 40, dy = 40;
      if (cursorFlowPos) {
        const refNode = clipboard.nodes[0];
        dx = cursorFlowPos.x - refNode.position.x;
        dy = cursorFlowPos.y - refNode.position.y;
      }
      const newNodes = clipboard.nodes.map(n => ({
        ...n, id: `n${nodeIdCounter++}`, selected: true,
        position: { x: n.position.x + dx, y: n.position.y + dy }
      }));
      return [...nds.map(n => ({ ...n, selected: false })), ...newNodes];
    });
  }, [clipboard, snapshot]);

  const addCustomTemplate = useCallback((template) => {
    setCustomTemplates((prev) => [...prev, { ...template, id: `custom-${Date.now()}` }]);
  }, []);

  return {
    nodes, edges, customTemplates, activeTool, setActiveTool, hydrated,
    onNodesChange, onEdgesChange, onConnect, addConfiguredEdge,
    addNodeNode, addBgShapeNode, addTextNode, addLineNode,
    addCustomTemplate, copySelected, pasteCopied,
    updateNodeData, deleteSelected, setNodes, setEdges,
    undo, redo, canUndo, canRedo,
  };
}
