# Enable USER_PASSWORD_AUTH Flow in Cognito

## ✅ Current Status

- ✅ Client ID: `6qbvncedqjvi2jrpqhjj22ei7g` - Correct
- ✅ Client Secret: Configured
- ✅ SECRET_HASH: Working
- ❌ **USER_PASSWORD_AUTH flow not enabled**

## 🔧 Fix Required

The Cognito app client needs to have the `USER_PASSWORD_AUTH` authentication flow enabled.

### Steps to Enable:

1. **Go to AWS Cognito Console**
   - URL: https://console.aws.amazon.com/cognito/
   - Region: `af-south-1`

2. **Select Your User Pool**
   - Click on: `af-south-1_HZYIpahzs`

3. **Go to App Integration Tab**
   - Click "App integration" in the left sidebar

4. **Find Your App Client**
   - Scroll to "App clients and analytics" section
   - Find client: `6qbvncedqjvi2jrpqhjj22ei7g`
   - Click on the client name

5. **Edit Authentication Flows**
   - Look for "Authentication flows configuration" or "Hosted UI settings"
   - Click "Edit"

6. **Enable USER_PASSWORD_AUTH**
   - Find "Authentication flows"
   - ✅ Check **"ALLOW_USER_PASSWORD_AUTH"**
   - ✅ Check **"ALLOW_REFRESH_TOKEN_AUTH"** (recommended)
   - Save changes

7. **Alternative: Use App Client Settings**
   - If you see "App client settings" instead
   - Look for "Allowed OAuth flows"
   - Enable "ALLOW_USER_PASSWORD_AUTH"

## 📝 After Enabling

1. **Wait 1-2 minutes** for changes to propagate
2. **Try login again**
3. **Check server logs** for any remaining errors

## ✅ Expected Result

After enabling, you should see:
- ✅ Successful Cognito authentication
- ✅ User found/created in database
- ✅ Login successful

## 🆘 If Still Not Working

If you still get errors after enabling:

1. **Verify the flow is enabled:**
   - Go back to app client settings
   - Confirm "ALLOW_USER_PASSWORD_AUTH" is checked

2. **Check for other required settings:**
   - OAuth scopes (if using OAuth)
   - Callback URLs (if using Hosted UI)

3. **Try using a different auth flow:**
   - If USER_PASSWORD_AUTH can't be enabled, we can switch to ADMIN_NO_SRP_AUTH
   - This requires admin credentials but doesn't need the flow enabled

---

## 🔄 Quick Reference

**Error:** `USER_PASSWORD_AUTH flow not enabled for this client`

**Solution:** Enable ALLOW_USER_PASSWORD_AUTH in Cognito app client settings

**Location:** AWS Cognito → User Pool → App Integration → App Client → Authentication Flows

