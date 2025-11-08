# Admin Registration Guide

There are **two ways** to create your first admin account:

## Method 1: Using the Web Interface (Recommended)

1. **Run database migrations** (if you haven't already):
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Visit the admin registration page**:
   ```
   http://localhost:3000/admin/register
   ```

4. **Fill in the form** with your admin details:
   - First Name
   - Last Name
   - Email
   - Password (minimum 6 characters)
   - Confirm Password

5. **Click "Create Admin Account"**

6. **Sign in** at `/auth/signin` with your new credentials

> **Note:** The admin registration page only works if no admin user exists yet. After creating the first admin, you'll need to use the dashboard to create additional admins.

## Method 2: Using the Seed Script

1. **Set environment variables** (optional, defaults provided):
   ```bash
   # In your .env file or export them
   export ADMIN_EMAIL="admin@church.com"
   export ADMIN_PASSWORD="admin123"
   export ADMIN_FIRST_NAME="Admin"
   export ADMIN_LAST_NAME="User"
   ```

2. **Run the seed script**:
   ```bash
   npm run db:seed
   ```

3. **Sign in** at `/auth/signin` with:
   - Email: `admin@church.com` (or your custom email)
   - Password: `admin123` (or your custom password)

> **Important:** Change the default password after first login!

## Creating Additional Admins

Once you have your first admin account:

1. Sign in to the dashboard
2. Navigate to **People & Membership** (`/dashboard/users`)
3. Click **"Add User"**
4. Fill in the user details
5. Set **Role** to `ADMIN`
6. Set **Status** to `ACTIVE`
7. Click **"Save"**

## Troubleshooting

### "An admin user already exists"
- You already have an admin account. Sign in instead of registering.
- To create additional admins, use the dashboard after signing in.

### Database connection errors
- Make sure your `.env` file has the correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Run `npx prisma generate` if you see Prisma client errors

### Seed script fails
- Make sure you've run migrations first: `npx prisma migrate dev`
- Check that your database is accessible
- Verify your `DATABASE_URL` in `.env`

## Security Notes

- Always use strong passwords in production
- Change default passwords immediately
- Consider enabling 2FA for admin accounts
- Regularly review admin user access

