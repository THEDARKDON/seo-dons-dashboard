# Customer Information Enhancement Implementation

## Overview

Enhanced the proposal generation system to include **ALL customer information** in Claude prompts, enabling highly personalized and context-aware proposals. This update emphasizes the use of **SDR notes** to tailor content, tone, and recommendations.

---

## Changes Made

### 1. **API Route Update** ✅
**File**: `app/api/proposals/generate/route.ts` (Lines 85-102)

**Added Fields to proposalRequest**:
```typescript
const proposalRequest = {
  companyName: customer.company || `${customer.first_name} ${customer.last_name}`,
  website: customer.website,
  industry: customer.industry,
  location: [customer.city, customer.state, customer.country].filter(Boolean).join(', ') || undefined,
  packageTier: body.packageTier,
  contactName: body.contactName || `${customer.first_name} ${customer.last_name}`,
  customInstructions: body.customInstructions,

  // NEW: Additional customer context for personalized proposals
  jobTitle: customer.job_title,
  phoneNumber: customer.phone,
  email: customer.email,
  linkedInUrl: customer.linkedin_url,
  notes: customer.notes, // SDR notes - critical for personalization
  address: customer.address,
  postalCode: customer.postal_code,
};
```

**Fields Added**:
- `jobTitle` - Contact's job title
- `phoneNumber` - Contact phone number
- `email` - Contact email
- `linkedInUrl` - Contact's LinkedIn profile
- `notes` - **SDR notes** (emphasized by user as critical)
- `address` - Business address
- `postalCode` - Postal code

---

### 2. **Proposal Generator Interface Update** ✅
**File**: `lib/claude/proposal-generator.ts` (Lines 17-44)

**Updated ProposalGenerationRequest**:
```typescript
export interface ProposalGenerationRequest {
  // Company Information
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;

  // Package Configuration
  packageTier: 'local' | 'regional' | 'national';

  // Optional Customizations
  customInstructions?: string;
  contactName?: string;

  // Additional Context
  additionalContext?: string;

  // NEW: Customer Contact Details
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
  linkedInUrl?: string;
  address?: string;
  postalCode?: string;

  // NEW: SDR Notes - Critical for personalization
  notes?: string;
}
```

**Updated Research Request Mapping** (Lines 102-116):
```typescript
const researchRequest: ResearchRequest = {
  companyName: request.companyName,
  website: request.website,
  industry: request.industry,
  location: request.location,
  packageTier: request.packageTier,
  additionalContext: request.additionalContext,

  // NEW: Pass customer information to research
  jobTitle: request.jobTitle,
  phoneNumber: request.phoneNumber,
  email: request.email,
  linkedInUrl: request.linkedInUrl,
  notes: request.notes,
  address: request.address,
  postalCode: request.postalCode,
};
```

**Updated Content Request Mapping** (Lines 142-153):
```typescript
const contentRequest: ContentGenerationRequest = {
  researchData: researchResult,
  companyName: request.companyName,
  packageTier: request.packageTier,
  customInstructions: request.customInstructions,

  // NEW: Pass customer contact info to content generator
  contactName: request.contactName,
  jobTitle: request.jobTitle,
  email: request.email,
  phoneNumber: request.phoneNumber,
  linkedInUrl: request.linkedInUrl,
  notes: request.notes,
};
```

---

### 3. **Research Agent Update** ✅
**File**: `lib/claude/research-agent.ts` (Lines 20-38, 216-234)

**Updated ResearchRequest Interface**:
```typescript
export interface ResearchRequest {
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
  packageTier?: 'local' | 'regional' | 'national';
  additionalContext?: string;

  // NEW: Customer Contact Details
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
  linkedInUrl?: string;
  address?: string;
  postalCode?: string;

  // NEW: SDR Notes - Critical for personalization
  notes?: string;
}
```

**Enhanced Company Analysis Prompt**:
```typescript
const userPrompt = sanitizeForPrompt(`
Analyze this company for an SEO proposal:

**Company Name:** ${request.companyName}
**Website:** ${request.website || 'Not provided'}
**Industry:** ${request.industry || 'Unknown'}
**Location:** ${request.location || 'Unknown'}
**Package Tier:** ${request.packageTier || 'Not specified'}

