import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEnterpriseConstructionTables1771930000000 implements MigrationInterface {
    name = 'CreateEnterpriseConstructionTables1771930000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Contracts table
        await queryRunner.query(`
            CREATE TYPE "public"."contracts_contracttype_enum" AS ENUM('Lump Sum', 'BOQ', 'Design-Build', 'EPC', 'Cost Plus')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."contracts_status_enum" AS ENUM('Draft', 'Active', 'Completed', 'Terminated')
        `);
        await queryRunner.query(`
            CREATE TABLE "contracts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "contractNumber" character varying(100) NOT NULL,
                "contractType" "public"."contracts_contracttype_enum" NOT NULL DEFAULT 'Lump Sum',
                "clientName" character varying(255) NOT NULL,
                "originalContractValue" numeric(15,2) NOT NULL,
                "revisedContractValue" numeric(15,2) NOT NULL,
                "totalApprovedVariations" numeric(15,2) NOT NULL DEFAULT '0',
                "totalPendingVariations" numeric(15,2) NOT NULL DEFAULT '0',
                "originalDurationDays" integer NOT NULL,
                "startDate" date NOT NULL,
                "completionDate" date NOT NULL,
                "retentionPercentage" numeric(5,2) NOT NULL DEFAULT '0',
                "advancePaymentAmount" numeric(15,2) NOT NULL DEFAULT '0',
                "performanceBondValue" numeric(15,2) NOT NULL DEFAULT '0',
                "currency" character varying(10) NOT NULL DEFAULT 'USD',
                "status" "public"."contracts_status_enum" NOT NULL DEFAULT 'Draft',
                "description" text,
                "terms" text,
                "createdBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_contracts_contractNumber" UNIQUE ("contractNumber"),
                CONSTRAINT "PK_contracts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_contracts_projectId" ON "contracts" ("projectId")`);
        await queryRunner.query(`CREATE INDEX "IDX_contracts_status" ON "contracts" ("status")`);

        // Create Change Orders table
        await queryRunner.query(`
            CREATE TYPE "public"."change_orders_reason_enum" AS ENUM('Client Change', 'Site Condition', 'Design Error', 'Regulatory', 'Scope Addition', 'Unforeseen')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."change_orders_status_enum" AS ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Voided')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."change_orders_priority_enum" AS ENUM('Low', 'Medium', 'High', 'Critical')
        `);
        await queryRunner.query(`
            CREATE TABLE "change_orders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "contractId" uuid NOT NULL,
                "changeNumber" character varying(50) NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "reason" "public"."change_orders_reason_enum" NOT NULL,
                "costImpact" numeric(15,2) NOT NULL,
                "scheduleImpactDays" integer NOT NULL DEFAULT '0',
                "status" "public"."change_orders_status_enum" NOT NULL DEFAULT 'Draft',
                "priority" "public"."change_orders_priority_enum" NOT NULL DEFAULT 'Medium',
                "submittedBy" uuid NOT NULL,
                "submittedAt" TIMESTAMP,
                "reviewedBy" uuid,
                "reviewedAt" TIMESTAMP,
                "approvedBy" uuid,
                "approvedAt" TIMESTAMP,
                "rejectionReason" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_change_orders_changeNumber" UNIQUE ("changeNumber"),
                CONSTRAINT "PK_change_orders" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_change_orders_projectId_status" ON "change_orders" ("projectId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_change_orders_contractId" ON "change_orders" ("contractId")`);

        // Create Change Order Cost Lines table
        await queryRunner.query(`
            CREATE TABLE "change_order_cost_lines" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "changeOrderId" uuid NOT NULL,
                "costCodeId" uuid NOT NULL,
                "description" character varying(255) NOT NULL,
                "quantity" numeric(10,2) NOT NULL,
                "unit" character varying(50) NOT NULL,
                "rate" numeric(10,2) NOT NULL,
                "amount" numeric(15,2) NOT NULL,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_change_order_cost_lines" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_change_order_cost_lines_changeOrderId" ON "change_order_cost_lines" ("changeOrderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_change_order_cost_lines_costCodeId" ON "change_order_cost_lines" ("costCodeId")`);

        // Create Payment Certificates table
        await queryRunner.query(`
            CREATE TYPE "public"."payment_certificates_paymentstatus_enum" AS ENUM('Draft', 'Submitted', 'Certified', 'Paid', 'Overdue')
        `);
        await queryRunner.query(`
            CREATE TABLE "payment_certificates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "contractId" uuid NOT NULL,
                "certificateNumber" character varying(50) NOT NULL,
                "periodStart" date NOT NULL,
                "periodEnd" date NOT NULL,
                "workCompletedValue" numeric(15,2) NOT NULL,
                "materialsOnSite" numeric(15,2) NOT NULL DEFAULT '0',
                "previousCertified" numeric(15,2) NOT NULL DEFAULT '0',
                "currentCertified" numeric(15,2) NOT NULL,
                "cumulativeCertified" numeric(15,2) NOT NULL,
                "retentionPercentage" numeric(5,2) NOT NULL,
                "retentionWithheld" numeric(15,2) NOT NULL,
                "advanceRecovery" numeric(15,2) NOT NULL DEFAULT '0',
                "netPayable" numeric(15,2) NOT NULL,
                "paymentStatus" "public"."payment_certificates_paymentstatus_enum" NOT NULL DEFAULT 'Draft',
                "submittedDate" date,
                "certifiedDate" date,
                "paymentDueDate" date,
                "paymentReceivedDate" date,
                "notes" text,
                "createdBy" uuid NOT NULL,
                "approvedBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_payment_certificates_certificateNumber" UNIQUE ("certificateNumber"),
                CONSTRAINT "PK_payment_certificates" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_payment_certificates_contractId" ON "payment_certificates" ("contractId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payment_certificates_paymentStatus" ON "payment_certificates" ("paymentStatus")`);

        // Create Daily Reports table
        await queryRunner.query(`
            CREATE TABLE "daily_reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "reportDate" date NOT NULL,
                "weather" character varying(100),
                "temperature" numeric(5,2),
                "manpowerCount" integer NOT NULL DEFAULT '0',
                "equipmentCount" integer NOT NULL DEFAULT '0',
                "workCompleted" text,
                "workPlannedTomorrow" text,
                "delays" text,
                "safetyIncidents" text,
                "siteNotes" text,
                "visitorsOnSite" text,
                "materialsDelivered" text,
                "createdBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_daily_reports" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_daily_reports_projectId_reportDate" ON "daily_reports" ("projectId", "reportDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_reports_reportDate" ON "daily_reports" ("reportDate")`);

        // Create Delay Events table
        await queryRunner.query(`
            CREATE TYPE "public"."delay_events_delaytype_enum" AS ENUM('Weather', 'Client', 'Design', 'Material', 'Equipment', 'Labor', 'Authority', 'Third Party')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."delay_events_responsibleparty_enum" AS ENUM('Client', 'Contractor', 'Consultant', 'Third Party')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."delay_events_status_enum" AS ENUM('Logged', 'Under Review', 'Approved', 'Rejected')
        `);
        await queryRunner.query(`
            CREATE TABLE "delay_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "dailyReportId" uuid,
                "projectId" uuid NOT NULL,
                "delayType" "public"."delay_events_delaytype_enum" NOT NULL,
                "description" text NOT NULL,
                "estimatedImpactDays" integer NOT NULL DEFAULT '0',
                "costImpact" numeric(15,2) NOT NULL DEFAULT '0',
                "responsibleParty" "public"."delay_events_responsibleparty_enum" NOT NULL,
                "status" "public"."delay_events_status_enum" NOT NULL DEFAULT 'Logged',
                "mitigationAction" text,
                "createdBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_delay_events" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_delay_events_projectId_delayType" ON "delay_events" ("projectId", "delayType")`);
        await queryRunner.query(`CREATE INDEX "IDX_delay_events_dailyReportId" ON "delay_events" ("dailyReportId")`);
        await queryRunner.query(`CREATE INDEX "IDX_delay_events_status" ON "delay_events" ("status")`);

        // Create Site Photos table
        await queryRunner.query(`
            CREATE TABLE "site_photos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "workPackageId" uuid,
                "dailyReportId" uuid,
                "fileUrl" character varying(500) NOT NULL,
                "fileSize" integer,
                "latitude" numeric(10,8),
                "longitude" numeric(11,8),
                "timestamp" TIMESTAMP NOT NULL,
                "description" text,
                "tags" text,
                "uploadedBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_site_photos" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_site_photos_projectId_createdAt" ON "site_photos" ("projectId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_site_photos_workPackageId" ON "site_photos" ("workPackageId")`);
        await queryRunner.query(`CREATE INDEX "IDX_site_photos_dailyReportId" ON "site_photos" ("dailyReportId")`);

        // Create Snags table
        await queryRunner.query(`
            CREATE TYPE "public"."snags_severity_enum" AS ENUM('Minor', 'Major', 'Critical')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."snags_category_enum" AS ENUM('Defect', 'Incomplete', 'Damage', 'Non-Compliance')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."snags_status_enum" AS ENUM('Open', 'In Progress', 'Resolved', 'Verified', 'Closed')
        `);
        await queryRunner.query(`
            CREATE TABLE "snags" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "workPackageId" uuid,
                "location" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "severity" "public"."snags_severity_enum" NOT NULL DEFAULT 'Minor',
                "category" "public"."snags_category_enum" NOT NULL,
                "assignedTo" uuid,
                "dueDate" date,
                "status" "public"."snags_status_enum" NOT NULL DEFAULT 'Open',
                "costImpact" numeric(15,2) NOT NULL DEFAULT '0',
                "rectificationCost" numeric(15,2) NOT NULL DEFAULT '0',
                "photoUrls" text,
                "createdBy" uuid NOT NULL,
                "resolvedBy" uuid,
                "resolvedAt" TIMESTAMP,
                "verifiedBy" uuid,
                "verifiedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_snags" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_snags_projectId_status" ON "snags" ("projectId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_snags_workPackageId" ON "snags" ("workPackageId")`);
        await queryRunner.query(`CREATE INDEX "IDX_snags_assignedTo" ON "snags" ("assignedTo")`);

        // Add Foreign Keys
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_contracts_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "change_orders" ADD CONSTRAINT "FK_change_orders_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "change_orders" ADD CONSTRAINT "FK_change_orders_contractId" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "change_orders" ADD CONSTRAINT "FK_change_orders_submittedBy" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "change_orders" ADD CONSTRAINT "FK_change_orders_reviewedBy" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "change_orders" ADD CONSTRAINT "FK_change_orders_approvedBy" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "change_order_cost_lines" ADD CONSTRAINT "FK_change_order_cost_lines_changeOrderId" FOREIGN KEY ("changeOrderId") REFERENCES "change_orders"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "change_order_cost_lines" ADD CONSTRAINT "FK_change_order_cost_lines_costCodeId" FOREIGN KEY ("costCodeId") REFERENCES "cost_codes"("id") ON DELETE RESTRICT`);
        
        await queryRunner.query(`ALTER TABLE "payment_certificates" ADD CONSTRAINT "FK_payment_certificates_contractId" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "payment_certificates" ADD CONSTRAINT "FK_payment_certificates_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "payment_certificates" ADD CONSTRAINT "FK_payment_certificates_approvedBy" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "daily_reports" ADD CONSTRAINT "FK_daily_reports_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "daily_reports" ADD CONSTRAINT "FK_daily_reports_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "delay_events" ADD CONSTRAINT "FK_delay_events_dailyReportId" FOREIGN KEY ("dailyReportId") REFERENCES "daily_reports"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "delay_events" ADD CONSTRAINT "FK_delay_events_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "delay_events" ADD CONSTRAINT "FK_delay_events_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "site_photos" ADD CONSTRAINT "FK_site_photos_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "site_photos" ADD CONSTRAINT "FK_site_photos_workPackageId" FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "site_photos" ADD CONSTRAINT "FK_site_photos_dailyReportId" FOREIGN KEY ("dailyReportId") REFERENCES "daily_reports"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "site_photos" ADD CONSTRAINT "FK_site_photos_uploadedBy" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "snags" ADD CONSTRAINT "FK_snags_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "snags" ADD CONSTRAINT "FK_snags_workPackageId" FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "snags" ADD CONSTRAINT "FK_snags_assignedTo" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "snags" ADD CONSTRAINT "FK_snags_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "snags" ADD CONSTRAINT "FK_snags_resolvedBy" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "snags" ADD CONSTRAINT "FK_snags_verifiedBy" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop Foreign Keys
        await queryRunner.query(`ALTER TABLE "snags" DROP CONSTRAINT "FK_snags_verifiedBy"`);
        await queryRunner.query(`ALTER TABLE "snags" DROP CONSTRAINT "FK_snags_resolvedBy"`);
        await queryRunner.query(`ALTER TABLE "snags" DROP CONSTRAINT "FK_snags_createdBy"`);
        await queryRunner.query(`ALTER TABLE "snags" DROP CONSTRAINT "FK_snags_assignedTo"`);
        await queryRunner.query(`ALTER TABLE "snags" DROP CONSTRAINT "FK_snags_workPackageId"`);
        await queryRunner.query(`ALTER TABLE "snags" DROP CONSTRAINT "FK_snags_projectId"`);
        
        await queryRunner.query(`ALTER TABLE "site_photos" DROP CONSTRAINT "FK_site_photos_uploadedBy"`);
        await queryRunner.query(`ALTER TABLE "site_photos" DROP CONSTRAINT "FK_site_photos_dailyReportId"`);
        await queryRunner.query(`ALTER TABLE "site_photos" DROP CONSTRAINT "FK_site_photos_workPackageId"`);
        await queryRunner.query(`ALTER TABLE "site_photos" DROP CONSTRAINT "FK_site_photos_projectId"`);
        
        await queryRunner.query(`ALTER TABLE "delay_events" DROP CONSTRAINT "FK_delay_events_createdBy"`);
        await queryRunner.query(`ALTER TABLE "delay_events" DROP CONSTRAINT "FK_delay_events_projectId"`);
        await queryRunner.query(`ALTER TABLE "delay_events" DROP CONSTRAINT "FK_delay_events_dailyReportId"`);
        
        await queryRunner.query(`ALTER TABLE "daily_reports" DROP CONSTRAINT "FK_daily_reports_createdBy"`);
        await queryRunner.query(`ALTER TABLE "daily_reports" DROP CONSTRAINT "FK_daily_reports_projectId"`);
        
        await queryRunner.query(`ALTER TABLE "payment_certificates" DROP CONSTRAINT "FK_payment_certificates_approvedBy"`);
        await queryRunner.query(`ALTER TABLE "payment_certificates" DROP CONSTRAINT "FK_payment_certificates_createdBy"`);
        await queryRunner.query(`ALTER TABLE "payment_certificates" DROP CONSTRAINT "FK_payment_certificates_contractId"`);
        
        await queryRunner.query(`ALTER TABLE "change_order_cost_lines" DROP CONSTRAINT "FK_change_order_cost_lines_costCodeId"`);
        await queryRunner.query(`ALTER TABLE "change_order_cost_lines" DROP CONSTRAINT "FK_change_order_cost_lines_changeOrderId"`);
        
        await queryRunner.query(`ALTER TABLE "change_orders" DROP CONSTRAINT "FK_change_orders_approvedBy"`);
        await queryRunner.query(`ALTER TABLE "change_orders" DROP CONSTRAINT "FK_change_orders_reviewedBy"`);
        await queryRunner.query(`ALTER TABLE "change_orders" DROP CONSTRAINT "FK_change_orders_submittedBy"`);
        await queryRunner.query(`ALTER TABLE "change_orders" DROP CONSTRAINT "FK_change_orders_contractId"`);
        await queryRunner.query(`ALTER TABLE "change_orders" DROP CONSTRAINT "FK_change_orders_projectId"`);
        
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_contracts_createdBy"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_contracts_projectId"`);

        // Drop Tables
        await queryRunner.query(`DROP TABLE "snags"`);
        await queryRunner.query(`DROP TYPE "public"."snags_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."snags_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."snags_severity_enum"`);
        
        await queryRunner.query(`DROP TABLE "site_photos"`);
        
        await queryRunner.query(`DROP TABLE "delay_events"`);
        await queryRunner.query(`DROP TYPE "public"."delay_events_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."delay_events_responsibleparty_enum"`);
        await queryRunner.query(`DROP TYPE "public"."delay_events_delaytype_enum"`);
        
        await queryRunner.query(`DROP TABLE "daily_reports"`);
        
        await queryRunner.query(`DROP TABLE "payment_certificates"`);
        await queryRunner.query(`DROP TYPE "public"."payment_certificates_paymentstatus_enum"`);
        
        await queryRunner.query(`DROP TABLE "change_order_cost_lines"`);
        
        await queryRunner.query(`DROP TABLE "change_orders"`);
        await queryRunner.query(`DROP TYPE "public"."change_orders_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."change_orders_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."change_orders_reason_enum"`);
        
        await queryRunner.query(`DROP TABLE "contracts"`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contracts_contracttype_enum"`);
    }
}
