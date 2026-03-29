import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BIMRenderer } from './utils/bimRenderer';
import { parseIFCBuffer } from './utils/ifcParser';
import { useBIMViewer } from './hooks/useBIMViewer';
import BIMToolbar from './components/BIMToolbar';
import BIMSidebar from './components/BIMSidebar';
import {
  BIMPropertiesPanel, BIMModelUpload, BIMLoadingOverlay,
  BIMClashPanel, BIMBCFPanel,
} from './components/BIMPanels';
import './bim-viewer.css';

export default function BIMViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const viewer = useBIMViewer(projectId ?? '');

  // Init renderer
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const renderer = new BIMRenderer(canvasContainerRef.current);
    renderer.init().then(() => viewer.setRenderer(renderer));
    return () => renderer.dispose();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load initial data
  useEffect(() => {
    if (!projectId) return;
    viewer.fetchModels();
    viewer.loadClashes();
    viewer.loadBCFIssues();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileAccepted = useCallback(async (file: File) => {
    setShowUploadModal(false);
    const buffer = await file.arrayBuffer();
    const { metadata, storeys, elements } = await parseIFCBuffer(buffer);
    viewer.setMetadata(metadata);
    viewer.setStoreys(storeys);
    viewer.setElements(elements);
    const model = await viewer.uploadModel(file);
    await viewer.loadModelInViewer(model);
  }, [viewer]);

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setShowUploadModal(true);
  };

  return (
    <div className="bim-page">
      <BIMToolbar
        viewerState={viewer.viewerState}
        loadedCount={viewer.loadedModelIds.size}
        onRenderMode={viewer.setRenderMode}
        onBackground={viewer.setBackground}
        onTool={viewer.setActiveTool}
        onFitAll={viewer.fitAll}
        onScreenshot={viewer.takeScreenshot}
        onSection={() => viewer.toggleSectionPlane('y', 0)}
        onUpload={() => setShowUploadModal(true)}
        onRunClash={viewer.runClashDetection}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onToggleRight={() => setRightPanelOpen((r) => !r)}
      />

      <div className="bim-workspace">
        {sidebarOpen && (
          <BIMSidebar
            models={viewer.models}
            loadedModelIds={viewer.loadedModelIds}
            storeys={viewer.storeys}
            elements={viewer.elements}
            elementSearch={viewer.elementSearch}
            setElementSearch={viewer.setElementSearch}
            activePanel={viewer.activePanel as any}
            setActivePanel={viewer.setActivePanel as any}
            onLoadModel={viewer.loadModelInViewer}
            onUnloadModel={viewer.unloadModel}
            onStoreyToggle={viewer.toggleStoreyVisibility}
            onSelectElement={(el) => {
              viewer.setSelectedElement(el);
              viewer.setActivePanel('properties');
            }}
            onUpload={() => setShowUploadModal(true)}
          />
        )}

        {/* 3D Canvas */}
        <div className="bim-canvas-wrap" onDragOver={handleCanvasDragOver}>
          <div ref={canvasContainerRef} className="bim-canvas" />

          {/* Empty state */}
          {viewer.models.length === 0 && !viewer.isLoading && (
            <div className="bim-empty">
              <div className="bim-empty-icon">🏗</div>
              <h3>No IFC Models Loaded</h3>
              <p>Upload an IFC file to start viewing your BIM model in 3D</p>
              <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                Upload IFC File
              </button>
              <p className="bim-empty-hint">or drag & drop an .ifc file onto this area</p>
            </div>
          )}

          {/* Measurements */}
          {viewer.measurements.length > 0 && (
            <div className="bim-measurements">
              {viewer.measurements.map((m, i) => (
                <div key={i} className="measurement-tag">
                  {m.value.toFixed(3)} {m.unit}
                </div>
              ))}
            </div>
          )}

          {/* Viewer state badges */}
          <div className="bim-badges">
            <span className="badge">{viewer.viewerState.renderMode}</span>
            {viewer.viewerState.sectionPlane && <span className="badge badge-warn">Section Active</span>}
            {viewer.viewerState.activeTool !== 'select' && (
              <span className="badge badge-blue">{viewer.viewerState.activeTool}</span>
            )}
          </div>

          {/* Mini stats */}
          {viewer.metadata && (
            <div className="bim-stats">
              <span>{viewer.metadata.elementCount.toLocaleString()} elements</span>
              <span>{viewer.metadata.storeyCount} storeys</span>
              <span>{viewer.metadata.schema}</span>
              {viewer.metadata.disciplines.map((d) => (
                <span key={d} className="discipline-tag">{d}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        {rightPanelOpen && (
          <div className="bim-right-panel">
            {viewer.activePanel === 'properties' && viewer.selectedElement && (
              <BIMPropertiesPanel element={viewer.selectedElement} />
            )}
            {viewer.activePanel === 'clashes' && (
              <BIMClashPanel
                clashes={viewer.clashes}
                selected={viewer.selectedClash}
                onSelect={viewer.setSelectedClash}
                onStatusChange={async () => {}}
              />
            )}
            {viewer.activePanel === 'bcf' && (
              <BIMBCFPanel
                issues={viewer.bcfIssues}
                selected={viewer.selectedIssue}
                onSelect={viewer.setSelectedIssue}
                onCreate={viewer.createIssue}
              />
            )}
            {!viewer.selectedElement && viewer.activePanel === 'properties' && (
              <div className="panel-empty">
                <p>Click an element in the 3D view to inspect its properties</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showUploadModal && (
        <BIMModelUpload
          onAccept={handleFileAccepted}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {viewer.isLoading && (
        <BIMLoadingOverlay
          message={viewer.loadingMessage}
          progress={viewer.uploadProgress}
        />
      )}
    </div>
  );
}
