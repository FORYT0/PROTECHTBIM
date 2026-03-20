/**
 * BIM model types
 */

export enum ModelFormat {
  IFC = 'ifc',
  REVIT = 'revit',
  NAVISWORKS = 'navisworks',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min_x: number;
  min_y: number;
  min_z: number;
  max_x: number;
  max_y: number;
  max_z: number;
}

export interface BIMModel {
  id: string;
  project_id: string;
  name: string;
  description: string;
  file_path: string;
  file_size: number;
  format: ModelFormat;
  version: number;
  parent_version_id: string | null;
  uploaded_by: string;
  processing_status: ProcessingStatus;
  thumbnail_path: string | null;
  bounding_box: BoundingBox;
  element_count: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ModelElement {
  id: string;
  model_id: string;
  ifc_guid: string;
  ifc_type: string;
  name: string;
  properties: Record<string, unknown>;
  geometry_id: string | null;
  parent_element_id: string | null;
  floor: string | null;
  zone: string | null;
}