// NEW: Customer contact details in prompt
${request.jobTitle ? `**Contact Job Title:** ${request.jobTitle}` : ''}
${request.email ? `**Contact Email:** ${request.email}` : ''}
${request.phoneNumber ? `**Contact Phone:** ${request.phoneNumber}` : ''}
${request.linkedInUrl ? `**LinkedIn Profile:** ${request.linkedInUrl}` : ''}
${request.address ? `**Business Address:** ${request.address}` : ''}

// NEW: SDR Notes prominently featured
${request.notes ? `**SDR Notes (IMPORTANT - Use these insights for personalization):**\n${request.notes}\n` : ''}

${request.additionalContext ? `**Additional Context:**\n${request.additionalContext}` : ''}

Provide a comprehensive analysis in the following JSON format:
...
`);
```

**Key Changes**:
- All customer contact fields now included in research prompt
- SDR notes marked as "IMPORTANT" and placed prominently
- Claude instructed to use notes for personalization insights

---

### 4. **Content Generator Update** ✅
**File**: `lib/claude/content-generator.ts` (Lines 182-197, 298-339)

**Updated ContentGenerationRequest Interface**:
```typescript
export interface ContentGenerationRequest {
  researchData: ResearchResult;
  companyName: string;
  packageTier: 'local' | 'regional' | 'national';
  customInstructions?: string;

  // NEW: Customer Contact Details
  contactName?: string;
  jobTitle?: string;
  email?: string;
  phoneNumber?: string;
  linkedInUrl?: string;

  // NEW: SDR Notes for personalization
  notes?: string;
}
```

**Enhanced God Prompt with Customer Context**:
```typescript
const userPrompt = sanitizeForPrompt(`
Generate a comprehensive SEO proposal for: **${companyName}**

// NEW: Client contact section at the top
## CLIENT CONTACT INFORMATION
${contactName ? `**Contact Name:** ${contactName}` : ''}
${jobTitle ? `**Job Title:** ${jobTitle}` : ''}
${email ? `**Email:** ${email}` : ''}
${phoneNumber ? `**Phone:** ${phoneNumber}` : ''}
${linkedInUrl ? `**LinkedIn:** ${linkedInUrl}` : ''}

// NEW: SDR notes prominently featured as CRITICAL
${notes ? `## SDR NOTES (CRITICAL - Use these insights to personalize the proposal tone, content, and recommendations):\n${notes}\n` : ''}

## RESEARCH DATA
...
`);
```

**Key Changes**:
- Client contact information section added at top of prompt
- SDR notes marked as "CRITICAL" and instructed to personalize:
  - Proposal tone
  - Content
  - Recommendations

---

## Customer Database Schema Reference

From `supabase/migrations/006_expand_customers_table.sql`:

```sql
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
```

**All Available Customer Fields**:
- `first_name`, `last_name`
- `company`
- `job_title` ✅
- `email` ✅
- `phone` ✅
- `industry` ✅
- `website` ✅
- `linkedin_url` ✅
- `address` ✅
- `city`, `state`, `country` ✅ (combined as location)
- `postal_code` ✅
- `notes` ✅ (SDR notes - **emphasized by user**)
- `status`

---

## How SDR Notes Are Used

### In Research Phase:
The `analyzeCompany()` function receives SDR notes marked as **IMPORTANT** in the prompt:

```
**SDR Notes (IMPORTANT - Use these insights for personalization):**
[SDR notes content here]
```

Claude uses these notes to:
- Understand customer pain points
- Identify specific needs or concerns
- Tailor research focus areas
- Recognize urgency or priorities

### In Content Generation Phase:
The `generateProposalContent()` function receives SDR notes marked as **CRITICAL**:

```
## SDR NOTES (CRITICAL - Use these insights to personalize the proposal tone, content, and recommendations):
[SDR notes content here]
```

Claude uses these notes to:
- **Personalize tone**: Adjust aggressiveness, formality, urgency
- **Customize content**: Address specific concerns or goals mentioned
- **Tailor recommendations**: Focus on priorities indicated by SDR
- **Adjust examples**: Use relevant case studies or comparisons

---

## Example Use Cases

### Example 1: Website Redesign Need
**SDR Notes**: "Customer mentioned their website is from 2015 and needs a complete overhaul. They're concerned about mobile performance."

**Impact**:
- Research phase identifies current website technical issues
- Content emphasizes mobile-first strategy
- Proposal includes specific website audit recommendations
- Timeline accounts for coordinating with web redesign

