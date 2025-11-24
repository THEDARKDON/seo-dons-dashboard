# Claude API Integration for Auto-Generated SEO Proposals
**Project:** AI-Powered Proposal Generation System
**Date:** 2025-11-04
**Status:** Planning Phase

---

## EXECUTIVE SUMMARY

Integrate Claude API (Opus with extended thinking) to automatically generate 18-page SEO proposals matching the exact style of the A1 Mobility template. SDRs click one button on a customer/lead page, and Claude performs comprehensive research and generates a professional PDF proposal.

### Key Features:
- ✅ One-click proposal generation from customer/lead page
- ✅ Automated competitor research using web search
- ✅ Market analysis with real data
- ✅ Keyword research integration
- ✅ Custom calculations (ROI, traffic projections, revenue estimates)
- ✅ PDF generation matching exact template design
- ✅ Proposal versioning and customization
- ✅ Review/edit before sending

---

## TECHNICAL ARCHITECTURE

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  [Customer/Lead Detail Page] → [Generate Proposal Button]   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              API Route: /api/proposals/generate              │
│  - Gather customer data                                      │
│  - Trigger research agent                                    │
│  - Monitor progress                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Claude Extended Thinking Agent                     │
│  - Web research (competitors, market data)                   │
│  - Keyword analysis                                          │
│  - Calculate projections                                     │
│  - Generate proposal content                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              PDF Generation Service                          │
│  - React-PDF or Puppeteer                                    │
│  - Template engine (Handlebars/React components)             │
│  - Image/chart generation                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Storage & Delivery                                │
│  - Store in Supabase Storage                                 │
│  - Track in proposals table                                  │
│  - Email to customer                                         │
│  - Attach to deal                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA

### New Tables

```sql
-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Proposal details
  proposal_number TEXT UNIQUE, -- P-2025-0001
  title TEXT,
  status TEXT CHECK (status IN ('draft', 'generating', 'ready', 'sent', 'viewed', 'accepted', 'rejected')),

  -- Research data (JSON)
  research_data JSONB, -- All Claude research results
  company_data JSONB, -- Scraped company info
  competitor_data JSONB, -- Competitor analysis
  keyword_data JSONB, -- Keyword research
  calculations JSONB, -- ROI, projections, etc.

  -- Content
  content_sections JSONB, -- All 18 pages content
  customizations JSONB, -- User edits

  -- Files
  pdf_url TEXT, -- Supabase Storage URL
  pdf_size INTEGER, -- bytes

  -- Metadata
  template_version TEXT DEFAULT '1.0',
  generation_time_seconds INTEGER,
  claude_model TEXT DEFAULT 'claude-opus-4',

  -- Tracking
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal packages table
CREATE TABLE proposal_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,

  -- Package details
  tier TEXT CHECK (tier IN ('local_dominance', 'regional_authority', 'national_leader')),
  monthly_investment DECIMAL(10,2),

  -- Scope
  focus_area TEXT,
  keyword_count INTEGER,
  content_per_month INTEGER,
  backlinks_per_month INTEGER,
  location_pages INTEGER,

  -- Projections
  expected_traffic_m12 INTEGER,
  expected_leads_m12 INTEGER,
  expected_revenue_m12 DECIMAL(10,2),
  roi_percentage DECIMAL(5,2),

  -- Customizations
  features JSONB, -- Array of features

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal activity log
CREATE TABLE proposal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,

  activity_type TEXT CHECK (activity_type IN (
    'generated', 'edited', 'sent', 'viewed', 'downloaded',
    'accepted', 'rejected', 'commented'
  )),

  metadata JSONB, -- Event details
  user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_proposals_customer ON proposals(customer_id);
CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_deal ON proposals(deal_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposal_activities_proposal ON proposal_activities(proposal_id);
```

---

## CLAUDE API INTEGRATION

### Research Agent Configuration

