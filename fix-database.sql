-- Quick database fix script
-- Run this manually in your Supabase SQL editor

-- 1. Add SUBADMIN to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUBADMIN';

-- 2. Create Sport table
CREATE TABLE IF NOT EXISTS "sports" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sharesGround" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sports_name_key" ON "sports"("name");

-- 3. Create AppSettings table
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" SERIAL NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'Turf Booking',
    "defaultPricePerHour" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- 4. Insert default sports
INSERT INTO "sports" ("name", "icon", "active", "sharesGround") VALUES
    ('Football', '⚽', true, true),
    ('Cricket', '🏏', true, true),
    ('Badminton', '🏸', true, false),
    ('Tennis', '🎾', true, false),
    ('Basketball', '🏀', true, false)
ON CONFLICT ("name") DO NOTHING;

-- 5. Insert default settings
INSERT INTO "app_settings" ("id", "appName", "defaultPricePerHour", "currency") VALUES
    (1, 'FS Sports Club', 500, 'INR')
ON CONFLICT ("id") DO NOTHING;

-- Done!
SELECT 'Database fixed successfully! ✅' as status;
