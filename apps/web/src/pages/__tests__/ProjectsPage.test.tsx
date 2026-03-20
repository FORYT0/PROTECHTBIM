import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import ProjectsPage from '../ProjectsPage';
import { projectService } from '../../services/projectService';
import { ProjectStatus, LifecyclePhase } from '@protecht-bim/shared-types';

// Mock the project service
vi.mock('../../services/projectService', () => ({
  projectService: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
    toggleFavorite: vi.fn(),
  },
}));

const mockProjects = [
  {
    id: '1',
    name: 'Test Project 1',
    description: 'Description for project 1',
    status: ProjectStatus.ACTIVE,
    lifecycle_phase: LifecyclePhase.EXECUTION,
    is_favorite: false,
    owner_id: 'user1',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    program_id: null,
    portfolio_id: null,
    template_id: null,
    custom_fields: {},
  },
  {
    id: '2',
    name: 'Test Project 2',
    description: 'Description for project 2',
    status: ProjectStatus.ON_HOLD,
    lifecycle_phase: LifecyclePhase.PLANNING,
    is_favorite: true,
    owner_id: 'user1',
    start_date: new Date('2024-02-01'),
    end_date: new Date('2024-11-30'),
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-01'),
    program_id: null,
    portfolio_id: null,
    template_id: null,
    custom_fields: {},
  },
];

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectService.listProjects as any).mockResolvedValue({
      projects: mockProjects,
      total: 2,
      page: 1,
      per_page: 10,
    });
  });

  it('renders page header with title and new project button', async () => {
    render(<ProjectsPage />);
    
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText(/manage your construction projects/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });

  it('displays loading state while fetching projects', () => {
    render(<ProjectsPage />);
    
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
  });

  it('renders project list after loading', async () => {
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });

  it('displays project descriptions', async () => {
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Description for project 1')).toBeInTheDocument();
      expect(screen.getByText('Description for project 2')).toBeInTheDocument();
    });
  });

  it('filters projects by search term', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/search projects/i);
    await user.type(searchInput, 'Project 1');
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
    });
  });

  it('filters projects by status', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
    
    // Find and click the Active status filter
    const activeCheckbox = screen.getByLabelText(/active/i);
    await user.click(activeCheckbox);
    
    await waitFor(() => {
      expect(projectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          status: [ProjectStatus.ACTIVE],
        })
      );
    });
  });

  it('filters projects by favorites', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
    
    const favoritesCheckbox = screen.getByLabelText(/favorites only/i);
    await user.click(favoritesCheckbox);
    
    await waitFor(() => {
      expect(projectService.listProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          favorites_only: true,
        })
      );
    });
  });

  it('opens create project modal when new project button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);
    
    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/create project/i)).toBeInTheDocument();
    });
  });

  it('creates a new project and refreshes the list', async () => {
    const user = userEvent.setup();
    const newProject = {
      name: 'New Project',
      description: 'New project description',
    };
    
    (projectService.createProject as any).mockResolvedValue({
      id: '3',
      ...newProject,
      status: ProjectStatus.ACTIVE,
      lifecycle_phase: LifecyclePhase.INITIATION,
    });
    
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
    
    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);
    
    // Fill in the form
    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(nameInput, newProject.name);
    await user.type(descriptionInput, newProject.description);
    
    const submitButton = screen.getByRole('button', { name: /save project/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(projectService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newProject.name,
          description: newProject.description,
        })
      );
      // List should be refreshed
      expect(projectService.listProjects).toHaveBeenCalledTimes(2);
    });
  });

  it('toggles project favorite status', async () => {
    const user = userEvent.setup();
    (projectService.toggleFavorite as any).mockResolvedValue(undefined);
    
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
    
    // Find the favorite button for the first project (not favorited)
    const favoriteButtons = screen.getAllByLabelText(/add to favorites|remove from favorites/i);
    await user.click(favoriteButtons[0]);
    
    await waitFor(() => {
      expect(projectService.toggleFavorite).toHaveBeenCalledWith('1', true);
    });
  });

  it('displays error message when loading projects fails', async () => {
    const errorMessage = 'Failed to load projects';
    (projectService.listProjects as any).mockRejectedValue(new Error(errorMessage));
    
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays empty state when no projects exist', async () => {
    (projectService.listProjects as any).mockResolvedValue({
      projects: [],
      total: 0,
      page: 1,
      per_page: 10,
    });
    
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
      expect(screen.getByText(/get started by creating your first project/i)).toBeInTheDocument();
    });
  });

  it('displays filtered empty state when no projects match filters', async () => {
    const user = userEvent.setup();
    render(<ProjectsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/search projects/i);
    await user.type(searchInput, 'Nonexistent Project');
    
    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
      expect(screen.getByText(/no projects match your filters/i)).toBeInTheDocument();
    });
  });
});
