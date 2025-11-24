/**
 * Encoding Utilities
 *
 * Fixes UTF-8 character encoding corruption that occurs when UTF-8 bytes
 * are misinterpreted as Latin-1/ISO-8859-1.
 *
 * PROBLEM: Claude API returns JSON with UTF-8 characters (£, →, ✓) but
 * somewhere in the streaming/parsing/storage pipeline, these get corrupted:
 * - £ (U+00A3, bytes: C2 A3) → Â£ (Latin-1 interpretation)
 * - → (U+2192, bytes: E2 86 92) → â†' (Latin-1 interpretation)
 * - ✓ (U+2713, bytes: E2 9C 93) → âœ" (Latin-1 interpretation)
 *
 * SOLUTION: Detect and fix these corrupted sequences after receiving
 * content from Claude but before storing in database.
 */

/**
 * Fix UTF-8 double-encoding corruption
 *
 * This handles the case where UTF-8 bytes are misinterpreted as Latin-1,
 * resulting in garbled text like "Â£" instead of "£".
 *
 * @param text The potentially corrupted text
 * @returns Fixed text with proper UTF-8 characters
 */
export function fixUTF8Corruption(text: string): string {
  if (!text) return text;

  // Common UTF-8 corruption patterns
  const corruptions = [
    // Pound sign: £ (U+00A3)
    { corrupted: /Â£/g, correct: '£' },

    // Rightward arrow: → (U+2192)
    { corrupted: /â†'/g, correct: '→' },

    // Check mark: ✓ (U+2713)
    { corrupted: /âœ"/g, correct: '✓' },

    // Bullet: • (U+2022)
    { corrupted: /â€¢/g, correct: '•' },

    // Em dash: — (U+2014)
    { corrupted: /â€"/g, correct: '—' },

    // En dash: – (U+2013)
    { corrupted: /â€"/g, correct: '–' },

    // Left double quote: " (U+201C)
    { corrupted: /â€œ/g, correct: '"' },

    // Right double quote: " (U+201D)
    { corrupted: /â€/g, correct: '"' },

    // Left single quote: ' (U+2018)
    { corrupted: /â€˜/g, correct: '\u2018' },

    // Right single quote: ' (U+2019)
    { corrupted: /â€™/g, correct: '\u2019' },

    // Ellipsis: … (U+2026)
    { corrupted: /â€¦/g, correct: '\u2026' },

    // Euro sign: € (U+20AC)
    { corrupted: /â‚¬/g, correct: '\u20AC' },

    // Multiplication sign: × (U+00D7)
    { corrupted: /Ã—/g, correct: '\u00D7' },

    // Division sign: ÷ (U+00F7)
    { corrupted: /Ã·/g, correct: '\u00F7' },

    // Degree sign: ° (U+00B0)
    { corrupted: /Â°/g, correct: '\u00B0' },

    // Plus-minus: ± (U+00B1)
    { corrupted: /Â±/g, correct: '\u00B1' },

    // Micro sign: µ (U+00B5)
    { corrupted: /Âµ/g, correct: '\u00B5' },

    // Trademark: ™ (U+2122)
    { corrupted: /â„¢/g, correct: '\u2122' },

    // Registered: ® (U+00AE)
    { corrupted: /Â®/g, correct: '\u00AE' },

    // Copyright: © (U+00A9)
    { corrupted: /Â©/g, correct: '\u00A9' },

    // Non-breaking space (U+00A0)
    { corrupted: /Â /g, correct: ' ' },
  ];

  let fixed = text;
  for (const { corrupted, correct } of corruptions) {
    fixed = fixed.replace(corrupted, correct);
  }

  return fixed;
}

/**
 * Recursively sanitize all strings in an object
 *
 * This walks through a nested object structure (like ProposalContent)
 * and fixes UTF-8 corruption in all string values.
 *
 * @param obj The object to sanitize
 * @returns Sanitized object with fixed encoding
 */
export function sanitizeObjectEncoding<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return fixUTF8Corruption(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectEncoding(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObjectEncoding(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Test if a string contains UTF-8 corruption
 *
 * Useful for debugging and validation.
 *
 * @param text The text to check
 * @returns true if corruption detected
 */
export function hasUTF8Corruption(text: string): boolean {
  if (!text) return false;

  // Check for common corruption patterns
  const corruptionPatterns = [
    /Â[£°±µ®©]/,    // Latin-1 A-circumflex before Latin-1 symbols
    /â€[œ"˜™¦]/,    // Common smart quote corruptions
    /â†'/,           // Arrow corruption
    /âœ"/,           // Checkmark corruption
    /â€¢/,           // Bullet corruption
    /â€[""]/,       // Dash corruptions
    /â‚¬/,           // Euro corruption
    /Ã[—·]/,        // Multiplication/division corruption
  ];

  return corruptionPatterns.some(pattern => pattern.test(text));
}

/**
 * Get statistics about corruption in text
 *
 * Useful for debugging and monitoring.
 *
 * @param text The text to analyze
 * @returns Object with corruption statistics
 */
export function getCorruptionStats(text: string): {
  hasCorruption: boolean;
  corruptedChars: number;
  examples: string[];
} {
  if (!text) {
    return { hasCorruption: false, corruptedChars: 0, examples: [] };
  }

  const examples: string[] = [];
  let corruptedChars = 0;

  // Find all corruption instances
  const patterns = [
    /Â£/g,
    /â†'/g,
    /âœ"/g,
    /â€¢/g,
    /â€"/g,
    /â€"/g,
    /â€œ/g,
    /â€/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      corruptedChars += matches.length;
      examples.push(...matches.slice(0, 3)); // Add up to 3 examples per pattern
    }
  }

  return {
    hasCorruption: corruptedChars > 0,
    corruptedChars,
    examples: examples.slice(0, 10), // Return max 10 examples
  };
}
