# How to Use AWS Credentials CSV File

## 📄 About the CSV File

When you create AWS IAM access keys, AWS provides a CSV file download. This file contains your credentials but **should NOT be stored in your project**.

## ✅ What to Do with the CSV

### Step 1: Open the CSV File

The CSV file typically contains:
- **Access key ID** (starts with `AKIA...`)
- **Secret access key** (long string)
- User name
- Other metadata

### Step 2: Extract the Credentials

Open the CSV file (in Excel, Google Sheets, or a text editor) and find:
- **Access key ID** - Usually in the first column
- **Secret access key** - Usually in the second column

**Example CSV format:**
```csv
User name,Access key ID,Secret access key,Console password
eastgate-user,AKIAIOSFODNN7EXAMPLE,wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY,
```

### Step 3: Add to `.env` File

1. **Open your `.env` file** in the project root (`/home/mrhoseah/dev/eastgate/.env`)

2. **Find or add these lines:**
   ```env
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

3. **Replace with your actual values** from the CSV:
   - Copy the **Access key ID** from the CSV → paste after `AWS_ACCESS_KEY_ID=`
   - Copy the **Secret access key** from the CSV → paste after `AWS_SECRET_ACCESS_KEY=`

4. **Save the `.env` file**

### Step 4: Delete or Securely Store the CSV

- **DO NOT** commit the CSV to git
- **DO NOT** put it in your project folder
- Store it securely (password manager, encrypted storage) or delete it after copying credentials
- The CSV is only shown once - if you lose it, you'll need to create new access keys

## 📁 Where is `.env` File?

Your `.env` file should be in the project root:
```
/home/mrhoseah/dev/eastgate/.env
```

If it doesn't exist, create it:
```bash
touch .env
```

## 🔒 Security Reminders

1. **Never commit `.env` to git** - It should be in `.gitignore`
2. **Never share the CSV file** - It contains sensitive credentials
3. **Never put credentials in code** - Always use `.env` file
4. **Rotate credentials regularly** - Change every 90 days

## ✅ Verify It Works

After adding credentials to `.env`:

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the connection:**
   ```bash
   npx tsx scripts/test-cognito-connection.ts
   ```

You should see:
```
✅ Client created successfully
✅ User Pool found
✅ API call successful
```

## 📝 Complete `.env` Example

Your `.env` file should look like this:

```env
# AWS Credentials (from CSV)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Cognito Configuration
COGNITO_USER_POOL_ID=af-south-1_HZYIpahzs
COGNITO_CLIENT_ID=6qbvncedqjvi2jrpqhjj22ei7g
COGNITO_REGION=af-south-1

# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=your-secret-here
```

## ❌ Common Mistakes

1. **Putting CSV in project folder** - Don't do this!
2. **Leaving spaces around `=`** - Should be `KEY=value` not `KEY = value`
3. **Adding quotes** - Should be `KEY=value` not `KEY="value"`
4. **Forgetting to restart server** - Changes only take effect after restart

## 🆘 Need Help?

If credentials don't work:
1. Check for typos (no extra spaces, quotes, or line breaks)
2. Verify the CSV was downloaded correctly
3. Make sure you restarted the dev server
4. Run the test script to see specific errors

