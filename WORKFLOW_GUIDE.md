# Workflow System Guide

## How Workflows Work

The Automated Workflows system allows you to automate actions based on events (triggers) in your church management system.

## Example: Welcome New Member Workflow

### Step 1: Create the Workflow

When you create a "Welcome New Member" workflow:

1. **Name**: "Welcome New Members"
2. **Trigger**: "New Member Registered" (MEMBER_CREATED)
3. **Actions**: 
   - Send Welcome Email
   - Assign to Welcome Group
   - Create Follow-up Task

### Step 2: Workflow Execution Flow

```
New Member Registered
    ↓
System detects MEMBER_CREATED event
    ↓
Workflow Engine finds all active workflows with MEMBER_CREATED trigger
    ↓
For each matching workflow:
    ↓
    Create WorkflowExecution record (status: "running")
    ↓
    For each action in the workflow:
        ↓
        Check conditions (if any)
        ↓
        Apply delay (if configured)
        ↓
        Execute action:
            - Send Email → Creates message record
            - Assign to Group → Adds member to group
            - Create Task → Creates task for staff
        ↓
        Record action execution (success/failure)
    ↓
    Mark WorkflowExecution as "completed"
```

### Step 3: Real Example Flow

**When a new member is created via `/api/people` POST:**

1. **Member Creation** (`app/api/people/route.ts:189-205`)
   ```typescript
   // After member is created in database
   Promise.resolve().then(async () => {
     const { executeWorkflows } = await import("@/lib/workflow-engine");
     await executeWorkflows({
       type: "MEMBER_CREATED",
       userId: person.id,
       memberId: person.id,
       data: {
         person,
         role: role || "GUEST",
       },
     });
   });
   ```

2. **Workflow Engine** (`lib/workflow-engine.ts`)
   - Finds all workflows with `triggerType = "MEMBER_CREATED"` and `isActive = true`
   - For each workflow, creates a `WorkflowExecution` record
   - Executes each action in order

3. **Action Execution Example: Send Email**
   ```typescript
   // Gets user email
   const user = await prisma.user.findUnique({ where: { id: userId } });
   
   // Gets email template (if templateId is configured)
   const template = await prisma.emailTemplate.findUnique({
     where: { id: config.templateId }
   });
   
   // Replaces variables like {{user.firstName}}, {{user.lastName}}
   body = replaceVariables(template.body, { user, ...triggerData.data });
   
   // Creates message record
   await prisma.message.create({
     data: {
       senderId: "system",
       recipientId: userId,
       subject: "Welcome to Our Church!",
       body: "Hello {{user.firstName}}, welcome...",
       type: "EMAIL",
       status: "PENDING",
     },
   });
   ```

## Workflow Components

### 1. Triggers

Available triggers:
- `MEMBER_CREATED` - When a new member is registered
- `MEMBER_UPDATED` - When member information is updated
- `DONATION_RECEIVED` - When a donation is completed
- `ATTENDANCE_MISSED` - When a member misses a service
- `EVENT_REGISTERED` - When someone registers for an event
- `GROUP_JOINED` - When a member joins a group
- `CUSTOM` - Custom triggers

### 2. Actions

Available actions:
- **SEND_EMAIL** - Send email to member
  - Config: `{ templateId, subject, body }`
  - Variables: `{{user.firstName}}`, `{{user.email}}`, etc.

- **SEND_SMS** - Send SMS notification
  - Config: `{ message }`
  - Variables: `{{user.firstName}}`, `{{user.phone}}`

- **SEND_NOTIFICATION** - In-app notification
  - Config: `{ title, message, type }`

- **CREATE_TASK** - Create a task for staff
  - Config: `{ title, description, assignedTo, priority, dueDate }`

- **ASSIGN_TO_GROUP** - Automatically add member to group
  - Config: `{ groupId, role }`

- **UPDATE_MEMBER_FIELD** - Update member data
  - Config: `{ field, value }`

- **TRIGGER_WEBHOOK** - Call external webhook
  - Config: `{ url, method, headers }`

### 3. Conditions

Actions can have conditions that determine if they should execute:
```json
{
  "memberStatus": "ACTIVE",
  "role": "GUEST",
  "amount": { "greaterThan": 1000 }
}
```

### 4. Delays

Actions can have delays (in minutes) before execution:
- Delay of 60 = Execute 1 hour after trigger
- Useful for follow-up workflows

## Example: Complete Welcome New Member Workflow

### Workflow Configuration:
```json
{
  "name": "Welcome New Members",
  "description": "Automatically welcome new members",
  "triggerType": "MEMBER_CREATED",
  "isActive": true,
  "actions": [
    {
      "type": "SEND_EMAIL",
      "order": 1,
      "config": {
        "templateId": "welcome-email-template-id",
        "subject": "Welcome to {{church.name}}!"
      },
      "delay": 0
    },
    {
      "type": "ASSIGN_TO_GROUP",
      "order": 2,
      "config": {
        "groupId": "welcome-group-id",
        "role": "MEMBER"
      },
      "delay": 0
    },
    {
      "type": "CREATE_TASK",
      "order": 3,
      "config": {
        "title": "Follow up with {{user.firstName}} {{user.lastName}}",
        "description": "New member joined. Schedule a welcome call.",
        "assignedTo": "pastor-user-id",
        "priority": "MEDIUM",
        "dueDate": "2024-01-15"
      },
      "delay": 1440  // 24 hours later
    }
  ]
}
```

### Execution Timeline:

**T=0 (Member Created)**
1. ✅ Send Welcome Email immediately
2. ✅ Assign to Welcome Group immediately
3. ⏳ Schedule Follow-up Task for 24 hours later

**T=24 hours**
4. ✅ Create Follow-up Task for pastor

## Database Tracking

All workflow executions are tracked:

- **WorkflowExecution** - Records each time a workflow runs
  - Status: running, completed, failed
  - Trigger data stored
  - Start/completion times

- **WorkflowActionExecution** - Records each action execution
  - Status: pending, running, completed, failed, skipped
  - Results stored
  - Error messages if failed

## Viewing Workflow History

You can see:
- How many times a workflow has run
- Last execution time
- Success/failure rates
- Individual action results

## Best Practices

1. **Test workflows** - Create test workflows before activating
2. **Use delays wisely** - Don't overwhelm new members with all messages at once
3. **Monitor execution** - Check workflow history regularly
4. **Use templates** - Create email templates for consistency
5. **Conditional logic** - Use conditions to target specific member types

## Current Trigger Points

Workflows are automatically triggered at:

1. **Member Creation** - `/api/people` POST endpoint
2. **Donation Completed** - M-Pesa and PayPal webhooks
3. **More triggers coming** - Event registration, group joining, etc.

## Manual Execution

Admins can manually trigger workflows via:
```
POST /api/workflows/execute
{
  "type": "MEMBER_CREATED",
  "data": {
    "userId": "member-id",
    "memberId": "member-id"
  }
}
```

