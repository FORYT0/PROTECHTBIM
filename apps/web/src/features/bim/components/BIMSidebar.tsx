import React from 'react';
import type { IFCModel, IFCStorey, IFCElement } from '../types/bim.types';

type Panel = 'models' | 'elements' | 'clashes' | 'bcf' | 'properties';

interface Props {
  models: IFCModel[];
  loadedModelIds: Set<string>;
  storeys: IFCStorey[];
  elements: IFCElement[];
  elementSearch: string;
  setElementSearch: (s: string) => void;
  activePanel: Panel;
  setActivePanel: (p: Panel) => void;
  onLoadModel: (m: IFCModel) => void;
  onUnloadModel: (id: string) => void;
  onStoreyToggle: (expressId: number) => void;
  onSelectElement: (el: IFCElement) => void;
  onUpload: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Wall: '#60a5fa', Slab: '#34d399', Beam: '#f59e0b',
  Column: '#a78bfa', Door: '#fb7185', Window: '#38bdf8',
  Stair: '#fbbf24', Roof: '#4ade80', Space: '#e2e8f0',
  Pipe: '#06b6d4', Duct: '#8b5cf6', Footing: '#d97706',
};

const STATUS_COLORS: Record<string, string> = {
  ready: '#22c55e', processing: '#f59e0b', error: '#ef4444', uploading: '#60a5fa',
};

const NAV: { id: Panel; label: string }[] = [
  { id: 'models', label: '🏗 Models' },
  { id: 'elements', label: '📋 Elements' },
  { id: 'clashes', label: '⚡ Clashes' },
  { id: 'bcf', label: '📌 BCF' },
];

export default function BIMSidebar({
  models, loadedModelIds, storeys, elements,
  elementSearch, setElementSearch,
  activePanel, setActivePanel,
  onLoadModel, onUnloadModel, onStoreyToggle, onSelectElement, onUpload,
}: Props) {
  const filtered = elements.filter((el) =>
    !elementSearch ||
    el.name?.toLowerCase().includes(elementSearch.toLowerCase()) ||
    el.type.toLowerCase().includes(elementSearch.toLowerCase())
  );

  const byType = filtered.reduce<Record<string, IFCElement[]>>((acc, el) => {
    (acc[el.type] = acc[el.type] || []).push(el);
    return acc;
  }, {});

  return (
    <div className="bim-sidebar">
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
            onClick={() => setActivePanel(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-content">
        {/* Models Panel */}
        {activePanel === 'models' && (
          <div className="panel">
            <div className="panel-header">
              <h4>IFC Models</h4>
              <button className="icon-action" onClick={onUpload} title="Upload">⬆</button>
            </div>
            {models.length === 0 ? (
              <div className="panel-empty-sm">
                <p>No models yet</p>
                <button className="btn-link" onClick={onUpload}>Upload IFC</button>
              </div>
            ) : (
              <ul className="model-list">
                {models.map((model) => {
                  const loaded = loadedModelIds.has(model.id);
                  return (
                    <li key={model.id} className={`model-item ${loaded ? 'loaded' : ''}`}>
                      <div className="model-icon">🏗</div>
                      <div className="model-info">
                        <span className="model-name">{model.name}</span>
                        <span className="model-meta">
                          {(model.fileSize / 1024 / 1024).toFixed(1)} MB
                          {model.metadata && ` · ${model.metadata.elementCount.toLocaleString()} elements`}
                        </span>
                        <span className="model-status" style={{ color: STATUS_COLORS[model.status] }}>
                          ● {model.status}
                        </span>
                      </div>
                      <div className="model-actions">
                        <button
                          className={`toggle-btn ${loaded ? 'active' : ''}`}
                          onClick={() => loaded ? onUnloadModel(model.id) : onLoadModel(model)}
                          disabled={model.status !== 'ready'}
                          title={loaded ? 'Hide' : 'Show'}
                        >
                          {loaded ? '👁' : '👁‍🗨'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {storeys.length > 0 && (
              <div className="storey-section">
                <h5>Building Storeys</h5>
                <ul className="storey-list">
                  {storeys.map((storey) => (
                    <li key={storey.expressId} className="storey-item">
                      <button
                        className={`storey-toggle ${storey.visible ? 'visible' : ''}`}
                        onClick={() => onStoreyToggle(storey.expressId)}
                      >
                        <span className="storey-dot" />
                        <span className="storey-name">{storey.name}</span>
                        <span className="storey-elev">+{storey.elevation.toFixed(1)}m</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Elements Panel */}
        {activePanel === 'elements' && (
          <div className="panel">
            <div className="panel-header">
              <h4>Elements</h4>
              <span className="count-badge">{filtered.length}</span>
            </div>
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search elements..."
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
              />
            </div>
            <div className="element-tree">
              {Object.entries(byType).map(([type, els]) => (
                <div key={type} className="element-group">
                  <div className="element-group-header">
                    <span className="type-dot" style={{ background: TYPE_COLORS[type] ?? '#64748b' }} />
                    <span className="type-name">{type}</span>
                    <span className="type-count">{els.length}</span>
                  </div>
                  <ul className="element-list">
                    {els.slice(0, 50).map((el) => (
                      <li key={el.expressId} className="element-item" onClick={() => onSelectElement(el)}>
                        <span className="el-name">{el.name ?? `${type} #${el.expressId}`}</span>
                        {el.storey && <span className="el-storey">{el.storey}</span>}
                      </li>
                    ))}
                    {els.length > 50 && <li className="element-more">+{els.length - 50} more</li>}
                  </ul>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="panel-empty-sm"><p>No elements found</p></div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'clashes' && (
          <div className="panel">
            <div className="panel-header"><h4>Clash Detection</h4></div>
            <p className="panel-hint">Clash details appear in the right panel</p>
          </div>
        )}

        {activePanel === 'bcf' && (
          <div className="panel">
            <div className="panel-header"><h4>BCF Issues</h4></div>
            <p className="panel-hint">Issue details appear in the right panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
