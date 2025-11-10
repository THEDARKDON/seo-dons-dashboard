/**
 * Enhanced Research Agent
 *
 * Conducts real web research using Perplexity AI and SerpAPI
 * to gather actual competitor data, rankings, and market intelligence
 */

import { getJson } from 'serpapi';

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedResearchRequest {
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
  targetKeywords?: string[];
  notes?: string;
  packageTier?: 'local' | 'regional' | 'national'; // NEW: For intelligent keyword generation
}

export interface WebsiteAnalysis {
  mainServices: string[];
  targetAudience: string;
  uniqueValue: string;
  technicalQuality: string;
  contentQuality: string;
  hasLiveChat: boolean;
  hasBlog: boolean;
  estimatedPageCount: number;
}

export interface SocialMediaPresence {
  platforms: {
    platform: string;
    url?: string;
    followers?: number;
    engagement?: string;
  }[];
  overallPresence: 'strong' | 'moderate' | 'weak' | 'minimal';
  insights: string[];
}

export interface CompanyIntelligence {
  companySize: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
  estimatedEmployees?: string;
  foundedYear?: number;
  businessModel: string;
  strengths: string[];
  weaknesses: string[];
}

export interface KeywordRanking {
  keyword: string;
  position?: number;
  searchVolume: number;
  difficulty: string;
  intent: string;
  topRankers: {
    domain: string;
    title: string;
    position: number;
  }[];
  relatedSearches?: string[];
  peopleAlsoAsk?: string[];
}

export interface RealCompetitor {
  name: string;
  domain: string;
  estimatedTraffic: string;
  strengths: string[];
  rankings: {
    keyword: string;
    position: number;
  }[];
  domainAuthority?: number;
}

export interface MarketIntelligence {
  totalSearchVolume: number;
  competitionLevel: 'low' | 'medium' | 'high' | 'very high';
  seasonalTrends?: string;
  growthOpportunity: string;
  quickWins: string[];
}

export interface LocationOpportunity {
  location: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedVolume: string;
  competition: string;
  competitorDomains: string[];
  currentRanking?: number;
}

