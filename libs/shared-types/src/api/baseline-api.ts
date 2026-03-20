/**
 * Baseline API interfaces
 */

import { Baseline, BaselineWithWorkPackages, BaselineListItem, VarianceReport } from '../models/baseline';

export interface CreateBaselineRequest {
  name: string;
  description?: string;
}

export interface CreateBaselineResponse {
  baseline: Baseline;
}

export interface ListBaselinesResponse {
  baselines: BaselineListItem[];
}

export interface GetBaselineResponse {
  baseline: BaselineWithWorkPackages;
}

export interface GetVarianceReportResponse {
  report: VarianceReport;
}
