'use client';
import { memo, useRef, useEffect, useCallback } from 'react';
import { NodeResizer } from '@xyflow/react';

const FONT_SIZES = [12, 14, 16, 20, 24, 32];
const TEXT_COLORS = [
  '#1a1a2e', '#6366f1', '#ef4444', '#10b981',
  '#f59e0b', '#06b6d4', '#7c3aed', '#ec4899',
];

function TextNode({ data, selected, id }) {
  const {
    text = '',
    fontSize = 16,
    textColor = '#1a1a2e',
    bold = false,
    italic = false,
    autoFocus,
  } = data;

  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
      autoResize();
    }
  }, [autoFocus]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const emit = (updates) => data.onChange?.(id, updates);

  return (
    <div className={`text-node ${selected ? 'selected' : ''}`}>
      <NodeResizer minWidth={80} minHeight={30} isVisible={selected} />

      {/* Formatting toolbar — shown when selected */}
      {selected && (
        <div 
          className="text-toolbar" 
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bold / Italic */}
          <button
            className={`fmt-btn bold ${bold ? 'active' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); emit({ bold: !bold }); }}
          >B</button>
          <button
            className={`fmt-btn italic-btn ${italic ? 'active' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); emit({ italic: !italic }); }}
          ><em>I</em></button>

          <div className="fmt-sep" />

          {/* Font size */}
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              className={`fmt-btn ${fontSize === s ? 'active' : ''}`}
              style={{ fontSize: 10, minWidth: 22 }}
              onPointerDown={(e) => { e.preventDefault(); emit({ fontSize: s }); }}
            >{s}</button>
          ))}

          <div className="fmt-sep" />

          {/* Text color */}
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${textColor === c ? 'active' : ''}`}
              style={{ background: c }}
              onPointerDown={(e) => { e.preventDefault(); emit({ textColor: c }); }}
            />
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="text-node-area"
        value={text}
        onChange={(e) => { emit({ text: e.target.value }); autoResize(); }}
        onInput={autoResize}
        placeholder="Type something…"
        rows={1}
        style={{
          fontSize: `${fontSize}px`,
          color: textColor,
          fontWeight: bold ? '700' : '400',
          fontStyle: italic ? 'italic' : 'normal',
        }}
      />
    </div>
  );
}

export default memo(TextNode);
