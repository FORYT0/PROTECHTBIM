import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import WorkPackageFormModal from '../WorkPackageFormModal';
import { WorkPackageType } from '@protecht-bim/shared-types';

describe('WorkPackageFormModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const projectId = 'project-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('does not render when isOpen is false', () => {
    render(
      <WorkPackageFormModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    expect(screen.queryByText(/create work package/i)).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    // Check for heading specifically
    expect(screen.getByRole('heading', { name: /create work package/i })).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estimated hours/i)).toBeInTheDocument();
  });

  it('has all work package types in the type dropdown', () => {
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const typeSelect = screen.getByLabelText(/type/i);
    const options = Array.from(typeSelect.querySelectorAll('option'));
    const optionValues = options.map(opt => opt.value);
    
    expect(optionValues).toContain(WorkPackageType.TASK);
    expect(optionValues).toContain(WorkPackageType.MILESTONE);
    expect(optionValues).toContain(WorkPackageType.PHASE);
    expect(optionValues).toContain(WorkPackageType.FEATURE);
    expect(optionValues).toContain(WorkPackageType.BUG);
  });

  it('allows user to fill in form fields', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const subjectInput = screen.getByLabelText(/subject/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(subjectInput, 'Test Work Package');
    await user.type(descriptionInput, 'Test description');
    
    expect(subjectInput).toHaveValue('Test Work Package');
    expect(descriptionInput).toHaveValue('Test description');
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const typeSelect = screen.getByLabelText(/type/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const estimatedHoursInput = screen.getByLabelText(/estimated hours/i);
    
    await user.selectOptions(typeSelect, WorkPackageType.FEATURE);
    await user.type(subjectInput, 'New Feature');
    await user.type(descriptionInput, 'Feature description');
    await user.type(estimatedHoursInput, '10');
    
    const submitButton = screen.getByRole('button', { name: /create work package/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: projectId,
          type: WorkPackageType.FEATURE,
          subject: 'New Feature',
          description: 'Feature description',
          estimated_hours: 10,
        })
      );
    });
  });

  it('closes modal after successful submission', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Test Work Package');
    
    const submitButton = screen.getByRole('button', { name: /create work package/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create work package';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));
    
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Test Work Package');
    
    const submitButton = screen.getByRole('button', { name: /create work package/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Test Work Package');
    
    const submitButton = screen.getByRole('button', { name: /create work package/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const backdrop = document.querySelector('.bg-black.bg-opacity-75');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const closeButton = screen.getByLabelText(/close modal/i);
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('requires subject field', () => {
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const subjectInput = screen.getByLabelText(/subject/i);
    expect(subjectInput).toBeRequired();
  });

  it('handles date inputs correctly', async () => {
    const user = userEvent.setup();
    render(
      <WorkPackageFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        projectId={projectId}
      />
    );
    
    const startDateInput = screen.getByLabelText(/start date/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    
    await user.type(startDateInput, '2024-01-15');
    await user.type(dueDateInput, '2024-02-15');
    
    expect(startDateInput).toHaveValue('2024-01-15');
    expect(dueDateInput).toHaveValue('2024-02-15');
  });
});
