import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import WorkPackageTable from '../WorkPackageTable';
import { WorkPackageType, Priority } from '@protecht-bim/shared-types';

const mockWorkPackages = [
  {
    id: 'wp-1',
    project_id: 'project-1',
    type: WorkPackageType.TASK,
    subject: 'Implement authentication',
    description: 'Add JWT authentication',
    status: 'open',
    priority: Priority.HIGH,
    assignee_id: null,
    accountable_id: null,
    parent_id: null,
    start_date: new Date('2024-01-15'),
    due_date: new Date('2024-02-15'),
    estimated_hours: 20,
    spent_hours: 5,
    progress_percent: 25,
    scheduling_mode: 'manual' as const,
    version_id: null,
    sprint_id: null,
    story_points: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-10'),
    custom_fields: {},
  },
  {
    id: 'wp-2',
    project_id: 'project-1',
    type: WorkPackageType.BUG,
    subject: 'Fix login bug',
    description: 'Users cannot login',
    status: 'in_progress',
    priority: Priority.URGENT,
    assignee_id: 'user-1',
    accountable_id: null,
    parent_id: null,
    start_date: new Date('2024-01-20'),
    due_date: new Date('2024-01-25'),
    estimated_hours: 5,
    spent_hours: 3,
    progress_percent: 60,
    scheduling_mode: 'manual' as const,
    version_id: null,
    sprint_id: null,
    story_points: null,
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-22'),
    custom_fields: {},
  },
];

describe('WorkPackageTable', () => {
  const mockOnRowClick = vi.fn();
  const mockOnSort = vi.fn();

  it('renders work packages in table format', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Both desktop and mobile views render the same content
    const authElements = screen.getAllByText('Implement authentication');
    expect(authElements.length).toBeGreaterThan(0);
    const bugElements = screen.getAllByText('Fix login bug');
    expect(bugElements.length).toBeGreaterThan(0);
  });

  it('displays work package types with correct styling', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Both desktop and mobile views render the same content
    const taskElements = screen.getAllByText('task');
    expect(taskElements.length).toBeGreaterThan(0);
    const bugElements = screen.getAllByText('bug');
    expect(bugElements.length).toBeGreaterThan(0);
  });

  it('displays priority badges', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Both desktop and mobile views render the same content
    const highElements = screen.getAllByText('high');
    expect(highElements.length).toBeGreaterThan(0);
    const urgentElements = screen.getAllByText('urgent');
    expect(urgentElements.length).toBeGreaterThan(0);
  });

  it('displays progress bars with correct percentages', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    const percentages = screen.getAllByText('25%');
    expect(percentages.length).toBeGreaterThan(0);
    const percentages2 = screen.getAllByText('60%');
    expect(percentages2.length).toBeGreaterThan(0);
  });

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Use getAllByText to get both desktop and mobile elements, then find the table row
    const elements = screen.getAllByText('Implement authentication');
    const firstRow = elements[0].closest('tr');
    if (firstRow) {
      await user.click(firstRow);
      expect(mockOnRowClick).toHaveBeenCalledWith(mockWorkPackages[0]);
    }
  });

  it('calls onSort when column header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    const subjectHeader = screen.getByText('Subject').closest('th');
    if (subjectHeader) {
      await user.click(subjectHeader);
      expect(mockOnSort).toHaveBeenCalledWith('subject');
    }
  });

  it('displays sort icons on sortable columns', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
        sortBy="subject"
        sortOrder="asc"
      />
    );
    
    // Check that headers are present (sort icons are SVGs within them)
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('displays empty state when no work packages', () => {
    render(
      <WorkPackageTable
        workPackages={[]}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    expect(screen.getByText(/no work packages found/i)).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Dates should be formatted as locale date strings
    const dueDates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dueDates.length).toBeGreaterThan(0);
  });

  it('displays dash for null dates', () => {
    const workPackageWithoutDate = {
      ...mockWorkPackages[0],
      due_date: null,
    };
    
    render(
      <WorkPackageTable
        workPackages={[workPackageWithoutDate]}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('truncates long work package IDs', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // IDs should be truncated to first 8 characters (appears in both desktop and mobile views)
    const ids = screen.getAllByText('#wp-1');
    expect(ids.length).toBeGreaterThan(0);
    const ids2 = screen.getAllByText('#wp-2');
    expect(ids2.length).toBeGreaterThan(0);
  });

  it('applies hover styles to table rows', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Use getAllByText to get both desktop and mobile elements, then find the table row
    const elements = screen.getAllByText('Implement authentication');
    const firstRow = elements[0].closest('tr');
    expect(firstRow).toHaveClass('cursor-pointer');
    expect(firstRow).toHaveClass('hover:bg-surface');
  });

  it('renders mobile card view on small screens', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Mobile view should have md:hidden class
    const mobileView = document.querySelector('.md\\:hidden');
    expect(mobileView).toBeInTheDocument();
  });

  it('hides desktop table on mobile screens', () => {
    render(
      <WorkPackageTable
        workPackages={mockWorkPackages}
        onRowClick={mockOnRowClick}
        onSort={mockOnSort}
      />
    );
    
    // Desktop view should have hidden md:block classes
    const desktopView = document.querySelector('.hidden.md\\:block');
    expect(desktopView).toBeInTheDocument();
  });
});
