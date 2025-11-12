-- Add paymentMethod field to GivingQRCode table
-- This is a temporary fix until schema relation errors are resolved

-- First, check if the column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'GivingQRCode' 
        AND column_name = 'paymentMethod'
    ) THEN
        -- Add the column with default value
        ALTER TABLE "GivingQRCode" 
        ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'MPESA';
        
        -- Create index on paymentMethod
        CREATE INDEX IF NOT EXISTS "GivingQRCode_paymentMethod_idx" 
        ON "GivingQRCode"("paymentMethod");
        
        RAISE NOTICE 'Column paymentMethod added successfully';
    ELSE
        RAISE NOTICE 'Column paymentMethod already exists';
    END IF;
END $$;

