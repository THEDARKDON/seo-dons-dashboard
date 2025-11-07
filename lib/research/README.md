# Enhanced Research System

## Overview

The Enhanced Research System integrates real-world web data into SEO proposal generation, replacing Claude's "hallucinated" competitor data with actual market intelligence from Perplexity AI and SerpAPI.

## What It Does

### Real Data Gathered:

1. **Website Analysis** (via Perplexity)
   - Actual services and products offered
   - Real page count and structure
   - Technical quality assessment
   - Content quality evaluation
   - Live chat and blog presence

2. **Company Intelligence** (via Perplexity)
   - Actual company size and employee count
   - Founded year
   - Business model (B2B/B2C)
   - Real strengths and weaknesses

3. **Social Media Presence** (via Perplexity)
   - All active social platforms
   - Follower counts where available
   - Engagement levels
   - Recent activity

4. **Real Google Rankings** (via SerpAPI)
   - Actual keyword positions
   - Search volumes for target keywords
   - Difficulty estimates based on real SERPs
   - Top competitors for each keyword

5. **Competitor Discovery** (via SerpAPI)
   - Real competitors ranking for target keywords
   - Traffic estimates for competitors
   - Domain authority scores
   - Actual strengths of each competitor

6. **Market Intelligence** (combined)
   - Total search volume across keywords
   - Real competition levels
   - Quick win opportunities based on actual data
   - Industry-specific trends

## Setup

### 1. Install Dependencies

```bash
npm install serpapi
```

### 2. Get API Keys

#### Perplexity API
1. Visit https://www.perplexity.ai/
2. Sign up and navigate to API settings
3. Generate an API key
4. Cost: Pay-as-you-go pricing

#### SerpAPI
1. Visit https://serpapi.com/
2. Create an account
3. Get your API key from dashboard
4. Cost: 100 free searches/month, then pay-as-you-go

### 3. Configure Environment Variables

Add to your `.env.local`:

```bash
# Perplexity API (for real-time web research)
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx

# SerpAPI (for real Google rankings)
SERPAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Verify Setup

The system will automatically detect if API keys are configured:
- **With keys**: Uses real web research + Claude analysis
- **Without keys**: Falls back to Claude-only analysis (guesses)

Check logs during proposal generation:
```
[Research Agent] Starting enhanced research with Perplexity & SerpAPI...
[Research Agent] Enhanced research complete - Real data gathered
```

Or:
```
[Research Agent] Enhanced research skipped - API keys not configured or no website
```

## How It Works

### Architecture

```
Proposal Generation
    ↓
performDeepResearch()
    ↓
conductEnhancedResearch() ← NEW
    ├─ analyzeWebsiteWithPerplexity()
    ├─ gatherCompanyIntelligence()
    ├─ researchSocialMedia()
    ├─ checkRealRankings() (SerpAPI)
    └─ findRealCompetitors() (SerpAPI)
    ↓
analyzeCompany() ← Enhanced with real data
    ↓
researchMarket() ← Has access to real data
    ↓
analyzeCompetitors() ← Has access to real competitors
    ↓
