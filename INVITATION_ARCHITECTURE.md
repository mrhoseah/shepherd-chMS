# Invitation-Based Authentication Architecture

## Overview

This system uses **AWS Cognito for authentication only** - passwords are never stored locally. Users are invited via email links that allow them to create their account and set their password in Cognito.

## Architecture

```
┌─────────────────┐
│   Admin Panel   │
│  (Create User)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Invitation│
│  (Database)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send Email      │
│  (Invitation Link)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Clicks     │
│  Invitation Link │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Accept Page     │
│  (Set Password)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create in Cognito│
│  (AWS)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Database │
│  (Activate User) │
└─────────────────┘
```

## Key Components

### 1. Database Schema

**Invitation Model:**
- `token`: Unique invitation token (base64url)
- `email`: User's email
- `firstName`, `lastName`: User's name
- `role`: User role (ADMIN, PASTOR, LEADER, MEMBER, GUEST)
- `status`: PENDING, ACCEPTED, EXPIRED, CANCELLED
- `expiresAt`: Invitation expiration date
- `invitedById`: Admin who sent the invitation
- `userId`: User created from this invitation

**User Model:**
- `passwordHash`: **Deprecated** - No longer used (marked as deprecated)
- All passwords stored in Cognito only

### 2. API Endpoints

#### `POST /api/invitations`
- **Auth**: Admin only
- **Purpose**: Create a new invitation
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MEMBER",
    "campusId": "optional",
    "message": "Optional message",
    "sendInvitation": true
  }
  ```
- **Response**: Returns invitation with URL

#### `GET /api/invitations?token=xxx`
- **Auth**: Public (for invitation page)
- **Purpose**: Get invitation details by token
- **Response**: Invitation details (without sensitive data)

#### `POST /api/invitations/accept`
- **Auth**: Public
- **Purpose**: Accept invitation and create account
- **Body**:
  ```json
  {
    "token": "invitation-token",
    "password": "user-password",
    "middleName": "optional",
    "phone": "optional"
  }
  ```
- **Response**: Created user object

### 3. User Flow

#### Admin Creates User:
1. Admin goes to Users page
2. Clicks "Add User"
3. Fills in user details (email, name, role, etc.)
4. System creates invitation in database
5. Invitation link is generated
6. Email is sent (if configured) with invitation link

#### User Accepts Invitation:
1. User receives email with invitation link
2. Clicks link → Goes to `/auth/invite/[token]`
3. Page loads invitation details
4. User sets password and optional additional info
5. Submits form → Creates account in Cognito
6. Updates database user (status → ACTIVE, canLogin → true)
7. Redirects to sign in page

## Benefits

1. **Security**: Passwords never stored locally
2. **Compliance**: AWS Cognito handles password security, compliance
3. **User Experience**: Simple invitation flow
4. **Flexibility**: Can invite users before they have accounts
5. **Audit Trail**: Track who invited whom and when

## Migration Notes

### For Existing Users:
- Existing users with `passwordHash` can still login
- New users will only use Cognito
- Consider migrating existing users to invitation system

### For New Users:
- All new users must be created via invitation
- No password field in user creation form
- Password is set when accepting invitation

## Configuration

### Environment Variables:
```env
# Cognito (already configured)
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=your-region
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Application
NEXTAUTH_URL=http://localhost:3000
```

### Email Service (Optional):
To send invitation emails automatically, integrate with:
- AWS SES
- SendGrid
- Resend
- Or any SMTP service

Add email sending in `/app/api/invitations/route.ts` when `sendInvitation: true`.

## Usage Examples

### Create Invitation (Admin):
```typescript
const response = await fetch('/api/invitations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'MEMBER',
    sendInvitation: true,
  }),
});

const { invitation } = await response.json();
console.log('Invitation URL:', invitation.url);
```

### Accept Invitation (User):
```typescript
const response = await fetch('/api/invitations/accept', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'invitation-token',
    password: 'secure-password-123',
    phone: '+1234567890',
  }),
});
```

## Security Considerations

1. **Token Security**: Invitation tokens are cryptographically random (32 bytes)
2. **Expiration**: Invitations expire after 7 days (configurable)
3. **One-time Use**: Invitations can only be accepted once
4. **Email Verification**: Cognito handles email verification
5. **Password Policy**: Enforced by Cognito (minimum 8 characters, etc.)

## Troubleshooting

### Invitation Not Found:
- Check if invitation exists in database
- Verify token is correct
- Check if invitation has expired

### User Already Exists:
- Check if user with email already exists
- Check if invitation was already accepted

### Cognito Errors:
- Verify AWS credentials are configured
- Check Cognito User Pool settings
- Ensure USER_PASSWORD_AUTH flow is enabled

