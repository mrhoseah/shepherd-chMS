# System Admin Church Switcher

## Overview

The Church Switcher feature allows system administrators (SUPERADMIN, SYSTEM_ADMIN, SYSTEM_SUPPORT) to seamlessly switch between different churches for management and support purposes. Since system admins don't belong to specific churches, this feature gives them the ability to view and manage any church in the system.

## Features

✅ **Church Context Switching** - Switch between any church in the system
✅ **Persistent Context** - Church context persists across sessions (30-day cookie)
✅ **Visual Indicators** - Clear visual feedback showing which church is being viewed
✅ **Search & Filter** - Quickly find churches by name or location
✅ **Church Details** - View subscription plan, member count, and status
✅ **Audit Logging** - All context switches are logged for security
✅ **Permission Integration** - Automatic church context in all permission checks

## User Experience

### 1. Church Switcher Button
Located in the dashboard header (next to sidebar trigger), visible only to system admins:
- Shows "Select Church" when no context is set
- Shows current church name when context is active
- Click to open church selection dialog

### 2. Church Selection Dialog
Modal dialog with:
- **Current Context Badge** - Shows currently selected church (if any) with clear button
- **Search Bar** - Filter churches by name or location
- **Church Cards** - Display each church with:
  - Logo or initial avatar
  - Church name
  - Location (city, state, country)
  - Subscription plan badge (FREE, BASIC, PREMIUM, ENTERPRISE)
  - Member count
  - Active/Inactive status
  - Checkmark for currently selected church

### 3. Visual Indicator
Blue/purple gradient banner at top of dashboard showing:
- Shield icon indicating system admin mode
- Church logo or initial
- "System Admin Mode: Viewing [Church Name]"
- "Support Access" label

## Technical Implementation

### Backend Components

#### 1. Church Context Management (`lib/admin-church-context.ts`)
```typescript
// Core functions
isSystemAdmin(userRole: string): boolean
getAdminChurchContext(userRole: string): Promise<ChurchContext | null>
setAdminChurchContext(churchId: string, userRole: string, userId: string): Promise<ChurchContext | null>
clearAdminChurchContext(): Promise<void>
getEffectiveChurchId(userId: string, userRole: string): Promise<string | null>
```

