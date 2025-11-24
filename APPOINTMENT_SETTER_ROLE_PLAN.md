# Appointment Setter Role - Implementation Plan

## Overview
A specialized "Appointment Setter" role that can book appointments for other users (SDRs/BDRs) with notification system and visual indicators.

---

## Core Features

### 1. New Role: `appointment_setter`

**Permissions:**
- ✅ Can view all users in the system
- ✅ Can create appointments for ANY user
- ✅ Can view appointments they've created
- ✅ Can edit/cancel appointments they've created
- ✅ Can see appointment statistics (booked today, this week, this month)
- ❌ Cannot make calls
- ❌ Cannot access deals/pipeline
- ❌ Limited access to leads (view only for appointment context)

---

## Database Changes

### Update `users` Table
Add new role value:
```sql
-- Add appointment_setter to role enum (if using enum)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'appointment_setter';

-- Or update check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'manager', 'bdr', 'sdr', 'appointment_setter'));
```

### Update `appointments` Table
Already has:
- `created_by` - UUID of who created the appointment
- `user_id` - UUID of who the appointment is FOR

Perfect! No changes needed.

### Create `appointment_notifications` Table
```sql
CREATE TABLE appointment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('new_appointment', 'appointment_reminder', 'appointment_updated', 'appointment_cancelled')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id, user_id, notification_type)
);

CREATE INDEX idx_appointment_notifications_user ON appointment_notifications(user_id, is_read);
CREATE INDEX idx_appointment_notifications_created ON appointment_notifications(created_at DESC);
```

---

## UI Changes

### 1. Navigation Badge - Unread Appointment Count

**Location:** Sidebar navigation next to "Appointments" link

**Display:**
```tsx
<Link href="/dashboard/appointments">
  <div className="flex items-center justify-between">
    <span>Appointments</span>
    {unreadCount > 0 && (
      <Badge className="bg-red-500 text-white">
        {unreadCount}
      </Badge>
    )}
  </div>
</Link>
```

**API Endpoint:** `GET /api/appointments/unread-count`
- Returns: `{ count: number }`
- Cached for 30 seconds
- Realtime updates via Supabase subscriptions

### 2. Appointments Page - For Regular Users

**Features:**
- Show "New Appointments" section at top if there are unread
- Highlight new appointments with colored border
- "Mark as Read" button
- Show who created each appointment
- Filter: My Appointments / Created by Me

**Example:**
```
┌─────────────────────────────────────────┐
│ 🔴 NEW APPOINTMENTS (3)                  │
├─────────────────────────────────────────┤
│ Meeting with ABC Corp                    │
│ Tomorrow at 2:00 PM                      │
│ Booked by: Sarah (Appointment Setter)   │
│ [Mark as Read] [View Details]           │
└─────────────────────────────────────────┘
```

### 3. Appointments Page - For Appointment Setters

**Specialized View:**
- **Dropdown:** "Book For:" (select user)
- **Statistics Card:**
  - Appointments booked today
  - Appointments booked this week
  - Appointments booked this month
  - Top SDR/BDR (most appointments set for)
- **Quick Book Button** → Opens modal with user selector
- **History:** All appointments they've created
- **Upcoming:** All appointments scheduled for next 7 days

**Example Stats:**
```
┌─────────────────────────┐
│ YOUR STATS              │
├─────────────────────────┤
│ Today:      12 appts    │
│ This Week:  48 appts    │
│ This Month: 156 appts   │
│                         │
│ Top SDR: John (42)      │
└─────────────────────────┘
```

### 4. New Appointment Form - Enhanced

**For Appointment Setters:**
- First field: **"Booking For"** (required dropdown)
  - Shows all active SDRs/BDRs
  - Shows user's photo and name
  - Search/filter functionality
- Checkbox: "Notify user immediately"
- Checkbox: "Send calendar invite"

**For Regular Users:**
- "Booking For" is hidden (defaults to self)
- Otherwise same form

---

## Notification System

### Notification Types

1. **New Appointment Created**
   - Trigger: When appointment setter books for someone
   - Recipient: The user the appointment is for
   - Message: "Sarah booked a new appointment for you with ABC Corp on May 15 at 2:00 PM"

2. **Appointment Reminder** (24 hours before)
   - Trigger: Scheduled job runs daily
   - Recipient: User who has the appointment
   - Message: "Reminder: You have an appointment with ABC Corp tomorrow at 2:00 PM"

3. **Appointment Reminder** (1 hour before)
   - Trigger: Scheduled job runs hourly
   - Recipient: User who has the appointment
   - Message: "Your appointment with ABC Corp starts in 1 hour"

4. **Appointment Updated**
   - Trigger: Appointment time/details changed
   - Recipient: User who has the appointment
   - Message: "Your appointment with ABC Corp has been rescheduled to May 16 at 3:00 PM"

5. **Appointment Cancelled**
   - Trigger: Appointment cancelled
   - Recipient: User who has the appointment
   - Message: "Your appointment with ABC Corp on May 15 at 2:00 PM has been cancelled"

### Notification Triggers (Database Triggers)

```sql
-- Trigger: New appointment created
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if created by someone else (appointment setter)
  IF NEW.created_by IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO appointment_notifications (
      appointment_id,
      user_id,
      notification_type
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'new_appointment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();
```

---

## API Endpoints

### 1. `GET /api/appointments/unread-count`
Returns unread notification count for current user.

### 2. `POST /api/appointments/mark-read`
Marks specific appointment notifications as read.

