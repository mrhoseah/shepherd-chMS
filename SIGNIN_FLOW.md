# Signin Flow - Complete Documentation

## 🔄 Complete Authentication Flow

### Step-by-Step Process

```
1. User enters email/password
   ↓
2. Frontend: signIn() from next-auth/react
   ↓
3. POST /api/auth/signin (NextAuth endpoint)
   ↓
4. NextAuth routes to CredentialsProvider
   ↓
5. authorize() function in lib/auth.ts
   ↓
6. signInWithCognito() - AWS Cognito authentication
   ↓
7. getUserFromToken() - Get user attributes from Cognito
   ↓
8. Find/Create user in database (Prisma)
   ↓
9. Check permissions (canLogin, status, role)
   ↓
10. Return user object OR throw error
   ↓
11. NextAuth callbacks (signIn, jwt, session)
   ↓
12. Return result to frontend
   ↓
13. Frontend handles result (redirect or show error)
```

---

## 📍 Detailed Flow Breakdown

### 1. **Frontend (app/auth/signin/page.tsx)**

**User Action:**
- User fills form and clicks "Sign In"
- `handleSubmit()` is called

**Code:**
```typescript
const result = await signIn("Cognito", {
  email,
  password,
  redirect: false,
});
```

**What happens:**
- Calls NextAuth's `signIn()` function
- Sends POST request to `/api/auth/signin`
- Waits for response

---

### 2. **NextAuth API Route (app/api/auth/[...nextauth]/route.ts)**

**Endpoint:** `POST /api/auth/signin`

**What happens:**
- NextAuth receives the request
- Routes to the "Cognito" provider (CredentialsProvider)
- Calls the `authorize()` function with credentials

---

### 3. **Authorize Function (lib/auth.ts)**

**Function:** `authorize(credentials)`

**Step 3.1: Validate Input**
```typescript
if (!credentials?.email || !credentials?.password) {
  return null; // Invalid input
}
```

**Step 3.2: Authenticate with Cognito**
```typescript
const cognitoResponse = await signInWithCognito(
  credentials.email,
  credentials.password
);
```

**What happens:**
- Calls AWS Cognito API
- Uses `USER_PASSWORD_AUTH` flow
- Returns access token, ID token, refresh token

**Possible Errors:**
- ❌ Invalid credentials
- ❌ User not confirmed
- ❌ Cognito client doesn't exist
- ❌ AWS credentials invalid

**Step 3.3: Get User from Cognito**
```typescript
const cognitoUser = await getUserFromToken(
  cognitoResponse.accessToken
);
```

**What happens:**
- Uses access token to get user attributes
- Extracts: email, name, phone, etc.

**Step 3.4: Find/Create User in Database**
```typescript
let user = await prisma.user.findUnique({
  where: { email: credentials.email }
});
```

**If user doesn't exist:**
- Creates new user with role="GUEST", canLogin=false
- Status="ACTIVE"

**If user exists:**
- Updates user info from Cognito
- Preserves role and canLogin

**Step 3.5: Check Permissions**
```typescript
const isAdmin = user.role === "ADMIN";
const canLogin = isAdmin || (user.canLogin && user.status === "ACTIVE");
```

**Rules:**
- ✅ ADMIN: Always can login
- ✅ Others: Need `canLogin=true` AND `status=ACTIVE`

**If not allowed:**
- Throws error with specific message

**Step 3.6: Return User Object**
```typescript
return {
  id: user.id,
  email: user.email,
  name: `${user.firstName} ${user.lastName}`,
  role: user.role,
  accessToken: cognitoResponse.accessToken,
  idToken: cognitoResponse.idToken,
};
```

**On Error:**
- Throws error with message
- NextAuth catches and passes to client

---

### 4. **NextAuth Callbacks**

**4.1: signIn Callback**
```typescript
async signIn({ user, account, profile }) {
  return true; // Allow sign in
}
```

**4.2: jwt Callback**
```typescript
async jwt({ token, user }) {
  // Add user data to JWT token
  token.id = user.id;
  token.role = user.role;
  return token;
}
```

**4.3: session Callback**
```typescript
async session({ session, token }) {
  // Add user data to session
  session.user.id = token.id;
  session.user.role = token.role;
  return session;
}
```

---

### 5. **Response to Frontend**

**Success:**
```typescript
{
  ok: true,
  error: null,
  status: 200,
  url: null
}
```

**Error:**
```typescript
{
  ok: false,
  error: "Error message here",
  status: 401,
  url: null
}
```

---

### 6. **Frontend Handling**

**Success:**
```typescript
if (result?.ok) {
  router.push("/dashboard");
  router.refresh();
}
```

**Error:**
```typescript
if (result?.error) {
  // Parse error and show user-friendly message
  setError(parsedErrorMessage);
}
```

---

## 🔍 Where Errors Can Occur

