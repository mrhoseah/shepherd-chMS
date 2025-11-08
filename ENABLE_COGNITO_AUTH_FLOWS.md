# Enable Cognito Authentication Flows - URGENT FIX

## ❌ Current Error

**Error:** `Auth flow not enabled for this client`

Both `USER_PASSWORD_AUTH` and `ADMIN_NO_SRP_AUTH` flows are failing because **no authentication flows are enabled** on your Cognito app client.

## ✅ Solution: Enable Authentication Flows

### Step 1: Go to AWS Cognito Console

1. Open: https://console.aws.amazon.com/cognito/
2. Make sure you're in the correct region: **af-south-1**
3. Click on **User pools** in the left sidebar

### Step 2: Select Your User Pool

1. Find and click on: **af-south-1_HZYIpahzs** (or "Shepherds chMS- r7j3uv")
2. Click on it to open

### Step 3: Go to App Clients

1. Click on **"App integration"** tab
2. Scroll down to **"App clients and analytics"** section
3. Find your app client with ID: **6qbvncedqjvi2jrpqhjj22ei7g**
4. **Click on the app client name** (not the ID)

### Step 4: Enable Authentication Flows

1. You should see the app client details page
2. Scroll down to **"Authentication flows configuration"** section
3. Click **"Edit"** button
4. Under **"Authentication flows"**, enable:
   - ✅ **ALLOW_USER_PASSWORD_AUTH** (Required for user login)
   - ✅ **ALLOW_REFRESH_TOKEN_AUTH** (Recommended for token refresh)
   - ✅ **ALLOW_USER_SRP_AUTH** (Optional, but recommended)

5. **IMPORTANT:** If you see **"ALLOW_ADMIN_USER_PASSWORD_AUTH"**, you can enable that too as a fallback

6. Click **"Save changes"**

### Step 5: Verify

After saving, the authentication flows should be enabled. Try logging in again.

## 🔍 Alternative: Check Current Settings

If you can't find the authentication flows section:

1. In the app client details page, look for:
   - **"Hosted UI settings"** → Click **"Edit"**
   - Or **"Advanced app client settings"** → Click **"Edit"**

2. Look for sections like:
   - **"Authentication flows"**
   - **"Allowed OAuth flows"**
   - **"Allowed OAuth scopes"**

## 📝 What Each Flow Does

- **ALLOW_USER_PASSWORD_AUTH**: Allows users to sign in with email/password (what we need)
- **ALLOW_ADMIN_USER_PASSWORD_AUTH**: Allows admin-initiated authentication (fallback)
- **ALLOW_REFRESH_TOKEN_AUTH**: Allows refreshing access tokens
- **ALLOW_USER_SRP_AUTH**: Secure Remote Password protocol (alternative to USER_PASSWORD_AUTH)

## ⚠️ Important Notes

1. **After enabling flows, wait 1-2 minutes** for changes to propagate
2. **Restart your dev server** after making changes
3. **Clear browser cookies** and try logging in again

## 🧪 Test After Enabling

Run the debug script to verify:

```bash
npx tsx scripts/debug-login.ts your-email@example.com your-password
```

You should see:
```
✅ USER_PASSWORD_AUTH flow successful
```

Instead of:
```
❌ ADMIN_NO_SRP_AUTH also failed: Auth flow not enabled for this client
```

## 🆘 Still Not Working?

If you still get errors after enabling flows:

1. **Check the exact error message** in server console
2. **Verify the app client ID** matches: `6qbvncedqjvi2jrpqhjj22ei7g`
3. **Check IAM permissions** - your AWS credentials need:
   - `cognito-idp:InitiateAuth`
   - `cognito-idp:AdminInitiateAuth`
   - `cognito-idp:GetUser`

4. **Try creating a new app client** if the current one has issues:
   - Create new app client
   - Enable ALLOW_USER_PASSWORD_AUTH
   - Update COGNITO_CLIENT_ID in .env
   - Restart server

