'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag, Plus, Check, Loader2, Sparkles, X } from 'lucide-react';
import { QuickExpenseModal } from '@/components/dashboard/QuickExpenseModal';
import { AgentModal } from '@/components/agent/AgentModal';
import { getFamilyDataAction } from '@/app/actions/family';
import { createCategoryAction } from '@/app/actions/categories';

export default function CategoriesPage() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2E7D5E');

  const [familyData, setFamilyData] = useState<{
    id: string;
    name: string;
    members: any[];
    categories: Array<{ id: string; name: string; color: string; icon: string }>;
  } | null>(null);

  const loadData = async () => {
    try {
      const famRes = await getFamilyDataAction();
      if (famRes.success && famRes.family) {
        setFamilyData(famRes.family as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !familyData) return;

    setIsSaving(true);
    try {
      await createCategoryAction({
        familyId: familyData.id,
        name: newCatName,
        color: newCatColor,
      });
      setIsNewCatModalOpen(false);
      setNewCatName('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const M3_PALETTE = [
    '#2E7D5E', // Mint / Pine
    '#3D6473', // Slate Blue
    '#D97706', // Warm Amber
    '#E11D48', // Rose / Berry
    '#7C3AED', // Violet
    '#059669', // Emerald
    '#0284C7', // Ocean
    '#4F46E5', // Indigo
    '#D946EF', // Fuchsia
    '#CA8A04', // Gold
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors duration-200">
      <Navbar
        onOpenAgent={() => setIsAgentOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              Categorias de Gastos
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Personalize as categorias familiares e organize seu orçamento
            </p>
          </div>

          <Button
            variant="filled"
            size="sm"
            onClick={() => setIsNewCatModalOpen(true)}
            className="gap-1 text-xs"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {familyData?.categories.map((cat) => (
            <Card
              key={cat.id}
              variant="elevated"
              className="flex items-center gap-3.5 p-4 transition-all"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-m3-md text-white shadow-m3-1"
                style={{ backgroundColor: cat.color }}
              >
                <Tag className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-on-surface truncate">{cat.name}</span>
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: cat.color }}
                  />
                  Ativa
                </span>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* New Category Modal */}
      {isNewCatModalOpen && (
        <div
          onClick={() => setIsNewCatModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <Card
            variant="elevated"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md shadow-m3-3 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="font-semibold text-on-surface">Nova Categoria</h3>
                <p className="text-xs text-on-surface-variant">
                  Crie uma categoria personalizada para suas despesas
                </p>
              </div>
              <Button variant="text" size="icon" onClick={() => setIsNewCatModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-on-surface-variant">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Pets & Veterinário, Academia, Viagens"
                  className="mt-1 w-full rounded-m3-md border border-outline-variant/40 bg-surface dark:bg-[#141816] pl-3.5 pr-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-on-surface-variant mb-2 block">
                  Cor da Categoria (Material 3)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {M3_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${
                        newCatColor === color ? 'scale-125 ring-2 ring-primary shadow-m3-1' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {newCatColor === color && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20 dark:border-white/[0.06]">
                <Button
                  variant="text"
                  size="sm"
                  type="button"
                  onClick={() => setIsNewCatModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="filled" size="md" type="submit" disabled={isSaving || !newCatName}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Categoria'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <QuickExpenseModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        familyId={familyData?.id}
        members={familyData?.members}
        categories={familyData?.categories}
        onSuccess={loadData}
      />

      <AgentModal
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        onConfirmDraft={() => loadData()}
      />
    </div>
  );
}
