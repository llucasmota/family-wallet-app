export interface ExtractedExpenseDraft {
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  categoryId?: string;
  categoryName?: string;
  payerMemberId?: string;
  payerName?: string;
  isInstallment: boolean;
  totalInstallments?: number;
  splitSummary?: string; // e.g. "40% Lucas / 60% Bruna"
  paymentMethod?: 'c6_card' | 'pix' | 'cash';
  notes?: string;
  confidence: number;
}

export interface FamilyContext {
  members: Array<{ id: string; name: string; role: string }>;
  categories: Array<{ id: string; name: string }>;
  currentDate: string; // YYYY-MM-DD
}

export interface MultimodalInput {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

export interface ILLMProvider {
  extractFromText(text: string, context: FamilyContext): Promise<ExtractedExpenseDraft>;
  extractFromImage(imageBase64: string, mimeType: string, context: FamilyContext): Promise<ExtractedExpenseDraft>;
  extractFromAudio(audioBase64: string, mimeType: string, context: FamilyContext): Promise<ExtractedExpenseDraft>;
  extractMultimodal(input: MultimodalInput, context: FamilyContext): Promise<ExtractedExpenseDraft>;
}
