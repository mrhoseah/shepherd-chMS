import { prisma } from "@/lib/prisma";

export interface WorkflowTriggerData {
  type: string;
  userId?: string;
  memberId?: string;
  donationId?: string;
  eventId?: string;
  groupId?: string;
  data?: any;
}

/**
 * Execute workflows that match a trigger
 */
export async function executeWorkflows(triggerData: WorkflowTriggerData) {
  try {
    // Find all active workflows that match this trigger
    const workflows = await prisma.workflow.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
        triggerType: triggerData.type as any,
      },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    // Execute each matching workflow
    for (const workflow of workflows) {
      try {
        await executeWorkflow(workflow.id, triggerData);
      } catch (error: any) {
        console.error(`Error executing workflow ${workflow.id}:`, error);
        // Continue with other workflows even if one fails
      }
    }
  } catch (error: any) {
    console.error("Error in executeWorkflows:", error);
  }
}

/**
 * Execute a single workflow
 */
async function executeWorkflow(workflowId: string, triggerData: WorkflowTriggerData) {
  // Create workflow execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      triggerData: triggerData as any,
      status: "running",
    },
  });

  try {
    // Get workflow with actions
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Execute each action in order
    for (const action of workflow.actions) {
      try {
        // Check conditions if any
        if (action.conditions && !evaluateConditions(action.conditions, triggerData)) {
          // Skip this action
          await prisma.workflowActionExecution.create({
            data: {
              executionId: execution.id,
              actionId: action.id,
              status: "skipped",
            },
          });
          continue;
        }

        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, action.delay * 60 * 1000));
        }

        // Execute the action
        await executeAction(action, triggerData, execution.id);
      } catch (error: any) {
        console.error(`Error executing action ${action.id}:`, error);
        await prisma.workflowActionExecution.create({
          data: {
            executionId: execution.id,
            actionId: action.id,
            status: "failed",
            error: error.message,
          },
        });
      }
    }

    // Mark execution as completed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });
  } catch (error: any) {
    // Mark execution as failed
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "failed",
        error: error.message,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Execute a single workflow action
 */
async function executeAction(
  action: any,
  triggerData: WorkflowTriggerData,
  executionId: string
) {
  const actionExecution = await prisma.workflowActionExecution.create({
    data: {
      executionId,
      actionId: action.id,
      status: "running",
    },
  });

  try {
    let result: any = {};

    switch (action.type) {
      case "SEND_EMAIL":
        result = await sendEmail(action.config, triggerData);
        break;
      case "SEND_SMS":
        result = await sendSMS(action.config, triggerData);
        break;
      case "SEND_NOTIFICATION":
        result = await sendNotification(action.config, triggerData);
        break;
      case "CREATE_TASK":
        result = await createTask(action.config, triggerData);
        break;
      case "ASSIGN_TO_GROUP":
        result = await assignToGroup(action.config, triggerData);
        break;
      case "UPDATE_MEMBER_FIELD":
        result = await updateMemberField(action.config, triggerData);
        break;
      case "TRIGGER_WEBHOOK":
        result = await triggerWebhook(action.config, triggerData);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    // Mark action as completed
    await prisma.workflowActionExecution.update({
      where: { id: actionExecution.id },
      data: {
        status: "completed",
        result,
        executedAt: new Date(),
      },
    });
  } catch (error: any) {
    // Mark action as failed
    await prisma.workflowActionExecution.update({
      where: { id: actionExecution.id },
      data: {
        status: "failed",
        error: error.message,
        executedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Evaluate conditions for an action
 */
function evaluateConditions(conditions: any, triggerData: WorkflowTriggerData): boolean {
  // Simple condition evaluation - can be extended
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Example: Check if member has specific status
  if (conditions.memberStatus) {
    // This would need to fetch member data
    // For now, return true
    return true;
  }

  return true;
}

/**
 * Action handlers
 */
async function sendEmail(config: any, triggerData: WorkflowTriggerData) {
  // Get recipient
  const userId = triggerData.userId || triggerData.memberId;
  if (!userId) {
    throw new Error("No user ID in trigger data");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  });

  if (!user?.email) {
    throw new Error("User email not found");
  }

  // Get email template
  const templateId = config.templateId;
  let subject = config.subject || "Notification";
  let body = config.body || "";

  if (templateId) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });
    if (template) {
      subject = template.subject;
      body = template.body;
      // Replace variables
      body = replaceVariables(body, { user, ...triggerData.data });
      subject = replaceVariables(subject, { user, ...triggerData.data });
    }
  }

  // Create message record (assuming Message model exists)
  try {
    await prisma.message.create({
      data: {
        senderId: "system", // System user
        recipientId: userId,
        subject,
        body,
        type: "EMAIL",
        status: "PENDING",
      },
    });
  } catch (error) {
    // Message model might not exist, that's okay
    console.log("Could not create message record:", error);
  }

  // In production, send actual email via SMTP service
  console.log(`Sending email to ${user.email}: ${subject}`);

  return { sent: true, recipient: user.email };
}

async function sendSMS(config: any, triggerData: WorkflowTriggerData) {
  const userId = triggerData.userId || triggerData.memberId;
  if (!userId) {
    throw new Error("No user ID in trigger data");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, firstName: true },
  });

  if (!user?.phone) {
    throw new Error("User phone not found");
  }

  const message = replaceVariables(config.message || "", {
    user,
    ...triggerData.data,
  });

  // In production, send SMS via SMS service (e.g., Afrika's Talking)
  console.log(`Sending SMS to ${user.phone}: ${message}`);

  return { sent: true, recipient: user.phone };
}

async function sendNotification(config: any, triggerData: WorkflowTriggerData) {
  const userId = triggerData.userId || triggerData.memberId;
  if (!userId) {
    throw new Error("No user ID in trigger data");
  }

  // Create notification record
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: config.title || "Notification",
        message: replaceVariables(config.message || "", {
          ...triggerData.data,
        }),
        type: config.type || "INFO",
        read: false,
      },
    });
  } catch (error) {
    console.log("Could not create notification:", error);
  }

  return { sent: true };
}

