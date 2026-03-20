import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import ProjectCard from '../ProjectCard';
import { ProjectStatus, LifecyclePhase } from '@protecht-bim/shared-types';

const mockProject = {
  id: '123',
  name: 'Test Construction Project',
  description: 'A test project for construction management',
  status: ProjectStatus.ACTIVE,
  lifecycle_phase: LifecyclePhase.EXECUTION,
  is_favorite: false,
  owner_id: 'user1',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-12-20'),
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  program_id: null,
  portfolio_id: null,
  template_id: null,
  custom_fields: {},
};

describe('ProjectCard', () => {
  const mockOnToggleFavorite = vi.fn();

  it('renders project name and description', () => {
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('Test Construction Project')).toBeInTheDocument();
    expect(screen.getByText('A test project for construction management')).toBeInTheDocument();
  });

  it('displays project status badge', () => {
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays lifecycle phase badge', () => {
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('Execution')).toBeInTheDocument();
  });

  it('displays formatted start and end dates', () => {
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Dec 20, 2024')).toBeInTheDocument();
  });

  it('displays "Not set" for null dates', () => {
    const projectWithoutDates = {
      ...mockProject,
      start_date: null,
      end_date: null,
    };
    
    render(<ProjectCard project={projectWithoutDates} onToggleFavorite={mockOnToggleFavorite} />);
    
    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements).toHaveLength(2);
  });

  it('shows unfilled star icon for non-favorite projects', () => {
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('shows filled star icon for favorite projects', () => {
    const favoriteProject = { ...mockProject, is_favorite: true };
    render(<ProjectCard project={favoriteProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    const favoriteButton = screen.getByLabelText('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('calls onToggleFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    const favoriteButton = screen.getByLabelText('Add to favorites');
    await user.click(favoriteButton);
    
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('123', true);
  });

  it('calls onToggleFavorite with false when removing from favorites', async () => {
    const user = userEvent.setup();
    const favoriteProject = { ...mockProject, is_favorite: true };
    render(<ProjectCard project={favoriteProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    const favoriteButton = screen.getByLabelText('Remove from favorites');
    await user.click(favoriteButton);
    
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('123', false);
  });

  it('renders link to project detail page', () => {
    render(<ProjectCard project={mockProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    const projectLink = screen.getByRole('link', { name: 'Test Construction Project' });
    expect(projectLink).toHaveAttribute('href', '/projects/123');
  });

  it('displays correct status styling for ON_HOLD projects', () => {
    const onHoldProject = { ...mockProject, status: ProjectStatus.ON_HOLD };
    render(<ProjectCard project={onHoldProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('On Hold')).toBeInTheDocument();
  });

  it('displays correct status styling for COMPLETED projects', () => {
    const completedProject = { ...mockProject, status: ProjectStatus.COMPLETED };
    render(<ProjectCard project={completedProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays correct status styling for ARCHIVED projects', () => {
    const archivedProject = { ...mockProject, status: ProjectStatus.ARCHIVED };
    render(<ProjectCard project={archivedProject} onToggleFavorite={mockOnToggleFavorite} />);
    
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const longDescription = 'A'.repeat(200);
    const projectWithLongDesc = { ...mockProject, description: longDescription };
    
    render(<ProjectCard project={projectWithLongDesc} onToggleFavorite={mockOnToggleFavorite} />);
    
    const descElement = screen.getByText(longDescription);
    expect(descElement).toHaveClass('line-clamp-2');
  });
});
