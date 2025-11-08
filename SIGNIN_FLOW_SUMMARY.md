# Signin Flow - Quick Summary

## 🔄 The Flow (Simple Version)

```
User Types Email/Password
    ↓
Frontend: signIn("Cognito", {email, password})
    ↓
POST /api/auth/signin (NextAuth)
    ↓
authorize() function runs
    ↓
1. signInWithCognito() → AWS Cognito
2. getUserFromToken() → Get user info
3. Find user in database (Prisma)
4. Check permissions (canLogin, status, role)
    ↓
Return user object OR throw error
    ↓
NextAuth callbacks (jwt, session)
    ↓
Return result to frontend
    ↓
Frontend: Redirect to dashboard OR show error
```

---

## 🎯 Current Problem

**Error:** "Login failed. Please check your credentials..."

**Most Likely Cause:** Cognito Client ID doesn't exist

**Error Location:** Step 1 (signInWithCognito)

---

## 🔍 How to Debug

### 1. Check Server Terminal
Look for:
```
❌ Cognito authentication error: ResourceNotFoundException: User pool client does not exist
```

### 2. Check Browser Console (F12)
Look for:
```javascript
Sign in result: { ok: false, error: "...", ... }
Result error: "actual error message"
```

### 3. Run Debug Script
```bash
npx tsx scripts/debug-login.ts your-email@example.com your-password
```

---

## ✅ Quick Fix

1. **Get Correct Client ID from AWS Cognito Console**
2. **Update `.env` file:**
   ```env
   COGNITO_CLIENT_ID=your-actual-client-id
   ```
3. **Restart server:**
   ```bash
   npm run dev
   ```

---

## 📚 Full Documentation

See `SIGNIN_FLOW.md` for complete details.

