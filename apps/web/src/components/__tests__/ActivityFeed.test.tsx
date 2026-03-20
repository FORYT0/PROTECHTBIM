import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActivityFeed } from './ActivityFeed';
import { ActivityItem } from './ActivityItem';
import { ActivityFilters } from './ActivityFilters';
import { Activity, ActivityActionType, ActivityEntityType } from '../services/ActivityService';

// Mock ActivityService
jest.mock('../services/ActivityService', () => {
  return jest.fn().mockImplementation(() => ({
    getProjectActivities: jest.fn().mockResolvedValue({
      activities: [
        {
          id: '1',
          project_id: 'proj-1',
          user_id: 'user-1',
          user_name: 'John Doe',
          action_type: ActivityActionType.CREATED,
          entity_type: ActivityEntityType.WORK_PACKAGE,
          entity_id: 'wp-1',
          description: 'Created work package',
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    }),
    getWorkPackageActivities: jest.fn().mockResolvedValue({
      activities: [],
      total: 0,
      page: 1,
      per_page: 20,
    }),
    getUserActivityFeed: jest.fn().mockResolvedValue({
      activities: [],
      total: 0,
      page: 1,
      per_page: 20,
    }),
    getAvailableFilters: jest.fn().mockResolvedValue({
      action_types: Object.values(ActivityActionType),
      entity_types: Object.values(ActivityEntityType),
    }),
  }));
});

describe('Activity Feed Components', () => {
  describe('ActivityItem Component', () => {
    it('should render activity item with all information', () => {
      const activity: Activity = {
        id: '1',
        project_id: 'proj-1',
        user_id: 'user-1',
        user_name: 'John Doe',
        action_type: ActivityActionType.CREATED,
        entity_type: ActivityEntityType.WORK_PACKAGE,
        entity_id: 'wp-1',
        description: 'Created a new work package',
        created_at: new Date().toISOString(),
      };

      render(<ActivityItem activity={activity} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Work Package')).toBeInTheDocument();
      expect(screen.getByText('Created a new work package')).toBeInTheDocument();
    });

    it('should display relative time correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const activity: Activity = {
        id: '1',
        project_id: 'proj-1',
        user_id: 'user-1',
        user_name: 'Jane Smith',
        action_type: ActivityActionType.UPDATED,
        entity_type: ActivityEntityType.PROJECT,
        entity_id: 'proj-1',
        description: 'Updated project',
        created_at: oneHourAgo.toISOString(),
      };

      render(<ActivityItem activity={activity} />);
      expect(screen.getByText(/1h ago/)).toBeInTheDocument();
    });

    it('should render metadata when present', () => {
      const activity: Activity = {
        id: '1',
        project_id: 'proj-1',
        user_id: 'user-1',
        user_name: 'Bob Johnson',
        action_type: ActivityActionType.UPDATED,
        entity_type: ActivityEntityType.WORK_PACKAGE,
        entity_id: 'wp-1',
        description: 'Changed status',
        metadata: {
          oldValue: 'new',
          newValue: 'in-progress',
        },
        created_at: new Date().toISOString(),
      };

      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('From:')).toBeInTheDocument();
      expect(screen.getByText('To:')).toBeInTheDocument();
      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
    });

    it('should display default user when name is missing', () => {
      const activity: Activity = {
        id: '1',
        project_id: 'proj-1',
        user_id: 'user-1',
        action_type: ActivityActionType.CREATED,
        entity_type: ActivityEntityType.PROJECT,
        entity_id: 'proj-1',
        description: 'Created project',
        created_at: new Date().toISOString(),
      };

      render(<ActivityItem activity={activity} />);
      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    it('should apply correct color class for different action types', () => {
      const actions = [
        { action: ActivityActionType.CREATED, class: 'action-created' },
        { action: ActivityActionType.DELETED, class: 'action-deleted' },
        { action: ActivityActionType.COMMENTED, class: 'action-commented' },
      ];

      actions.forEach(({ action, class: className }) => {
        const { container } = render(
          <ActivityItem
            activity={{
              id: '1',
              project_id: 'proj-1',
              user_id: 'user-1',
              user_name: 'Test User',
              action_type: action,
              entity_type: ActivityEntityType.PROJECT,
              entity_id: 'proj-1',
              description: 'Test',
              created_at: new Date().toISOString(),
            }}
          />
        );

        const iconContainer = container.querySelector('.activity-icon-container');
        expect(iconContainer).toHaveClass(className);
      });
    });
  });

  describe('ActivityFilters Component', () => {
    it('should render filter toggle button', () => {
      render(
        <ActivityFilters
          onFiltersChange={jest.fn()}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should show filter panel when toggle is clicked', async () => {
      render(
        <ActivityFilters
          onFiltersChange={jest.fn()}
        />
      );

      const toggleButton = screen.getByText('Filters').closest('button');
      fireEvent.click(toggleButton!);

      await waitFor(() => {
        expect(screen.getByLabelText('Action Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Entity Type')).toBeInTheDocument();
        expect(screen.getByLabelText('From')).toBeInTheDocument();
        expect(screen.getByLabelText('To')).toBeInTheDocument();
      });
    });

    it('should call onFiltersChange when Apply Filters is clicked', async () => {
      const onFiltersChange = jest.fn();
      render(
        <ActivityFilters
          onFiltersChange={onFiltersChange}
        />
      );

      const toggleButton = screen.getByText('Filters').closest('button');
      fireEvent.click(toggleButton!);

      await waitFor(() => {
        const applyButton = screen.getByText('Apply Filters');
        fireEvent.click(applyButton);
      });

      expect(onFiltersChange).toHaveBeenCalled();
    });

    it('should show filter badge when filters are applied', async () => {
      render(
        <ActivityFilters
          onFiltersChange={jest.fn()}
        />
      );

      const toggleButton = screen.getByText('Filters').closest('button');
      fireEvent.click(toggleButton!);

      await waitFor(() => {
        const actionSelect = screen.getByLabelText('Action Type') as HTMLSelectElement;
        fireEvent.change(actionSelect, { target: { value: ActivityActionType.CREATED } });
      });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('ActivityFeed Component', () => {
    it('should render activity feed with project ID', async () => {
      render(
        <ActivityFeed
          projectId="proj-1"
          title="Project Activities"
        />
      );

      expect(screen.getByText('Project Activities')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(
        <ActivityFeed
          projectId="proj-1"
        />
      );

      expect(screen.getByText(/Loading activities/)).toBeInTheDocument();
    });

    it('should display activity count', async () => {
      render(
        <ActivityFeed
          projectId="proj-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1 activities')).toBeInTheDocument();
      });
    });

    it('should show empty state when no activities', async () => {
      render(
        <ActivityFeed
          projectId="proj-1"
          userFeed={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No activities found')).toBeInTheDocument();
      });
    });

    it('should show error message when projectId is missing for project feed', () => {
      render(
        <ActivityFeed
          projectId={undefined}
        />
      );

      expect(screen.getByText('Project ID is required')).toBeInTheDocument();
    });

    it('should render pagination when there are multiple pages', async () => {
      render(
        <ActivityFeed
          projectId="proj-1"
          pageSize={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('← Prev')).toBeInTheDocument();
        expect(screen.getByText('Next →')).toBeInTheDocument();
      });
    });

    it('should have disabled previous button on first page', async () => {
      render(
        <ActivityFeed
          projectId="proj-1"
        />
      );

      await waitFor(() => {
        const prevButton = screen.getByText('← Prev').closest('button');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should render filter component', async () => {
      render(
        <ActivityFeed
          projectId="proj-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });
    });
  });
});
