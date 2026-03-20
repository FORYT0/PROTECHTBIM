import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as dotenv from 'dotenv';

dotenv.config();

export class StorageService {
    private client: S3Client;
    private bucket: string;

    constructor() {
        const endpoint = process.env.STORAGE_ENDPOINT || 'localhost:9000';
        const accessKey = process.env.STORAGE_ACCESS_KEY || 'minioadmin';
        const secretKey = process.env.STORAGE_SECRET_KEY || 'minioadmin';
        const useSSL = process.env.STORAGE_USE_SSL === 'true';

        this.bucket = process.env.STORAGE_BUCKET || 'protecht-bim';

        this.client = new S3Client({
            endpoint: endpoint.startsWith('http') ? endpoint : `http://${endpoint}`,
            region: 'us-east-1', // Required by SDK, but not really used by MinIO
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
            forcePathStyle: true, // Required for MinIO
            tls: useSSL,
        });
    }

    private async ensureBucketExists(): Promise<void> {
        try {
            await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                console.log(`Creating bucket: ${this.bucket}`);
                await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
            } else {
                throw error;
            }
        }
    }

    async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
        await this.ensureBucketExists();
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        });

        await this.client.send(command);
        return key;
    }

    async getDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    }

    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        await this.client.send(command);
    }
}

export const storageService = new StorageService();
