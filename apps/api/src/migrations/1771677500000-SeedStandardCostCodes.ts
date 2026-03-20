import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStandardCostCodes1771677500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Level 1 - Main Categories
    const level1Codes = [
      { code: '01', name: 'SITE PREPARATION', description: 'Site clearance, demolition, and earthworks' },
      { code: '02', name: 'FOUNDATION', description: 'Excavation, concrete foundation, and waterproofing' },
      { code: '03', name: 'CONCRETE WORKS', description: 'Formwork, reinforcement, concrete pour, and finishing' },
      { code: '04', name: 'STRUCTURAL STEEL', description: 'Steel fabrication, erection, and connections' },
      { code: '05', name: 'MASONRY', description: 'Blockwork, brickwork, and stone cladding' },
      { code: '06', name: 'ROOFING', description: 'Roof structure, covering, and waterproofing' },
      { code: '07', name: 'MEP', description: 'Mechanical, Electrical, and Plumbing systems' },
      { code: '08', name: 'FINISHES', description: 'Flooring, wall finishes, ceiling, and painting' },
      { code: '09', name: 'EXTERNAL WORKS', description: 'Landscaping, paving, and drainage' },
      { code: '10', name: 'PRELIMINARIES', description: 'Site setup, temporary works, and site management' },
    ];

    for (const code of level1Codes) {
      await queryRunner.query(
        `INSERT INTO cost_codes (code, name, description, level, is_active) VALUES ($1, $2, $3, 1, true)`,
        [code.code, code.name, code.description]
      );
    }

    // Level 2 - Sub-categories
    const level2Codes = [
      // 01 - SITE PREPARATION
      { code: '01.01', name: 'Site Clearance', parentCode: '01' },
      { code: '01.02', name: 'Demolition', parentCode: '01' },
      { code: '01.03', name: 'Earthworks', parentCode: '01' },
      
      // 02 - FOUNDATION
      { code: '02.01', name: 'Excavation', parentCode: '02' },
      { code: '02.02', name: 'Concrete Foundation', parentCode: '02' },
      { code: '02.03', name: 'Waterproofing', parentCode: '02' },
      
      // 03 - CONCRETE WORKS
      { code: '03.01', name: 'Formwork', parentCode: '03' },
      { code: '03.02', name: 'Reinforcement', parentCode: '03' },
      { code: '03.03', name: 'Concrete Pour', parentCode: '03' },
      { code: '03.04', name: 'Finishing', parentCode: '03' },
      
      // 04 - STRUCTURAL STEEL
      { code: '04.01', name: 'Steel Fabrication', parentCode: '04' },
      { code: '04.02', name: 'Steel Erection', parentCode: '04' },
      { code: '04.03', name: 'Connections', parentCode: '04' },
      
      // 05 - MASONRY
      { code: '05.01', name: 'Blockwork', parentCode: '05' },
      { code: '05.02', name: 'Brickwork', parentCode: '05' },
      { code: '05.03', name: 'Stone Cladding', parentCode: '05' },
      
      // 06 - ROOFING
      { code: '06.01', name: 'Roof Structure', parentCode: '06' },
      { code: '06.02', name: 'Roof Covering', parentCode: '06' },
      { code: '06.03', name: 'Waterproofing', parentCode: '06' },
      
      // 07 - MEP
      { code: '07.01', name: 'HVAC', parentCode: '07' },
      { code: '07.02', name: 'Electrical', parentCode: '07' },
      { code: '07.03', name: 'Plumbing', parentCode: '07' },
      { code: '07.04', name: 'Fire Protection', parentCode: '07' },
      
      // 08 - FINISHES
      { code: '08.01', name: 'Flooring', parentCode: '08' },
      { code: '08.02', name: 'Wall Finishes', parentCode: '08' },
      { code: '08.03', name: 'Ceiling', parentCode: '08' },
      { code: '08.04', name: 'Painting', parentCode: '08' },
      
      // 09 - EXTERNAL WORKS
      { code: '09.01', name: 'Landscaping', parentCode: '09' },
      { code: '09.02', name: 'Paving', parentCode: '09' },
      { code: '09.03', name: 'Drainage', parentCode: '09' },
      
      // 10 - PRELIMINARIES
      { code: '10.01', name: 'Site Setup', parentCode: '10' },
      { code: '10.02', name: 'Temporary Works', parentCode: '10' },
      { code: '10.03', name: 'Site Management', parentCode: '10' },
    ];

    for (const code of level2Codes) {
      const parentResult = await queryRunner.query(
        `SELECT id FROM cost_codes WHERE code = $1`,
        [code.parentCode]
      );
      const parentId = parentResult[0]?.id;

      if (parentId) {
        await queryRunner.query(
          `INSERT INTO cost_codes (code, name, parent_code_id, level, is_active) VALUES ($1, $2, $3, 2, true)`,
          [code.code, code.name, parentId]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM cost_codes WHERE level = 2`);
    await queryRunner.query(`DELETE FROM cost_codes WHERE level = 1`);
  }
}
