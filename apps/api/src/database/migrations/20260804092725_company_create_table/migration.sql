-- CreateTable
CREATE TABLE `companies` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_code` VARCHAR(32) NOT NULL,
    `legal_name` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NULL,
    `legal_entity_type` VARCHAR(64) NULL,
    `tax_registration_number` VARCHAR(64) NOT NULL,
    `base_currency_code` VARCHAR(3) NOT NULL,
    `country` CHAR(2) NOT NULL,
    `time_zone` VARCHAR(64) NOT NULL,
    `financial_year_start_month` TINYINT UNSIGNED NOT NULL,
    `financial_year_start_day` TINYINT UNSIGNED NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'DISSOLVED') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `companies_uuid_key`(`uuid`),
    INDEX `idx_companies_tenant_status`(`tenant_id`, `status`),
    UNIQUE INDEX `uq_companies_tenant_company_code`(`tenant_id`, `company_code`, `deleted_at`),
    UNIQUE INDEX `uq_companies_tenant_legal_name`(`tenant_id`, `legal_name`, `deleted_at`),
    UNIQUE INDEX `uq_companies_tenant_tax_registration_number`(`tenant_id`, `tax_registration_number`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
