/*
  Warnings:

  - The values [REJECTED] on the enum `Donasi_status_donasi` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `donasi` MODIFY `status_donasi` ENUM('PENDING', 'APPROVED', 'CANCELLED') NOT NULL;
