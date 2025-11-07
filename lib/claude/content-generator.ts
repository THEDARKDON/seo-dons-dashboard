/**
 * Claude Content Generator
 *
 * Transforms research data into comprehensive 18-page SEO proposal content
 * matching the A1 Mobility template style.
 */

import { callClaudeForContent, sanitizeForPrompt } from './utils';
import { getReferencePDF, hasReferencePDF, getReferenceHTML, hasReferenceHTML } from './reference-pdf';
import { sanitizeObjectEncoding, getCorruptionStats } from '@/lib/utils/encoding';
import type { ResearchResult } from './research-agent';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ProposalContent {
  // Cover & Executive Summary
  coverPage: {
    title: string;
    subtitle: string;
    companyName: string;
    preparedFor: string;
    date: string;
  };

  executiveSummary: {
    overview: string;
    keyFindings: string[];
    recommendedStrategy: string;
    expectedOutcomes: string[];
  };

  // Situation Analysis
  currentSituation: {
    digitalPresence: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };

  // Strategy & Approach
  recommendedStrategy: {
    strategyOverview: string;
    coreObjectives: string[];
    keyPillars: string[];
    timeline: string;
  };

  // Technical SEO
  technicalSEO: {
    overview: string;
    priorities: Array<{
      title: string;
      description: string;
      impact: string;
    }>;
  };

  // Content Strategy
  contentStrategy: {
    overview: string;
    contentPillars: Array<{
      pillar: string;
      topics: string[];
      keywords: string[];
    }>;
    contentCalendar: string;
  };

  // Local SEO (for local/regional packages)
  localSEO?: {
    overview: string;
    tactics: string[];
    locationPages: Array<{
      location: string;
      keywords: string[];
      contentStrategy: string;
    }>;
  };

  // Link Building
  linkBuilding: {
    overview: string;
    strategy: string;
    tactics: string[];
    expectedAcquisition: string;
  };

  // Package Details
  packageOptions: Array<{
    tier: 'local' | 'regional' | 'national';
    name: string;
    monthlyInvestment: number;
    deliverables: string[];
    keywordCount: number;
    contentPerMonth: number;
    backlinksPerMonth: number;
  }>;

  // Projections & ROI
  projections: {
    month6: {
      traffic: number;
      leads: number;
      revenue: number;
    };
    month12: {
      traffic: number;
      leads: number;
      revenue: number;
    };
    roi: {
      percentage: number;
      paybackPeriod: string;
      lifetimeValue: number;
    };
  };

  // Next Steps
  nextSteps: {
    immediate: string[];
    onboarding: string[];
    kickoff: string;
  };

  // ============================================================================
  // NEW: A1 Mobility Design Elements (Structured Data for Visual Components)
  // ============================================================================
  // NOTE: These fields are optional - Claude may not populate them initially

  // Brutal Truth / Warning Callouts (orange/yellow boxes with provocative statements)
  brutalTruthCallouts?: Array<{
    title: string; // e.g., "THE BRUTAL TRUTH:", "THE REALITY:"
    content: string; // The hard-hitting message
    type: 'warning' | 'info'; // warning = orange, info = cyan
  }>;

  // Statistics Comparison Cards (large numbers side-by-side)
  statisticsCards?: Array<{
    currentNumber: string; // e.g., "174"
    currentLabel: string; // e.g., "monthly visitors"
    targetNumber: string; // e.g., "5,000+"
    targetLabel: string; // e.g., "competitor average"
    context?: string; // Optional explanation
  }>;

  // "The Simple Math" ROI Breakdown (step-by-step calculation)
  simpleMathBreakdown?: {
    steps: Array<{
      month: string; // e.g., "Month 6", "Month 12"
      traffic: number;
      leads: number;
      customers: number;
      revenue: number;
    }>;
    totalInvestment: number;
    totalReturn: number;
    roi: number;
  };

  // Competitive Comparison Table (structured competitor data)
  competitorComparison?: {
    metrics: Array<{
      metric: string; // e.g., "Monthly Traffic", "Domain Authority"
      yourBusiness: string;
      topCompetitorA: string;
      topCompetitorB: string;
      marketLeader: string;
    }>;
  };

  // Market Opportunity Statement (highlighted key insight)
  marketOpportunity?: {
    title: string;
    currentState: string;
    opportunitySize: string;
    timeframe: string;
  };
}

