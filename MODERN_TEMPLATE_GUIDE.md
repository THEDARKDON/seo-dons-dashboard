# Modern Template System - Implementation Guide

## Overview

The modern template system provides a beautiful, client-facing alternative to the classic PDF-style proposals. Users can now choose between two template styles when generating proposals.

---

## Template Options

### **Classic Template** (Default)
- Traditional PDF-style layout
- Comprehensive technical sections
- Perfect for formal proposals and email attachments
- Printable format
- Best for: RFPs, technical stakeholders, print distribution

### **Modern Template** (NEW ✨)
- Beautiful web-first design with Tailwind CSS
- Mobile-responsive layout (mobile, tablet, desktop)
- Embedded video testimonials (5 YouTube videos)
- Interactive presentation mode
- Best for: Client presentations, screen sharing, mobile viewing

---

## Files Created

### 1. `lib/pdf/modern-html-template.tsx`
**Purpose:** Main modern template generator
**Size:** ~950 lines
**Key Functions:**
- `generateModernProposalHTML()` - Main entry point
- `renderHero()` - Hero section with badge and title
- `renderIntroduction()` - 3-card layout (Current Landscape, Goals, Opportunity)
- `renderCompetition()` - Competition table with key gaps
- `renderStrategy()` - Strategy section with visual timeline
- `renderInvestment()` - Package cards with ROI visualization
- `renderTestimonials()` - 5 embedded YouTube videos
- `renderSummary()` - Key benefits and next steps

**Features:**
- Works with both concise and detailed proposals
- Tailwind CSS via CDN for styling
- Responsive breakpoints (sm, md, lg)
- SVG icons embedded
- Custom CSS variables for theming

### 2. `lib/pdf/template-selector.ts`
**Purpose:** Template routing utility
**Key Functions:**
- `generateProposalWithTemplate()` - Routes to correct template
- `getAvailableTemplates()` - Returns template options
- `isValidTemplateStyle()` - Validates template choice
- `getDefaultTemplateStyle()` - Returns 'classic'

**Type Definitions:**
```typescript
type TemplateStyle = 'classic' | 'modern';

interface TemplateOption {
  id: TemplateStyle;
  name: string;
  description: string;
  features: string[];
  bestFor: string[];
}
```

### 3. `supabase/migrations/007_add_template_style.sql`
**Purpose:** Database schema update
**Changes:**
- Adds `template_style` column to `proposals` table
- Defaults to 'classic' for backward compatibility
- Check constraint ensuring only 'classic' or 'modern' values
- Index for faster filtering
- Updates existing proposals to 'classic'

---

## API Changes

### `app/api/proposals/generate/route.ts`

#### New Request Parameter:
```typescript
interface GenerateProposalRequest {
  customerId: string;
  packageTier: 'local' | 'regional' | 'national';
  contactName?: string;
  customInstructions?: string;
  proposalMode?: 'concise' | 'detailed';
  templateStyle?: 'classic' | 'modern'; // NEW
}
```

#### Changes Made:
1. **Import template selector** (line 17)
2. **Add `templateStyle` to request interface** (line 32)
3. **Validate and save template style** (lines 129-131, 145)
4. **Use template selector for HTML generation** (lines 204-209)

#### Example API Call:
```typescript
const response = await fetch('/api/proposals/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'customer-uuid',
    packageTier: 'regional',
    proposalMode: 'concise',
    templateStyle: 'modern' // Choose modern template
  })
});
```

---

## Database Schema

### `proposals` Table - New Column

```sql
template_style VARCHAR(50) DEFAULT 'classic'
```

**Constraints:**
- CHECK: `template_style IN ('classic', 'modern')`
- INDEX: `proposals_template_style_idx`
- NOT NULL (defaults to 'classic')

**Migration:**
```bash
# Run migration
npx supabase migration up

# Or via Supabase dashboard
# Execute: supabase/migrations/007_add_template_style.sql
```

---

## Frontend Integration (Next Steps)

### **Option 1: Radio Buttons (Recommended)**

Add to proposal generation form:

