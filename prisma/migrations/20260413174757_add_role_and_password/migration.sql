/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT;
