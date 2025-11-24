# Auto-Send SMS/Email Toggle Feature

## Summary

Added separate toggle controls to the Auto-Send page to quickly enable/disable all SMS or Email auto-send messages independently.

## Changes Made

### Updated: `app/dashboard/auto-send/page.tsx`

#### New Features

1. **SMS Global Toggle**
   - Added toggle switch in the SMS card header
   - Shows "Enabled" or "Disabled" status
   - One-click to turn on/off all SMS auto-send templates
   - Warning message displayed when disabled

2. **Email Global Toggle**
   - Added toggle switch in the Email card header
   - Shows "Enabled" or "Disabled" status
   - One-click to turn on/off all Email auto-send templates
   - Warning message displayed when disabled

3. **Smart State Management**
   - Automatically detects if any templates are active on load
   - Updates all templates simultaneously when toggled
   - Disables individual template toggles when global toggle is off
   - Shows visual feedback during updates

#### New Functions

- `toggleAllSMS(enabled: boolean)` - Enables/disables all SMS auto-send templates
- `toggleAllEmails(enabled: boolean)` - Enables/disables all Email auto-send templates

#### UI Improvements

- Toggle switches positioned in card headers for easy access
- Warning banners when auto-send is disabled
- Loading state during bulk updates
- Updated info card with instructions for new toggles

## Usage

### To Disable All Auto SMS:

1. Navigate to `/dashboard/auto-send`
2. Locate the "SMS Auto-Send Templates" card
3. Click the toggle switch in the top-right corner to turn it OFF
4. All SMS templates will be immediately disabled

### To Disable All Auto Emails:

1. Navigate to `/dashboard/auto-send`
2. Locate the "Email Auto-Send Templates" card
3. Click the toggle switch in the top-right corner to turn it OFF
4. All Email templates will be immediately disabled

### To Re-enable:

Simply click the toggle switch again to turn it back ON, and all templates will be re-enabled.

## Technical Details

### State Variables
- `smsGlobalEnabled` - Controls SMS auto-send globally
- `emailGlobalEnabled` - Controls Email auto-send globally
- `updating` - Prevents rapid toggle changes during updates

### API Integration
- Uses existing `/api/sms/templates` PATCH endpoint
- Uses existing `/api/email/templates` PATCH endpoint
- Updates multiple templates in parallel with `Promise.all()`

### Database Impact
- Updates `is_active` field in `sms_templates` table
- Updates `is_active` field in `email_templates` table
- Only affects templates where `auto_send_after_call = true`

## Testing Checklist

- [ ] SMS toggle turns off all SMS templates
- [ ] Email toggle turns off all Email templates
- [ ] Individual toggles disabled when global toggle is off
- [ ] Warning messages appear when toggles are off
- [ ] Toggles re-enable templates correctly
- [ ] Loading state appears during updates
- [ ] Page state persists after refresh

## Benefits

1. **Quick Control** - One-click to disable all auto-send messages
2. **Granular Control** - Can disable SMS or Email independently
3. **Clear Feedback** - Visual indicators show current state
4. **No Code Required** - Simple UI toggle instead of SQL scripts
5. **Reversible** - Easy to re-enable if needed
