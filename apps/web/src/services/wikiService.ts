import axios from 'axios';
import { getAuthToken } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface WikiPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    projectId: string;
    parentId: string | null;
    orderIndex: number;
    createdById: string;
    lastEditedById: string | null;
    createdAt: string;
    updatedAt: string;
    children?: WikiPage[];
}

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const wikiService = {
    getWikiTree: async (projectId: string): Promise<WikiPage[]> => {
        const response = await api.get(`/projects/${projectId}/wiki`);
        return response.data.tree;
    },

    getPageBySlug: async (projectId: string, slug: string): Promise<WikiPage> => {
        const response = await api.get(`/projects/${projectId}/wiki/${slug}`);
        return response.data.page;
    },

    createPage: async (projectId: string, data: Partial<WikiPage>): Promise<WikiPage> => {
        const response = await api.post(`/projects/${projectId}/wiki`, data);
        return response.data.page;
    },

    updatePage: async (id: string, data: Partial<WikiPage>): Promise<WikiPage> => {
        const response = await api.patch(`/wiki/${id}`, data);
        return response.data.page;
    },

    deletePage: async (id: string): Promise<void> => {
        await api.delete(`/wiki/${id}`);
    },
};
