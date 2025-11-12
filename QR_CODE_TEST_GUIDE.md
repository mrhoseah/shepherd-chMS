# QR Code Generation Test Guide

## ✅ Code Analysis Results

All code structure checks passed:
- ✅ `qrCodeData` field is set in create statement
- ✅ QRCode library is imported correctly
- ✅ Amount parsing handles null correctly
- ✅ Category validation exists
- ✅ Payment method validation exists
- ✅ Error handling exists
- ✅ Prisma create includes qrCodeData
- ✅ QR code update statement exists
- ✅ QRCode library is installed (v1.5.4)

## 🔍 Potential Runtime Issues to Check

### 1. Database Schema Mismatch
**Check:** Ensure the database schema matches the Prisma schema
```bash
npx prisma db push
# or
npx prisma migrate dev
```

### 2. Authentication Issues
**Check:** Ensure you're logged in when testing
- The API requires authentication
- Session must be valid

### 3. Environment Variables
**Check:** Ensure `NEXTAUTH_URL` is set correctly
```bash
echo $NEXTAUTH_URL
# Should be: http://localhost:3000 (dev) or your production URL
```

## 🧪 How to Test QR Code Generation

### Method 1: Browser Console (Recommended)
1. Open your application in the browser
2. Log in to your account
3. Open Developer Tools (F12)
4. Go to Console tab
5. Run this code:

```javascript
// Test M-Pesa QR Code
fetch('/api/donations/qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000,
    category: 'TITHE',
    paymentMethod: 'MPESA'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Success:', data);
  if (data.error) {
    console.error('❌ Error:', data.error);
    if (data.details) console.error('Details:', data.details);
  }
})
.catch(err => console.error('❌ Network Error:', err));
```

### Method 2: Using the UI
1. Navigate to `/dashboard/giving/qr-print`
2. Use the "Custom Amount QR Code" section
3. Set amount, category, and payment method
4. Click "Generate QR Code"
5. Check browser console for any errors

### Method 3: Check Server Logs
If the app is running, check the terminal/console where the Next.js server is running for error messages.

## 🐛 Common Errors and Solutions

### Error: "qrCodeData is missing"
**Solution:** Already fixed - placeholder is now provided in create statement

### Error: "Category is required"
**Solution:** Ensure category is provided in the request body

### Error: "Payment method must be MPESA or PAYPAL"
**Solution:** Check that paymentMethod is exactly "MPESA" or "PAYPAL" (case-sensitive)

### Error: Prisma validation error
**Solution:** 
- Check database connection
- Run `npx prisma db push` to sync schema
- Verify enum values match exactly

### Error: QRCode library error
**Solution:**
- Ensure `qrcode` package is installed: `npm install qrcode`
- Check if `@types/qrcode` is installed for TypeScript

## 📋 Test Cases to Run

1. **M-Pesa with Amount**
   ```json
   { "amount": 1000, "category": "TITHE", "paymentMethod": "MPESA" }
   ```

2. **M-Pesa Any Amount**
   ```json
   { "amount": null, "category": "OFFERING", "paymentMethod": "MPESA" }
   ```

3. **PayPal with Amount**
   ```json
   { "amount": 50, "category": "MISSIONS", "paymentMethod": "PAYPAL" }
   ```

4. **PayPal Any Amount**
   ```json
   { "amount": null, "category": "BUILDING_FUND", "paymentMethod": "PAYPAL" }
   ```

5. **Error: Missing Category**
   ```json
   { "amount": 1000, "paymentMethod": "MPESA" }
   ```
   Expected: Error "Category is required"

6. **Error: Invalid Payment Method**
   ```json
   { "amount": 1000, "category": "TITHE", "paymentMethod": "INVALID" }
   ```
   Expected: Error "Payment method must be MPESA or PAYPAL"

## 🔧 Debugging Steps

1. **Check Network Tab**
   - Open DevTools → Network tab
   - Generate QR code
   - Check the `/api/donations/qr` request
   - Look at Request Payload and Response

2. **Check Server Logs**
   - Look for console.error messages
   - Check for Prisma errors
   - Check for QRCode library errors

3. **Verify Database**
   ```bash
   npx prisma studio
   # Check if GivingQRCode table exists
   # Check if records are being created
   ```

4. **Test QRCode Library Directly**
   ```javascript
   // In Node.js or browser console
   const QRCode = require('qrcode');
   QRCode.toDataURL('test', (err, url) => {
     if (err) console.error('QRCode error:', err);
     else console.log('QRCode works!', url.substring(0, 50));
   });
   ```

## 📝 Expected Response Format

On success:
```json
{
  "qrCode": {
    "id": "clx...",
    "qrCodeData": "data:image/png;base64,iVBORw0KG...",
    "qrCodeUrl": "{\"type\":\"mpesa_giving\",...}",
    "amount": 1000,
    "category": "TITHE",
    "paymentMethod": "MPESA",
    "expiresAt": "2025-11-11T...",
    "scanUrl": "http://localhost:3000/give/qr?data=..."
  }
}
```

On error:
```json
{
  "error": "Error message here",
  "details": "Stack trace (in development only)"
}
```

