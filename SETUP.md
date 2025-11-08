# Database Setup Guide

## ✅ Quick Setup (Recommended for Development)

Since you don't have permission to create databases, use `prisma db push` instead of migrations:

```bash
# This creates the schema without requiring a shadow database
npm run db:push
# OR
npx prisma db push

# Generate Prisma Client (usually done automatically)
npx prisma generate

# Seed the database with admin user
npm run db:seed
```

**Note:** `prisma db push` is perfect for development. It syncs your schema directly without needing migrations or shadow databases.

## Using Migrations (Production)

If you want to use migrations, you have two options:

### Option 1: Grant Database Creation Permission

Connect to PostgreSQL as a superuser and grant permission:

```sql
-- Connect as postgres superuser
psql -U postgres

-- Grant permission to create databases
ALTER USER dev CREATEDB;

-- Or if using a different user, replace 'dev' with your username
```

Then run:
```bash
npx prisma migrate dev --name init
```

### Option 2: Use a Separate Shadow Database

1. Create a shadow database manually:
```sql
CREATE DATABASE egc_app_shadow;
```

2. Add to your `.env` file:
```env
SHADOW_DATABASE_URL="postgresql://dev:5210@localhost:5432/egc_app_shadow?schema=public"
```

3. Run migrations:
```bash
npx prisma migrate dev --name init
```

## Complete Setup Steps

1. **Create the database schema**:
   ```bash
   # Option A: Using db push (RECOMMENDED - no shadow DB needed)
   npm run db:push
   
   # Option B: Using migrations (requires shadow DB permission or manual setup)
   npm run db:migrate
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Create admin user**:
   ```bash
   # Method 1: Using seed script
   npm run db:seed
   
   # Method 2: Using web interface
   # Visit http://localhost:3000/admin/register
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

5. **Sign in**:
   - Visit: http://localhost:3000/auth/signin
   - Use your admin credentials

## Troubleshooting

### "Permission denied to create database"
- Use `prisma db push` instead of `migrate dev`
- Or grant CREATEDB permission to your user
- Or set up a separate shadow database

### "Database does not exist"
- Create the database first:
  ```sql
  CREATE DATABASE egc_app;
  ```

### "Connection refused"
- Make sure PostgreSQL is running
- Check your DATABASE_URL in `.env`
- Verify the port (default: 5432)

