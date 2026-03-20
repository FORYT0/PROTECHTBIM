import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBoards1704300000000 implements MigrationInterface {
  name = 'CreateBoards1704300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create boards table
    await queryRunner.query(`
      CREATE TABLE boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        board_type VARCHAR(50) NOT NULL DEFAULT 'basic',
        configuration JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_boards_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT valid_board_type CHECK (board_type IN ('basic', 'status', 'team', 'version'))
      )
    `);

    // Create index for boards
    await queryRunner.query(`CREATE INDEX idx_boards_project ON boards(project_id)`);

    // Create board_columns table
    await queryRunner.query(`
      CREATE TABLE board_columns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        position INTEGER NOT NULL,
        status_mapping VARCHAR(50),
        wip_limit INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_board_columns_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for board_columns
    await queryRunner.query(`CREATE INDEX idx_board_columns_board ON board_columns(board_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_board_columns_position ON board_columns(board_id, position)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS board_columns`);
    await queryRunner.query(`DROP TABLE IF EXISTS boards`);
  }
}
