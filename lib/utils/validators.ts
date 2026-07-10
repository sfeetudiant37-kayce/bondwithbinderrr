export function validateCameroonPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^\+2376\d{8}$/.test(cleaned) || /^6\d{8}$/.test(cleaned) || /^\+237[0-9]{9}$/.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+237')) return cleaned;
  if (cleaned.startsWith('237')) return '+' + cleaned;
  if (cleaned.startsWith('6')) return '+237' + cleaned;
  return cleaned;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}
