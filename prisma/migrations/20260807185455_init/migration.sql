-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'POOL_PLAY');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'CHECK_IN', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "MatchStage" AS ENUM ('POOL', 'BRACKET');

-- CreateEnum
CREATE TYPE "BracketSide" AS ENUM ('WINNERS', 'LOSERS', 'GRAND_FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'READY', 'COMPLETE');

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adminToken" TEXT NOT NULL,
    "format" "TournamentFormat" NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "pointsToWin" INTEGER NOT NULL DEFAULT 11,
    "winByTwo" BOOLEAN NOT NULL DEFAULT true,
    "gamesPerMatch" INTEGER NOT NULL DEFAULT 1,
    "poolCount" INTEGER NOT NULL DEFAULT 1,
    "advancePerPool" INTEGER NOT NULL DEFAULT 2,
    "playoffFormat" "TournamentFormat" NOT NULL DEFAULT 'SINGLE_ELIM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "code" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "poolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "stage" "MatchStage" NOT NULL,
    "bracketSide" "BracketSide",
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "poolId" TEXT,
    "player1Id" TEXT,
    "player2Id" TEXT,
    "games" JSONB,
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    "winnerId" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "nextMatchId" TEXT,
    "nextMatchSlot" INTEGER,
    "nextLoserMatchId" TEXT,
    "nextLoserMatchSlot" INTEGER,
    "isBracketReset" BOOLEAN NOT NULL DEFAULT false,
    "court" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_adminToken_key" ON "Tournament"("adminToken");

-- CreateIndex
CREATE INDEX "Tournament_slug_idx" ON "Tournament"("slug");

-- CreateIndex
CREATE INDEX "Tournament_adminToken_idx" ON "Tournament"("adminToken");

-- CreateIndex
CREATE INDEX "Player_tournamentId_idx" ON "Player"("tournamentId");

-- CreateIndex
CREATE INDEX "Player_poolId_idx" ON "Player"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_tournamentId_code_key" ON "Player"("tournamentId", "code");

-- CreateIndex
CREATE INDEX "Pool_tournamentId_idx" ON "Pool"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_tournamentId_name_key" ON "Pool"("tournamentId", "name");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_poolId_idx" ON "Match"("poolId");

-- CreateIndex
CREATE INDEX "Match_nextMatchId_idx" ON "Match"("nextMatchId");

-- CreateIndex
CREATE INDEX "Match_nextLoserMatchId_idx" ON "Match"("nextLoserMatchId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
