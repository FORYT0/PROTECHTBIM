import apiRequest from '../utils/api';

export interface Attachment {
    id: string;
    entityType: string;
    entityId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    storageKey: string;
    uploadedById: string;
    createdAt: string;
    updatedAt: string;
    uploadedBy?: {
        id: string;
        name: string;
    };
}

export const attachmentService = {
    /**
     * Get all attachments for a specific entity
     */
    async getByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
        const response = await apiRequest(`/attachments/${entityType}/${entityId}`);
        if (!response.ok) throw new Error('Failed to fetch attachments');
        const data = await response.json();
        return data.attachments;
    },

    /**
     * Upload a file
     */
    async upload(entityType: string, entityId: string, file: File): Promise<Attachment> {
        const formData = new FormData();
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        formData.append('file', file);

        const response = await apiRequest('/attachments/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload file');
        }

        const data = await response.json();
        return data.attachment;
    },

    /**
     * Get a download URL for an attachment
     */
    async getDownloadUrl(id: string): Promise<string> {
        const response = await apiRequest(`/attachments/${id}/download`);
        if (!response.ok) throw new Error('Failed to get download URL');
        const data = await response.json();
        return data.downloadUrl;
    },

    /**
     * Delete an attachment
     */
    async delete(id: string): Promise<void> {
        const response = await apiRequest(`/attachments/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete attachment');
    },
};
