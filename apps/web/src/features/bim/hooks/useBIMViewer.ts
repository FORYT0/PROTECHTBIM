import { useState, useCallback, useRef } from 'react';
import type { BIMRenderer } from '../utils/bimRenderer';
import type {
  IFCModel, IFCMetadata, IFCStorey, IFCElement,
  ViewerState, Measurement, ClashResult, BCFIssue,
} from '../types/bim.types';
import * as bimApi from '../services/bimApi.service';
import { getModelDownloadUrl } from '../services/bimApi.service';

type Panel = 'models' | 'elements' | 'clashes' | 'bcf' | 'properties';

const DEFAULT_VIEWER_STATE: ViewerState = {
  renderMode: 'shaded',
  background: 'dark',
  activeTool: 'select',
  sectionPlane: false,
};

export function useBIMViewer(projectId: string) {
  const rendererRef = useRef<BIMRenderer | null>(null);

  const [models, setModels] = useState<IFCModel[]>([]);
  const [loadedModelIds, setLoadedModelIds] = useState<Set<string>>(new Set());
  const [storeys, setStoreys] = useState<IFCStorey[]>([]);
  const [elements, setElements] = useState<IFCElement[]>([]);
  const [metadata, setMetadata] = useState<IFCMetadata | null>(null);
  const [selectedElement, setSelectedElement] = useState<IFCElement | null>(null);
  const [elementSearch, setElementSearch] = useState('');
  const [activePanel, setActivePanel] = useState<Panel>('models');
  const [viewerState, setViewerState] = useState<ViewerState>(DEFAULT_VIEWER_STATE);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [clashes, setClashes] = useState<ClashResult[]>([]);
  const [selectedClash, setSelectedClash] = useState<ClashResult | null>(null);
  const [bcfIssues, setBcfIssues] = useState<BCFIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<BCFIssue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const setRenderer = useCallback((r: BIMRenderer) => {
    rendererRef.current = r;
    r.onSelect((expressId) => {
      const el = elements.find((e) => e.expressId === expressId);
      if (el) {
        setSelectedElement(el);
        setActivePanel('properties');
      }
    });
  }, [elements]);

  const fetchModels = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await bimApi.fetchModels(projectId);
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch BIM models:', err);
    }
  }, [projectId]);

  const loadClashes = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await bimApi.fetchClashes(projectId);
      setClashes(data);
    } catch {}
  }, [projectId]);

  const loadBCFIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await bimApi.fetchBCFIssues(projectId);
      setBcfIssues(data);
    } catch {}
  }, [projectId]);

  const uploadModel = useCallback(async (file: File): Promise<IFCModel> => {
    setIsLoading(true);
    setLoadingMessage('Uploading IFC model...');
    setUploadProgress(10);
    try {
      const model = await bimApi.uploadModel(projectId, file);
      setModels((prev) => [...prev, model]);
      setUploadProgress(100);
      return model;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, [projectId]);

  const loadModelInViewer = useCallback(async (model: IFCModel) => {
    if (!rendererRef.current) return;
    setIsLoading(true);
    setLoadingMessage(`Loading ${model.name}...`);
    try {
      const url = model.storageUrl ?? await getModelDownloadUrl(model.id);
      await rendererRef.current.loadIFC(url, model.id);
      setLoadedModelIds((prev) => new Set([...prev, model.id]));
    } catch (err) {
      console.error('Failed to load model in viewer:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unloadModel = useCallback((modelId: string) => {
    rendererRef.current?.unloadModel(modelId);
    setLoadedModelIds((prev) => {
      const next = new Set(prev);
      next.delete(modelId);
      return next;
    });
  }, []);

  const setRenderMode = useCallback((mode: ViewerState['renderMode']) => {
    rendererRef.current?.setRenderMode(mode);
    setViewerState((s) => ({ ...s, renderMode: mode }));
  }, []);

  const setBackground = useCallback((bg: ViewerState['background']) => {
    rendererRef.current?.setBackground(bg);
    setViewerState((s) => ({ ...s, background: bg }));
  }, []);

  const setActiveTool = useCallback((tool: ViewerState['activeTool']) => {
    setViewerState((s) => ({ ...s, activeTool: tool }));
  }, []);

  const fitAll = useCallback(() => {
    rendererRef.current?.fitAll();
  }, []);

  const takeScreenshot = useCallback((): string => {
    return rendererRef.current?.takeScreenshot() ?? '';
  }, []);

  const toggleSectionPlane = useCallback((axis: 'x' | 'y' | 'z', constant: number) => {
    const active = rendererRef.current?.toggleSectionPlane(axis, constant) ?? false;
    setViewerState((s) => ({ ...s, sectionPlane: active }));
  }, []);

  const toggleStoreyVisibility = useCallback((expressId: number) => {
    setStoreys((prev) =>
      prev.map((s) => s.expressId === expressId ? { ...s, visible: !s.visible } : s)
    );
  }, []);

  const runClashDetection = useCallback(async () => {
    const ids = Array.from(loadedModelIds);
    if (ids.length < 2) return;
    setIsLoading(true);
    setLoadingMessage('Running clash detection...');
    try {
      await bimApi.runClashDetection(ids);
      setTimeout(() => loadClashes(), 3000); // poll after delay
    } finally {
      setIsLoading(false);
    }
  }, [loadedModelIds, loadClashes]);

  const createIssue = useCallback(async (issue: Partial<BCFIssue>): Promise<BCFIssue> => {
    const created = await bimApi.createBCFIssue(projectId, issue);
    setBcfIssues((prev) => [created, ...prev]);
    return created;
  }, [projectId]);

  return {
    // State
    models, loadedModelIds, storeys, elements, metadata,
    selectedElement, elementSearch, activePanel, viewerState,
    measurements, clashes, selectedClash, bcfIssues, selectedIssue,
    isLoading, loadingMessage, uploadProgress,
    // Setters
    setRenderer, setMetadata, setStoreys, setElements,
    setSelectedElement, setElementSearch, setActivePanel,
    setSelectedClash, setSelectedIssue,
    // Actions
    fetchModels, loadClashes, loadBCFIssues,
    uploadModel, loadModelInViewer, unloadModel,
    setRenderMode, setBackground, setActiveTool,
    fitAll, takeScreenshot, toggleSectionPlane,
    toggleStoreyVisibility, runClashDetection, createIssue,
  };
}
