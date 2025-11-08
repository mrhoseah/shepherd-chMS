# Roles & Permissions Management Guide

## Overview

The application uses a two-tier permission system:
1. **Role-Based Permissions** (Casbin) - Define what each role can do
2. **User-Level Permissions** - Individual user roles and login access

## Access Location

**Navigate to**: `/dashboard/settings/roles`

Or go to: **Settings → Roles & Permissions** tab

## Features

### 1. Role Permissions Management

**Location**: Role Permissions tab

**What it does**:
- Manages permissions for roles (Admin, Pastor, Leader, Member, Guest)
- Uses Casbin for fine-grained access control
- Permissions are in format: `role` can `action` on `resource`

**Common Resources**:
- `users` - User management
- `groups` - Group management
- `donations` - Financial data
- `events` - Event management
- `reports` - Report generation
- `settings` - System settings
- `communications` - Messaging
- `volunteers` - Volunteer management
- `inventory` - Inventory management

**Common Actions**:
- `view` - Read access
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Remove records
- `manage` - Full management access

**How to use**:
1. Select a role from dropdown
2. Choose resource and action
3. Click "Add Permission"
4. View all permissions for the role in the table
5. Remove permissions by clicking the trash icon

**Initialize Default Policies**:
- Sets up default permissions for Admin, Pastor, and Leader roles
- Run this once when setting up the system

### 2. User Roles Management

**Location**: User Roles tab

**What it does**:
- View all users and their current roles
- Change individual user roles
- See role distribution statistics

**Available Roles**:
- **Admin** - Full system access (cannot be changed)
- **Pastor** - Pastoral leadership access
- **Leader** - Group/ministry leader access
- **Member** - Standard member access
- **Guest** - Limited access

**How to use**:
1. Go to "User Roles" tab
2. Find the user you want to modify
3. Click the edit icon
4. Select new role from dropdown
5. Click "Save"

**Note**: Admin users cannot have their roles changed (protected)

## Permission Hierarchy

1. **Admin Role**
   - Has ALL permissions automatically
   - Cannot be modified
   - Bypasses all permission checks

2. **Other Roles**
   - Permissions defined in Casbin
   - Checked via `checkPermission()` function
   - Can be customized per role

## User-Level Permissions

In addition to roles, users have:
- **`canLogin`** - Permission to access dashboard
- **`status`** - ACTIVE, PENDING, INACTIVE, SUSPENDED
- **`permissions`** - Custom JSON permissions (optional)

**Access Rules**:
- Admin: Always can login
- Others: Need `canLogin: true` AND `status: ACTIVE`

## API Endpoints

### Role Permissions
- `GET /api/permissions` - Get all role permissions
- `GET /api/permissions?role=leader` - Get permissions for specific role
- `POST /api/permissions` - Add permission to role
- `DELETE /api/permissions?role=leader&resource=users&action=create` - Remove permission
- `PUT /api/permissions` - Initialize default policies

### User Roles
- `PATCH /api/users/[id]` - Update user role
- `PATCH /api/users/[id]/permissions` - Update user permissions

## Best Practices

1. **Start with Default Policies**
   - Initialize default policies first
   - Then customize as needed

2. **Role Naming**
   - Use lowercase for Casbin roles (admin, pastor, leader)
   - Database uses uppercase (ADMIN, PASTOR, LEADER)

3. **Permission Granularity**
   - Be specific with resources and actions
   - Use `manage` for full access to a resource
   - Use specific actions (view, create, update, delete) for fine control

4. **Testing Permissions**
   - Test permissions after changes
   - Check that users can/cannot access resources as expected

5. **Documentation**
   - Document custom permissions
   - Keep track of permission changes

## Examples

### Example 1: Allow Leader to manage groups
```
Role: leader
Resource: groups
Action: manage
```

### Example 2: Allow Pastor to view and create reports
```
Role: pastor
Resource: reports
Action: view
Action: create
```

### Example 3: Allow Member to only view events
```
Role: member
Resource: events
Action: view
```

## Troubleshooting

**Permission not working?**
1. Check if user has correct role
2. Verify permission exists in Casbin
3. Check if user has `canLogin: true` and `status: ACTIVE`
4. Reload enforcer after permission changes

**Can't change user role?**
- Admin roles are protected and cannot be changed
- Ensure you have admin access

**Permission changes not reflecting?**
- Permissions are cached
- Reload the page or wait a few seconds
- Check server logs for errors

