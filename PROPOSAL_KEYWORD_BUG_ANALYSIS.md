# 🐛 PROPOSAL GENERATOR - KEYWORD BUG ANALYSIS

## ❌ THE PROBLEM

### Example: midland-solar.co.uk Proposal

**Expected Keywords:**
- "solar panel installation UK"
- "solar panel installers midlands"
- "solar pv installation"
- "solar energy systems"

**Actual Keywords Generated:**
- "certified installation with a focus on quality, reliability, and customer service. They may highlight bespoke system design tailored to customer needs, compliance with UK standards, and ongoing support post-installation. Their local Midlands focus could also be a unique selling point, offering regional expertise and service."

**Numbers:**
- Expected: ~50 monthly traffic
- Actual: 150,200 monthly traffic (massively inflated)

---

## 🔍 ROOT CAUSE ANALYSIS

### Issue 1: Verbose Services Extracted as Industry Name

#### The Flow:
1. **Line 1071:** `analyzeWebsiteWithPerplexity()` is called
2. **Line 240:** Returns `mainServices: extractServices(analysis)`
3. **Line 684-698:** `extractServices()` function runs
4. **Line 1077:** First service becomes `extractedIndustry`
5. **Line 1088:** This industry is passed to `generateTargetKeywords()`

#### The Bug in `extractServices()`:

**File:** `lib/research/enhanced-research-agent.ts:684-698`

```typescript
function extractServices(text: string): string[] {
  if (!text) return ['Service information not found'];

  const services: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // ⚠️ BUG: This matches ANY line containing "service" or "offer"
    if (line?.toLowerCase().includes('service') || line?.toLowerCase().includes('offer')) {
      const match = line.match(/[-•]\s*(.+)/);
      if (match && match[1]) services.push(match[1].trim());
    }
  }

  return services.length > 0 ? services : ['Service information not found'];
}
```

#### What Happens:

**Perplexity API Response** (from your logs):
```
I'm unable to access the website content for midland-solar.co.uk directly...
However, I can provide general insights...

Main Services:
Based on typical offerings for solar companies in the Midlands:
- certified installation with a focus on quality, reliability, and customer service.
  They may highlight bespoke system design tailored to customer needs, compliance
  with UK standards, and ongoing support post-installation. Their local Midlands
  focus could also be a unique selling point, offering regional expertise and service.
```

**What `extractServices()` returns:**
```javascript
[
  "certified installation with a focus on quality, reliability, and customer service. They may highlight bespoke system design tailored to customer needs, compliance with UK standards, and ongoing support post-installation. Their local Midlands focus could also be a unique selling point, offering regional expertise and service."
]
```

**Then line 1077 does:**
```typescript
extractedIndustry = websiteServicesForKeywords[0];
// extractedIndustry is now that entire verbose paragraph!
```

**Then `generateTargetKeywords()` receives:**
```typescript
await generateTargetKeywords(
  "Midland Solar",
  "certified installation with a focus on quality, reliability...", // ❌ WRONG!
  "Midlands",
  "local",
  [verbose paragraph array]
)
```

**Then `getServicesForIndustry()` is called:**
- Line 536: Exact match fails (obviously)
- Line 541-547: Case-insensitive match fails
- Line 549-555: Partial match tries to find "Solar" in the verbose text
- **⚠️ IT MIGHT MATCH because the word "solar" appears in "midland-solar.co.uk"**
- OR it falls back to generic "Services"

**Then at line 1252-1255:**
```typescript
services = {
  primaryServices: extractedServices.slice(0, 5), // Uses the verbose paragraph!
  secondaryServices: extractedServices.slice(5, 10),
  localModifiers: ['near me', 'nearby', 'local'],
}
```

**Result:** Keywords become verbose nonsense paragraphs instead of concise service names!

---

### Issue 2: Inflated Traffic Numbers

From your logs, the traffic shows **150,200** instead of realistic **50**.

This is likely caused by:

1. **SerpAPI returning cumulative data** instead of single keyword volume
2. **Aggregation bug** where volumes are summed incorrectly
3. **Wrong metric** being pulled (e.g., total search volume vs. realistic ranking potential)

Need to find where traffic numbers are calculated and fix aggregation logic.

---

## ✅ THE SOLUTION

### Fix 1: Make `extractServices()` Return Concise Service Names

**Problem:** Currently extracts full paragraphs containing "service" or "offer"

**Solution:** Use AI to extract just the core service names from verbose text

**New Approach:**

```typescript
async function extractServices(text: string): Promise<string[]> {
  if (!text) return ['Service information not found'];

  // First, try to extract bullet points or numbered lists
  const services: string[] = [];
  const lines = text.split('\n');

  // Look for structured lists first
  for (const line of lines) {
    const bulletMatch = line.match(/^[\s]*[-•*]\s*([^.,]+)/);
    if (bulletMatch && bulletMatch[1]) {
      const service = bulletMatch[1].trim();
      // Only keep concise service names (< 50 chars)
      if (service.length < 50 && !service.toLowerCase().includes('however')) {
        services.push(service);
      }
    }
  }

  // If structured extraction worked, return those
  if (services.length > 0) {
    console.log('[extractServices] Found structured services:', services);
    return services;
  }

  // Fallback: Use AI to extract concise service names
  console.log('[extractServices] No structured list found, using AI extraction');

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Extract ONLY the core service names from this text. Return 1-5 concise service names (2-5 words each).

Example:
Input: "certified installation with a focus on quality, reliability, and customer service for solar panels"
Output: ["solar panel installation", "solar energy systems", "solar maintenance"]

Text to analyze:
${text.substring(0, 1000)}

Return ONLY a JSON array of strings, nothing else.`
      }],
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content?.trim();
    if (result) {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('[extractServices] AI extracted services:', parsed);
        return parsed;
      }
    }
  } catch (error) {
    console.error('[extractServices] AI extraction failed:', error);
  }

  // Last resort fallback
  return ['Service information not found'];
}
```

**Benefits:**
- Extracts concise service names only (e.g., "solar panel installation")
- Filters out verbose descriptions
- Uses AI as smart fallback when no structured list exists
- Validates service name length

---

### Fix 2: Add Industry Normalization Layer

Even after extracting better services, we need to normalize them to match the `INDUSTRY_TO_SERVICES` mapping.

**Add new function:**

```typescript
/**
 * Normalize extracted service to match industry template
 *
 * Examples:
 * "solar panel installation" → "Solar"
 * "certified electrician services" → "Electrical"
 * "plumbing repairs and maintenance" → "Plumbing"
 */
