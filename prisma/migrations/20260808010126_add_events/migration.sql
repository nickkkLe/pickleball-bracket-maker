-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adminToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Event_adminToken_key" ON "Event"("adminToken");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_adminToken_idx" ON "Event"("adminToken");

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Tournament_eventId_idx" ON "Tournament"("eventId");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
