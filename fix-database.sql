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

-- 3. Create or update AppSettings table
-- First check if table exists and add missing columns
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "app_settings" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
    );

    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'defaultPrice') THEN
        ALTER TABLE "app_settings" ADD COLUMN "defaultPrice" INTEGER NOT NULL DEFAULT 500;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'turfName') THEN
        ALTER TABLE "app_settings" ADD COLUMN "turfName" TEXT NOT NULL DEFAULT 'FS Sports Club';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'turfAddress') THEN
        ALTER TABLE "app_settings" ADD COLUMN "turfAddress" TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'turfNotes') THEN
        ALTER TABLE "app_settings" ADD COLUMN "turfNotes" TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'turfPhone') THEN
        ALTER TABLE "app_settings" ADD COLUMN "turfPhone" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 4. Insert default sports
INSERT INTO "sports" ("name", "icon", "active", "sharesGround") VALUES
    ('Football', '⚽', true, true),
    ('Cricket', '🏏', true, true),
    ('Badminton', '🏸', true, false),
    ('Tennis', '🎾', true, false),
    ('Basketball', '🏀', true, false)
ON CONFLICT ("name") DO NOTHING;

-- 5. Insert default settings
INSERT INTO "app_settings" ("id", "defaultPrice", "turfName", "turfAddress", "turfNotes", "turfPhone") VALUES
    (1, 500, 'FS Sports Club', 'FS Sports Club, Beside Nayara Petrol Pump, Malegaon', 'FS Sports Club offers a world-class cricket turf facility in Malegaon, operating 24/7 for your convenience. Experience professional-grade equipment and amenities.', '+91 7066990055')
ON CONFLICT ("id") DO NOTHING;

-- Done!
SELECT 'Database fixed successfully! ✅' as status;