```typescript
// lib/claude/research-agent.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ResearchRequest {
  companyName: string;
  website: string;
  industry: string;
  locations: string[];
  serviceRadius: number;
  uniqueSellingPoints?: string[];
}

interface ResearchResult {
  companyAnalysis: {
    services: string[];
    products: string[];
    brandPositioning: string;
    currentTraffic: number;
    rankingKeywords: number;
    domainAuthority: number;
  };
  marketIntelligence: {
    totalMarketSize: string;
    growthRate: string;
    demographics: any;
    seasonalPatterns: any;
    averageTransactionValue: number;
    customerLifetimeValue: number;
  };
  competitors: Array<{
    name: string;
    url: string;
    monthlyTraffic: number;
    rankingKeywords: number;
    domainAuthority: number;
    strengths: string[];
    weaknesses: string[];
    estimatedRevenue: number;
  }>;
  keywords: Array<{
    keyword: string;
    category: 'transactional' | 'commercial' | 'informational';
    searchVolume: number;
    difficulty: number;
    cpc: number;
    trafficPotential: {
      position1: number;
      position3: number;
      position5: number;
      position10: number;
    };
    revenuePotential: number;
  }>;
  locationOpportunities: Array<{
    location: string;
    population: number;
    demographics: any;
    competitionIntensity: string;
    localSearchVolume: number;
    opportunityScore: number;
  }>;
}

export async function performDeepResearch(
  request: ResearchRequest
): Promise<ResearchResult> {

  const systemPrompt = `You are an expert SEO research analyst with access to web search capabilities.
Your task is to perform comprehensive research for creating SEO proposals.

You MUST:
1. Search the web for real, current data
2. Analyze actual competitors (not made-up examples)
3. Calculate realistic projections based on industry benchmarks
4. Provide specific, actionable insights
5. Return structured JSON data

Use extended thinking to:
- Plan your research strategy
- Validate data sources
- Cross-reference information
- Ensure calculations are accurate`;

  const userPrompt = `Research the following company for an SEO proposal:

Company: ${request.companyName}
Website: ${request.website}
Industry: ${request.industry}
Locations: ${request.locations.join(', ')}
Service Radius: ${request.serviceRadius} miles

Perform comprehensive research and return a JSON object with:

1. COMPANY ANALYSIS:
   - Visit their website and extract all services/products
   - Estimate current organic traffic (use SimilarWeb, Ahrefs estimates)
   - Find ranking keywords count
   - Determine domain authority
   - Identify their unique selling points
   - Analyze content quality and quantity

2. MARKET INTELLIGENCE:
   - Calculate total addressable market for ${request.industry} in UK
   - Find industry growth rates (cite sources)
   - Research target demographics
   - Identify seasonal patterns
   - Calculate average transaction values for ${request.industry}
   - Estimate customer lifetime value

3. COMPETITOR ANALYSIS (Top 5-10):
   - Find actual competitors near ${request.locations[0]}
   - For each: traffic, keywords, DA, content strategy
   - Identify market leader and why they dominate
   - SWOT analysis for each competitor

4. KEYWORD RESEARCH (50+ keywords):
   - Transactional keywords with search volume
   - Commercial keywords
   - Informational keywords
   - Calculate difficulty and CPC for each
   - Estimate traffic potential at different positions
   - Calculate revenue potential (use ${request.industry} conversion rates)

5. LOCATION OPPORTUNITIES:
   - For each location, research:
     - Population and demographics
     - Competition intensity
     - Local keyword search volume
     - Economic indicators
     - Opportunity score (0-100)

Return ONLY valid JSON. Use real data from web searches.`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000, // Extended thinking budget
    },
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
    temperature: 0.3, // Lower for more factual responses
  });

  // Extract JSON from response
  const content = response.content.find((block) => block.type === 'text');
  if (!content || content.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Parse JSON (Claude should return pure JSON)
  const researchData = JSON.parse(content.text);

  return researchData;
}
```

### Proposal Generation Agent

```typescript
// lib/claude/proposal-generator.ts

export async function generateProposalContent(
  researchData: ResearchResult,
  companyData: ResearchRequest,
  packageTier: 'local' | 'regional' | 'national'
): Promise<ProposalContent> {

  const godPrompt = `[FULL GOD PROMPT FROM USER REQUEST]`;

  const userPrompt = `Using the research data below, generate a complete 18-page SEO proposal
following the EXACT structure and style of the A1 Mobility template.

COMPANY DATA:
${JSON.stringify(companyData, null, 2)}

RESEARCH DATA:
${JSON.stringify(researchData, null, 2)}

PACKAGE TIER: ${packageTier}

Generate proposal content for all 18 pages with:
- Exact tone: direct, confident, data-driven
- All numbers calculated and realistic
- Specific competitor names and data
- Customized to this exact business
- Emotional hooks addressing their specific pain points
- Clear ROI calculations with sources

