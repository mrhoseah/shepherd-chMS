# User Login Access Management - Implementation Guide

## ✅ Implementation Complete

A comprehensive system for managing who can log in to the dashboard has been implemented.

---

## 🎯 Core Features

### 1. **Three-Tier Access Control**

- **Role-based**: ADMIN, PASTOR, LEADER, MEMBER, GUEST
- **Status-based**: ACTIVE, PENDING, INACTIVE, SUSPENDED
- **Permission-based**: `canLogin` boolean flag

**Access Rules:**
- ✅ **ADMIN**: Always has access (bypasses `canLogin` check)
- ✅ **Other roles**: Need `canLogin: true` AND `status: ACTIVE`
- ✅ **Validation**: Cannot grant login if status is not ACTIVE

---

## 🔧 API Enhancements

### `/api/users/[id]/permissions` (PATCH)

**Features:**
- ✅ Status validation (can't enable login if status ≠ ACTIVE)
- ✅ Auto-set status to ACTIVE when enabling login
- ✅ Auto-revoke login when status changes to non-ACTIVE
- ✅ Activity logging for all permission changes
- ✅ Automatic notifications when access is granted/revoked
- ✅ Detailed error messages with actionable feedback

**Request Body:**
```json
{
  "canLogin": true,
  "status": "ACTIVE",
  "permissions": {}
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "MEMBER",
  "status": "ACTIVE",
  "canLogin": true
}
```

### `/api/users/bulk-permissions` (PATCH) - NEW

**Features:**
- ✅ Bulk update multiple users at once
- ✅ Skips admin users (can't change their permissions)
- ✅ Activity logging for each user
- ✅ Notifications for all affected users

**Request Body:**
```json
{
  "userIds": ["id1", "id2", "id3"],
  "canLogin": true,
  "status": "ACTIVE"
}
```

---

## 🎨 UI Enhancements

### Users Table (`/dashboard/users`)

**New Features:**
1. **Login Access Column**
   - Visual badges showing access status:
     - 🟦 **Admin** (blue) - Always has access
     - 🟩 **Enabled** (green) - Has login access
     - ⚪ **Disabled** (gray) - No login access

2. **Quick Actions**
   - 🔵 **Grant Access** button (green LogIn icon) - One-click access grant
   - 🔴 **Revoke Access** button (red LogOut icon) - One-click access revoke
   - Only shown for non-admin users with ACTIVE status

3. **Enhanced Permissions Dialog**
   - Status validation warnings
   - Clear error messages
   - Auto-status management
   - Real-time feedback

---

## 📋 Workflow

### Granting Access to a Member

1. **Navigate to Users** → `/dashboard/users`
2. **Find the member** in the table
3. **Check Status**: Must be ACTIVE (if not, edit user first)
4. **Grant Access**:
   - **Quick**: Click green LogIn icon button
   - **Detailed**: Click "Permissions" button → Enable "Allow Dashboard Access"
5. **System automatically**:
   - Sets `canLogin: true`
   - Ensures `status: ACTIVE`
   - Creates activity log entry
   - Sends notification to user
   - Updates UI immediately

### Revoking Access

1. **Find the user** in the table
2. **Revoke Access**:
   - **Quick**: Click red LogOut icon button
   - **Detailed**: Click "Permissions" → Disable "Allow Dashboard Access"
3. **System automatically**:
   - Sets `canLogin: false`
   - Creates activity log entry
   - Sends notification to user

### Bulk Operations

1. **Select multiple users** (checkbox selection - to be added)
2. **Use bulk actions** to grant/revoke access for multiple users
3. **System processes** all users and logs each change

---

## 🔒 Security Features

### Validation Rules

1. **Status Check**: Cannot grant login if status ≠ ACTIVE
2. **Admin Protection**: Admins cannot have permissions changed
3. **Auto-Cleanup**: Setting status to non-ACTIVE automatically revokes login
4. **Activity Logging**: All changes are logged with:
   - Who made the change
   - What changed
   - When it changed
   - Previous and new values

### Audit Trail

All permission changes are logged in `ActivityLog`:
```typescript
{
  action: "UPDATE_USER_PERMISSIONS",
  resource: "User",
  resourceId: "user-id",
  metadata: {
    targetUserId: "user-id",
    targetUserEmail: "user@example.com",
    changes: ["Login access granted"],
    previousCanLogin: false,
    newCanLogin: true,
    previousStatus: "PENDING",
    newStatus: "ACTIVE"
  }
}
```

---

## 🔔 Notifications

### When Access is Granted

User receives in-app notification:
- **Title**: "Dashboard Access Granted"
- **Content**: "You now have access to the Eastgate Church Management System dashboard. You can log in with your email: user@example.com"
- **Link**: `/dashboard`

### When Access is Revoked

User receives in-app notification:
- **Title**: "Dashboard Access Revoked"
- **Content**: "Your dashboard access has been revoked. Please contact an administrator if you believe this is an error."

---

## 📊 Best Practices

### 1. **Default Member Creation**

When creating new members:
- `role`: MEMBER or GUEST
- `status`: PENDING
- `canLogin`: false

**Rationale**: New members need admin approval before accessing dashboard.

### 2. **Granting Access**

Before granting access:
1. ✅ Verify member is active and engaged
2. ✅ Set status to ACTIVE
3. ✅ Grant `canLogin: true`
4. ✅ Assign appropriate role (LEADER, MEMBER, etc.)

### 3. **Role Assignment**

- **ADMIN**: Full system access (staff, pastors)
- **PASTOR**: Pastoral access (can be added)
- **LEADER**: Group/ministry leaders
- **MEMBER**: Regular members with dashboard access
- **GUEST**: Visitors, no dashboard access

### 4. **Status Management**

- **ACTIVE**: Member is active and can have login access
- **PENDING**: New member, awaiting activation
- **INACTIVE**: Member not currently active
- **SUSPENDED**: Temporarily suspended (login revoked)

---

## 🚀 Usage Examples

### Example 1: Grant Access to New Leader

```typescript
// Via API
PATCH /api/users/user-id/permissions
{
  "canLogin": true,
  "status": "ACTIVE",
  "role": "LEADER" // Update via /api/users/user-id
}
```

### Example 2: Bulk Grant Access to Multiple Members

```typescript
// Via API
PATCH /api/users/bulk-permissions
{
  "userIds": ["id1", "id2", "id3"],
  "canLogin": true
}
```

### Example 3: Revoke Access (Suspend Member)

```typescript
// Via API
PATCH /api/users/user-id/permissions
{
  "canLogin": false,
  "status": "SUSPENDED"
}
```

---

## 🔍 Monitoring & Reporting

### Check Who Has Access

```sql
-- All users with login access
SELECT email, firstName, lastName, role, status, "canLogin"
FROM "User"
WHERE "canLogin" = true OR role = 'ADMIN'
ORDER BY role, lastName;
```

### Check Recent Permission Changes

```sql
-- Recent permission changes
SELECT 
  al."createdAt",
  u.email as "changed_by",
  al.metadata->>'targetUserEmail' as "target_user",
  al.metadata->>'changes' as "changes"
FROM "ActivityLog" al
JOIN "User" u ON al."userId" = u.id
WHERE al.action = 'UPDATE_USER_PERMISSIONS'
ORDER BY al."createdAt" DESC
LIMIT 50;
```

---

## 🎯 Summary

The system now provides:

✅ **Clear visual indicators** of who can log in  
✅ **Quick actions** for granting/revoking access  
✅ **Status validation** to prevent invalid states  
✅ **Activity logging** for audit trails  
✅ **Automatic notifications** to users  
✅ **Bulk operations** for efficiency  
✅ **Admin protection** (admins always have access)  

**Result**: A robust, user-friendly system for managing dashboard access that scales with your church's needs!

