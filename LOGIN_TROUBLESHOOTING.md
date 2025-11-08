# Login Troubleshooting Guide

## Common Issues and Solutions

### 1. AWS Credentials Not Configured

**Problem**: AWS credentials are set to placeholder values.

**Solution**: Update your `.env` file` with real AWS credentials:

```env
AWS_ACCESS_KEY_ID=your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
COGNITO_REGION=af-south-1
COGNITO_USER_POOL_ID=af-south-1_HZYIpahzs
COGNITO_CLIENT_ID=2e0nfb1h5vg24r0692ff14i3d2
```

**How to get AWS credentials:**
1. Go to AWS IAM Console
2. Create a new user or use existing user
3. Attach policy: `AmazonCognitoPowerUser` or custom policy with Cognito permissions
4. Create access keys
5. Add to `.env` file

### 2. User Doesn't Have Login Permission

**Problem**: User exists in Cognito but `canLogin` is `false` in database.

**Solution**: Update user in database:

```sql
-- For a specific user
UPDATE "User" SET "canLogin" = true WHERE email = 'user@example.com';

-- For admin users (they can always login)
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Or use the admin panel to enable login for users.

### 3. Cognito User Pool Configuration

**Problem**: USER_PASSWORD_AUTH flow not enabled.

**Solution**: 
1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to "App integration" → "App clients"
4. Click on your app client
5. Under "Hosted UI settings" → "Edit"
6. Ensure "ALLOW_USER_PASSWORD_AUTH" is checked
7. Save changes

### 4. User Not Confirmed in Cognito

**Problem**: User exists but email/phone not verified.

**Solution**: 
- Admin can confirm user in Cognito Console
- Or user needs to complete verification process
- Or use `AdminConfirmSignUp` command

### 5. Database Connection Issues

**Problem**: Prisma can't connect to database.

**Solution**: Check `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/egc_app
```

### 6. NextAuth Secret Missing

**Problem**: `NEXTAUTH_SECRET` not set.

**Solution**: Add to `.env`:

```env
NEXTAUTH_SECRET=your-secret-key-here
```

Generate a secret:
```bash
openssl rand -base64 32
```

## Testing Login

### Check Server Logs

Look for errors in the terminal where `npm run dev` is running:

```bash
# Common error messages:
- "Cognito sign in error:" - AWS/Cognito issue
- "Authentication failed" - Credentials or user issue
- "You do not have permission" - canLogin = false
```

### Test Cognito Connection

Create a test script to verify Cognito setup:

```typescript
// test-cognito.ts
import { signInWithCognito } from './lib/cognito';

async function test() {
  try {
    const result = await signInWithCognito('test@example.com', 'password');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

## Quick Fixes

### Enable Login for Existing User

```typescript
// In database or via API
await prisma.user.update({
  where: { email: 'user@example.com' },
  data: { canLogin: true }
});
```

### Create Admin User

```typescript
await prisma.user.create({
  data: {
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    status: 'ACTIVE',
    canLogin: true,
    // ... other fields
  }
});
```

### Reset User Password in Cognito

Use AWS CLI or Cognito Console to reset password.

## Debug Steps

1. **Check Environment Variables**
   ```bash
   cat .env | grep -E "AWS_|COGNITO_|NEXTAUTH_|DATABASE_"
   ```

2. **Check Server Console**
   - Look for error messages
   - Check for stack traces

3. **Check Browser Console**
   - Open DevTools (F12)
   - Check Network tab for failed requests
   - Check Console for errors

4. **Test API Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
   ```

5. **Check Database**
   ```sql
   SELECT email, role, "canLogin", status FROM "User" WHERE email = 'user@example.com';
   ```

## Still Not Working?

1. Clear all caches:
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

2. Check Prisma schema is synced:
   ```bash
   npx prisma db push
   ```

3. Verify Cognito user exists:
   - AWS Cognito Console → Users
   - Verify user is confirmed
   - Verify user has correct attributes

4. Check network connectivity:
   - Can reach AWS services?
   - Firewall blocking requests?

