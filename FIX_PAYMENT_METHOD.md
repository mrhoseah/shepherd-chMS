# Fix: Add paymentMethod Field to GivingQRCode Table

## Problem
The `paymentMethod` field is missing from the `GivingQRCode` table in the database, causing the error:
```
Unknown argument `paymentMethod`. Available options are marked with ?.
```

## Solution

### Option 1: Run SQL Directly (Quickest)

Connect to your PostgreSQL database and run:

```sql
-- Add paymentMethod column if it doesn't exist
ALTER TABLE "GivingQRCode" 
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'MPESA';

-- Create index
CREATE INDEX IF NOT EXISTS "GivingQRCode_paymentMethod_idx" 
ON "GivingQRCode"("paymentMethod");
```

### Option 2: Use psql Command Line

```bash
psql -d egc_app -c "ALTER TABLE \"GivingQRCode\" ADD COLUMN IF NOT EXISTS \"paymentMethod\" TEXT NOT NULL DEFAULT 'MPESA';"
psql -d egc_app -c "CREATE INDEX IF NOT EXISTS \"GivingQRCode_paymentMethod_idx\" ON \"GivingQRCode\"(\"paymentMethod\");"
```

### Option 3: Fix Schema Errors First (Recommended for long-term)

The schema has relation errors that need to be fixed. Once fixed, you can run:
```bash
npx prisma db push
npx prisma generate
```

## After Adding the Field

Once the field is added, the QR code generation should work. Try generating a QR code again from the UI.

## Verify the Fix

You can verify the field was added by running:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'GivingQRCode' 
AND column_name = 'paymentMethod';
```