### 3. `GET /api/appointments/notifications`
Get all notifications for current user (paginated).

### 4. `GET /api/appointments/setter-stats`
Get statistics for appointment setters (booked today, week, month).

### 5. `POST /api/appointments` (Enhanced)
Enhanced to support `userId` parameter for appointment setters.

---

## Scheduled Jobs (Cron/Background)

### Daily Job - 24 Hour Reminders
```typescript
// Run daily at 9 AM
// Check for appointments scheduled for tomorrow
// Create reminder notifications
```

### Hourly Job - 1 Hour Reminders
```typescript
// Run every hour
// Check for appointments in next hour
// Create reminder notifications
```

**Implementation:** Use Vercel Cron Jobs or Supabase Edge Functions with pg_cron

---

## Role-Based Access Control (RLS Policies)

### Appointments Table

**SELECT Policy:**
```sql
-- Appointment setters can see appointments they created
-- Regular users can see their own appointments
CREATE POLICY "Users can view relevant appointments" ON appointments
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    created_by = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

**INSERT Policy:**
```sql
-- Appointment setters can create for anyone
-- Regular users can create for themselves
CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('appointment_setter', 'admin') OR
    user_id = auth.uid()
  );
```

**UPDATE/DELETE Policy:**
```sql
-- Can only update appointments you created or your own
CREATE POLICY "Users can update their appointments" ON appointments
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

## UI Components to Create

### 1. `AppointmentNotificationBadge.tsx`
- Shows red number badge with unread count
- Real-time updates via Supabase subscriptions

### 2. `NewAppointmentAlert.tsx`
- Banner shown at top of appointments page
- Lists unread appointments
- "Mark All as Read" button

### 3. `AppointmentSetterStats.tsx`
- Statistics card for appointment setters
- Shows daily/weekly/monthly counts
- Top SDR/BDR leaderboard

### 4. `BookForSelector.tsx`
- User dropdown for appointment setters
- Searchable, with avatars
- Shows user role and status

### 5. `AppointmentNotificationList.tsx`
- Dropdown or sidebar panel
- Shows recent notifications
- Click to view appointment

---

## Implementation Phases

### Phase 1: Database & Backend (Week 1)
- [ ] Add `appointment_setter` role
- [ ] Create `appointment_notifications` table
- [ ] Add database triggers
- [ ] Create API endpoints
- [ ] Add RLS policies
- [ ] Test with SQL scripts

### Phase 2: Basic UI (Week 2)
- [ ] Add notification badge to sidebar
- [ ] Enhance appointment form for setters
- [ ] Create setter statistics page
- [ ] Add "Book For" dropdown
- [ ] Test role permissions

### Phase 3: Notifications & Alerts (Week 3)
- [ ] Implement notification list component
- [ ] Add real-time updates (Supabase subscriptions)
- [ ] Create notification alert banners
- [ ] Add "Mark as Read" functionality
- [ ] Test notification flow

### Phase 4: Reminders & Polish (Week 4)
- [ ] Implement 24-hour reminder job
- [ ] Implement 1-hour reminder job
- [ ] Add email notifications (optional)
- [ ] Add SMS notifications (optional)
- [ ] Final testing and bug fixes

---

## Testing Checklist

### Appointment Setter Role
- [ ] Can create appointments for other users
- [ ] Cannot access restricted pages (deals, pipeline)
- [ ] Can view appointment statistics
- [ ] Can see all users in dropdown

### Notifications
- [ ] User receives notification when appointment is booked for them
- [ ] Red badge appears on sidebar
- [ ] Badge count updates in real-time
- [ ] Clicking notification marks as read
- [ ] Badge disappears when all read

### Reminders
- [ ] 24-hour reminder sent day before
- [ ] 1-hour reminder sent hour before
- [ ] No duplicate reminders
- [ ] Reminders for correct timezone

### Permissions
- [ ] Regular users can only book for themselves
- [ ] Appointment setters can book for anyone
- [ ] Users can only see their own appointments
- [ ] Appointment setters can see appointments they created

---

## Optional Enhancements

### Advanced Features
- Calendar view for appointment setters
- Drag-and-drop appointment rescheduling
- Appointment templates (common meeting types)
- Auto-assign appointments based on availability
- Integration with Google Calendar for availability checking
- SMS confirmation to leads when appointment is booked
- Performance leaderboard for appointment setters

### Gamification
- Points for appointments set
- Badges for milestones (100 appointments, etc.)
- Weekly leaderboard
- Bonus points for appointments that convert to deals

---

## Security Considerations

1. **Role Verification:** Always verify role on backend, never trust frontend
2. **Input Validation:** Validate user_id exists and is active before creating appointment
3. **Rate Limiting:** Limit appointment creation to prevent spam
4. **Audit Log:** Log all appointment creations with who created them
5. **Data Privacy:** Appointment setters should not see sensitive lead data

---

## Metrics to Track

1. **Appointment Setter Performance:**
   - Appointments booked per day/week/month
   - Appointment show-up rate
   - Appointments that convert to deals
   - Average time to book appointment

2. **SDR/BDR Performance:**
   - Appointments attended
   - Appointments no-show
   - Appointments converted to deals
   - Response time to appointment notifications

3. **System Health:**
   - Notification delivery rate
   - Reminder delivery rate
   - Average notification read time
   - Peak booking times

---

**Status:** Planning Phase
**Priority:** Medium
**Estimated Effort:** 4 weeks
**Dependencies:** None
