# AWS Cognito Setup Guide

This guide will help you configure AWS Cognito for authentication in Shepherd's ChMS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional, for easier setup)

## Step 1: Create Cognito User Pool

1. Go to AWS Cognito Console: https://console.aws.amazon.com/cognito/
2. Click "Create user pool"
3. Follow the setup wizard:

### Application Type
- Choose **"Single-page application (SPA)"** (for Next.js with React)

### Sign-in Options
- **Email** ✓
- **Phone number** ✓
- **Username** ✓

### Self-registration
- **Enable self-registration** ✓

### Required Attributes
- **email** ✓ (required)
- **given_name** ✓ (required)
- **phone_number** ✓ (required)
- **picture** ✓ (optional, but recommended)
- **middle_name** (optional)

### Password Policy
- Minimum length: 8 characters
- Require uppercase, lowercase, numbers, and symbols (recommended)

### Email Verification
- Choose your preferred method (email or SMS)
- If using email, configure SES (Simple Email Service) for production

## Step 2: Create App Client

1. After creating the user pool, go to "App integration" tab
2. Under "App clients", click "Create app client"
3. Configure:
   - **App client name**: `Shepherds-chMS-client`
   - **Auth flows**: **IMPORTANT** - Enable "ALLOW_USER_PASSWORD_AUTH"
     - This is required for server-side authentication
     - Even though it's an SPA, we use server-side auth with NextAuth
   - **OAuth 2.0 grant types**: Not required for this setup
4. Save and note the **Client ID**

**Note**: For your existing app client (`2e0nfb1h5vg24r0692ff14i3d2`), ensure USER_PASSWORD_AUTH is enabled:
1. Go to your User Pool → App integration → App clients
2. Click on your app client
3. Under "Hosted UI settings" → "Edit", ensure "ALLOW_USER_PASSWORD_AUTH" is checked
4. Save changes

## Step 3: Configure Environment Variables

Add the following to your `.env` file:

```env
# AWS Cognito Configuration
COGNITO_USER_POOL_ID=af-south-1_HZYIpahzs
COGNITO_CLIENT_ID=2e0nfb1h5vg24r0692ff14i3d2
COGNITO_REGION=af-south-1

# AWS Credentials (for admin operations)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

## Step 4: IAM Permissions

Create an IAM user or role with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:InitiateAuth",
        "cognito-idp:GetUser",
        "cognito-idp:SignUp",
        "cognito-idp:ConfirmSignUp"
      ],
      "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID"
    }
  ]
}
```

## Step 5: Test the Setup

1. Run the seed script to create the admin user:
   ```bash
   npm run db:seed
   ```

2. Test sign-up:
   - Navigate to `/auth/signup`
   - Fill in the form with required fields
   - Check your email for confirmation code
   - Confirm the account

3. Test sign-in:
   - Navigate to `/auth/signin`
   - Sign in with your credentials

## Features

### Self-Registration
- Users can sign up at `/auth/signup`
- Required fields: email, first name, last name, phone number
- Optional fields: middle name, profile picture URL
- Email/phone verification required (based on your Cognito settings)

### Admin User Creation
- Admin users are created via the seed script
- Uses `AdminCreateUser` API (no email verification needed)
- Password is set directly (no temporary password)

### Sign-In Flow
1. User enters email and password
2. System authenticates with Cognito
3. User attributes are synced with database
4. Session is created with NextAuth

## Troubleshooting

### "UserNotConfirmedException"
- User needs to confirm their email/phone
- Check email for confirmation code
- Or use admin API to confirm user

### "NotAuthorizedException"
- Invalid email or password
- Check if user exists in Cognito
- Verify password meets requirements

### "UsernameExistsException"
- User already exists in Cognito
- Use sign-in instead of sign-up
- Or delete user from Cognito console

### AWS Credentials Error
- Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Verify IAM permissions are correct
- Check AWS region matches your user pool region

## Security Notes

- **Never commit** `.env` file to version control
- Use IAM roles instead of access keys when possible (e.g., on AWS Lambda/ECS)
- Enable MFA for production environments
- Configure password policies according to your security requirements
- Use HTTPS in production
- Consider enabling advanced security features in Cognito

## Next Steps

- Configure email templates in Cognito
- Set up password reset flow (if needed)
- Configure social identity providers (Google, Facebook, etc.)
- Set up MFA for additional security
- Configure user pool domain for hosted UI (optional)

