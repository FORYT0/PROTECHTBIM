import React, { useState } from 'react';
import './CommentThread.css';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  isLoading?: boolean;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  onAddComment,
  isLoading = false,
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    await onAddComment(commentText, replyingTo || undefined);
    setCommentText('');
    setReplyingTo(null);
  };

  return (
    <div className="comment-thread">
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-avatar">{comment.userName.charAt(0).toUpperCase()}</div>
            <div className="comment-content">
              <div className="comment-header">
                <strong>{comment.userName}</strong>
                <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="comment-text">{comment.content}</p>
              <button
                className="reply-button"
                onClick={() => setReplyingTo(comment.id)}
              >
                Reply
              </button>
              {comment.replies && comment.replies.length > 0 && (
                <div className="replies">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply-item">
                      <div className="reply-avatar">{reply.userName.charAt(0).toUpperCase()}</div>
                      <div className="reply-content">
                        <div className="reply-header">
                          <strong>{reply.userName}</strong>
                          <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="reply-text">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="comment-form">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
          disabled={isLoading}
          rows={3}
        />
        <div className="form-actions">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !commentText.trim()}
            className="btn btn-primary"
          >
            {isLoading ? 'Posting...' : replyingTo ? 'Reply' : 'Comment'}
          </button>
          {replyingTo && (
            <button
              onClick={() => {
                setReplyingTo(null);
                setCommentText('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
