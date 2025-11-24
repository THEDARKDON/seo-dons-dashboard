# Testing Guide - SEO Dons Dashboard

This guide covers how to test the application locally and in production.

## Quick Test Checklist

Use this checklist to verify everything is working:

### Authentication & User Management
- [ ] Sign up with new account works
- [ ] Sign in with existing account works
- [ ] Sign out works
- [ ] User redirected to dashboard after sign in
- [ ] User redirected to sign-in when not authenticated

### Dashboard Home
- [ ] KPI metrics display correctly
- [ ] Total revenue shows current month data
- [ ] Calls today count is accurate
- [ ] Meetings count is accurate
- [ ] Active deals count is accurate
- [ ] Leaderboard displays with real-time data
- [ ] Activity feed shows recent activities
- [ ] Recent deals section displays

### Deals Management
- [ ] Deals list page loads
- [ ] Can create new deal
- [ ] Deal form validation works
- [ ] Deal appears in list after creation
- [ ] Can view deal details
- [ ] Deal detail page shows all information
- [ ] Commission projection calculates correctly
- [ ] Filtering/searching deals works (when implemented)

### Call Logging
- [ ] Calls list page loads
- [ ] Can log new call
- [ ] Call form validation works
- [ ] Call appears in list after logging
- [ ] Calls today counter updates
- [ ] Success rate calculates correctly
- [ ] Call outcomes display with correct badges

### Commissions
- [ ] Commissions page loads
- [ ] Stats cards display correct totals
- [ ] Commission list shows all commissions
- [ ] Commissions created when deal marked "Closed Won"
- [ ] First month commission is 50%
- [ ] Ongoing commission is 10%
- [ ] Commission status badges display correctly

### Leaderboard
- [ ] Leaderboard page loads
- [ ] Rankings display correctly
- [ ] Real-time updates work when deal closed
- [ ] Trophy icons show for top 3
- [ ] Revenue amounts display correctly
- [ ] Deals count displays correctly

### Real-time Features
- [ ] Leaderboard updates when deal closed (no refresh needed)
- [ ] Activity feed updates in real-time
- [ ] Dashboard metrics update appropriately

---

## Detailed Testing Scenarios

### Scenario 1: New User Signup and First Deal

**Objective**: Test complete flow from signup to closing first deal

**Steps**:

1. **Sign Up**
   ```
   1. Go to homepage
   2. Click "Sign up"
   3. Enter email and password
   4. Submit form
   5. Verify redirected to /dashboard
   ```

2. **Add User to Database** (Manual for now)
   ```sql
   INSERT INTO users (clerk_id, email, first_name, last_name, role)
   VALUES ('USER_CLERK_ID', 'test@example.com', 'Test', 'User', 'bdr');
   ```

3. **Create First Deal**
   ```
   1. Click "Deals" in sidebar
   2. Click "New Deal"
   3. Fill form:
      - Deal Name: "Test Company - SEO Package"
      - Deal Value: 5000
      - Stage: "Proposal"
      - Probability: 75
   4. Submit
   5. Verify deal appears in list
   6. Click on deal
   7. Verify commission projection shows:
      - First Month: $2,500
      - Monthly: $500
      - 12-Month Total: $8,000
   ```

4. **Log Calls**
   ```
   1. Click "Calls" in sidebar
   2. Click "Log Call"
   3. Fill form:
      - Subject: "Discovery call"
      - Outcome: "Successful"
      - Duration: 30
      - Notes: "Good fit for our services"
   4. Submit
   5. Verify call appears in list
   6. Verify "Calls Today" counter increased
   ```

5. **Close Deal**
   ```
   1. Go to Supabase SQL Editor
   2. Run:
      UPDATE deals
      SET stage = 'closed_won', actual_close_date = CURRENT_DATE
      WHERE deal_name = 'Test Company - SEO Package';
   3. Go to Commissions page
   4. Verify two commission records created:
      - First Month: $2,500 (50%)
      - Ongoing: $500 (10%)
   5. Go to Leaderboard
   6. Verify your name appears with $5,000 revenue
   ```

**Expected Results**:
- ✅ Deal created successfully
- ✅ Calls logged correctly
- ✅ Commissions auto-created on deal close
- ✅ Leaderboard updated in real-time

---

### Scenario 2: Real-time Leaderboard Updates

**Objective**: Verify real-time updates work without page refresh

**Setup**:
- Create 2 users in Supabase
- Open dashboard in 2 browser windows (one for each user)

**Steps**:

1. **Open Two Dashboards**
   ```
   Window 1: Sign in as User A
   Window 2: Sign in as User B
   ```

