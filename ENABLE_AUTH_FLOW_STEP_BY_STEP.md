# Enable USER_PASSWORD_AUTH Flow - Step by Step

## 🎯 The Problem

**Error:** `USER_PASSWORD_AUTH flow is not enabled for this Cognito app client`

Your Cognito app client doesn't have the authentication flow enabled. This is a **one-time configuration** in AWS Console.

## ✅ Step-by-Step Solution

### Step 1: Open AWS Cognito Console

1. Go to: **https://console.aws.amazon.com/cognito/**
2. Make sure you're in the correct region: **af-south-1** (check top-right corner)
3. If you're in the wrong region, click the region dropdown and select **af-south-1**

### Step 2: Find Your User Pool

1. In the left sidebar, click **"User pools"**
2. You should see a list of user pools
3. Find and click on: **"af-south-1_HZYIpahzs"** (or "Shepherds chMS- r7j3uv")
4. Click on the **pool name** (not the ID) to open it

### Step 3: Navigate to App Clients

1. Once inside the User Pool, look at the top tabs
2. Click on **"App integration"** tab
3. Scroll down to find **"App clients and analytics"** section
4. You should see your app client listed with ID: **6qbvncedqjvi2jrpqhjj22ei7g**
5. **Click on the app client name** (the text, not just the ID)

### Step 4: Edit App Client Settings

1. You should now be on the app client details page
2. Look for a button that says **"Edit"** (usually at the top right or in a settings section)
3. Click **"Edit"**

### Step 5: Enable Authentication Flows

1. Scroll down to find **"Authentication flows configuration"** section
2. You should see checkboxes for different authentication flows:
   - ☐ ALLOW_USER_SRP_AUTH
   - ☐ ALLOW_REFRESH_TOKEN_AUTH
   - ☐ **ALLOW_USER_PASSWORD_AUTH** ← **CHECK THIS ONE!**
   - ☐ ALLOW_ADMIN_USER_PASSWORD_AUTH (optional)
   - ☐ ALLOW_CUSTOM_AUTH (optional)

3. **Check the box** next to **"ALLOW_USER_PASSWORD_AUTH"**
4. Also check **"ALLOW_REFRESH_TOKEN_AUTH"** (recommended for token refresh)

### Step 6: Save Changes

1. Scroll to the bottom of the page
2. Click **"Save changes"** button
3. Wait for confirmation message

### Step 7: Wait and Test

1. **Wait 1-2 minutes** for changes to propagate
2. Try logging in again
3. If it still doesn't work, restart your dev server:
   ```bash
   npm run dev
   ```

## 🔍 Alternative: If You Can't Find the Settings

If you don't see "Authentication flows configuration":

1. Look for **"Hosted UI settings"** → Click **"Edit"**
2. Or look for **"Advanced app client settings"** → Click **"Edit"**
3. Or try **"App client settings"** → Click **"Edit"**

The exact location varies by AWS Console version, but it's always in the app client edit page.

## 📝 Quick Reference

**Your Configuration:**
- **User Pool ID:** `af-south-1_HZYIpahzs`
- **App Client ID:** `6qbvncedqjvi2jrpqhjj22ei7g`
- **Region:** `af-south-1`

**What to Enable:**
- ✅ **ALLOW_USER_PASSWORD_AUTH** (Required)
- ✅ **ALLOW_REFRESH_TOKEN_AUTH** (Recommended)

## ⚠️ Common Issues

### "I can't find the Edit button"
- Make sure you clicked on the **app client name**, not just viewed it in the list
- Try refreshing the page
- Check if you have permissions to edit the app client

### "I enabled it but it still doesn't work"
- Wait 2-3 minutes for changes to propagate
- Restart your dev server
- Clear browser cache and cookies
- Check server console for the exact error

### "The option is grayed out"
- Your app client might have a client secret configured
- If it has a secret, USER_PASSWORD_AUTH should still work
- Make sure you're using the correct Client Secret in your `.env` file

## 🧪 Verify It's Enabled

After enabling, you can verify by checking the app client details page - you should see:
- ✅ ALLOW_USER_PASSWORD_AUTH: **Enabled**

## 🆘 Still Having Issues?

1. **Check server console** - What exact error do you see?
2. **Check browser console** - Any JavaScript errors?
3. **Verify Client ID** - Make sure `COGNITO_CLIENT_ID` in `.env` matches the one in Console
4. **Try creating a new app client** if the current one has issues

