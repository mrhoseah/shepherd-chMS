# Workflow System Architecture

## Overview

The workflow system is an event-driven automation engine that executes predefined actions when specific events (triggers) occur in the system.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT OCCURS (Trigger)                        │
│  Examples:                                                       │
│  - New member created                                            │
│  - Donation received                                             │
│  - Member becomes inactive                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ENDPOINT (e.g., /api/people POST)              │
│                                                                  │
│  1. Perform main operation (create member, process donation)    │
│  2. After success, call executeWorkflows()                      │
│                                                                  │
│  Example:                                                        │
│  ```typescript                                                   │
│  // After member is created                                     │
│  Promise.resolve().then(async () => {                           │
│    const { executeWorkflows } = await import("@/lib/workflow-engine");│
│    await executeWorkflows({                                     │
│      type: "MEMBER_CREATED",                                    │
│      userId: person.id,                                         │
│      memberId: person.id,                                       │
│      data: { person, role }                                     │
│    });                                                          │
│  });                                                            │
│  ```                                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              WORKFLOW ENGINE (lib/workflow-engine.ts)            │
│                                                                  │
│  executeWorkflows(triggerData)                                  │
│  ├─ Query database for active workflows matching trigger type   │
│  │  WHERE: isActive = true, status = "ACTIVE",                  │
│  │         triggerType = triggerData.type                       │
│  │                                                              │
│  └─ For each matching workflow:                                 │
│     └─ executeWorkflow(workflowId, triggerData)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           EXECUTE SINGLE WORKFLOW                                │
│                                                                  │
│  executeWorkflow(workflowId, triggerData)                       │
│  ├─ Create WorkflowExecution record (status: "running")         │
│  ├─ Load workflow with ordered actions                          │
│  │                                                              │
│  └─ For each action (in order):                                 │
│     ├─ Check conditions (if any) → Skip if false                │
│     ├─ Apply delay (if configured) → Wait N minutes             │
│     └─ Execute action → executeAction()                         │
│        ├─ Create WorkflowActionExecution (status: "running")    │
│        ├─ Execute based on action.type:                         │
│        │  - SEND_EMAIL → sendEmail()                            │
│        │  - SEND_SMS → sendSMS()                                │
│        │  - SEND_NOTIFICATION → sendNotification()              │
│        │  - CREATE_TASK → createTask()                          │
│        │  - ASSIGN_TO_GROUP → assignToGroup()                   │
│        │  - UPDATE_MEMBER_FIELD → updateMemberField()           │
│        │  - TRIGGER_WEBHOOK → triggerWebhook()                  │
│        └─ Update WorkflowActionExecution (status: "completed")  │
│                                                                  │
│  └─ Update WorkflowExecution (status: "completed")              │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Workflow Model
```prisma
model Workflow {
  id            String              @id
  name          String
  description   String?
  status        WorkflowStatus      // DRAFT, ACTIVE, INACTIVE
  triggerType   WorkflowTriggerType // MEMBER_CREATED, DONATION_RECEIVED, etc.
  triggerConfig Json?               // Trigger-specific config
  isActive      Boolean             @default(true)
  actions       WorkflowAction[]    // Ordered list of actions
  executions    WorkflowExecution[] // Execution history
}
```

### WorkflowAction Model
```prisma
model WorkflowAction {
  id         String
  workflowId String
  type       WorkflowActionType     // SEND_EMAIL, SEND_SMS, etc.
  order      Int                    // Execution order
  config     Json                   // Action configuration
  conditions Json?                  // Conditional logic
  delay      Int?                   // Delay in minutes
}
```

### WorkflowExecution Model
```prisma
model WorkflowExecution {
  id          String
  workflowId  String
  triggerData Json?                  // Data that triggered workflow
  status      String                 // running, completed, failed
  startedAt   DateTime
  completedAt DateTime?
  error       String?
  actionExecutions WorkflowActionExecution[]
}
```

## Current Integration Points

### 1. Member Creation
**Location:** `app/api/people/route.ts`
```typescript
// After member is successfully created
Promise.resolve().then(async () => {
  const { executeWorkflows } = await import("@/lib/workflow-engine");
  await executeWorkflows({
    type: "MEMBER_CREATED",
    userId: person.id,
    memberId: person.id,
    data: { person, role: role || "GUEST" }
  });
});
```