2. **View Leaderboard in Both**
   ```
   Both windows: Navigate to /dashboard/leaderboard
   ```

3. **Close Deal for User A**
   ```
   Supabase SQL Editor:
   INSERT INTO deals (assigned_to, deal_name, deal_value, stage, actual_close_date)
   VALUES (
     (SELECT id FROM users WHERE email = 'usera@example.com'),
     'Big Deal',
     20000,
     'closed_won',
     CURRENT_DATE
   );
   ```

4. **Watch Both Windows**
   ```
   Expected: Leaderboard in BOTH windows updates within 1-2 seconds
   User A should jump to #1 with $20,000
   ```

**Expected Results**:
- ✅ Leaderboard updates in real-time (no refresh needed)
- ✅ Both browser windows see the update
- ✅ Rankings recalculate correctly

---

### Scenario 3: Commission Calculation

**Objective**: Verify commission math is correct

**Test Cases**:

| Deal Value | First Month (50%) | Ongoing (10%) | 12-Month Total |
|------------|-------------------|---------------|----------------|
| $1,000     | $500              | $100          | $1,600         |
| $5,000     | $2,500            | $500          | $8,000         |
| $10,000    | $5,000            | $1,000        | $16,000        |
| $25,000    | $12,500           | $2,500        | $40,000        |

**Steps for Each**:

1. Create deal with specific value
2. Mark as "Closed Won"
3. Check commissions table
4. Verify calculations match

**SQL to Verify**:
```sql
SELECT
  deal_value,
  commission_type,
  rate,
  amount,
  (amount / deal_value) as calculated_rate
FROM commissions c
JOIN deals d ON c.deal_id = d.id
WHERE d.deal_name = 'YOUR_TEST_DEAL';
```

**Expected Results**:
- ✅ First month = deal_value * 0.50
- ✅ Ongoing = deal_value * 0.10
- ✅ Amounts are correct to 2 decimal places

---

## Performance Testing

### Load Time Testing

**Metrics to Track**:

| Page | Target Load Time | Acceptable |
|------|------------------|------------|
| Dashboard Home | < 2s | < 3s |
| Deals List | < 1.5s | < 2.5s |
| Call Log | < 1.5s | < 2.5s |
| Leaderboard | < 1s | < 2s |

**How to Test**:

1. Open Chrome DevTools
2. Go to Network tab
3. Enable "Disable cache"
4. Reload page
5. Check "Load" time at bottom

**Optimization if Slow**:
- Check Supabase query performance
- Add database indexes
- Implement caching
- Use React Query for client-side caching

### Real-time Update Latency

**Expected**: < 2 seconds from database change to UI update

**How to Test**:

1. Open browser DevTools → Console
2. Add timestamp logging:
```javascript
console.time('update');
// Make database change
// When UI updates:
console.timeEnd('update');
```

**Acceptable**: < 5 seconds

---

## Database Testing

### Test Data Integrity

**Check Foreign Keys**:
```sql
-- Should return 0 orphaned records
SELECT COUNT(*) FROM deals WHERE customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM customers WHERE id = deals.customer_id);

SELECT COUNT(*) FROM activities WHERE user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users WHERE id = activities.user_id);
```

**Check Commission Trigger**:
```sql
-- Create test deal
INSERT INTO deals (assigned_to, deal_name, deal_value, stage)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'Trigger Test Deal',
  10000,
  'prospecting'
);

-- Close it
UPDATE deals SET stage = 'closed_won', actual_close_date = CURRENT_DATE
WHERE deal_name = 'Trigger Test Deal';

-- Verify commissions created
SELECT * FROM commissions WHERE deal_id = (
  SELECT id FROM deals WHERE deal_name = 'Trigger Test Deal'
);
-- Should return 2 rows: first_month and ongoing
```

### Test Row Level Security

**As BDR User**:
```sql
-- Should only see own deals
SELECT COUNT(*) FROM deals;

-- Try to see another user's deal (should fail or return empty)
SELECT * FROM deals WHERE assigned_to != 'MY_USER_ID';
```

**As Manager**:
```sql
-- Should see all deals
SELECT COUNT(*) FROM deals;
```

---

## Security Testing

### Authentication Tests

- [ ] Cannot access /dashboard without authentication
- [ ] Cannot access API routes without authentication
- [ ] Session expires after timeout
- [ ] Cannot access other users' data (RLS working)

### API Security Tests

**Test Webhook Signature Verification**:

