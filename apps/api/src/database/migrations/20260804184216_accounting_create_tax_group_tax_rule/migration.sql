-- CreateTable
CREATE TABLE `tax_groups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `tax_groups_uuid_key`(`uuid`),
    INDEX `idx_tax_groups_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_tax_groups_company_uuid`(`company_uuid`),
    UNIQUE INDEX `uq_tax_groups_tenant_company_name_deleted_at`(`tenant_id`, `company_uuid`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tax_rules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `tax_group_id` BIGINT UNSIGNED NOT NULL,
    `rate` DECIMAL(9, 4) NOT NULL,
    `effective_from` DATETIME(3) NOT NULL,
    `effective_to` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `tax_rules_uuid_key`(`uuid`),
    INDEX `idx_tax_rules_tenant_tax_group`(`tenant_id`, `tax_group_id`),
    INDEX `idx_tax_rules_tax_group_id`(`tax_group_id`),
    UNIQUE INDEX `uq_tax_rules_tax_group_effective_from_deleted_at`(`tax_group_id`, `effective_from`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tax_rules` ADD CONSTRAINT `tax_rules_tax_group_id_fkey` FOREIGN KEY (`tax_group_id`) REFERENCES `tax_groups`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
