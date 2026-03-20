import { WorkPackage, WorkPackageType, Priority } from '@protecht-bim/shared-types';

interface WorkPackageTableProps {
  workPackages: WorkPackage[];
  onRowClick: (workPackage: WorkPackage) => void;
  onSort: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function WorkPackageTable({ workPackages, onRowClick, onSort, sortBy, sortOrder }: WorkPackageTableProps) {
  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getTypeColor = (type: WorkPackageType) => {
    const colors = {
      [WorkPackageType.TASK]: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
      [WorkPackageType.MILESTONE]: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      [WorkPackageType.PHASE]: 'bg-success-500/20 text-success-400 border border-success-500/30',
      [WorkPackageType.FEATURE]: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      [WorkPackageType.BUG]: 'bg-error-500/20 text-error-400 border border-error-500/30',
    };
    return colors[type] || 'bg-surface-light text-secondary border border-surface-light';
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      [Priority.LOW]: 'bg-surface-light text-secondary border border-surface-light',
      [Priority.NORMAL]: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
      [Priority.HIGH]: 'bg-warning-500/20 text-warning-400 border border-warning-500/30',
      [Priority.URGENT]: 'bg-error-500/20 text-error-400 border border-error-500/30',
    };
    return colors[priority] || 'bg-surface-light text-secondary border border-surface-light';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  if (workPackages.length === 0) {
    return (
      <div className="card p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-hint mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-secondary">
          No work packages found. Try adjusting your filters or create a new work package.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto card">
        <table className="min-w-full divide-y divide-surface-light">
          <thead className="bg-surface">
            <tr>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint hover:bg-surface-light transition-colors duration-200"
                onClick={() => onSort('id')}
              >
                <div className="flex items-center">
                  ID
                  {getSortIcon('id')}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint hover:bg-surface-light transition-colors duration-200"
                onClick={() => onSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {getSortIcon('type')}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint hover:bg-surface-light transition-colors duration-200"
                onClick={() => onSort('subject')}
              >
                <div className="flex items-center">
                  Subject
                  {getSortIcon('subject')}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint hover:bg-surface-light transition-colors duration-200"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint hover:bg-surface-light transition-colors duration-200"
                onClick={() => onSort('priority')}
              >
                <div className="flex items-center">
                  Priority
                  {getSortIcon('priority')}
                </div>
              </th>
              <th
                scope="col"
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint hover:bg-surface-light transition-colors duration-200"
                onClick={() => onSort('dueDate')}
              >
                <div className="flex items-center">
                  Due Date
                  {getSortIcon('dueDate')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-hint"
              >
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-light bg-black">
            {workPackages.map((wp) => (
              <tr
                key={wp.id}
                onClick={() => onRowClick(wp)}
                className="cursor-pointer hover:bg-surface transition-colors duration-200"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                  #{wp.id.slice(0, 8)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getTypeColor(wp.type)}`}>
                    {wp.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white">
                  <div className="max-w-md truncate">{wp.subject}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                  {wp.status}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getPriorityColor(wp.priority)}`}>
                    {wp.priority}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary">
                  {formatDate(wp.due_date)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-24 rounded-full bg-surface-light overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                        style={{ width: `${wp.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-secondary">{wp.progress_percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {workPackages.map((wp) => (
          <div
            key={wp.id}
            onClick={() => onRowClick(wp)}
            className="card hover:elevation-3 active:elevation-1 transition-all duration-200 cursor-pointer"
          >
            {/* Header with Type and Priority */}
            <div className="mb-3 flex items-center justify-between">
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getTypeColor(wp.type)}`}>
                {wp.type}
              </span>
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getPriorityColor(wp.priority)}`}>
                {wp.priority}
              </span>
            </div>

            {/* Subject */}
            <h3 className="mb-2 text-base font-semibold text-white">
              {wp.subject}
            </h3>

            {/* ID and Status */}
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-hint">
                #{wp.id.slice(0, 8)}
              </span>
              <span className="text-secondary">
                {wp.status}
              </span>
            </div>

            {/* Due Date */}
            {wp.due_date && (
              <div className="mb-3 text-sm text-secondary">
                Due: {formatDate(wp.due_date)}
              </div>
            )}

            {/* Progress Bar */}
            <div className="flex items-center">
              <div className="mr-2 h-2 flex-1 rounded-full bg-surface-light overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                  style={{ width: `${wp.progress_percent}%` }}
                />
              </div>
              <span className="text-sm text-secondary">
                {wp.progress_percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default WorkPackageTable;
