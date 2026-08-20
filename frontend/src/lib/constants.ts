export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Voxly';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const CATEGORIES = [
  'Football',
  'Gaming',
  'Music',
  'Technology',
  'Fashion',
  'School',
  'Relationships',
  'Entertainment',
  'Food',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJIS: Record<string, string> = {
  Football: '⚽',
  Gaming: '🎮',
  Music: '🎵',
  Technology: '💻',
  Fashion: '👗',
  School: '📚',
  Relationships: '💕',
  Entertainment: '🎬',
  Food: '🍕',
  Other: '💬',
};
