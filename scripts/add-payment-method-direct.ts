// Script to add paymentMethod field directly to database
// Run with: npx tsx scripts/add-payment-method-direct.ts

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function addPaymentMethodField() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('Adding paymentMethod field to GivingQRCode table...');
    
    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GivingQRCode' 
      AND column_name = 'paymentMethod'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column paymentMethod already exists');
    } else {
      // Add the column
      await client.query(`
        ALTER TABLE "GivingQRCode" 
        ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'MPESA'
      `);
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS "GivingQRCode_paymentMethod_idx" 
        ON "GivingQRCode"("paymentMethod")
      `);
      
      console.log('✅ paymentMethod field added successfully!');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addPaymentMethodField()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

