import { newEnforcer, Enforcer, newModelFromString } from "casbin";
import { prisma } from "./prisma";

// Casbin model configuration (RBAC with domains)
const modelString = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
`;

// Custom Prisma adapter for Casbin
class PrismaAdapter {
  async loadPolicy(model: any): Promise<void> {
    try {
      // Load policies from database
      const policies = await prisma.casbinRule.findMany({
        orderBy: [{ ptype: "asc" }, { v0: "asc" }],
      });

      for (const rule of policies) {
        const ruleArray = [
          rule.v0,
          rule.v1,
          rule.v2,
          rule.v3,
          rule.v4,
          rule.v5,
        ].filter((v) => v !== null && v !== undefined && v !== "");
        
        if (ruleArray.length > 0) {
          model.addPolicy(rule.ptype, rule.ptype, ruleArray);
        }
      }
    } catch (error) {
      console.error("Error loading policies from database:", error);
      throw error;
    }
  }

  async savePolicy(model: any): Promise<boolean> {
    // Clear existing policies
    await prisma.casbinRule.deleteMany({});

    // Save all policies
    const policies: any[] = [];
    
    // Get all policies from model
    const policyMap = model.model.get("p")?.policy;
    const groupingMap = model.model.get("g")?.policy;

    if (policyMap) {
      for (const [key, value] of policyMap) {
        for (const rule of value) {
          policies.push({
            ptype: "p",
            v0: rule[0] || "",
            v1: rule[1] || "",
            v2: rule[2] || "",
            v3: rule[3] || "",
            v4: rule[4] || "",
            v5: rule[5] || "",
          });
        }
      }
    }

    if (groupingMap) {
      for (const [key, value] of groupingMap) {
        for (const rule of value) {
          policies.push({
            ptype: "g",
            v0: rule[0] || "",
            v1: rule[1] || "",
            v2: rule[2] || "",
            v3: rule[3] || "",
            v4: rule[4] || "",
            v5: rule[5] || "",
          });
        }
      }
    }

    if (policies.length > 0) {
      await prisma.casbinRule.createMany({
        data: policies,
      });
    }

    return true;
  }

  async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    const existing = await prisma.casbinRule.findFirst({
      where: {
        ptype,
        v0: rule[0] || "",
        v1: rule[1] || "",
        v2: rule[2] || "",
        v3: rule[3] || "",
        v4: rule[4] || "",
        v5: rule[5] || "",
      },
    });

    if (!existing) {
      await prisma.casbinRule.create({
        data: {
          ptype,
          v0: rule[0] || "",
          v1: rule[1] || "",
          v2: rule[2] || "",
          v3: rule[3] || "",
          v4: rule[4] || "",
          v5: rule[5] || "",
        },
      });
    }
  }

  async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    await prisma.casbinRule.deleteMany({
      where: {
        ptype,
        v0: rule[0] || "",
        v1: rule[1] || "",
        v2: rule[2] || "",
        v3: rule[3] || "",
        v4: rule[4] || "",
        v5: rule[5] || "",
      },
    });
  }

  async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {
    const where: any = { ptype };
    if (fieldIndex <= 0 && fieldValues[0]) where.v0 = fieldValues[0];
    if (fieldIndex <= 1 && fieldValues[1]) where.v1 = fieldValues[1];
    if (fieldIndex <= 2 && fieldValues[2]) where.v2 = fieldValues[2];
    if (fieldIndex <= 3 && fieldValues[3]) where.v3 = fieldValues[3];
    if (fieldIndex <= 4 && fieldValues[4]) where.v4 = fieldValues[4];
    if (fieldIndex <= 5 && fieldValues[5]) where.v5 = fieldValues[5];

    await prisma.casbinRule.deleteMany({ where });
  }

  private buildPolicyLine(rule: any): string | null {
    const tokens = [rule.v0, rule.v1, rule.v2, rule.v3, rule.v4, rule.v5]
      .filter((v) => v !== null && v !== undefined && v !== "")
      .map((v) => v.toString());

    if (tokens.length === 0) return null;
    return `${rule.ptype}, ${tokens.join(", ")}`;
  }
}

let enforcerInstance: Enforcer | null = null;

export async function getEnforcer(): Promise<Enforcer> {
  if (!enforcerInstance) {
    try {
      const adapter = new PrismaAdapter();
      const model = newModelFromString(modelString);
      enforcerInstance = await newEnforcer(model, adapter);
      // Load policies from database
      await enforcerInstance.loadPolicy();
    } catch (error) {
      console.error("Error initializing enforcer:", error);
      enforcerInstance = null; // Reset instance on error
      throw error;
    }
  }
  return enforcerInstance;
}

// Reload enforcer (useful after policy changes)
export async function reloadEnforcer(): Promise<void> {
  enforcerInstance = null;
  await getEnforcer();
}

// Helper function to check permission
export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    
    // Get user's role from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, canLogin: true },
    });

    if (!user) return false;

    // Check if user has canLogin permission (for dashboard access)
    if (resource === "dashboard" && action === "access" && !user.canLogin) {
      return false;
    }

    // Admins have all permissions
    if (user.role === "ADMIN") {
      return true;
    }

    // Check permission using Casbin
    const role = user.role.toLowerCase();
    return await enforcer.enforce(role, resource, action);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// Helper function to check if user can login
export async function canUserLogin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, canLogin: true, status: true },
  });

  if (!user) return false;

  // Admins can always login
  if (user.role === "ADMIN") return true;

  // Leaders need canLogin permission
  if (user.role === "LEADER") {
    return user.canLogin === true && user.status === "ACTIVE";
  }

  // Other roles need canLogin permission
  return user.canLogin === true && user.status === "ACTIVE";
}

// Initialize default policies
export async function initializePolicies(): Promise<void> {
  try {
    const enforcer = await getEnforcer();

    // Check if policies already exist
    const existingPolicies = await prisma.casbinRule.count();
    if (existingPolicies > 0) {
      return; // Policies already initialized
    }

    // Default policies
    // Admins have all permissions
    await enforcer.addPolicy("admin", "groups", "assign");
    await enforcer.addPolicy("admin", "groups", "create");
    await enforcer.addPolicy("admin", "groups", "update");
    await enforcer.addPolicy("admin", "groups", "delete");
    await enforcer.addPolicy("admin", "users", "create");
    await enforcer.addPolicy("admin", "users", "update");
    await enforcer.addPolicy("admin", "users", "delete");
    await enforcer.addPolicy("admin", "settings", "update");
    await enforcer.addPolicy("admin", "dashboard", "access");

    // Leaders with canLogin can access dashboard and manage their groups
    await enforcer.addPolicy("leader", "dashboard", "access");
    await enforcer.addPolicy("leader", "groups", "view");
    await enforcer.addPolicy("leader", "groups", "update"); // Their own groups
    await enforcer.addPolicy("leader", "users", "view");
    await enforcer.addPolicy("leader", "meetings", "create");
    await enforcer.addPolicy("leader", "meetings", "update");
    await enforcer.addPolicy("leader", "rotations", "manage");

    // Pastors have similar permissions to leaders
    await enforcer.addPolicy("pastor", "dashboard", "access");
    await enforcer.addPolicy("pastor", "groups", "view");
    await enforcer.addPolicy("pastor", "groups", "create");
    await enforcer.addPolicy("pastor", "groups", "update");
    await enforcer.addPolicy("pastor", "users", "view");
    await enforcer.addPolicy("pastor", "users", "create");
    await enforcer.addPolicy("pastor", "users", "update");
    await enforcer.addPolicy("pastor", "meetings", "create");
    await enforcer.addPolicy("pastor", "meetings", "update");
    await enforcer.addPolicy("pastor", "rotations", "manage");

    await enforcer.savePolicy();
  } catch (error) {
    console.error("Error initializing policies:", error);
  }
}

/**
 * Initialize policies from a role template
 */
export async function initializeTemplatePolicies(
  templateId: string,
  roleName: string
): Promise<void> {
  try {
    const { templateToCasbinPolicies } = await import("./role-templates");
    const policies = templateToCasbinPolicies(templateId, roleName);
    const enforcer = await getEnforcer();

    for (const [role, resource, action] of policies) {
      await enforcer.addPolicy(role, resource, action);
    }

    await enforcer.savePolicy();
    await reloadEnforcer();
  } catch (error) {
    console.error("Error initializing template policies:", error);
    throw error;
  }
}

