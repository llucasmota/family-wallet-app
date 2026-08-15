import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ExtractedExpenseDraft, FamilyContext, ILLMProvider } from './types';

export class GeminiProvider implements ILLMProvider {
  private genAI: GoogleGenerativeAI;
  private modelName = 'gemini-1.5-flash';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(key);
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

Sua missão é extrair rigorosamente os dados de despesas a partir do texto, imagem de comprovante/recibo ou áudio fornecido.
Caso não tenha certeza de algum campo, retorne a melhor estimativa baseada no contexto.
Se for um parcelamento (ex: "em 3x", "parcelado em 10 vezes"), marque isInstallment = true e defina totalInstallments.
Retorne SEMPRE em formato JSON correspondente ao esquema.`;
  }

  private getModel(context: FamilyContext) {
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
    const model = this.getModel(context);
    const result = await model.generateContent(`Entrada do usuário:\n"${text}"`);
    const responseText = result.response.text();
    return JSON.parse(responseText || '{}') as ExtractedExpenseDraft;
  }

  async extractFromImage(
    imageBase64: string,
    mimeType: string,
    context: FamilyContext
  ): Promise<ExtractedExpenseDraft> {
    const model = this.getModel(context);
    const result = await model.generateContent([
      { text: 'Extraia as informações deste comprovante/recibo:' },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);
    const responseText = result.response.text();
    return JSON.parse(responseText || '{}') as ExtractedExpenseDraft;
  }

  async extractFromAudio(
    audioBase64: string,
    mimeType: string,
    context: FamilyContext
  ): Promise<ExtractedExpenseDraft> {
    const model = this.getModel(context);
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
  }
}
