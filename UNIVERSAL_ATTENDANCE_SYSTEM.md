# Universal Attendance System - Two-Tiered Architecture

## Overview

The Universal Attendance System provides a single, consistent framework for handling **all** countable activities in the church—from Sunday services to board meetings. This eliminates complexity and ensures accurate reporting across all activity types.

## The Two-Tiered Hierarchy

### Level 1: Master Event (The Template)
The **Master Event** defines the recurring activity template—the "what" that happens regularly.

**Examples:**
- "Sunday Worship (9 AM)" - A recurring service
- "Men's Bible Study" - A recurring group meeting
- "Finance Committee" - A recurring board meeting
- "Fall Community Picnic" - A one-time event

**Key Properties:**
- `name`: The activity name
- `type`: SERVICE, GROUP, EVENT, MEETING, FELLOWSHIP, TRAINING, OUTREACH, OTHER
- `recurrencePattern`: Optional RRULE format for recurring activities
- `defaultStartTime`: Default time (e.g., "09:00")
- `campusId`: Which campus
- `groupId`: If it's a group activity

### Level 2: Attendance Session (The Instance)
The **Attendance Session** is the specific instance where people actually gather—the "when" it happened.

**Key Properties:**
- `masterEventId`: Links to the Master Event template
- `date`: The actual date this session occurred
- `startTime`: Actual start time
- `endTime`: Actual end time
- `isJointService`: Flag for joint services (affects counting logic)

**Critical Point:** Every time attendance is captured, a **new, unique Attendance Session ID** is created. This keeps data clean and queryable.

## Universal Application

| Activity Type | Master Event Example | Attendance Session Example |
|---------------|---------------------|---------------------------|
| **Sunday Service** | Name: "Sunday Worship (9 AM)"<br>Type: SERVICE | Date: 2025-11-10<br>Start: 09:00<br>Session ID: `abc123` |
| **Multiple Services** | Name: "Sunday Worship (11 AM)"<br>Type: SERVICE | Date: 2025-11-10<br>Start: 11:00<br>Session ID: `def456` |
| **Small Group** | Name: "Women's Book Club"<br>Type: GROUP | Date: 2025-11-13<br>Start: 19:00<br>Session ID: `ghi789` |
| **Board Meeting** | Name: "Finance Committee"<br>Type: MEETING | Date: 2025-11-15<br>Start: 18:00<br>Session ID: `jkl012` |

## Attendance Counting Logic

### 1. Total Session Attendance
**Query:** Count all `AttendanceRecord` entries where `sessionId == 'xyz123'`

```sql
SELECT COUNT(*) 
FROM AttendanceRecord 
WHERE sessionId = 'xyz123'
```

**Use Case:** "How many people attended the 11 AM service on November 10th?"

### 2. Total Daily Attendance (Non-Duplicated)
**Query:** Count unique `userId` across all sessions for a given day

```sql
SELECT COUNT(DISTINCT userId)
FROM AttendanceRecord ar
JOIN AttendanceSession s ON ar.sessionId = s.id
WHERE DATE(s.date) = '2025-11-10'
```

**Use Case:** "How many unique people attended church on Sunday (across all services)?"

**Key Feature:** If someone attends both 9 AM and 11 AM, they're counted **once** for the day.

### 3. Joint Service Aggregation
**Logic:** If ANY session on a day has `isJointService = true`, automatically use "Total Daily Attendance" logic for all reporting.

**Implementation:**
```typescript
// Check if any session on the date is a joint service
const hasJointService = await prisma.attendanceSession.findFirst({
  where: {
    date: {
      gte: dayStart,
      lte: dayEnd,
    },
    isJointService: true,
  },
});

if (hasJointService) {
  // Use daily unique count
  return getTotalDailyAttendance(date);
} else {
  // Use per-session counts
  return getTotalSessionAttendance(sessionId);
}
```

## Decisions Linked to Sessions

Decisions (salvation, dedication, etc.) are captured directly on the Attendance Session screen and linked via `linkedSessionId`.

**Benefits:**
- Immediate context: Know exactly when and where the decision happened
- Follow-up prioritization: Link to person's profile and service time
- Reporting: "Decisions made during Sunday services this month"

