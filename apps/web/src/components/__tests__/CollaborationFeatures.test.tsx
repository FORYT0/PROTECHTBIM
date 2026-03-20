import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationBell } from './NotificationBell';
import { CommentThread } from './CommentThread';
import { FileUpload } from './FileUpload';
import { WikiPage } from './WikiPage';
import NotificationService, { Notification, NotificationType } from '../services/NotificationService';

// Mock NotificationService
jest.mock('../services/NotificationService');

describe('Collaboration Features Components', () => {
  describe('NotificationBell Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render bell button', () => {
      (NotificationService.getUnreadCount as jest.Mock).mockReturnValue(0);
      (NotificationService.getNotifications as jest.Mock).mockReturnValue([]);
      (NotificationService.on as jest.Mock).mockImplementation(() => {});
      (NotificationService.off as jest.Mock).mockImplementation(() => {});

      render(<NotificationBell />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show badge with unread count', () => {
      (NotificationService.getUnreadCount as jest.Mock).mockReturnValue(5);
      (NotificationService.getNotifications as jest.Mock).mockReturnValue([]);
      (NotificationService.on as jest.Mock).mockImplementation(() => {});
      (NotificationService.off as jest.Mock).mockImplementation(() => {});

      render(<NotificationBell />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show notification preview on click', async () => {
      const notification: Notification = {
        id: '1',
        type: NotificationType.ACTIVITY,
        title: 'Test Notification',
        message: 'This is a test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      (NotificationService.getUnreadCount as jest.Mock).mockReturnValue(1);
      (NotificationService.getNotifications as jest.Mock).mockReturnValue([notification]);
      (NotificationService.on as jest.Mock).mockImplementation(() => {});
      (NotificationService.off as jest.Mock).mockImplementation(() => {});

      render(<NotificationBell />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Test Notification')).toBeInTheDocument();
      });
    });
  });

  describe('CommentThread Component', () => {
    it('should render comments list', () => {
      const comments = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John',
          content: 'Great work!',
          createdAt: new Date().toISOString(),
        },
      ];

      render(
        <CommentThread
          comments={comments}
          onAddComment={jest.fn()}
        />
      );

      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Great work!')).toBeInTheDocument();
    });

    it('should allow adding comments', async () => {
      const onAddComment = jest.fn().mockResolvedValue(undefined);
      const { rerender } = render(
        <CommentThread
          comments={[]}
          onAddComment={onAddComment}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a comment...');
      fireEvent.change(textarea, { target: { value: 'New comment' } });

      const submitButton = screen.getByText('Comment');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onAddComment).toHaveBeenCalledWith('New comment', undefined);
      });
    });

    it('should support nested replies', () => {
      const comments = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John',
          content: 'Great work!',
          createdAt: new Date().toISOString(),
          replies: [
            {
              id: '2',
              userId: 'user2',
              userName: 'Jane',
              content: 'Thanks!',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ];

      render(
        <CommentThread
          comments={comments}
          onAddComment={jest.fn()}
        />
      );

      expect(screen.getByText('Thanks!')).toBeInTheDocument();
    });
  });

  describe('FileUpload Component', () => {
    it('should render upload button', () => {
      render(
        <FileUpload
          onFileUpload={jest.fn()}
        />
      );

      expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
    });

    it('should handle file selection', async () => {
      const onFileUpload = jest.fn().mockResolvedValue({
        id: '1',
        name: 'test.pdf',
        size: 1024,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'user1',
        url: 'http://example.com/test.pdf',
      });

      const { container } = render(
        <FileUpload
          onFileUpload={onFileUpload}
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(onFileUpload).toHaveBeenCalled();
      });
    });

    it('should validate file size', async () => {
      const onFileUpload = jest.fn();
      const { container } = render(
        <FileUpload
          onFileUpload={onFileUpload}
          maxSize={1024} // 1KB
        />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['a'.repeat(2048)], 'large.pdf', { type: 'application/pdf' });

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/File size must be/)).toBeInTheDocument();
      });
    });
  });

  describe('WikiPage Component', () => {
    it('should render wiki page', () => {
      render(
        <WikiPage
          projectId="proj1"
          readOnly={true}
        />
      );

      expect(screen.getByText(/Welcome to Wiki/)).toBeInTheDocument();
    });

    it('should allow editing when not read-only', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(
        <WikiPage
          projectId="proj1"
          onSave={onSave}
          readOnly={false}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Page title')).toBeInTheDocument();
      });
    });

    it('should save wiki changes', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(
        <WikiPage
          projectId="proj1"
          onSave={onSave}
          readOnly={false}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Page title')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Page title') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });
});
