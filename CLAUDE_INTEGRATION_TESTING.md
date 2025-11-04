# Claude AI Integration - Testing Guide

This guide explains how to test the Claude API integration that powers the automated proposal generator.

## Phase 1: Foundation - COMPLETED ✅

### What Was Built

1. **Claude API Client** ([lib/claude/client.ts](lib/claude/client.ts))
   - Configured Anthropic SDK with API key
   - Model configuration (Claude Opus 4)
   - Cost calculation utilities
   - Token estimation functions

2. **Utility Functions** ([lib/claude/utils.ts](lib/claude/utils.ts))
   - Retry logic with exponential backoff
   - Text sanitization for prompts
   - JSON extraction from responses
   - Error handling and validation
   - Helper functions for research and content generation

3. **Research Agent** ([lib/claude/research-agent.ts](lib/claude/research-agent.ts))
   - 5-stage deep research process
   - Company analysis
   - Market intelligence
   - Competitor analysis
   - Keyword research
   - Location strategy (local/regional)

4. **Test API Endpoint** ([app/api/test-claude/route.ts](app/api/test-claude/route.ts))
   - POST endpoint for testing research
   - GET endpoint for health check
   - Progress tracking
   - Performance metrics

5. **Database Schema** (Migration 044)
   - `proposals` table with JSONB storage
   - `proposal_packages` table with pricing tiers
   - `proposal_activities` table for audit trail
   - Auto-incrementing proposal numbers (P-2025-0001)
   - Row Level Security policies

---

## Testing Instructions

### 1. Health Check (Quick Test)

Verify Claude API is configured:

```bash
curl http://localhost:3000/api/test-claude
```

**Expected Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Claude API is configured and ready"
}
```

---

### 2. Basic Research Test (Full Test)

Test the research agent with a real company:

```bash
curl -X POST http://localhost:3000/api/test-claude \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "A1 Mobility",
    "website": "https://a1mobility.co.uk",
    "industry": "Mobility Scooters and Wheelchairs",
    "location": "Kent, UK",
    "packageTier": "local"
  }'
```

**What This Does:**
1. Validates API key is working
2. Performs 5-stage deep research
3. Uses extended thinking (10K token budget)
4. Returns structured JSON results
5. Calculates cost and performance metrics

**Expected Duration:** 60-120 seconds (depending on research depth)

**Expected Cost:** £0.60-£0.80 per test

---

### 3. Understanding the Response

The test endpoint returns detailed research data:

```json
{
  "success": true,
  "data": {
    "research": {
      "companyAnalysis": {
        "businessOverview": { ... },
        "currentDigitalPresence": { ... },
        "painPoints": [ ... ],
        "opportunities": [ ... ]
      },
      "marketIntelligence": {
        "industryTrends": [ ... ],
        "searchBehavior": { ... },
        "competitiveGaps": [ ... ],
        "marketSize": "..."
      },
      "competitorAnalysis": {
        "topCompetitors": [ ... ],
        "competitiveAdvantages": [ ... ],
        "differentiationOpportunities": [ ... ]
      },
      "keywordResearch": {
        "primaryKeywords": [ ... ],
        "secondaryKeywords": [ ... ],
        "longTailOpportunities": [ ... ]
      },
      "locationStrategy": {
        "targetLocations": [ ... ],
        "localSEOOpportunities": [ ... ]
      },
      "researchedAt": "2025-01-04T...",
      "totalTokensUsed": 45000,
      "estimatedCost": 0.7234,
      "thinkingTokensUsed": 8500
    },
    "performance": {
      "durationSeconds": 87,
      "totalTokens": 45000,
      "thinkingTokens": 8500,
      "estimatedCost": 0.7234,
      "progressLog": [
        { "stage": "Analyzing company and website", "progress": 25, "timestamp": 15234 },
        { "stage": "Researching market and industry trends", "progress": 50, "timestamp": 32451 },
        ...
      ]
    }
  }
}
```

---

### 4. Testing Different Package Tiers

Test each package tier to see different research depths:

**Local Package (£2,000/month):**
```bash
curl -X POST http://localhost:3000/api/test-claude \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Local Plumber Ltd",
    "packageTier": "local"
  }'
```

**Regional Package (£3,000/month):**
```bash
curl -X POST http://localhost:3000/api/test-claude \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Regional Electricians",
    "packageTier": "regional"
  }'
```

**National Package (£5,000/month):**
```bash
curl -X POST http://localhost:3000/api/test-claude \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "National Logistics Co",
    "packageTier": "national"
  }'
```

---

### 5. Error Testing

Test error handling:

**Missing API Key:**
1. Temporarily rename `.env.local` to `.env.local.backup`
2. Restart dev server
3. Run health check - should return "not configured"

**Invalid Company Name:**
```bash
curl -X POST http://localhost:3000/api/test-claude \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expected: 400 error with "Company name is required"