**How it works:**
- Uses HTTP-only cookies to store church context (secure, 30-day expiry)
- Context stored as JSON: `{ churchId, churchName, churchLogo }`
- Verifies church exists before setting context
- Creates audit logs for all context changes
- Returns effective church ID for queries (admin context or user's church)

#### 2. API Routes (`app/api/admin/switch-church/route.ts`)

**GET `/api/admin/switch-church`**
- Returns list of all churches with details
- Includes current context if set
- Requires system admin role

Response:
```json
{
  "currentContext": {
    "churchId": "...",
    "churchName": "...",
    "churchLogo": "..."
  },
  "churches": [
    {
      "id": "...",
      "name": "...",
      "logo": "...",
      "location": "City, State, Country",
      "isActive": true,
      "plan": "PREMIUM",
      "status": "ACTIVE",
      "memberCount": 450,
      "createdAt": "..."
    }
  ]
}
```

**POST `/api/admin/switch-church`**
- Sets church context for system admin
- Validates church exists
- Creates audit log
- Returns success message and context

Request:
```json
{
  "churchId": "church_id_here"
}
```

Response:
```json
{
  "success": true,
  "context": {
    "churchId": "...",
    "churchName": "...",
    "churchLogo": "..."
  },
  "message": "Switched to [Church Name]"
}
```

**DELETE `/api/admin/switch-church`**
- Clears church context (return to system admin view)
- Deletes context cookie
- Returns success message

#### 3. Permission Integration (`lib/permissions.ts`)

Updated `requireLogin()` to return:
```typescript
{
  authorized: true,
  userId: string,
  session: Session,
  churchId: string | null,  // Effective church ID
  userRole: string
}
```

The `churchId` returned is:
- Admin church context if system admin with context set
- User's church from campus/group membership for regular users
- `null` if system admin without context (no church restriction)

### Frontend Components

#### 1. Church Switcher (`components/church-switcher.tsx`)
Client component that provides the UI for switching churches:
- Only renders for system admins
- Fetches churches on dialog open
- Handles switching and clearing context
- Refreshes page after context change
- Shows loading states and errors
- Search/filter functionality

#### 2. System Admin Indicator (`components/system-admin-indicator.tsx`)
Alert banner showing current church context:
- Only renders for system admins with active context
- Displays church name and logo
- Shows "System Admin Mode" label
- Blue/purple gradient styling

#### 3. Dashboard Header Integration (`components/dashboard-header.tsx`)
Church switcher button added next to sidebar trigger:
```tsx
<div className="flex items-center gap-4">
  <SidebarTrigger />
  <ChurchSwitcher />
</div>
```

#### 4. Dashboard Layout Integration (`app/dashboard/layout.tsx`)
System admin indicator added at top of content:
```tsx
<div className="flex-1 p-6">
  <SystemAdminIndicator />
  {children}
</div>
```

## Security Features

### 1. Role Verification
All operations verify user has system admin role:
```typescript
const SYSTEM_ROLES = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];
if (!SYSTEM_ROLES.includes(userRole)) {
  return { error: "Access denied" };
}
```

### 2. HTTP-Only Cookies
Church context stored in secure HTTP-only cookie:
- Cannot be accessed via JavaScript
- Secure flag in production
- SameSite: lax protection
- 30-day expiry

### 3. Audit Logging
All context changes logged to database:
```typescript
await prisma.activityLog.create({
  data: {
    userId: userId,
    action: "CHURCH_CONTEXT_SET",
    entityType: "Church",
    entityId: churchId,
    details: JSON.stringify({
      churchName: church.name,
      timestamp: new Date().toISOString(),
    }),
  },
});
```

### 4. Church Verification
Context validates church exists before setting:
```typescript
const church = await prisma.church.findUnique({
  where: { id: churchId },
});
if (!church) {
  throw new Error("Church not found");
}
```

## Usage Examples

### For System Admins

**Switching to a Church:**
1. Click "Select Church" button in dashboard header
2. Search for the church (optional)
3. Click on the church card
4. Dashboard refreshes with church context active
5. Blue banner appears at top showing context

**Returning to System View:**
1. Click "Select Church" button (shows current church name)
2. Click "Clear" button next to current context badge
3. Dashboard refreshes, church context removed
4. Blue banner disappears

### For API Developers

**Getting Effective Church ID:**
```typescript
import { requireLogin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const auth = await requireLogin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use auth.churchId in queries
  const data = await prisma.someModel.findMany({
    where: {
      churchId: auth.churchId, // Null for system admin without context
    },
  });

  return NextResponse.json(data);
}
```

**Manual Context Check:**
```typescript
import { getAdminChurchContext, isSystemAdmin } from "@/lib/admin-church-context";

const userRole = (session.user as any).role;

if (isSystemAdmin(userRole)) {
  const context = await getAdminChurchContext(userRole);
  if (context) {
    console.log(`Admin viewing: ${context.churchName}`);
  } else {
    console.log("Admin in system view (no church context)");
  }
}
```

## Database Schema

No database changes required! The feature uses:
- Existing `Church` model for church data
- Existing `ActivityLog` model for audit logs
- Existing `Subscription` model for plan information
- HTTP-only cookies for context storage

## Benefits

### For System Administrators
- **No Church Membership Required** - Admins don't need to be added as members
- **Quick Context Switching** - Switch between churches instantly
- **Full Management Access** - View and manage any church as if you belong to it
- **Support Made Easy** - Help churches with issues without complex setup
- **Audit Trail** - All actions logged with church context

### For Church Administrators
- **Better Support** - System admins can see exactly what you see
- **No Extra Users** - System admins don't clutter your member list
- **Secure Access** - All access is logged and controlled
- **Professional Help** - Support team can troubleshoot directly

### For Development
- **Clean Code** - Single source of truth for church context
- **Easy Integration** - Just use `auth.churchId` from requireLogin()
- **Flexible Permissions** - Works with existing permission system
- **Testable** - Easy to test with different church contexts

## Common Use Cases

1. **Technical Support**
   - User reports bug in their church dashboard
   - System admin switches to their church
   - Reproduces issue in exact context
   - Fixes issue, returns to system view

2. **Church Setup**
   - New church registers
   - System admin switches to church
   - Configures initial settings
   - Sets up first admin user
   - Returns to system view

3. **Data Management**
   - Church requests data cleanup
   - System admin switches to church
   - Reviews and cleans data
   - Verifies with church admin
   - Returns to system view

4. **Feature Configuration**
   - Church needs premium feature enabled
   - System admin switches to church
   - Enables feature in subscription
   - Tests feature works correctly
   - Returns to system view

## Troubleshooting

### Church Switcher Not Showing
- Verify user role is SUPERADMIN, SYSTEM_ADMIN, or SYSTEM_SUPPORT
- Check session is valid
- Refresh browser/clear cache

### Context Not Persisting
- Check cookie is being set (DevTools > Application > Cookies)
- Verify cookie hasn't expired (30 days)
- Check secure cookie settings in production

### Permission Errors
- Verify `getEffectiveChurchId()` is being called
- Check audit logs for context switches
- Ensure `requireLogin()` is used correctly

### Churches Not Loading
- Check API route permissions
- Verify database connection
- Check church records exist

## Future Enhancements

Potential improvements:
- Recent churches list (quick access to frequently managed churches)
- Church favorites/bookmarks
- Multi-church management (view multiple churches simultaneously)
- Church comparison tools
- Bulk operations across churches
- Church health dashboard
- Support ticket integration

## Related Documentation

- [System Admin Guide](./SYSTEM_ADMIN_GUIDE.md)
- [Roles & Permissions Guide](./ROLES_PERMISSIONS_GUIDE.md)
- [Invitation System](./INVITATION_SUBSCRIPTION_SYSTEM.md)

## API Reference

### Types

```typescript
interface ChurchContext {
  churchId: string;
  churchName: string;
  churchLogo?: string | null;
}

interface Church {
  id: string;
  name: string;
  logo: string | null;
  location: string;
  isActive: boolean;
  plan: string;
  status: string;
  memberCount: number;
  createdAt: string;
}
```

### Functions

```typescript
// Check if user is system admin
isSystemAdmin(userRole?: string): boolean

// Get current church context
getAdminChurchContext(userRole: string): Promise<ChurchContext | null>

// Set church context
setAdminChurchContext(
  churchId: string, 
  userRole: string, 
  userId: string
): Promise<ChurchContext | null>

// Clear church context
clearAdminChurchContext(): Promise<void>

// Get effective church ID (includes context)
getEffectiveChurchId(
  userId: string, 
  userRole: string
): Promise<string | null>
```

## Support

For issues or questions:
1. Check this documentation first
2. Review audit logs for context switches
3. Contact system administrator
4. Submit support ticket with church context details
