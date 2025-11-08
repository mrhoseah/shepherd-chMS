# Quick Fix: Cognito Client ID Issue

## ❌ Current Problem

**Error**: `User pool client 2e0nfb1h5vg24r0692ff14i3d2 does not exist`

This means the Client ID in your `.env` file doesn't match any app client in your Cognito User Pool.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Get Correct Client ID from AWS

1. **Open AWS Cognito Console**
   - URL: https://console.aws.amazon.com/cognito/
   - Make sure you're in region: **af-south-1**

2. **Find Your User Pool**
   - Click on: `af-south-1_HZYIpahzs`
   - (Or search for it if you have many pools)

3. **Get App Client ID**
   - Click **"App integration"** tab
   - Scroll to **"App clients and analytics"** section
   - You'll see a list of app clients
   - **Copy the Client ID** (it's a long string like `abc123def456...`)

### Step 2: Update .env File

Open your `.env` file and update:

```env
COGNITO_CLIENT_ID=paste-the-correct-client-id-here
```

**Important**: Make sure there are no extra spaces or quotes around the ID.

### Step 3: Restart Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Try Login Again

Go to: http://localhost:3000/auth/signin

---

## 🔧 If Client Doesn't Exist - Create New One

If you don't see any app clients, create one:

1. **In Cognito Console** → Your User Pool → **"App integration"**
2. **Click "Create app client"**
3. **Fill in:**
   - **App client name**: `eastgate-web`
   - **Auth flows**: ✅ Check **"ALLOW_USER_PASSWORD_AUTH"** (CRITICAL!)
   - Leave other settings as default
4. **Click "Create app client"**
5. **Copy the Client ID** that appears
6. **Update `.env` file** with the new Client ID
7. **Restart server**

---

## ✅ Verify It's Working

After updating, you should see in the browser console (F12):
- No more "does not exist" errors
- Login should work

If you still see errors, check:
- ✅ Client ID is correct (no typos)
- ✅ Region matches (af-south-1)
- ✅ User Pool ID is correct
- ✅ AWS credentials are valid

---

## 🆘 Still Not Working?

Run the debug script:

```bash
npx tsx scripts/debug-login.ts your-email@example.com your-password
```

This will show you exactly what's wrong.

