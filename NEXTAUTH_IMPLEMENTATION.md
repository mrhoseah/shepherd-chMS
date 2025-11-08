# NextAuth Implementation Guide

## Overview

This is a clean, professional NextAuth.js v4 implementation using AWS Cognito for authentication via direct HTTP calls (no AWS SDK credentials required for authentication).

## Architecture

### Files Structure

```
lib/
  ├── auth.ts              # NextAuth configuration
  ├── cognito-direct.ts    # Direct HTTP calls to Cognito
  └── error-logger.ts       # Error logging utility

app/
  ├── api/auth/[...nextauth]/route.ts  # NextAuth API route handler
  └── auth/signin/page.tsx             # Sign-in page

types/
  └── next-auth.d.ts       # TypeScript type definitions
```

## Key Features

1. **Direct HTTP Authentication**: Uses direct HTTP calls to Cognito, no AWS SDK credentials needed
2. **Type Safety**: Full TypeScript support with custom type definitions
3. **Error Handling**: Comprehensive error logging and user-friendly error messages
4. **Session Management**: JWT-based sessions with 30-day expiration
5. **User Sync**: Automatically syncs user data from Cognito to local database

## Configuration

### Environment Variables

Required:
- `COGNITO_USER_POOL_ID` - AWS Cognito User Pool ID
- `COGNITO_CLIENT_ID` - AWS Cognito App Client ID
- `COGNITO_REGION` - AWS Region (e.g., `af-south-1`)
- `NEXTAUTH_SECRET` - Secret for JWT signing

Optional:
- `COGNITO_CLIENT_SECRET` - Only if your app client has a secret
- `NODE_ENV` - Set to `production` for secure cookies

### NextAuth Configuration (`lib/auth.ts`)

```typescript
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      id: "cognito",
      // ... configuration
    }),
  ],
  callbacks: {
    signIn,   // Validates user
    jwt,      // Adds user data to JWT token
    session,  // Adds user data to session
  },
};
```

## Authentication Flow

1. **User submits credentials** → Sign-in page
2. **NextAuth receives request** → `/api/auth/signin/cognito`
3. **Authorize function** → Authenticates with Cognito via direct HTTP
4. **User sync** → Creates/updates user in database
5. **Permission check** → Validates user can login
6. **JWT creation** → Stores user data in JWT token
7. **Session creation** → Returns session to client

## Usage

### Sign In

```typescript
import { signIn } from "next-auth/react";

const result = await signIn("cognito", {
  email: "user@example.com",
  password: "password",
  redirect: false,
});

if (result?.ok) {
  // Success
} else if (result?.error) {
  // Handle error
}
```

### Get Session

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (session?.user) {
  // User is authenticated
  const userId = session.user.id;
  const role = session.user.role;
}
```

### Client-Side Session

```typescript
import { useSession } from "next-auth/react";

function Component() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not signed in</div>;
  
  return <div>Signed in as {session.user.email}</div>;
}
```

## Error Handling

Errors are automatically logged to `auth-errors.json` for debugging. Common errors:

- **Invalid email or password** → Wrong credentials
- **Flow not enabled** → Enable `ALLOW_USER_PASSWORD_AUTH` in Cognito
- **Resource not found** → Check `COGNITO_CLIENT_ID` and `COGNITO_USER_POOL_ID`
- **Permission denied** → User doesn't have `canLogin` permission

## Type Definitions

Custom types are defined in `types/next-auth.d.ts`:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}
```

## Security

1. **JWT Strategy**: No database queries for session validation
2. **Secure Cookies**: Enabled in production
3. **Direct HTTP**: No AWS credentials exposed for authentication
4. **Error Logging**: Sensitive data is masked in logs

## Troubleshooting

### `signIn()` returns `undefined`

- Check that the NextAuth route handler is properly configured
- Ensure the provider ID matches (`"cognito"`)
- Check server logs for errors

### Authentication fails

1. Check `auth-errors.json` for detailed error logs
2. Verify Cognito configuration in `.env`
3. Ensure `ALLOW_USER_PASSWORD_AUTH` is enabled in Cognito
4. Run diagnostic script: `npx tsx scripts/check-actual-error.ts`

### Session not persisting

- Check `NEXTAUTH_SECRET` is set
- Verify cookies are being set in browser
- Check `useSecureCookies` setting matches environment

## Best Practices

1. **Always validate session** on protected routes
2. **Use server-side session** for API routes
3. **Use client-side session** for UI components
4. **Handle loading states** when checking authentication
5. **Log errors** for debugging but don't expose to users

## Next Steps

- Add token refresh logic
- Implement password reset flow
- Add MFA support
- Implement session refresh