**Example:**
```typescript
// Record decision during attendance capture
const decision = await prisma.decision.create({
  data: {
    title: "Salvation Decision",
    category: "SPIRITUAL",
    linkedSessionId: currentSessionId, // Link to the session
    proposedById: staffMemberId,
    // ... other fields
  },
});
```

## Giving Linked to Sessions

Giving can optionally link to an Attendance Session for per-session offerings.

**Two Scenarios:**

1. **Continuous Giving (Online/Monthly)**
   - `linkedSessionId` = `null`
   - Associated only with person and date

2. **Per-Session Offering (Physical Plate)**
   - `linkedSessionId` = specific session ID
   - Allows aggregation: "Total offering from 11 AM service"

**Example:**
```typescript
// Per-session offering
const donation = await prisma.donation.create({
  data: {
    userId: memberId,
    amount: 50.00,
    linkedSessionId: sessionId, // Link to specific session
    // ... other fields
  },
});
```

## Data Flow

### Creating a Master Event
```typescript
const masterEvent = await prisma.masterEvent.create({
  data: {
    name: "Sunday Worship (9 AM)",
    type: "SERVICE",
    campusId: campusId,
    defaultStartTime: "09:00",
    defaultDuration: 90,
    isRecurring: true,
    recurrencePattern: "FREQ=WEEKLY;BYDAY=SU",
  },
});
```

### Creating an Attendance Session
```typescript
const session = await prisma.attendanceSession.create({
  data: {
    masterEventId: masterEvent.id,
    date: new Date("2025-11-10"),
    startTime: new Date("2025-11-10T09:00:00"),
    endTime: new Date("2025-11-10T10:30:00"),
    isJointService: false,
  },
});
```

### Recording Attendance
```typescript
const attendance = await prisma.attendanceRecord.create({
  data: {
    sessionId: session.id,
    userId: memberId,
    checkInMethod: "manual",
    status: "PRESENT",
  },
});
```

## Migration Strategy

The system maintains backward compatibility with:
- `ServiceSession` (legacy)
- `SessionAttendee` (legacy)
- `Attendance` (legacy)

**Migration Path:**
1. New activities use `MasterEvent` + `AttendanceSession`
2. Legacy data continues to work
3. Gradual migration of existing data
4. Eventually deprecate legacy models

## Benefits

1. **Single Logic:** All activities handled identically
2. **Accurate Counting:** Non-duplication built-in
3. **Flexible:** Handles any activity type
4. **Traceable:** Every attendance linked to specific session
5. **Actionable:** Decisions and giving linked to sessions
6. **Scalable:** Works for small groups to mega-churches

## API Endpoints

### Master Events
- `GET /api/master-events` - List all master events
- `POST /api/master-events` - Create master event
- `GET /api/master-events/[id]` - Get master event
- `PATCH /api/master-events/[id]` - Update master event
- `DELETE /api/master-events/[id]` - Delete master event

### Attendance Sessions
- `GET /api/attendance-sessions` - List sessions (with filters)
- `POST /api/attendance-sessions` - Create session
- `GET /api/attendance-sessions/[id]` - Get session with attendees
- `PATCH /api/attendance-sessions/[id]` - Update session
- `DELETE /api/attendance-sessions/[id]` - Delete session

### Attendance Records
- `POST /api/attendance/record` - Record attendance
- `DELETE /api/attendance/record` - Remove attendance
- `GET /api/attendance/session/[sessionId]` - Get session attendance
- `GET /api/attendance/daily` - Get daily attendance (non-duplicated)

## Query Examples

### Get all sessions for a master event
```typescript
const sessions = await prisma.attendanceSession.findMany({
  where: { masterEventId: masterEventId },
  orderBy: { date: "desc" },
  include: {
    attendees: {
      include: { user: true },
    },
  },
});
```

### Get daily unique attendance
```typescript
const uniqueAttendees = await prisma.attendanceRecord.findMany({
  where: {
    session: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  },
  select: { userId: true },
  distinct: ["userId"],
});
```

### Get decisions from a session
```typescript
const decisions = await prisma.decision.findMany({
  where: { linkedSessionId: sessionId },
  include: {
    proposedBy: true,
  },
});
```

