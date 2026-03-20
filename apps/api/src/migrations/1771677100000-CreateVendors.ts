import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateVendors1771677100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vendors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'vendor_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'vendor_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'vendor_type',
            type: 'enum',
            enum: ['SUPPLIER', 'SUBCONTRACTOR', 'CONSULTANT', 'EQUIPMENT_RENTAL', 'OTHER'],
            default: "'SUPPLIER'",
          },
          {
            name: 'contact_person',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payment_terms',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tax_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'bank_account',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'rating',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'vendors',
      new TableIndex({
        name: 'IDX_vendors_vendor_code',
        columnNames: ['vendor_code'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'vendors',
      new TableIndex({
        name: 'IDX_vendors_vendor_name',
        columnNames: ['vendor_name'],
      })
    );

    await queryRunner.createIndex(
      'vendors',
      new TableIndex({
        name: 'IDX_vendors_is_active',
        columnNames: ['is_active'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vendors');
  }
}
