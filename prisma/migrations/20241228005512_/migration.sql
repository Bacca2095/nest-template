-- DropIndex
DROP INDEX "AuditLog_userId_timestamp_idx";

-- CreateIndex
CREATE INDEX "AuditLog_userId_recordId_table_timestamp_idx" ON "AuditLog"("userId", "recordId", "table", "timestamp");
