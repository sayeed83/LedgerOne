-- CreateTable
CREATE TABLE `stock_movements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `source_warehouse_uuid` CHAR(36) NULL,
    `destination_warehouse_uuid` CHAR(36) NULL,
    `movement_type` ENUM('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
    `quantity` DECIMAL(18, 6) NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_uuid` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `stock_movements_uuid_key`(`uuid`),
    INDEX `idx_stock_movements_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_stock_movements_source_warehouse_product`(`source_warehouse_uuid`, `product_id`),
    INDEX `idx_stock_movements_destination_warehouse_product`(`destination_warehouse_uuid`, `product_id`),
    INDEX `idx_stock_movements_product`(`product_id`),
    INDEX `idx_stock_movements_movement_type`(`movement_type`),
    INDEX `idx_stock_movements_reference_type_uuid`(`reference_type`, `reference_uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
