import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentsTable1740132000000 implements MigrationInterface {
  name = 'CreateCommentsTable1740132000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(255) NOT NULL,
        entity_id UUID NOT NULL,
        user_id UUID NOT NULL,
        parent_id UUID,
        content TEXT NOT NULL,
        mentions JSONB,
        reactions JSONB,
        edited_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS comments`);
  }
}
