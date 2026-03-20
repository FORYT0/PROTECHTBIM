import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';
import { ProjectRepository } from '../src/repositories/ProjectRepository';
import { WorkPackageRepository } from '../src/repositories/WorkPackageRepository';
import { UserRepository } from '../src/repositories/UserRepository';
import { createAttachmentRepository } from '../src/repositories/AttachmentRepository';
import { storageService } from '../src/services/StorageService';
import { CostEntry, CostType } from '../src/entities/CostEntry';
import { TimeEntry } from '../src/entities/TimeEntry';
import { ProjectStatus, LifecyclePhase } from '../src/entities/Project';
import { WorkPackageType, Priority } from '../src/entities/WorkPackage';
import axios from 'axios';

async function seed() {
    console.log('🔧 Connecting to database...');
    await AppDataSource.initialize();

    const userRepo = new UserRepository(AppDataSource);
    const projectRepo = new ProjectRepository();
    const wpRepo = new WorkPackageRepository();
    const attachmentRepo = createAttachmentRepository();
    const costEntryRepo = AppDataSource.getRepository(CostEntry);
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    console.log('👤 Setting up admin user...');
    let admin = await userRepo.findByEmail('admin@example.com');
    if (!admin) {
        admin = await userRepo.create({
            email: 'admin@example.com',
            passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Dummy hash
            name: 'Admin User',
        });
    }

    console.log('🏗️ Creating Schependomlaan OpenBIM Project...');
    const project = await projectRepo.create({
        name: 'Schependomlaan OpenBIM Project',
        description: 'A complete open-source BIM project dataset for testing and demonstration.',
        ownerId: admin.id,
        status: ProjectStatus.ACTIVE,
        lifecyclePhase: LifecyclePhase.EXECUTION,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
    });
    console.log(`✅ Created project: ${project.name} (${project.id})`);

    // Download IFC Model
    const ifcUrl = 'https://raw.githubusercontent.com/IFCjs/test-folder/main/IFC%20models/Schependomlaan.ifc';
    console.log(`⬇️ Downloading IFC model from ${ifcUrl} (This may take a minute due to file size ~36MB)...`);
    try {
        const response = await axios.get(ifcUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Upload to StorageService
        const fileName = 'Schependomlaan.ifc';
        const key = `projects/${project.id}/${fileName}`;
        await storageService.uploadFile(key, buffer, 'application/octet-stream');

        // Create Attachment record
        await attachmentRepo.create({
            entityType: 'Project',
            entityId: project.id,
            fileName,
            fileSize: buffer.length,
            mimeType: 'application/octet-stream',
            storageKey: key,
            uploadedById: admin.id,
        });
        console.log(`📎 Uploaded and attached IFC model: ${fileName}`);
    } catch (error: any) {
        console.warn(`⚠️ Failed to download or attach IFC model:`, error.message);
    }

    console.log('📦 Creating Work Packages and Estimates...');
    const stages = [
        { subject: 'Site Preparation & Earthwork', type: WorkPackageType.PHASE, duration: 14, estimated: 160, cost: 50000 },
        { subject: 'Foundation & Substructure', type: WorkPackageType.PHASE, duration: 21, estimated: 320, cost: 120000 },
        { subject: 'Structural Framing & Superstructure', type: WorkPackageType.PHASE, duration: 45, estimated: 800, cost: 300000 },
        { subject: 'MEP Rough-in', type: WorkPackageType.PHASE, duration: 30, estimated: 480, cost: 180000 },
        { subject: 'Exterior Enclosure', type: WorkPackageType.PHASE, duration: 25, estimated: 400, cost: 150000 },
        { subject: 'Interior Finishes', type: WorkPackageType.PHASE, duration: 40, estimated: 600, cost: 250000 },
    ];

    let currentDate = new Date('2024-01-15');

    for (const stage of stages) {
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + stage.duration);

        const wp = await wpRepo.create({
            projectId: project.id,
            subject: stage.subject,
            type: stage.type,
            status: 'New',
            priority: Priority.HIGH,
            assigneeId: admin.id,
            startDate: currentDate,
            dueDate: endDate,
            estimatedHours: stage.estimated,
        });
        console.log(`  - Work package: ${wp.subject}`);

        // Create Cost Entry (Estimate)
        await costEntryRepo.save(costEntryRepo.create({
            workPackageId: wp.id,
            userId: admin.id,
            type: CostType.SUBCONTRACTOR,
            amount: stage.cost,
            description: `Estimated subcontractor cost for ${stage.subject}`,
            date: currentDate,
            currency: 'USD'
        }));

        // Material Cost Estimate
        await costEntryRepo.save(costEntryRepo.create({
            workPackageId: wp.id,
            userId: admin.id,
            type: CostType.MATERIAL,
            amount: stage.cost * 0.4, // 40% of sub cost as materials
            description: `Estimated material cost for ${stage.subject}`,
            date: currentDate,
            currency: 'USD'
        }));

        // Create a generic Time Entry to show some progress
        await timeEntryRepo.save(timeEntryRepo.create({
            workPackageId: wp.id,
            userId: admin.id,
            hours: Math.floor(stage.estimated * 0.1), // 10% complete
            comment: `Initial work on ${stage.subject}`,
            date: new Date(),
            billable: true,
        }));

        currentDate = endDate; // Next stage starts when this one ends
    }

    console.log('\n✨ Database seeding complete! Project "Schependomlaan OpenBIM Project" is ready.');

    await AppDataSource.destroy();
    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
