import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBudgetToActivityLogEnum1771920000000 implements MigrationInterface {
    name = 'AddBudgetToActivityLogEnum1771920000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'Budget' to activity_logs_entitytype_enum
        await queryRunner.query(`
            ALTER TYPE "public"."activity_logs_entitytype_enum" 
            ADD VALUE IF NOT EXISTS 'Budget'
        `);

        // Add 'APPROVED' to activity_logs_actiontype_enum
        await queryRunner.query(`
            ALTER TYPE "public"."activity_logs_actiontype_enum" 
            ADD VALUE IF NOT EXISTS 'APPROVED'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // You would need to recreate the enum type if you want to remove values
        // For now, we'll leave this empty as removing enum values is complex
        console.log('Cannot remove enum values in PostgreSQL. Manual intervention required if rollback is needed.');
    }
}
