-- CreateTable
CREATE TABLE `currencies` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `iso_code` VARCHAR(3) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `decimal_precision` TINYINT UNSIGNED NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `currencies_uuid_key`(`uuid`),
    UNIQUE INDEX `currencies_iso_code_key`(`iso_code`),
    INDEX `idx_currencies_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_rates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `from_currency_id` BIGINT UNSIGNED NOT NULL,
    `to_currency_id` BIGINT UNSIGNED NOT NULL,
    `rate` DECIMAL(20, 10) NOT NULL,
    `effective_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `exchange_rates_uuid_key`(`uuid`),
    INDEX `idx_exchange_rates_tenant_pair`(`tenant_id`, `from_currency_id`, `to_currency_id`),
    INDEX `idx_exchange_rates_from_currency_id`(`from_currency_id`),
    INDEX `idx_exchange_rates_to_currency_id`(`to_currency_id`),
    UNIQUE INDEX `uq_exchange_rates_tenant_pair_effective_date_deleted_at`(`tenant_id`, `from_currency_id`, `to_currency_id`, `effective_date`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_from_currency_id_fkey` FOREIGN KEY (`from_currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `exchange_rates` ADD CONSTRAINT `exchange_rates_to_currency_id_fkey` FOREIGN KEY (`to_currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