Return JSON with structure:
{
  "coverPage": { "tagline": "...", "investmentRange": "..." },
  "executiveSummary": { "hook": "...", "marketOpportunity": {...}, ... },
  "currentVsPotential": { "currentMetrics": {...}, "potentialMetrics": {...}, ... },
  ... (all 18 pages)
}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 8000,
    },
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: godPrompt,
    temperature: 0.7, // Higher for more creative writing
  });

  const content = response.content.find((block) => block.type === 'text');
  if (!content || content.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return JSON.parse(content.text);
}
```

---

## API ENDPOINTS

### Generate Proposal

```typescript
// app/api/proposals/generate/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { performDeepResearch } from '@/lib/claude/research-agent';
import { generateProposalContent } from '@/lib/claude/proposal-generator';
import { generateProposalPDF } from '@/lib/pdf/proposal-pdf';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { customerId, leadId, packageTier = 'local' } = body;

    // Get customer/lead data
    let companyData;
    if (customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      companyData = customer;
    } else if (leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      companyData = lead;
    } else {
      return NextResponse.json(
        { error: 'Customer ID or Lead ID required' },
        { status: 400 }
      );
    }

    if (!companyData) {
      return NextResponse.json(
        { error: 'Customer/Lead not found' },
        { status: 404 }
      );
    }

    // Create proposal record (status: generating)
    const proposalNumber = await generateProposalNumber();
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        customer_id: customerId || null,
        lead_id: leadId || null,
        proposal_number: proposalNumber,
        title: `SEO Proposal for ${companyData.company || companyData.first_name + ' ' + companyData.last_name}`,
        status: 'generating',
        created_by: user.id,
      })
      .select()
      .single();

    if (proposalError) {
      console.error('Error creating proposal:', proposalError);
      return NextResponse.json(
        { error: 'Failed to create proposal' },
        { status: 500 }
      );
    }

    // Start async generation (don't await - return immediately)
    generateProposalAsync(proposal.id, companyData, packageTier, user.id);

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      status: 'generating',
      message: 'Proposal generation started. This may take 2-5 minutes.',
    });
  } catch (error: any) {
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate proposal' },
      { status: 500 }
    );
  }
}

