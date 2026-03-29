import React from 'react';
import type { ViewerState } from '../types/bim.types';

interface Props {
  viewerState: ViewerState;
  loadedCount: number;
  onRenderMode: (m: ViewerState['renderMode']) => void;
  onBackground: (b: ViewerState['background']) => void;
  onTool: (t: ViewerState['activeTool']) => void;
  onFitAll: () => void;
  onScreenshot: () => string;
  onSection: () => void;
  onUpload: () => void;
  onRunClash: () => void;
  onToggleSidebar: () => void;
  onToggleRight: () => void;
}

const RENDER_MODES: { id: ViewerState['renderMode']; label: string; icon: string }[] = [
  { id: 'shaded', label: 'Shaded', icon: '◼' },
  { id: 'wireframe', label: 'Wire', icon: '⬡' },
  { id: 'transparent', label: 'Trans', icon: '◻' },
  { id: 'xray', label: 'X-Ray', icon: '⊙' },
];

const TOOLS: { id: ViewerState['activeTool']; label: string }[] = [
  { id: 'select', label: '↖ Select' },
  { id: 'measure', label: '📏 Measure' },
  { id: 'section', label: '✂ Section' },
  { id: 'annotate', label: '📝 Annotate' },
];

export default function BIMToolbar({
  viewerState, loadedCount,
  onRenderMode, onTool, onFitAll, onScreenshot, onSection,
  onUpload, onRunClash, onToggleSidebar, onToggleRight,
}: Props) {
  const handleScreenshot = () => {
    const url = onScreenshot();
    const a = document.createElement('a');
    a.href = url;
    a.download = `bim-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="bim-toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn icon-btn" onClick={onToggleSidebar} title="Toggle Sidebar">☰</button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn primary" onClick={onUpload}>⬆ Upload IFC</button>
      </div>

      <div className="toolbar-group toolbar-center">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`toolbar-btn ${viewerState.activeTool === t.id ? 'active' : ''}`}
            onClick={() => onTool(t.id)}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
        <div className="toolbar-divider" />
        <button className="toolbar-btn icon-btn" onClick={onFitAll} title="Fit All">⊡</button>
        <button className="toolbar-btn icon-btn" onClick={onSection} title="Section Plane">✂</button>
        <button className="toolbar-btn icon-btn" onClick={handleScreenshot} title="Screenshot">📷</button>
      </div>

      <div className="toolbar-group">
        <div className="toolbar-pills">
          {RENDER_MODES.map((m) => (
            <button
              key={m.id}
              className={`pill-btn ${viewerState.renderMode === m.id ? 'active' : ''}`}
              onClick={() => onRenderMode(m.id)}
              title={m.label}
            >
              <span>{m.icon}</span>
              <span className="pill-label">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-divider" />
        <button
          className="toolbar-btn clash-btn"
          onClick={onRunClash}
          disabled={loadedCount < 2}
          title={loadedCount < 2 ? 'Load 2+ models to detect clashes' : 'Run Clash Detection'}
        >
          ⚡ Clash
        </button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn icon-btn" onClick={onToggleRight} title="Toggle Properties">▣</button>
      </div>
    </div>
  );
}
