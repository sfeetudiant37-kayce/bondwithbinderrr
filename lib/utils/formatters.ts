export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('fr-CM') + ' FCFA';
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-white' },
  green: { bg: 'bg-green-600', text: 'text-white' },
  purple: { bg: 'bg-purple-600', text: 'text-white' },
  orange: { bg: 'bg-orange-500', text: 'text-white' },
  pink: { bg: 'bg-pink-500', text: 'text-white' },
};

export function getFitScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 45) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getFitScoreDotColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 45) return 'bg-yellow-500';
  return 'bg-red-500';
}