export interface ContentOpportunity {
  question: string;
  keyword: string;
  contentIdea: string;
  searchIntent: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface EnhancedResearchResult {
  companyIntelligence: CompanyIntelligence;
  websiteAnalysis: WebsiteAnalysis;
  socialMedia: SocialMediaPresence;
  keywordAnalysis: KeywordRanking[];
  competitors: RealCompetitor[];
  marketIntelligence: MarketIntelligence;
  locationOpportunities: LocationOpportunity[];
  contentOpportunities: ContentOpportunity[];
  rawResearchData: {
    perplexityInsights: string[];
    serpData: any[];
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

if (!PERPLEXITY_API_KEY) {
  console.warn('PERPLEXITY_API_KEY not configured - web research will be limited');
}

if (!SERPAPI_KEY) {
  console.warn('SERPAPI_KEY not configured - ranking data will be limited');
}

// ============================================================================
// PERPLEXITY RESEARCH FUNCTIONS
// ============================================================================

async function researchWithPerplexity(query: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  try {
    // Perplexity uses OpenAI-compatible API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Provide factual, accurate information based on current web data.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 4000,
        temperature: 0.2,
        return_citations: true,
        search_recency_filter: 'month',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // LOG: Full Perplexity API response
    console.log('\n========================================');
    console.log('PERPLEXITY API RESPONSE');
    console.log('========================================');
    console.log('Query:', query.substring(0, 100) + '...');
    console.log('Model:', data.model || 'sonar');
    console.log('Response ID:', data.id || 'N/A');
    console.log('Created:', data.created ? new Date(data.created * 1000).toISOString() : 'N/A');

    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];

    console.log('Content Length:', content?.length || 0, 'characters');
    console.log('Citations Count:', citations.length);

    if (citations.length > 0) {
      console.log('Citations:');
      citations.slice(0, 5).forEach((citation: any, idx: number) => {
        console.log(`  ${idx + 1}. ${citation}`);
      });
      if (citations.length > 5) {
        console.log(`  ... and ${citations.length - 5} more`);
      }
    }

    if (content) {
      console.log('Content Preview:', content.substring(0, 200) + '...');
    }
    console.log('========================================\n');

    if (!content || typeof content !== 'string') {
      console.warn('⚠️  Perplexity returned empty or invalid content');
      console.warn('Full response:', JSON.stringify(data, null, 2));
      return 'No data available';
    }

    return content;
  } catch (error) {
    console.error('❌ Perplexity research error:', error);
    throw error;
  }
}

async function analyzeWebsiteWithPerplexity(website: string, companyName: string): Promise<WebsiteAnalysis> {
  const query = `Analyze the website ${website} for ${companyName}. Provide:
1. Main services/products offered
2. Target audience
3. Unique value proposition
4. Technical quality (page speed, mobile-friendly, modern design)
5. Content quality (comprehensive, professional, engaging)
6. Does it have live chat?
7. Does it have a blog?
8. Estimated number of pages

Be specific and factual based on what you find.`;

  const analysis = await researchWithPerplexity(query);

  // Parse the response (this is simplified - you might want more robust parsing)
  return {
    mainServices: extractServices(analysis),
    targetAudience: extractTargetAudience(analysis),
    uniqueValue: extractUniqueValue(analysis),
    technicalQuality: extractTechnicalQuality(analysis),
    contentQuality: extractContentQuality(analysis),
    hasLiveChat: analysis.toLowerCase().includes('live chat') || analysis.toLowerCase().includes('livechat'),
    hasBlog: analysis.toLowerCase().includes('blog') || analysis.toLowerCase().includes('news'),
    estimatedPageCount: extractPageCount(analysis),
  };
}

async function researchSocialMedia(companyName: string, website?: string): Promise<SocialMediaPresence> {
  const query = `Find the social media presence for ${companyName}${website ? ` (${website})` : ''}.
List all platforms they're on (LinkedIn, Facebook, Twitter/X, Instagram, YouTube, TikTok, etc.) with:
- Profile URLs
- Follower counts
- Engagement level (high/medium/low)
- Recent activity

Be specific with actual numbers where available.`;

  const research = await researchWithPerplexity(query);

  return parseSocialMediaResponse(research);
}

async function gatherCompanyIntelligence(companyName: string, website?: string): Promise<CompanyIntelligence> {
  const query = `Research ${companyName}${website ? ` (${website})` : ''} and provide:
1. Company size (number of employees)
2. When were they founded?
3. Business model (B2B, B2C, marketplace, etc.)
4. Main strengths and competitive advantages
5. Weaknesses or areas for improvement
6. Market position

Focus on factual, verifiable information.`;

  const intelligence = await researchWithPerplexity(query);

  return parseCompanyIntelligence(intelligence);
}

// ============================================================================
// SERPAPI RANKING FUNCTIONS
// ============================================================================

/**
 * Normalize location for SerpAPI - REDESIGNED
 *
 * CRITICAL FIX: Now uses specific city/county instead of defaulting to "United Kingdom"
 *
 * Strategy:
 * - LOCAL packages: Use "City, County, UK" for hyper-local results
 * - REGIONAL packages: Use "County, UK" for regional results
 * - NATIONAL packages: Use "United Kingdom" for nationwide results
 *
 * Examples:
 * - "Helston, Cornwall, UK" (local) -> "Helston, Cornwall, UK"
 * - "Cornwall, UK" (regional) -> "Cornwall, UK"
 * - National -> "United Kingdom"
 *
 * @param location - Raw location string from customer data
 * @param packageTier - Package tier to determine location specificity
 * @returns Formatted location string for SerpAPI
 */
async function normalizeSerpAPILocation(
  location?: string,
  packageTier: 'local' | 'regional' | 'national' = 'local'
): Promise<string> {
  // Import location parser
  const { parseLocation } = await import('./keyword-templates');

  // National packages should search nationwide
  if (packageTier === 'national') {
    return 'United Kingdom';
  }

  if (!location) {
    console.warn('[SerpAPI Location] No location provided, defaulting to United Kingdom');
    return 'United Kingdom';
  }

  const locationParts = parseLocation(location);

  // LOCAL: Use most specific location available (city > county > country)
  if (packageTier === 'local') {
    if (locationParts.city && locationParts.county) {
      const serpLocation = `${locationParts.city}, ${locationParts.county}, UK`;
      console.log(`[SerpAPI Location] LOCAL tier - Using: "${serpLocation}"`);
      return serpLocation;
    }

    if (locationParts.city) {
      const serpLocation = `${locationParts.city}, UK`;
      console.log(`[SerpAPI Location] LOCAL tier - Using city: "${serpLocation}"`);
      return serpLocation;
    }

    if (locationParts.county) {
      const serpLocation = `${locationParts.county}, UK`;
      console.log(`[SerpAPI Location] LOCAL tier - Using county: "${serpLocation}"`);
      return serpLocation;
    }
  }

  // REGIONAL: Use county-level location
  if (packageTier === 'regional') {
    if (locationParts.county) {
      const serpLocation = `${locationParts.county}, UK`;
      console.log(`[SerpAPI Location] REGIONAL tier - Using: "${serpLocation}"`);
      return serpLocation;
    }

    if (locationParts.city) {
      const serpLocation = `${locationParts.city}, UK`;
      console.log(`[SerpAPI Location] REGIONAL tier - Using city fallback: "${serpLocation}"`);
      return serpLocation;
    }
  }

  // Fallback: Use whatever we have
  console.warn('[SerpAPI Location] Could not parse specific location, using United Kingdom');
  return 'United Kingdom';
}

async function checkRealRankings(
  companyName: string,
  domain: string,
  keywords: string[],
  location: string = 'United Kingdom',
  packageTier: 'local' | 'regional' | 'national' = 'local'
): Promise<KeywordRanking[]> {
  if (!SERPAPI_KEY) {
    throw new Error('SerpAPI key not configured');
  }

  const rankings: KeywordRanking[] = [];
  const normalizedLocation = await normalizeSerpAPILocation(location, packageTier);

  console.log('\n========================================');
  console.log('SERPAPI RANKINGS CHECK');
  console.log('========================================');
  console.log('Company:', companyName);
  console.log('Domain:', domain);
  console.log('Location:', location, '→', normalizedLocation);
  console.log('Keywords to check:', keywords.join(', '));
  console.log('========================================\n');

  for (const keyword of keywords) {
    try {
      console.log(`\n🔍 Checking keyword: "${keyword}"`);

      const results = await getJson({
        api_key: SERPAPI_KEY,
        engine: 'google',
        q: keyword,
        location: normalizedLocation,
        num: 100,
        gl: 'uk',
        hl: 'en',
      });

      // LOG: SerpAPI Response Summary
      console.log('  ├─ Search Parameters:', results.search_parameters);
      console.log('  ├─ Organic Results Count:', results.organic_results?.length || 0);
      console.log('  ├─ Related Searches:', results.related_searches?.length || 0);
      console.log('  ├─ People Also Ask:', results.related_questions?.length || 0);

      // Find client's position
      const position = results.organic_results?.findIndex((r: any) =>
        r.link?.includes(domain.replace('https://', '').replace('http://', '').split('/')[0])
      );

      if (position >= 0) {
        console.log(`  ├─ ✅ CLIENT FOUND at position ${position + 1}`);
      } else {
        console.log('  ├─ ❌ Client NOT in top 100 results');
      }

      // Log top 5 rankers
      if (results.organic_results && results.organic_results.length > 0) {
        console.log('  ├─ Top 5 Rankers:');
        results.organic_results.slice(0, 5).forEach((r: any, idx: number) => {
          const rankDomain = extractDomain(r.link);
          console.log(`  │   ${idx + 1}. ${rankDomain} - ${r.title?.substring(0, 50)}...`);
        });
      }

      // Get search volume estimate from related searches or keywords
      const searchVolume = await estimateSearchVolume(keyword);
      console.log(`  └─ Estimated Search Volume: ${searchVolume}/month\n`);

      // Extract related searches
      const relatedSearches = results.related_searches?.map((rs: any) => rs.query).filter(Boolean) || [];

      // Extract People Also Ask questions
      const peopleAlsoAsk = results.related_questions?.map((rq: any) => rq.question).filter(Boolean) || [];

      rankings.push({
        keyword,
        position: position >= 0 ? position + 1 : undefined,
        searchVolume,
        difficulty: estimateDifficulty(results),
        intent: detectIntent(keyword),
        topRankers: results.organic_results?.slice(0, 5).map((r: any, idx: number) => ({
          domain: extractDomain(r.link),
          title: r.title,
          position: idx + 1,
        })) || [],
        relatedSearches: relatedSearches.slice(0, 8), // Top 8 related searches
        peopleAlsoAsk: peopleAlsoAsk.slice(0, 4), // Top 4 PAA questions
      });

      // Rate limit to avoid API throttling
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error checking rankings for "${keyword}":`, error);
      // Continue with other keywords
    }
  }

  return rankings;
}

async function findRealCompetitors(
  keywords: string[],
  location: string = 'United Kingdom',
  limit: number = 5,
  customerDomain?: string,
  customerWebTraffic: string = 'Unknown',
  packageTier: 'local' | 'regional' | 'national' = 'local'
): Promise<RealCompetitor[]> {
  if (!SERPAPI_KEY) {
    throw new Error('SerpAPI key not configured');
  }

  const normalizedLocation = await normalizeSerpAPILocation(location, packageTier);

  console.log('\n========================================');
  console.log('SERPAPI COMPETITOR DISCOVERY');
  console.log('========================================');
  console.log('Keywords:', keywords.slice(0, 3).join(', '));
  console.log('Location:', location, '→', normalizedLocation);
  console.log('Limit:', limit, 'competitors');
  console.log('========================================\n');

  // Domains to exclude (directories, comparison sites, huge national brands, trade associations)
  const excludedDomains = [
    // Comparison/directory sites
    'checkatrade.com', 'trustatrader.com', 'yell.com', 'thomsonlocal.com',
    'bark.com', 'mybuilder.com', 'ratedpeople.com', 'houzz.com', 'homeadvisor.com',
    'trustpilot.com', 'reviews.co.uk', 'feefo.com', 'google.com', 'facebook.com',
    // Major national brands (energy, telecoms, retail)
    'octopus.energy', 'octopusenergy.com', 'britishgas.co.uk', 'eon.co.uk',
    'scottishpower.co.uk', 'edfenergy.com', 'bulb.co.uk', 'shell.co.uk',
    // Generic platforms
    'amazon.co.uk', 'ebay.co.uk', 'gumtree.com', 'indeed.com', 'linkedin.com',
    'wikipedia.org', 'youtube.com', 'bbc.co.uk', 'gov.uk',
    // Trade associations and industry bodies (not actual competitors)
    'solarenergyuk.org', 'solarpowereurope.org', 'iea.org', 'fmb.org.uk',
    'theecoexperts.co.uk', 'which.co.uk', 'independent.co.uk',
    // Information/educational sites
    'en.wikipedia.org', 'nationalgrid.com', 'energysavingtrust.org.uk',
    // Government/academic sites
    'webapp.services.coventry.ac.uk', 'find-and-update.company-information.service.gov.uk',
    // Portals and aggregators
    'solarpowerportal.co.uk', 'mcscertified.com', 'globalsolaratlas.info',
    // Social/review platforms
    'instagram.com', 'uk.trustpilot.com', 'trustpilot.com',
  ];

  const competitorMap = new Map<string, {
    name: string;
    domain: string;
    rankings: { keyword: string; position: number }[];
    appearances: number;
  }>();

  // Check top 10 for each keyword to find consistent competitors
  for (const keyword of keywords.slice(0, 3)) { // Limit to first 3 keywords to save API calls
    try {
      console.log(`\n🔍 Finding competitors for: "${keyword}"`);

      const results = await getJson({
        api_key: SERPAPI_KEY,
        engine: 'google',
        q: keyword,
        location: normalizedLocation,
        num: 10,
        gl: 'uk',
        hl: 'en',
      });

      console.log(`  ├─ Results found: ${results.organic_results?.length || 0}`);

      results.organic_results?.forEach((result: any, idx: number) => {
        const domain = extractDomain(result.link);

        // Filter out excluded domains
        if (excludedDomains.includes(domain)) {
          console.log(`  │   SKIP: ${domain} (excluded list)`);
          return;
        }

        // Filter out customer's own domain
        if (customerDomain && domain === customerDomain) {
          console.log(`  │   SKIP: ${domain} (customer's own site)`);
          return;
        }

        if (!competitorMap.has(domain)) {
          competitorMap.set(domain, {
            name: result.title ? result.title.split('|')[0].split('-')[0].trim() : domain,
            domain,
            rankings: [],
            appearances: 0,
          });
          console.log(`  │   NEW: ${domain}`);
        } else {
          console.log(`  │   +1: ${domain}`);
        }

        const competitor = competitorMap.get(domain)!;
        competitor.rankings.push({ keyword, position: idx + 1 });
        competitor.appearances++;
      });

      console.log(`  └─ Total unique competitors so far: ${competitorMap.size}\n`);

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error finding competitors for "${keyword}":`, error);
    }
  }

  // Sort by appearances and get more than needed (for filtering later)
  const topCompetitors = Array.from(competitorMap.values())
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, limit * 3); // Get 3x to allow for size filtering

  console.log('\n📊 TOP COMPETITORS (by appearances):');
  topCompetitors.forEach((comp, idx) => {
    console.log(`  ${idx + 1}. ${comp.domain} (${comp.name})`);
    console.log(`     └─ Appeared ${comp.appearances} times in top 10`);
  });
  console.log('========================================\n');

  // Enhance with Perplexity research and filter by size
  const enhancedCompetitors: RealCompetitor[] = [];
  const customerTraffic = parseTrafficValue(customerWebTraffic || 'Unknown');

  for (const competitor of topCompetitors) {
    try {
      const research = await researchWithPerplexity(
        `Analyze ${competitor.domain} as a competitor. Provide: 1) Estimated monthly traffic, 2) Main strengths, 3) Domain authority if known. Be concise.`
      );

      const trafficEstimate = extractTrafficEstimate(research);
      const competitorTraffic = parseTrafficValue(trafficEstimate);

      // Filter out competitors that are significantly larger (10x or more traffic)
      // Only apply if we have customer traffic data
      if (customerTraffic > 0 && competitorTraffic > customerTraffic * 10) {
        console.log(`  ⚠️  SKIP: ${competitor.domain} too large (${trafficEstimate} vs customer's ${customerWebTraffic})`);
        continue;
      }

      // Also filter out very high-traffic sites (1M+) that are likely national/enterprise
      if (competitorTraffic > 1000000) {
        console.log(`  ⚠️  SKIP: ${competitor.domain} too large (${trafficEstimate}) - likely national brand`);
        continue;
      }

      enhancedCompetitors.push({
        name: competitor.name,
        domain: competitor.domain,
        estimatedTraffic: trafficEstimate,
        strengths: extractStrengths(research),
        rankings: competitor.rankings,
        domainAuthority: extractDomainAuthority(research),
      });

      // Stop when we have enough filtered competitors
      if (enhancedCompetitors.length >= limit) {
        break;
      }
    } catch (error) {
      console.error(`Error researching competitor ${competitor.domain}:`, error);
      // Add without enhancement (if we still need more)
      if (enhancedCompetitors.length < limit) {
        enhancedCompetitors.push({
          name: competitor.name,
          domain: competitor.domain,
          estimatedTraffic: 'Unknown',
          strengths: ['Consistent organic visibility'],
          rankings: competitor.rankings,
        });
      }
    }
  }

  return enhancedCompetitors;
}