async function createTask(config: any, triggerData: WorkflowTriggerData) {
  const assignedTo = config.assignedTo || triggerData.userId;
  if (!assignedTo) {
    throw new Error("No assignee specified");
  }

  // Create task record (if Task model exists)
  try {
    const task = await (prisma as any).task?.create({
      data: {
        title: config.title || "Task",
        description: replaceVariables(config.description || "", {
          ...triggerData.data,
        }),
        assignedTo,
        status: "PENDING",
        priority: config.priority || "MEDIUM",
        dueDate: config.dueDate ? new Date(config.dueDate) : null,
      },
    });
    if (!task) {
      console.log("Task model not available");
    }
  } catch (error) {
    // Task model might not exist, that's okay
    console.log("Could not create task (model may not exist):", error);
  }

  return { created: true };
}

async function assignToGroup(config: any, triggerData: WorkflowTriggerData) {
  const userId = triggerData.userId || triggerData.memberId;
  const groupId = config.groupId;

  if (!userId || !groupId) {
    throw new Error("User ID and Group ID required");
  }

  // Add user to group
  try {
    await prisma.groupMember.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      create: {
        userId,
        groupId,
        role: config.role || "MEMBER",
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.log("Could not assign to group:", error);
  }

  return { assigned: true };
}

async function updateMemberField(config: any, triggerData: WorkflowTriggerData) {
  const userId = triggerData.userId || triggerData.memberId;
  if (!userId) {
    throw new Error("No user ID in trigger data");
  }

  const field = config.field;
  const value = config.value;

  if (!field) {
    throw new Error("Field name required");
  }

  // Update user field
  const updateData: any = {};
  updateData[field] = value;

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return { updated: true, field, value };
}

async function triggerWebhook(config: any, triggerData: WorkflowTriggerData) {
  const url = config.url;
  if (!url) {
    throw new Error("Webhook URL required");
  }

  // Send webhook request
  try {
    const response = await fetch(url, {
      method: config.method || "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      },
      body: JSON.stringify({
        workflow: triggerData.type,
        data: triggerData.data,
        timestamp: new Date().toISOString(),
      }),
    });

    return {
      sent: true,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error: any) {
    throw new Error(`Webhook failed: ${error.message}`);
  }
}

/**
 * Replace variables in template strings
 */
function replaceVariables(template: string, data: any): string {
  let result = template;
  const variables = template.match(/\{\{(\w+)\}\}/g) || [];

  for (const variable of variables) {
    const key = variable.replace(/\{\{|\}\}/g, "");
    const value = getNestedValue(data, key) || "";
    result = result.replace(variable, String(value));
  }

  return result;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, prop) => current?.[prop], obj);
}

