import apiRequest from '../utils/api';

export interface UserWorkload {
    userId: string;
    userName: string;
    totalEstimatedHours: number;
    capacityHours: number;
    utilizationPercentage: number;
    workPackages: {
        id: string;
        subject: string;
        estimatedHours: number;
        startDate: string | null;
        dueDate: string | null;
    }[];
}

export interface ProjectResourceUtilization {
    projectId: string;
    projectName: string;
    teamWorkload: UserWorkload[];
    totalProjectEstimatedHours: number;
}

export const resourceService = {
    /**
     * Get workload for a specific user over a date range
     */
    async getUserWorkload(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<UserWorkload> {
        const response = await apiRequest(
            `/resources/workload/${userId}?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch user workload');
        }

        const data = await response.json();
        return data.workload;
    },

    /**
     * Get resource utilization for all team members in a project
     */
    async getProjectResourceUtilization(
        projectId: string,
        startDate: string,
        endDate: string
    ): Promise<ProjectResourceUtilization> {
        const response = await apiRequest(
            `/resources/projects/${projectId}/utilization?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch project utilization');
        }

        const data = await response.json();
        return data.utilization;
    },
};