async function estimateSearchVolume(keyword: string): Promise<number> {
  // This is a simplified approach - ideally you'd use a dedicated SEO tool API
  // For now, we'll use heuristics based on keyword characteristics
  const words = keyword.toLowerCase().split(' ');

  // Very rough estimates based on keyword length and type
  if (words.length === 1) return 1000; // Single word = broader = higher volume
  if (words.length === 2) return 500;
  if (words.includes('near me') || words.includes('in')) return 300;
  if (words.length >= 4) return 100; // Long-tail = lower volume

  return 250; // Default
}

function estimateDifficulty(serpResults: any): string {
  const topResults = serpResults.organic_results?.slice(0, 10) || [];
  const hasWikipedia = topResults.some((r: any) => r.link?.includes('wikipedia'));
  const hasMajorBrands = topResults.some((r: any) =>
    ['amazon', 'ebay', 'gov.uk', 'bbc'].some(brand => r.link?.includes(brand))
  );

  if (hasWikipedia && hasMajorBrands) return 'Very High';
  if (hasMajorBrands) return 'High';
  if (topResults.length >= 8) return 'Medium';
  return 'Low';
}

function detectIntent(keyword: string): string {
  const kw = keyword.toLowerCase();

  if (kw.includes('buy') || kw.includes('price') || kw.includes('cost')) return 'Transactional';
  if (kw.includes('how to') || kw.includes('what is') || kw.includes('guide')) return 'Informational';
  if (kw.includes('best') || kw.includes('top') || kw.includes('review')) return 'Commercial';
  if (kw.includes('near me') || kw.includes('in ')) return 'Local';

  return 'Navigational';
}