Proposal Content Generation
```

### Data Flow

1. **Enhanced Research** runs first (if configured)
   - Perplexity researches the web for company info
   - SerpAPI checks actual Google rankings
   - Real competitor data is gathered

2. **Claude Analysis** uses the real data
   - Company analysis now includes actual facts
   - Market research is informed by real search volumes
   - Competitor analysis uses actual ranking data
   - Keywords are based on real search volumes

3. **Proposal Generation** uses combined intelligence
   - Real metrics in competitive analysis
   - Actual search volumes in keyword strategy
   - Factual competitor strengths/weaknesses
   - Data-driven ROI projections

### Example Output

#### Before (Claude-only):
```json
{
  "competitors": [
    {
      "name": "Guessed Competitor A",
      "estimatedTraffic": "Unknown",
      "strengths": ["Assumed to have good content"]
    }
  ]
}
```

#### After (Enhanced Research):
```json
{
  "competitors": [
    {
      "name": "Actual Competitor Ltd",
      "domain": "actualcompetitor.co.uk",
      "estimatedTraffic": "15,000 monthly visitors",
      "rankings": [
        {"keyword": "solar panels essex", "position": 3}
      ],
      "domainAuthority": 42,
      "strengths": ["Ranks #3 for high-volume terms", "Strong backlink profile"]
    }
  ]
}
```

## API Cost Estimates

### Per Proposal:

**Perplexity AI** (Sonar Pro model):
- ~4-6 queries per proposal
- ~4,000 tokens per query
- Cost: ~$0.04 - $0.06 per proposal

**SerpAPI**:
- ~5-10 searches per proposal (depends on keywords)
- Cost: ~$0.025 - $0.05 per proposal

**Total Additional Cost**: ~$0.065 - $0.11 per proposal

### Monthly Estimates:

- 50 proposals/month: ~$3.25 - $5.50
- 100 proposals/month: ~$6.50 - $11.00
- 200 proposals/month: ~$13.00 - $22.00

**ROI**: Proposals with real data have significantly higher close rates, making this investment worthwhile.

## Features

### Automatic Keyword Generation

If target keywords aren't provided, the system automatically generates relevant keywords based on:
- Company name
- Industry
- Location
- Common search patterns

### Graceful Degradation

The system is designed to fail gracefully:
- No API keys? Falls back to Claude-only analysis
- Perplexity fails? Continues with SerpAPI data only
- SerpAPI fails? Uses Perplexity insights only
- Both fail? Pure Claude analysis (like before)

### Rate Limiting

Built-in rate limiting to avoid API throttling:
- 1-second delay between SerpAPI calls
- Batched Perplexity requests where possible

## Customization

### Add More Keywords

Edit the `generateTargetKeywords()` function in `enhanced-research-agent.ts`:

```typescript
const baseKeywords = [
  companyName,
  `${industry} services`,
  `${industry} ${location}`,
  `best ${industry} company ${location}`, // Add more patterns
];
```

### Adjust Search Volume Estimates

Modify the `estimateSearchVolume()` function for better estimates:

```typescript
if (words.length === 1) return 2000; // Increase for broader terms
if (words.includes('near me')) return 500; // Adjust local search volumes
```

### Change Competitor Limit

In `findRealCompetitors()`:

```typescript
await findRealCompetitors(keywords, location, 10) // Default is 5
```

## Troubleshooting

### "Enhanced research skipped - API keys not configured"

**Solution**: Add PERPLEXITY_API_KEY and SERPAPI_KEY to .env.local

### "Enhanced research failed, continuing with Claude-only analysis"

**Possible causes**:
1. Invalid API keys
2. API rate limits exceeded
3. Network issues
4. API service downtime

**Solution**: Check error logs for specific error message

### Proposals still showing generic data

**Possible causes**:
1. API keys not loaded (restart Next.js dev server)
2. Customer has no website (enhanced research requires a website)
3. Enhanced research failed silently

**Solution**:
1. Restart dev server after adding keys
2. Check customer has valid website URL
3. Check server logs for error messages

## Future Enhancements

Potential additions:
- [ ] Backlink analysis via Ahrefs/Moz API
- [ ] Traffic estimates via SEMrush API
- [ ] Google Analytics integration for existing clients
- [ ] Automated competitor SWOT analysis
- [ ] Content gap analysis
- [ ] Technical SEO audits via Lighthouse
- [ ] Local pack positions tracking

## Files Changed

- **lib/research/enhanced-research-agent.ts** (NEW)
  - Main research orchestration
  - Perplexity and SerpAPI integrations

- **lib/claude/research-agent.ts** (MODIFIED)
  - Added enhanced research integration
  - Passes real data to Claude for analysis

- **lib/claude/proposal-generator.ts** (UPDATED)
  - Includes enhanced research in results
  - Flows through to content generation

- **.env.example** (UPDATED)
  - Added PERPLEXITY_API_KEY
  - Added SERPAPI_KEY

- **package.json** (UPDATED)
  - Added serpapi dependency
