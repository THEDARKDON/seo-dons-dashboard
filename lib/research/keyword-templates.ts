/**
 * Industry-to-Services Mapping
 *
 * Maps industries to specific service keywords for accurate SEO research
 * Avoids circular logic of searching brand names to find competitors
 */

export interface ServiceKeywordTemplate {
  primaryServices: string[];
  secondaryServices: string[];
  relatedTerms: string[];
}

/**
 * Comprehensive industry-to-services mapping
 * Used to generate realistic service + location keywords
 */
export const INDUSTRY_TO_SERVICES: Record<string, ServiceKeywordTemplate> = {
  // ============================================================================
  // ENERGY & SUSTAINABILITY
  // ============================================================================
  'Solar': {
    primaryServices: [
      'solar panel installation',
      'solar panel installers',
      'solar panels',
      'solar pv installation',
    ],
    secondaryServices: [
      'solar battery storage',
      'solar energy systems',
      'solar panel maintenance',
      'solar panel repair',
      'commercial solar installation',
      'residential solar panels',
    ],
    relatedTerms: [
      'renewable energy',
      'solar power',
      'photovoltaic systems',
      'solar energy',
    ],
  },

  'Renewable Energy': {
    primaryServices: [
      'renewable energy solutions',
      'solar installation',
      'wind energy',
      'green energy',
    ],
    secondaryServices: [
      'energy storage',
      'battery systems',
      'solar pv',
      'renewable power',
    ],
    relatedTerms: [
      'sustainable energy',
      'clean energy',
      'eco energy',
    ],
  },

  // ============================================================================
  // HOME SERVICES
  // ============================================================================
  'Plumbing': {
    primaryServices: [
      'plumbers',
      'plumbing services',
      'emergency plumber',
      'plumbing repairs',
    ],
    secondaryServices: [
      'boiler installation',
      'heating engineer',
      'drain cleaning',
      'leak repairs',
      'bathroom installation',
      'central heating',
    ],
    relatedTerms: [
      'plumbing company',
      'local plumber',
      'plumbing contractor',
    ],
  },

  'Electrical': {
    primaryServices: [
      'electricians',
      'electrical services',
      'electrical contractors',
      'electrical installation',
    ],
    secondaryServices: [
      'emergency electrician',
      'rewiring',
      'electrical repairs',
      'ev charger installation',
      'electrical testing',
      'commercial electrician',
    ],
    relatedTerms: [
      'electrical company',
      'local electrician',
      'certified electrician',
    ],
  },

  'HVAC': {
    primaryServices: [
      'hvac services',
      'air conditioning installation',
      'heating and cooling',
      'hvac contractors',
    ],
    secondaryServices: [
      'ac repair',
      'furnace installation',
      'hvac maintenance',
      'ductwork',
      'heat pump installation',
    ],
    relatedTerms: [
      'hvac company',
      'climate control',
      'air conditioning',
    ],
  },

  'Roofing': {
    primaryServices: [
      'roofing services',
      'roof installation',
      'roofers',
      'roof repairs',
    ],
    secondaryServices: [
      'roof replacement',
      'flat roofing',
      'tile roofing',
      'roof maintenance',
      'emergency roof repairs',
      'commercial roofing',
    ],
    relatedTerms: [
      'roofing company',
      'roofing contractor',
      'local roofer',
    ],
  },

  // ============================================================================
  // CONSTRUCTION & RENOVATION
  // ============================================================================
  'Construction': {
    primaryServices: [
      'construction services',
      'building contractors',
      'construction company',
      'general contractor',
    ],
    secondaryServices: [
      'home renovation',
      'commercial construction',
      'building extensions',
      'new builds',
      'refurbishment',
    ],
    relatedTerms: [
      'construction firm',
      'builders',
      'construction contractor',
    ],
  },

  'Home Improvement': {
    primaryServices: [
      'home improvement services',
      'home renovation',
      'remodeling',
      'home upgrades',
    ],
    secondaryServices: [
      'kitchen renovation',
      'bathroom remodel',
      'basement finishing',
      'home extensions',
    ],
    relatedTerms: [
      'home improvement company',
      'renovation contractor',
      'remodeling services',
    ],
  },

  // ============================================================================
  // PROFESSIONAL SERVICES
  // ============================================================================
  'Accounting': {
    primaryServices: [
      'accounting services',
      'accountants',
      'tax services',
      'bookkeeping',
    ],
    secondaryServices: [
      'tax preparation',
      'payroll services',
      'financial planning',
      'business accounting',
      'tax accountant',
    ],
    relatedTerms: [
      'accounting firm',
      'chartered accountants',
      'cpa services',
    ],
  },

  'Legal': {
    primaryServices: [
      'legal services',
      'lawyers',
      'attorneys',
      'law firm',
    ],
    secondaryServices: [
      'business law',
      'family law',
      'estate planning',
      'personal injury lawyer',
      'corporate law',
    ],
    relatedTerms: [
      'legal advice',
      'solicitors',
      'legal counsel',
    ],
  },

  'Marketing': {
    primaryServices: [
      'marketing services',
      'digital marketing',
      'marketing agency',
      'marketing consultant',
    ],
    secondaryServices: [
      'seo services',
      'social media marketing',
      'content marketing',
      'ppc management',
      'email marketing',
      'brand strategy',
    ],
    relatedTerms: [
      'marketing company',
      'marketing firm',
      'advertising agency',
    ],
  },

  // ============================================================================
  // HEALTHCARE
  // ============================================================================
  'Dental': {
    primaryServices: [
      'dental services',
      'dentist',
      'dental clinic',
      'dental practice',
    ],
    secondaryServices: [
      'teeth whitening',
      'dental implants',
      'orthodontics',
      'cosmetic dentistry',
      'emergency dentist',
    ],
    relatedTerms: [
      'dental care',
      'family dentist',
      'dental surgery',
    ],
  },

  'Medical': {
    primaryServices: [
      'medical services',
      'healthcare',
      'medical clinic',
      'doctor',
    ],
    secondaryServices: [
      'primary care',
      'urgent care',
      'family medicine',
      'medical practice',
    ],
    relatedTerms: [
      'medical center',
      'healthcare provider',
      'physician',
    ],
  },

  // ============================================================================
  // AUTOMOTIVE
  // ============================================================================
  'Auto Repair': {
    primaryServices: [
      'auto repair',
      'car repair',
      'auto service',
      'mechanic',
    ],
    secondaryServices: [
      'brake repair',
      'oil change',
      'transmission repair',
      'engine repair',
      'auto maintenance',
    ],
    relatedTerms: [
      'auto shop',
      'car service',
      'automotive repair',
    ],
  },

  // ============================================================================
  // REAL ESTATE
  // ============================================================================
  'Real Estate': {
    primaryServices: [
      'real estate services',
      'real estate agent',
      'property sales',
      'estate agent',
    ],
    secondaryServices: [
      'property management',
      'home sales',
      'commercial real estate',
      'property valuations',
      'lettings',
    ],
    relatedTerms: [
      'real estate agency',
      'property agent',
      'realtor',
    ],
  },

  // ============================================================================
  // CLEANING & MAINTENANCE
  // ============================================================================
  'Cleaning': {
    primaryServices: [
      'cleaning services',
      'cleaners',
      'commercial cleaning',
      'office cleaning',
    ],
    secondaryServices: [
      'residential cleaning',
      'deep cleaning',
      'carpet cleaning',
      'window cleaning',
      'end of tenancy cleaning',
    ],
    relatedTerms: [
      'cleaning company',
      'cleaning contractors',
      'professional cleaners',
    ],
  },

  'Landscaping': {
    primaryServices: [
      'landscaping services',
      'landscapers',
      'garden design',
      'lawn care',
    ],
    secondaryServices: [
      'tree surgery',
      'garden maintenance',
      'patio installation',
      'fencing',
      'artificial grass',
    ],
    relatedTerms: [
      'landscaping company',
      'garden services',
      'landscape design',
    ],
  },

  'Walk in Baths': {
    primaryServices: [
      'walk in baths',
      'walk in bath installation',
      'easy access baths',
      'walk in bathtubs',
    ],
    secondaryServices: [
      'disabled access baths',
      'mobility baths',
      'walk in showers',
      'wet rooms',
      'bath conversion',
      'accessible bathing',
    ],
    relatedTerms: [
      'walk in bathtubs',
      'easy access bathing',
      'mobility bathing',
    ],
  },

  // ============================================================================
  // FOOD & HOSPITALITY
  // ============================================================================
  'Restaurant': {
    primaryServices: [
      'restaurant',
      'dining',
      'food service',
      'catering',
    ],
    secondaryServices: [
      'takeaway',
      'delivery',
      'private dining',
      'event catering',
    ],
    relatedTerms: [
      'eatery',
      'bistro',
      'cafe',
    ],
  },

  // ============================================================================
  // TECHNOLOGY
  // ============================================================================
  'IT Services': {
    primaryServices: [
      'it services',
      'it support',
      'managed it services',
      'it consultant',
    ],
    secondaryServices: [
      'network support',
      'cloud services',
      'cybersecurity',
      'it infrastructure',
      'help desk',
    ],
    relatedTerms: [
      'it company',
      'technology services',
      'it solutions',
    ],
  },

  'Web Design': {
    primaryServices: [
      'web design',
      'website design',
      'web development',
      'website builder',
    ],
    secondaryServices: [
      'ecommerce development',
      'wordpress development',
      'responsive design',
      'website redesign',
      'web hosting',
    ],
    relatedTerms: [
      'web design agency',
      'web designers',
      'website development',
    ],
  },

  // ============================================================================
  // GENERIC FALLBACK
  // ============================================================================
  'Services': {
    primaryServices: [
      'professional services',
      'business services',
      'local services',
    ],
    secondaryServices: [
      'consulting',
      'contractor',
      'service provider',
    ],
    relatedTerms: [
      'service company',
      'professional company',
    ],
  },
};

