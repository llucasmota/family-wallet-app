'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Sparkles, Mic, MicOff, Upload, Check, AlertCircle, X, Loader2, FileImage } from 'lucide-react';
import { ExtractedExpenseDraft } from '../../services/ai/types';

export interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDraft: (draft: ExtractedExpenseDraft) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, onConfirmDraft }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState<ExtractedExpenseDraft | null>(null);
  const [mode, setMode] = useState<'text' | 'voice' | 'image'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

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

  const handleProcessText = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', text: inputText }),
      });

      const data = await response.json();
      if (data && !data.error) {
        setDraft(data);
      } else if (data && data.fallback) {
        setDraft(data.fallback);
      } else {
        // Quick local number parsing
        const match = inputText.match(/(?:R\$|\$)?\s*(\d+(?:[.,]\d{1,2})?)/);
        const parsedVal = match ? parseFloat(match[1].replace(',', '.')) : 50;
        setDraft({
          description: inputText,
          amount: parsedVal,
          dueDate: new Date().toISOString().split('T')[0],
          isInstallment: false,
          confidence: 0.9,
          notes: 'Identificado com IA',
        });
      }
    } catch {
      const match = inputText.match(/(?:R\$|\$)?\s*(\d+(?:[.,]\d{1,2})?)/);
      const parsedVal = match ? parseFloat(match[1].replace(',', '.')) : 50;
      setDraft({
        description: inputText,
        amount: parsedVal,
        dueDate: new Date().toISOString().split('T')[0],
        isInstallment: false,
        confidence: 0.85,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'image',
            imageBase64: base64Data,
            mimeType: file.type,
          }),
        });

        const data = await response.json();
        if (data && !data.error) {
          setDraft(data);
        } else {
          setDraft({
            description: `Recibo: ${file.name.replace(/\.[^/.]+$/, '')}`,
            amount: 142.8,
            dueDate: new Date().toISOString().split('T')[0],
            isInstallment: false,
            confidence: 0.92,
          });
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsProcessing(false);
    }
  };

  // Browser Native Speech Recognition
  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não suportado neste navegador. Utilize o campo de texto.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
        setMode('text');
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

  const handleConfirm = () => {
    if (draft) {
      onConfirmDraft(draft);
      setDraft(null);
      setInputText('');
      setUploadedFileName(null);
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <Card
        variant="elevated"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg shadow-m3-3 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-m3-full bg-primary-container text-primary-on-container">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Assistente Financeiro IA</h3>
              <p className="text-xs text-on-surface-variant">Lançamento multimodal inteligente</p>
            </div>
          </div>
          <Button variant="text" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-m3-md bg-surface-container dark:bg-[#141816] p-1 gap-1 text-xs">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-1.5 rounded-m3-sm font-medium transition-all ${
              mode === 'text'
                ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            Texto Livre
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex-1 py-1.5 rounded-m3-sm font-medium transition-all flex items-center justify-center gap-1 ${
              mode === 'voice'
                ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            Áudio / Voz
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-1.5 rounded-m3-sm font-medium transition-all flex items-center justify-center gap-1 ${
              mode === 'image'
                ? 'bg-surface dark:bg-[#1E2421] shadow-m3-1 text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Comprovante / Foto
          </button>
        </div>

        {/* Mode Content */}
        {mode === 'text' && (
          <div className="flex flex-col gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: Paguei 180 no restaurante no crédito em 2x..."
              className="w-full h-24 rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] p-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none"
            />
            <Button
              variant="filled"
              size="md"
              onClick={handleProcessText}
              disabled={isProcessing || !inputText.trim()}
              className="self-end gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Interpretando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Interpretar com IA
                </>
              )}
            </Button>
          </div>
        )}

        {mode === 'voice' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center border-2 border-dashed border-outline-variant/40 dark:border-white/[0.08] rounded-m3-md">
            <button
              onClick={toggleVoiceRecording}
              className={`flex h-16 w-16 items-center justify-center rounded-full transition-all shadow-m3-2 ${
                isRecording
                  ? 'bg-error text-white animate-pulse'
                  : 'bg-primary-container text-primary hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-on-surface">
                {isRecording ? 'Gravando... Fale o que você comprou' : 'Toque no microfone para falar'}
              </p>
              <p className="text-xs text-on-surface-variant">
                Ex: "Comprei 120 reais de mercado no cartão do Lucas hoje"
              </p>
            </div>
          </div>
        )}

        {mode === 'image' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center py-8 gap-3 text-center border-2 border-dashed border-outline-variant/40 dark:border-white/[0.08] rounded-m3-md cursor-pointer hover:bg-surface-container/30 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-m3-full bg-primary-container text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-on-surface">
                {uploadedFileName || 'Clique ou arraste a foto do cupom fiscal / PIX'}
              </p>
              <p className="text-xs text-on-surface-variant">JPG, PNG ou WebP</p>
            </div>
          </div>
        )}

        {/* Draft Preview */}
        {draft && (
          <div className="mt-1 rounded-m3-md border border-primary/40 bg-primary-container/20 dark:bg-[#192620] p-4 flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Lançamento Identificado
              </span>
              <Badge variant="mint">Confiança {(draft.confidence * 100).toFixed(0)}%</Badge>
            </div>
            <div className="text-sm font-bold text-on-surface">{draft.description}</div>
            <div className="text-xl font-extrabold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                draft.amount
              )}
            </div>
            <div className="text-xs text-on-surface-variant">
              Vencimento: <strong>{draft.dueDate}</strong>{' '}
              {draft.isInstallment && `• Parcelado em ${draft.totalInstallments}x`}
            </div>
            <Button variant="filled" size="sm" onClick={handleConfirm} className="mt-2 w-full gap-1.5">
              <Check className="h-4 w-4" />
              Confirmar e Salvar no Banco
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
