export interface AvatarPreset {
  key: string;
  name: string;
  category: 'adult' | 'kids' | 'seniors' | 'pets' | 'special';
  bgColor: string;
  emoji: string;
  description: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Adultos
  {
    key: 'husband',
    name: 'Esposo / Homem Moderno',
    category: 'adult',
    bgColor: '#1E6B52',
    emoji: '👨‍💼',
    description: 'Estilo executivo moderno e focado',
  },
  {
    key: 'wife',
    name: 'Esposa / Mulher Moderna',
    category: 'adult',
    bgColor: '#3D6473',
    emoji: '👩‍💼',
    description: 'Estilo executiva elegante e dinâmica',
  },
  {
    key: 'man_casual',
    name: 'Homem Descontraído',
    category: 'adult',
    bgColor: '#0284C7',
    emoji: '🧔',
    description: 'Estilo casual urbano e leve',
  },
  {
    key: 'woman_casual',
    name: 'Mulher Descontraída',
    category: 'adult',
    bgColor: '#7C3AED',
    emoji: '👱‍♀️',
    description: 'Estilo criativo e vibrante',
  },

  // Jovens & Crianças
  {
    key: 'boy_1',
    name: 'Filho / Jovem',
    category: 'kids',
    bgColor: '#D97706',
    emoji: '👦',
    description: 'Aventureiro e curioso',
  },
  {
    key: 'girl_1',
    name: 'Filha / Jovem',
    category: 'kids',
    bgColor: '#E11D48',
    emoji: '👧',
    description: 'Estudiosa e cheia de energia',
  },
  {
    key: 'baby',
    name: 'Bebê da Família',
    category: 'kids',
    bgColor: '#F59E0B',
    emoji: '👶',
    description: 'O caçula que alegra a casa',
  },

  // Terceira Idade
  {
    key: 'grandpa',
    name: 'Vovô Sábio',
    category: 'seniors',
    bgColor: '#4B5563',
    emoji: '👴',
    description: 'Experiência e acolhimento familiar',
  },
  {
    key: 'grandma',
    name: 'Vovó Carinhosa',
    category: 'seniors',
    bgColor: '#9333EA',
    emoji: '👵',
    description: 'Amor, receitas e carinho',
  },

  // Pets da Família
  {
    key: 'dog',
    name: 'Cachorrinho',
    category: 'pets',
    bgColor: '#CA8A04',
    emoji: '🐶',
    description: 'O melhor amigo da família',
  },
  {
    key: 'cat',
    name: 'Gatinho',
    category: 'pets',
    bgColor: '#059669',
    emoji: '🐱',
    description: 'Independente e companheiro',
  },

  // Especiais
  {
    key: 'astro',
    name: 'Astronauta Tech',
    category: 'special',
    bgColor: '#4F46E5',
    emoji: '🚀',
    description: 'Entusiasta do futuro e tecnologia',
  },
  {
    key: 'hero',
    name: 'Super Herói',
    category: 'special',
    bgColor: '#DC2626',
    emoji: '🦸',
    description: 'O guardião do orçamento',
  },
];

export const FAMILY_EMBLEMS = [
  { key: 'home', name: 'Nosso Lar', emoji: '🏡', color: '#2E7D5E' },
  { key: 'tree', name: 'Árvore Genealógica', emoji: '🌳', color: '#166534' },
  { key: 'castle', name: 'Nosso Castelo', emoji: '🏰', color: '#3D6473' },
  { key: 'sparkles', name: 'Harmonia & Brilho', emoji: '✨', color: '#D97706' },
  { key: 'heart', name: 'Coração Familiar', emoji: '❤️', color: '#E11D48' },
  { key: 'shield', name: 'Proteção & Força', emoji: '🛡️', color: '#4F46E5' },
];
