import { GeminiProvider } from './gemini-provider';
import { ExtractedExpenseDraft, FamilyContext, ILLMProvider } from './types';

export class AgentService {
  private provider: ILLMProvider;

  constructor(customProvider?: ILLMProvider) {
    // Defaults to Gemini 2.0 Flash, but easily swappable with OpenAI / Claude / Ollama
    this.provider = customProvider || new GeminiProvider();
  }

  async processTextInput(text: string, context: FamilyContext): Promise<ExtractedExpenseDraft> {
    return this.provider.extractFromText(text, context);
  }

  async processReceiptImage(
    imageBase64: string,
    mimeType: string,
    context: FamilyContext
  ): Promise<ExtractedExpenseDraft> {
    return this.provider.extractFromImage(imageBase64, mimeType, context);
  }

  async processAudioNote(
    audioBase64: string,
    mimeType: string,
    context: FamilyContext
  ): Promise<ExtractedExpenseDraft> {
    return this.provider.extractFromAudio(audioBase64, mimeType, context);
  }
}
