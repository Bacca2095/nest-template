/*
  Warnings:

  - A unique constraint covering the columns `[serverId]` on the table `ServerCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ServerCredential_serverId_key" ON "ServerCredential"("serverId");

-- CreateIndex
CREATE INDEX "ServerCredential_serverId_secretId_name_idx" ON "ServerCredential"("serverId", "secretId", "name");
