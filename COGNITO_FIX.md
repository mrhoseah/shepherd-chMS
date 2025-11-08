# Cognito Configuration Fix

## ❌ Current Issue

**Error**: `User pool client 2e0nfb1h5vg24r0692ff14i3d2 does not exist.`

This means the Cognito User Pool Client ID in your `.env` file doesn't match an actual client in your AWS Cognito User Pool.

---

## ✅ Solution Steps

### Option 1: Verify and Update Client ID

1. **Go to AWS Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - Select your region: `af-south-1`

2. **Find Your User Pool**
   - Look for User Pool: `af-south-1_HZYIpahzs`
   - Click on it

3. **Get the Correct Client ID**
   - Go to "App integration" tab
   - Scroll to "App clients and analytics"
   - Find your app client
   - Copy the **Client ID** (not Client secret)

4. **Update `.env` file**
   ```env
   COGNITO_CLIENT_ID=your-actual-client-id-here
   COGNITO_USER_POOL_ID=af-south-1_HZYIpahzs
   COGNITO_REGION=af-south-1
   ```

### Option 2: Create a New App Client

If the client doesn't exist, create a new one:

1. **In Cognito Console** → Your User Pool → "App integration"
2. **Click "Create app client"**
3. **Configure:**
   - **App client name**: `eastgate-web-client`
   - **Auth flows**: ✅ **ALLOW_USER_PASSWORD_AUTH** (IMPORTANT!)
   - **OAuth 2.0 grant types**: Not required for this setup
4. **Save and copy the Client ID**
5. **Update `.env` file** with the new Client ID

### Option 3: Verify User Pool Exists

1. **Check if User Pool exists:**
   - Go to Cognito Console
   - Check if `af-south-1_HZYIpahzs` exists
   - If not, you need to create it or use a different User Pool ID

---

## 🔍 Quick Verification

Run this command to test your Cognito configuration:

```bash
npm run db:seed
```

Or use the test script:

```bash
npx tsx scripts/test-login.ts
```

---

## 📝 Required Environment Variables

Make sure your `.env` file has:

```env
# AWS Cognito
COGNITO_USER_POOL_ID=af-south-1_HZYIpahzs
COGNITO_CLIENT_ID=your-actual-client-id
COGNITO_REGION=af-south-1

# AWS Credentials (for admin operations)
AWS_ACCESS_KEY_ID=your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key

# NextAuth
NEXTAUTH_SECRET=your-secret-key
```

---

## 🚨 Common Issues

### Issue 1: Client ID Mismatch
- **Symptom**: "User pool client does not exist"
- **Fix**: Get the correct Client ID from Cognito Console

### Issue 2: Wrong Region
- **Symptom**: "User pool does not exist"
- **Fix**: Verify region matches your User Pool region

### Issue 3: USER_PASSWORD_AUTH Not Enabled
- **Symptom**: "Invalid auth flow"
- **Fix**: Enable "ALLOW_USER_PASSWORD_AUTH" in app client settings

### Issue 4: Invalid AWS Credentials
- **Symptom**: "UnrecognizedClientException" or "Invalid security token"
- **Fix**: Update AWS credentials in `.env`

---

## ✅ After Fixing

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test login again** with `mrhoseah@gmail.com`

3. **Check server console** for any remaining errors

---

## 📞 Need Help?

If you're still having issues:

1. **Check AWS Console** - Verify User Pool and Client exist
2. **Check Server Logs** - Look for detailed error messages
3. **Verify Credentials** - Ensure AWS credentials have Cognito permissions
4. **Test Cognito Directly** - Use AWS CLI to test:
   ```bash
   aws cognito-idp initiate-auth \
     --client-id YOUR_CLIENT_ID \
     --auth-flow USER_PASSWORD_AUTH \
     --auth-parameters USERNAME=email@example.com,PASSWORD=password \
     --region af-south-1
   ```

