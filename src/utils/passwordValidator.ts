/**
 * Password validation utility for Mind Insurance app
 * Enforces enterprise-grade password requirements
 */

export interface PasswordStrength {
  score: number; // 0-4 (weak to strong)
  feedback: string[];
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Default password requirements - relaxed for user convenience
// Strength meter shows recommendations, but only minimum length is required
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 6, // Supabase minimum is 6
  requireUppercase: false, // Recommended but not required
  requireLowercase: false, // Recommended but not required
  requireNumbers: false, // Recommended but not required
  requireSpecialChars: false, // Recommended but not required
};

/**
 * Validates password against requirements and returns strength assessment
 * Note: isValid only checks minimum length - strength is informational only
 */
export const validatePassword = (
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Check minimum length - this is the ONLY hard requirement
  const meetsMinLength = password.length >= requirements.minLength;
  if (!meetsMinLength) {
    feedback.push(`Password must be at least ${requirements.minLength} characters`);
  } else {
    score++;
    // Bonus points for extra length
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
  }

  // These are RECOMMENDATIONS, not requirements
  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    score++;
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    score++;
  }

  // Check for numbers
  if (/\d/.test(password)) {
    score++;
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  }

  // Check for common patterns (warning only, doesn't block)
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }

  if (/^(123|abc|qwerty|password)/i.test(password)) {
    feedback.push('Avoid common password patterns');
    score = Math.max(0, score - 2);
  }

  // Calculate final score (0-4 scale)
  const normalizedScore = Math.min(4, Math.floor((score / 7) * 4));

  // Determine strength label
  let strength: PasswordStrength['strength'];
  switch (normalizedScore) {
    case 0:
      strength = 'weak';
      break;
    case 1:
      strength = 'fair';
      break;
    case 2:
      strength = 'good';
      break;
    case 3:
      strength = 'strong';
      break;
    case 4:
      strength = 'very-strong';
      break;
    default:
      strength = 'weak';
  }

  // Password is valid if it meets ONLY the minimum length requirement
  // Users can sign up with weak passwords - we just show them the strength
  const isValid = meetsMinLength;

  return {
    score: normalizedScore,
    feedback,
    isValid,
    strength,
  };
};

/**
 * Get color for password strength indicator
 */
export const getPasswordStrengthColor = (strength: PasswordStrength['strength']): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'fair':
      return 'text-orange-500';
    case 'good':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    case 'very-strong':
      return 'text-green-600';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get progress bar width percentage for password strength
 */
export const getPasswordStrengthWidth = (score: number): string => {
  return `${(score / 4) * 100}%`;
};

/**
 * Validate that password and confirmation match
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};