```bash
# Should fail with invalid signature
curl -X POST https://your-app.netlify.app/api/webhook/hubspot \
  -H "Content-Type: application/json" \
  -H "x-hubspot-signature: invalid" \
  -d '{"test": "data"}'

# Expected: 401 Unauthorized
```

---

## Browser Compatibility Testing

Test in these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**What to Check**:
- Layout doesn't break
- All buttons clickable
- Forms submit correctly
- Real-time updates work
- No console errors

---

## Mobile Responsiveness Testing

**Breakpoints to Test**:

- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)

**How to Test**:

1. Chrome DevTools → Toggle device toolbar (Cmd+Shift+M)
2. Test these devices:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

**What to Check**:
- Sidebar collapses/hamburger menu on mobile (not yet implemented)
- Cards stack vertically on mobile
- Tables scroll horizontally on mobile
- Forms are usable on mobile
- Text is readable (not too small)

---

## Automated Testing (Future)

### Unit Tests (Jest)

Create tests in `tests/unit/`:

```typescript
// tests/unit/commission-calculator.test.ts
import { CommissionCalculator } from '@/lib/services/commission-calculator';

describe('CommissionCalculator', () => {
  test('calculates 50% for first month', () => {
    expect(CommissionCalculator.calculateFirstMonth(10000)).toBe(5000);
  });

  test('calculates 10% for ongoing', () => {
    expect(CommissionCalculator.calculateOngoing(10000)).toBe(1000);
  });

  test('projects commission correctly', () => {
    const result = CommissionCalculator.projectCommission(10000, 12);
    expect(result.total).toBe(16000);
  });
});
```

Run with: `npm test`

### E2E Tests (Playwright)

Create tests in `tests/e2e/`:

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads and shows metrics', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Total Revenue')).toBeVisible();
  await expect(page.getByText('Calls Today')).toBeVisible();
});

test('can create a new deal', async ({ page }) => {
  await page.goto('/dashboard/deals/new');
  await page.fill('input[name="deal_name"]', 'Test Deal');
  await page.fill('input[name="deal_value"]', '5000');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard\/deals\/[a-z0-9-]+/);
});
```

Run with: `npm run test:e2e`

---

## Production Smoke Tests

After deployment, run these quick checks:

### 1. Basic Functionality
```
✓ Homepage loads
✓ Can sign up
✓ Can sign in
✓ Dashboard displays
✓ Can create deal
✓ Can log call
✓ Can view commissions
✓ Leaderboard displays
```

### 2. Integration Tests
```
✓ Supabase connection works
✓ Clerk authentication works
✓ Real-time updates work
✓ HubSpot webhook receives events (if configured)
✓ Slack notifications send (if configured)
```

### 3. Error Monitoring
```
✓ Check Netlify function logs
✓ Check Supabase logs
✓ Check browser console for errors
✓ Check Sentry for errors (if configured)
```

---

## Bug Report Template

When you find a bug, use this template:

```markdown
## Bug Report

**Description**: [Brief description of the bug]

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. See error

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**Screenshots**: [If applicable]

**Environment**:
- Browser: [e.g., Chrome 120]
- Device: [e.g., MacBook Pro]
- User Role: [e.g., BDR]

**Console Errors**: [Copy any errors from browser console]

**Additional Context**: [Any other relevant information]
```

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test activities
DELETE FROM activities WHERE description LIKE '%TEST%';

-- Delete test deals
DELETE FROM deals WHERE deal_name LIKE '%Test%';

-- Delete test commissions (will be deleted with deals due to cascade)

-- Delete test users (be careful!)
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com';
```

---

## Continuous Testing

### Before Every Deployment

- [ ] Run `npm run build` successfully
- [ ] Check for TypeScript errors: `npm run lint`
- [ ] Test critical user flows manually
- [ ] Verify environment variables are set
- [ ] Check database migrations applied

### After Every Deployment

- [ ] Run production smoke tests
- [ ] Check error monitoring (Sentry, etc.)
- [ ] Verify real-time updates working
- [ ] Monitor performance metrics
- [ ] Check user feedback

---

## Performance Benchmarks

Track these over time:

| Metric | Current | Target | Date Measured |
|--------|---------|--------|---------------|
| Dashboard Load Time | | < 2s | |
| Deals List Load Time | | < 1.5s | |
| Real-time Update Latency | | < 2s | |
| Database Query Time | | < 100ms | |
| Bundle Size (main) | | < 200KB | |

Update this table monthly to track performance trends.

---

## 🎉 Testing Complete!

Use this guide to ensure your dashboard is rock-solid before launching to users.

**Remember**: Test early, test often, and always test in production (after testing locally first!).

---

Last Updated: 2025-09-30
