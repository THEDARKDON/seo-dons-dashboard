# 🔍 CHECK CUSTOMER AOV - Diagnostic Steps

## Issue
Revenue calculations showing £5,000 despite claiming AOV is set to £9,000 in customer record.

**Logs show:**
```
Average Deal Value: £5,000  ← Using default!
```

**But our new logging isn't appearing:**
```
[PROPOSAL API] 💰 Business Metrics from Customer Record:  ← MISSING!
```

---

## ✅ Step 1: Verify Test Endpoint is Live

Visit: **https://www.seodonscrm.co.uk/api/test-aov-fix**

**Expected Response:**
```json
{
  "status": "AOV Fix Deployed",
  "version": "2d0e428",
  "testResults": {
    "conversionWorking": true,
    "loggingEnabled": true
  }
}
```

If this works, the deployment is live ✅

---

## ✅ Step 2: Check Customer Record in Database

Run this SQL in Supabase:

```sql
SELECT
  id,
  company,
  average_deal_size,
  profit_per_deal,
  conversion_rate,
  average_deal_size IS NOT NULL as has_aov,
  updated_at
FROM customers
WHERE company = 'midland-solar.co.uk';
```

**What to look for:**

### Scenario A: AOV is NULL
```
company              | average_deal_size | has_aov
---------------------+-------------------+--------
midland-solar.co.uk  | NULL              | false
```

**This is the problem!** Run the fix:
```sql
UPDATE customers
SET average_deal_size = 9000.00
WHERE company = 'midland-solar.co.uk';
```

### Scenario B: AOV is 0
```
company              | average_deal_size | has_aov
---------------------+-------------------+--------
midland-solar.co.uk  | 0.00              | true
```

**This is also wrong!** The ternary check treats 0 as falsy.
```sql
UPDATE customers
SET average_deal_size = 9000.00
WHERE company = 'midland-solar.co.uk';
```

### Scenario C: AOV is set correctly
```
company              | average_deal_size | has_aov
---------------------+-------------------+--------
midland-solar.co.uk  | 9000.00           | true
```

**If this shows but proposal still uses £5,000:**
- Deployment might not be live yet
- Or cache issue
- Or logs are being filtered

---

## ✅ Step 3: Force a Fresh Proposal Generation

1. Wait 2 minutes for Vercel deployment to complete
2. Hard refresh browser (Ctrl+Shift+R)
3. Generate a NEW proposal (not view old one)
4. Check Vercel logs immediately

**Expected logs (if AOV is set):**
```
[PROPOSAL API] 💰 Business Metrics from Customer Record: {
  average_deal_size: "9000.00",
  average_deal_size_type: "string"
}

[PROPOSAL API] 💰 Business Metrics being passed to generator: {
  averageDealSize: 9000,
  averageDealSize_type: "number"
}

💰 [Revenue Calculation] Deal Value Configuration: {
  providedAverageDealSize: 9000,
  usingDealValue: 9000,
  source: 'Customer Record'
}

💰 Revenue Calculations:
Average Deal Value: £9,000  ← CORRECT!
```

**If logs still show £5,000:**
```
💰 [Revenue Calculation] Deal Value Configuration: {
  providedAverageDealSize: undefined,  ← AOV not set!
  usingDealValue: 5000,
  source: 'Default Fallback'
}
```

This means the database field is NULL.

---

## ✅ Step 4: Check Vercel Deployment Status

Go to: https://vercel.com/your-project/deployments

Look for deployment of commit `2d0e428` (or later).

**Status should be:** ✅ Ready

If still "Building" or "Queued", wait for it to complete.

---

## 🐛 Debugging Tips

### Issue: Logs not appearing

**Possible causes:**
1. **Vercel log filtering** - Some log lines might be hidden in UI
   - Solution: Use `vercel logs --follow` in CLI instead

2. **Deployment still running old code**
   - Solution: Wait 2-3 minutes, check deployment status

3. **Cache issue**
   - Solution: Hard refresh browser, clear Vercel cache

### Issue: AOV set but still using £5,000

**Possible causes:**
1. **Database field is actually NULL** (most likely!)
   - Solution: Run the SQL UPDATE

2. **Field is 0 or empty string**
   - Solution: Run the SQL UPDATE

3. **Wrong customer record being looked up**
   - Solution: Check customer ID in logs matches database

---

## 📝 Quick Checklist

- [ ] Test endpoint returns `"loggingEnabled": true`
- [ ] Database query shows `average_deal_size: 9000.00`
- [ ] Vercel deployment status is "Ready"
- [ ] Generated NEW proposal (not viewing old one)
- [ ] Checked Vercel logs with CLI: `vercel logs --follow`
- [ ] Logs show "Business Metrics from Customer Record"
- [ ] Logs show "Average Deal Value: £9,000"

---

## 🎯 Expected Timeline

1. **Now:** Check test endpoint
2. **+1 min:** Run SQL query to verify/set AOV
3. **+2 min:** Wait for Vercel deployment
4. **+3 min:** Generate new proposal
5. **+4 min:** Check logs for £9,000

---

## 💡 Next Steps

Based on what you find:

### If database has AOV = 9000.00:
✅ Database is correct
❌ Code might not be deployed yet
→ Wait for Vercel, then regenerate

### If database has AOV = NULL:
❌ Database is missing the value
→ Run SQL UPDATE, then regenerate

### If logs still don't show:
❌ Deployment issue or log filtering
→ Use `vercel logs --follow` CLI instead of web UI

---

**Let me know what the SQL query returns!** That will tell us definitively whether the issue is:
1. Database missing AOV (most likely)
2. Deployment not live yet
3. Something else

🚀
