/**
 * Group Secret Code & Invitation Link Utilities
 */

const SUBJECT_PREFIX_MAP: Record<string, string> = {
  'Financial Accounting': 'ACCT',
  'Cost & Management Accounting': 'COST',
  'Economics': 'ECON',
  'Taxation & GST': 'TAX',
  'Corporate & Business Law': 'LAW',
  'Financial Management & Investment': 'FIN',
  'Business Studies & Management': 'MGMT',
  'Business Mathematics & Statistics': 'MATH',
  'Auditing & Assurance': 'AUDIT',
};

/**
 * Generate a clean, memorable uppercase secret code for private groups
 * e.g., "ACCT-7429" or "SOLVE-5182"
 */
export function generateSecretCode(subject?: string): string {
  let prefix = 'STUDY';
  if (subject && SUBJECT_PREFIX_MAP[subject]) {
    prefix = SUBJECT_PREFIX_MAP[subject];
  } else if (subject && subject.length >= 3) {
    prefix = subject.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'STUDY';
  }
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

/**
 * Generate a random alphanumeric token for invitation URLs
 */
export function generateInviteToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'inv_';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Build a full invitation link for a private study group
 */
export function buildInviteUrl(groupId: string, secretCode?: string, inviteToken?: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('tab', 'groups');
  params.set('joinGroup', groupId);
  if (secretCode) {
    params.set('code', secretCode);
  }
  if (inviteToken) {
    params.set('invite', inviteToken);
  }
  return `${origin}?${params.toString()}`;
}

/**
 * Parse invite info from URL search string or query
 */
export function parseInviteParams(search: string): {
  groupId: string | null;
  code: string | null;
  invite: string | null;
} {
  try {
    const params = new URLSearchParams(search);
    return {
      groupId: params.get('joinGroup'),
      code: params.get('code'),
      invite: params.get('invite'),
    };
  } catch {
    return { groupId: null, code: null, invite: null };
  }
}