### 2. M-Pesa Donation
**Location:** `app/api/donations/mpesa-stk/route.ts`
```typescript
// After donation is confirmed
const { executeWorkflows } = await import("@/lib/workflow-engine");
await executeWorkflows({
  type: "DONATION_RECEIVED",
  userId: donation.userId,
  memberId: donation.userId,
  donationId: donation.id,
  data: { donation, amount, category }
});
```

### 3. PayPal Donation
**Location:** `app/api/webhooks/paypal/route.ts`
```typescript
// After PayPal payment is confirmed
const { executeWorkflows } = await import("@/lib/workflow-engine");
await executeWorkflows({
  type: "DONATION_RECEIVED",
  userId: donation.userId,
  memberId: donation.userId,
  donationId: donation.id,
  data: { donation, amount, category }
});
```

### 4. Manual Execution (Testing)
**Location:** `app/api/workflows/execute/route.ts`
```typescript
// Admin can manually trigger workflows for testing
POST /api/workflows/execute
{
  "type": "MEMBER_CREATED",
  "data": { "userId": "...", "memberId": "..." }
}
```

## Action Types & Implementations

### 1. SEND_EMAIL
- Fetches user email from database
- Uses email template if specified
- Replaces variables ({{firstName}}, {{lastName}}, etc.)
- Creates Message record
- Sends email via SMTP (production)

### 2. SEND_SMS
- Fetches user phone from database
- Replaces variables in message
- Sends SMS via SMS service (e.g., Afrika's Talking)

### 3. SEND_NOTIFICATION
- Creates Notification record in database
- Appears in user's notification bell

### 4. CREATE_TASK
- Creates Task record
- Assigns to specified user or workflow trigger user
- Sets priority, due date, etc.

### 5. ASSIGN_TO_GROUP
- Adds user to specified group via GroupMember
- Sets role (MEMBER, LEADER, etc.)

### 6. UPDATE_MEMBER_FIELD
- Updates any field on User model
- Example: Set status, update tags, etc.

### 7. TRIGGER_WEBHOOK
- Sends HTTP POST to external URL
- Includes workflow data and trigger information
- Useful for integrations with external systems

## Key Features

### 1. **Conditional Execution**
Actions can have conditions that must be met:
```json
{
  "conditions": {
    "memberStatus": "ACTIVE",
    "amount": { "greaterThan": 1000 }
  }
}
```

### 2. **Delayed Actions**
Actions can have delays (in minutes):
```json
{
  "delay": 60  // Execute 60 minutes after trigger
}
```

### 3. **Variable Replacement**
Templates support variable replacement:
```
Hello {{firstName}} {{lastName}},
Thank you for your donation of {{amount}}.
```

### 4. **Error Handling**
- Each action execution is tracked
- Failed actions don't stop the workflow
- Errors are logged in WorkflowActionExecution

### 5. **Execution History**
- All workflow executions are recorded
- Can track success/failure rates
- See individual action results

## Trigger Types

Currently supported:
- `MEMBER_CREATED` - New member registered
- `DONATION_RECEIVED` - Donation completed
- `MEMBER_INACTIVE` - Member becomes inactive
- `EVENT_CREATED` - New event created
- `ATTENDANCE_MISSED` - Member misses service
- `BIRTHDAY` - Member birthday
- `ANNIVERSARY` - Member anniversary
- `GUEST_REGISTERED` - Guest registered
- `CUSTOM` - Custom trigger

## Adding New Trigger Points

To add workflow support to a new event:

1. **In your API endpoint**, after the main operation succeeds:
```typescript
import { executeWorkflows } from "@/lib/workflow-engine";

// After your operation
await executeWorkflows({
  type: "YOUR_TRIGGER_TYPE",
  userId: "...",      // If applicable
  memberId: "...",    // If applicable
  data: {             // Any relevant data
    // ... your data
  }
});
```

2. **Add trigger type to schema** (if new):
```prisma
enum WorkflowTriggerType {
  // ... existing
  YOUR_TRIGGER_TYPE
}
```

3. **Create workflows** via UI that use this trigger type

## Best Practices

1. **Use async execution** - Wrap in `Promise.resolve().then()` to not block main operation
2. **Handle errors gracefully** - Workflow failures shouldn't break main operations
3. **Use conditions** - Filter actions based on member data
4. **Add delays** - Space out actions (e.g., welcome email immediately, follow-up after 3 days)
5. **Test workflows** - Use manual execution endpoint to test before activating
6. **Monitor executions** - Check workflow history regularly

## Future Enhancements

- Scheduled workflows (cron-like)
- Workflow templates
- Visual workflow builder
- More action types
- Workflow versioning
- A/B testing workflows
- Workflow analytics

