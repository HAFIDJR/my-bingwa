/*
  Warnings:

  - You are about to drop the `Vidio` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Made the column `fullName` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumber` on table `UserProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Vidio" DROP CONSTRAINT "Vidio_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "Vidio" DROP CONSTRAINT "Vidio_courseId_fkey";

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "phoneNumber" SET NOT NULL;

-- DropTable
DROP TABLE "Vidio";

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_phoneNumber_key" ON "UserProfile"("phoneNumber");
