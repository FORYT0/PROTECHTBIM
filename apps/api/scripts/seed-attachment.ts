import { AppDataSource, initializeDatabase } from '../src/config/data-source';
import { Attachment } from '../src/entities/Attachment';
import { Project } from '../src/entities/Project';
import { User } from '../src/entities/User';
import { storageService } from '../src/services/StorageService';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

async function main() {
    console.log('Initializing database...');
    await initializeDatabase();

    console.log('Initializing storage...');
    console.log('Skipping storage init, checking DB...');

    const projectRepo = AppDataSource.getRepository(Project);
    const attachmentRepo = AppDataSource.getRepository(Attachment);
    const userRepo = AppDataSource.getRepository(User);

    const project = await projectRepo.findOne({ where: { name: 'Schependomlaan OpenBIM Project' } });
    const adminUser = await userRepo.findOne({ where: { email: 'admin@example.com' } });

    if (!project || !adminUser) {
        console.error('Project or Admin user not found. Run main seed script first.');
        process.exit(1);
    }

    console.log(`Found project ${project.id}. Attaching IFC model...`);

    try {
        const response = await fetch('https://raw.githubusercontent.com/openbim-data/Schependomlaan/master/IFC/Schependomlaan.ifc');
        if (!response.ok) throw new Error(`Failed to fetch IFC: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const storageKey = `attachments/Project/${project.id}/${uuidv4()}.ifc`;
        await storageService.uploadFile(storageKey, buffer, 'application/octet-stream');

        await attachmentRepo.save({
            entityType: 'Project',
            entityId: project.id,
            fileName: 'Schependomlaan.ifc',
            fileSize: buffer.length,
            mimeType: 'application/octet-stream',
            storageKey,
            uploadedById: adminUser.id
        });

        console.log('✅ Successfully attached IFC model.');
    } catch (error) {
        console.error('Failed to attach IFC model:', error);
    }

    process.exit(0);
}

main().catch(console.error);