/**
 * Get service keywords for an industry
 * Falls back to generic 'Services' if industry not found
 *
 * Handles messy input:
 * - "Walk in Baths.  " (trailing period/spaces) → "Walk in Baths"
 * - "solar energy" (lowercase) → "Solar"
 * - "Plumbing Services" → "Plumbing"
 */
export function getServicesForIndustry(industry?: string): ServiceKeywordTemplate {
  if (!industry) {
    return INDUSTRY_TO_SERVICES['Services'];
  }

  // Clean the industry string: trim, remove trailing periods/punctuation
  const cleanedIndustry = industry.trim().replace(/[.,;:!?]+$/g, '').trim();

  if (!cleanedIndustry) {
    return INDUSTRY_TO_SERVICES['Services'];
  }

  // Try exact match first
  if (INDUSTRY_TO_SERVICES[cleanedIndustry]) {
    return INDUSTRY_TO_SERVICES[cleanedIndustry];
  }

  // Try case-insensitive match
  const industryLower = cleanedIndustry.toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_TO_SERVICES)) {
    if (key.toLowerCase() === industryLower) {
      console.log(`[Keyword Templates] Matched "${industry}" → "${key}" (case-insensitive)`);
      return value;
    }
  }

  // Try partial match (e.g., "Solar Energy" matches "Solar")
  for (const [key, value] of Object.entries(INDUSTRY_TO_SERVICES)) {
    if (industryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(industryLower)) {
      console.log(`[Keyword Templates] Matched "${industry}" → "${key}" (partial match)`);
      return value;
    }
  }

  // Fallback to generic services
  console.warn(`[Keyword Templates] Industry "${industry}" not found in mapping, using generic services`);
  return INDUSTRY_TO_SERVICES['Services'];
}

/**
 * Extract location components from location string
 * Handles various formats: "City, State, Country", "City, County", etc.
 */
export function parseLocation(location?: string): {
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  full: string;
} {
  if (!location) {
    return { full: 'UK' };
  }

  const parts = location.split(',').map(s => s.trim()).filter(Boolean);

  if (parts.length === 0) {
    return { full: 'UK' };
  }

  if (parts.length === 1) {
    return {
      city: parts[0],
      full: parts[0],
    };
  }

  if (parts.length === 2) {
    return {
      city: parts[0],
      county: parts[1],
      full: location,
    };
  }

  if (parts.length >= 3) {
    return {
      city: parts[0],
      county: parts[1],
      country: parts[2],
      full: location,
    };
  }

  return { full: location };
}
