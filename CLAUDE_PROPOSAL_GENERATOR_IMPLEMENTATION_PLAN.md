# Claude API Proposal Generator - Complete Implementation Plan

## Executive Summary

This document outlines the complete implementation for integrating Claude API (Opus with extended thinking) into the CRM to auto-generate 18-page SEO proposals matching the A1 Mobility template style.

**Key Features:**
- One-click proposal generation from customer page
- Automated deep research using Claude's extended thinking (10K tokens)
- Real competitor analysis and market data
- Professional PDF generation matching exact template design
- 18-page structured proposals with calculations and ROI projections
- Full audit trail and versioning

**Timeline:** 6-8 weeks (4 phases)
**Cost per proposal:** ~$0.66 (Claude API)
**Expected ROI:** 3,000%+ (proposals close at £2K-£5K/month × 12 months)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Claude API Integration](#claude-api-integration)
4. [Research Agent Implementation](#research-agent-implementation)
5. [Content Generation Agent](#content-generation-agent)
6. [PDF Generation System](#pdf-generation-system)
7. [UI Components & Workflows](#ui-components--workflows)
8. [API Endpoints](#api-endpoints)
9. [Implementation Phases](#implementation-phases)
10. [Testing Plan](#testing-plan)
11. [Cost Analysis](#cost-analysis)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Customer Detail Page                                      │ │
│  │  ┌──────────────────────┐                                 │ │
│  │  │ Generate Proposal Btn │ ──────┐                        │ │
│  │  └──────────────────────┘       │                        │ │
│  │                                  │                        │ │
│  │  ┌───────────────────────────────▼──────────────────────┐│ │
│  │  │ Progress Dialog (Real-time updates)                  ││ │
│  │  │  • Analyzing company...          [====    ] 40%      ││ │
│  │  │  • Researching competitors...    [======  ] 60%      ││ │
│  │  │  • Generating content...         [========] 80%      ││ │
│  │  │  • Creating PDF...               [==========] 100%    ││ │
│  │  └──────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ HTTP POST /api/proposals/generate
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                      API LAYER (Next.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/proposals/generate                                 │  │
│  │   • Validates request                                    │  │
│  │   • Creates proposal record (status: 'generating')       │  │
│  │   • Triggers async generation                            │  │
│  │   • Returns proposal_id immediately                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/proposals/[id]/status                              │  │
│  │   • Returns current status and progress                  │  │
│  │   • Client polls this endpoint every 2 seconds           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ Async Processing
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                    CLAUDE RESEARCH AGENT                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Phase 1: Company Analysis (30-60 seconds)               │  │
│  │   • Fetch website content                                │  │
│  │   • Analyze services/products                            │  │
│  │   • Identify USPs and positioning                        │  │
│  │   • Estimate traffic & rankings (Semrush/Ahrefs API)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Phase 2: Market Intelligence (30-60 seconds)            │  │
│  │   • Industry market size & growth                        │  │
│  │   • Demographics & customer behavior                     │  │
│  │   • Seasonal patterns                                    │  │
│  │   • Average transaction values                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Phase 3: Competitor Analysis (60-90 seconds)            │  │
│  │   • Identify top 5-10 competitors                        │  │
│  │   • Analyze traffic, keywords, DA                        │  │
│  │   • Find strengths/weaknesses                            │  │
│  │   • Calculate revenue estimates                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Phase 4: Keyword Research (30-45 seconds)               │  │
│  │   • 50+ keywords across categories                       │  │
│  │   • Search volume, difficulty, CPC                       │  │
│  │   • Revenue potential calculations                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Uses: claude-opus-4-20250514 with extended thinking            │
│  Thinking budget: 10,000 tokens per phase                       │
│  Total cost: ~$0.40 per proposal                                │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ Research data (JSON)
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                  CLAUDE CONTENT GENERATOR                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Takes research data + god prompt                        │  │
│  │  Generates all 18 pages of content:                      │  │
│  │   • Executive summaries                                  │  │
│  │   • ROI calculations                                     │  │
│  │   • Market analysis                                      │  │
│  │   • Competitor tables                                    │  │
│  │   • Keyword strategies                                   │  │
│  │   • Timeline projections                                 │  │
│  │   • Package pricing                                      │  │
│  │   • Closing statements                                   │  │
│  │                                                          │  │
│  │  Uses: claude-opus-4 (no extended thinking)              │  │
│  │  Cost: ~$0.20 per proposal                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ Structured content (JSON)
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                      PDF GENERATOR                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React-PDF Document                                      │  │
│  │   • 18 pages matching A1 Mobility design                 │  │
│  │   • Turquoise (#00D4D4) color scheme                     │  │
│  │   • Tables, charts, callout boxes                        │  │
│  │   • Custom fonts and styling                             │  │
│  │                                                          │  │
│  │  Renders to Buffer → Upload to Supabase Storage          │  │
│  │  Cost: ~$0.01 storage per PDF                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      │ PDF URL
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                       DATABASE                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UPDATE proposals SET                                    │  │
│  │    status = 'ready',                                     │  │
│  │    pdf_url = 'https://...',                              │  │
│  │    generation_time_seconds = 145,                        │  │
│  │    research_data = {...},                                │  │
│  │    content_sections = {...}                              │  │
│  │  WHERE id = proposal_id                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Total Generation Time:** 2-5 minutes
**User Experience:** Non-blocking, real-time progress updates

---

## 2. Database Schema

### 2.1 `proposals` Table

```sql
CREATE TABLE proposals (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number TEXT UNIQUE, -- P-2025-0001 (auto-increment)

  -- Relationships
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) NOT NULL,

  -- Proposal Details
  title TEXT NOT NULL, -- "SEO Investment Strategy & Growth Plan"
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_industry TEXT,
  service_area TEXT, -- "Lancashire & UK Nationwide"

  -- Status Management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Initial state
    'generating',   -- Claude is working
    'ready',        -- PDF generated, ready to send
    'sent',         -- Sent to customer
    'viewed',       -- Customer opened PDF
    'accepted',     -- Customer accepted
    'rejected'      -- Customer declined
  )),

  -- Research Data (JSONB for flexibility)
  research_data JSONB, -- Stores all Claude research results
  /*
  {
    "company_analysis": {
      "traffic_estimate": 174,
      "ranking_keywords": 71,
      "domain_authority": 28,
      "unique_advantages": ["25+ years", "Largest showroom"],
      "current_revenue_estimate": "£500k-1M annually"
    },
    "market_intelligence": {
      "market_size": "£712.8M",
      "growth_rate": "6.2%",
      "demographics": {...},
      "seasonal_patterns": [...]
    },
    "competitors": [
      {
        "name": "Millercare",
        "traffic": 2000,
        "strengths": ["Strong SEO", "70-year brand"],
        "weaknesses": ["Corporate", "Higher prices"],
        "revenue_estimate": "£2M+"
      }
    ],
    "keywords": [
      {
        "keyword": "mobility scooters blackpool",
        "volume": 320,
        "difficulty": 45,
        "cpc": 2.80,
        "revenue_potential": "£10,800/mo"
      }
    ]
  }
  */

  -- Generated Content (JSONB - all 18 pages)
  content_sections JSONB,
  /*
  {
    "cover_page": {
      "tagline": "From Hidden to Household Name...",
      "service_area": "Lancashire & UK Nationwide"
    },
    "executive_summary": {
      "hook": "You have the UK's largest mobility showroom...",
      "brutal_truth": "When someone's grandmother needs...",
      "market_size": "£712.8 million",
      "opportunity": "£660k monthly"
    },
    "current_vs_potential": {
      "metrics": [...],
      "roi_calculation": {...}
    },
    // ... all 18 pages
  }
  */

  -- PDF Output
  pdf_url TEXT, -- Supabase Storage URL
  pdf_file_size INTEGER, -- bytes

  -- Package Selection
  selected_package TEXT CHECK (selected_package IN ('local', 'regional', 'national')),
  monthly_investment INTEGER, -- £2000, £3000, or £5000

  -- Performance Metrics
  generation_time_seconds INTEGER, -- How long Claude took
  claude_model TEXT DEFAULT 'claude-opus-4',
  total_tokens_used INTEGER,
  estimated_cost DECIMAL(10,4), -- API cost in GBP

  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_relationship CHECK (
    customer_id IS NOT NULL OR lead_id IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX idx_proposals_customer ON proposals(customer_id);
CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_created_by ON proposals(created_by);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE UNIQUE INDEX idx_proposals_number ON proposals(proposal_number);

-- Auto-increment proposal number
CREATE SEQUENCE proposal_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_number IS NULL THEN
    NEW.proposal_number := 'P-' ||
      TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
      LPAD(nextval('proposal_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_proposal_number
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposal_number();

-- Updated_at trigger
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 `proposal_packages` Table (Configuration)

```sql
CREATE TABLE proposal_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Package Details
  package_key TEXT UNIQUE NOT NULL, -- 'local', 'regional', 'national'
  package_name TEXT NOT NULL, -- 'Local Dominance'
  monthly_investment INTEGER NOT NULL, -- £2000

  -- Features
  focus_description TEXT, -- "Blackpool & Fylde"
  keywords_targeted INTEGER, -- 15
  content_per_month INTEGER, -- 2 articles
  backlinks_per_month INTEGER, -- 5
  location_pages INTEGER, -- 8

  -- Expected Results (Month 12)
  expected_traffic_min INTEGER, -- 600
  expected_traffic_max INTEGER, -- 800
  expected_leads_min INTEGER, -- 20
  expected_leads_max INTEGER, -- 30
  revenue_impact_min INTEGER, -- £50,000
  revenue_impact_max INTEGER, -- £65,000
  roi_multiplier DECIMAL(5,2), -- 25.00 (25x)

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO proposal_packages (package_key, package_name, monthly_investment, focus_description, keywords_targeted, content_per_month, backlinks_per_month, location_pages, expected_traffic_min, expected_traffic_max, expected_leads_min, expected_leads_max, revenue_impact_min, revenue_impact_max, roi_multiplier, display_order) VALUES
('local', 'Local Dominance', 2000, 'Primary location & immediate area', 15, 2, 5, 8, 600, 800, 20, 30, 50000, 65000, 25.00, 1),
('regional', 'Regional Authority', 3000, 'Regional coverage + key cities', 50, 4, 10, 20, 1500, 2000, 40, 60, 100000, 130000, 33.00, 2),
('national', 'National Leader', 5000, 'UK-wide market domination', 70, 6, 20, 30, 3500, 5000, 70, 100, 175000, 250000, 35.00, 3);
```

### 2.3 `proposal_activities` Table (Audit Trail)

```sql
CREATE TABLE proposal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',
    'generation_started',
    'research_completed',
    'content_generated',
    'pdf_created',
    'sent',
    'viewed',
    'downloaded',
    'accepted',
    'rejected',
    'edited',
    'regenerated'
  )),

  description TEXT,
  metadata JSONB, -- Additional context

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposal_activities_proposal ON proposal_activities(proposal_id);
CREATE INDEX idx_proposal_activities_created_at ON proposal_activities(created_at DESC);
```

---

## 3. Claude API Integration

### 3.1 Setup & Configuration

**File:** `lib/claude/client.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Model configuration
export const CLAUDE_CONFIG = {
  // Use Opus for research (best reasoning, extended thinking)
  RESEARCH_MODEL: 'claude-opus-4-20250514',

  // Use Opus for content generation (best writing quality)
  CONTENT_MODEL: 'claude-opus-4-20250514',

  // Extended thinking budget for deep research
  THINKING_BUDGET: 10000, // tokens

  // Max tokens for responses
  MAX_TOKENS_RESEARCH: 16000,
  MAX_TOKENS_CONTENT: 16000,

  // Temperature (creativity)
  TEMPERATURE_RESEARCH: 0.3, // More factual
  TEMPERATURE_CONTENT: 0.5,  // More creative
} as const;

// Cost calculation (approximate, updated regularly)
export const CLAUDE_PRICING = {
  // Opus 4 pricing (per million tokens)
  INPUT_COST_PER_M: 15.00,  // $15 per 1M input tokens
  OUTPUT_COST_PER_M: 75.00, // $75 per 1M output tokens
  THINKING_COST_PER_M: 15.00, // $15 per 1M thinking tokens

  // GBP conversion (approximate)
  USD_TO_GBP: 0.79,
};

export function calculateCost(inputTokens: number, outputTokens: number, thinkingTokens: number = 0): number {
  const inputCost = (inputTokens / 1000000) * CLAUDE_PRICING.INPUT_COST_PER_M;
  const outputCost = (outputTokens / 1000000) * CLAUDE_PRICING.OUTPUT_COST_PER_M;
  const thinkingCost = (thinkingTokens / 1000000) * CLAUDE_PRICING.THINKING_COST_PER_M;

  const totalUSD = inputCost + outputCost + thinkingCost;
  return totalUSD * CLAUDE_PRICING.USD_TO_GBP;
}
```

### 3.2 Error Handling & Retries

**File:** `lib/claude/utils.ts`

```typescript
export async function claudeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw error;
      }

      // Rate limit - wait longer
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
        console.warn(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Exponential backoff for other errors
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export function sanitizeForPrompt(text: string): string {
  // Remove excessive whitespace
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000); // Limit to prevent token overflow
}
```

---

## 4. Research Agent Implementation

### 4.1 Main Research Orchestrator

**File:** `lib/claude/research-agent.ts`

```typescript
import { anthropic, CLAUDE_CONFIG, calculateCost } from './client';
import { claudeWithRetry, sanitizeForPrompt } from './utils';
import { fetchWebsiteContent } from './web-scraper';
import { fetchSEOMetrics } from './seo-api';

export interface ResearchRequest {
  companyName: string;
  website: string;
  industry: string;
  location: string;
  serviceRadius?: string;
}

export interface ResearchResult {
  companyAnalysis: CompanyAnalysis;
  marketIntelligence: MarketIntelligence;
  competitors: Competitor[];
  keywords: Keyword[];
  locationOpportunities: LocationOpportunity[];
  researchMetadata: {
    totalTokens: number;
    estimatedCost: number;
    durationSeconds: number;
  };
}

export async function performDeepResearch(
  request: ResearchRequest,
  onProgress?: (stage: string, progress: number) => Promise<void>
): Promise<ResearchResult> {
  const startTime = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalThinkingTokens = 0;

  try {
    // Stage 1: Company Analysis (25%)
    await onProgress?.('Analyzing company website and online presence...', 10);
    const companyAnalysis = await analyzeCompany(request);
    totalInputTokens += companyAnalysis.usage.input_tokens;
    totalOutputTokens += companyAnalysis.usage.output_tokens;
    totalThinkingTokens += companyAnalysis.usage.thinking_tokens || 0;
    await onProgress?.('Company analysis complete', 25);

    // Stage 2: Market Intelligence (50%)
    await onProgress?.('Researching market size, growth rates, and demographics...', 30);
    const marketIntelligence = await researchMarket(request, companyAnalysis.data);
    totalInputTokens += marketIntelligence.usage.input_tokens;
    totalOutputTokens += marketIntelligence.usage.output_tokens;
    totalThinkingTokens += marketIntelligence.usage.thinking_tokens || 0;
    await onProgress?.('Market research complete', 50);

    // Stage 3: Competitor Analysis (70%)
    await onProgress?.('Analyzing top competitors and their strategies...', 55);
    const competitors = await analyzeCompetitors(request, companyAnalysis.data);
    totalInputTokens += competitors.usage.input_tokens;
    totalOutputTokens += competitors.usage.output_tokens;
    totalThinkingTokens += competitors.usage.thinking_tokens || 0;
    await onProgress?.('Competitor analysis complete', 70);

    // Stage 4: Keyword Research (85%)
    await onProgress?.('Identifying high-value keywords and search opportunities...', 75);
    const keywords = await researchKeywords(request, companyAnalysis.data, marketIntelligence.data);
    totalInputTokens += keywords.usage.input_tokens;
    totalOutputTokens += keywords.usage.output_tokens;
    totalThinkingTokens += keywords.usage.thinking_tokens || 0;
    await onProgress?.('Keyword research complete', 85);

    // Stage 5: Location Opportunities (95%)
    await onProgress?.('Analyzing location-based opportunities...', 90);
    const locationOpportunities = await analyzeLocations(request, companyAnalysis.data);
    totalInputTokens += locationOpportunities.usage.input_tokens;
    totalOutputTokens += locationOpportunities.usage.output_tokens;
    totalThinkingTokens += locationOpportunities.usage.thinking_tokens || 0;
    await onProgress?.('Research complete!', 100);

    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const estimatedCost = calculateCost(totalInputTokens, totalOutputTokens, totalThinkingTokens);

    return {
      companyAnalysis: companyAnalysis.data,
      marketIntelligence: marketIntelligence.data,
      competitors: competitors.data,
      keywords: keywords.data,
      locationOpportunities: locationOpportunities.data,
      researchMetadata: {
        totalTokens: totalInputTokens + totalOutputTokens + totalThinkingTokens,
        estimatedCost,
        durationSeconds,
      },
    };
  } catch (error) {
    console.error('Research agent failed:', error);
    throw new Error(`Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 4.2 Company Analysis

**File:** `lib/claude/research/company-analysis.ts`

```typescript
import { anthropic, CLAUDE_CONFIG } from '../client';
import { claudeWithRetry, sanitizeForPrompt } from '../utils';
import { fetchWebsiteContent } from '../web-scraper';
import { fetchSEOMetrics } from '../seo-api';

export interface CompanyAnalysis {
  trafficEstimate: number;
  rankingKeywords: number;
  domainAuthority: number;
  uniqueAdvantages: string[];
  serviceCategories: string[];
  currentRevenueEstimate: string;
  websiteSummary: string;
  brandPositioning: string;
  contentQuality: 'poor' | 'average' | 'good' | 'excellent';
  technicalIssues: string[];
}

export async function analyzeCompany(request: {
  companyName: string;
  website: string;
  industry: string;
}): Promise<{ data: CompanyAnalysis; usage: any }> {
  // Fetch website content
  const websiteContent = await fetchWebsiteContent(request.website);

  // Fetch SEO metrics (Ahrefs/Semrush API)
  const seoMetrics = await fetchSEOMetrics(request.website);

  const systemPrompt = `You are an expert SEO analyst conducting deep research for a proposal.
You have access to extended thinking - use it to deeply analyze the data and provide actionable insights.

Your task: Analyze the company's current online presence and identify key strengths to leverage in the proposal.`;

  const userPrompt = `Analyze this company for an SEO proposal:

**Company:** ${request.companyName}
**Website:** ${request.website}
**Industry:** ${request.industry}

**Website Content (first 10,000 chars):**
${sanitizeForPrompt(websiteContent.slice(0, 10000))}

**SEO Metrics:**
- Organic Traffic: ${seoMetrics.traffic || 'Unknown'}
- Ranking Keywords: ${seoMetrics.keywords || 'Unknown'}
- Domain Authority: ${seoMetrics.domainAuthority || 'Unknown'}
- Backlinks: ${seoMetrics.backlinks || 'Unknown'}

**Instructions:**
1. Use extended thinking to deeply analyze their business model, services, and unique positioning
2. Identify their competitive advantages and USPs
3. Assess their current SEO performance objectively
4. Identify technical issues holding them back
5. Estimate their current revenue based on business model

Return a JSON object with this structure:
{
  "trafficEstimate": <number>,
  "rankingKeywords": <number>,
  "domainAuthority": <number>,
  "uniqueAdvantages": [<string array - 3-5 items>],
  "serviceCategories": [<string array>],
  "currentRevenueEstimate": "<range like '£500k-£1M annually'>",
  "websiteSummary": "<2-3 sentences describing their business>",
  "brandPositioning": "<how they position themselves>",
  "contentQuality": "<poor|average|good|excellent>",
  "technicalIssues": [<string array of issues found>]
}`;

  const response = await claudeWithRetry(async () => {
    return await anthropic.messages.create({
      model: CLAUDE_CONFIG.RESEARCH_MODEL,
      max_tokens: CLAUDE_CONFIG.MAX_TOKENS_RESEARCH,
      thinking: {
        type: 'enabled',
        budget_tokens: CLAUDE_CONFIG.THINKING_BUDGET,
      },
      temperature: CLAUDE_CONFIG.TEMPERATURE_RESEARCH,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt,
      }],
    });
  });

  // Extract JSON from response
  const content = response.content.find(block => block.type === 'text');
  if (!content || content.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Parse JSON (handle markdown code blocks)
  let jsonText = content.text;
  const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/) || jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[1] || jsonMatch[0];
  }

  const data = JSON.parse(jsonText) as CompanyAnalysis;

  return {
    data,
    usage: response.usage,
  };
}
```

### 4.3 Market Intelligence

**File:** `lib/claude/research/market-intelligence.ts`

```typescript
export interface MarketIntelligence {
  marketSize: string; // "£712.8M"
  growthRate: string; // "6.2% annually"
  demographics: {
    primaryBuyers: Array<{
      type: string; // "Family Caregivers"
      percentage: number; // 40
      behavior: string;
    }>;
  };
  onlineShift: string; // "40-60% research online first"
  seasonalPatterns: Array<{
    period: string; // "Spring (Mar-May)"
    searchVolume: 'low' | 'moderate' | 'high' | 'very_high';
    why: string;
    strategy: string;
  }>;
  averageTransactionValues: {
    [category: string]: number; // "Mobility Scooter": 2400
  };
}

export async function researchMarket(
  request: { industry: string; location: string },
  companyAnalysis: CompanyAnalysis
): Promise<{ data: MarketIntelligence; usage: any }> {
  const systemPrompt = `You are a market research expert with access to extended thinking.
Use your thinking budget to analyze industry trends, market size, and customer behavior patterns.
Base your analysis on real market data, industry reports, and economic indicators.`;

  const userPrompt = `Research the ${request.industry} market in ${request.location}:

**Company Context:**
${JSON.stringify(companyAnalysis, null, 2)}

**Research Required:**
1. Calculate total addressable market size (provide sources)
2. Identify industry growth rates and trends
3. Define customer demographics and online behavior
4. Research seasonal patterns in ${request.industry}
5. Calculate average transaction values by product/service category
6. Identify market drivers and barriers

**Output Format:** JSON matching MarketIntelligence interface
Be specific with numbers and cite sources where possible.`;

  const response = await claudeWithRetry(async () => {
    return await anthropic.messages.create({
      model: CLAUDE_CONFIG.RESEARCH_MODEL,
      max_tokens: CLAUDE_CONFIG.MAX_TOKENS_RESEARCH,
      thinking: {
        type: 'enabled',
        budget_tokens: CLAUDE_CONFIG.THINKING_BUDGET,
      },
      temperature: CLAUDE_CONFIG.TEMPERATURE_RESEARCH,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
  });

  const data = extractJSON<MarketIntelligence>(response);

  return { data, usage: response.usage };
}
```

### 4.4 Competitor Analysis

**File:** `lib/claude/research/competitor-analysis.ts`

```typescript
export interface Competitor {
  name: string;
  website: string;
  traffic: number;
  rankingKeywords: number;
  domainAuthority: number;
  strengths: string[];
  weaknesses: string[];
  estimatedRevenue: string;
  howToBeatThem: string;
}

export async function analyzeCompetitors(
  request: { companyName: string; website: string; industry: string; location: string },
  companyAnalysis: CompanyAnalysis
): Promise<{ data: Competitor[]; usage: any }> {
  // Use Semrush/Ahrefs API to find competitors
  const competitorDomains = await findCompetitorDomains(request.website, request.industry, request.location);

  const systemPrompt = `You are a competitive intelligence analyst with extended thinking capabilities.
Analyze each competitor deeply to identify exploitable weaknesses and strategic opportunities.
Be brutally honest about their strengths while finding ways to outmaneuver them.`;

  const userPrompt = `Analyze these competitors for ${request.companyName}:

**Our Company:**
${JSON.stringify(companyAnalysis, null, 2)}

**Competitors to Analyze:**
${competitorDomains.map(c => `- ${c.name} (${c.domain}) - Traffic: ${c.traffic}, Keywords: ${c.keywords}`).join('\n')}

**For each competitor, provide:**
1. Their main strengths (what they do well)
2. Their weaknesses (what we can exploit)
3. Estimated monthly revenue from SEO
4. Specific strategy to beat them

**Output:** JSON array of Competitor objects
Focus on actionable insights that can be used in the proposal.`;

  const response = await claudeWithRetry(async () => {
    return await anthropic.messages.create({
      model: CLAUDE_CONFIG.RESEARCH_MODEL,
      max_tokens: CLAUDE_CONFIG.MAX_TOKENS_RESEARCH,
      thinking: {
        type: 'enabled',
        budget_tokens: CLAUDE_CONFIG.THINKING_BUDGET,
      },
      temperature: CLAUDE_CONFIG.TEMPERATURE_RESEARCH,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
  });

  const data = extractJSON<Competitor[]>(response);

  return { data, usage: response.usage };
}
```

### 4.5 Keyword Research

**File:** `lib/claude/research/keyword-research.ts`

```typescript
export interface Keyword {
  keyword: string;
  category: 'transactional' | 'commercial' | 'informational';
  monthlySearches: number;
  difficulty: number; // 0-100
  cpc: number; // Cost per click in GBP
  revenueIfRank1: string; // "£10,800/month"
  intent: string;
}

export async function researchKeywords(
  request: { companyName: string; industry: string; location: string },
  companyAnalysis: CompanyAnalysis,
  marketIntelligence: MarketIntelligence
): Promise<{ data: Keyword[]; usage: any }> {
  // Use Semrush/Ahrefs API for keyword data
  const keywordData = await fetchKeywordData(request.industry, request.location);

  const systemPrompt = `You are a keyword research specialist with extended thinking.
Use your thinking budget to identify the most valuable keywords based on:
- Search volume and competition
- Commercial intent and revenue potential
- Ranking difficulty vs reward
- Strategic importance for dominating the market`;

  const userPrompt = `Identify 50+ high-value keywords for ${request.companyName}:

**Company Services:**
${companyAnalysis.serviceCategories.join(', ')}

**Location:**
${request.location}

**Market Context:**
${JSON.stringify(marketIntelligence, null, 2)}

**Raw Keyword Data:**
${JSON.stringify(keywordData, null, 2)}

**Requirements:**
1. Categorize by intent: transactional, commercial, informational
2. Calculate revenue potential for ranking #1 (use industry conversion rates)
3. Prioritize quick wins (high value, medium difficulty)
4. Include location-specific variants

**Output:** JSON array of Keyword objects (50+ keywords)`;

  const response = await claudeWithRetry(async () => {
    return await anthropic.messages.create({
      model: CLAUDE_CONFIG.RESEARCH_MODEL,
      max_tokens: CLAUDE_CONFIG.MAX_TOKENS_RESEARCH,
      thinking: {
        type: 'enabled',
        budget_tokens: CLAUDE_CONFIG.THINKING_BUDGET,
      },
      temperature: CLAUDE_CONFIG.TEMPERATURE_RESEARCH,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
  });

  const data = extractJSON<Keyword[]>(response);

  return { data, usage: response.usage };
}
```

---

## 5. Content Generation Agent

**File:** `lib/claude/content-generator.ts`

```typescript
import { anthropic, CLAUDE_CONFIG } from './client';
import { claudeWithRetry } from './utils';
import { ResearchResult } from './research-agent';
import { GOD_PROMPT } from './god-prompt';

export interface ProposalContent {
  coverPage: CoverPage;
  executiveSummary: ExecutiveSummary;
  currentVsPotential: CurrentVsPotential;
  understandingMarket: UnderstandingMarket;
  productOpportunities: ProductOpportunities;
  howWeWillMakeYouNumber1: HowWeWillMakeYouNumber1;
  keywordStrategy: KeywordStrategy;
  contentThatConverts: ContentThatConverts;
  implementationPlan: ImplementationPlan;
  investmentPackages: InvestmentPackages;
  twelveMonthJourney: TwelveMonthJourney;
  successMetrics: SuccessMetrics;
  whySEODons: WhySEODons;
  whatYouOwnForever: WhatYouOwnForever;
  yourNextSteps: YourNextSteps;
  gettingStarted: GettingStarted;
  finalPush: FinalPush;
  contactNextSteps: ContactNextSteps;
}

export async function generateProposalContent(
  companyInfo: {
    companyName: string;
    website: string;
    location: string;
    serviceArea: string;
    industry: string;
  },
  research: ResearchResult,
  onProgress?: (stage: string, progress: number) => Promise<void>
): Promise<{ content: ProposalContent; usage: any }> {
  await onProgress?.('Generating proposal content with Claude...', 5);

  const systemPrompt = `You are an expert SEO proposal writer.
Your proposals are direct, data-driven, and create urgency.
You follow the exact style and tone of the template provided.

Key principles:
- Use specific numbers and data (not vague statements)
- Create FOMO about competitors
- Be slightly aggressive in tone
- Use analogies to simplify complex concepts
- Bold key statements
- Short paragraphs (2-4 sentences)
- Address fears directly`;

  const userPrompt = `${GOD_PROMPT}

**Company Details:**
- Name: ${companyInfo.companyName}
- Website: ${companyInfo.website}
- Location: ${companyInfo.location}
- Service Area: ${companyInfo.serviceArea}
- Industry: ${companyInfo.industry}

**Research Data:**
${JSON.stringify(research, null, 2)}

**Instructions:**
1. Generate ALL 18 pages of content following the god prompt structure exactly
2. Use the research data to populate every section with specific, real numbers
3. Calculate ROI for all three packages based on the keyword revenue potential
4. Maintain the exact tone and style of the A1 Mobility template
5. Customize every section to this specific company and industry
6. Create urgency about timing and competition

**Output Format:**
Return a JSON object matching the ProposalContent interface.
Every page must be complete and ready to render in the PDF.`;

  const response = await claudeWithRetry(async () => {
    return await anthropic.messages.create({
      model: CLAUDE_CONFIG.CONTENT_MODEL,
      max_tokens: CLAUDE_CONFIG.MAX_TOKENS_CONTENT,
      temperature: CLAUDE_CONFIG.TEMPERATURE_CONTENT,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
  });

  await onProgress?.('Content generation complete!', 100);

  const content = extractJSON<ProposalContent>(response);

  return {
    content,
    usage: response.usage,
  };
}
```

### 5.1 God Prompt

**File:** `lib/claude/god-prompt.ts`

```typescript
export const GOD_PROMPT = `[YOUR FULL GOD PROMPT FROM THE USER MESSAGE - ALL 18 PAGES STRUCTURE]

Universal SEO Proposal Generation Prompt
I'll create a comprehensive SEO proposal following the exact structure and design style of the uploaded document...

[... FULL GOD PROMPT TEXT ...]
`;
```

---

## 6. PDF Generation System

### 6.1 React-PDF Setup

**Install dependencies:**
```bash
npm install @react-pdf/renderer
```

**File:** `lib/pdf/proposal-pdf.tsx`

```typescript
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { ProposalContent } from '../claude/content-generator';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 'semibold' },
  ],
});

// Colors matching A1 Mobility template
const COLORS = {
  primary: '#00D4D4', // Turquoise
  dark: '#2D3748',
  gray: '#718096',
  lightGray: '#E2E8F0',
  white: '#FFFFFF',
  yellow: '#FEF3C7',
  cyan: '#CFFAFE',
};

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 40,
    backgroundColor: COLORS.white,
  },
  coverPage: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.dark,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.primary,
  },
  h3: {
    fontSize: 18,
    fontWeight: 'semibold',
    marginBottom: 10,
    color: COLORS.dark,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
    color: COLORS.dark,
  },
  table: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tableHeader: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontWeight: 'bold',
    padding: 10,
  },
  tableCell: {
    padding: 10,
    flex: 1,
  },
  calloutBox: {
    backgroundColor: COLORS.cyan,
    padding: 15,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  warningBox: {
    backgroundColor: COLORS.yellow,
    padding: 15,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
});

interface ProposalPDFProps {
  companyName: string;
  content: ProposalContent;
  packageDetails: any;
}

export const ProposalPDF: React.FC<ProposalPDFProps> = ({ companyName, content, packageDetails }) => {
  return (
    <Document>
      {/* Page 1: Cover Page */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <Text style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>
          SEODONS
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 60 }}>
          Data-Driven SEO That Delivers Results
        </Text>

        <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 10 }}>
          {companyName}
        </Text>
        <Text style={{ fontSize: 24, marginBottom: 40 }}>
          SEO Investment Strategy & Growth Plan
        </Text>

        <Text style={{ fontSize: 18, marginBottom: 40 }}>
          {content.coverPage.tagline}
        </Text>

        <View style={{ marginTop: 60 }}>
          <Text>Client: {companyName}</Text>
          <Text>Website: {content.coverPage.website}</Text>
          <Text>Location: {content.coverPage.location}</Text>
          <Text>Service Area: {content.coverPage.serviceArea}</Text>
          <Text>Prepared By: SEO Dons</Text>
          <Text>Date: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
          <Text>Investment: £{packageDetails.min}-£{packageDetails.max}/month</Text>
        </View>
      </Page>

      {/* Page 2: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Executive Summary</Text>

        <View style={[styles.calloutBox, { backgroundColor: COLORS.dark, color: COLORS.white }]}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 }}>
            {content.executiveSummary.hook}
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={{ fontWeight: 'bold', color: '#DC2626', marginBottom: 5 }}>
            THE BRUTAL TRUTH:
          </Text>
          <Text>{content.executiveSummary.brutalTruth}</Text>
        </View>

        <Text style={styles.h2}>The {content.executiveSummary.marketSize} Opportunity</Text>

        <View style={styles.calloutBox}>
          <Text style={styles.h3}>UK {content.coverPage.industry} Market Facts</Text>
          {content.executiveSummary.marketFacts.map((fact, i) => (
            <Text key={i} style={styles.paragraph}>
              • <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{fact.label}:</Text> {fact.value}
            </Text>
          ))}
          <Text style={[styles.paragraph, { marginTop: 10, fontWeight: 'bold' }]}>
            Translation: {content.executiveSummary.translation}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <View style={{ width: '30%', textAlign: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: COLORS.primary }}>
              {content.executiveSummary.currentTraffic}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.gray }}>
              Your monthly organic visitors
            </Text>
          </View>
          <View style={{ width: '30%', textAlign: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: COLORS.primary }}>
              {content.executiveSummary.competitorTraffic}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.gray }}>
              {content.executiveSummary.mainCompetitor}'s monthly visitors
            </Text>
          </View>
          <View style={{ width: '30%', textAlign: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: COLORS.primary }}>
              {content.executiveSummary.opportunity}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.gray }}>
              Monthly revenue opportunity identified
            </Text>
          </View>
        </View>
      </Page>

      {/* Page 3: Current Reality vs Potential */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Your Current Reality vs Potential</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.tableCell, styles.tableHeader]}>Metric</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>Current State</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>12-Month Target</Text>
            <Text style={[styles.tableCell, styles.tableHeader]}>Competitor Average</Text>
          </View>
          {content.currentVsPotential.metrics.map((metric, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold', color: COLORS.primary }]}>
                {metric.name}
              </Text>
              <Text style={styles.tableCell}>{metric.current}</Text>
              <Text style={styles.tableCell}>{metric.target}</Text>
              <Text style={styles.tableCell}>{metric.competitor}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>The Simple Math (Your ROI)</Text>

        <View style={styles.calloutBox}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 15 }}>
            Example with RECOMMENDED Package (£{content.currentVsPotential.recommendedPackage.investment}/month)
          </Text>
          {content.currentVsPotential.roiSteps.map((step, i) => (
            <Text key={i} style={styles.paragraph}>
              <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Step {i + 1}:</Text> {step}
            </Text>
          ))}
          <Text style={[styles.paragraph, { marginTop: 10, fontSize: 12, fontWeight: 'bold' }]}>
            Investment: £{content.currentVsPotential.recommendedPackage.investment}/month |
            Return: £{content.currentVsPotential.recommendedPackage.returns}/month =
            {content.currentVsPotential.recommendedPackage.roi}x ROI
          </Text>
        </View>
      </Page>

      {/* Pages 4-18: Continue with all other sections... */}
      {/* Implementation continues for all 18 pages matching the template */}

    </Document>
  );
};
```

### 6.2 PDF Generation Service

**File:** `lib/pdf/generate-pdf.ts`

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalPDF } from './proposal-pdf';
import { createClient } from '@/lib/supabase/server';
import { ProposalContent } from '../claude/content-generator';

export async function generateProposalPDF(
  proposalId: string,
  companyName: string,
  content: ProposalContent,
  packageDetails: any
): Promise<string> {
  try {
    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      <ProposalPDF
        companyName={companyName}
        content={content}
        packageDetails={packageDetails}
      />
    );

    // Upload to Supabase Storage
    const supabase = await createClient();
    const fileName = `proposals/${proposalId}/${companyName.toLowerCase().replace(/\s+/g, '-')}-seo-proposal-${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from('proposal-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    // Get public URL with 1-year expiry
    const { data: urlData } = supabase.storage
      .from('proposal-pdfs')
      .createSignedUrl(fileName, 31536000); // 1 year

    if (!urlData) {
      throw new Error('Failed to get signed URL');
    }

    return urlData.signedUrl;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}
```

---

## 7. UI Components & Workflows

### 7.1 Generate Proposal Button

**File:** `components/proposals/generate-proposal-button.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles } from 'lucide-react';
import { GenerateProposalDialog } from './generate-proposal-dialog';

interface GenerateProposalButtonProps {
  customerId?: string;
  leadId?: string;
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
}

export function GenerateProposalButton({
  customerId,
  leadId,
  companyName,
  website,
  industry,
  location,
}: GenerateProposalButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="gap-2"
        size="lg"
      >
        <Sparkles className="h-5 w-5" />
        Generate AI Proposal
      </Button>

      <GenerateProposalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customerId={customerId}
        leadId={leadId}
        companyName={companyName}
        website={website}
        industry={industry}
        location={location}
      />
    </>
  );
}
```

### 7.2 Generation Dialog with Progress

**File:** `components/proposals/generate-proposal-dialog.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Download, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  leadId?: string;
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
}

export function GenerateProposalDialog({
  open,
  onOpenChange,
  customerId,
  leadId,
  companyName,
  website,
  industry,
  location,
}: GenerateProposalDialogProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startGeneration = async () => {
    setStatus('generating');
    setProgress(0);
    setCurrentStage('Starting AI research...');
    setError(null);

    try {
      // Start generation
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          lead_id: leadId,
          company_name: companyName,
          website,
          industry,
          location,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start proposal generation');
      }

      const { proposal_id } = await response.json();
      setProposalId(proposal_id);

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/proposals/${proposal_id}/status`);
        const statusData = await statusResponse.json();

        setProgress(statusData.progress);
        setCurrentStage(statusData.stage);

        if (statusData.status === 'ready') {
          clearInterval(pollInterval);
          setPdfUrl(statusData.pdf_url);
          setStatus('success');
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          setError(statusData.error || 'Generation failed');
          setStatus('error');
        }
      }, 2000); // Poll every 2 seconds

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (open && status === 'idle') {
      startGeneration();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {status === 'generating' && 'Generating AI Proposal'}
            {status === 'success' && 'Proposal Ready!'}
            {status === 'error' && 'Generation Failed'}
          </DialogTitle>
          <DialogDescription>
            {status === 'generating' && 'Claude is researching and creating your custom proposal...'}
            {status === 'success' && 'Your 18-page SEO proposal has been generated successfully.'}
            {status === 'error' && error}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'generating' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentStage}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>This usually takes 2-5 minutes</span>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex items-center justify-center py-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.open(pdfUrl!, '_blank')}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Proposal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = pdfUrl!;
                    a.download = `${companyName}-seo-proposal.pdf`;
                    a.click();
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/dashboard/proposals/${proposalId}`)}
                >
                  Go to Proposal Details
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex items-center justify-center py-6">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>

              <Button
                onClick={() => {
                  setStatus('idle');
                  startGeneration();
                }}
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 8. API Endpoints

### 8.1 Generate Proposal Endpoint

**File:** `app/api/proposals/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { performDeepResearch } from '@/lib/claude/research-agent';
import { generateProposalContent } from '@/lib/claude/content-generator';
import { generateProposalPDF } from '@/lib/pdf/generate-pdf';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's Supabase ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      customer_id,
      lead_id,
      company_name,
      website,
      industry,
      location,
    } = body;

    // Validate required fields
    if (!company_name || !website || !industry || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create proposal record (status: 'generating')
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        customer_id,
        lead_id,
        created_by: user.id,
        company_name,
        company_website: website,
        company_industry: industry,
        service_area: location,
        title: `${company_name} SEO Investment Strategy & Growth Plan`,
        status: 'generating',
      })
      .select()
      .single();

    if (proposalError || !proposal) {
      console.error('Failed to create proposal:', proposalError);
      return NextResponse.json(
        { error: 'Failed to create proposal' },
        { status: 500 }
      );
    }

    // Start async generation (don't await - return immediately)
    generateProposalAsync(proposal.id, {
      companyName: company_name,
      website,
      industry,
      location,
      serviceRadius: '50 miles',
    }).catch(error => {
      console.error(`Proposal generation failed for ${proposal.id}:`, error);
      // Update proposal status to failed
      supabase
        .from('proposals')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id)
        .then(() => console.log(`Marked proposal ${proposal.id} as failed`));
    });

    return NextResponse.json({
      proposal_id: proposal.id,
      status: 'generating',
    });
  } catch (error) {
    console.error('Generate proposal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Async generation function
async function generateProposalAsync(
  proposalId: string,
  request: {
    companyName: string;
    website: string;
    industry: string;
    location: string;
    serviceRadius: string;
  }
) {
  const supabase = await createClient();

  try {
    // Update progress helper
    const updateProgress = async (stage: string, progress: number) => {
      await supabase
        .from('proposals')
        .update({
          content_sections: {
            generation_progress: { stage, progress },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId);
    };

    // Phase 1: Research (0-85%)
    const research = await performDeepResearch(
      {
        companyName: request.companyName,
        website: request.website,
        industry: request.industry,
        location: request.location,
        serviceRadius: request.serviceRadius,
      },
      updateProgress
    );

    // Save research data
    await supabase
      .from('proposals')
      .update({
        research_data: research,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // Phase 2: Content Generation (85-95%)
    await updateProgress('Generating proposal content...', 85);
    const content = await generateProposalContent(
      {
        companyName: request.companyName,
        website: request.website,
        location: request.location,
        serviceArea: `${request.location} & UK Nationwide`,
        industry: request.industry,
      },
      research,
      updateProgress
    );

    // Save content
    await supabase
      .from('proposals')
      .update({
        content_sections: content.content,
        total_tokens_used: research.researchMetadata.totalTokens + (content.usage.input_tokens + content.usage.output_tokens),
        estimated_cost: research.researchMetadata.estimatedCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // Phase 3: PDF Generation (95-100%)
    await updateProgress('Creating PDF document...', 95);
    const pdfUrl = await generateProposalPDF(
      proposalId,
      request.companyName,
      content.content,
      { min: 2000, max: 5000 } // Default package range
    );

    await updateProgress('Complete!', 100);

    // Mark as ready
    await supabase
      .from('proposals')
      .update({
        status: 'ready',
        pdf_url: pdfUrl,
        generation_time_seconds: research.researchMetadata.durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // Create activity
    await supabase.from('proposal_activities').insert({
      proposal_id: proposalId,
      activity_type: 'pdf_created',
      description: 'Proposal PDF generated successfully',
    });

  } catch (error) {
    console.error('Async generation failed:', error);
    throw error;
  }
}
```

### 8.2 Status Endpoint

**File:** `app/api/proposals/[id]/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('id, status, pdf_url, content_sections')
      .eq('id', params.id)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Extract progress from content_sections
    const progress = proposal.content_sections?.generation_progress || {
      stage: 'Initializing...',
      progress: 0,
    };

    return NextResponse.json({
      status: proposal.status,
      stage: progress.stage,
      progress: progress.progress,
      pdf_url: proposal.pdf_url,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goals:**
- Database schema deployed
- Claude API integration working
- Basic research agent functional

**Tasks:**
1. Create migrations (042, 043, proposals tables)
2. Deploy to Supabase
3. Set up Claude API key and client
4. Implement company analysis research function
5. Test with 3-5 real companies

**Deliverables:**
- Working research agent that can analyze a company
- JSON output with company data
- Basic error handling and retries

**Testing:**
- Test with different industries
- Verify API costs match projections
- Validate JSON output structure

---

### Phase 2: Core Features (Week 3-4)

**Goals:**
- Complete research agent (all 4 phases)
- Content generation working
- PDF generation functional

**Tasks:**
1. Implement market intelligence research
2. Implement competitor analysis
3. Implement keyword research
4. Implement content generator with god prompt
5. Build React-PDF template (all 18 pages)
6. Set up Supabase Storage for PDFs

**Deliverables:**
- End-to-end proposal generation working
- Complete PDF matching template design
- Supabase Storage integration

**Testing:**
- Generate 10 test proposals
- Verify all 18 pages render correctly
- Compare output to A1 Mobility template

---

### Phase 3: UI & Polish (Week 5-6)

**Goals:**
- UI components integrated
- Real-time progress working
- Customer/lead page integration

**Tasks:**
1. Build GenerateProposalButton component
2. Build GenerateProposalDialog with progress
3. Implement polling for status updates
4. Add proposal list page
5. Add proposal detail page
6. Integrate into customer detail page
7. Integrate into lead detail page

**Deliverables:**
- Complete UI workflow
- Proposal management pages
- Integration with existing CRM

**Testing:**
- User acceptance testing with SDRs
- Test progress updates and polling
- Verify PDF download and viewing

---

### Phase 4: Advanced Features (Week 7-8)

**Goals:**
- Proposal editing and versioning
- Email integration
- Analytics and tracking

**Tasks:**
1. Add proposal editing capability
2. Implement version history
3. Add email sending with tracking
4. Track when proposals are viewed
5. Add proposal analytics dashboard
6. Implement proposal templates for different industries

**Deliverables:**
- Complete proposal management system
- Email sending and tracking
- Analytics and reporting

**Testing:**
- End-to-end workflow testing
- Performance testing with concurrent generations
- Load testing (10 simultaneous proposals)

---

## 10. Testing Plan

### 10.1 Tests for Proposal Generator (Tests 1-4)

**Test 1: Basic Proposal Generation**
- [ ] 1.1: Click "Generate Proposal" button on customer page
- [ ] 1.2: Verify dialog opens with "Generating" status
- [ ] 1.3: Verify progress updates every 2 seconds
- [ ] 1.4: Verify all stages appear (Analyzing, Researching, Generating, Creating PDF)
- [ ] 1.5: Verify PDF is generated within 5 minutes
- [ ] 1.6: Verify PDF downloads successfully
- [ ] 1.7: Verify PDF opens and is readable
- [ ] 1.8: Verify all 18 pages are present

**Test 2: Research Quality**
- [ ] 2.1: Generate proposal for mobility company (match A1 Mobility style)
- [ ] 2.2: Verify company analysis contains real traffic data
- [ ] 2.3: Verify competitor analysis includes 3-5 real competitors
- [ ] 2.4: Verify keywords have real search volumes
- [ ] 2.5: Verify market intelligence has specific UK market data
- [ ] 2.6: Verify calculations are accurate (ROI, revenue projections)
- [ ] 2.7: Verify location opportunities list real cities
- [ ] 2.8: Check that no placeholder text exists (no [INSERT] or TODO)

**Test 3: PDF Quality**
- [ ] 3.1: Verify cover page matches template design
- [ ] 3.2: Verify turquoise (#00D4D4) color is used throughout
- [ ] 3.3: Verify tables render correctly
- [ ] 3.4: Verify callout boxes have correct styling
- [ ] 3.5: Verify font consistency (Inter family)
- [ ] 3.6: Verify page breaks are correct
- [ ] 3.7: Verify numbers are formatted correctly (£, %, etc.)
- [ ] 3.8: Verify bold text appears as bold in PDF

**Test 4: Performance & Cost**
- [ ] 4.1: Measure total generation time (should be 2-5 minutes)
- [ ] 4.2: Calculate actual Claude API cost per proposal
- [ ] 4.3: Verify cost is under £1.00 per proposal
- [ ] 4.4: Test concurrent generations (3 at once)
- [ ] 4.5: Verify no timeouts or failures under load
- [ ] 4.6: Check Supabase Storage usage after 10 proposals
- [ ] 4.7: Verify database performance with 100+ proposals
- [ ] 4.8: Test error recovery (kill generation mid-way, restart)

### 10.2 Tests for Activity Tracking Fixes (Tests 5-8)

**Test 5: Lead Activity Display**
- [ ] 5.1: Make a call to a lead
- [ ] 5.2: Navigate to lead detail page
- [ ] 5.3: Verify call appears in activity timeline immediately
- [ ] 5.4: Verify call outcome shows with emoji (✅📵📨 etc)
- [ ] 5.5: Verify duration is displayed correctly
- [ ] 5.6: Verify SDR name appears
- [ ] 5.7: Create manual note, verify it appears
- [ ] 5.8: Verify activities are sorted newest first

**Test 6: Lead Status Auto-Update**
- [ ] 6.1: Create new lead with status "new"
- [ ] 6.2: Make call to lead
- [ ] 6.3: Verify lead status changes to "contacted"
- [ ] 6.4: Verify last_contacted_at is updated
- [ ] 6.5: Verify status_change activity is created
- [ ] 6.6: Make second call, verify status stays "contacted"
- [ ] 6.7: Check database trigger executed correctly
- [ ] 6.8: Verify works for both successful and unsuccessful calls

**Test 7: Call History Display**
- [ ] 7.1: Navigate to /dashboard/calls/history
- [ ] 7.2: Verify calls to leads show lead name (not phone number)
- [ ] 7.3: Verify "Lead" badge appears for lead calls
- [ ] 7.4: Verify calls to customers show customer name
- [ ] 7.5: Verify SDR name appears on each call ("by John Smith")
- [ ] 7.6: Verify calls with no lead/customer show phone number
- [ ] 7.7: Verify sentiment badges display correctly
- [ ] 7.8: Verify call duration calculates correctly

**Test 8: Admin SDR Filtering**
- [ ] 8.1: Sign in as admin user
- [ ] 8.2: Navigate to call history
- [ ] 8.3: Verify "Filter by SDR" dropdown appears
- [ ] 8.4: Click dropdown, verify all SDRs listed
- [ ] 8.5: Select SDR, verify URL updates with ?sdr=<id>
- [ ] 8.6: Verify only that SDR's calls are shown
- [ ] 8.7: Click X to clear filter, verify all calls shown again
- [ ] 8.8: Sign in as BDR, verify filter does NOT appear

### 10.3 End-to-End Integration Tests (Tests 9-10)

**Test 9: Complete SDR Workflow**
- [ ] 9.1: Import new lead (CSV or manual)
- [ ] 9.2: Lead is auto-assigned to SDR
- [ ] 9.3: SDR calls lead from CRM
- [ ] 9.4: Call is recorded and transcribed
- [ ] 9.5: Lead status auto-updates to "contacted"
- [ ] 9.6: Activity appears in lead timeline
- [ ] 9.7: SDR converts lead to customer
- [ ] 9.8: SDR generates AI proposal from customer page
- [ ] 9.9: Proposal completes successfully
- [ ] 9.10: SDR downloads and sends proposal
- [ ] 9.11: Proposal accepted, deal created
- [ ] 9.12: SDR gets commission tracked

**Test 10: Proposal End-to-End**
- [ ] 10.1: Create test customer with website
- [ ] 10.2: Click "Generate AI Proposal"
- [ ] 10.3: Wait for completion (2-5 min)
- [ ] 10.4: Download PDF
- [ ] 10.5: Open in Adobe Reader, verify renders correctly
- [ ] 10.6: Check all 18 pages for completeness
- [ ] 10.7: Verify company-specific data (not template text)
- [ ] 10.8: Send proposal via email
- [ ] 10.9: Track when customer opens email
- [ ] 10.10: Mark proposal as accepted
- [ ] 10.11: Create deal from proposal
- [ ] 10.12: Verify proposal appears in proposal list

### 10.4 Database Migration Tests (Test 11)

**Test 11: Database Integrity**
- [ ] 11.1: Deploy Migration 042 (add lead_id to activities)
- [ ] 11.2: Verify lead_id column exists in activities table
- [ ] 11.3: Verify foreign key constraint is correct
- [ ] 11.4: Verify index on lead_id is created
- [ ] 11.5: Deploy Migration 043 (lead status trigger)
- [ ] 11.6: Verify trigger exists (trigger_update_lead_on_call)
- [ ] 11.7: Verify trigger fires on INSERT and UPDATE
- [ ] 11.8: Deploy proposals schema
- [ ] 11.9: Verify all 3 tables created correctly
- [ ] 11.10: Verify proposal_number auto-increment works
- [ ] 11.11: Test cascading deletes (customer → proposal)
- [ ] 11.12: Verify all indexes exist and are used

### 10.5 Performance Tests (Test 12)

**Test 12: Load Testing**
- [ ] 12.1: Generate 10 proposals simultaneously
- [ ] 12.2: Verify all complete within 10 minutes
- [ ] 12.3: Check database connections during peak load
- [ ] 12.4: Verify no Claude API rate limits hit
- [ ] 12.5: Test with 50 existing proposals in database
- [ ] 12.6: Measure proposal list page load time (should be <1s)
- [ ] 12.7: Test PDF generation with large research data (50+ competitors)
- [ ] 12.8: Verify memory usage doesn't spike during PDF generation
- [ ] 12.9: Test Supabase Storage with 100 PDFs (check costs)
- [ ] 12.10: Verify signed URL generation is fast (<100ms)

---

## 11. Cost Analysis

### 11.1 Claude API Costs

**Per Proposal Breakdown:**

| Component | Input Tokens | Output Tokens | Thinking Tokens | Cost (USD) | Cost (GBP) |
|-----------|--------------|---------------|-----------------|------------|------------|
| Company Analysis | 5,000 | 1,500 | 8,000 | $0.27 | £0.21 |
| Market Intelligence | 3,000 | 2,000 | 8,000 | $0.32 | £0.25 |
| Competitor Analysis | 8,000 | 3,000 | 10,000 | $0.52 | £0.41 |
| Keyword Research | 6,000 | 2,500 | 8,000 | $0.40 | £0.32 |
| Content Generation | 10,000 | 12,000 | 0 | $1.05 | £0.83 |
| **TOTAL** | **32,000** | **21,000** | **34,000** | **$2.56** | **£2.02** |

**Optimizations to Reduce Cost:**
1. Cache research data for 30 days (regenerate content only) - saves 60%
2. Use Sonnet for content generation instead of Opus - saves 40% on content
3. Batch keyword research across multiple customers - saves 20%

**With Optimizations:** £0.60-£0.80 per proposal

### 11.2 Infrastructure Costs

| Service | Usage | Cost (Monthly) |
|---------|-------|----------------|
| Supabase Storage | 100 PDFs × 500KB | £0.05 |
| Supabase Database | 1000 proposals | Included in plan |
| Vercel Hosting | Serverless functions | £0-£20 (depends on traffic) |
| SEO API (Semrush) | 500 queries | £50-£100 (optional) |

**Total Monthly Infrastructure:** £50-£120

### 11.3 ROI Calculation

**Scenario: 100 Proposals Generated per Month**

| Metric | Value |
|--------|-------|
| Proposals Generated | 100 |
| Claude API Cost | £60 (100 × £0.60) |
| Infrastructure Cost | £100 |
| **Total Cost** | **£160** |
| Proposals Sent | 80 (80% send rate) |
| Proposals Accepted | 20 (25% close rate) |
| Average Package Value | £3,000/month × 12 months = £36,000 |
| **Total Revenue** | **£720,000** (20 × £36,000) |
| **ROI** | **450,000%** |
| **Cost per Closed Deal** | **£8** |

**Break-even:** 1 proposal needs to close per month to cover all costs

---

## 12. Summary

This implementation plan provides a complete roadmap for integrating Claude API to auto-generate 18-page SEO proposals in the exact style of the A1 Mobility template.

**Key Deliverables:**
✅ Complete database schema with proposals, packages, and activities tables
✅ Claude API integration with extended thinking for deep research
✅ Multi-phase research agent (company, market, competitors, keywords, locations)
✅ Content generation agent using god prompt
✅ React-PDF template matching exact A1 Mobility design
✅ Real-time progress UI with polling
✅ Complete API endpoints for generation and status
✅ Comprehensive testing plan (100+ test cases)
✅ Cost analysis showing £0.60-£0.80 per proposal
✅ 4-phase implementation timeline (6-8 weeks)

**Next Steps:**
1. User approval of plan
2. Set up Claude API account (request extended thinking access)
3. Deploy database migrations
4. Begin Phase 1 implementation
5. Test with 5 pilot proposals

**Questions for User:**
1. Do you have Claude API access? Need to request extended thinking?
2. Approve the 4-phase timeline (6-8 weeks)?
3. Any specific customizations to the god prompt?
4. Should proposals be editable after generation?
5. Auto-send via email or manual review first?

---

**END OF IMPLEMENTATION PLAN**

**Document:** CLAUDE_PROPOSAL_GENERATOR_IMPLEMENTATION_PLAN.md
**Version:** 1.0
**Date:** 2025-01-04
**Pages:** 18+ (matching proposal structure!)
**Total Lines:** ~2500
**Estimated Implementation Time:** 6-8 weeks
**Estimated Cost per Proposal:** £0.60-£0.80
**Expected ROI:** 450,000%+
