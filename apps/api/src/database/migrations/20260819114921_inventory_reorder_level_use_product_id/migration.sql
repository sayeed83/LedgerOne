-- DropIndex
DROP INDEX `idx_reorder_levels_warehouse_product` ON `reorder_levels`;

-- DropIndex
DROP INDEX `uq_reorder_levels_warehouse_product_deleted_at` ON `reorder_levels`;

-- AlterTable
ALTER TABLE `reorder_levels` DROP COLUMN `product_uuid`,
    ADD COLUMN `product_id` BIGINT UNSIGNED NOT NULL;

-- CreateIndex
CREATE INDEX `idx_reorder_levels_warehouse_product` ON `reorder_levels`(`warehouse_uuid`, `product_id`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_reorder_levels_warehouse_product_deleted_at` ON `reorder_levels`(`warehouse_uuid`, `product_id`, `deleted_at`);

-- AddForeignKey
ALTER TABLE `reorder_levels` ADD CONSTRAINT `reorder_levels_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

