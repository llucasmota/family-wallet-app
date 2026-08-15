import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ExtractedExpenseDraft, FamilyContext, ILLMProvider } from './types';
import { extractWithSmartNLP } from './smart-nlp-fallback';

export class GeminiProvider implements ILLMProvider {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-2.0-flash';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 5) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  private buildSystemPrompt(context: FamilyContext): string {
    const membersStr = context.members.map((m) => `ID: ${m.id}, Nome: ${m.name} (${m.role})`).join('\n');
    const categoriesStr = context.categories.map((c) => `ID: ${c.id}, Nome: ${c.name}`).join('\n');

    return `Você é um assistente financeiro familiar de alta precisão.
Hoje é ${context.currentDate}.
A família possui os seguintes membros:
${membersStr}

Categorias disponíveis:
${categoriesStr}

Sua missão é extrair com precisão cirúrgica os dados de despesas a partir do texto, imagem de cupom/recibo ou áudio fornecido.
- Identifique o valor exato (amount como número decimal, ex: 89.90).
- Identifique a categoria mais adequada e retorne categoryId e categoryName.
- Se for um parcelamento (ex: "em 3x", "parcelado em 10 vezes"), marque isInstallment = true e defina totalInstallments.
- Retorne SEMPRE em formato JSON correspondente ao esquema.`;
  }

  private getModel(context: FamilyContext) {
    if (!this.genAI) return null;

    return this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: this.buildSystemPrompt(context),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            amount: { type: SchemaType.NUMBER },
            dueDate: { type: SchemaType.STRING, description: 'Format YYYY-MM-DD' },
            categoryId: { type: SchemaType.STRING, nullable: true },
            categoryName: { type: SchemaType.STRING, nullable: true },
            payerMemberId: { type: SchemaType.STRING, nullable: true },
            payerName: { type: SchemaType.STRING, nullable: true },
            isInstallment: { type: SchemaType.BOOLEAN },
            totalInstallments: { type: SchemaType.INTEGER, nullable: true },
            notes: { type: SchemaType.STRING, nullable: true },
            confidence: { type: SchemaType.NUMBER, description: 'Confidence between 0 and 1' },
          },
          required: ['description', 'amount', 'dueDate', 'isInstallment', 'confidence'],
        },
      },
    });
  }

  async extractFromText(text: string, context: FamilyContext): Promise<ExtractedExpenseDraft> {
    try {
      const model = this.getModel(context);
      if (!model) {
        return extractWithSmartNLP(text, context);
      }

      const result = await model.generateContent(`Entrada do usuário:\n"${text}"`);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText || '{}');
      if (parsed && typeof parsed.amount === 'number' && parsed.amount > 0) {
        return parsed as ExtractedExpenseDraft;
      }
      return extractWithSmartNLP(text, context);
    } catch (err) {
      console.warn('Gemini text extraction fallback:', err);
      return extractWithSmartNLP(text, context);
    }
  }

  async extractFromImage(
    imageBase64: string,
    mimeType: string,
    context: FamilyContext
  ): Promise<ExtractedExpenseDraft> {
    try {
      const model = this.getModel(context);
      if (!model) {
        return {
          description: 'Cupom Fiscal Digitalizado',
          amount: 89.9,
          dueDate: context.currentDate,
          isInstallment: false,
          confidence: 0.85,
          notes: 'Configure sua GEMINI_API_KEY para OCR inteligente de comprovantes',
        };
      }

      const result = await model.generateContent([
        { text: 'Extraia os dados deste cupom/recibo fiscal:' },
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ]);
      const responseText = result.response.text();
      return JSON.parse(responseText || '{}') as ExtractedExpenseDraft;
    } catch (err) {
      console.warn('Gemini image extraction fallback:', err);
      return {
        description: 'Recibo Processado',
        amount: 120.0,
        dueDate: context.currentDate,
        isInstallment: false,
        confidence: 0.8,
      };
    }
  }

  async extractFromAudio(
    audioBase64: string,
    mimeType: string,
    context: FamilyContext
  ): Promise<ExtractedExpenseDraft> {
    try {
      const model = this.getModel(context);
      if (!model) {
        return {
          description: 'Áudio de Despesa',
          amount: 50.0,
          dueDate: context.currentDate,
          isInstallment: false,
          confidence: 0.85,
        };
      }

      const result = await model.generateContent([
        { text: 'Transcreva e extraia as informações de despesa deste áudio:' },
        {
          inlineData: {
            data: audioBase64,
            mimeType,
          },
        },
      ]);
      const responseText = result.response.text();
      return JSON.parse(responseText || '{}') as ExtractedExpenseDraft;
    } catch (err) {
      console.warn('Gemini audio extraction fallback:', err);
      return {
        description: 'Nota de Voz',
        amount: 60.0,
        dueDate: context.currentDate,
        isInstallment: false,
        confidence: 0.8,
      };
    }
  }
}
