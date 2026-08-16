'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user dismissed prompt recently
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    if (!isStandaloneMode) {
      // Capture beforeinstallprompt for Android/Chrome
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      // On iOS, show prompt if in mobile safari
      if (isIosDevice && !isStandaloneMode) {
        setIsVisible(true);
      }

      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom duration-300">
      <Card variant="elevated" className="p-3.5 shadow-m3-3 border border-primary/30 bg-surface-container-high dark:bg-[#161D19]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-m3-md bg-primary-container text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">Instalar Family Wallet</span>
              <span className="text-[11px] text-on-surface-variant">Acesse como um app direto no seu celular</span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded"
            aria-label="Fechar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-2.5 rounded-m3-sm bg-surface/80 p-2 text-[11px] text-on-surface-variant leading-tight flex items-center gap-1.5 border border-outline-variant/20">
            <span>Toque no botão</span>
            <Share className="h-3.5 w-3.5 text-primary inline" />
            <span>e selecione</span>
            <strong className="text-on-surface flex items-center gap-0.5">
              <PlusSquare className="h-3 w-3" /> Adicionar à Tela de Início
            </strong>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center justify-end gap-2">
            <Button variant="text" size="sm" onClick={handleDismiss} className="text-xs h-7 px-2">
              Agora não
            </Button>
            <Button variant="filled" size="sm" onClick={handleInstallClick} className="text-xs h-7 px-3">
              Instalar App
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
