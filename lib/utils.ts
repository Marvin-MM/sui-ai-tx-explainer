import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateGuestId(): string {
  return `guest_${Math.random().toString(36).substring(2, 15)}`;
}

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null;
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

export function isValidSuiDigest(digest: string): boolean {
  // Sui transaction digests are base58 encoded, typically 43-44 characters
  return /^[A-HJ-NP-Za-km-z1-9]{43,44}$/.test(digest);
}

export function isValidSuiAddress(address: string): boolean {
  // Sui addresses are 64 hex characters prefixed with 0x
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
