export interface SkinTone {
  key: string;
  name: string;
  emoji: string;
}

export const SKIN_TONES: SkinTone[] = [
  { key: 'default', name: 'Original', emoji: '🟡' },
  { key: 'light', name: 'Pele Clara', emoji: '🏻' },
  { key: 'medium_light', name: 'Pele Média-Clara', emoji: '🏼' },
  { key: 'medium', name: 'Pele Parda / Média', emoji: '🏽' },
  { key: 'medium_dark', name: 'Pele Negra', emoji: '🏾' },
  { key: 'dark', name: 'Pele Negra Retinta', emoji: '🏿' },
];

export interface AvatarPreset {
  key: string;
  name: string;
  category: 'adult' | 'kids' | 'seniors' | 'pets' | 'special';
  bgColor: string;
  baseEmoji: string;
  description: string;
  supportsSkinTone?: boolean;
  skinToneMap?: Record<string, string>;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Adultos
  {
    key: 'husband',
    name: 'Esposo / Executivo',
    category: 'adult',
    bgColor: '#1E6B52',
    baseEmoji: '👨‍💼',
    description: 'Estilo executivo moderno e focado',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👨‍💼',
      light: '👨🏻‍💼',
      medium_light: '👨🏼‍💼',
      medium: '👨🏽‍💼',
      medium_dark: '👨🏾‍💼',
      dark: '👨🏿‍💼',
    },
  },
  {
    key: 'wife',
    name: 'Esposa / Executiva',
    category: 'adult',
    bgColor: '#3D6473',
    baseEmoji: '👩‍💼',
    description: 'Estilo executiva elegante e dinâmica',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👩‍💼',
      light: '👩🏻‍💼',
      medium_light: '👩🏼‍💼',
      medium: '👩🏽‍💼',
      medium_dark: '👩🏾‍💼',
      dark: '👩🏿‍💼',
    },
  },
  {
    key: 'man_casual',
    name: 'Homem com Barba',
    category: 'adult',
    bgColor: '#0284C7',
    baseEmoji: '🧔',
    description: 'Estilo casual urbano',
    supportsSkinTone: true,
    skinToneMap: {
      default: '🧔',
      light: '🧔🏻',
      medium_light: '🧔🏼',
      medium: '🧔🏽',
      medium_dark: '🧔🏾',
      dark: '🧔🏿',
    },
  },
  {
    key: 'woman_casual',
    name: 'Mulher Cacheada',
    category: 'adult',
    bgColor: '#7C3AED',
    baseEmoji: '👩',
    description: 'Estilo autêntico e vibrante',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👩',
      light: '👩🏻',
      medium_light: '👩🏼',
      medium: '👩🏽',
      medium_dark: '👩🏾',
      dark: '👩🏿',
    },
  },
  {
    key: 'man_afro',
    name: 'Homem Cabelo Afro',
    category: 'adult',
    bgColor: '#059669',
    baseEmoji: '👨‍🦱',
    description: 'Estilo e representatividade',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👨‍🦱',
      light: '👨🏻‍🦱',
      medium_light: '👨🏼‍🦱',
      medium: '👨🏽‍🦱',
      medium_dark: '👨🏾‍🦱',
      dark: '👨🏿‍🦱',
    },
  },
  {
    key: 'woman_afro',
    name: 'Mulher Cabelo Afro',
    category: 'adult',
    bgColor: '#D97706',
    baseEmoji: '👩‍🦱',
    description: 'Beleza e identidade',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👩‍🦱',
      light: '👩🏻‍🦱',
      medium_light: '👩🏼‍🦱',
      medium: '👩🏽‍🦱',
      medium_dark: '👩🏾‍🦱',
      dark: '👩🏿‍🦱',
    },
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
    skinToneMap: {
      default: '👦',
      light: '👦🏻',
      medium_light: '👦🏼',
      medium: '👦🏽',
      medium_dark: '👦🏾',
      dark: '👦🏿',
    },
  },
  {
    key: 'girl_1',
    name: 'Filha / Jovem',
    category: 'kids',
    bgColor: '#E11D48',
    baseEmoji: '👧',
    description: 'Estudiosa e cheia de energia',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👧',
      light: '👧🏻',
      medium_light: '👧🏼',
      medium: '👧🏽',
      medium_dark: '👧🏾',
      dark: '👧🏿',
    },
  },
  {
    key: 'baby',
    name: 'Bebê da Família',
    category: 'kids',
    bgColor: '#F59E0B',
    baseEmoji: '👶',
    description: 'O caçula que alegra a casa',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👶',
      light: '👶🏻',
      medium_light: '👶🏼',
      medium: '👶🏽',
      medium_dark: '👶🏾',
      dark: '👶🏿',
    },
  },

  // Terceira Idade
  {
    key: 'grandpa',
    name: 'Vovô Sábio',
    category: 'seniors',
    bgColor: '#4B5563',
    baseEmoji: '👴',
    description: 'Experiência e acolhimento',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👴',
      light: '👴🏻',
      medium_light: '👴🏼',
      medium: '👴🏽',
      medium_dark: '👴🏾',
      dark: '👴🏿',
    },
  },
  {
    key: 'grandma',
    name: 'Vovó Carinhosa',
    category: 'seniors',
    bgColor: '#9333EA',
    baseEmoji: '👵',
    description: 'Amor, receitas e carinho',
    supportsSkinTone: true,
    skinToneMap: {
      default: '👵',
      light: '👵🏻',
      medium_light: '👵🏼',
      medium: '👵🏽',
      medium_dark: '👵🏾',
      dark: '👵🏿',
    },
  },

  // Pets
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
    skinToneMap: {
      default: '🧑‍🚀',
      light: '🧑🏻‍🚀',
      medium_light: '🧑🏼‍🚀',
      medium: '🧑🏽‍🚀',
      medium_dark: '🧑🏾‍🚀',
      dark: '🧑🏿‍🚀',
    },
  },
  {
    key: 'hero',
    name: 'Super Herói / Heroína',
    category: 'special',
    bgColor: '#DC2626',
    baseEmoji: '🦸',
    description: 'O guardião do orçamento',
    supportsSkinTone: true,
    skinToneMap: {
      default: '🦸',
      light: '🦸🏻',
      medium_light: '🦸🏼',
      medium: '🦸🏽',
      medium_dark: '🦸🏾',
      dark: '🦸🏿',
    },
  },
];

/**
 * Gets the exact character emoji with skin tone applied
 */
export function getAdaptedEmoji(baseKey: string, skinToneKey: string = 'default'): string {
  const preset = AVATAR_PRESETS.find((p) => p.key === baseKey);
  if (!preset) return '👤';

  if (!preset.supportsSkinTone || !preset.skinToneMap) {
    return preset.baseEmoji;
  }

  return preset.skinToneMap[skinToneKey] || preset.skinToneMap['default'] || preset.baseEmoji;
}

export const FAMILY_EMBLEMS = [
  { key: 'home', name: 'Nosso Lar', emoji: '🏡', color: '#2E7D5E' },
  { key: 'tree', name: 'Árvore da Família', emoji: '🌳', color: '#166534' },
  { key: 'castle', name: 'Nosso Castelo', emoji: '🏰', color: '#3D6473' },
  { key: 'sparkles', name: 'Harmonia & Brilho', emoji: '✨', color: '#D97706' },
  { key: 'heart', name: 'Coração Familiar', emoji: '❤️', color: '#E11D48' },
  { key: 'shield', name: 'Proteção & Força', emoji: '🛡️', color: '#4F46E5' },
];
