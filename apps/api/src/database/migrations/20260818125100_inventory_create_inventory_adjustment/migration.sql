-- CreateTable
CREATE TABLE `inventory_adjustments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `warehouse_uuid` CHAR(36) NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `adjustment_type` ENUM('INCREASE', 'DECREASE') NOT NULL,
    `quantity` DECIMAL(18, 6) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `remarks` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `inventory_adjustments_uuid_key`(`uuid`),
    INDEX `idx_inventory_adjustments_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_inventory_adjustments_warehouse_product`(`warehouse_uuid`, `product_id`),
    INDEX `idx_inventory_adjustments_product`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
