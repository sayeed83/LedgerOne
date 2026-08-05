-- CreateTable
CREATE TABLE `journal_entries` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `posting_date` DATETIME(3) NOT NULL,
    `narration` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED') NOT NULL DEFAULT 'DRAFT',
    `reversal_of_journal_entry_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `journal_entries_uuid_key`(`uuid`),
    INDEX `idx_journal_entries_tenant_company_status`(`tenant_id`, `company_uuid`, `status`),
    INDEX `idx_journal_entries_company_uuid`(`company_uuid`),
    INDEX `idx_journal_entries_tenant_company_posting_date`(`tenant_id`, `company_uuid`, `posting_date`),
    INDEX `idx_journal_entries_reversal_of_journal_entry_id`(`reversal_of_journal_entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entry_lines` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `journal_entry_id` BIGINT UNSIGNED NOT NULL,
    `account_id` BIGINT UNSIGNED NOT NULL,
    `debit_amount` DECIMAL(20, 4) NOT NULL DEFAULT 0,
    `credit_amount` DECIMAL(20, 4) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `journal_entry_lines_uuid_key`(`uuid`),
    INDEX `idx_journal_entry_lines_tenant_company`(`tenant_id`, `company_uuid`),
    INDEX `idx_journal_entry_lines_company_uuid`(`company_uuid`),
    INDEX `idx_journal_entry_lines_journal_entry_id`(`journal_entry_id`),
    INDEX `idx_journal_entry_lines_account_id`(`account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger_entries` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `company_uuid` CHAR(36) NOT NULL,
    `account_id` BIGINT UNSIGNED NOT NULL,
    `journal_entry_line_id` BIGINT UNSIGNED NOT NULL,
    `debit_amount` DECIMAL(20, 4) NOT NULL DEFAULT 0,
    `credit_amount` DECIMAL(20, 4) NOT NULL DEFAULT 0,
    `entry_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `ledger_entries_uuid_key`(`uuid`),
    UNIQUE INDEX `ledger_entries_journal_entry_line_id_key`(`journal_entry_line_id`),
    INDEX `idx_ledger_entries_tenant_company_account_entry_date`(`tenant_id`, `company_uuid`, `account_id`, `entry_date`),
    INDEX `idx_ledger_entries_company_uuid`(`company_uuid`),
    INDEX `idx_ledger_entries_account_id`(`account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_reversal_of_journal_entry_id_fkey` FOREIGN KEY (`reversal_of_journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_journal_entry_id_fkey` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `journal_entry_lines` ADD CONSTRAINT `journal_entry_lines_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ledger_entries` ADD CONSTRAINT `ledger_entries_journal_entry_line_id_fkey` FOREIGN KEY (`journal_entry_line_id`) REFERENCES `journal_entry_lines`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;
