# AWS Credentials Setup Guide

## ❌ Current Issue

Your `.env` file has placeholder AWS credentials:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

These need to be replaced with **real AWS credentials** to authenticate with Cognito.

---

## ✅ How to Get AWS Credentials

### Option 1: Create IAM User (Recommended)

1. **Go to AWS IAM Console**
   - URL: https://console.aws.amazon.com/iam/
   - Make sure you're in the correct AWS account

2. **Create New User**
   - Click "Users" in left sidebar
   - Click "Create user"
   - Enter username: `eastgate-cognito-user` (or any name)
   - Click "Next"

3. **Attach Permissions**
   - Select "Attach policies directly"
   - Search for and select: **`AmazonCognitoPowerUser`**
   - This gives full access to Cognito (for development)
   - For production, create a custom policy with minimal permissions
   - Click "Next" → "Create user"

4. **Create Access Keys**
   - Click on the newly created user
   - Go to "Security credentials" tab
   - Scroll to "Access keys"
   - Click "Create access key"
   - Select "Application running outside AWS" (or appropriate use case)
   - Click "Next" → "Create access key"
   - **IMPORTANT**: Copy both:
     - **Access key ID** (starts with `AKIA...`)
     - **Secret access key** (long string, only shown once!)

5. **Update `.env` File**
   ```env
   AWS_ACCESS_KEY_ID=AKIA...your-actual-access-key
   AWS_SECRET_ACCESS_KEY=your-actual-secret-key-here
   ```

---

### Option 2: Use Existing IAM User

If you already have an IAM user with Cognito permissions:

1. **Go to IAM Console** → Users
2. **Select your user**
3. **Go to "Security credentials" tab**
4. **Create new access key** (if you don't have one)
5. **Copy Access Key ID and Secret Access Key**
6. **Update `.env` file**

---

### Option 3: Use AWS CLI Credentials

If you have AWS CLI configured:

1. **Check your credentials:**
   ```bash
   cat ~/.aws/credentials
   ```

2. **Copy the `aws_access_key_id` and `aws_secret_access_key` values**

3. **Update `.env` file:**
   ```env
   AWS_ACCESS_KEY_ID=value-from-credentials-file
   AWS_SECRET_ACCESS_KEY=value-from-credentials-file
   ```

---

## 🔐 Required Permissions

Your IAM user needs these Cognito permissions:

**Minimum Required:**
- `cognito-idp:InitiateAuth`
- `cognito-idp:GetUser`
- `cognito-idp:AdminCreateUser` (for admin operations)
- `cognito-idp:AdminSetUserPassword` (for admin operations)

**Recommended Policy:** `AmazonCognitoPowerUser`

**For Production:** Create a custom policy with only the permissions you need.

---

## ✅ After Setting Up

1. **Update `.env` file** with real credentials
2. **Restart your dev server:**
   ```bash
   npm run dev
   ```
3. **Try logging in again**

---

## 🚨 Security Best Practices

1. **Never commit `.env` to git**
   - `.env` should be in `.gitignore`
   - Use `.env.example` for documentation

2. **Use different credentials for dev/prod**
   - Don't use production credentials in development

3. **Rotate credentials regularly**
   - Change access keys every 90 days

4. **Use IAM roles when possible**
   - For production, use IAM roles instead of access keys

5. **Limit permissions**
   - Only grant the minimum permissions needed

---

## 🔍 Verify Credentials Work

Run the debug script to test:

```bash
npx tsx scripts/debug-login.ts your-email@example.com your-password
```

You should see:
- ✅ AWS credentials configured
- ✅ Cognito authentication successful (or specific error if other issues)

---

## ❌ Common Errors

### Error: "InvalidClientTokenId"
- **Cause**: Access Key ID is wrong
- **Fix**: Check `AWS_ACCESS_KEY_ID` in `.env`

### Error: "SignatureDoesNotMatch"
- **Cause**: Secret Access Key is wrong
- **Fix**: Check `AWS_SECRET_ACCESS_KEY` in `.env`

### Error: "UnrecognizedClientException"
- **Cause**: Credentials don't have Cognito permissions
- **Fix**: Attach `AmazonCognitoPowerUser` policy to IAM user

### Error: "Access Denied"
- **Cause**: IAM user doesn't have required permissions
- **Fix**: Add Cognito permissions to IAM user

---

## 📝 Quick Checklist

- [ ] Created IAM user (or using existing)
- [ ] Attached `AmazonCognitoPowerUser` policy
- [ ] Created access keys
- [ ] Copied Access Key ID
- [ ] Copied Secret Access Key
- [ ] Updated `.env` file with real credentials
- [ ] Restarted dev server
- [ ] Tested login

---

## 🆘 Still Having Issues?

1. **Check IAM Console** - Verify user exists and has permissions
2. **Check Access Keys** - Make sure they're active (not disabled)
3. **Check Region** - Ensure credentials are for the same AWS account/region
4. **Check Server Logs** - Look for specific error messages
5. **Test with AWS CLI:**
   ```bash
   aws cognito-idp list-user-pools --max-results 1 --region af-south-1
   ```

If this works, your credentials are correct. If not, check your IAM permissions.