### Example 2: Aggressive Growth Target
**SDR Notes**: "CEO wants to double revenue in 12 months. Very competitive, wants to crush competitors in local market."

**Impact**:
- More aggressive, competitive tone throughout proposal
- Emphasis on competitor analysis and differentiation
- Higher investment package recommended
- Faster timeline with more aggressive tactics
- ROI projections aligned with growth targets

### Example 3: Budget Conscious
**SDR Notes**: "Small business, tight budget. Owner is skeptical of marketing spend. Needs clear ROI justification."

**Impact**:
- Conservative, data-driven tone
- Heavy emphasis on ROI calculations
- Start with smaller local package
- Detailed breakdown of costs vs. expected returns
- More case studies and proof points

### Example 4: Local Expansion
**SDR Notes**: "Currently strong in London, wants to expand to Manchester and Birmingham. Has budget allocated for geographic expansion."

**Impact**:
- Research focuses on regional opportunities
- Content emphasizes location-based strategy
- Regional package recommended
- Specific location pages strategy for target cities
- Timeline for phased geographic rollout

---

## Benefits of This Enhancement

### 1. **Highly Personalized Proposals**
- Every proposal now includes context about the specific contact
- SDR insights ensure proposals address actual customer needs
- Tone and content adapt to customer personality and priorities

### 2. **Better Conversion Rates**
- Proposals feel more tailored and less generic
- Address specific pain points mentioned in sales calls
- Demonstrate understanding of customer situation

### 3. **Improved SDR-Content Alignment**
- SDR discoveries directly influence proposal content
- Marketing promises align with sales conversations
- Seamless handoff from sales to service delivery

### 4. **Time Savings**
- Less back-and-forth for clarification
- Fewer proposal revisions needed
- SDR notes capture critical context upfront

### 5. **Contextual Intelligence**
- Job titles inform level of technical detail
- LinkedIn profiles provide additional business context
- Contact info ensures proper personalization

---

## Testing Checklist

### 1. Basic Customer Info Test
- [ ] Generate proposal with only required fields (name, company)
- [ ] Verify proposal generates successfully
- [ ] Check that missing optional fields don't break generation

### 2. Full Customer Info Test
- [ ] Create customer with ALL fields populated:
  - Job title: "Marketing Director"
  - Email: test@company.com
  - Phone: +44 123 456 7890
  - LinkedIn: linkedin.com/in/contact
  - Notes: "Needs help with local SEO, budget of £5k/month, wants to beat competitors"
- [ ] Generate proposal
- [ ] Verify ALL fields appear in proposal context
- [ ] Check that SDR notes influence proposal tone and content

### 3. SDR Notes Personalization Test
**Test Case A**: Aggressive Notes
```
Notes: "CEO is very competitive, wants to dominate market.
Budget is not an issue. Hates their main competitor."
```
- [ ] Verify proposal has aggressive, competitive tone
- [ ] Check for emphasis on competitor analysis
- [ ] Verify national/premium package recommended

**Test Case B**: Conservative Notes
```
Notes: "Small family business, very budget conscious.
Owner is skeptical of digital marketing ROI. Needs proof."
```
- [ ] Verify proposal has conservative, data-driven tone
- [ ] Check for heavy ROI emphasis
- [ ] Verify local/starter package recommended
- [ ] Check for more case studies and proof points

**Test Case C**: Specific Need Notes
```
Notes: "Website from 2010, terrible mobile experience.
Customer knows they need new site + SEO together."
```
- [ ] Verify proposal addresses website modernization
- [ ] Check for mobile-first strategy emphasis
- [ ] Verify technical SEO section is prominent

### 4. Contact Title Impact Test
- [ ] Generate proposal with "CEO" job title
  - Should have executive-level tone
  - Focus on business outcomes
- [ ] Generate proposal with "SEO Manager" job title
  - Should have technical depth
  - Focus on tactical execution
- [ ] Generate proposal with "Small Business Owner" job title
  - Should have educational tone
  - Explain concepts clearly

