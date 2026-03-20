import { attachmentService, Attachment } from '../services/AttachmentService';
import toast from 'react-hot-toast';

interface AttachmentListProps {
    attachments: Attachment[];
    onDelete: (id: string) => void;
}

export default function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
    const handleDownload = async (attachment: Attachment) => {
        try {
            const url = await attachmentService.getDownloadUrl(attachment.id);
            window.open(url, '_blank');
        } catch (error) {
            toast.error('Failed to download file');
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) {
            return (
                <svg className="w-8 h-8 text-error-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }
        if (mimeType.includes('image')) {
            return (
                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (attachments.length === 0) {
        return (
            <div className="text-center py-6 text-text-secondary text-sm border-2 border-dashed border-surface-elevated rounded-xl">
                No attachments yet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {attachments.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-tertiary border border-surface-elevated hover:bg-surface-elevated transition-colors group"
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="flex-shrink-0">
                            {getFileIcon(file.mimeType)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-text-primary truncate" title={file.fileName}>
                                {file.fileName}
                            </p>
                            <p className="text-xs text-text-secondary">
                                {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleDownload(file)}
                            className="p-2 text-text-secondary hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Download"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(file.id)}
                            className="p-2 text-text-secondary hover:text-error-light hover:bg-error-main/10 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
