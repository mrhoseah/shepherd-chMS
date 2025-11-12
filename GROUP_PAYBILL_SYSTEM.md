# Group Paybill Giving System - Implementation Guide

## Overview

This document outlines the professional implementation of group-based M-Pesa Paybill giving using structured account numbers.

## System Architecture

### Account Number Format

```
Account Number = GROUP_CODE + DELIMITER + FUND_CODE
Example: JERICHO-TTH (JERICHO Group's Tithe)
```

**Delimiter:** `-` (hyphen) - Must not appear in any code itself

---

## Database Schema Updates

### 1. Add Group Code to SmallGroup

```prisma
model SmallGroup {
  // ... existing fields
  groupCode String? @unique // e.g., "ZION", "JERICHO", "ROYAL"
  // ... rest of fields
}
```

### 2. Add Fund Code Mapping Table

```prisma
model FundCategory {
  id          String   @id @default(cuid())
  code        String   @unique // e.g., "TTH", "WLFR", "BLDG"
  name        String   // e.g., "Tithe", "Welfare Fund"
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  donations   Donation[]
  
  @@index([code])
  @@index([isActive])
}
```

### 3. Update Donation Model

```prisma
model Donation {
  // ... existing fields
  paybillAccountRef String? // Store the raw account number from M-Pesa webhook
  fundCategoryId    String? // Link to FundCategory
  fundCategory      FundCategory? @relation(fields: [fundCategoryId], references: [id])
  // ... rest of fields
}
```

---

## Code Standards

### Group Codes
- **Format:** Uppercase, 3-10 alphanumeric characters
- **Uniqueness:** Must be unique across all groups
- **Examples:** `ZION`, `JERICHO`, `ROYAL`, `GNRAL`

### Fund Codes
- **Format:** Uppercase, 3-5 alphanumeric characters
- **Uniqueness:** Must be unique across all fund categories
- **Examples:** `TTH` (Tithe), `WLFR` (Welfare), `BLDG` (Building), `MSN` (Missions)

### Validation Rules
1. Codes must be alphanumeric only (A-Z, 0-9)
2. No spaces, special characters, or delimiters allowed
3. Case-insensitive matching (store uppercase, compare case-insensitive)
4. Delimiter (`-`) must never appear in codes

---

## Frontend Implementation

### Account Number Generator Component

**Location:** `/app/give/paybill/page.tsx` or integrated into `/app/give/page.tsx`

**Features:**
1. Group selector (dropdown) - Shows only groups with `groupGivingEnabled = true`
2. Fund category selector (dropdown)
3. Real-time account number generation: `{groupCode}-{fundCode}`
4. Large, copyable display of generated account number
5. Paybill number display (from settings)
6. Clear instructions
7. QR code generation (optional enhancement)

**UI Flow:**
```
User selects Group → User selects Fund → System generates code → User copies/uses code
```

---

## Backend Implementation

### 1. M-Pesa C2B Confirmation Webhook

**Endpoint:** `/api/webhooks/mpesa/c2b-confirmation`

**Payload Structure (from Safaricom):**
```json
{
  "TransactionType": "Pay Bill",
  "TransID": "RKTQDM7W6S",
  "TransTime": "20191122063845",
  "TransAmount": "10.00",
  "BusinessShortCode": "600638",
  "BillRefNumber": "JERICHO-TTH",  // ← This is our account number
  "InvoiceNumber": "",
  "OrgAccountBalance": "49197.00",
  "ThirdPartyTransID": "",
  "MSISDN": "254708374149",
  "FirstName": "John",
  "MiddleName": "Doe",
  "LastName": "Smith"
}
```

**Processing Logic:**
```typescript
1. Extract BillRefNumber (e.g., "JERICHO-TTH")
2. Split by delimiter "-" → ["JERICHO", "TTH"]
3. Validate group code exists → Find group with code "JERICHO"
4. Validate fund code exists → Find fund with code "TTH"
5. Create donation record with:
   - groupId (from group code lookup)
   - fundCategoryId (from fund code lookup)
   - paybillAccountRef (original BillRefNumber)
   - amount, phone, transactionId, etc.
6. If parsing fails → Create donation with:
   - groupId: null
   - fundCategoryId: null
   - status: "unallocated"
   - Flag for admin review
```

### 2. Code Parsing Service

**Location:** `/lib/services/paybill-parser.ts`

