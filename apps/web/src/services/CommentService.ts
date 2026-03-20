export interface Comment {
    id: string;
    entityType: string;
    entityId: string;
    userId: string;
    parentId: string | null;
    content: string;
    mentions: string[];
    reactions: Record<string, number>;
    editedAt: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar_url?: string;
    };
    replies?: Comment[];
}

class CommentService {
    private apiUrl: string;

    constructor() {
        this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    }

    private getHeaders() {
        const tokens = localStorage.getItem('auth_tokens');
        const accessToken = tokens ? JSON.parse(tokens).accessToken : null;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        };
    }

    async getComments(entityType: string, entityId: string): Promise<Comment[]> {
        const response = await fetch(`${this.apiUrl}/comments/${entityType}/${entityId}`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch comments');
        return response.json();
    }

    async addComment(data: {
        entityType: string;
        entityId: string;
        content: string;
        parentId?: string | null;
    }): Promise<Comment> {
        const response = await fetch(`${this.apiUrl}/comments`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to add comment');
        return response.json();
    }

    async updateComment(id: string, content: string): Promise<Comment> {
        const response = await fetch(`${this.apiUrl}/comments/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error('Failed to update comment');
        return response.json();
    }

    async deleteComment(id: string): Promise<void> {
        const response = await fetch(`${this.apiUrl}/comments/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete comment');
    }

    async reactToComment(id: string, emoji: string, action: 'add' | 'remove' = 'add'): Promise<Comment> {
        const response = await fetch(`${this.apiUrl}/comments/${id}/reactions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ emoji, action }),
        });
        if (!response.ok) throw new Error('Failed to update reaction');
        return response.json();
    }

    async searchUsers(query: string): Promise<any[]> {
        const response = await fetch(`${this.apiUrl}/users/search?q=${encodeURIComponent(query)}`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to search users');
        return response.json();
    }
}

export const commentService = new CommentService();
