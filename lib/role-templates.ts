/**
 * Role Templates for Church Management System
 * Defines preset permission sets for specialized admin roles
 */

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  baseRole: "ADMIN" | "PASTOR" | "LEADER" | "MEMBER" | "GUEST";
  permissions: {
    resource: string;
    actions: string[];
  }[];
  icon?: string;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Full system access: user management, settings, data exports, integrations",
    baseRole: "ADMIN",
    permissions: [
      { resource: "users", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "groups", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "donations", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "events", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "reports", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "settings", actions: ["view", "update", "manage"] },
      { resource: "communications", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "volunteers", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "inventory", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "integrations", actions: ["view", "update", "manage"] },
      { resource: "dashboard", actions: ["access"] },
    ],
  },
  {
    id: "finance_admin",
    name: "Finance Admin",
    description: "Manage donations, tithes, budgets, financial reports, and donor records",
    baseRole: "LEADER",
    permissions: [
      { resource: "donations", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "reports", actions: ["view", "create"] },
      { resource: "users", actions: ["view"] }, // View member profiles for donor info
      { resource: "dashboard", actions: ["access"] },
    ],
  },
  {
    id: "event_coordinator",
    name: "Event Coordinator",
    description: "Create/manage events, assign volunteers, handle registrations and logistics",
    baseRole: "LEADER",
    permissions: [
      { resource: "events", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "volunteers", actions: ["view", "create", "update", "assign"] },
      { resource: "communications", actions: ["view", "create"] }, // For event announcements
      { resource: "users", actions: ["view"] }, // View attendees
      { resource: "dashboard", actions: ["access"] },
    ],
  },
  {
    id: "group_leader",
    name: "Group/Ministry Leader",
    description: "Oversee specific groups (e.g., youth, worship), manage rosters, communicate with members",
    baseRole: "LEADER",
    permissions: [
      { resource: "groups", actions: ["view", "update", "manage"] }, // Their groups only
      { resource: "users", actions: ["view", "update"] }, // Group members only
      { resource: "communications", actions: ["view", "create"] }, // Group communications
      { resource: "events", actions: ["view", "create", "update"] }, // Group events
      { resource: "volunteers", actions: ["view", "assign"] }, // Assign within group
      { resource: "dashboard", actions: ["access"] },
    ],
  },
  {
    id: "communications_admin",
    name: "Communications Admin",
    description: "Send emails/SMS, manage announcements, newsletters, and media uploads",
    baseRole: "LEADER",
    permissions: [
      { resource: "communications", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "users", actions: ["view"] }, // For targeting messages
      { resource: "groups", actions: ["view"] }, // For group messaging
      { resource: "events", actions: ["view"] }, // For event announcements
      { resource: "dashboard", actions: ["access"] },
    ],
  },
  {
    id: "volunteer_manager",
    name: "Volunteer Manager",
    description: "Schedule volunteers, track availability, assign roles",
    baseRole: "LEADER",
    permissions: [
      { resource: "volunteers", actions: ["view", "create", "update", "delete", "manage"] },
      { resource: "users", actions: ["view", "update"] }, // Update volunteer info
      { resource: "events", actions: ["view", "update"] }, // Assign to events
      { resource: "groups", actions: ["view"] }, // View group assignments
      { resource: "dashboard", actions: ["access"] },
    ],
  },
  {
    id: "it_admin",
    name: "IT/Admin Support",
    description: "Manage user accounts, troubleshoot access issues, configure integrations",
    baseRole: "ADMIN",
    permissions: [
      { resource: "users", actions: ["view", "create", "update"] }, // No delete
      { resource: "settings", actions: ["view", "update"] }, // No manage
      { resource: "integrations", actions: ["view", "update"] },
      { resource: "dashboard", actions: ["access"] },
    ],
  },
];

/**
 * Get permissions for a role template
 */
export function getTemplatePermissions(templateId: string): RoleTemplate["permissions"] {
  const template = ROLE_TEMPLATES.find((t) => t.id === templateId);
  return template?.permissions || [];
}

/**
 * Apply template permissions to a role in Casbin format
 * Returns array of [role, resource, action] tuples
 */
export function templateToCasbinPolicies(
  templateId: string,
  roleName?: string
): Array<[string, string, string]> {
  const template = ROLE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return [];

  const casbinRole = roleName || template.baseRole.toLowerCase();
  const policies: Array<[string, string, string]> = [];

  template.permissions.forEach((perm) => {
    perm.actions.forEach((action) => {
      policies.push([casbinRole, perm.resource, action]);
    });
  });

  return policies;
}

/**
 * Get all available resources from templates
 */
export function getAllResources(): string[] {
  const resources = new Set<string>();
  ROLE_TEMPLATES.forEach((template) => {
    template.permissions.forEach((perm) => {
      resources.add(perm.resource);
    });
  });
  return Array.from(resources).sort();
}

/**
 * Get all available actions from templates
 */
export function getAllActions(): string[] {
  const actions = new Set<string>();
  ROLE_TEMPLATES.forEach((template) => {
    template.permissions.forEach((perm) => {
      perm.actions.forEach((action) => actions.add(action));
    });
  });
  return Array.from(actions).sort();
}

