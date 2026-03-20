/**
 * Baseline model interfaces
 */

export interface Baseline {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: Date;
}

export interface BaselineWorkPackage {
  id: string;
  baseline_id: string;
  work_package_id: string;
  subject: string;
  start_date?: Date;
  due_date?: Date;
}

export interface BaselineWithWorkPackages extends Baseline {
  work_packages: BaselineWorkPackage[];
}

export interface BaselineListItem {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: Date;
  work_package_count: number;
}

/**
 * Schedule variance for a single work package
 */
export interface WorkPackageVariance {
  work_package_id: string;
  subject: string;
  baseline_start_date?: Date;
  baseline_due_date?: Date;
  current_start_date?: Date;
  current_due_date?: Date;
  start_variance_days: number; // Negative = ahead, Positive = behind
  due_variance_days: number; // Negative = ahead, Positive = behind
  status: 'ahead' | 'on_track' | 'behind' | 'no_baseline';
}

/**
 * Variance report for a project comparing baseline to current schedule
 */
export interface VarianceReport {
  baseline_id: string;
  baseline_name: string;
  project_id: string;
  generated_at: Date;
  total_work_packages: number;
  ahead_count: number;
  on_track_count: number;
  behind_count: number;
  no_baseline_count: number;
  average_start_variance_days: number;
  average_due_variance_days: number;
  variances: WorkPackageVariance[];
}
