import { useState, useEffect } from 'react';
import { attachmentService, Attachment } from '../services/AttachmentService';
import AttachmentList from './AttachmentList';
import FileUploadZone from './FileUploadZone';
import toast from 'react-hot-toast';

interface AttachmentSectionProps {
    entityType: string;
    entityId: string;
}

export default function AttachmentSection({ entityType, entityId }: AttachmentSectionProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAttachments();
    }, [entityId, entityType]);

    const loadAttachments = async () => {
        setIsLoading(true);
        try {
            const data = await attachmentService.getByEntity(entityType, entityId);
            setAttachments(data);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this attachment?')) return;

        try {
            await attachmentService.delete(id);
            toast.success('Attachment deleted');
            setAttachments(attachments.filter(a => a.id !== id));
        } catch (error) {
            toast.error('Failed to delete attachment');
        }
    };

    const handleUploadSuccess = (newAttachment: Attachment) => {
        setAttachments([newAttachment, ...attachments]);
    };

    return (
        <div className="mt-8 pt-8 border-t border-surface-elevated">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachments
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded bg-surface-tertiary text-text-secondary">
                    {attachments.length} files
                </span>
            </div>

            <div className="space-y-6">
                <FileUploadZone
                    entityType={entityType}
                    entityId={entityId}
                    onUploadSuccess={handleUploadSuccess}
                />

                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <AttachmentList
                        attachments={attachments}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}
