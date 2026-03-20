import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttachments1771675602095 implements MigrationInterface {
    name = 'CreateAttachments1771675602095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_type" character varying(50) NOT NULL, "entity_id" uuid NOT NULL, "file_name" character varying(255) NOT NULL, "file_size" bigint NOT NULL, "mime_type" character varying(100) NOT NULL, "storage_key" character varying(500) NOT NULL, "uploaded_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a893a08d151195e1d3bf7a109c" ON "attachments" ("entity_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_f627d55b75ca1d0c0012a4a93a" ON "attachments" ("entity_id") `);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_days" SET DEFAULT '[1,2,3,4,5]'`);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_hours" SET DEFAULT '{"startHour":8,"startMinute":0,"endHour":17,"endMinute":0}'`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_e25812e3fd9b3f3edf11b2c5d58" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_e25812e3fd9b3f3edf11b2c5d58"`);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_hours" SET DEFAULT '{"endHour": 17, "endMinute": 0, "startHour": 8, "startMinute": 0}'`);
        await queryRunner.query(`ALTER TABLE "work_calendars" ALTER COLUMN "working_days" SET DEFAULT '[1, 2, 3, 4, 5]'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f627d55b75ca1d0c0012a4a93a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a893a08d151195e1d3bf7a109c"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
    }

}
