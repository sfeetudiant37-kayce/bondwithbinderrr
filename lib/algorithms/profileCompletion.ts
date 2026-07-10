export function calculateClientProfileCompletion(profile: {
  location?: string;
  quartier?: string;
  budget_range?: string;
  description?: string;
  avatar_color?: string;
  preferences?: string[];
  has_priorities?: boolean;
}): number {
  let points = 0;
  if (profile.location) points += 15;
  if (profile.quartier) points += 10;
  if (profile.budget_range) points += 15;
  if (profile.description) points += 15;
  if (profile.avatar_color) points += 5;
  if (profile.preferences && profile.preferences.length > 0) points += 25;
  if (profile.has_priorities) points += 15;
  return points;
}

export function calculateProviderProfileCompletion(profile: {
  location?: string;
  quartier?: string;
  skills?: string[];
  price?: number;
  availability?: string;
  experience?: number;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  avatar_color?: string;
}): number {
  let points = 0;
  if (profile.location) points += 10;
  if (profile.quartier) points += 5;
  if (profile.skills && profile.skills.length > 0) points += 15;
  if (profile.price && profile.price > 0) points += 15;
  if (profile.availability) points += 10;
  if (profile.experience !== undefined && profile.experience > 0) points += 10;
  if (profile.bio) points += 10;
  if (profile.phone) points += 15;
  if (profile.whatsapp) points += 5;
  if (profile.avatar_color) points += 5;
  return points;
}

export function budgetRangeToValue(range: string): number {
  const map: Record<string, number> = {
    under_10k: 5000,
    '10k_30k': 20000,
    '30k_100k': 65000,
    above_100k: 150000,
  };
  return map[range] ?? 5000;
}