```tsx
'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export function ProposalTemplateSelector() {
  const [templateStyle, setTemplateStyle] = useState<'classic' | 'modern'>('classic');

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-lg">Template Style</h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Classic Template */}
        <label className={cn(
          "relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all",
          templateStyle === 'classic'
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        )}>
          <input
            type="radio"
            name="templateStyle"
            value="classic"
            checked={templateStyle === 'classic'}
            onChange={(e) => setTemplateStyle('classic')}
            className="sr-only"
          />
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Classic Template</span>
            {templateStyle === 'classic' && <CheckCircle className="text-blue-500" />}
          </div>
          <p className="text-sm text-gray-600">
            Traditional PDF-style layout. Perfect for formal proposals.
          </p>
        </label>

        {/* Modern Template */}
        <label className={cn(
          "relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all",
          templateStyle === 'modern'
            ? "border-teal-500 bg-teal-50"
            : "border-gray-200 hover:border-gray-300"
        )}>
          <input
            type="radio"
            name="templateStyle"
            value="modern"
            checked={templateStyle === 'modern'}
            onChange={(e) => setTemplateStyle('modern')}
            className="sr-only"
          />
          <div class="flex items-center justify-between mb-2">
            <span className="font-semibold">Modern Template</span>
            <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <p className="text-sm text-gray-600">
            Beautiful web-first design with video testimonials.
          </p>
        </label>
      </div>

      {templateStyle === 'modern' && (
        <div className="bg-teal-50 border border-teal-200 rounded-md p-4">
          <p className="text-sm text-teal-800">
            ✨ Modern template features beautiful Tailwind CSS styling, embedded video testimonials,
            and mobile-responsive design perfect for client presentations.
          </p>
        </div>
      )}
    </div>
  );
}
```

### **Option 2: Simple Checkbox**

```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={useModernTemplate}
    onChange={(e) => setUseModernTemplate(e.target.checked)}
  />
  <span>Use modern client-facing template</span>
</label>
```

---

## Modern Template Features

### 📱 **Responsive Design**
- **Mobile (< 640px):** Single column, stacked sections
- **Tablet (640px - 1024px):** Two-column grid
- **Desktop (> 1024px):** Full layout with sidebars

### 🎨 **Design System**
- **Colors:** CSS variables (--accent, --primary, --muted, etc.)
- **Fonts:** System font stack (-apple-system, Segoe UI, etc.)
- **Icons:** Embedded SVG icons
- **Shadows:** Card-based elevation

### 🎥 **Video Testimonials**
5 embedded YouTube videos:
1. Client Success Story
2. Genbatt Case Study
3. Halo's 67 Deal Month
4. £4,000,000 for AB Renewables
5. Our First Ever Solar Client

### 📊 **Sections Rendered**
1. **Hero:** Badge, title, subtitle
2. **Introduction:** Current Landscape, Your Goals, The Opportunity
3. **Competition:** Table, Key Gaps, Main Opportunity
4. **Strategy:** Approach, Key Tactics, Timeline, Expected Outcomes
5. **Investment:** Package card, Projected Results, ROI calculation
6. **Summary:** Key Benefits, Next Steps with CTA
7. **Testimonials:** 5 video embeds
8. **Footer:** Contact information

---

## Data Mapping

### **Concise Proposal → Modern Template**
```typescript
{
  hero: {
    preparedFor: content.coverPage.preparedFor,
    date: content.coverPage.date,
    title: content.coverPage.title,
    subtitle: content.coverPage.subtitle
  },
  introduction: {
    currentLandscape: content.introduction.paragraph,
    goals: extractGoals(research),
    opportunity: calculateOpportunity(research)
  },
  competition: {
    summary: content.competition.summary,
    table: content.competition.comparisonTable,
    keyGaps: content.competition.keyGaps,
    mainOpportunity: content.competition.mainOpportunity
  },
  // ... etc
}
```

