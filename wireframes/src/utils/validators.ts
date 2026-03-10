/**
 * Form validation utilities.
 * Each validator returns `null` for valid values, or an error string for invalid.
 * Composable via `validate(value, isRequired, isEmail)`.
 */

export function isRequired(value: string): string | null {
  return value.trim() ? null : 'This field is required';
}

export function isEmail(value: string): string | null {
  if (!value.trim()) return null; // skip if empty (use isRequired for that)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email address';
}

export function isPhone(value: string): string | null {
  if (!value.trim()) return null;
  return /^[\d\s+()-]{7,20}$/.test(value) ? null : 'Invalid phone number';
}

export function minLength(min: number): (value: string) => string | null {
  return (value: string) => {
    if (!value.trim()) return null;
    return value.trim().length >= min ? null : `Must be at least ${min} characters`;
  };
}

export function maxLength(max: number): (value: string) => string | null {
  return (value: string) => {
    return value.length <= max ? null : `Must be at most ${max} characters`;
  };
}

export function isPositiveNumber(value: string | number): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Must be a number';
  return num > 0 ? null : 'Must be greater than 0';
}

export function isNonNegative(value: string | number): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Must be a number';
  return num >= 0 ? null : 'Must be 0 or greater';
}

/**
 * Run a value through multiple validators, returning the first error or null.
 * @example validate(email, isRequired, isEmail)
 */
export function validate(value: string, ...validators: Array<(v: string) => string | null>): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
}