**Rate Limiting:**
Run multiple requests rapidly to test retry logic (may not trigger with current API tier)

---

## Performance Benchmarks

### Expected Performance (Phase 1)

| Metric | Target | Typical |
|--------|--------|---------|
| **Total Duration** | < 2 minutes | 60-120 seconds |
| **Stage 1 (Company)** | < 20 seconds | 12-18 seconds |
| **Stage 2 (Market)** | < 25 seconds | 15-22 seconds |
| **Stage 3 (Competitors)** | < 30 seconds | 18-25 seconds |
| **Stage 4 (Keywords)** | < 25 seconds | 15-22 seconds |
| **Stage 5 (Locations)** | < 20 seconds | 10-15 seconds |
| **Total Tokens** | 40K-60K | ~45,000 |
| **Thinking Tokens** | 7K-10K | ~8,500 |
| **Cost per Research** | < £1.00 | £0.60-£0.80 |

### Token Breakdown

- **Input Tokens:** ~20,000 (prompts + system messages)
- **Output Tokens:** ~15,000 (research results)
- **Thinking Tokens:** ~8,500 (Claude's internal reasoning)

### Cost Breakdown (Claude Opus 4)

- **Input:** 20,000 tokens × £0.0000118/token = £0.24
- **Output:** 15,000 tokens × £0.0000593/token = £0.89
- **Thinking:** 8,500 tokens × £0.0000118/token = £0.10
- **Total:** ~£0.70 per full research session

---

## Database Testing

### Check Migration Status

```sql
-- Connect to Supabase database
SELECT migration_name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 5;
```

Expected: Migration 044 should be present

### Test Proposal Creation (Manual)

```sql
-- Insert test proposal
INSERT INTO proposals (
  customer_id,
  created_by,
  research_data,
  status
) VALUES (
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '{"test": true}'::jsonb,
  'draft'
);

-- Verify auto-generated proposal number
SELECT proposal_number, created_at FROM proposals ORDER BY created_at DESC LIMIT 1;
```

Expected: Proposal number like `P-2025-0001`

---

## Next Steps (Phase 2)

Once Phase 1 testing is complete, we'll implement:

1. **Content Generator** - Generate all 18 pages using the god prompt
2. **React-PDF Template** - Professional PDF generation matching A1 Mobility style
3. **Proposal API Endpoints** - Full CRUD operations for proposals
4. **UI Components** - Generate button, progress dialog, proposal viewer

---

## Troubleshooting

### "Claude API key is not configured"
- Check `.env.local` has `ANTHROPIC_API_KEY`
- Verify key starts with `sk-ant-`
- Restart dev server after adding key

### "Invalid JSON in Claude response"
- Check Claude API status: https://status.anthropic.com
- Review logs for the actual response content
- May indicate prompt formatting issue

### "Rate limit exceeded"
- Wait 60 seconds and retry
- Check your API tier limits at https://console.anthropic.com
- Retry logic should handle this automatically

### Slow Performance (>3 minutes)
- Normal for first request (cold start)
- Check internet connection
- Verify Claude API isn't experiencing issues
- Consider reducing thinking budget in [lib/claude/client.ts](lib/claude/client.ts#L24)

### High Costs (>£1.50 per research)
- Review token usage in response
- Check if multiple research stages are being called
- Verify thinking budget is set correctly (should be 10,000)
- Consider optimizing prompt lengths

---

## Cost Management

### Current Costs (Phase 1)
- **Per Research:** £0.60-£0.80
- **Per Proposal (estimated):** £1.50-£2.00 (includes content generation)
- **Monthly Budget:** Set in proposal_packages table

### Cost Monitoring
All API calls are tracked in the database:
- `proposals.total_tokens_used` - Total tokens consumed
- `proposals.estimated_cost` - Cost in GBP
- `proposal_activities` - Audit trail of all operations

### Budget Alerts
Set up alerts when:
- Single proposal exceeds £3.00
- Daily costs exceed £50
- Monthly costs exceed £500

---

## Security Checklist

- [x] API key stored in `.env.local` (gitignored)
- [x] API key validated before use
- [x] Error messages don't expose sensitive data
- [x] Database has Row Level Security policies
- [x] All inputs are sanitized before prompts
- [x] Rate limiting and retry logic in place

---

## Support Resources

- **Claude API Docs:** https://docs.anthropic.com
- **Pricing:** https://www.anthropic.com/pricing
- **Status:** https://status.anthropic.com
- **Console:** https://console.anthropic.com

---

**Last Updated:** January 4, 2025
**Phase Status:** Phase 1 (Foundation) - COMPLETED ✅
**Next Milestone:** Phase 2 (Content Generation) - Ready to start
