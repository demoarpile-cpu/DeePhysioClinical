/*
  Warnings:

  - You are about to drop the column `status` on the `patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `patients` DROP COLUMN `status`,
    ADD COLUMN `allow_email` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `allow_notifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `allow_sms` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
