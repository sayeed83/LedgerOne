-- CreateTable
CREATE TABLE `account_groups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `account_type` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    `parent_account_group_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `account_groups_uuid_key`(`uuid`),
    INDEX `idx_account_groups_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_account_groups_company_uuid`(`company_uuid`),
    INDEX `idx_account_groups_parent_account_group_id`(`parent_account_group_id`),
    UNIQUE INDEX `uq_account_groups_tenant_company_name_deleted_at`(`tenant_id`, `company_uuid`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `account_type` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    `account_group_id` BIGINT UNSIGNED NOT NULL,
    `parent_account_id` BIGINT UNSIGNED NULL,
    `is_posting_account` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `accounts_uuid_key`(`uuid`),
    INDEX `idx_accounts_tenant_company_status`(`tenant_id`, `company_uuid`, `status`),
    INDEX `idx_accounts_company_uuid`(`company_uuid`),
    INDEX `idx_accounts_account_group_id`(`account_group_id`),
    INDEX `idx_accounts_parent_account_id`(`parent_account_id`),
    UNIQUE INDEX `uq_accounts_tenant_company_code`(`tenant_id`, `company_uuid`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account_groups` ADD CONSTRAINT `account_groups_parent_account_group_id_fkey` FOREIGN KEY (`parent_account_group_id`) REFERENCES `account_groups`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_account_group_id_fkey` FOREIGN KEY (`account_group_id`) REFERENCES `account_groups`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_parent_account_id_fkey` FOREIGN KEY (`parent_account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
