-- AlterTable
ALTER TABLE "PasswordCredential" ADD COLUMN "resetTokenExpiresAt" DATETIME;
ALTER TABLE "PasswordCredential" ADD COLUMN "resetTokenHash" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "sharePassword" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "revokedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_resetTokenHash_key" ON "PasswordCredential"("resetTokenHash");

