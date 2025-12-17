/**
 * Domain Detection Service
 * Maps hostnames to user_source values for multi-product support
 *
 * This service determines which product a user signed up from based on the domain
 * they accessed during registration. The user_source is stored in user_profiles
 * for filtering and analytics.
 */

// Production and staging domain mappings
const DOMAIN_TO_USER_SOURCE: Record<string, string> = {
  // MI Standalone production & staging
  'mymindinsurance.com': 'mi_standalone',
  'www.mymindinsurance.com': 'mi_standalone',
  'staging.mindinsurancechallange.pages.dev': 'mi_standalone',

  // Grouphome production & staging
  'grouphome4newbies.com': 'gh_user',
  'www.grouphome4newbies.com': 'gh_user',
  'mindhouse-prodigy.pages.dev': 'gh_user',
};

// Development defaults by port
const DEV_PORT_TO_SOURCE: Record<string, string> = {
  '5173': 'mi_standalone', // MI standalone dev (default Vite port)
  '5174': 'gh_user',       // GH dev (secondary Vite port)
  '3000': 'mi_standalone', // Alternative dev port
};

/**
 * Get the user_source value based on current domain/hostname
 * Used during signup to tag users with their signup source
 *
 * @returns user_source string: 'mi_standalone', 'gh_user', or 'unknown'
 */
export function getUserSource(): string {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Check production domains first (exact match)
  if (DOMAIN_TO_USER_SOURCE[hostname]) {
    return DOMAIN_TO_USER_SOURCE[hostname];
  }

  // Check localhost by port for development
  if (hostname === 'localhost' && DEV_PORT_TO_SOURCE[port]) {
    return DEV_PORT_TO_SOURCE[port];
  }

  // Check for Cloudflare Pages preview deployments
  if (hostname.includes('mindinsurance') || hostname.includes('mi-standalone')) {
    return 'mi_standalone';
  }

  if (hostname.includes('grouphome') || hostname.includes('mindhouse')) {
    return 'gh_user';
  }

  // Default for unknown domains
  return 'unknown';
}

/**
 * Get the raw signup domain for logging/debugging
 *
 * @returns The full hostname where signup occurred
 */
export function getSignupDomain(): string {
  return window.location.hostname;
}

/**
 * Check if current domain is a Mind Insurance domain
 */
export function isMindInsuranceDomain(): boolean {
  return getUserSource() === 'mi_standalone';
}

/**
 * Check if current domain is a Grouphome domain
 */
export function isGrouphomeDomain(): boolean {
  return getUserSource() === 'gh_user';
}
