/**
 * Chaos Inputs for "Narf" Tests
 *
 * "Narf!" - What Pinky says when things get chaotic
 *
 * These inputs test edge cases, security boundaries, and unexpected user behavior.
 */

/**
 * Named chaos input with description
 */
export interface ChaosInput {
  name: string;
  value: string;
  category: 'empty' | 'boundary' | 'special' | 'security' | 'unicode' | 'long';
}

/**
 * Empty and whitespace inputs
 */
export const EMPTY_INPUTS: ChaosInput[] = [
  { name: 'empty', value: '', category: 'empty' },
  { name: 'single-space', value: ' ', category: 'empty' },
  { name: 'multiple-spaces', value: '     ', category: 'empty' },
  { name: 'tab', value: '\t', category: 'empty' },
  { name: 'newline', value: '\n', category: 'empty' },
  { name: 'carriage-return', value: '\r', category: 'empty' },
  { name: 'mixed-whitespace', value: '  \t\n  ', category: 'empty' },
  { name: 'zero-width-space', value: '\u200B', category: 'empty' },
  { name: 'non-breaking-space', value: '\u00A0', category: 'empty' },
];

/**
 * Boundary number inputs
 */
export const BOUNDARY_NUMBERS: ChaosInput[] = [
  { name: 'zero', value: '0', category: 'boundary' },
  { name: 'negative-one', value: '-1', category: 'boundary' },
  { name: 'negative-large', value: '-999999', category: 'boundary' },
  { name: 'max-safe-integer', value: String(Number.MAX_SAFE_INTEGER), category: 'boundary' },
  { name: 'min-safe-integer', value: String(Number.MIN_SAFE_INTEGER), category: 'boundary' },
  { name: 'infinity', value: 'Infinity', category: 'boundary' },
  { name: 'negative-infinity', value: '-Infinity', category: 'boundary' },
  { name: 'nan', value: 'NaN', category: 'boundary' },
  { name: 'float', value: '3.14159', category: 'boundary' },
  { name: 'scientific-notation', value: '1e10', category: 'boundary' },
  { name: 'hex', value: '0xFF', category: 'boundary' },
];

/**
 * Special characters and symbols
 */
export const SPECIAL_CHARS: ChaosInput[] = [
  { name: 'quotes', value: '"\'`', category: 'special' },
  { name: 'brackets', value: '[]{}()', category: 'special' },
  { name: 'slashes', value: '/\\|', category: 'special' },
  { name: 'ampersand', value: '&&&', category: 'special' },
  { name: 'at-sign', value: '@@@', category: 'special' },
  { name: 'hash', value: '###', category: 'special' },
  { name: 'dollar', value: '$$$', category: 'special' },
  { name: 'percent', value: '%%%', category: 'special' },
  { name: 'caret', value: '^^^', category: 'special' },
  { name: 'asterisk', value: '***', category: 'special' },
  { name: 'punctuation', value: '.,;:!?', category: 'special' },
  { name: 'math-symbols', value: '+-=<>~', category: 'special' },
];

/**
 * Security-focused inputs (XSS, SQL injection patterns)
 * NOTE: These should NOT execute - testing that app properly escapes them
 */
export const SECURITY_INPUTS: ChaosInput[] = [
  // XSS attempts
  { name: 'xss-script', value: '<script>alert("xss")</script>', category: 'security' },
  { name: 'xss-img', value: '<img src=x onerror=alert("xss")>', category: 'security' },
  { name: 'xss-svg', value: '<svg onload=alert("xss")>', category: 'security' },
  { name: 'xss-event', value: '" onclick="alert(1)"', category: 'security' },
  { name: 'xss-href', value: 'javascript:alert("xss")', category: 'security' },

  // SQL injection patterns
  { name: 'sql-quote', value: "'; DROP TABLE users; --", category: 'security' },
  { name: 'sql-or', value: "' OR '1'='1", category: 'security' },
  { name: 'sql-union', value: "' UNION SELECT * FROM users --", category: 'security' },
  { name: 'sql-comment', value: '-- comment', category: 'security' },

  // Path traversal
  { name: 'path-traversal', value: '../../../etc/passwd', category: 'security' },
  { name: 'null-byte', value: 'file.txt\0.jpg', category: 'security' },

  // Command injection
  { name: 'cmd-injection', value: '; ls -la', category: 'security' },
  { name: 'cmd-pipe', value: '| cat /etc/passwd', category: 'security' },
];

