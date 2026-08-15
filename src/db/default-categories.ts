export interface DefaultCategoryTemplate {
  name: string;
  icon: string;
  color: string;
}

/**
 * Paleta Tonal Harmonizada inspirada no Material Design 3 (M3)
 * Projetada para máxima legibilidade e elegância sobre fundos pastéis e dark mode.
 */
export const DEFAULT_CATEGORIES: DefaultCategoryTemplate[] = [
  { name: 'Mercado & Feira', icon: 'ShoppingCart', color: '#2D7D62' },          // Menta / Sálvia profunda
  { name: 'Energia & Água', icon: 'Zap', color: '#D96B5B' },                    // Coral Terracota suave
  { name: 'Cartão de Crédito', icon: 'CreditCard', color: '#3B6978' },          // Azul Petróleo elegante
  { name: 'Aluguel & Condomínio', icon: 'Home', color: '#735F53' },             // Terra / Caramelo suave
  { name: 'Consórcio & Financiamento', icon: 'Building2', color: '#53687E' },   // Ardósia Índigo
  { name: 'Assinaturas & Streaming', icon: 'Tv', color: '#85587C' },            // Lavanda / Amora pastel
  { name: 'Lazer & Restaurantes', icon: 'Utensils', color: '#C47C48' },         // Âmbar Quente
  { name: 'Saúde & Farmácia', icon: 'HeartPulse', color: '#C05C6E' },           // Framboesa / Rose Queimado
  { name: 'Transporte & Combustível', icon: 'Car', color: '#556B72' },          // Cinza Azulado M3
  { name: 'Educação & Cursos', icon: 'GraduationCap', color: '#3E788A' },       // Azul Esmalte suave
  { name: 'Vestuário & Compras', icon: 'ShoppingBag', color: '#B0657B' },       // Mauve / Rose Gold
  { name: 'Outros / Diversos', icon: 'Receipt', color: '#6F7973' },             // Neutro de Contorno M3
];
