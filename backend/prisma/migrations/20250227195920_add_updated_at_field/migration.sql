/*
  Warnings:

  - A unique constraint covering the columns `[userId,symbol]` on the table `Watchlist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Watchlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Watchlist" ADD COLUMN     "change" DOUBLE PRECISION,
ADD COLUMN     "changePercent" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "volume" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_symbol_key" ON "Watchlist"("userId", "symbol");
