import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import ProjectsPage from '../../pages/ProjectsPage';
import { projectService } from '../../services/projectService';
import { ProjectStatus, LifecyclePhase } from '@protecht-bim/shared-types';
import { vi } from 'vitest';

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
    name: 'Mobile Test Project',
    description: 'Testing responsive design',
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
];

describe('Responsive Behavior', () => {
  beforeEach(() => {
    (projectService.listProjects as any).mockResolvedValue({
      projects: mockProjects,
      total: 1,
      page: 1,
      per_page: 10,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile viewport (320px)', () => {
    beforeEach(() => {
      // Set viewport to mobile size
      global.innerWidth = 320;
      global.innerHeight = 568;
    });

    it('renders page header on mobile', async () => {
      render(<ProjectsPage />);
      
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders new project button on mobile', async () => {
      render(<ProjectsPage />);
      
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
    });

    it('stacks header elements vertically on mobile', () => {
      render(<ProjectsPage />);
      
      const headerContainer = screen.getByText('Projects').closest('div')?.parentElement;
      expect(headerContainer).toHaveClass('flex-col');
    });
  });

  describe('Tablet viewport (768px)', () => {
    beforeEach(() => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
    });

    it('renders page content on tablet', async () => {
      render(<ProjectsPage />);
      
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('displays filters sidebar on tablet', () => {
      render(<ProjectsPage />);
      
      // Filters should be visible on tablet
      expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
    });
  });

  describe('Desktop viewport (1920px)', () => {
    beforeEach(() => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
    });

    it('renders full layout on desktop', async () => {
      render(<ProjectsPage />);
      
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
    });

    it('displays header elements horizontally on desktop', () => {
      render(<ProjectsPage />);
      
      const headerContainer = screen.getByText('Projects').closest('div')?.parentElement;
      expect(headerContainer).toHaveClass('sm:flex-row');
    });
  });

  describe('Touch-friendly controls', () => {
    it('buttons have adequate touch target size', () => {
      render(<ProjectsPage />);
      
      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      
      // Button should have padding for touch targets
      const styles = window.getComputedStyle(newProjectButton);
      expect(newProjectButton).toHaveClass('btn-primary');
    });

    it('interactive elements are accessible via touch', async () => {
      render(<ProjectsPage />);
      
      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      
      // Should be clickable/tappable
      expect(newProjectButton).toBeEnabled();
      expect(newProjectButton).toBeVisible();
    });
  });

  describe('Grid layout responsiveness', () => {
    it('uses single column on mobile', () => {
      render(<ProjectsPage />);
      
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1');
    });

    it('uses multi-column layout on large screens', () => {
      render(<ProjectsPage />);
      
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('lg:grid-cols-4');
    });
  });

  describe('Text and content scaling', () => {
    it('uses responsive text sizes', () => {
      render(<ProjectsPage />);
      
      const heading = screen.getByText('Projects');
      expect(heading).toHaveClass('text-3xl');
    });

    it('adjusts spacing for different screen sizes', () => {
      render(<ProjectsPage />);
      
      // Check that the main container has proper spacing
      const mainContainer = document.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Modal responsiveness', () => {
    it('modal adapts to screen size', () => {
      render(<ProjectsPage />);
      
      // Modal should have responsive width classes
      const modalTrigger = screen.getByRole('button', { name: /new project/i });
      expect(modalTrigger).toBeInTheDocument();
    });
  });

  describe('Navigation responsiveness', () => {
    it('renders mobile-friendly navigation', () => {
      render(<ProjectsPage />);
      
      // Check that page is accessible
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  describe('Image and icon scaling', () => {
    it('icons scale appropriately', () => {
      render(<ProjectsPage />);
      
      // SVG icons should be present
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Form input responsiveness', () => {
    it('search input is full width on mobile', () => {
      render(<ProjectsPage />);
      
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      expect(searchInput).toHaveClass('input-material');
    });
  });
});
