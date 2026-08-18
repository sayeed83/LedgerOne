-- CreateIndex
CREATE INDEX `idx_products_tenant_company_status` ON `products`(`tenant_id`, `company_uuid`, `status`);
