export interface IFCModel {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  projectId: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  storageUrl?: string;
  metadata?: IFCMetadata;
}

export interface IFCMetadata {
  schema: string;
  elementCount: number;
  storeyCount: number;
  disciplines: string[];
  author?: string;
  organization?: string;
}

export interface IFCStorey {
  expressId: number;
  name: string;
  elevation: number;
  visible: boolean;
}

export interface IFCProperty {
  name: string;
  value: string | number | boolean | null;
  unit?: string;
}

export interface IFCElement {
  expressId: number;
  globalId: string;
  type: string;
  name?: string;
  objectType?: string;
  storey?: string;
  material?: string;
  properties: Record<string, IFCProperty>;
}

export interface ViewerState {
  renderMode: 'shaded' | 'wireframe' | 'transparent' | 'xray';
  background: 'dark' | 'light' | 'gradient';
  activeTool: 'select' | 'measure' | 'section' | 'annotate';
  sectionPlane: boolean;
}

export interface Measurement {
  value: number;
  unit: string;
  pointA: [number, number, number];
  pointB: [number, number, number];
}

export interface ClashResult {
  id: string;
  projectId: string;
  type: 'hard' | 'soft' | 'clearance';
  severity: 'critical' | 'major' | 'minor';
  status: 'new' | 'active' | 'reviewed' | 'resolved';
  elementA: { expressId: number; type: string; name?: string; modelId: string };
  elementB: { expressId: number; type: string; name?: string; modelId: string };
  position: [number, number, number];
  distance?: number;
  assignedTo?: string;
  comment?: string;
  createdAt: string;
}

export interface BCFComment {
  id: string;
  author: string;
  comment: string;
  date: string;
  viewpoint?: object;
}

export interface BCFIssue {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'critical' | 'major' | 'normal' | 'minor';
  type: 'issue' | 'request' | 'solution';
  assignedTo?: string;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  viewpoint?: {
    snapshotUrl?: string;
    cameraPosition: number[];
    cameraDirection: number[];
    cameraUpVector: number[];
  };
  comments: BCFComment[];
  labels: string[];
}
