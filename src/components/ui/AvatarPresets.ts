export interface SkinTone {
  key: string;
  name: string;
  emoji: string;
  modifier: string;
}

export const SKIN_TONES: SkinTone[] = [
  { key: 'default', name: 'Original', emoji: '🟡', modifier: '' },
  { key: 'light', name: 'Pele Clara', emoji: '🏻', modifier: '\u{1F3FB}' },
  { key: 'medium_light', name: 'Pele Média-Clara', emoji: '🏼', modifier: '\u{1F3FC}' },
  { key: 'medium', name: 'Pele Parda / Média', emoji: '🏽', modifier: '\u{1F3FD}' },
  { key: 'medium_dark', name: 'Pele Negra', emoji: '🏾', modifier: '\u{1F3FE}' },
  { key: 'dark', name: 'Pele Negra Retinta', emoji: '🏿', modifier: '\u{1F3FF}' },
];

export interface AvatarPreset {
  key: string;
  name: string;
  category: 'adult' | 'kids' | 'seniors' | 'pets' | 'special';
  bgColor: string;
  baseEmoji: string;
  description: string;
  supportsSkinTone?: boolean;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Adultos
  {
    key: 'husband',
    name: 'Esposo / Homem Executivo',
    category: 'adult',
    bgColor: '#1E6B52',
    baseEmoji: '👨‍💼',
    description: 'Estilo executivo moderno e focado',
    supportsSkinTone: true,
  },
  {
    key: 'wife',
    name: 'Esposa / Mulher Executiva',
    category: 'adult',
    bgColor: '#3D6473',
    baseEmoji: '👩‍💼',
    description: 'Estilo executiva elegante e dinâmica',
    supportsSkinTone: true,
  },
  {
    key: 'man_casual',
    name: 'Homem com Barba',
    category: 'adult',
    bgColor: '#0284C7',
    baseEmoji: '🧔',
    description: 'Estilo casual urbano',
    supportsSkinTone: true,
  },
  {
    key: 'woman_casual',
    name: 'Mulher Cacheada / Trançada',
    category: 'adult',
    bgColor: '#7C3AED',
    baseEmoji: '👩‍🦱',
    description: 'Estilo autêntico e vibrante',
    supportsSkinTone: true,
  },
  {
    key: 'woman_curly',
    name: 'Mulher com Cabelo Afro',
    category: 'adult',
    bgColor: '#D97706',
    baseEmoji: '👩🏾‍🦱',
    description: 'Beleza e identidade negra',
    supportsSkinTone: true,
  },
  {
    key: 'man_curly',
    name: 'Homem com Cabelo Afro',
    category: 'adult',
    bgColor: '#059669',
    baseEmoji: '👨🏾‍🦱',
    description: 'Estilo e representatividade',
    supportsSkinTone: true,
  },

  // Jovens & Crianças
  {
    key: 'boy_1',
    name: 'Filho / Jovem',
    category: 'kids',
    bgColor: '#D97706',
    baseEmoji: '👦',
    description: 'Aventureiro e curioso',
    supportsSkinTone: true,
  },
  {
    key: 'girl_1',
    name: 'Filha / Jovem',
    category: 'kids',
    bgColor: '#E11D48',
    baseEmoji: '👧',
    description: 'Estudiosa e cheia de energia',
    supportsSkinTone: true,
  },
  {
    key: 'baby',
    name: 'Bebê da Família',
    category: 'kids',
    bgColor: '#F59E0B',
    baseEmoji: '👶',
    description: 'O caçula que alegra a casa',
    supportsSkinTone: true,
  },

  // Terceira Idade
  {
    key: 'grandpa',
    name: 'Vovô Sábio',
    category: 'seniors',
    bgColor: '#4B5563',
    baseEmoji: '👴',
    description: 'Experiência e acolhimento familiar',
    supportsSkinTone: true,
  },
  {
    key: 'grandma',
    name: 'Vovó Carinhosa',
    category: 'seniors',
    bgColor: '#9333EA',
    baseEmoji: '👵',
    description: 'Amor, receitas e carinho',
    supportsSkinTone: true,
  },

  // Pets da Família
  {
    key: 'dog',
    name: 'Cachorrinho',
    category: 'pets',
    bgColor: '#CA8A04',
    baseEmoji: '🐶',
    description: 'O melhor amigo da família',
    supportsSkinTone: false,
  },
  {
    key: 'cat',
    name: 'Gatinho',
    category: 'pets',
    bgColor: '#059669',
    baseEmoji: '🐱',
    description: 'Independente e companheiro',
    supportsSkinTone: false,
  },

  // Especiais
  {
    key: 'astro',
    name: 'Astronauta Tech',
    category: 'special',
    bgColor: '#4F46E5',
    baseEmoji: '🧑‍🚀',
    description: 'Entusiasta do futuro e tecnologia',
    supportsSkinTone: true,
  },
  {
    key: 'hero',
    name: 'Super Herói / Heroína',
    category: 'special',
    bgColor: '#DC2626',
    baseEmoji: '🦸',
    description: 'O guardião do orçamento',
    supportsSkinTone: true,
  },
];

/**
 * Applies a Fitzpatrick skin tone modifier to human emojis
 */
export function applySkinTone(baseEmoji: string, skinToneModifier?: string): string {
  if (!skinToneModifier) return baseEmoji;

  // Handle multi-character ZWJ emojis (e.g. 👨‍💼: 👨 + ZWJ + 💼)
  const codePoints = Array.from(baseEmoji);
  if (codePoints.length === 0) return baseEmoji;

  // Insert modifier right after the person base emoji (first glyph)
  const first = codePoints[0];
  const rest = codePoints.slice(1).join('');

  return `${first}${skinToneModifier}${rest}`;
}

export const FAMILY_EMBLEMS = [
  { key: 'home', name: 'Nosso Lar', emoji: '🏡', color: '#2E7D5E' },
  { key: 'tree', name: 'Árvore da Família', emoji: '🌳', color: '#166534' },
  { key: 'castle', name: 'Nosso Castelo', emoji: '🏰', color: '#3D6473' },
  { key: 'sparkles', name: 'Harmonia & Brilho', emoji: '✨', color: '#D97706' },
  { key: 'heart', name: 'Coração Familiar', emoji: '❤️', color: '#E11D48' },
  { key: 'shield', name: 'Proteção & Força', emoji: '🛡️', color: '#4F46E5' },
];
