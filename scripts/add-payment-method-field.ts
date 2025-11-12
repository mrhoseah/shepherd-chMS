// Script to add paymentMethod field to GivingQRCode table
// Run with: npx tsx scripts/add-payment-method-field.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPaymentMethodField() {
  try {
    console.log('Adding paymentMethod field to GivingQRCode table...');
    
    // Check if column exists and add it if not
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'GivingQRCode' 
              AND column_name = 'paymentMethod'
          ) THEN
              ALTER TABLE "GivingQRCode" 
              ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'MPESA';
              
              CREATE INDEX IF NOT EXISTS "GivingQRCode_paymentMethod_idx" 
              ON "GivingQRCode"("paymentMethod");
              
              RAISE NOTICE 'Column paymentMethod added successfully';
          ELSE
              RAISE NOTICE 'Column paymentMethod already exists';
          END IF;
      END $$;
    `);
    
    console.log('✅ paymentMethod field added successfully!');
  } catch (error: any) {
    console.error('❌ Error adding paymentMethod field:', error.message);
    if (error.message.includes('already exists')) {
      console.log('✅ Field already exists, that\'s okay!');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addPaymentMethodField();

