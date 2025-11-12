# Google Drive Integration Setup

This guide will help you set up Google Drive storage for documents in the Church Management System.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A Google Cloud project
3. Google Drive API enabled

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and click **Enable**

## Step 3: Create a Service Account

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - **Service account name**: `church-ms-drive` (or your preferred name)
   - **Service account ID**: Auto-generated
   - **Description**: "Service account for Church Management System document storage"
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

## Step 4: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file

## Step 5: Extract Credentials from JSON

Open the downloaded JSON file. You'll need these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  ...
}
```

## Step 6: Set Environment Variables

Add the following to your `.env.local` file:

```env
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID=your-project-id
```

**Important Notes:**
- The `GOOGLE_DRIVE_PRIVATE_KEY` should include the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the newlines (`\n`) in the private key - they will be automatically converted
- Wrap the private key in quotes if it contains special characters

## Step 7: Share Google Drive Folder (Optional)

If you want to use a specific Google Drive folder:

1. Create a folder in Google Drive (or use an existing one)
2. Right-click the folder > **Share**
3. Add the service account email (from `GOOGLE_DRIVE_CLIENT_EMAIL`)
4. Give it **Editor** permissions
5. Click **Send**

The system will automatically create folders for each church and category within your Google Drive.

## Step 8: Test the Integration

1. Start your development server
2. Navigate to the Documents page
3. Upload a test document
4. Check your Google Drive to verify the file was uploaded

## Folder Structure

The system creates the following folder structure in Google Drive:

```
Church-{churchId}-Documents/
  ├── sermons/
  ├── bulletins/
  ├── forms/
  ├── policies/
  ├── reports/
  └── other/
```

## Troubleshooting

### Error: "Invalid credentials"
- Verify all environment variables are set correctly
- Check that the private key includes the BEGIN/END markers
- Ensure the service account email is correct

### Error: "Insufficient permissions"
- Make sure the Google Drive API is enabled
- Verify the service account has the correct permissions
- If using a shared folder, ensure the service account has access

### Files not appearing in Google Drive
- Check the server logs for error messages
- Verify the service account credentials are correct
- Ensure the Google Drive API is enabled in your project

### Fallback to Local Storage
If Google Drive upload fails, the system will automatically fall back to local storage (`/public/uploads/documents/`). Check the server logs for the specific error.

## Security Best Practices

1. **Never commit credentials to version control**
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in production

2. **Limit service account permissions**
   - Only grant the minimum permissions needed
   - Use IAM roles to restrict access

3. **Rotate credentials regularly**
   - Create new service account keys periodically
   - Remove old keys that are no longer in use

4. **Monitor API usage**
   - Set up billing alerts in Google Cloud Console
   - Monitor API quotas and limits

## Production Deployment

For production:

1. Set environment variables in your hosting platform (Vercel, AWS, etc.)
2. Ensure the private key is properly escaped
3. Test the integration after deployment
4. Monitor logs for any errors

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set
3. Test the Google Drive API access using the Google Cloud Console
4. Review the [Google Drive API documentation](https://developers.google.com/drive/api)

