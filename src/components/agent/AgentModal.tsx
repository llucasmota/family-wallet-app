'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  Mic,
  MicOff,
  Upload,
  Check,
  AlertCircle,
  X,
  Loader2,
  FileImage,
  Layers,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { ExtractedExpenseDraft } from '../../services/ai/types';
import { useLocale, useTranslations } from 'next-intl';

export interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDraft: (draft: ExtractedExpenseDraft) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, onConfirmDraft }) => {
  const locale = useLocale();
  const tAgent = useTranslations('Agent');
  const tCommon = useTranslations('Common');

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState<ExtractedExpenseDraft | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    name: string;
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      if (locale === 'en') {
        return `${m}/${d}/${y}`;
      }
      return `${d}/${m}/${y}`; // Standard Brazilian DD/MM/AAAA format
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency: locale === 'en' ? 'USD' : 'BRL',
    }).format(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      const base64Data = resultStr.split(',')[1];
      setAttachedImage({
        name: file.name,
        base64: base64Data,
        mimeType: file.type || 'image/jpeg',
        previewUrl: resultStr,
      });
    };
    reader.readAsDataURL(file);
  };

  // Browser Native Speech Recognition (Appends directly to text input)
  const toggleVoiceRecording = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Digite no campo de texto.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === 'en' ? 'en-US' : 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    } else {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const handleProcessMultimodal = async () => {
    if (!inputText.trim() && !attachedImage) return;
    setIsProcessing(true);

    const clientDate = new Date().toLocaleDateString('sv-SE');

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          imageBase64: attachedImage?.base64,
          mimeType: attachedImage?.mimeType,
          clientDate,
        }),
      });

      const data = await response.json();
      if (data && !data.error && typeof data.amount === 'number' && data.amount > 0) {
        setDraft(data);
      } else if (data && data.fallback) {
        setDraft(data.fallback);
      } else {
        // Local regex parsing fallback
        const match = inputText.match(/(?:R\$|\$)?\s*(\d+(?:[.,]\d{1,2})?)/);
        const parsedVal = match ? parseFloat(match[1].replace(',', '.')) : 50;
        setDraft({
          description: inputText || attachedImage?.name || 'Despesa',
          amount: parsedVal,
          dueDate: new Date().toISOString().split('T')[0],
          isInstallment: false,
          confidence: 0.85,
          notes: 'Identificado com IA',
        });
      }
    } catch {
      const match = inputText.match(/(?:R\$|\$)?\s*(\d+(?:[.,]\d{1,2})?)/);
      const parsedVal = match ? parseFloat(match[1].replace(',', '.')) : 50;
      setDraft({
        description: inputText || 'Despesa',
        amount: parsedVal,
        dueDate: new Date().toISOString().split('T')[0],
        isInstallment: false,
        confidence: 0.8,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (draft) {
      onConfirmDraft(draft);
      setDraft(null);
      setInputText('');
      setAttachedImage(null);
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <Card
        variant="elevated"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg shadow-m3-3 flex flex-col gap-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-b-2xl rounded-t-3xl sm:rounded-t-2xl p-5 sm:p-6 border-b-0 sm:border-b"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-outline-variant/40 mx-auto -mt-2 mb-1 block sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-m3-full bg-primary text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-on-surface text-base">{tAgent('title')}</h3>
              <p className="text-xs text-on-surface-variant">{tAgent('subtitle')}</p>
            </div>
          </div>
          <Button variant="text" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Unified Input Box (Text + Photo Attachment + Voice) */}
        {!draft && (
          <div className="flex flex-col gap-3">
            {/* Textarea for contextual instructions */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={tAgent('placeholderText')}
                className="w-full h-24 rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] p-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
              />
              {isRecording && (
                <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  {tAgent('listening')}
                </div>
              )}
            </div>

            {/* Attached Image Preview */}
            {attachedImage && (
              <div className="flex items-center justify-between p-2.5 rounded-m3-md bg-surface-container dark:bg-[#1A221E] border border-outline-variant/30 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={attachedImage.previewUrl}
                    alt="Preview"
                    className="h-10 w-10 object-cover rounded-m3-sm border border-white/10"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-on-surface truncate">{attachedImage.name}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Comprovante anexado
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setAttachedImage(null)}
                  title={tAgent('removePhoto')}
                  className="p-1 rounded-full text-on-surface-variant hover:text-rose-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Multimodal Action Bar (Attach Photo + Voice Dictation) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs h-8"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  <span>{attachedImage ? 'Trocar Foto' : tAgent('attachReceipt')}</span>
                </Button>

                <Button
                  type="button"
                  variant={isRecording ? 'filled' : 'outlined'}
                  size="sm"
                  onClick={toggleVoiceRecording}
                  className={`gap-1.5 text-xs h-8 ${isRecording ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                >
                  {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  <span>{tAgent('voiceDictation')}</span>
                </Button>
              </div>

              <Button
                type="button"
                variant="filled"
                size="md"
                onClick={handleProcessMultimodal}
                disabled={isProcessing || (!inputText.trim() && !attachedImage)}
                className="gap-1.5 text-xs h-9 px-4 font-bold shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tAgent('interpreting')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {tAgent('interpretWithAi')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Draft Confirmation State */}
        {draft && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 p-3 rounded-m3-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Check className="h-4 w-4 shrink-0" />
              <span>{tAgent('draftCreated')}</span>
            </div>

            <div className="flex flex-col gap-2.5 p-4 rounded-m3-md bg-surface-container/60 dark:bg-[#141816] border border-outline-variant/30 text-xs">
              <div className="flex items-center justify-between border-b border-outline-variant/15 dark:border-white/[0.04] pb-2">
                <span className="text-on-surface-variant font-medium">Descrição:</span>
                <span className="font-bold text-on-surface text-sm">{draft.description}</span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/15 dark:border-white/[0.04] pb-2">
                <span className="text-on-surface-variant font-medium">{tAgent('amountLabel')}:</span>
                <span className="font-extrabold text-primary text-base">
                  {formatCurrency(draft.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-outline-variant/15 dark:border-white/[0.04] pb-2">
                <span className="text-on-surface-variant font-medium">{tAgent('dateLabel')}:</span>
                <span className="font-semibold text-on-surface">
                  {formatDateDisplay(draft.dueDate)}
                </span>
              </div>

              {draft.categoryName && (
                <div className="flex items-center justify-between border-b border-outline-variant/15 dark:border-white/[0.04] pb-2">
                  <span className="text-on-surface-variant font-medium">{tAgent('categoryLabel')}:</span>
                  <span className="font-semibold text-primary">{draft.categoryName}</span>
                </div>
              )}

              {draft.splitSummary && (
                <div className="flex items-center justify-between border-b border-outline-variant/15 dark:border-white/[0.04] pb-2">
                  <span className="text-on-surface-variant font-medium">{tAgent('splitLabel')}:</span>
                  <span className="font-semibold text-on-surface">{draft.splitSummary}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outlined"
                size="md"
                onClick={() => setDraft(null)}
              >
                Voltar e Ajustar
              </Button>
              <Button
                type="button"
                variant="filled"
                size="md"
                onClick={handleConfirm}
                className="gap-1.5 font-bold"
              >
                <Check className="h-4 w-4" />
                {tAgent('confirmAndSave')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
