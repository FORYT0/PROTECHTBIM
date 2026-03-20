import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWikiPages1771676000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE wiki_pages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                project_id UUID NOT NULL,
                parent_id UUID,
                order_index INTEGER NOT NULL DEFAULT 0,
                created_by_id UUID NOT NULL,
                last_edited_by_id UUID,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_wiki_pages_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                CONSTRAINT fk_wiki_pages_parent FOREIGN KEY (parent_id) REFERENCES wiki_pages(id) ON DELETE CASCADE,
                CONSTRAINT fk_wiki_pages_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_wiki_pages_last_edited_by FOREIGN KEY (last_edited_by_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX idx_wiki_pages_project_slug ON wiki_pages(project_id, slug)`);
        await queryRunner.query(`CREATE INDEX idx_wiki_pages_project_parent ON wiki_pages(project_id, parent_id)`);
        await queryRunner.query(`CREATE INDEX idx_wiki_pages_created_by ON wiki_pages(created_by_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_wiki_pages_created_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_wiki_pages_project_parent`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_wiki_pages_project_slug`);
        await queryRunner.query(`DROP TABLE IF EXISTS wiki_pages`);
    }
}
