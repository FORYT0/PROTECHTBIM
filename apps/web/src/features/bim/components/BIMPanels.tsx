import React, { useState, useCallback } from 'react';
import type { IFCElement, ClashResult, BCFIssue } from '../types/bim.types';

// ── Properties Panel ─────────────────────────────────────────
export function BIMPropertiesPanel({ element }: { element: IFCElement }) {
  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <h4>Properties</h4>
        <span className="type-chip">{element.type}</span>
      </div>
      <div className="prop-section">
        <h5>Identity</h5>
        <table className="prop-table">
          <tbody>
            {element.name && <tr><td>Name</td><td>{element.name}</td></tr>}
            <tr><td>Type</td><td>{element.type}</td></tr>
            {element.objectType && <tr><td>Object Type</td><td>{element.objectType}</td></tr>}
            {element.storey && <tr><td>Storey</td><td>{element.storey}</td></tr>}
            {element.material && <tr><td>Material</td><td>{element.material}</td></tr>}
            <tr><td>Express ID</td><td>{element.expressId}</td></tr>
            <tr><td>Global ID</td><td className="mono">{element.globalId.substring(0, 22)}…</td></tr>
          </tbody>
        </table>
      </div>
      {Object.keys(element.properties).length > 0 && (
        <div className="prop-section">
          <h5>Properties ({Object.keys(element.properties).length})</h5>
          <table className="prop-table">
            <tbody>
              {Object.values(element.properties).map((prop) => (
                <tr key={prop.name}>
                  <td>{prop.name}</td>
                  <td>
                    {prop.value !== null ? String(prop.value) : <span className="null-val">—</span>}
                    {prop.unit && <span className="unit"> {prop.unit}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Model Upload Modal ────────────────────────────────────────
export function BIMModelUpload({
  onAccept, onClose,
}: {
  onAccept: (file: File) => void;
  onClose: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.toLowerCase().endsWith('.ifc')) setSelectedFile(file);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload IFC Model</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <>
              <div className="drop-icon success">✅</div>
              <p className="drop-filename">{selectedFile.name}</p>
              <p className="drop-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <div className="drop-icon">📁</div>
              <p className="drop-label">Drop your IFC file here</p>
              <p className="drop-sub">Supports IFC2X3, IFC4, IFC4X3</p>
              <label className="btn-outline">
                Browse File
                <input
                  type="file"
                  accept=".ifc"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }}
                  hidden
                />
              </label>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => selectedFile && onAccept(selectedFile)}
            disabled={!selectedFile}
          >
            Upload & Load
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Overlay ───────────────────────────────────────────
export function BIMLoadingOverlay({ message, progress }: { message: string; progress: number }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner">⟳</div>
        <p className="loading-msg">{message}</p>
        {progress > 0 && (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-pct">{progress}%</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Clash Panel ───────────────────────────────────────────────
export function BIMClashPanel({
  clashes, selected, onSelect, onStatusChange,
}: {
  clashes: ClashResult[];
  selected: ClashResult | null;
  onSelect: (c: ClashResult) => void;
  onStatusChange: (id: string, status: ClashResult['status']) => void;
}) {
  const SEV_COLOR = { critical: '#ff2d55', major: '#ff9500', minor: '#ffcc00' };
  const STATUS_LABEL = { new: 'New', active: 'Active', reviewed: 'Reviewed', resolved: 'Resolved' };

  const counts = clashes.reduce<Record<string, number>>((acc, c) => {
    acc[c.severity] = (acc[c.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <h4>Clash Detection</h4>
        <span className="count-badge">{clashes.length}</span>
      </div>
      <div className="clash-summary">
        {(['critical', 'major', 'minor'] as const).map((sev) => (
          <div key={sev} className="clash-stat">
            <span className="clash-dot" style={{ background: SEV_COLOR[sev] }} />
            <span className="clash-sev">{sev}</span>
            <span className="clash-count">{counts[sev] ?? 0}</span>
          </div>
        ))}
      </div>
      <ul className="clash-list">
        {clashes.map((clash) => (
          <li
            key={clash.id}
            className={`clash-item ${selected?.id === clash.id ? 'selected' : ''}`}
            onClick={() => onSelect(clash)}
          >
            <div className="clash-marker" style={{ background: SEV_COLOR[clash.severity] }} />
            <div className="clash-info">
              <span className="clash-title">{clash.elementA.type} ↔ {clash.elementB.type}</span>
              <span className="clash-models">
                {clash.elementA.name ?? `#${clash.elementA.expressId}`} &amp; {clash.elementB.name ?? `#${clash.elementB.expressId}`}
              </span>
              <div className="clash-meta">
                <span className={`status-chip status-${clash.status}`}>{STATUS_LABEL[clash.status]}</span>
                {clash.distance !== undefined && (
                  <span className="clash-dist">Δ {clash.distance.toFixed(3)}m</span>
                )}
              </div>
            </div>
          </li>
        ))}
        {clashes.length === 0 && (
          <li className="panel-empty-sm">
            <p>No clashes detected yet</p>
            <p className="hint">Load at least 2 models and run clash detection</p>
          </li>
        )}
      </ul>
    </div>
  );
}

// ── BCF Panel ─────────────────────────────────────────────────
const BCF_PRIORITIES = ['critical', 'major', 'normal', 'minor'] as const;
const BCF_TYPES = ['issue', 'request', 'solution'] as const;

export function BIMBCFPanel({
  issues, selected, onSelect, onCreate,
}: {
  issues: BCFIssue[];
  selected: BCFIssue | null;
  onSelect: (i: BCFIssue) => void;
  onCreate: (issue: Partial<BCFIssue>) => Promise<BCFIssue>;
}) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal', type: 'issue' });

  const PRIORITY_COLOR = { critical: '#ff2d55', major: '#ff9500', normal: '#60a5fa', minor: '#94a3b8' };
  const STATUS_COLOR = { open: '#f59e0b', in_progress: '#60a5fa', resolved: '#22c55e', closed: '#64748b' };

  const handleCreate = async () => {
    await onCreate({ ...form, priority: form.priority as any, type: form.type as any, status: 'open' });
    setCreating(false);
    setForm({ title: '', description: '', priority: 'normal', type: 'issue' });
  };

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <h4>BCF Issues</h4>
        <button className="icon-action" onClick={() => setCreating(!creating)} title="New Issue">＋</button>
      </div>

      {creating && (
        <div className="bcf-create-form">
          <input
            className="form-input"
            placeholder="Issue title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="form-textarea"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
          <div className="form-row">
            <select className="form-select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              {BCF_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {BCF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button className="btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleCreate} disabled={!form.title}>Create Issue</button>
          </div>
        </div>
      )}

      <ul className="bcf-list">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className={`bcf-item ${selected?.id === issue.id ? 'selected' : ''}`}
            onClick={() => onSelect(issue)}
          >
            <div className="bcf-priority-bar" style={{ background: PRIORITY_COLOR[issue.priority] }} />
            <div className="bcf-info">
              <span className="bcf-title">{issue.title}</span>
              <div className="bcf-meta">
                <span
                  className="status-chip"
                  style={{ background: STATUS_COLOR[issue.status] + '33', color: STATUS_COLOR[issue.status] }}
                >
                  {issue.status.replace('_', ' ')}
                </span>
                <span className="bcf-type">{issue.type}</span>
                {issue.comments.length > 0 && <span className="bcf-comments">💬 {issue.comments.length}</span>}
              </div>
            </div>
          </li>
        ))}
        {issues.length === 0 && !creating && (
          <li className="panel-empty-sm">
            <p>No BCF issues yet</p>
            <button className="btn-link" onClick={() => setCreating(true)}>Create first issue</button>
          </li>
        )}
      </ul>
    </div>
  );
}
