import { useState, useCallback } from 'react';
import { attachmentService } from '../services/AttachmentService';
import toast from 'react-hot-toast';

interface FileUploadZoneProps {
    entityType: string;
    entityId: string;
    onUploadSuccess: (attachment: any) => void;
}

export default function FileUploadZone({ entityType, entityId, onUploadSuccess }: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (file: File) => {
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File size exceeds 100MB limit');
            return;
        }

        setIsUploading(true);
        try {
            const attachment = await attachmentService.upload(entityType, entityId, file);
            toast.success('File uploaded successfully');
            onUploadSuccess(attachment);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
        }
    }, [entityType, entityId]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    };

    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center ${isDragging
                    ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
                    : 'border-surface-elevated hover:border-surface-tertiary bg-surface-tertiary/50'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <input
                type="file"
                onChange={onFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
            />

            <div className="flex flex-col items-center">
                {isUploading ? (
                    <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                ) : (
                    <svg className="w-12 h-12 text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                )}

                <p className="text-sm font-medium text-text-primary">
                    {isUploading ? 'Uploading file...' : 'Click or drag file to upload'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                    Support for IFC, PDF, Images up to 100MB
                </p>
            </div>
        </div>
    );
}
