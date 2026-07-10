import type { FitScoreResult, FitScoreBreakdown, Weights } from '@/types';

export function computeFitScore(
  viewerPreferences: string[],
  targetSkills: string[],
  viewerLocation: string,
  targetLocation: string,
  viewerPrice: number,
  targetPrice: number,
  targetRating: number,
  targetAvailability: string,
  targetProfileCompletion: number,
  targetExperience: number,
  weights: Weights,
  isNewUser: boolean = false
): FitScoreResult {
  const viewerSet = new Set(viewerPreferences.map(p => p.toLowerCase()));
  const targetSet = new Set(targetSkills.map(s => s.toLowerCase()));
  const intersection = [...viewerSet].filter(p => targetSet.has(p));
  const union = new Set([...viewerSet, ...targetSet]);
  const preferencesScore = union.size > 0 ? intersection.length / union.size : 0.3;

  const locationScore = viewerLocation === targetLocation ? 1.0 : 0.3;

  const priceDiff = Math.abs(viewerPrice - targetPrice);
  const maxPrice = Math.max(viewerPrice, targetPrice, 1);
  const priceScore = Math.max(0, 1 - (priceDiff / maxPrice));

  const ratingScore = targetRating > 0 ? targetRating / 5 : 0.5;

  const availMap: Record<string, number> = {
    immediate: 1.0,
    this_week: 0.7,
    flexible: 0.5,
    busy: 0.3,
    urgent: 1.0,
  };
  const availabilityScore = availMap[targetAvailability] ?? 0.5;

  const completenessScore = isNewUser
    ? Math.max(targetProfileCompletion / 100, 0.5)
    : targetProfileCompletion / 100;

  const experienceScore = Math.min(targetExperience / 10, 1);

  const raw =
    weights.preferences * preferencesScore +
    weights.location * locationScore +
    weights.price * priceScore +
    weights.rating * ratingScore +
    weights.availability * availabilityScore +
    weights.profile_completeness * completenessScore +
    weights.experience * experienceScore;

  const breakdown: FitScoreBreakdown = {
    preferences: Math.round(preferencesScore * 100),
    location: Math.round(locationScore * 100),
    price: Math.round(priceScore * 100),
    rating: Math.round(ratingScore * 100),
    availability: Math.round(availabilityScore * 100),
    profileCompleteness: Math.round(completenessScore * 100),
    experience: Math.round(experienceScore * 100),
  };

  return {
    score: Math.round(raw * 100),
    breakdown,
  };
}

export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
  if (total === 0) return weights;
  const normalized: Record<string, number> = {};
  for (const [key, val] of Object.entries(weights)) {
    normalized[key] = Number((val / total).toFixed(4));
  }
  return normalized;
}

export function adjustWeights(
  currentWeights: Weights,
  breakdown: FitScoreBreakdown,
  direction: 'left' | 'right'
): Partial<Weights> {
  const MIN_WEIGHT = 0.05;
  const MAX_WEIGHT = 0.35;

  const factors: (keyof FitScoreBreakdown)[] = [
    'preferences', 'location', 'price', 'rating', 'availability', 'profileCompleteness', 'experience'
  ];

  const weightKeys: Record<keyof FitScoreBreakdown, keyof Weights> = {
    preferences: 'preferences',
    location: 'location',
    price: 'price',
    rating: 'rating',
    availability: 'availability',
    profileCompleteness: 'profile_completeness',
    experience: 'experience',
  };

  const updated: Record<string, number> = {
    preferences: currentWeights.preferences,
    location: currentWeights.location,
    price: currentWeights.price,
    rating: currentWeights.rating,
    availability: currentWeights.availability,
    profile_completeness: currentWeights.profile_completeness,
    experience: currentWeights.experience,
  };

  for (const factor of factors) {
    const factorScore = breakdown[factor] / 100;
    const weightKey = weightKeys[factor] as string;
    let w = updated[weightKey];

    if (direction === 'right' && factorScore >= 0.7) {
      w += 0.02;
    } else if (direction === 'left' && factorScore < 0.4) {
      w -= 0.01;
    }

    updated[weightKey] = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, w));
  }

  const normalized = normalizeWeights(updated);
  return {
    preferences: normalized.preferences,
    location: normalized.location,
    price: normalized.price,
    rating: normalized.rating,
    availability: normalized.availability,
    profile_completeness: normalized.profile_completeness,
    experience: normalized.experience,
  };
}

export function priorityToWeight(priority: 'high' | 'medium' | 'low'): number {
  const map = { high: 0.25, medium: 0.15, low: 0.05 };
  return map[priority];
}

export function buildInitialWeights(priorities: {
  location: 'high' | 'medium' | 'low';
  price: 'high' | 'medium' | 'low';
  rating: 'high' | 'medium' | 'low';
  availability: 'high' | 'medium' | 'low';
  experience: 'high' | 'medium' | 'low';
}): Record<string, number> {
  const raw = {
    preferences: 0.20,
    location: priorityToWeight(priorities.location),
    price: priorityToWeight(priorities.price),
    rating: priorityToWeight(priorities.rating),
    availability: priorityToWeight(priorities.availability),
    profile_completeness: 0.10,
    experience: priorityToWeight(priorities.experience),
  };
  return normalizeWeights(raw);
}