```typescript
interface ParsedAccountNumber {
  groupCode: string | null;
  fundCode: string | null;
  isValid: boolean;
  error?: string;
}

export async function parseAccountNumber(
  accountNumber: string
): Promise<ParsedAccountNumber> {
  // 1. Validate format (contains delimiter)
  // 2. Split by delimiter
  // 3. Lookup group code in database
  // 4. Lookup fund code in database
  // 5. Return parsed result
}
```

### 3. Unallocated Transaction Handling

**Strategy:**
- Store all transactions, even if unallocated
- Flag with `status: "unallocated"`
- Create admin dashboard to review and manually allocate
- Send notification to admins for unallocated transactions

---

## API Endpoints

### 1. Generate Account Number
```
GET /api/give/paybill/generate?groupId={id}&fundCategoryId={id}
Response: { accountNumber: "JERICHO-TTH", paybillNumber: "123456" }
```

### 2. Get Group Codes
```
GET /api/groups/codes
Response: [{ id: "...", name: "ZION Group", code: "ZION" }, ...]
```

### 3. Get Fund Codes
```
GET /api/fund-categories
Response: [{ id: "...", name: "Tithe", code: "TTH" }, ...]
```

### 4. M-Pesa C2B Webhook
```
POST /api/webhooks/mpesa/c2b-confirmation
Body: Safaricom webhook payload
Response: { success: true, donationId: "..." }
```

---

## Error Handling

### Invalid Account Numbers

| Scenario | Handling |
|----------|----------|
| Missing delimiter | Flag as unallocated, log error |
| Unknown group code | Flag as unallocated, notify admin |
| Unknown fund code | Flag as unallocated, notify admin |
| Empty BillRefNumber | Flag as unallocated, use default fund |
| Malformed format | Flag as unallocated, store raw value |

### Admin Review Process

1. Dashboard shows all unallocated transactions
2. Admin can manually:
   - Assign to group
   - Assign to fund category
   - Split between multiple categories
   - Mark as general fund

---

## Reporting

### Group Performance
```sql
SELECT 
  g.name AS group_name,
  g.groupCode,
  SUM(d.amount) AS total_amount,
  COUNT(d.id) AS donation_count
FROM donations d
JOIN groups g ON d.groupId = g.id
WHERE d.status = 'completed'
GROUP BY g.id, g.name, g.groupCode
ORDER BY total_amount DESC;
```

### Fund Balance
```sql
SELECT 
  fc.name AS fund_name,
  fc.code AS fund_code,
  SUM(d.amount) AS total_amount,
  COUNT(d.id) AS donation_count
FROM donations d
JOIN fund_categories fc ON d.fundCategoryId = fc.id
WHERE d.status = 'completed'
GROUP BY fc.id, fc.name, fc.code
ORDER BY total_amount DESC;
```

### Combined Report
```sql
SELECT 
  g.name AS group_name,
  fc.name AS fund_name,
  SUM(d.amount) AS total_amount
FROM donations d
JOIN groups g ON d.groupId = g.id
JOIN fund_categories fc ON d.fundCategoryId = fc.id
WHERE d.status = 'completed'
GROUP BY g.id, g.name, fc.id, fc.name
ORDER BY g.name, fc.name;
```

---

## Security Considerations

1. **Webhook Authentication:** Verify webhook signature from Safaricom
2. **Code Validation:** Prevent SQL injection in code lookups
3. **Rate Limiting:** Protect webhook endpoint from abuse
4. **Audit Trail:** Log all parsing attempts and results
5. **Admin Permissions:** Only admins can create/edit codes

---

## Testing Strategy

### Unit Tests
- Code parsing logic
- Validation rules
- Edge cases (empty, malformed, unknown codes)

### Integration Tests
- Webhook processing
- Database lookups
- Error handling

### Manual Testing
- Generate account numbers
- Test with real M-Pesa transactions
- Verify allocation accuracy

---

## Migration Plan

1. **Phase 1:** Add schema fields (groupCode, FundCategory table)
2. **Phase 2:** Create admin UI for code management
3. **Phase 3:** Implement account number generator
4. **Phase 4:** Deploy webhook handler
5. **Phase 5:** Test with sample transactions
6. **Phase 6:** Roll out to groups
7. **Phase 7:** Monitor and refine

---

## Future Enhancements

1. **QR Code Generation:** Generate QR codes with deep links
2. **SMS Notifications:** Send confirmation SMS with account number
3. **Auto-allocation:** ML-based prediction for unallocated transactions
4. **Multi-currency:** Support for different currencies
5. **Recurring Giving:** Set up recurring paybill instructions

---

## Conclusion

This system provides a professional, scalable solution for tracking group contributions via M-Pesa Paybill. The structured approach ensures accuracy, traceability, and ease of reporting.

