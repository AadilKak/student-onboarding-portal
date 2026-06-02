// Pure password-rule helpers, matching the GradeLink-style policy:
// at least 6 characters AND at least 3 of the 4 character categories.

export interface PasswordChecks {
  length: boolean;     // >= 6 chars
  upper: boolean;      // has UPPERCASE
  lower: boolean;      // has lowercase
  number: boolean;     // has a digit
  symbol: boolean;     // has a symbol
}

export function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

// How many of the 4 categories are met.
export function categoriesMet(c: PasswordChecks): number {
  return [c.upper, c.lower, c.number, c.symbol].filter(Boolean).length;
}

// A password is valid when it's long enough and meets >= 3 categories.
export function isPasswordValid(pw: string): boolean {
  const c = checkPassword(pw);
  return c.length && categoriesMet(c) >= 3;
}
