import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import KanbanBoard from '../KanbanBoard';
import { WorkPackage, WorkPackageType, Priority, BoardColumn } from '@protecht-bim/shared-types';

describe('KanbanBoard', () => {
  const mockColumns: BoardColumn[] = [
    {
      id: '1',
      board_id: 'board-1',
      name: 'To Do',
      position: 0,
      status_mapping: 'todo',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '2',
      board_id: 'board-1',
      name: 'In Progress',
      position: 1,
      status_mapping: 'in_progress',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '3',
      board_id: 'board-1',
      name: 'Done',
      position: 2,
      status_mapping: 'done',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockWorkPackages: WorkPackage[] = [
    {
      id: '1',
      project_id: 'project-1',
      type: WorkPackageType.TASK,
      subject: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: Priority.NORMAL,
      assignee_id: null,
      accountable_id: null,
      parent_id: null,
      start_date: null,
      due_date: null,
      estimated_hours: null,
      spent_hours: 0,
      progress_percent: 0,
      scheduling_mode: 'manual',
      version_id: null,
      sprint_id: null,
      story_points: null,
      created_at: new Date(),
      updated_at: new Date(),
      custom_fields: {},
      watcher_ids: [],
    },
    {
      id: '2',
      project_id: 'project-1',
      type: WorkPackageType.TASK,
      subject: 'Task 2',
      description: 'Description 2',
      status: 'in_progress',
      priority: Priority.HIGH,
      assignee_id: 'user-1',
      accountable_id: null,
      parent_id: null,
      start_date: null,
      due_date: new Date(),
      estimated_hours: null,
      spent_hours: 0,
      progress_percent: 50,
      scheduling_mode: 'manual',
      version_id: null,
      sprint_id: null,
      story_points: null,
      created_at: new Date(),
      updated_at: new Date(),
      custom_fields: {},
      watcher_ids: [],
    },
  ];

  it('renders all columns', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        workPackages={mockWorkPackages}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders work packages in correct columns', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        workPackages={mockWorkPackages}
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('displays work package count in column header', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        workPackages={mockWorkPackages}
      />
    );

    // Each column should show count
    const toDoColumn = screen.getByText('To Do').closest('div');
    expect(toDoColumn).toBeInTheDocument();
  });

  it('shows empty state when no work packages in column', () => {
    render(
      <KanbanBoard
        columns={mockColumns}
        workPackages={[]}
      />
    );

    const emptyMessages = screen.getAllByText('No work packages');
    expect(emptyMessages).toHaveLength(3); // One for each column
  });

  it('calls onWorkPackageClick when card is clicked', () => {
    const onWorkPackageClick = vi.fn();
    
    render(
      <KanbanBoard
        columns={mockColumns}
        workPackages={mockWorkPackages}
        onWorkPackageClick={onWorkPackageClick}
      />
    );

    const task1Card = screen.getByText('Task 1');
    task1Card.click();

    expect(onWorkPackageClick).toHaveBeenCalledWith(mockWorkPackages[0]);
  });
});
