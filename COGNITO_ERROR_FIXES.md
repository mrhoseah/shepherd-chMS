# Cognito Authentication Error Fixes

## ✅ Changes Made

### 1. Improved Error Handling in `lib/cognito.ts`

**Issues Fixed:**
- Error handling was too broad, catching all `InvalidParameterException` errors
- Fallback to `ADMIN_NO_SRP_AUTH` wasn't properly handling errors
- Error messages weren't detailed enough for debugging

**Fixes:**
- Made error detection more specific - only catches `USER_PASSWORD_AUTH` flow errors
- Added proper error handling for the `ADMIN_NO_SRP_AUTH` fallback
- Enhanced error logging with detailed information (name, message, code, metadata)
- Added specific error messages for different error types:
  - AWS credential errors
  - Resource not found errors
  - Not authorized errors
  - User not confirmed errors
  - Invalid parameter errors

### 2. Simplified Error Handling in `lib/auth.ts`

**Issues Fixed:**
- Duplicate error handling (errors were being handled in both cognito.ts and auth.ts)
- Error messages might not be passed through NextAuth correctly

**Fixes:**
- Simplified to use error messages from `cognito.ts` (which has comprehensive error handling)
- Enhanced logging to track error flow
- Preserved error structure for NextAuth

### 3. Created Diagnostic Script

**New File:** `scripts/test-cognito-connection.ts`

This script tests:
- AWS credentials configuration
- Cognito User Pool connection
- API call permissions
- Basic connectivity

**Usage:**
```bash
npx tsx scripts/test-cognito-connection.ts
```

## 🔍 How to Debug Login Errors

### Step 1: Check Server Console

When you try to login, look at the terminal running `npm run dev`. You should see:

```
🔐 Attempting USER_PASSWORD_AUTH flow...
❌ Cognito sign in error:
   Name: [Error Name]
   Message: [Error Message]
   Code: [Error Code]
   $metadata: [Metadata]
📤 Throwing error to NextAuth: [Error Message]
```

### Step 2: Check Browser Console

Open DevTools (F12) → Console tab:

```javascript
Sign in result: { ok: false, error: "...", ... }
Result error: "actual error message"
```

### Step 3: Run Diagnostic Script

```bash
npx tsx scripts/test-cognito-connection.ts
```

This will verify:
- ✅ AWS credentials are configured
- ✅ Cognito User Pool exists
- ✅ API permissions are correct

### Step 4: Run Debug Login Script

```bash
npx tsx scripts/debug-login.ts your-email@example.com your-password
```

This will show the complete authentication flow.

## 🐛 Common Errors and Solutions

### Error: "AWS credentials are not configured"

**Cause:** `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` not set or using placeholder values

**Fix:**
1. Check `.env` file has real AWS credentials
2. Restart dev server after updating `.env`
3. Verify credentials have Cognito permissions

### Error: "Invalid AWS credentials"

**Cause:** AWS credentials are incorrect or don't have permissions

**Fix:**
1. Verify credentials in AWS IAM Console
2. Check IAM user has `AmazonCognitoPowerUser` policy (or equivalent)
3. Regenerate access keys if needed

### Error: "Cognito resource not found"

**Cause:** `COGNITO_USER_POOL_ID` or `COGNITO_CLIENT_ID` is incorrect

**Fix:**
1. Go to AWS Cognito Console
2. Verify User Pool ID matches `.env`
3. Verify App Client ID matches `.env`
4. Update `.env` and restart server

### Error: "USER_PASSWORD_AUTH flow is not enabled"

**Cause:** The Cognito app client doesn't have `USER_PASSWORD_AUTH` flow enabled

**Fix:**
1. Go to AWS Cognito Console
2. Select your User Pool
3. Go to "App integration" → "App clients"
4. Click on your app client
5. Under "Authentication flows configuration", enable:
   - ✅ **ALLOW_USER_PASSWORD_AUTH**
6. Save changes

**Note:** The code will automatically fall back to `ADMIN_NO_SRP_AUTH` if `USER_PASSWORD_AUTH` is not enabled, but it's better to enable it.

### Error: "Invalid email or password"

**Cause:** Wrong credentials or user doesn't exist in Cognito

**Fix:**
1. Verify email and password are correct
2. Check user exists in Cognito User Pool
3. Verify user is confirmed (not pending)

### Error: "You do not have permission to access the dashboard"

**Cause:** User's `canLogin` is `false` or `status` is not `ACTIVE`

**Fix:**
1. Update user in database:
   ```sql
   UPDATE "User" SET "canLogin" = true, status = 'ACTIVE' WHERE email = 'user@example.com';
   ```
2. Or use admin panel to enable login

## 🔧 Verification Checklist

Before reporting an error, verify:

- [ ] AWS credentials are set in `.env` (not placeholders)
- [ ] `COGNITO_USER_POOL_ID` is correct
- [ ] `COGNITO_CLIENT_ID` is correct
- [ ] `COGNITO_REGION` is correct
- [ ] Dev server was restarted after `.env` changes
- [ ] `test-cognito-connection.ts` script passes
- [ ] User exists in Cognito User Pool
- [ ] User is confirmed in Cognito
- [ ] User has `canLogin: true` or is ADMIN in database
- [ ] User has `status: ACTIVE` in database
- [ ] Checked server console for detailed error logs
- [ ] Checked browser console for error messages

## 📝 Next Steps

1. **Run the diagnostic script:**
   ```bash
   npx tsx scripts/test-cognito-connection.ts
   ```

2. **Try logging in and check server console** for detailed error messages

3. **If error persists, check:**
   - Server console logs (detailed error info)
   - Browser console logs
   - Network tab in DevTools (check `/api/auth/signin` response)

4. **Share error details:**
   - Error name from server console
   - Error message from server console
   - Full error output from `test-cognito-connection.ts`

## 🎯 Expected Behavior

When everything is configured correctly:

1. User enters email/password
2. System attempts `USER_PASSWORD_AUTH` flow
3. If successful, user is authenticated
4. If flow not enabled, automatically falls back to `ADMIN_NO_SRP_AUTH`
5. User details are fetched from Cognito
6. User is found/created in database
7. Permissions are checked
8. User is logged in and redirected to dashboard

If any step fails, you'll see a detailed error message in the server console.

