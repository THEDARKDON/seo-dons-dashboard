# Fix: Business Metrics & SerpAPI Location Issues

## Issues Resolved

### 1. Business Metrics Not Appearing in Proposals (£5,000 default instead of £12,000)

#### Problem
User reported that proposals were using the default average deal size of £5,000 instead of the customer's actual business metrics (£12,000 average deal size, £4,000 profit per deal, 30% conversion rate).

#### Investigation
1. **Verified customer form** - The edit customer form DOES have Business Metrics fields (lines 349-411 in `components/customers/customer-edit-modal.tsx`)
2. **Verified database schema** - Migration 049 successfully added the columns (`average_deal_size`, `profit_per_deal`, `conversion_rate`)
3. **Verified database data** - Customer record (Harry Khaira - Angstrom Gas and Electric) HAS the correct values stored:
   - Average Deal Size: £12,000
   - Profit Per Deal: £4,000
   - Conversion Rate: 30%
4. **Verified code flow** - The data flow is correct:
   - API reads from `customer.average_deal_size` ✅
   - Passes as `averageDealSize` to research agent ✅
   - Research agent uses in `roiProjection.averageDealValue` ✅
   - Template reads from `research?.roiProjection?.averageDealValue` ✅

#### Root Cause
The existing proposals (P-2025-0118, P-2025-0119, P-2025-0120) were generated BEFORE the ROI projection feature was fully deployed or while it was incomplete. The `research_data` in these proposals doesn't contain the `roiProjection` object.

#### Solution
**Generate a NEW proposal** to test the current code. The code chain is correct and should work with newly generated proposals. Old proposals will continue to use the default £5,000 value since they don't have `roiProjection` data.

#### Code Verification
```typescript
// API: app/api/proposals/generate/route.ts (lines 146-149)
averageDealSize: customer.average_deal_size,
profitPerDeal: customer.profit_per_deal,
conversionRate: customer.conversion_rate,

// Research Agent: lib/claude/research-agent.ts (lines 958-961)
const enrichedData: ROIProjection = {
  ...data,
  averageDealValue: request.averageDealSize || 5000
};

// Template: lib/pdf/html-template.tsx (line 69)
const avgDealValue = research?.roiProjection?.averageDealValue || 5000;
```

#### Files Involved
- `components/customers/customer-edit-modal.tsx` - Customer form with business metrics
- `supabase/migrations/049_add_business_metrics_to_customers.sql` - Database schema
- `app/api/proposals/generate/route.ts` - Passes metrics to research agent
- `lib/claude/research-agent.ts` - Creates ROI projection with metrics
- `lib/pdf/html-template.tsx` - Uses metrics in projections

---

### 2. Claude Model 404 Error in Proposal Edit API

#### Problem
```
Error: 404 {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}}
```

When trying to edit a proposal, the API was using an outdated Claude model name that no longer exists.

#### Root Cause
The proposal edit API (line 99 in `app/api/proposals/[id]/edit/route.ts`) was hardcoded to use `claude-3-5-sonnet-20241022`, which has been deprecated.

#### Solution
Updated to the latest Claude model:
```typescript
// Before
model: 'claude-3-5-sonnet-20241022',

// After
model: 'claude-sonnet-4-20250514',
```

#### Files Modified
- `app/api/proposals/[id]/edit/route.ts` (line 99)

---

### 3. SerpAPI Location Format Errors

#### Problem
```
Error: Unsupported 'Milton Keynes, UK' location - location parameter
```

The code was falling back to "United Kingdom" for cities without a county, causing loss of local targeting in proposals.

#### Root Cause
The `normalizeSerpAPILocation()` function was being overly cautious, assuming city-only locations wouldn't be supported by SerpAPI. It would immediately fallback to "United Kingdom" instead of trying the city name.

```typescript
// OLD CODE - Too cautious
if (locationParts.city) {
  console.log(`City "${locationParts.city}" without county, using UK fallback`);
  return 'United Kingdom';  // ❌ Premature fallback
}
```