function normalizeServiceToIndustry(service: string): string {
  if (!service || service.length < 3) return 'Services';

  const serviceLower = service.toLowerCase();

  // Direct keyword matching
  const industryKeywords: Record<string, string> = {
    'solar': 'Solar',
    'renewable energy': 'Renewable Energy',
    'plumb': 'Plumbing',
    'electric': 'Electrical',
    'hvac': 'HVAC',
    'air conditioning': 'HVAC',
    'roof': 'Roofing',
    'construction': 'Construction',
    'build': 'Construction',
    'account': 'Accounting',
    'legal': 'Legal',
    'law': 'Legal',
    'market': 'Marketing',
    'dental': 'Dental',
    'dentist': 'Dental',
    'medical': 'Medical',
    'doctor': 'Medical',
    'auto': 'Auto Repair',
    'car repair': 'Auto Repair',
    'mechanic': 'Auto Repair',
    'real estate': 'Real Estate',
    'property': 'Real Estate',
    'clean': 'Cleaning',
    'landscape': 'Landscaping',
    'garden': 'Landscaping',
    'walk in bath': 'Walk in Baths',
    'restaurant': 'Restaurant',
    'catering': 'Restaurant',
    'it support': 'IT Services',
    'web design': 'Web Design',
    'website': 'Web Design',
  };

  // Check for keyword matches
  for (const [keyword, industry] of Object.entries(industryKeywords)) {
    if (serviceLower.includes(keyword)) {
      console.log(`[normalizeServiceToIndustry] "${service}" → "${industry}" (matched: ${keyword})`);
      return industry;
    }
  }

  // Fallback to generic
  console.warn(`[normalizeServiceToIndustry] Could not normalize "${service}", using "Services"`);
  return 'Services';
}
```

**Update line 1077:**

```typescript
// OLD:
extractedIndustry = websiteServicesForKeywords[0];

// NEW:
const rawService = websiteServicesForKeywords[0];
extractedIndustry = normalizeServiceToIndustry(rawService);
console.log(`✅ Normalized "${rawService}" → "${extractedIndustry}"\n`);
```

---

### Fix 3: Fix Inflated Traffic Numbers

Need to investigate where traffic calculation happens. Looking for files with:
- Keyword volume aggregation
- Traffic estimation
- SerpAPI volume parsing

**Next steps:**
1. Find traffic calculation code
2. Identify if it's summing volumes incorrectly
3. Fix to use realistic projections (not cumulative)

---

## 🎯 IMPLEMENTATION PLAN

### Step 1: Fix `extractServices()` Function
**File:** `lib/research/enhanced-research-agent.ts:684-698`
- Replace simple regex extraction with AI-powered extraction
- Add length validation (< 50 chars)
- Add structured list parsing first
- Use GPT-4o-mini as fallback for unstructured text

### Step 2: Add `normalizeServiceToIndustry()` Function
**File:** `lib/research/enhanced-research-agent.ts` (after line 698)
- Create keyword-to-industry mapping
- Add logging for transparency
- Handle edge cases

### Step 3: Update Industry Extraction Logic
**File:** `lib/research/enhanced-research-agent.ts:1077`
- Call `normalizeServiceToIndustry()` before setting `extractedIndustry`
- Add validation logging

### Step 4: Find and Fix Traffic Calculation
- Search for keyword volume aggregation
- Fix cumulative summing issue
- Use realistic ranking-based projections

### Step 5: Test with midland-solar.co.uk
- Generate new proposal
- Verify keywords are now: "solar panel installation UK", etc.
- Verify traffic numbers are realistic (e.g., 50 instead of 150,200)

---

## 📊 EXPECTED RESULTS

### Before Fix:
```
Industry: "certified installation with a focus on quality, reliability..."
Keywords: ["certified installation with a focus on quality...", ...]
Traffic: 150,200
```

### After Fix:
```
Industry: "Solar"
Keywords: ["solar panel installation", "solar panel installers midlands", "solar pv installation", ...]
Traffic: 50-100 (realistic)
```

---

## 🚨 WHY THIS BUG HAPPENED

1. **Perplexity API couldn't access website** → Returned verbose generic text
2. **`extractServices()` is too naive** → Extracts full paragraphs containing "service"
3. **No normalization layer** → Verbose text passed directly as industry name
4. **`generateTargetKeywords()` uses it verbatim** → Creates nonsensical keywords

**The fix:** Add intelligent extraction + normalization layer to ensure concise industry names.

---

Ready to implement! 🚀