/**
 * Unicode and emoji inputs
 */
export const UNICODE_INPUTS: ChaosInput[] = [
  { name: 'emoji-simple', value: '👍🎉🏌️', category: 'unicode' },
  { name: 'emoji-complex', value: '👨‍👩‍👧‍👦', category: 'unicode' }, // Family emoji (ZWJ sequence)
  { name: 'emoji-flag', value: '🇺🇸🇬🇧🇯🇵', category: 'unicode' },
  { name: 'arabic', value: 'مرحبا بالعالم', category: 'unicode' },
  { name: 'chinese', value: '你好世界', category: 'unicode' },
  { name: 'japanese', value: 'こんにちは世界', category: 'unicode' },
  { name: 'korean', value: '안녕하세요', category: 'unicode' },
  { name: 'hebrew', value: 'שלום עולם', category: 'unicode' },
  { name: 'thai', value: 'สวัสดีโลก', category: 'unicode' },
  { name: 'mixed-rtl-ltr', value: 'Hello مرحبا World', category: 'unicode' },
  { name: 'combining-chars', value: 'é̃ñ', category: 'unicode' }, // Combining diacriticals
  { name: 'zalgo', value: 'H̵̡̪̯ẹ̢̧l̨̯͓l̷̝̹o̧̟̞', category: 'unicode' },
];

/**
 * Long string inputs
 */
export const LONG_STRINGS: ChaosInput[] = [
  { name: 'chars-100', value: 'a'.repeat(100), category: 'long' },
  { name: 'chars-1000', value: 'b'.repeat(1000), category: 'long' },
  { name: 'chars-10000', value: 'c'.repeat(10000), category: 'long' },
  { name: 'words-100', value: Array(100).fill('word').join(' '), category: 'long' },
  { name: 'mixed-long', value: 'Test123!@# '.repeat(500), category: 'long' },
];

/**
 * All chaos inputs combined
 */
export const ALL_CHAOS_INPUTS: ChaosInput[] = [
  ...EMPTY_INPUTS,
  ...BOUNDARY_NUMBERS,
  ...SPECIAL_CHARS,
  ...SECURITY_INPUTS,
  ...UNICODE_INPUTS,
  ...LONG_STRINGS,
];

/**
 * Grouped chaos inputs for targeted testing
 */
export const CHAOS_INPUTS = {
  empty: EMPTY_INPUTS,
  numbers: BOUNDARY_NUMBERS,
  special: SPECIAL_CHARS,
  security: SECURITY_INPUTS,
  unicode: UNICODE_INPUTS,
  long: LONG_STRINGS,
  all: ALL_CHAOS_INPUTS,
};

/**
 * Get a random chaos input from a category
 */
export function getRandomChaos(category?: ChaosInput['category']): ChaosInput {
  const inputs = category
    ? ALL_CHAOS_INPUTS.filter((i) => i.category === category)
    : ALL_CHAOS_INPUTS;
  return inputs[Math.floor(Math.random() * inputs.length)];
}

/**
 * Get chaos inputs suitable for testing text fields
 */
export function getTextFieldChaos(): ChaosInput[] {
  return [...EMPTY_INPUTS, ...SPECIAL_CHARS, ...SECURITY_INPUTS, ...UNICODE_INPUTS];
}

/**
 * Get chaos inputs suitable for testing number fields
 */
export function getNumberFieldChaos(): ChaosInput[] {
  return [...EMPTY_INPUTS, ...BOUNDARY_NUMBERS];
}
