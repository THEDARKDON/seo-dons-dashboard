# Pipeline Stages Update

## Overview
The pipeline stages have been updated globally throughout the application to better reflect the sales process with more granular tracking of lead status.

## New Pipeline Stages

The following stages are now available in the system:

1. **New leads (Call)** (`new_leads_call`) - Initial stage for new leads that need to be called
2. **Called, No Answer** (`called_no_answer`) - Lead was called but didn't answer
3. **Called, More Action Needed** (`called_more_action`) - Lead was contacted and requires follow-up
4. **Meeting Booked** (`meeting_booked`) - A meeting has been scheduled with the lead
5. **Meeting Rescheduled** (`meeting_rescheduled`) - The meeting was rescheduled
6. **Meeting Cancelled** (`meeting_cancelled`) - The meeting was cancelled
7. **Proposal Sent** (`proposal_sent`) - A proposal has been sent to the lead
8. **FUP Call Booked** (`fup_call_booked`) - Follow-up call has been scheduled
9. **Closed Won** (`closed_won`) - Deal successfully closed
10. **Closed Lost** (`closed_lost`) - Deal lost
11. **Dead Lead** (`dead_lead`) - Lead is no longer viable

## Migration from Old Stages

### Old to New Stage Mapping
- `prospecting` → `new_leads_call`
- `qualification` → `called_more_action`
- `proposal` → `proposal_sent`
- `negotiation` → `fup_call_booked`
- `closed_won` → `closed_won` (unchanged)
- `closed_lost` → `closed_lost` (unchanged)

### Running the Migration

1. **Backup your data** before running any migration scripts
2. Run the migration script located at `scripts/migrate-deal-stages.sql` in your Supabase SQL editor
3. This script will:
   - Create a backup of the current stages
   - Update all existing deals to use the new stage values
   - Provide a verification query to check the results

## Files Updated

### Core Configuration
- `/lib/constants/pipeline-stages.ts` - Centralized stage configuration

### Components Updated
- `/components/pipeline/pipeline-board.tsx` - Main pipeline board
- `/components/deals/deal-create-modal.tsx` - Deal creation modal
- `/components/deals/deal-edit-modal.tsx` - Deal edit modal
- `/components/deals/deal-stage-pipeline.tsx` - Stage pipeline visualization
- `/app/dashboard/deals/new/page.tsx` - New deal page

### Page Updates
- `/app/dashboard/deals/[id]/page.tsx` - Deal detail page
- `/app/dashboard/deals/page.tsx` - Deals list page
- `/app/dashboard/customers/[id]/page.tsx` - Customer detail page
- `/app/dashboard/customers/page.tsx` - Customers list page
- `/app/dashboard/analytics/page.tsx` - Analytics page
- `/app/dashboard/page.tsx` - Main dashboard

### Integration Updates
- `/lib/integrations/hubspot.ts` - HubSpot stage mappings
- `/app/api/webhook/hubspot/route.ts` - HubSpot webhook handler
- `/app/api/dashboard/stats/route.ts` - Dashboard statistics API

## Stage Groups

The stages are organized into logical groups for filtering and analytics:

### Active Stages
Deals in these stages are considered active and count towards pipeline metrics:
- `new_leads_call`
- `called_no_answer`
- `called_more_action`
- `meeting_booked`
- `meeting_rescheduled`
- `proposal_sent`
- `fup_call_booked`

### Closed Stages
- `closed_won`
- `closed_lost`

### Inactive Stages
- `meeting_cancelled`
- `dead_lead`

## HubSpot Integration

The HubSpot integration has been updated to map between HubSpot stages and our new internal stages:

### HubSpot to Internal Mapping
- `prospecting` → `new_leads_call`
- `appointmentscheduled` → `meeting_booked`
- `qualifiedtobuy` → `called_more_action`
- `presentationscheduled` → `proposal_sent`
- `decisionmakerboughtin` → `fup_call_booked`
- `closedwon` → `closed_won`
- `closedlost` → `closed_lost`

## Testing Checklist

After implementing these changes, verify:

- [ ] Pipeline board displays all new stages correctly
- [ ] Drag and drop between stages works
- [ ] Deal creation uses new stages
- [ ] Deal editing shows correct stages
- [ ] Analytics correctly filters active/closed deals
- [ ] Dashboard metrics calculate correctly
- [ ] HubSpot sync works with new stages
- [ ] Existing deals have been migrated to new stages

## Rollback Instructions

If you need to rollback the changes:

1. Run the rollback SQL (only if you created the backup column):
   ```sql
   UPDATE deals SET stage = stage_backup WHERE stage_backup IS NOT NULL;
   ALTER TABLE deals DROP COLUMN stage_backup;
   ```

2. Revert the code changes using git

## Future Improvements

Consider implementing:
- Stage transition rules (which stages can move to which)
- Automatic stage updates based on actions (e.g., booking a meeting automatically moves to "Meeting Booked")
- Stage-specific required fields
- Stage duration tracking
- Conversion rate analytics between stages