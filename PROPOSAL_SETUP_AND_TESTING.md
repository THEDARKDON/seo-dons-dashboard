# Proposal Generation Setup & Testing Guide

Complete guide to set up Supabase storage, test the proposal generation system, and integrate it into customer pages.

---

## Part 1: Supabase Storage Setup (Required - 5 minutes)

### Step 1: Create Storage Bucket

1. **Login to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - You'll see your existing buckets (if any)

3. **Create New Bucket**
   - Click "New bucket" button (top right)
   - Fill in:
     - **Name:** `proposals` (exactly this - case sensitive!)
     - **Public bucket:** ✅ **CHECK THIS BOX** (this allows PDFs to be downloaded)
   - Click "Create bucket"

### Step 2: Configure Storage Policies

The bucket needs RLS policies to allow uploads and downloads:

1. **Click on the `proposals` bucket**
2. **Go to "Policies" tab**
3. **Click "New Policy"**

#### Policy 1: Allow Authenticated Uploads

```sql
CREATE POLICY "Authenticated users can upload proposals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proposals');
```

- Click "Review" → "Save policy"

#### Policy 2: Allow Public Downloads

```sql
CREATE POLICY "Public can read proposals"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'proposals');
```

- Click "Review" → "Save policy"

#### Policy 3: Allow Authenticated Deletes (Optional)

```sql
CREATE POLICY "Authenticated users can delete proposals"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'proposals');
```

- Click "Review" → "Save policy"

### Step 3: Verify Storage is Working

Go back to Storage → proposals bucket → Should see "Files" tab
- You should now be able to upload/view files
- **Storage is ready!**

---

## Part 2: Testing the Proposal Generator (10-15 minutes)

### Test Page Access

Once deployed to Vercel (which happens automatically via GitHub), you can test at:

**https://www.seodonscrm.co.uk/dashboard/test-proposal**

### What You'll See

1. **Customer Selector**
   - Dropdown with your first 20 customers
   - Shows company name, website, and industry

2. **Package Tier Selection**
   - **Local** (£2,000/mo) - For local businesses
   - **Regional** (£3,000/mo) - For regional coverage
   - **National** (£5,000/mo) - For national campaigns

3. **Generate Button**
   - Click to start generation

### Testing Process

1. **Select a Customer**
   - Choose any customer from the dropdown
   - Make sure they have a `company_name` and ideally a `website`
   - **Good test customer:** A1 Mobility (if you have it in your database)

2. **Select Package Tier**
   - Start with "Local" for fastest/cheapest testing

3. **Click "Generate Proposal"**
   - Progress bar will appear
   - You'll see real-time stage updates:
     - "Starting proposal generation" (0%)
     - "Analyzing company" (5%)
     - "Researching market intelligence" (25%)
     - "Analyzing competitors" (40%)
     - "Researching keywords" (55%)
     - "Generating content" (60%)
     - "Generating PDF" (95%)
     - "Complete!" (100%)

4. **Expected Timeline**
   - **Local package:** ~90 seconds
   - **Regional package:** ~110 seconds
   - **National package:** ~130 seconds

5. **Success Result**
   - Green success box will appear with:
     - Proposal Number (e.g., "P-2025-0001")
     - Duration (e.g., "92s")
     - Cost (e.g., "£0.7843")
     - Total Tokens (e.g., "45,234")
   - **"Download PDF" button** - Click to download and review

### What to Check in the PDF

Open the downloaded PDF and verify:

- ✅ Cover page with customer's company name
- ✅ Executive summary with specific insights about their business
- ✅ SWOT analysis with real data
- ✅ Recommended SEO strategy
- ✅ Technical SEO priorities
- ✅ Content strategy with pillars and topics
- ✅ Local SEO section (for local/regional packages)
- ✅ Link building strategy
- ✅ All 3 package options (Local, Regional, National)
- ✅ ROI projections with 6-month and 12-month forecasts
- ✅ Professional layout and branding
- ✅ Page numbers and headers

### Expected Results

**First Generation:**
- Proposal Number: `P-2025-0001`
- Duration: 90-130 seconds
- Cost: £0.75-£1.25
- Tokens: ~40,000-50,000
- PDF: Professional 18-page proposal

**Subsequent Generations:**
- Proposal numbers increment: P-2025-0002, P-2025-0003, etc.

---

## Part 3: Troubleshooting

### Error: "Failed to upload PDF"

**Cause:** Storage bucket not set up correctly

**Fix:**
1. Check that bucket name is exactly `proposals` (lowercase)
2. Verify bucket is set to "Public"
3. Check RLS policies are created correctly
4. Try uploading a test file manually to the bucket in Supabase dashboard

### Error: "Customer not found"

**Cause:** Invalid customer ID

**Fix:**
1. Go to Supabase → Table Editor → `customers` table
2. Make sure you have customers in the database
3. Verify the customer has a `company_name`

### Error: "Invalid request to Claude API"

**Cause:** API key issue or temperature setting

**Fix:**
- This should not happen if you followed the setup
- Check `.env.local` has `ANTHROPIC_API_KEY`
- Verify the key starts with `sk-ant-api03-`