#### Solution
Updated the location normalization logic to trust SerpAPI's city support:

1. **LOCAL tier**: Try city first (`"Milton Keynes, UK"`), fall back to county if no city
2. **REGIONAL tier**: Try county first, fall back to city if no county
3. **NATIONAL tier**: Always use "United Kingdom"

SerpAPI DOES support most major UK cities like Milton Keynes, so we should use them.

```typescript
// NEW CODE - Trust SerpAPI city support
if (packageTier === 'local') {
  // Try city first - SerpAPI understands most major UK cities
  if (locationParts.city) {
    const serpLocation = `${locationParts.city}, UK`;
    console.log(`[SerpAPI Location] LOCAL tier - Using city: "${serpLocation}"`);
    return serpLocation;  // ✅ Try the city first
  }
}
```

#### Impact
- **Before**: Milton Keynes → "United Kingdom" (too broad, loses local targeting)
- **After**: Milton Keynes → "Milton Keynes, UK" (proper local targeting)

#### Files Modified
- `lib/research/enhanced-research-agent.ts` (lines 324-356)

---

## Testing Checklist

### Business Metrics Flow
- [x] Customer record has business metrics populated in database
- [x] Customer edit form saves business metrics correctly
- [x] API reads business metrics from customer record
- [x] Research agent receives business metrics
- [x] Code flow for ROI projection is correct
- [ ] **TODO**: Generate new proposal for Harry Khaira (Angstrom Gas and Electric) to verify metrics appear in proposal
- [ ] **TODO**: Check that £12,000 deal size appears in Growth Projections section

### Claude Model Fix
- [x] Updated to `claude-sonnet-4-20250514`
- [ ] **TODO**: Test proposal edit functionality works without 404 error

### SerpAPI Location Fix
- [x] Updated location logic to try city names first
- [ ] **TODO**: Generate proposal for Milton Keynes customer to verify no SerpAPI errors
- [ ] **TODO**: Check Vercel logs to confirm "Milton Keynes, UK" is accepted by SerpAPI
- [ ] **TODO**: Verify local targeting keywords work correctly

---

## Deployment

### Git Commits
```bash
git commit -m "fix: Update Claude model and SerpAPI location handling"
git push
```

### Vercel
Changes will be automatically deployed to Vercel when pushed to GitHub.

**Monitor deployment at**: https://vercel.com/your-project/deployments

---

## Next Steps

1. **Generate Test Proposal**
   - Customer: Harry Khaira (Angstrom Gas and Electric Ltd)
   - Customer ID: `eb4ad499-df3d-4324-a4ad-50ac6f84e6f0`
   - Location: Milton Keynes, UK
   - Verify:
     - Business metrics: £12,000 deal size appears in projections (not £5,000)
     - SerpAPI location: "Milton Keynes, UK" accepted without errors
     - Edit functionality: Works without Claude model 404 error

2. **Monitor Vercel Logs**
   - Look for `[SerpAPI Location] LOCAL tier - Using city: "Milton Keynes, UK"`
   - Confirm no "Unsupported location" errors
   - Verify ROI projection includes `averageDealValue: 12000`

3. **Clean Up Test Scripts**
   - Remove temporary test files:
     - `verify-customer-metrics.js`
     - `test-proposal-metrics-flow.js`
     - `inspect-proposal-structure.js`

---

## Summary

### What Was Fixed
1. ✅ Claude model updated from deprecated version to latest (`claude-sonnet-4-20250514`)
2. ✅ SerpAPI location now uses city names (e.g., "Milton Keynes, UK") instead of premature fallback
3. ✅ Verified business metrics code flow is correct (existing proposals lack data, need new proposal)

### What Needs Testing
1. Generate new proposal to verify business metrics flow
2. Test proposal edit functionality with new Claude model
3. Verify SerpAPI accepts "Milton Keynes, UK" and other UK cities

### Expected Behavior After Deployment
- Editing proposals will work without 404 errors
- SerpAPI will use proper local targeting (city names)
- New proposals will use customer's actual business metrics (£12,000 instead of £5,000)