// ============================================================================
// PARSING HELPERS
// ============================================================================

function extractServices(text: string): string[] {
  if (!text) return ['Service information not found'];

  const services: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line?.toLowerCase().includes('service') || line?.toLowerCase().includes('offer')) {
      const match = line.match(/[-•]\s*(.+)/);
      if (match && match[1]) services.push(match[1].trim());
    }
  }

  return services.length > 0 ? services : ['Service information not found'];
}

function extractTargetAudience(text: string): string {
  if (!text) return 'General business audience';
  const match = text.match(/target audience[:\s]+([^.\n]+)/i);
  return match && match[1] ? match[1].trim() : 'General business audience';
}

function extractUniqueValue(text: string): string {
  if (!text) return 'Professional service delivery';
  const match = text.match(/unique value|value proposition[:\s]+([^.\n]+)/i);
  return match && match[1] ? match[1].trim() : 'Professional service delivery';
}

function extractTechnicalQuality(text: string): string {
  if (!text) return 'Average';
  const lower = text.toLowerCase();
  if (lower.includes('modern') && lower.includes('fast')) return 'Good';
  if (lower.includes('slow') || lower.includes('outdated')) return 'Needs Improvement';
  return 'Average';
}

function extractContentQuality(text: string): string {
  if (!text) return 'Average';
  const lower = text.toLowerCase();
  if (lower.includes('comprehensive') || lower.includes('detailed')) return 'Good';
  if (lower.includes('thin') || lower.includes('limited')) return 'Needs Improvement';
  return 'Average';
}

function extractPageCount(text: string): number {
  if (!text) return 20;
  const match = text.match(/(\d+)\s*pages?/i);
  return match && match[1] ? parseInt(match[1]) : 20; // Default estimate
}

function parseSocialMediaResponse(text: string): SocialMediaPresence {
  const platforms = [];
  if (!text) {
    return {
      platforms: [],
      overallPresence: 'minimal',
      insights: ['No social media data available'],
    };
  }
  const lines = text.toLowerCase().split('\n');

  // Simple parsing - in production you'd want more robust parsing
  if (lines.some(l => l.includes('linkedin'))) {
    platforms.push({ platform: 'LinkedIn', engagement: 'Unknown' });
  }
  if (lines.some(l => l.includes('facebook'))) {
    platforms.push({ platform: 'Facebook', engagement: 'Unknown' });
  }
  if (lines.some(l => l.includes('twitter') || l.includes('x.com'))) {
    platforms.push({ platform: 'Twitter/X', engagement: 'Unknown' });
  }
  if (lines.some(l => l.includes('instagram'))) {
    platforms.push({ platform: 'Instagram', engagement: 'Unknown' });
  }

  return {
    platforms,
    overallPresence: platforms.length >= 3 ? 'strong' : platforms.length >= 2 ? 'moderate' : 'minimal',
    insights: [`Active on ${platforms.length} platform(s)`],
  };
}

