import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeeklyCapacityToUser1771674778932 implements MigrationInterface {
    name = 'AddWeeklyCapacityToUser1771674778932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "weekly_capacity_hours" integer NOT NULL DEFAULT '40'`);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_days" SET DEFAULT '[1,2,3,4,5]'`);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_hours" SET DEFAULT '{"startHour":8,"startMinute":0,"endHour":17,"endMinute":0}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_hours" SET DEFAULT '{"endHour": 17, "endMinute": 0, "startHour": 8, "startMinute": 0}'`);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_days" SET DEFAULT '[1, 2, 3, 4, 5]'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "weekly_capacity_hours"`);
    }

}