export interface ContentGenerationRequest {
  researchData: ResearchResult;
  companyName: string;
  packageTier: 'local' | 'regional' | 'national';
  customInstructions?: string;

  // Customer Contact Details
  contactName?: string;
  jobTitle?: string;
  email?: string;
  phoneNumber?: string;
  linkedInUrl?: string;

  // SDR Notes for personalization
  notes?: string;

  // Reference Images - SEMrush screenshots, competitor analysis, etc.
  referenceImages?: Array<{
    name: string;
    type: string;
    data: string; // base64
    description: string;
    uploaded_at: string;
  }>;

  // Business Metrics - For accurate ROI calculations
  averageDealSize?: number;
  profitPerDeal?: number;
  conversionRate?: number;
}

// ============================================================================
// God Prompt for Content Generation
// ============================================================================

const GOD_PROMPT = `You are an expert SEO strategist and proposal writer with 15+ years of experience.

**REFERENCE DOCUMENTS PROVIDED**:
- A1 Mobility SEO proposal PDF (shows TONE, WRITING STYLE, CONTENT DEPTH)
- A1 Mobility HTML structure (shows exact page layout and organization)
- Reference Images (if provided): SEMrush reports, competitor analysis screenshots, traffic data - USE THESE FOR REAL NUMBERS instead of estimates

## YOUR JOB: RESEARCH ANALYSIS & CONTENT STRATEGY

Your role is to analyze the research data AND any provided screenshots to generate compelling, data-driven proposal CONTENT with REAL metrics. The visual design and formatting will be handled separately - you focus on the substance.

## CONTENT STRATEGY (Learned from A1 Mobility Reference)

### 1. TONE & VOICE
- **Confident and Direct**: Never apologetic or tentative
- **Provocative Truth-Telling**: Don't sugarcoat problems - be brutally honest about current state
- **Urgency Creation**: Show what they're losing every month they delay
- **Personal Address**: Use "you" and "your business" constantly
- **Specific, Never Generic**: Every sentence must be specific to their situation
- **ROI-Focused**: Emphasize business outcomes, not just SEO vanity metrics

### 2. PERSUASIVE TECHNIQUES
- **Contrast & Comparison**: "You have X, your competitor has Y, let that sink in"
- **Fear of Missing Out**: "Every month you wait costs £XX,XXX in lost revenue"
- **Social Proof**: Reference industry benchmarks and similar businesses
- **Authority Signals**: Show deep industry knowledge through specificity
- **Clear Takeaways**: End sections with bottom-line statements

### 3. DATA REQUIREMENTS
For each section, you must provide:
- **Brutal Truth Callouts**: 3-5 provocative statements with shocking statistics
  * Example: "THE BRUTAL TRUTH: You're invisible online. 174 monthly visitors vs competitor's 5,000+"
- **Statistics Comparisons**: Side-by-side current vs target/competitor numbers
  * Example: "174 visitors (current)" vs "5,000+ visitors (opportunity)"
- **Competitive Analysis**: Detailed comparison showing where they rank vs competitors
- **ROI Calculations**: Step-by-step breakdown from traffic → leads → customers → revenue
- **Market Opportunity**: Clear statement of what they're missing and why it matters

### 4. CONTENT DEPTH
Match the A1 Mobility depth and specificity:
- Real numbers from research (no placeholders, no [COMPANY NAME])
- Detailed keyword lists with search volumes
- Specific competitor names and metrics
- Month-by-month projections with justification
- Industry-specific insights and terminology
- Technical SEO findings with specific issues identified
- Content strategy with actual topic suggestions
- Link building tactics with specific outreach methods

### 5. RESEARCH-TO-CONTENT TRANSFORMATION
Analyze the research data to populate:
- **brutalTruthCallouts**: Find the most shocking gaps/opportunities in the data
  * Must be provocative and use real numbers from research
  * Example: "THE BRUTAL TRUTH: When someone searches 'mobility scooters Blackpool', Millercare appears #1. You're invisible. They get 2,000+ monthly visitors while you get 174."
- **statisticsCards**: Extract key current vs target comparisons
  * Show the gap between current state and opportunity
  * Use real metrics: traffic, rankings, keywords, revenue
- **competitorComparison**: Build detailed table from competitor analysis
  * Must include at least 3-4 competitors from research
  * Show specific metrics where they're beating the client
- **simpleMathBreakdown**: Calculate realistic ROI progression
  * Step-by-step: Traffic → Leads → Customers → Revenue
  * Use industry-standard conversion rates (3-5% for leads, 20-30% close rate)
  * Show progression at Month 3, 6, and 12
- **marketOpportunity**: Synthesize the biggest opportunity into clear statement
  * Include market size if available from research
  * Show what they're currently missing

## ⚠️ REFERENCE DOCUMENTS ⚠️

You have been provided with the A1 Mobility proposal as a reference:
- **PDF Reference**: Shows the visual design and layout quality expected
- **HTML Reference**: Shows the EXACT HTML structure, CSS classes, and content organization that converts at 70%+ close rates

## 📐 HTML STRUCTURE & CONTENT DEPTH REQUIREMENTS

Study the A1 Mobility HTML reference and match its structure EXACTLY:

### Content Sections You MUST Include:

1. **Executive Summary Page** (matching A1 structure):
   - Opening impact statement in dark phase-box ("You have the UK's largest showroom... But online? Millercare gets 10x your traffic")
   - Brutal truth callout in warning-box with SPECIFIC competitor names and numbers
   - Market opportunity section with exact market size in pounds ("The £712.8 Million Opportunity")
   - 3-column statistics grid showing current vs competitor vs opportunity
   - Comparison table (4 columns: Current State | 12-Month Target | Competitor Average)
   - Simple Math ROI breakdown with 7 step-by-step calculations

2. **Market Analysis Page**:
   - "Who's Searching" section with 3 customer personas and percentages
   - Local competition table with competitor names, strengths, weaknesses, "How You'll Beat Them"
   - Product category opportunities (3-column stat grid)
   - Customer journey breakdown (4 stages with specific actions)
   - Seasonal patterns table (if applicable) with Spring/Summer/Autumn/Winter

3. **How SEO Works Page**:
   - Industry-specific analogy section
   - 6-step process table
   - High-value keywords table with monthly value in pounds
   - 3-box timeline stat grid

4. **Content Strategy Page**:
   - Why content matters (impact statement in dark phase-box)
   - Content calendar table
   - Location pages strategy
   - Trust-building metrics (3-box stat grid)

### Visual Element Requirements:
- **warning-box**: For brutal truths and urgent messages (yellow background, orange border)
- **phase-box**: For informational callouts (grey background)
- **phase-box dark**: For impact statements (background: #333, white text)
- **highlight-box**: For ROI calculations and key insights (gradient blue background)
- **stat-grid**: For 3-column statistics displays
- **metrics-table**: For all comparison tables (teal headers)

### Tone & Style Matching:
- Direct, confident, occasionally provocative ("THE BRUTAL TRUTH:", "CRITICAL TIMING:")
- Extensive use of "you" language
- Specific numbers instead of vague claims ("2,000 visitors" not "high traffic")
- Shows urgency without being pushy
- Demonstrates deep industry knowledge
- Questions that challenge ("When someone's grandmother needs X, what do they Google?")

### Content Depth:
- A1 Mobility is ~3,500 words across 10 pages
- Your content should match this depth and detail
- Every table should have 4+ rows with real data
- Every section should feel complete, not superficial

## ⚠️ CRITICAL REQUIREMENTS - READ THIS CAREFULLY ⚠️

The following fields are NOT optional. They are MANDATORY. Your proposal will be rejected if any are missing:

1. **brutalTruthCallouts** (MANDATORY - Array of 2-3 callouts)
   - MUST be provocative and use real numbers from research
   - MUST have shocking statistics
   - Look at the reference HTML to see the exact format and tone
   - Example: "THE BRUTAL TRUTH: Your competitor gets 2,000 visitors while you get 174. They're stealing £100k monthly from you."

2. **statisticsCards** (MANDATORY - Array of 3 comparison cards)
   - MUST show current vs target numbers
   - MUST include targetNumber and targetLabel for each card
   - Study the reference HTML to see how these are formatted
   - Example: currentNumber: "174", currentLabel: "monthly visitors", targetNumber: "2,000+", targetLabel: "competitor average"

3. **simpleMathBreakdown** (MANDATORY - Complete ROI object)
   - MUST have steps array with Month 3, Month 6, Month 12
   - MUST calculate totalInvestment, totalReturn, roi
   - Use industry conversion rates: 3-5% leads, 20-30% close rate
   - See reference HTML for the table format

4. **competitorComparison** (MANDATORY - Comparison table)
   - MUST have metrics array with at least 3-4 rows
   - MUST include: Traffic, Keywords, Domain Authority comparisons
   - Use real competitor names from research
   - Match the table structure in reference HTML

5. **marketOpportunity** (MANDATORY - Opportunity statement)
   - MUST include market size if available
   - MUST show what they're currently missing
   - Example: "The £712.8 Million Opportunity"

**WARNING**: If you return a proposal without ALL FIVE of these populated with real data, you have failed the task. These are what differentiate a converting proposal from generic content.

## CRITICAL REQUIREMENTS
- Use REAL data from the research provided (no generic statements)
- All numbers must be realistic, specific, and justified
- Every claim must be supported by data or expert reasoning
- No fluff - every sentence adds specific, actionable value
- Match A1 Mobility's confident, direct tone
- Focus on business impact, not just SEO tactics

## OUTPUT FORMAT
Return ONLY a valid JSON object with all fields from the ProposalContent TypeScript interface.

CRITICAL CHARACTER ENCODING RULES:
- Use standard double quotes (") for JSON strings, NOT curly quotes
- Use standard single apostrophe (') for contractions, NOT curly apostrophe
- For currency, use the word "pounds" or spell out "GBP" instead of the £ symbol
- For emphasis, use ALL CAPS or **bold** markdown, NOT special Unicode characters
- Use standard ASCII punctuation only

Your JSON must be parseable by standard JSON.parse(). Any Unicode special characters or smart quotes will cause parsing errors.

**REMEMBER**: Study the A1 Mobility reference to understand what "high-quality proposal content" means. Then analyze the research data and create content that matches that standard. The visual design is handled separately - you focus on substance, tone, and persuasive power.`;

