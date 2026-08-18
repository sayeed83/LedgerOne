-- CreateTable
CREATE TABLE `warehouses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `branch_uuid` CHAR(36) NOT NULL,
    `warehouse_code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `warehouses_uuid_key`(`uuid`),
    INDEX `idx_warehouses_tenant_branch`(`tenant_id`, `branch_uuid`),
    INDEX `idx_warehouses_branch_uuid`(`branch_uuid`),
    INDEX `idx_warehouses_tenant_branch_status`(`tenant_id`, `branch_uuid`, `status`),
    UNIQUE INDEX `uq_warehouses_branch_warehouse_code_deleted_at`(`branch_uuid`, `warehouse_code`, `deleted_at`),
    UNIQUE INDEX `uq_warehouses_branch_name_deleted_at`(`branch_uuid`, `name`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
