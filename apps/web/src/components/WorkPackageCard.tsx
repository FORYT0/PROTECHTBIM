import { WorkPackage, Priority } from '@protecht-bim/shared-types';

interface WorkPackageCardProps {
  workPackage: WorkPackage;
  onClick?: () => void;
}

const priorityColors: Record<Priority, string> = {
  [Priority.LOW]: 'bg-gray-100 text-gray-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
};

const typeColors: Record<string, string> = {
  task: 'bg-blue-50 border-blue-200',
  milestone: 'bg-purple-50 border-purple-200',
  phase: 'bg-green-50 border-green-200',
  feature: 'bg-indigo-50 border-indigo-200',
  bug: 'bg-red-50 border-red-200',
};

export default function WorkPackageCard({ workPackage, onClick }: WorkPackageCardProps) {
  const cardColor = typeColors[workPackage.type] || 'bg-white border-gray-200';

  return (
    <div
      className={`${cardColor} border rounded-lg p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1 pr-2">
          {workPackage.subject}
        </h4>
        <span
          className={`${priorityColors[workPackage.priority]} text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0`}
        >
          {workPackage.priority}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="px-2 py-0.5 bg-gray-100 rounded">
          {workPackage.type}
        </span>
        
        {workPackage.assignee_id && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Assigned
          </span>
        )}

        {workPackage.due_date && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {new Date(workPackage.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {workPackage.progress_percent > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{workPackage.progress_percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${workPackage.progress_percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
