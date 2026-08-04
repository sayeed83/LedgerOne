-- CreateTable
CREATE TABLE `fiscal_periods` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `financial_year_id` BIGINT UNSIGNED NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `status` ENUM('OPEN', 'SOFT_CLOSED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `fiscal_periods_uuid_key`(`uuid`),
    INDEX `idx_fiscal_periods_tenant_company_status`(`tenant_id`, `company_uuid`, `status`),
    INDEX `idx_fiscal_periods_company_uuid`(`company_uuid`),
    INDEX `idx_fiscal_periods_financial_year_id`(`financial_year_id`),
    UNIQUE INDEX `uq_fiscal_periods_financial_year_start_date_deleted_at`(`financial_year_id`, `start_date`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fiscal_periods` ADD CONSTRAINT `fiscal_periods_financial_year_id_fkey` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
