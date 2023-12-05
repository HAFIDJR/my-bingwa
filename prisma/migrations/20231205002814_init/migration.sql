/*
  Warnings:

  - Added the required column `otpCreatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `test` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otpCreatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "test" TEXT NOT NULL;