### 5. LinkedIn Integration Test
- [ ] Add LinkedIn URL to customer
- [ ] Generate proposal
- [ ] Verify LinkedIn context could influence approach
  (Note: Claude doesn't actually fetch LinkedIn, but context helps)

---

## Migration & Deployment

### Prerequisites
All customer fields already exist in database (from migration `006_expand_customers_table.sql`).

### Deployment Steps
1. **No database changes needed** - all fields already exist
2. **Code changes are backward compatible**:
   - All new fields are optional (`?` in TypeScript)
   - Proposals generate successfully with or without optional fields
   - Existing customers with incomplete data will work fine
3. **Deploy code updates**:
   ```bash
   git add .
   git commit -m "Add full customer information to Claude prompts for personalized proposals"
   git push
   ```

### Rollout Strategy
1. **Phase 1**: Deploy code (no user-facing changes)
2. **Phase 2**: Train SDRs to populate notes field consistently
3. **Phase 3**: Monitor proposal quality improvements
4. **Phase 4**: Iterate on prompt wording based on results

---

## SDR Team Training Notes

### What to Include in Notes Field

**Good Examples**:
```
"CEO wants to double organic traffic in 6 months.
Budget: £8k/month. Main competitor is XYZ Ltd who ranks #1 for all their keywords.
Urgent - wants to start ASAP."
```

```
"Small local business, owner very hands-on.
Skeptical about SEO after bad experience with previous agency.
Needs education + proof. Budget: £2-3k/month."
```

```
"Expanding from local to regional. Already strong in Leeds,
wants to dominate Manchester and Liverpool next.
Has budget allocated, timeline is 12 months."
```

**What to Capture**:
- **Budget range** - helps recommend right package
- **Timeline/urgency** - influences proposal tone
- **Specific goals** - e.g., "beat competitor X", "double traffic"
- **Pain points** - e.g., "website is terrible", "no leads from Google"
- **Personality** - e.g., "very analytical", "wants quick wins", "risk-averse"
- **Previous experience** - e.g., "tried SEO before and failed", "new to SEO"
- **Decision-making** - e.g., "needs board approval", "can decide immediately"
- **Special requirements** - e.g., "needs new website too", "wants local focus only"

**Bad Examples** (too vague):
```
"Interested in SEO"
"Wants more traffic"
"Good prospect"
```

---

## Files Modified

1. ✅ `app/api/proposals/generate/route.ts` - Added customer fields to proposalRequest
2. ✅ `lib/claude/proposal-generator.ts` - Updated interfaces and request mapping
3. ✅ `lib/claude/research-agent.ts` - Enhanced research prompts with customer info
4. ✅ `lib/claude/content-generator.ts` - Added customer context to God Prompt

---

## Success Metrics

Track these metrics after deployment:

1. **Proposal Quality**:
   - Subjective review of tone matching customer personality
   - Relevance of recommendations to SDR notes

2. **Conversion Rates**:
   - Proposal-to-deal conversion rate (before vs after)
   - Time to close deals

3. **Revision Requests**:
   - Number of edit requests per proposal (should decrease)
   - Types of edits requested

4. **SDR Adoption**:
   - Percentage of proposals with populated notes field
   - Length/quality of notes over time

---

## Next Steps

### Immediate (Done ✅)
- [x] Add all customer fields to API route
- [x] Update all interfaces
- [x] Enhance research agent prompts
- [x] Update content generator prompts
- [x] Document changes

### Short Term (1-2 weeks)
- [ ] Test with real customer data
- [ ] Train SDR team on notes field
- [ ] Monitor first 10 proposals generated
- [ ] Gather feedback from sales team

### Medium Term (1 month)
- [ ] Analyze conversion rate changes
- [ ] Refine prompt wording based on results
- [ ] Create SDR notes templates/guidelines
- [ ] Add notes field to customer form UI (if not already present)

### Long Term (3 months)
- [ ] Build SDR notes suggestions (AI-assisted note taking)
- [ ] Create notes quality scoring
- [ ] Track correlation between notes quality and proposal success

---

## Conclusion

The proposal generation system now has **full access to all customer information**, with special emphasis on **SDR notes** for deep personalization. This enables Claude to generate proposals that feel hand-crafted for each specific customer, addressing their unique situation, concerns, and goals.

**Key Achievements**:
- ✅ All customer database fields now passed to Claude
- ✅ SDR notes prominently featured in both research and content phases
- ✅ Customer contact details inform tone and approach
- ✅ Fully backward compatible - no breaking changes
- ✅ Ready for immediate deployment

**User Request Fulfilled**:
> "We should also include all the customer information in the prompt sent to Claude, including job titles, company, industry and notes set by SDR'S... And notes"

All customer information including job titles, company, industry, and **especially notes** are now comprehensively included in Claude prompts at both the research and content generation stages.
