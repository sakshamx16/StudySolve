/**
 * Robust, deterministic student avatar generator.
 * If a user doesn't have an avatar URL, returns a consistent, high-contrast, beautiful SVG data URL
 * with their initial (or a friendly graduation cap icon if no name).
 */
export function getStudentAvatar(name?: string, avatarUrl?: string): string {
  if (avatarUrl && avatarUrl.trim()) {
    return avatarUrl.trim();
  }

  const cleanName = (name || '').trim();
  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : '?';

  // Deterministic palette based on name characters
  const colors = [
    { bg: '#2563eb', text: '#ffffff' }, // Blue
    { bg: '#4f46e5', text: '#ffffff' }, // Indigo
    { bg: '#7c3aed', text: '#ffffff' }, // Violet
    { bg: '#059669', text: '#ffffff' }, // Emerald
    { bg: '#d97706', text: '#ffffff' }, // Amber
    { bg: '#dc2626', text: '#ffffff' }, // Rose
    { bg: '#0891b2', text: '#ffffff' }, // Cyan
    { bg: '#475569', text: '#ffffff' }, // Slate
  ];

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const { bg, text } = colors[colorIndex];

  if (!cleanName) {
    // Elegant guest/anonymous user SVG icon avatar
    const guestSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="50" fill="#e2e8f0"/>
      <circle cx="50" cy="40" r="18" fill="#94a3b8"/>
      <path d="M22 86 C22 66, 38 62, 50 62 C62 62, 78 66, 78 86 Z" fill="#94a3b8"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(guestSvg)}`;
  }

  const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="${bg}"/>
    <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="bold" fill="${text}" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`;
}