function parseCompanyIntelligence(text: string): CompanyIntelligence {
  if (!text) {
    return {
      companySize: 'small',
      estimatedEmployees: 'Unknown',
      foundedYear: undefined,
      businessModel: 'Mixed',
      strengths: ['Established presence'],
      weaknesses: ['Limited online visibility'],
    };
  }

  const employeeMatch = text.match(/(\d+[-\s]*\d*)\s*employees?/i);
  const foundedMatch = text.match(/founded\s+in\s+(\d{4})/i);

  let companySize: CompanyIntelligence['companySize'] = 'small';
  if (employeeMatch) {
    const count = parseInt(employeeMatch[1].replace(/\D/g, ''));
    if (count >= 250) companySize = 'enterprise';
    else if (count >= 50) companySize = 'large';
    else if (count >= 10) companySize = 'medium';
    else if (count >= 5) companySize = 'small';
    else companySize = 'micro';
  }

  return {
    companySize,
    estimatedEmployees: employeeMatch ? employeeMatch[1] : 'Unknown',
    foundedYear: foundedMatch ? parseInt(foundedMatch[1]) : undefined,
    businessModel: text.toLowerCase().includes('b2b') ? 'B2B' : text.toLowerCase().includes('b2c') ? 'B2C' : 'Mixed',
    strengths: ['Established presence'],
    weaknesses: ['Limited online visibility'],
  };
}

function extractDomain(url: string): string {
  try {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function extractTrafficEstimate(text: string): string {
  const match = text.match(/(\d+[,\d]*)\s*(visitors?|traffic)/i);
  return match ? match[1] + ' monthly visitors' : 'Traffic data unavailable';
}

function parseTrafficValue(traffic: string): number {
  // Parse traffic values like "5,000 monthly visitors" or "10K visitors" to numbers
  if (!traffic || traffic === 'Unknown' || traffic.includes('unavailable')) {
    return 0;
  }

  // Handle K (thousands) and M (millions) notation
  const kMatch = traffic.match(/([\d.]+)K/i);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }

  const mMatch = traffic.match(/([\d.]+)M/i);
  if (mMatch) {
    return parseFloat(mMatch[1]) * 1000000;
  }

  // Handle comma-separated numbers
  const numMatch = traffic.match(/[\d,]+/);
  if (numMatch) {
    return parseInt(numMatch[0].replace(/,/g, ''), 10);
  }

  return 0;
}

function extractStrengths(text: string): string[] {
  const strengths: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('advantage')) {
      const match = line.match(/[-•]\s*(.+)/);
      if (match) strengths.push(match[1].trim());
    }
  }

  return strengths.length > 0 ? strengths : ['Strong organic presence'];
}

