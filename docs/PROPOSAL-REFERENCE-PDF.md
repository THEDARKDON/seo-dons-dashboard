# Proposal Reference PDF System

## Overview

The proposal generation system now uses the A1 Mobility SEO proposal PDF as a **quality reference template** that is sent to Claude with every proposal generation request. This ensures consistent, high-quality output that matches the proven A1 Mobility standard.

## How It Works

### 1. Reference PDF Storage

```
public/
└── reference/
    └── a1-mobility-seo-proposal-2025.pdf
```

The reference PDF is stored in the `public/reference` directory and is:
- **Base64 encoded** when loaded
- **Cached in memory** for performance (loaded once per deployment)
- **Sent with every content generation request** to Claude

### 2. PDF Loading System

**File**: `lib/claude/reference-pdf.ts`

```typescript
export function getReferencePDF(): string
export function hasReferencePDF(): boolean
export function clearReferencePDFCache(): void
```

- `getReferencePDF()` - Loads and caches the PDF as base64
- `hasReferencePDF()` - Checks if the PDF exists
- `clearReferencePDFCache()` - Clears the cache (useful for testing)

### 3. Claude API Integration

**File**: `lib/claude/utils.ts`

The `callClaudeForContent` function now accepts an optional `pdfBase64` parameter:

```typescript
await callClaudeForContent(systemPrompt, userPrompt, {
  pdfBase64: referencePdfBase64,  // Optional PDF reference
});
```

When provided, the PDF is sent as a document attachment in the message:

```typescript
{
  type: 'document',
  source: {
    type: 'base64',
    media_type: 'application/pdf',
    data: options.pdfBase64,
  },
}
```

### 4. Content Generation Flow

**File**: `lib/claude/content-generator.ts`

```typescript
// 1. Load reference PDF
const referencePdfBase64 = hasReferencePDF() ? getReferencePDF() : '';

// 2. Send to Claude with GOD_PROMPT instructions
const response = await callClaudeForContent(GOD_PROMPT, userPrompt, {
  pdfBase64: referencePdfBase64,
});

// 3. Parse and return structured content
const content = extractAndParseJSON<ProposalContent>(response.content);
```

## What Claude Learns from the Reference PDF

The updated GOD_PROMPT instructs Claude to study and replicate:

### 1. Tone and Writing Style
- Confident and direct communication
- Data-driven with specific numbers
- Slightly provocative (e.g., "THE BRUTAL TRUTH:")
- Client-focused language

### 2. Formatting and Structure
- Clear section hierarchy
- Bold statements and emphasis
- Highlighted call-out boxes
- Statistical emphasis blocks

### 3. Content Depth
- Real numbers and calculations
- Detailed breakdowns and tables
- Industry-specific insights
- Competitive analysis

### 4. Visual Hierarchy
- Use of callouts for key points
- Statistics blocks (e.g., "174 monthly visitors")
- Comparison tables
- Step-by-step processes

### 5. Persuasive Techniques
- Problem-Agitate-Solve framework
- ROI-focused messaging
- Urgency creation
- Social proof and authority

## Benefits

### Before Reference PDF
- Generic content
- Inconsistent quality
- Weak persuasive elements
- Basic formatting

### After Reference PDF
- Matches proven A1 Mobility standard
- Consistent high quality
- Strong persuasive techniques
- Professional formatting
- Industry-specific depth

## Performance

- **First load**: ~50-100ms (file read + base64 encoding)
- **Subsequent loads**: ~0ms (cached in memory)
- **Claude API impact**: Minimal (PDFs are efficiently processed)
- **Token cost**: ~1,000-2,000 additional input tokens per generation

## Updating the Reference PDF

To update the reference document:

1. Replace the PDF in `public/reference/a1-mobility-seo-proposal-2025.pdf`
2. Clear the cache if needed:
   ```typescript
   import { clearReferencePDFCache } from '@/lib/claude/reference-pdf';
   clearReferencePDFCache();
   ```
3. Next generation will use the new reference

## Graceful Fallback

If the reference PDF is not available:
- System logs a warning
- Continues without the reference
- Uses the GOD_PROMPT alone
- Quality may be reduced but generation still works

## Future Enhancements

Potential improvements:

1. **Multiple Reference PDFs**: Different templates for different industries
2. **Dynamic Selection**: Choose template based on client industry
3. **Version Control**: Track which reference version generated each proposal
4. **A/B Testing**: Test different reference styles
5. **Custom References**: Allow clients to upload their own reference proposals

## Technical Notes

### Why Base64?
- Claude API requires documents in base64 format
- Efficient transmission over HTTP
- Easy caching and manipulation

### Why In-Memory Caching?
- PDF is read from disk only once per deployment
- Subsequent requests use cached version
- Minimal memory footprint (~1-2MB for typical proposal PDF)
- Clears automatically on app restart

### Error Handling
- File not found: Logs warning, continues without reference
- Invalid PDF: Logs error, continues without reference
- Encoding errors: Logs error, continues without reference

## Example Usage

```typescript
// Automatic - just call the content generator
const content = await generateProposalContent({
  researchData: research,
  companyName: 'Example Corp',
  packageTier: 'regional',
});

// The reference PDF is automatically loaded and sent
// Claude receives both the prompts AND the reference document
// Output matches the A1 Mobility quality standard
```

## Monitoring

Check logs for reference PDF status:

```
[Reference PDF] Loaded and cached A1 Mobility reference PDF
[Content Generator] Using A1 Mobility reference PDF for quality matching
```

Or warnings if unavailable:

```
[Reference PDF] Failed to load reference PDF: ENOENT: no such file or directory
[Content Generator] Reference PDF not available - proceeding without template
```

## Related Files

- `lib/claude/reference-pdf.ts` - PDF loading and caching
- `lib/claude/utils.ts` - Claude API integration
- `lib/claude/content-generator.ts` - Content generation with reference
- `public/reference/a1-mobility-seo-proposal-2025.pdf` - The reference document
