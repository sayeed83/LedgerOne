-- CreateTable
CREATE TABLE `financial_years` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `status` ENUM('FUTURE', 'OPEN', 'CLOSING', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'FUTURE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `financial_years_uuid_key`(`uuid`),
    INDEX `idx_financial_years_tenant_company_status`(`tenant_id`, `company_uuid`, `status`),
    INDEX `idx_financial_years_company_uuid`(`company_uuid`),
    UNIQUE INDEX `uq_financial_years_company_start_date_deleted_at`(`company_uuid`, `start_date`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