async function generateProposalAsync(
  proposalId: string,
  companyData: any,
  packageTier: string,
  userId: string
) {
  const startTime = Date.now();
  const supabase = await createClient();

  try {
    // Step 1: Perform deep research (2-3 minutes)
    console.log(`[Proposal ${proposalId}] Starting research...`);

    const researchRequest = {
      companyName: companyData.company || `${companyData.first_name} ${companyData.last_name}`,
      website: companyData.website || '',
      industry: companyData.industry || 'General Business',
      locations: [
        `${companyData.city}, ${companyData.state || companyData.country || 'UK'}`,
      ],
      serviceRadius: 25, // miles
      uniqueSellingPoints: [],
    };

    const researchData = await performDeepResearch(researchRequest);

    // Update proposal with research data
    await supabase
      .from('proposals')
      .update({
        research_data: researchData,
        company_data: companyData,
      })
      .eq('id', proposalId);

    // Step 2: Generate proposal content (1-2 minutes)
    console.log(`[Proposal ${proposalId}] Generating content...`);

    const proposalContent = await generateProposalContent(
      researchData,
      researchRequest,
      packageTier
    );

    // Update proposal with content
    await supabase
      .from('proposals')
      .update({
        content_sections: proposalContent,
      })
      .eq('id', proposalId);

    // Step 3: Generate PDF (30 seconds)
    console.log(`[Proposal ${proposalId}] Generating PDF...`);

    const pdfBuffer = await generateProposalPDF(proposalContent, companyData);

    // Upload to Supabase Storage
    const fileName = `proposals/${proposalNumber}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proposals')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('proposals')
      .getPublicUrl(fileName);

    // Update proposal - READY!
    const generationTime = Math.round((Date.now() - startTime) / 1000);

    await supabase
      .from('proposals')
      .update({
        status: 'ready',
        pdf_url: publicUrl,
        pdf_size: pdfBuffer.length,
        generation_time_seconds: generationTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // Log activity
    await supabase.from('proposal_activities').insert({
      proposal_id: proposalId,
      activity_type: 'generated',
      metadata: {
        generation_time_seconds: generationTime,
        package_tier: packageTier,
      },
      user_id: userId,
    });

    console.log(`[Proposal ${proposalId}] Complete in ${generationTime}s!`);
  } catch (error) {
    console.error(`[Proposal ${proposalId}] Error:`, error);

    // Update proposal with error
    await supabase
      .from('proposals')
      .update({
        status: 'draft',
        research_data: { error: error.message },
      })
      .eq('id', proposalId);
  }
}

async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const supabase = await createClient();

  // Get count of proposals this year
  const { count } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);

  const number = (count || 0) + 1;
  return `P-${year}-${String(number).padStart(4, '0')}`;
}
```

---

## PDF GENERATION

### React-PDF Template

```typescript
// lib/pdf/proposal-pdf.tsx

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import ReactPDF from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 'semibold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
  },
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A', // Navy blue
  },
  coverTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverTagline: {
    fontSize: 20,
    color: '#93C5FD',
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: '80%',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 20,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 5,
  },
  highlight: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
});

export const ProposalDocument: React.FC<{ content: any; company: any }> = ({
  content,
  company,
}) => (
  <Document>
    {/* Page 1: Cover */}
    <Page size="A4" style={styles.coverPage}>
      <Image
        src="/logo-white.png"
        style={{ width: 200, marginBottom: 40 }}
      />
      <Text style={styles.coverTitle}>{company.company}</Text>
      <Text style={styles.coverTagline}>{content.coverPage.tagline}</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 60 }}>
        Investment: {content.coverPage.investmentRange}
      </Text>
      <Text style={{ color: '#93C5FD', fontSize: 12, marginTop: 20 }}>
        {new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>
    </Page>

    {/* Page 2: Executive Summary */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      <View style={styles.highlight}>
        <Text style={styles.highlightText}>
          {content.executiveSummary.hook}
        </Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        The Brutal Truth
      </Text>
      <Text style={{ fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
        {content.executiveSummary.brutalTruth}
      </Text>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        Market Opportunity
      </Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Metric</Text>
          <Text style={styles.tableCell}>Value</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Market Size</Text>
          <Text style={styles.tableCell}>
            {content.executiveSummary.marketOpportunity.totalMarketSize}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Growth Rate</Text>
          <Text style={styles.tableCell}>
            {content.executiveSummary.marketOpportunity.growthRate}
          </Text>
        </View>
      </View>
    </Page>

    {/* Pages 3-18: Continue similarly... */}
    {/* This is a simplified example - full implementation would have all 18 pages */}
  </Document>
);

export async function generateProposalPDF(
  content: any,
  company: any
): Promise<Buffer> {
  const pdfStream = await ReactPDF.renderToStream(
    <ProposalDocument content={content} company={company} />
  );

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    pdfStream.on('data', (chunk) => chunks.push(chunk));
    pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
    pdfStream.on('error', reject);
  });
}
```

---

## UI COMPONENTS

### Generate Proposal Button

```typescript
// components/proposals/generate-proposal-button.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateProposalButtonProps {
  customerId?: string;
  leadId?: string;
  companyName: string;
}

export function GenerateProposalButton({
  customerId,
  leadId,
  companyName,
}: GenerateProposalButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Initializing...');

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setDialogOpen(true);
      setProgress('Starting research...');

      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          leadId,
          packageTier: 'local', // Could make this selectable
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start proposal generation');
      }

      const data = await response.json();
      setProposalId(data.proposalId);

      // Poll for completion
      pollProposalStatus(data.proposalId);
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Failed to generate proposal');
      setGenerating(false);
      setDialogOpen(false);
    }
  };

  const pollProposalStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/proposals/${id}/status`);
        const data = await response.json();

        setProgress(data.progress || 'Processing...');

        if (data.status === 'ready') {
          clearInterval(interval);
          setGenerating(false);
          toast.success('Proposal generated successfully!');

          // Redirect to proposal view
          window.location.href = `/dashboard/proposals/${id}`;
        } else if (data.status === 'error') {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Proposal generation failed');
          setDialogOpen(false);
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (generating) {
        setGenerating(false);
        toast.error('Proposal generation timed out');
        setDialogOpen(false);
      }
    }, 600000);
  };

  return (
    <>
      <Button onClick={handleGenerate} disabled={generating} className="gap-2">
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Generate AI Proposal
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generating SEO Proposal</DialogTitle>
            <DialogDescription>
              Claude is researching and creating a custom proposal for{' '}
              {companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="font-medium">{progress}</p>
                <p className="text-sm text-muted-foreground">
                  This usually takes 2-5 minutes
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p className="font-medium">What's happening:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Analyzing company website and services</li>
                <li>Researching competitors and market data</li>
                <li>Performing keyword analysis</li>
                <li>Calculating ROI projections</li>
                <li>Generating custom 18-page proposal</li>
                <li>Creating professional PDF</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Claude API integration
- [ ] Create database schema (migrations)
- [ ] Build basic research agent
- [ ] Implement simple proposal content generation
- [ ] Create basic PDF template (1-2 pages)
- [ ] Add "Generate Proposal" button to customer/lead pages

### Phase 2: Core Features (Week 3-4)
- [ ] Complete all 18 PDF pages
- [ ] Implement full research capabilities
- [ ] Add web search integration
- [ ] Build progress tracking/polling
- [ ] Create proposal list/view pages
- [ ] Add proposal editing capabilities

### Phase 3: Polish & Enhancement (Week 5-6)
- [ ] Add package customization (3 tiers)
- [ ] Implement proposal versioning
- [ ] Add email delivery
- [ ] Create proposal analytics (views, time spent)
- [ ] Add customer acceptance workflow
- [ ] Build admin review/approval flow

### Phase 4: Advanced Features (Week 7-8)
- [ ] Add template customization
- [ ] Implement A/B testing
- [ ] Build proposal library (reusable sections)
- [ ] Add competitor tracking
- [ ] Create performance dashboard
- [ ] Integrate with CRM workflow

---

## TESTING PLAN

### Comprehensive Test List

#### PROPOSAL GENERATION TESTS

**1. Research Agent Tests**
- [ ] **Test 1.1:** Generate proposal for real company with website
  - Input: Existing customer with complete data
  - Expected: Full research data with competitors, keywords, market size
  - Check: All JSON fields populated, no errors

- [ ] **Test 1.2:** Generate proposal for lead without website
  - Input: Lead with only name, phone, industry
  - Expected: Graceful handling, use industry defaults
  - Check: Proposal still generates with estimated data

- [ ] **Test 1.3:** Generate proposal for different industries
  - Input: 5 different industries (restaurants, law, healthcare, retail, services)
  - Expected: Industry-specific research and keywords
  - Check: Content is relevant and accurate

- [ ] **Test 1.4:** Validate research data accuracy
  - Input: Known competitor (e.g., your own business)
  - Expected: Accurate traffic, keywords, metrics
  - Check: Compare Claude results with actual SEMrush/Ahrefs data

**2. Content Generation Tests**
- [ ] **Test 2.1:** All 18 pages generate correctly
  - Expected: Complete proposal with no missing pages
  - Check: Each page has content, proper formatting

- [ ] **Test 2.2:** Tone and style match template
  - Expected: Direct, confident, data-driven language
  - Check: Manual review of 3 generated proposals

- [ ] **Test 2.3:** Numbers and calculations are realistic
  - Expected: ROI calculations make sense
  - Check: Verify conversion rates, revenue projections

- [ ] **Test 2.4:** Customization per business
  - Expected: No generic template language
  - Check: Business name, industry terms used throughout

**3. PDF Generation Tests**
- [ ] **Test 3.1:** PDF renders correctly
  - Expected: Professional-looking 18-page PDF
  - Check: No layout issues, images load, fonts correct

- [ ] **Test 3.2:** PDF matches template design
  - Expected: Colors, spacing, style match A1 Mobility template
  - Check: Side-by-side comparison

- [ ] **Test 3.3:** Charts and tables render
  - Expected: All data visualization is clear
  - Check: Tables align, charts are readable

- [ ] **Test 3.4:** PDF file size reasonable
  - Expected: Under 10MB
  - Check: Compression works, loads quickly

**4. API & Performance Tests**
- [ ] **Test 4.1:** Generation completes within 5 minutes
  - Expected: Average 2-3 minutes
  - Check: Log generation times for 10 proposals

- [ ] **Test 4.2:** Handle concurrent requests
  - Expected: Multiple SDRs can generate at once
  - Check: Queue system works, no race conditions

- [ ] **Test 4.3:** Error handling and recovery
  - Input: Invalid website, API timeouts, bad data
  - Expected: Graceful error messages, retry logic
  - Check: No data loss, clear error states

- [ ] **Test 4.4:** Cost monitoring
  - Expected: Track Claude API usage
  - Check: Log tokens used, calculate cost per proposal

#### ACTIVITY TRACKING & CALL HISTORY TESTS (from previous fixes)

**5. Lead Activity Tests**
- [ ] **Test 5.1:** Calls appear in lead timeline
  - Action: Make call to lead via click-to-call
  - Expected: Call shows in activity timeline within 5 seconds
  - Check: Call outcome, duration, SDR name displayed

- [ ] **Test 5.2:** Both activity tables queried
  - Action: Create activity in lead_activities AND activities tables
  - Expected: Both show in timeline, sorted chronologically
  - Check: No duplicates, correct order

- [ ] **Test 5.3:** Call outcomes display correctly
  - Action: Make calls with different outcomes (answered, no answer, voicemail)
  - Expected: Clear emoji indicators (✅ 📵 📨)
  - Check: Each outcome has correct icon and text

**6. Call History Tests**
- [ ] **Test 6.1:** Lead names show instead of numbers
  - Action: Call a lead (not yet customer)
  - Expected: Shows "John Smith (Lead) · Company Name"
  - Check: Not showing phone number

- [ ] **Test 6.2:** Customer names show correctly
  - Action: Call a converted customer
  - Expected: Shows "John Smith · Company Name" (no Lead badge)
  - Check: Proper display hierarchy

- [ ] **Test 6.3:** SDR name displays on calls
  - Action: View call history as admin
  - Expected: Each call shows "by [SDR Name]"
  - Check: Correct SDR attribution

- [ ] **Test 6.4:** Fallback to phone number works
  - Action: Call number not in system
  - Expected: Shows phone number in monospace font
  - Check: Clear it's a raw number

**7. Lead Status Auto-Update Tests**
- [ ] **Test 7.1:** Lead status changes on call
  - Setup: Create new lead (status = 'new')
  - Action: Complete call to lead
  - Expected: Lead status → 'contacted'
  - Check: Database updated, status visible in UI

- [ ] **Test 7.2:** Last contacted timestamp updates
  - Action: Make call to lead
  - Expected: lead.last_contacted_at = call time
  - Check: Timestamp accurate to the second

- [ ] **Test 7.3:** Status change activity created
  - Action: Call completes and status changes
  - Expected: New activity: "Lead contacted via call"
  - Check: Shows in timeline with proper description

- [ ] **Test 7.4:** Don't overwrite non-new status
  - Setup: Lead with status = 'qualified'
  - Action: Make call
  - Expected: Status stays 'qualified' (not reverted to 'contacted')
  - Check: Only 'new' → 'contacted' transition

**8. Data Relationship Tests**
- [ ] **Test 8.1:** Calls link to leads correctly
  - Action: Make 5 calls to different leads
  - Expected: Each call_recording has correct lead_id
  - Check: Database integrity, can query by lead_id

- [ ] **Test 8.2:** Calls link to customers correctly
  - Action: Make call to converted customer
  - Expected: call_recording has both customer_id and lead_id
  - Check: Both IDs populated when applicable

- [ ] **Test 8.3:** Calls link to deals correctly
  - Action: Make call from deal page
  - Expected: call_recording has deal_id
  - Check: Can view all calls for a deal

- [ ] **Test 8.4:** Activities sync from calls
  - Action: Call completes
  - Expected: Auto-creates activity record with lead_id
  - Check: Trigger works, data syncs correctly

#### ADMIN & FILTERING TESTS

**9. Admin Call Filtering Tests** (TODO - not yet implemented)
- [ ] **Test 9.1:** Admin sees filter dropdown
  - Action: Login as admin, go to call history
  - Expected: Dropdown to filter by SDR
  - Check: All SDRs listed

- [ ] **Test 9.2:** Filter by specific SDR works
  - Action: Select SDR from dropdown
  - Expected: Only that SDR's calls show
  - Check: Correct filtering, URL updates

- [ ] **Test 9.3:** BDRs don't see filter
  - Action: Login as BDR
  - Expected: No filter dropdown (only see own calls)
  - Check: Proper role-based access

#### INTEGRATION TESTS

**10. End-to-End Tests**
- [ ] **Test 10.1:** Lead → Call → Activity → Proposal flow
  - Action: Create lead, call them, generate proposal
  - Expected: All systems work together
  - Check: Data flows correctly through entire pipeline

- [ ] **Test 10.2:** Customer → Deal → Call → Proposal flow
  - Action: Convert lead, create deal, call, generate proposal
  - Expected: All linked correctly
  - Check: Proposal has all context

- [ ] **Test 10.3:** Multiple SDRs, multiple customers
  - Action: 3 SDRs each create leads and generate proposals
  - Expected: No data leakage, proper isolation
  - Check: Each sees only their data (or all if admin)

#### MIGRATION TESTS

**11. Database Migration Tests**
- [ ] **Test 11.1:** Migration 042 deploys successfully
  - Action: Run migration on test database
  - Expected: activities.lead_id column added
  - Check: Index created, no errors

- [ ] **Test 11.2:** Migration 043 deploys successfully
  - Action: Run migration on test database
  - Expected: Trigger created, function works
  - Check: Test call updates lead status

- [ ] **Test 11.3:** Backfill existing data
  - Setup: 100 call_recordings with lead_id
  - Action: Run migration 042 backfill
  - Expected: activities table populated with lead_ids
  - Check: Count matches, data correct

#### PERFORMANCE TESTS

**12. Load & Performance Tests**
- [ ] **Test 12.1:** Handle 10 concurrent proposal generations
  - Expected: All complete, no crashes
  - Check: Server resources, queue management

- [ ] **Test 12.2:** Large call history (1000+ calls)
  - Expected: Page loads in < 2 seconds
  - Check: Pagination works, queries optimized

- [ ] **Test 12.3:** Large activity timeline (500+ activities)
  - Expected: Timeline loads fast
  - Check: Consider virtualization if slow

---

## ESTIMATED COSTS

### Claude API Costs (per proposal)

```
Research Agent (10K thinking + 16K output):
- Input tokens: ~5,000 (prompts)
- Thinking tokens: ~10,000
- Output tokens: ~8,000 (JSON response)
- Cost: $0.24 per proposal

Content Generation Agent (8K thinking + 16K output):
- Input tokens: ~15,000 (research data + prompts)
- Thinking tokens: ~8,000
- Output tokens: ~12,000 (full proposal content)
- Cost: $0.42 per proposal

Total per proposal: ~$0.66

Monthly cost (100 proposals): ~$66
```

### Infrastructure Costs

```
Supabase Storage (PDFs):
- ~5MB per PDF
- 100 proposals/month = 500MB
- Cost: ~$0 (within free tier)

API hosting (Vercel/equivalent):
- Serverless function calls
- Cost: ~$0-20/month (depends on volume)

Total monthly: ~$86 for 100 proposals
```

### ROI Analysis

```
Cost per proposal: $0.66 + labor (~10 min at $30/hr = $5) = $5.66
Time saved: 4-6 hours of manual proposal writing
Value: At least $120-180 in SDR time saved
ROI: 2,024% - 3,081%

If 1 in 10 proposals converts to £2,000/month client:
- Revenue per 10 proposals: £2,000/month = £24,000/year
- Cost of 10 proposals: $5.66 × 10 = $56.60
- ROI: 42,372%
```

---

## SECURITY CONSIDERATIONS

1. **API Key Security**
   - Store Anthropic API key in environment variables
   - Never expose in client-side code
   - Rotate keys periodically

2. **Data Privacy**
   - Don't send customer PII to Claude unnecessarily
   - Redact sensitive information
   - Log all API calls for audit

3. **Access Control**
   - Only authenticated users can generate proposals
   - BDRs can only generate for their assigned leads/customers
   - Admins can generate for any
   - Implement rate limiting (max 5 proposals per day per user)

4. **PDF Storage**
   - Use signed URLs with expiration
   - Encrypt PDFs at rest
   - Implement access logs

---

## NEXT STEPS

1. **Review this plan** - Approve architecture and approach
2. **Set up Claude API account** - Get API key, set spending limits
3. **Create database migrations** - 042, 043, and proposals schema
4. **Implement Phase 1** - Basic generation working
5. **Test with 3-5 real customers** - Validate quality
6. **Iterate based on feedback** - Refine prompts and templates
7. **Roll out to all SDRs** - Full deployment

---

**Questions for Implementation:**

1. Do you have Claude API access? Need to request extended thinking?
2. Preferred PDF generation library (React-PDF vs Puppeteer)?
3. Should proposals be editable after generation?
4. Auto-send via email or manual send only?
5. Integrate with existing deal workflow?
6. Any specific compliance requirements (GDPR, etc.)?