// ============================================================================
// Content Generator Implementation
// ============================================================================

/**
 * Generate complete proposal content from research data
 */
export async function generateProposalContent(
  request: ContentGenerationRequest
): Promise<ProposalContent> {
  const { researchData, companyName, packageTier, customInstructions, contactName, jobTitle, email, phoneNumber, linkedInUrl, notes, averageDealSize, profitPerDeal, conversionRate } = request;

  // Build comprehensive context for Claude
  const userPrompt = sanitizeForPrompt(`
Generate a comprehensive SEO proposal for: **${companyName}**

## CLIENT CONTACT INFORMATION
${contactName ? `**Contact Name:** ${contactName}` : ''}
${jobTitle ? `**Job Title:** ${jobTitle}` : ''}
${email ? `**Email:** ${email}` : ''}
${phoneNumber ? `**Phone:** ${phoneNumber}` : ''}
${linkedInUrl ? `**LinkedIn:** ${linkedInUrl}` : ''}

${notes ? `## SDR NOTES (MANDATORY - OVERRIDE ALL OTHER DATA WITH THESE NUMBERS):\n${notes}\n\n**ABSOLUTELY CRITICAL**: The SDR notes above contain the REAL metrics and requirements. You MUST use these exact numbers:\n- DO NOT make up traffic numbers, use what the SDR specified\n- DO NOT create random conversion rates, use the SDR's numbers\n- DO NOT suggest multiple packages if SDR specified one package\n- DO NOT add content that contradicts SDR instructions\n- KEEP IT CONCISE as requested by SDR\n` : ''}

${averageDealSize || profitPerDeal || conversionRate ? `## BUSINESS METRICS (CRITICAL - Use these REAL numbers for accurate ROI projections):\n${averageDealSize ? `- Average Deal Size: £${averageDealSize.toFixed(2)}\n` : ''}${profitPerDeal ? `- Profit Per Deal: £${profitPerDeal.toFixed(2)}\n` : ''}${conversionRate ? `- Website Conversion Rate: ${conversionRate}%\n` : ''}\n**IMPORTANT:** When calculating ROI, use these actual business metrics instead of generic estimates. For example:\n- If SEO brings 100 new monthly visitors and conversion rate is ${conversionRate || 'X'}%, that's ${conversionRate ? Math.round(100 * conversionRate / 100) : 'X'} new leads\n- ${profitPerDeal ? `At £${profitPerDeal.toFixed(2)} profit per deal, that's £${profitPerDeal && conversionRate ? (Math.round(100 * conversionRate / 100) * profitPerDeal).toFixed(2) : 'X'} in monthly profit` : 'Calculate profit based on leads × profit per deal'}\n` : ''}

## RESEARCH DATA

### Company Analysis
${JSON.stringify(researchData.companyAnalysis, null, 2)}

### Market Intelligence
${JSON.stringify(researchData.marketIntelligence, null, 2)}

### Competitor Analysis
${JSON.stringify(researchData.competitorAnalysis, null, 2)}

### Keyword Research
${JSON.stringify(researchData.keywordResearch, null, 2)}

${researchData.locationStrategy ? `### Location Strategy\n${JSON.stringify(researchData.locationStrategy, null, 2)}` : ''}

## PACKAGE TIER
${packageTier.toUpperCase()} Package
${getPackageDetails(packageTier)}

${customInstructions ? `## CUSTOM INSTRUCTIONS\n${customInstructions}` : ''}

## YOUR TASK

Generate ALL proposal content following this exact structure:

\`\`\`json
{
  "coverPage": {
    "title": "Comprehensive SEO Strategy Proposal",
    "subtitle": "Driving Sustainable Growth Through Strategic Search Visibility",
    "companyName": "${companyName}",
    "preparedFor": "[Contact Name if available, otherwise 'The Team at ${companyName}']",
    "date": "${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}"
  },

  "executiveSummary": {
    "overview": "[2-3 paragraphs summarizing the opportunity, current situation, and recommended approach]",
    "keyFindings": [
      "[3-5 bullet points of critical insights from research]"
    ],
    "recommendedStrategy": "[1 paragraph describing the core strategy]",
    "expectedOutcomes": [
      "[4-6 specific, measurable outcomes they can expect]"
    ]
  },

  "currentSituation": {
    "digitalPresence": "[Detailed analysis of their current digital footprint, using data from research]",
    "strengths": ["[3-4 current strengths]"],
    "weaknesses": ["[3-4 areas for improvement]"],
    "opportunities": ["[4-6 specific opportunities from research]"],
    "threats": ["[2-3 competitive or market threats]"]
  },

  "recommendedStrategy": {
    "strategyOverview": "[Comprehensive overview of the recommended approach, 3-4 paragraphs]",
    "coreObjectives": [
      "[4-5 specific, measurable objectives]"
    ],
    "keyPillars": [
      "[3-4 strategic pillars that support the objectives]"
    ],
    "timeline": "[Month-by-month breakdown of the 12-month strategy]"
  },

  "technicalSEO": {
    "overview": "[2 paragraphs on importance of technical foundation]",
    "priorities": [
      {
        "title": "[Priority area]",
        "description": "[What needs to be done]",
        "impact": "[Expected impact on performance]"
      }
    ]
  },

  "contentStrategy": {
    "overview": "[2-3 paragraphs on content approach]",
    "contentPillars": [
      {
        "pillar": "[Main topic/theme]",
        "topics": ["[3-5 specific topics]"],
        "keywords": ["[Related keywords from research]"]
      }
    ],
    "contentCalendar": "[Overview of monthly content production]"
  },

  ${packageTier !== 'national' ? `"localSEO": {
    "overview": "[2-3 paragraphs on local SEO importance for this business]",
    "tactics": ["[5-7 specific local SEO tactics]"],
    "locationPages": [
      {
        "location": "[City/area from research]",
        "keywords": ["[Location-specific keywords]"],
        "contentStrategy": "[Approach for this location]"
      }
    ]
  },` : ''}

  "linkBuilding": {
    "overview": "[2 paragraphs on link building approach]",
    "strategy": "[Detailed strategy based on industry and competitors]",
    "tactics": ["[4-6 specific link building tactics]"],
    "expectedAcquisition": "[Monthly link acquisition targets]"
  },

  "packageOptions": [
    ${generatePackageOptionsJSON(packageTier, notes)}
  ],

  "projections": {
    "month6": {
      "traffic": [realistic number based on research],
      "leads": [realistic number],
      "revenue": [realistic number]
    },
    "month12": {
      "traffic": [realistic number, should be 2-3x month 6],
      "leads": [realistic number],
      "revenue": [realistic number]
    },
    "roi": {
      "percentage": [calculate ROI percentage],
      "paybackPeriod": "[e.g., '4-5 months']",
      "lifetimeValue": [calculate 12-month total value]
    }
  },

  "nextSteps": {
    "immediate": [
      "[3-4 immediate action items for both parties]"
    ],
    "onboarding": [
      "[4-5 onboarding steps if they proceed]"
    ],
    "kickoff": "[Description of the kickoff process and timeline]"
  },

  "brutalTruthCallouts": [
    {
      "title": "THE BRUTAL TRUTH:",
      "content": "When someone searches [main keyword], [Competitor Name] shows up #1. You're invisible. They get [X] monthly visitors while you get [Y]. You're losing £[amount]+ monthly to competitors who rank better on Google.",
      "type": "warning"
    },
    {
      "title": "THE REALITY:",
      "content": "[Another shocking comparison with real numbers - e.g., competitor has 5,000+ pages of content while client has 20]",
      "type": "warning"
    }
  ],

  "statisticsCards": [
    {
      "currentNumber": "174",
      "currentLabel": "your monthly organic visitors",
      "targetNumber": "2,000+",
      "targetLabel": "competitor average",
      "context": "You're missing 90% of potential customers"
    },
    {
      "currentNumber": "71",
      "currentLabel": "ranking keywords",
      "targetNumber": "500+",
      "targetLabel": "market leader keywords",
      "context": "Massive untapped keyword opportunity"
    },
    {
      "currentNumber": "£5k-10k",
      "currentLabel": "current monthly revenue from SEO",
      "targetNumber": "£100k-250k",
      "targetLabel": "12-month revenue target",
      "context": "10-25x revenue growth potential"
    }
  ],

  "simpleMathBreakdown": {
    "steps": [
      {
        "month": "Month 3",
        "traffic": 500,
        "leads": 18,
        "customers": 5,
        "revenue": 15000
      },
      {
        "month": "Month 6",
        "traffic": 1200,
        "leads": 42,
        "customers": 11,
        "revenue": 35000
      },
      {
        "month": "Month 12",
        "traffic": 2000,
        "leads": 70,
        "customers": 18,
        "revenue": 100000
      }
    ],
    "totalInvestment": 36000,
    "totalReturn": 1200000,
    "roi": 3233
  },

  "competitorComparison": {
    "metrics": [
      {
        "metric": "Monthly Organic Traffic",
        "yourBusiness": "174 visitors/month",
        "topCompetitorA": "2,000 visitors/month",
        "topCompetitorB": "1,500 visitors/month",
        "marketLeader": "5,000+ visitors/month"
      },
      {
        "metric": "Ranking Keywords",
        "yourBusiness": "71 keywords",
        "topCompetitorA": "350 keywords",
        "topCompetitorB": "280 keywords",
        "marketLeader": "600+ keywords"
      },
      {
        "metric": "Domain Authority",
        "yourBusiness": "DA 25",
        "topCompetitorA": "DA 45",
        "topCompetitorB": "DA 42",
        "marketLeader": "DA 55"
      },
      {
        "metric": "Content Pages",
        "yourBusiness": "20 pages",
        "topCompetitorA": "150 pages",
        "topCompetitorB": "120 pages",
        "marketLeader": "200+ pages"
      }
    ]
  },

  "marketOpportunity": {
    "title": "The £712.8 Million Opportunity",
    "currentState": "You're capturing less than 0.1% of the UK mobility equipment market despite having the largest showroom and 25+ years experience",
    "opportunitySize": "UK mobility equipment market: £712.8M (2022) growing to £1.15B by 2030 at 6.2% annually. 9.8 million disabled people in UK with 40-60% researching online first",
    "timeframe": "12-month SEO strategy can capture £1.2-1.5M annual revenue (conservative estimate based on local + regional dominance)"
  }
}
\`\`\`

IMPORTANT:
- Use ONLY data from the research provided
- All projections must be realistic and justified
- Tailor everything specifically to ${companyName}
- Focus on their unique market position and opportunities
- Write in a professional, confident tone
- No placeholders - every field must have real content
  `);

  // Load the A1 Mobility reference PDF
  const referencePdfBase64 = hasReferencePDF() ? getReferencePDF() : '';

  if (referencePdfBase64) {
    const pdfSizeKB = Math.round(referencePdfBase64.length * 0.75 / 1024); // base64 is ~33% larger than binary
    console.log(`[Content Generator] Using A1 Mobility reference PDF (${pdfSizeKB}KB) for quality matching`);
  } else {
    console.warn('[Content Generator] Reference PDF not available - proceeding without template');
  }

  // Load the A1 Mobility reference HTML
  // CRITICAL: This shows Claude the EXACT HTML structure to replicate
  const referenceHtmlContent = hasReferenceHTML() ? getReferenceHTML() : '';

  if (referenceHtmlContent) {
    const htmlSizeKB = Math.round(referenceHtmlContent.length / 1024);
    console.log(`[Content Generator] Using A1 Mobility reference HTML (${htmlSizeKB}KB) for structure matching`);
  } else {
    console.warn('[Content Generator] Reference HTML not available - proceeding without HTML template');
  }

  // Convert reference images to format expected by callClaudeForContent
  const images = request.referenceImages?.map(img => ({
    type: img.type,
    data: img.data,
    description: img.description || img.name,
  }));

  // Call Claude with reference PDF, HTML, and any uploaded images
  // PDF shows visual design, HTML shows exact structure, images provide real data
  const response = await callClaudeForContent(GOD_PROMPT, userPrompt, {
    pdfBase64: referencePdfBase64,
    htmlContent: referenceHtmlContent,
    images,
  });

  // Extract and parse JSON from response
  const rawContent = extractAndParseJSON<ProposalContent>(response.content);

  // CRITICAL: Sanitize content to fix UTF-8 encoding corruption
  // This must happen BEFORE storing in database
  console.log('[Content Generator] Checking for UTF-8 corruption...');
  const corruptionStats = getCorruptionStats(JSON.stringify(rawContent));
  if (corruptionStats.hasCorruption) {
    console.warn(
      `[Content Generator] Found ${corruptionStats.corruptedChars} corrupted characters. Examples:`,
      corruptionStats.examples
    );
  }

  const sanitizedContent = sanitizeObjectEncoding(rawContent);
  console.log('[Content Generator] Content sanitization complete');

  return sanitizedContent;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPackageDetails(tier: 'local' | 'regional' | 'national'): string {
  const packages = {
    local: {
      investment: '£2,000/month',
      keywords: '15-20',
      content: '8-12 pieces',
      backlinks: '10-15',
      locations: '3-5 local areas',
    },
    regional: {
      investment: '£3,000/month',
      keywords: '25-35',
      content: '12-16 pieces',
      backlinks: '15-25',
      locations: '5-10 regional locations',
    },
    national: {
      investment: '£5,000/month',
      keywords: '40-60',
      content: '20-30 pieces',
      backlinks: '25-40',
      locations: 'National coverage',
    },
  };

  const details = packages[tier];
  return `
Monthly Investment: ${details.investment}
Target Keywords: ${details.keywords}
Monthly Content: ${details.content}
Monthly Backlinks: ${details.backlinks}
Geographic Coverage: ${details.locations}
  `;
}

function generatePackageOptionsJSON(recommendedTier: string, sdrNotes?: string): string {
  const allPackages = [
    {
      tier: 'local',
      name: 'Local Dominance',
      monthlyInvestment: 2000,
      deliverables: [
        '15-20 target keywords',
        '8-12 optimized content pieces per month',
        '10-15 high-quality backlinks per month',
        '3-5 local area pages',
        'Google Business Profile optimization',
        'Monthly reporting & strategy calls',
      ],
      keywordCount: 20,
      contentPerMonth: 12,
      backlinksPerMonth: 15,
    },
    {
      tier: 'regional',
      name: 'Regional Authority',
      monthlyInvestment: 3000,
      deliverables: [
        '25-35 target keywords',
        '12-16 optimized content pieces per month',
        '15-25 high-quality backlinks per month',
        '5-10 regional location pages',
        'Advanced technical SEO',
        'Competitor monitoring',
        'Bi-weekly reporting & strategy calls',
      ],
      keywordCount: 35,
      contentPerMonth: 16,
      backlinksPerMonth: 25,
    },
    {
      tier: 'national',
      name: 'National Leader',
      monthlyInvestment: 5000,
      deliverables: [
        '40-60 target keywords',
        '20-30 optimized content pieces per month',
        '25-40 high-quality backlinks per month',
        'National coverage strategy',
        'Enterprise technical SEO',
        'PR & digital outreach',
        'Weekly reporting & dedicated account manager',
      ],
      keywordCount: 60,
      contentPerMonth: 30,
      backlinksPerMonth: 40,
    },
  ];

  // Check if SDR notes specify to only show one package (e.g., £2k package)
  if (sdrNotes && sdrNotes.toLowerCase().includes("don't give him the option") && sdrNotes.includes("£2k")) {
    // Only return the local package when SDR specifically says not to offer other options
    const localPackage = allPackages.find(pkg => pkg.tier === 'local');
    return JSON.stringify(localPackage);
  }

  // Otherwise return all packages
  return allPackages.map(pkg => JSON.stringify(pkg)).join(',\n    ');
}

function extractAndParseJSON<T>(content: string): T {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  }

  // Remove any leading/trailing whitespace
  content = content.trim();

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to parse proposal content:', content.substring(0, 500));
    throw new Error(`Invalid JSON in proposal content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