### **Detailed Proposal → Modern Template**
```typescript
{
  hero: {
    preparedFor: content.coverPage.preparedFor,
    date: content.coverPage.date,
    title: content.coverPage.title,
    subtitle: content.coverPage.subtitle
  },
  introduction: {
    currentLandscape: content.introduction.currentSituation,
    goals: extractGoals(research),
    opportunity: content.introduction.opportunity
  },
  competition: {
    metrics: content.competitorComparison.metrics,
    competitors: research.enhancedResearch.competitors
  },
  // ... etc
}
```

---

## Testing Checklist

- [ ] Run database migration: `npx supabase migration up`
- [ ] Test API with `templateStyle: 'classic'` → Should use existing templates
- [ ] Test API with `templateStyle: 'modern'` → Should use new modern template
- [ ] Test API without `templateStyle` → Should default to 'classic'
- [ ] Generate concise proposal with modern template
- [ ] Generate detailed proposal with modern template
- [ ] Test on mobile device (iPhone/Android)
- [ ] Test on tablet (iPad)
- [ ] Verify video embeds load correctly
- [ ] Test presentation mode (`/present/[id]`) with modern template
- [ ] Verify responsive breakpoints work correctly

---

## Backward Compatibility

✅ **Fully backward compatible:**
- Existing proposals use 'classic' template by default
- Database migration sets all existing proposals to 'classic'
- API defaults to 'classic' if no `templateStyle` provided
- No breaking changes to existing code

---

## Performance Considerations

### **Modern Template:**
- **Pros:**
  - Faster rendering (no PDF generation required)
  - Mobile-optimized
  - Instant load via Tailwind CSS CDN

- **Cons:**
  - 5 YouTube iframe embeds (lazy loaded)
  - Requires internet connection for Tailwind CSS CDN
  - Larger HTML file size (~500KB vs ~200KB for classic)

### **Classic Template:**
- **Pros:**
  - Smaller file size
  - No external dependencies
  - Optimized for PDF conversion

- **Cons:**
  - PDF generation is slower
  - Not mobile-optimized

---

## Future Enhancements

Potential improvements to consider:

1. **Template Customization:**
   - Allow users to customize colors, fonts, logo
   - Per-company branding options

2. **Additional Templates:**
   - Minimal template (ultra-clean)
   - Dark mode template
   - Industry-specific templates

3. **Video Management:**
   - Admin panel to manage testimonial videos
   - Per-company video selection
   - Upload custom videos

4. **Analytics:**
   - Track which template converts better
   - Measure proposal view time
   - Video play tracking

5. **Export Options:**
   - Export modern template to PDF (with Puppeteer)
   - Print-optimized CSS
   - Email-friendly HTML version

---

## Support & Troubleshooting

### **Issue:** Modern template not loading styles
**Solution:** Ensure Tailwind CSS CDN is accessible. Check for Content Security Policy (CSP) issues.

### **Issue:** Videos not playing
**Solution:** Check YouTube video IDs are correct. Ensure user has internet connection.

### **Issue:** Template style not saving
**Solution:** Run database migration. Check `template_style` column exists.

### **Issue:** Mobile layout broken
**Solution:** Verify Tailwind responsive classes are correct. Test on real device, not just browser resize.

---

## Documentation Updates Needed

1. **SDR_PROPOSAL_GUIDE.md:**
   - Add section about template selection
   - Update screenshots to show both templates
   - Add best practices for when to use each template

2. **README.md:**
   - Mention modern template in features list
   - Add screenshots of both templates

3. **API Documentation:**
   - Document `templateStyle` parameter
   - Add example API calls

---

## Deployment Checklist

Before deploying to production:

- [ ] Run migration on production database
- [ ] Test with real customer data
- [ ] Verify video embeds work from production domain
- [ ] Check Tailwind CSS CDN loads correctly
- [ ] Test on multiple devices (iPhone, Android, iPad, Desktop)
- [ ] Update TypeScript types in Supabase
- [ ] Update user documentation
- [ ] Train team on new template options
- [ ] Monitor error logs for first 24 hours

---

**Version:** 1.0
**Last Updated:** January 8, 2025
**Author:** Claude Code Assistant
