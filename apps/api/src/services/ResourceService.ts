import { Repository, Between, IsNull, Not } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { WorkPackage } from '../entities/WorkPackage';
import { Project } from '../entities/Project';

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
        startDate: Date | null;
        dueDate: Date | null;
    }[];
}

export interface ProjectResourceUtilization {
    projectId: string;
    projectName: string;
    teamWorkload: UserWorkload[];
    totalProjectEstimatedHours: number;
}

export class ResourceService {
    private userRepository: Repository<User>;
    private workPackageRepository: Repository<WorkPackage>;
    private projectRepository: Repository<Project>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.workPackageRepository = AppDataSource.getRepository(WorkPackage);
        this.projectRepository = AppDataSource.getRepository(Project);
    }

    /**
     * Get workload for a specific user over a date range
     */
    async getUserWorkload(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<UserWorkload> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        // Find work packages assigned to the user that overlap with the date range
        // A WP overlaps if its start_date <= endDate AND its due_date >= startDate
        // For simplicity in this logic, we'll fetch all WPs with any date in the range
        const workPackages = await this.workPackageRepository.find({
            where: [
                {
                    assigneeId: userId,
                    startDate: Between(startDate, endDate),
                },
                {
                    assigneeId: userId,
                    dueDate: Between(startDate, endDate),
                }
            ],
            relations: ['project'],
        });

        const totalEstimatedHours = workPackages.reduce(
            (sum, wp) => sum + (Number(wp.estimatedHours) || 0),
            0
        );

        // Calculate capacity for the period (assuming weekly capacity is distributed evenly)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const periodCapacityHours = (user.weeklyCapacityHours / 7) * diffDays;

        return {
            userId: user.id,
            userName: user.name,
            totalEstimatedHours,
            capacityHours: periodCapacityHours,
            utilizationPercentage: (totalEstimatedHours / periodCapacityHours) * 100,
            workPackages: workPackages.map(wp => ({
                id: wp.id,
                subject: wp.subject,
                estimatedHours: Number(wp.estimatedHours) || 0,
                startDate: wp.startDate || null,
                dueDate: wp.dueDate || null,
            })),
        };
    }

    /**
     * Get resource utilization for all team members in a project
     */
    async getProjectResourceUtilization(
        projectId: string,
        startDate: Date,
        endDate: Date
    ): Promise<ProjectResourceUtilization> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) throw new Error('Project not found');

        // Get all users who have work packages in this project
        const workPackagesInProject = await this.workPackageRepository.find({
            where: { projectId, assigneeId: Not(IsNull()) },
            relations: ['assignee'],
        });

        const assigneeIds = Array.from(new Set(workPackagesInProject.map(wp => wp.assigneeId!)));

        const teamWorkload: UserWorkload[] = await Promise.all(
            assigneeIds.map(userId => this.getUserWorkload(userId, startDate, endDate))
        );

        const totalProjectEstimatedHours = teamWorkload.reduce(
            (sum, uw) => sum + uw.totalEstimatedHours,
            0
        );

        return {
            projectId: project.id,
            projectName: project.name,
            teamWorkload,
            totalProjectEstimatedHours,
        };
    }
}

export function createResourceService(): ResourceService {
    return new ResourceService();
}
