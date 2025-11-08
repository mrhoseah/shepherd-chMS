# Cognito Direct HTTP Authentication (No AWS Credentials)

## ✅ What Changed

I've created a new authentication method that uses **direct HTTP requests** to Cognito, just like your Go app. This approach:

- ✅ **No AWS credentials needed** for user authentication
- ✅ **No AWS SDK required** for authentication
- ✅ Uses direct HTTP calls to Cognito endpoints
- ✅ Same as your Express.js example with `openid-client`

## 📁 New File: `lib/cognito-direct.ts`

This file contains:
- `signInWithCognitoDirect()` - Direct HTTP call to `InitiateAuth` endpoint
- `getUserFromTokenDirect()` - Direct HTTP call to `GetUser` endpoint

Both use standard `fetch()` API - no AWS SDK, no credentials needed.

## 🔄 How It Works

### Before (AWS SDK):
```typescript
// Required AWS credentials to initialize SDK client
const client = new CognitoIdentityProviderClient({
  region: "af-south-1",
  credentials: { accessKeyId, secretAccessKey }
});
await client.send(new InitiateAuthCommand({...}));
```

### Now (Direct HTTP):
```typescript
// No credentials needed - direct HTTP call
const response = await fetch("https://cognito-idp.af-south-1.amazonaws.com/", {
  method: "POST",
  headers: {
    "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    "Content-Type": "application/x-amz-json-1.1",
  },
  body: JSON.stringify({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: "...",
    AuthParameters: { USERNAME: email, PASSWORD: password }
  })
});
```

## ✅ What You Still Need

**For user authentication:**
- ✅ User Pool ID
- ✅ Client ID
- ✅ Region
- ✅ Client Secret (if your app client has one)
- ❌ **NO AWS Access Key/Secret Key needed!**

**For admin operations** (creating users, etc.):
- ⚠️ AWS credentials still needed (for `AdminCreateUser`, `AdminSetUserPassword`)

## 🔧 Current Status

The code has been updated to use direct HTTP calls. Your `.env` file now only needs:

```env
# Cognito Configuration (required)
COGNITO_USER_POOL_ID=af-south-1_HZYIpahzs
COGNITO_CLIENT_ID=6qbvncedqjvi2jrpqhjj22ei7g
COGNITO_REGION=af-south-1
COGNITO_CLIENT_SECRET=your-client-secret-if-applicable

# AWS Credentials (OPTIONAL - only needed for admin operations)
# You can remove these if you don't need admin operations
AWS_ACCESS_KEY_ID=optional
AWS_SECRET_ACCESS_KEY=optional
```

## 🎯 Next Steps

1. **Enable authentication flows** in Cognito Console (still required)
   - Go to AWS Cognito Console
   - Enable `ALLOW_USER_PASSWORD_AUTH` flow
   - See `ENABLE_COGNITO_AUTH_FLOWS.md`

2. **Test authentication:**
   ```bash
   npx tsx scripts/debug-login.ts your-email@example.com your-password
   ```

3. **If you don't need admin operations**, you can remove AWS credentials from `.env`

## 📝 Note

The old `lib/cognito.ts` file is still there for admin operations. The authentication flow now uses `lib/cognito-direct.ts` which doesn't require AWS credentials.

