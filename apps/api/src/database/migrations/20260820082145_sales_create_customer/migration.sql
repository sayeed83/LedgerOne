-- CreateTable
CREATE TABLE `customers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address_line1` VARCHAR(255) NULL,
    `address_line2` VARCHAR(255) NULL,
    `city` VARCHAR(120) NULL,
    `region` VARCHAR(120) NULL,
    `postal_code` VARCHAR(20) NULL,
    `country_code` CHAR(2) NULL,
    `credit_limit` DECIMAL(20, 4) NOT NULL DEFAULT 0,
    `payment_terms` VARCHAR(64) NULL,
    `status` ENUM('PROSPECT', 'ACTIVE', 'ON_HOLD', 'INACTIVE') NOT NULL DEFAULT 'PROSPECT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `customers_uuid_key`(`uuid`),
    INDEX `idx_customers_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_customers_tenant_company_status`(`tenant_id`, `company_uuid`, `status`),
    UNIQUE INDEX `uq_customers_company_name_deleted_at`(`company_uuid`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
