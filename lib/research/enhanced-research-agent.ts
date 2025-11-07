/**
 * Enhanced Research Agent
 *
 * Conducts real web research using Perplexity AI and SerpAPI
 * to gather actual competitor data, rankings, and market intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
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

export interface EnhancedResearchResult {
  companyIntelligence: CompanyIntelligence;
  websiteAnalysis: WebsiteAnalysis;
  socialMedia: SocialMediaPresence;
  keywordAnalysis: KeywordRanking[];
  competitors: RealCompetitor[];
  marketIntelligence: MarketIntelligence;
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

  const anthropic = new Anthropic({
    apiKey: PERPLEXITY_API_KEY,
    baseURL: 'https://api.perplexity.ai',
  });

  try {
    const response = await anthropic.messages.create({
      model: 'sonar-pro',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: query,
      }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Perplexity research error:', error);
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

async function checkRealRankings(
  companyName: string,
  domain: string,
  keywords: string[],
  location: string = 'United Kingdom'
): Promise<KeywordRanking[]> {
  if (!SERPAPI_KEY) {
    throw new Error('SerpAPI key not configured');
  }

  const rankings: KeywordRanking[] = [];

  for (const keyword of keywords) {
    try {
      const results = await getJson({
        api_key: SERPAPI_KEY,
        engine: 'google',
        q: keyword,
        location: location,
        num: 100,
        gl: 'uk',
        hl: 'en',
      });

      // Find client's position
      const position = results.organic_results?.findIndex((r: any) =>
        r.link?.includes(domain.replace('https://', '').replace('http://', '').split('/')[0])
      );

      // Get search volume estimate from related searches or keywords
      const searchVolume = await estimateSearchVolume(keyword);

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
  limit: number = 5
): Promise<RealCompetitor[]> {
  if (!SERPAPI_KEY) {
    throw new Error('SerpAPI key not configured');
  }

  const competitorMap = new Map<string, {
    name: string;
    domain: string;
    rankings: { keyword: string; position: number }[];
    appearances: number;
  }>();

  // Check top 10 for each keyword to find consistent competitors
  for (const keyword of keywords.slice(0, 3)) { // Limit to first 3 keywords to save API calls
    try {
      const results = await getJson({
        api_key: SERPAPI_KEY,
        engine: 'google',
        q: keyword,
        location: location,
        num: 10,
        gl: 'uk',
        hl: 'en',
      });

      results.organic_results?.forEach((result: any, idx: number) => {
        const domain = extractDomain(result.link);
        if (!competitorMap.has(domain)) {
          competitorMap.set(domain, {
            name: result.title.split('|')[0].split('-')[0].trim(),
            domain,
            rankings: [],
            appearances: 0,
          });
        }

        const competitor = competitorMap.get(domain)!;
        competitor.rankings.push({ keyword, position: idx + 1 });
        competitor.appearances++;
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error finding competitors for "${keyword}":`, error);
    }
  }

  // Sort by appearances and get top competitors
  const topCompetitors = Array.from(competitorMap.values())
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, limit);

  // Enhance with Perplexity research
  const enhancedCompetitors: RealCompetitor[] = [];
  for (const competitor of topCompetitors) {
    try {
      const research = await researchWithPerplexity(
        `Analyze ${competitor.domain} as a competitor. Provide: 1) Estimated monthly traffic, 2) Main strengths, 3) Domain authority if known. Be concise.`
      );

      enhancedCompetitors.push({
        name: competitor.name,
        domain: competitor.domain,
        estimatedTraffic: extractTrafficEstimate(research),
        strengths: extractStrengths(research),
        rankings: competitor.rankings,
        domainAuthority: extractDomainAuthority(research),
      });
    } catch (error) {
      console.error(`Error researching competitor ${competitor.domain}:`, error);
      // Add without enhancement
      enhancedCompetitors.push({
        name: competitor.name,
        domain: competitor.domain,
        estimatedTraffic: 'Unknown',
        strengths: ['Consistent organic visibility'],
        rankings: competitor.rankings,
      });
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
  const services: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.toLowerCase().includes('service') || line.toLowerCase().includes('offer')) {
      const match = line.match(/[-•]\s*(.+)/);
      if (match) services.push(match[1].trim());
    }
  }

  return services.length > 0 ? services : ['Service information not found'];
}

function extractTargetAudience(text: string): string {
  const match = text.match(/target audience[:\s]+([^.\n]+)/i);
  return match ? match[1].trim() : 'General business audience';
}

function extractUniqueValue(text: string): string {
  const match = text.match(/unique value|value proposition[:\s]+([^.\n]+)/i);
  return match ? match[1].trim() : 'Professional service delivery';
}

function extractTechnicalQuality(text: string): string {
  if (text.toLowerCase().includes('modern') && text.toLowerCase().includes('fast')) return 'Good';
  if (text.toLowerCase().includes('slow') || text.toLowerCase().includes('outdated')) return 'Needs Improvement';
  return 'Average';
}

function extractContentQuality(text: string): string {
  if (text.toLowerCase().includes('comprehensive') || text.toLowerCase().includes('detailed')) return 'Good';
  if (text.toLowerCase().includes('thin') || text.toLowerCase().includes('limited')) return 'Needs Improvement';
  return 'Average';
}

function extractPageCount(text: string): number {
  const match = text.match(/(\d+)\s*pages?/i);
  return match ? parseInt(match[1]) : 20; // Default estimate
}

function parseSocialMediaResponse(text: string): SocialMediaPresence {
  const platforms = [];
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
// MAIN RESEARCH ORCHESTRATION
// ============================================================================

export async function conductEnhancedResearch(
  request: EnhancedResearchRequest
): Promise<EnhancedResearchResult> {
  const { companyName, website, industry, location, targetKeywords, notes } = request;

  console.log(`Starting enhanced research for ${companyName}...`);

  // Generate intelligent keywords if not provided
  const keywords = targetKeywords && targetKeywords.length > 0
    ? targetKeywords
    : await generateTargetKeywords(companyName, industry, location);

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
    website ? checkRealRankings(companyName, website, keywords, location) : Promise.resolve([]),
    findRealCompetitors(keywords, location, 5),
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

  return {
    companyIntelligence,
    websiteAnalysis,
    socialMedia,
    keywordAnalysis,
    competitors,
    marketIntelligence,
    rawResearchData: {
      perplexityInsights: [],
      serpData: [],
    },
  };
}

async function generateTargetKeywords(
  companyName: string,
  industry?: string,
  location?: string
): Promise<string[]> {
  const baseKeywords = [
    companyName,
    `${industry || 'services'}`,
    `${industry || 'services'} ${location || 'UK'}`,
  ];

  if (industry) {
    baseKeywords.push(
      `best ${industry} company`,
      `${industry} near me`,
      `${industry} services`
    );
  }

  return baseKeywords.filter(Boolean);
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