### Slow Generation or Timeout

**Cause:** Vercel timeout (shouldn't happen with our setup)

**Fix:**
- We're using SSE streaming to avoid timeouts
- Max duration is set to 300 seconds (5 minutes)
- If it still times out, check Vercel logs

### PDF Not Downloading

**Cause:** Browser popup blocker or storage URL issue

**Fix:**
1. Allow popups from seodonscrm.co.uk
2. Check browser console for errors
3. Verify the PDF URL in the success message
4. Try copying the URL and opening in a new tab

---

## Part 4: Integrate into Customer Pages

Now that testing works, let's add the "Generate Proposal" button to customer detail pages.

### Where to Add the Button

The button should appear on:
- **Customer Detail Page:** `/dashboard/customers/[id]`
- Located in the page header or actions section

### Features Needed

1. **"Generate Proposal" Button**
   - Visible on customer detail pages
   - Opens a dialog/modal

2. **Proposal Generation Dialog**
   - Package tier selector (Local/Regional/National)
   - Estimated cost display (~£1)
   - Progress bar with real-time updates
   - Success message with download button

3. **Proposals List on Customer Page**
   - Show all proposals generated for this customer
   - Display: proposal number, date, package tier, status
   - Download button for each proposal

### Implementation Plan

I can help you build these components in the next session:

1. Create `components/proposals/generate-proposal-button.tsx`
2. Create `components/proposals/proposal-generation-dialog.tsx`
3. Create `components/proposals/proposals-list.tsx`
4. Integrate into customer detail page ([app/dashboard/customers/[id]/page.tsx](app/dashboard/customers/[id]/page.tsx))

**Estimated time:** 2-3 hours

---

## Part 5: Database Queries for Proposals

### View All Proposals

```sql
SELECT
  p.proposal_number,
  p.company_name,
  p.package_tier,
  p.status,
  p.pdf_url,
  p.total_tokens,
  p.estimated_cost,
  p.generation_duration,
  p.created_at,
  c.company_name as customer_company
FROM proposals p
LEFT JOIN customers c ON c.id = p.customer_id
ORDER BY p.created_at DESC;
```

### View Proposals for a Specific Customer

```sql
SELECT
  proposal_number,
  package_tier,
  status,
  pdf_url,
  estimated_cost,
  created_at
FROM proposals
WHERE customer_id = 'YOUR_CUSTOMER_UUID_HERE'
ORDER BY created_at DESC;
```

### View Proposal Activities (Audit Log)

```sql
SELECT
  pa.activity_type,
  pa.description,
  pa.created_at,
  p.proposal_number
FROM proposal_activities pa
JOIN proposals p ON p.id = pa.proposal_id
WHERE p.proposal_number = 'P-2025-0001'
ORDER BY pa.created_at DESC;
```

### Calculate Total Proposal Costs

```sql
SELECT
  COUNT(*) as total_proposals,
  SUM(estimated_cost) as total_cost_gbp,
  AVG(estimated_cost) as avg_cost_per_proposal,
  AVG(generation_duration) as avg_duration_seconds
FROM proposals
WHERE status = 'ready';
```

---

## Part 6: Cost Monitoring

### Expected Costs

**Per Proposal:**
- Local: £0.60-£0.90
- Regional: £0.80-£1.20
- National: £1.00-£1.50

**Monthly (if generating 100 proposals):**
- Budget: ~£75-£125/month
- Claude Opus 4 costs only

### Token Usage Breakdown

**Average proposal (~45,000 tokens):**
- Input tokens: ~35,000 (system prompt + research data)
- Output tokens: ~8,000 (research + content)
- Thinking tokens: ~2,000 (extended thinking)

### Monitor Usage

1. **In Application:**
   - Each proposal shows exact cost in metadata
   - Check proposals table: `SELECT SUM(estimated_cost) FROM proposals;`

2. **In Anthropic Dashboard:**
   - Visit: https://console.anthropic.com
   - Go to "Usage" → View detailed usage and costs

---

## Summary Checklist

Before going live:

- [ ] ✅ Supabase storage bucket `proposals` created
- [ ] ✅ Storage policies configured (upload + download)
- [ ] ✅ Test page works: https://www.seodonscrm.co.uk/dashboard/test-proposal
- [ ] ✅ Successfully generated at least one test proposal
- [ ] ✅ Downloaded and reviewed PDF quality
- [ ] ✅ Verified proposal appears in database
- [ ] ⏳ Add "Generate Proposal" button to customer pages (next step)
- [ ] ⏳ Train SDRs on how to use the feature
- [ ] ⏳ Set up cost monitoring and alerts

---

## Next Steps

Once testing is complete and storage is working:

1. **Integrate into Customer Pages**
   - Add generate button
   - Show proposals list
   - Enable downloading from customer page

2. **Optional Enhancements**
   - Email proposal directly to customer
   - Preview proposal before generating
   - Edit contact name/customizations
   - Regenerate proposals
   - Export usage reports

Let me know when you're ready to proceed with customer page integration!
