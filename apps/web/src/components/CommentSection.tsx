import { useState, useEffect } from 'react';
import { commentService, Comment } from '../services/CommentService';
import { MentionInput } from './MentionInput';
import toast from 'react-hot-toast';

interface CommentSectionProps {
    entityType: string;
    entityId: string;
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [entityType, entityId]);

    const loadComments = async () => {
        try {
            setIsLoading(true);
            const data = await commentService.getComments(entityType, entityId);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            const added = await commentService.addComment({
                entityType,
                entityId,
                content: newComment,
            });
            setComments([added, ...comments]);
            setNewComment('');
            toast.success('Comment added');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-6 pt-6 border-t border-surface-light">
            <h3 className="text-lg font-semibold text-white">Comments</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
                <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="Write a comment... Use @ to mention someone"
                    className="w-full bg-surface-light border border-surface-elevated rounded-lg p-3 text-white placeholder-hint focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none min-h-[100px]"
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="btn-primary"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </form>

            {/* Comment List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-hint text-center py-4">No comments yet. Start the conversation!</p>
                ) : (
                    comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} onUpdate={loadComments} />
                    ))
                )}
            </div>
        </div>
    );
}

function renderContent(content: string, mentions: any[] | null) {
    if (!mentions || mentions.length === 0) return content;

    const parts = content.split(/(@\[[0-9a-fA-F-]{36}\])/g);
    return parts.map((part, i) => {
        const match = part.match(/@\[([0-9a-fA-F-]{36})\]/);
        if (match) {
            const userId = match[1];
            const mention = mentions.find((m) => m.id === userId);
            return (
                <span key={i} className="text-primary-400 font-medium cursor-pointer hover:underline">
                    @{mention ? mention.name : 'Unknown User'}
                </span>
            );
        }
        return part;
    });
}

function CommentItem({ comment, onUpdate }: { comment: Comment; onUpdate: () => void }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    const handleReply = async () => {
        if (!replyContent.trim()) return;
        try {
            await commentService.addComment({
                entityType: comment.entityType,
                entityId: comment.entityId,
                content: replyContent,
                parentId: comment.id,
            });
            setReplyContent('');
            setIsReplying(false);
            onUpdate();
            toast.success('Reply added');
        } catch (error) {
            toast.error('Failed to add reply');
        }
    };

    return (
        <div className="group space-y-3">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-white uppercase border border-surface-elevated">
                        {comment.user?.name?.charAt(0) || '?'}
                    </div>
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{comment.user?.name}</span>
                        <span className="text-xs text-hint">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-secondary leading-relaxed">
                        {renderContent(comment.content, comment.mentions)}
                    </div>
                    <div className="flex items-center space-x-4 pt-1">
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs text-hint hover:text-primary-400 transition-colors"
                        >
                            Reply
                        </button>
                        {/* Reactions can be added here */}
                    </div>
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 border-l-2 border-surface-light pl-4 space-y-4">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-surface-elevated flex items-center justify-center text-[10px] font-bold text-white uppercase border border-surface-elevated">
                                    {reply.user?.name?.charAt(0) || '?'}
                                </div>
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white">{reply.user?.name}</span>
                                    <span className="text-[10px] text-hint">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xs text-secondary leading-relaxed">
                                    {renderContent(reply.content, reply.mentions)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Input */}
            {isReplying && (
                <div className="ml-11 space-y-2 pt-2">
                    <MentionInput
                        value={replyContent}
                        onChange={setReplyContent}
                        placeholder="Write a reply..."
                        className="w-full bg-surface-elevated border border-surface-elevated rounded-lg p-2 text-sm text-white placeholder-hint outline-none focus:ring-1 focus:ring-primary-500 min-h-[60px]"
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setIsReplying(false)}
                            className="px-3 py-1 text-xs text-hint hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReply}
                            disabled={!replyContent.trim()}
                            className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded transition-colors"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