function extractDomainAuthority(text: string): number | undefined {
  const match = text.match(/(?:domain authority|da)[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

// ============================================================================
// OPPORTUNITY EXTRACTION
// ============================================================================

function extractLocationOpportunities(
  keywordAnalysis: KeywordRanking[],
  competitors: RealCompetitor[],
  clientDomain?: string
): LocationOpportunity[] {
  const locationMap = new Map<string, {
    mentions: number;
    competitorDomains: Set<string>;
    clientRanking?: number;
    keywords: string[];
  }>();

  // Extract locations from keywords and competitor domains
  const ukCities = [
    'London', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Sheffield',
    'Bristol', 'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford',
    'Hull', 'Southampton', 'Reading', 'Derby', 'Plymouth', 'York', 'Cambridge',
    'Oxford', 'Brighton', 'Exeter', 'Norwich', 'Ipswich', 'Gloucester',
    'Cheltenham', 'Harrogate', 'Shipley', 'Baildon'
  ];

  // Scan keywords for location mentions
  keywordAnalysis.forEach(kw => {
    ukCities.forEach(city => {
      if (kw.keyword.toLowerCase().includes(city.toLowerCase())) {
        if (!locationMap.has(city)) {
          locationMap.set(city, {
            mentions: 0,
            competitorDomains: new Set(),
            keywords: []
          });
        }
        const loc = locationMap.get(city)!;
        loc.mentions++;
        loc.keywords.push(kw.keyword);

        // Track if client ranks for this
        if (kw.position && kw.position <= 10) {
          loc.clientRanking = kw.position;
        }

        // Track competitors appearing for this location
        kw.topRankers.forEach(ranker => {
          loc.competitorDomains.add(ranker.domain);
        });
      }
    });
  });

  // Convert to array and prioritize
  const opportunities: LocationOpportunity[] = [];

  locationMap.forEach((data, location) => {
    const competitorDomains = Array.from(data.competitorDomains);
    const hasClientRanking = data.clientRanking !== undefined;
    const competitorCount = competitorDomains.length;

    let priority: 'High' | 'Medium' | 'Low' = 'Low';

    if (hasClientRanking && data.clientRanking! <= 3) {
      // Already ranking well - maintain and expand
      priority = 'High';
    } else if (competitorCount <= 2) {
      // Low competition opportunity
      priority = 'High';
    } else if (data.mentions >= 2) {
      // Multiple keyword mentions
      priority = 'Medium';
    }

    opportunities.push({
      location,
      priority,
      estimatedVolume: estimateLocationVolume(location, data.mentions),
      competition: competitorCount <= 2 ? 'Low' : competitorCount <= 4 ? 'Medium' : 'High',
      competitorDomains: competitorDomains.slice(0, 3),
      currentRanking: data.clientRanking
    });
  });

  // Sort by priority
  return opportunities.sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function estimateLocationVolume(location: string, mentions: number): string {
  // Rough estimates based on city size and mentions
  const largeUKCities = ['London', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool'];
  const mediumUKCities = ['Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester'];

  if (largeUKCities.includes(location)) {
    return '500-1000/month';
  } else if (mediumUKCities.includes(location)) {
    return '300-500/month';
  } else {
    return '100-300/month';
  }
}

function extractContentOpportunities(
  keywordAnalysis: KeywordRanking[]
): ContentOpportunity[] {
  const contentOpps: ContentOpportunity[] = [];

  keywordAnalysis.forEach(kw => {
    // Extract PAA questions as content opportunities
    kw.peopleAlsoAsk?.forEach(question => {
      const contentIdea = generateContentIdeaFromQuestion(question);

      contentOpps.push({
        question,
        keyword: kw.keyword,
        contentIdea,
        searchIntent: determineQuestionIntent(question),
        priority: kw.searchVolume > 300 ? 'High' : kw.searchVolume > 150 ? 'Medium' : 'Low'
      });
    });

    // Extract related searches as content opportunities
    kw.relatedSearches?.forEach(relatedSearch => {
      // Convert related search to a question format
      const question = `Content targeting: ${relatedSearch}`;

      contentOpps.push({
        question,
        keyword: relatedSearch,
        contentIdea: `Create page/post targeting "${relatedSearch}"`,
        searchIntent: detectIntent(relatedSearch),
        priority: 'Medium'
      });
    });
  });

  // Deduplicate and prioritize
  const uniqueOpps = contentOpps.filter((opp, index, self) =>
    index === self.findIndex(o => o.question === opp.question)
  );

  return uniqueOpps
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 20); // Top 20 content opportunities
}

function generateContentIdeaFromQuestion(question: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('how much') || lowerQ.includes('cost') || lowerQ.includes('price')) {
    return `Pricing guide: "${question}"`;
  } else if (lowerQ.includes('how to') || lowerQ.includes('how do')) {
    return `How-to guide: "${question}"`;
  } else if (lowerQ.includes('what is') || lowerQ.includes('what are')) {
    return `Educational post: "${question}"`;
  } else if (lowerQ.includes('best') || lowerQ.includes('top')) {
    return `Comparison/listicle: "${question}"`;
  } else if (lowerQ.includes('can i') || lowerQ.includes('do i')) {
    return `FAQ page: "${question}"`;
  } else {
    return `Blog post answering: "${question}"`;
  }
}

function determineQuestionIntent(question: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('buy') || lowerQ.includes('price') || lowerQ.includes('cost')) {
    return 'Transactional';
  } else if (lowerQ.includes('how to') || lowerQ.includes('what is') || lowerQ.includes('guide')) {
    return 'Informational';
  } else if (lowerQ.includes('best') || lowerQ.includes('top') || lowerQ.includes('review')) {
    return 'Commercial Investigation';
  } else {
    return 'Informational';
  }
}

// ============================================================================
// MAIN RESEARCH ORCHESTRATION
// ============================================================================

export async function conductEnhancedResearch(
  request: EnhancedResearchRequest
): Promise<EnhancedResearchResult> {
  const { companyName, website, industry, location, targetKeywords, notes, packageTier } = request;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  ENHANCED RESEARCH STARTING: ${companyName.padEnd(39, ' ')}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('Company:', companyName);
  console.log('Website:', website || 'Not provided');
  console.log('Industry:', industry || 'Not specified');
  console.log('Location:', location || 'Not specified');
  console.log('Package Tier:', packageTier || 'local (default)');
  console.log('Notes:', notes ? notes.substring(0, 100) + '...' : 'None');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // BACKSTOP: If industry is vague or missing, analyze website first to extract actual services
  let extractedIndustry = industry;
  let websiteServicesForKeywords: string[] = [];

  if (website && (!industry || industry === 'United Kingdom' || industry === 'Unknown' || industry?.length < 5)) {
    console.log('⚠️  Industry not specified or too vague - analyzing website to extract services first...\n');
    try {
      const preliminaryAnalysis = await analyzeWebsiteWithPerplexity(website, companyName);
      websiteServicesForKeywords = preliminaryAnalysis.mainServices.filter(s => s !== 'Services not analyzed' && s !== 'Service information not found');

      if (websiteServicesForKeywords.length > 0) {
        console.log('✅ Extracted services from website:', websiteServicesForKeywords.join(', '));
        // Use the first service as the industry hint for better keyword generation
        extractedIndustry = websiteServicesForKeywords[0];
        console.log('✅ Using extracted industry:', extractedIndustry, '\n');
      }
    } catch (error) {
      console.warn('⚠️  Could not extract services from website, will use generic approach:', error);
    }
  }

  // Generate intelligent keywords if not provided
  const keywords = targetKeywords && targetKeywords.length > 0
    ? targetKeywords
    : await generateTargetKeywords(companyName, extractedIndustry, location, packageTier || 'local', websiteServicesForKeywords);

  console.log('🎯 Target Keywords:', keywords.join(', '));
  console.log('\n🚀 Starting parallel research across 5 data sources...\n');

  // Parallel research execution
  const [
    companyIntelligence,
    websiteAnalysis,
    socialMedia,
    keywordAnalysis,
    competitors,
  ] = await Promise.all([
    website ? gatherCompanyIntelligence(companyName, website) : Promise.resolve({
      companySize: 'small' as const,
      businessModel: industry || 'Unknown',
      strengths: ['Established business'],
      weaknesses: ['Limited data available'],
    }),
    website ? analyzeWebsiteWithPerplexity(website, companyName) : Promise.resolve({
      mainServices: ['Services not analyzed'],
      targetAudience: 'Unknown',
      uniqueValue: 'Unknown',
      technicalQuality: 'Not analyzed',
      contentQuality: 'Not analyzed',
      hasLiveChat: false,
      hasBlog: false,
      estimatedPageCount: 0,
    }),
    researchSocialMedia(companyName, website),
    website ? checkRealRankings(companyName, website, keywords, location, packageTier || 'local') : Promise.resolve([]),
    findRealCompetitors(keywords, location, 5, website, 'Unknown', packageTier || 'local'),
  ]);

  // Market intelligence analysis
  const totalSearchVolume = keywordAnalysis.reduce((sum, kw) => sum + kw.searchVolume, 0);
  const avgDifficulty = keywordAnalysis.filter(kw => kw.difficulty === 'High' || kw.difficulty === 'Very High').length;

  const marketIntelligence: MarketIntelligence = {
    totalSearchVolume,
    competitionLevel: avgDifficulty > keywordAnalysis.length / 2 ? 'high' : 'medium',
    growthOpportunity: totalSearchVolume > 10000 ? 'Significant market opportunity' : 'Moderate opportunity',
    quickWins: identifyQuickWins(keywordAnalysis, competitors),
  };

  // Extract location and content opportunities
  const locationOpportunities = extractLocationOpportunities(keywordAnalysis, competitors, website);
  const contentOpportunities = extractContentOpportunities(keywordAnalysis);

  // LOG: Final aggregated research results
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ENHANCED RESEARCH COMPLETE                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📊 RESEARCH SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════════');

  console.log('\n🏢 COMPANY INTELLIGENCE:');
  console.log('  ├─ Company Size:', companyIntelligence.companySize);
  console.log('  ├─ Employees:', 'estimatedEmployees' in companyIntelligence ? companyIntelligence.estimatedEmployees : 'Unknown');
  console.log('  ├─ Business Model:', companyIntelligence.businessModel);
  console.log('  ├─ Strengths:', companyIntelligence.strengths?.slice(0, 2).join(', ') || 'None');
  console.log('  └─ Weaknesses:', companyIntelligence.weaknesses?.slice(0, 2).join(', ') || 'None');

  console.log('\n🌐 WEBSITE ANALYSIS:');
  console.log('  ├─ Main Services:', websiteAnalysis.mainServices?.slice(0, 2).join(', ') || 'None');
  console.log('  ├─ Target Audience:', websiteAnalysis.targetAudience);
  console.log('  ├─ Technical Quality:', websiteAnalysis.technicalQuality);
  console.log('  ├─ Content Quality:', websiteAnalysis.contentQuality);
  console.log('  ├─ Has Live Chat:', websiteAnalysis.hasLiveChat ? 'Yes' : 'No');
  console.log('  ├─ Has Blog:', websiteAnalysis.hasBlog ? 'Yes' : 'No');
  console.log('  └─ Page Count:', websiteAnalysis.estimatedPageCount);

  console.log('\n📱 SOCIAL MEDIA:');
  console.log('  ├─ Platforms:', socialMedia.platforms.length);
  console.log('  ├─ Overall Presence:', socialMedia.overallPresence);
  console.log('  └─ Active On:', socialMedia.platforms.map(p => p.platform).join(', ') || 'None detected');

  console.log('\n🔍 KEYWORD ANALYSIS:');
  console.log('  ├─ Keywords Analyzed:', keywordAnalysis.length);
  console.log('  ├─ Total Search Volume:', totalSearchVolume.toLocaleString(), '/month');
  console.log('  ├─ High Difficulty:', avgDifficulty, 'keywords');
  console.log('  └─ Competition Level:', marketIntelligence.competitionLevel);

  console.log('\n🏆 COMPETITORS:');
  console.log('  ├─ Competitors Found:', competitors.length);
  competitors.forEach((comp, idx) => {
    console.log(`  │   ${idx + 1}. ${comp.domain} (${comp.name})`);
  });

  console.log('\n💡 MARKET INTELLIGENCE:');
  console.log('  ├─ Market Opportunity:', marketIntelligence.growthOpportunity);
  console.log('  ├─ Quick Wins:', marketIntelligence.quickWins?.length || 0);
  if (marketIntelligence.quickWins && marketIntelligence.quickWins.length > 0) {
    marketIntelligence.quickWins.forEach((win, idx) => {
      console.log(`  │   ${idx + 1}. ${win}`);
    });
  }

  console.log('\n📍 LOCATION OPPORTUNITIES:');
  console.log('  ├─ Locations Identified:', locationOpportunities.length);
  locationOpportunities.slice(0, 5).forEach((loc, idx) => {
    console.log(`  │   ${idx + 1}. ${loc.location} [${loc.priority}] - ${loc.estimatedVolume}`);
  });

  console.log('\n📝 CONTENT OPPORTUNITIES:');
  console.log('  ├─ Content Ideas:', contentOpportunities.length);
  console.log('  ├─ From PAA Questions:', keywordAnalysis.reduce((sum, kw) => sum + (kw.peopleAlsoAsk?.length || 0), 0));
  console.log('  └─ From Related Searches:', keywordAnalysis.reduce((sum, kw) => sum + (kw.relatedSearches?.length || 0), 0));
  contentOpportunities.slice(0, 5).forEach((content, idx) => {
    console.log(`  │   ${idx + 1}. ${content.question.substring(0, 60)}...`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Research data ready for Claude analysis\n');

  return {
    companyIntelligence,
    websiteAnalysis,
    socialMedia,
    keywordAnalysis,
    competitors,
    marketIntelligence,
    locationOpportunities,
    contentOpportunities,
    rawResearchData: {
      perplexityInsights: [],
      serpData: [],
    },
  };
}

/**
 * Generate Target Keywords - REDESIGNED
 *
 * CRITICAL FIX: No longer searches brand names (circular logic)
 * Now generates service + location keywords based on package tier
 *
 * Strategy by Package Tier:
 * - LOCAL: Hyper-local service keywords (e.g., "solar panel installers helston")
 * - REGIONAL: Regional keywords + major towns (e.g., "solar installers cornwall")
 * - NATIONAL: Mix of branded + national service keywords
 *
 * @param companyName - NOT used for keyword generation (only for logging)
 * @param industry - Used to lookup service keywords from mapping
 * @param location - Parsed into city/county for location-based keywords
 * @param packageTier - Determines keyword strategy (local/regional/national)
 */
async function generateTargetKeywords(
  companyName: string,
  industry?: string,
  location?: string,
  packageTier: 'local' | 'regional' | 'national' = 'local',
  extractedServices?: string[]
): Promise<string[]> {
  // Import keyword templates (dynamic to avoid circular dependency)
  const { getServicesForIndustry, parseLocation } = await import('./keyword-templates');

  const keywords: string[] = [];

  // Get service keywords - prioritize extracted services from website
  let services;
  if (extractedServices && extractedServices.length > 0) {
    console.log('[Keyword Generation] Using extracted services from website:', extractedServices);
    services = {
      primaryServices: extractedServices.slice(0, 5),
      secondaryServices: extractedServices.slice(5, 10),
      localModifiers: ['near me', 'nearby', 'local'],
    };
  } else {
    services = getServicesForIndustry(industry);
  }

  const locationParts = parseLocation(location);

  console.log('[Keyword Generation] Configuration:', {
    industry,
    location,
    packageTier,
    city: locationParts.city,
    county: locationParts.county,
    primaryServicesCount: services.primaryServices.length,
  });

  // ============================================================================
  // PACKAGE TIER STRATEGIES
  // ============================================================================

  if (packageTier === 'local') {
    // ========================================================================
    // LOCAL STRATEGY: Hyper-local service + location keywords
    // Target: Customers in specific city/town searching for services nearby
    // ========================================================================

    // Primary: "service city" (e.g., "solar panel installers helston")
    if (locationParts.city) {
      services.primaryServices.forEach(service => {
        keywords.push(`${service} ${locationParts.city}`);
      });

      // Secondary: "service near city"
      services.primaryServices.slice(0, 2).forEach(service => {
        keywords.push(`${service} near ${locationParts.city}`);
      });
    }

    // County-level: "service county" (e.g., "solar installers cornwall")
    if (locationParts.county) {
      services.primaryServices.slice(0, 3).forEach(service => {
        keywords.push(`${service} ${locationParts.county}`);
      });
    }

    // Fallback: If no location, use country
    if (!locationParts.city && !locationParts.county) {
      services.primaryServices.slice(0, 2).forEach(service => {
        keywords.push(`${service} ${locationParts.country || 'UK'}`);
      });
    }

  } else if (packageTier === 'regional') {
    // ========================================================================
    // REGIONAL STRATEGY: Regional keywords + major area coverage
    // Target: Customers across county/region searching for services
    // ========================================================================

    // Regional: "service county"
    if (locationParts.county) {
      services.primaryServices.forEach(service => {
        keywords.push(`${service} ${locationParts.county}`);
      });

      // Best/top variations
      services.primaryServices.slice(0, 2).forEach(service => {
        keywords.push(`best ${service} ${locationParts.county}`);
      });
    }

    // City-level for primary services
    if (locationParts.city) {
      services.primaryServices.slice(0, 3).forEach(service => {
        keywords.push(`${service} ${locationParts.city}`);
      });
    }

    // Secondary services (regional only)
    if (locationParts.county) {
      services.secondaryServices.slice(0, 3).forEach(service => {
        keywords.push(`${service} ${locationParts.county}`);
      });
    }

  } else if (packageTier === 'national') {
    // ========================================================================
    // NATIONAL STRATEGY: Mix of national + local brand building
    // Target: Nationwide visibility + local presence
    // ========================================================================

    // National service keywords (no location)
    services.primaryServices.slice(0, 3).forEach(service => {
      keywords.push(service);
      keywords.push(`best ${service}`);
    });

    // Country-level
    services.primaryServices.slice(0, 2).forEach(service => {
      keywords.push(`${service} ${locationParts.country || 'UK'}`);
    });

    // Local presence (if location provided)
    if (locationParts.city) {
      services.primaryServices.slice(0, 2).forEach(service => {
        keywords.push(`${service} ${locationParts.city}`);
      });
    }

    // Related terms for broader reach
    if (services.relatedTerms && Array.isArray(services.relatedTerms)) {
      services.relatedTerms.slice(0, 2).forEach(term => {
        keywords.push(term);
      });
    }
  }

  // ============================================================================
  // MONEY KEYWORDS: High-intent commercial searches
  // Add for all package tiers (limited to avoid keyword bloat)
  // ============================================================================
  const locationStr = locationParts.city || locationParts.county || locationParts.country || 'UK';

  // "near me" searches (high mobile intent)
  if (packageTier === 'local' || packageTier === 'regional') {
    services.primaryServices.slice(0, 2).forEach(service => {
      keywords.push(`${service} near me`);
    });
  }

  // Remove duplicates and empty strings
  const uniqueKeywords = Array.from(new Set(keywords.filter(Boolean)));

  console.log('[Keyword Generation] ✅ Generated keywords:', {
    total: uniqueKeywords.length,
    packageTier,
    sampleKeywords: uniqueKeywords.slice(0, 5),
  });

  return uniqueKeywords;
}

function identifyQuickWins(
  keywords: KeywordRanking[],
  competitors: RealCompetitor[]
): string[] {
  const quickWins: string[] = [];

  // Low difficulty, high volume keywords
  const easyHighVolume = keywords.filter(
    kw => kw.difficulty === 'Low' && kw.searchVolume > 200
  );
  if (easyHighVolume.length > 0) {
    quickWins.push(`Target ${easyHighVolume.length} low-competition, high-volume keywords`);
  }

  // Keywords where competitors are weak
  const weakCompetitorKeywords = keywords.filter(kw => {
    const topRankerDomains = kw.topRankers.slice(0, 3).map(r => r.domain);
    return !competitors.some(c => topRankerDomains.includes(c.domain));
  });
  if (weakCompetitorKeywords.length > 0) {
    quickWins.push(`${weakCompetitorKeywords.length} keywords with weak top-ranking sites`);
  }

  // Local intent opportunities
  const localKeywords = keywords.filter(kw => kw.intent === 'Local');
  if (localKeywords.length > 0) {
    quickWins.push(`Capitalize on ${localKeywords.length} local search opportunities`);
  }

  return quickWins;
}