### Error Point 1: Cognito Authentication
**Location:** `lib/cognito.ts` → `signInWithCognito()`

**Common Errors:**
- `ResourceNotFoundException` - Client ID doesn't exist
- `NotAuthorizedException` - Wrong password
- `UserNotConfirmedException` - User not confirmed
- `UnrecognizedClientException` - Invalid AWS credentials

**Error Flow:**
```
Cognito Error → signInWithCognito() throws → authorize() catches → throws to NextAuth → client receives
```

### Error Point 2: Database Query
**Location:** `lib/auth.ts` → `prisma.user.findUnique()`

**Common Errors:**
- Database connection failed
- User not found (handled by creating new user)

### Error Point 3: Permission Check
**Location:** `lib/auth.ts` → Permission validation

**Common Errors:**
- `canLogin = false`
- `status ≠ ACTIVE`
- Not admin and no permission

**Error Flow:**
```
Permission check fails → throw Error → authorize() catches → throws to NextAuth → client receives
```

---

## 🐛 Debugging the Flow

### Check Server Logs

When you try to login, check the terminal running `npm run dev`:

```bash
# You should see:
Cognito authentication error: [error details]
Error details: { message, code, name }
```

### Check Browser Console

Open DevTools (F12) → Console tab:

```javascript
// You should see:
Sign in result: { ok: false, error: "...", ... }
Result error: "actual error message"
Result ok: false
```

### Check Network Tab

Open DevTools (F12) → Network tab:

1. Look for request to `/api/auth/signin`
2. Check the response
3. Look for error messages in response body

---

## 🔧 Common Issues & Fixes

### Issue 1: "Login failed" (Generic Error)

**Cause:** Error not being passed through NextAuth properly

**Fix:** Check server logs for actual error, then fix the root cause

### Issue 2: Cognito Client Doesn't Exist

**Error:** `ResourceNotFoundException: User pool client does not exist`

**Fix:**
1. Go to AWS Cognito Console
2. Get correct Client ID
3. Update `.env` file
4. Restart server

### Issue 3: Invalid Credentials

**Error:** `NotAuthorizedException`

**Fix:**
- Check email/password are correct
- Verify user exists in Cognito
- Check user is confirmed

### Issue 4: Permission Denied

**Error:** "You do not have permission to access the dashboard"

**Fix:**
- User needs `canLogin: true` OR be ADMIN
- User needs `status: ACTIVE`
- Update via admin panel or database

---

## 📊 Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. signIn("Cognito", {email, password})
       ↓
┌──────────────────────┐
│  /api/auth/signin     │
│  (NextAuth Handler)   │
└──────┬───────────────┘
       │ 2. Route to CredentialsProvider
       ↓
┌──────────────────────┐
│  authorize()         │
│  (lib/auth.ts)       │
└──────┬───────────────┘
       │ 3. signInWithCognito()
       ↓
┌──────────────────────┐
│  AWS Cognito API     │
│  (USER_PASSWORD_AUTH)│
└──────┬───────────────┘
       │ 4. Return tokens
       ↓
┌──────────────────────┐
│  getUserFromToken()  │
│  (Get user attrs)    │
└──────┬───────────────┘
       │ 5. Find/Create in DB
       ↓
┌──────────────────────┐
│  Prisma Database     │
│  (User lookup)       │
└──────┬───────────────┘
       │ 6. Check permissions
       ↓
┌──────────────────────┐
│  Permission Check    │
│  (canLogin, status)  │
└──────┬───────────────┘
       │ 7. Return user OR throw error
       ↓
┌──────────────────────┐
│  NextAuth Callbacks  │
│  (signIn, jwt, session)│
└──────┬───────────────┘
       │ 8. Return result
       ↓
┌─────────────┐
│   Browser   │
│  (Frontend) │
└─────────────┘
```

---

## 🎯 Current Issue

Based on the error "Login failed", the issue is likely:

1. **Cognito Client ID doesn't exist** (most likely)
   - Fix: Update `COGNITO_CLIENT_ID` in `.env`

2. **Error not being passed through NextAuth**
   - The error is being thrown but NextAuth isn't passing it to client
   - Check server logs for actual error

3. **Silent failure**
   - Error is caught but not displayed
   - Check browser console for actual error

---

## 🔍 Next Steps to Debug

1. **Check Server Logs**
   ```bash
   # Look for "Cognito authentication error" in terminal
   ```

2. **Check Browser Console**
   ```bash
   # Open F12 → Console
   # Look for "Sign in result" and "Result error"
   ```

3. **Check Network Tab**
   ```bash
   # Open F12 → Network
   # Find /api/auth/signin request
   # Check response body
   ```

4. **Run Debug Script**
   ```bash
   npx tsx scripts/debug-login.ts your-email@example.com your-password
   ```

This will show you exactly where the flow is breaking!

