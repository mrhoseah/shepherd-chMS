# Advanced Roles & Permissions System

## Overview

The Church Management System now includes a comprehensive role and permission system with:

1. **Role Templates** - Preset permission sets for specialized admin roles
2. **Permission Matrix** - Visual overview of all role permissions
3. **Granular Permissions** - Fine-grained control using Casbin
4. **User Role Management** - Easy assignment of roles to users

## Role Templates

### Available Templates

1. **Super Admin**
   - Full system access
   - All resources: manage permissions
   - Base role: ADMIN

2. **Finance Admin**
   - Manage donations, tithes, budgets
   - Financial reports and donor records
   - Base role: LEADER
   - Resources: donations, reports, users (view only)

3. **Event Coordinator**
   - Create/manage events
   - Assign volunteers
   - Handle registrations
   - Base role: LEADER
   - Resources: events, volunteers, communications, users (view)

4. **Group/Ministry Leader**
   - Oversee specific groups
   - Manage rosters
   - Communicate with members
   - Base role: LEADER
   - Resources: groups (their own), users (group members), communications, events, volunteers

5. **Communications Admin**
   - Send emails/SMS
   - Manage announcements
   - Newsletters and media
   - Base role: LEADER
   - Resources: communications, users (view), groups (view), events (view)

6. **Volunteer Manager**
   - Schedule volunteers
   - Track availability
   - Assign roles
   - Base role: LEADER
   - Resources: volunteers, users, events, groups (view)

7. **IT/Admin Support**
   - Manage user accounts
   - Troubleshoot access issues
   - Configure integrations
   - Base role: ADMIN
   - Resources: users (no delete), settings, integrations

## Using Role Templates

### Apply a Template

1. Navigate to **Settings → Roles & Permissions → Role Templates**
2. Browse available templates
3. Click **"Apply Template"** on the desired template
4. The template permissions will be applied to the base role

### Customize After Applying

- Templates provide a starting point
- You can add/remove individual permissions after applying
- Use the **Role Permissions** tab to fine-tune

## Permission Matrix

### View the Matrix

1. Navigate to **Settings → Roles & Permissions → Permission Matrix**
2. See a visual grid of all roles and their permissions
3. Quickly identify what each role can do

### Matrix Columns

- **Roles**: admin, pastor, leader, member, guest
- **Resources**: users, groups, donations, events, reports, settings, communications, volunteers, inventory
- **Actions**: view, create, update, delete, manage

## Permission Structure

### Resources

- `users` - User/member management
- `groups` - Group/ministry management
- `donations` - Financial giving
- `events` - Event management
- `reports` - Report generation
- `settings` - System settings
- `communications` - Messaging (email/SMS)
- `volunteers` - Volunteer management
- `inventory` - Inventory/assets

### Actions

- `view` - Read-only access
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Remove records
- `manage` - Full management (all actions)

## Best Practices

### 1. Start with Templates

- Use role templates as a starting point
- Customize based on your church's needs
- Don't reinvent the wheel

### 2. Principle of Least Privilege

- Give users only the permissions they need
- Start restrictive, then add permissions as needed
- Regularly review and audit permissions

### 3. Role Hierarchy

- **ADMIN** - Full access (use sparingly)
- **PASTOR** - Pastoral leadership
- **LEADER** - Group/ministry leaders
- **MEMBER** - Standard members
- **GUEST** - Limited access

### 4. Document Custom Roles

- If you create custom permission sets, document them
- Keep track of who has what permissions
- Use the permission matrix for reference

### 5. Regular Audits

- Review permissions quarterly
- Remove permissions for inactive users
- Update templates as needs change

## Examples

### Example 1: Finance Admin Setup

1. Go to **Role Templates** tab
2. Find **Finance Admin** template
3. Click **Apply Template**
4. Permissions applied to `leader` role
5. Assign users with finance responsibilities to `LEADER` role
6. They now have finance admin permissions

### Example 2: Event Coordinator

1. Apply **Event Coordinator** template
2. User can now:
   - Create and manage events
   - Assign volunteers to events
   - Send event announcements
   - View user profiles for attendee info

### Example 3: Group Leader

1. Apply **Group/Ministry Leader** template
2. Leader can:
   - Manage their assigned groups
   - View and update group members
   - Create group events
   - Communicate with group members

## API Endpoints

### Templates
- `GET /api/permissions/templates` - Get all templates
- `POST /api/permissions/templates` - Apply template to role

### Permissions
- `GET /api/permissions` - Get all permissions
- `POST /api/permissions` - Add permission
- `DELETE /api/permissions` - Remove permission
- `PUT /api/permissions` - Initialize default policies

## Security Notes

1. **Admin Protection**: ADMIN role users cannot have permissions changed
2. **Audit Logs**: All permission changes are logged
3. **Validation**: Permissions are validated before applying
4. **Casbin**: Uses industry-standard RBAC system

## Troubleshooting

**Template not applying?**
- Check that you have admin access
- Verify the base role exists
- Check server logs for errors

**Permissions not working?**
- Ensure user has `canLogin: true` and `status: ACTIVE`
- Check permission matrix to verify permissions
- Reload enforcer after changes

**Can't see certain resources?**
- Check your role's permissions
- Use permission matrix to verify
- Contact admin if needed

