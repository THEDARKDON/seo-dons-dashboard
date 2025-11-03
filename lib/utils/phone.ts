import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 format
 * E.164 is the international standard format: +[country code][number]
 *
 * Examples:
 * - UK: 0333 339 9808 → +443333399808
 * - UK: 07700 900123 → +447700900123
 * - UK: 020 7946 0958 → +442079460958
 * - US: (415) 555-1234 → +14155551234
 * - Already formatted: +447700900123 → +447700900123
 */
export function normalizePhoneNumber(
  phoneNumber: string,
  defaultCountry: CountryCode = 'GB'
): string {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }

  // Remove common formatting characters but keep + if it's at the start
  let cleaned = phoneNumber.trim();

  // If already starts with +, assume it's in E.164 format or international format
  if (cleaned.startsWith('+')) {
    // Remove all non-digit characters except the leading +
    cleaned = '+' + cleaned.substring(1).replace(/\D/g, '');

    // Validate it's a valid phone number
    if (isValidPhoneNumber(cleaned)) {
      return cleaned;
    }
  }

  try {
    // Parse the phone number with the default country
    const parsed = parsePhoneNumber(cleaned, defaultCountry);

    if (!parsed) {
      throw new Error('Could not parse phone number');
    }

    // Return in E.164 format
    return parsed.format('E.164');
  } catch (error: any) {
    // If parsing fails, try to manually construct E.164 for UK numbers
    if (defaultCountry === 'GB' && cleaned.startsWith('0')) {
      // UK numbers: replace leading 0 with +44
      const withoutZero = cleaned.substring(1).replace(/\D/g, '');
      const e164 = `+44${withoutZero}`;

      // Validate the constructed number
      if (isValidPhoneNumber(e164, 'GB')) {
        return e164;
      }
    }

    // If all else fails, throw error with helpful message
    throw new Error(
      `Invalid phone number format: "${phoneNumber}". Expected format: UK (0333 123 4567), US (+1 415 555 1234), or E.164 (+441234567890)`
    );
  }
}

/**
 * Format a phone number for display (human-readable)
 * Converts E.164 back to local format
 *
 * Examples:
 * - +443333399808 → 0333 339 9808
 * - +447700900123 → 07700 900123
 * - +14155551234 → (415) 555-1234
 */
export function formatPhoneNumberForDisplay(
  phoneNumber: string,
  defaultCountry: CountryCode = 'GB'
): string {
  if (!phoneNumber) {
    return '';
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);

    if (!parsed) {
      return phoneNumber; // Return as-is if can't parse
    }

    // Format as national (local) format
    return parsed.formatNational();
  } catch (error) {
    // If parsing fails, return original
    return phoneNumber;
  }
}

/**
 * Validate if a phone number is valid
 */
export function isValidPhone(
  phoneNumber: string,
  defaultCountry: CountryCode = 'GB'
): boolean {
  if (!phoneNumber) {
    return false;
  }

  try {
    return isValidPhoneNumber(phoneNumber, defaultCountry);
  } catch (error) {
    return false;
  }
}

/**
 * Get country code from a phone number
 */
export function getCountryCode(phoneNumber: string): string | undefined {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    return parsed?.country;
  } catch (error) {
    return undefined;
  }
}

/**
 * Common UK number types and their prefixes
 */
export const UK_NUMBER_TYPES = {
  MOBILE: ['07'],
  GEOGRAPHIC: ['01', '02'],
  NON_GEOGRAPHIC: ['03', '08'], // 0333, 0800, 0845, etc.
  PREMIUM: ['09'],
  FREEPHONE: ['0800', '0808'],
  CORPORATE: ['0333', '0343', '0345', '0370', '0371'],
  SPECIAL: ['0843', '0844', '0845', '0870', '0871', '0872', '0873'],
};

/**
 * Check if a UK number is non-geographic (0333, 0800, etc.)
 */
export function isUKNonGeographic(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.startsWith('44')) {
    // E.164 format starting with 44
    const withoutCountry = cleaned.substring(2);
    return UK_NUMBER_TYPES.NON_GEOGRAPHIC.some(prefix =>
      withoutCountry.startsWith(prefix)
    );
  }

  if (cleaned.startsWith('0')) {
    // Local format starting with 0
    return UK_NUMBER_TYPES.NON_GEOGRAPHIC.some(prefix =>
      cleaned.startsWith('0' + prefix)
    );
  }

  return false;
}

/**
 * Batch normalize multiple phone numbers
 */
export function normalizePhoneNumbers(
  phoneNumbers: string[],
  defaultCountry: CountryCode = 'GB'
): { original: string; normalized: string; error?: string }[] {
  return phoneNumbers.map(phone => {
    try {
      const normalized = normalizePhoneNumber(phone, defaultCountry);
      return { original: phone, normalized };
    } catch (error: any) {
      return { original: phone, normalized: phone, error: error.message };
    }
  });
}
