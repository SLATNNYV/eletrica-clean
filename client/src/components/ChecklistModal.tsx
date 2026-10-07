import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlertTriangle, CheckCircle, HelpCircle, MinusCircle, FileText, Printer, Check } from 'lucide-react';
import type { ChecklistItem, WorkOrderChecklist } from '../types';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (generalNotes: string, items: ChecklistItem[]) => Promise<void>;
  workOrderNumber: string;
  vehicleInfo: string;
  initialChecklist?: WorkOrderChecklist | null;
  initialItems?: ChecklistItem[];
  onPrintChecklist?: () => void;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'status' | 'notes'>[] = [
  // Exterior
  { category: 'exterior', item_key: 'para_choque_dianteiro', label: 'Para-choque dianteiro' },
  { category: 'exterior', item_key: 'para_choque_traseiro', label: 'Para-choque traseiro' },
  { category: 'exterior', item_key: 'capo', label: 'Capô' },
  { category: 'exterior', item_key: 'teto', label: 'Teto' },
  { category: 'exterior', item_key: 'porta_dianteira_esquerda', label: 'Porta dianteira esquerda' },
  { category: 'exterior', item_key: 'porta_dianteira_direita', label: 'Porta dianteira direita' },
  { category: 'exterior', item_key: 'porta_traseira_esquerda', label: 'Porta traseira esquerda' },
  { category: 'exterior', item_key: 'porta_traseira_direita', label: 'Porta traseira direita' },
  { category: 'exterior', item_key: 'para_lama_dianteiro_esquerdo', label: 'Para-lama dianteiro esquerdo' },
  { category: 'exterior', item_key: 'para_lama_dianteiro_direito', label: 'Para-lama dianteiro direito' },
  { category: 'exterior', item_key: 'para_lama_traseiro_esquerdo', label: 'Para-lama traseiro esquerdo' },
  { category: 'exterior', item_key: 'para_lama_traseiro_direito', label: 'Para-lama traseiro direito' },
  { category: 'exterior', item_key: 'retrovisor_esquerdo', label: 'Retrovisor esquerdo' },
  { category: 'exterior', item_key: 'retrovisor_direito', label: 'Retrovisor direito' },
  { category: 'exterior', item_key: 'vidros', label: 'Vidros' },
  { category: 'exterior', item_key: 'farois', label: 'Faróis' },
  { category: 'exterior', item_key: 'lanternas', label: 'Lanternas' },
  { category: 'exterior', item_key: 'pneus', label: 'Pneus' },
  { category: 'exterior', item_key: 'rodas', label: 'Rodas' },
  // Interior
  { category: 'interior', item_key: 'bancos', label: 'Bancos' },
  { category: 'interior', item_key: 'painel', label: 'Painel' },
  { category: 'interior', item_key: 'volante', label: 'Volante' },
  { category: 'interior', item_key: 'tapetes', label: 'Tapetes' },
  { category: 'interior', item_key: 'forracao', label: 'Forração' },
  { category: 'interior', item_key: 'radio_multimidia', label: 'Rádio/multimídia' },
  { category: 'interior', item_key: 'ar_condicionado', label: 'Ar-condicionado' },
  { category: 'interior', item_key: 'itens_pessoais', label: 'Itens pessoais' },
  // Mecânica / Elétrica
  { category: 'mecanica', item_key: 'bateria', label: 'Bateria' },
  { category: 'mecanica', item_key: 'luzes_painel', label: 'Luzes do painel' },
  { category: 'mecanica', item_key: 'funcionamento_veiculo', label: 'Funcionamento do veículo' },
  { category: 'mecanica', item_key: 'nivel_combustivel', label: 'Nível de combustível' },
  { category: 'mecanica', item_key: 'quilometragem', label: 'Quilometragem' }
];

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workOrderNumber,
  vehicleInfo,
  initialChecklist,
  initialItems,
  onPrintChecklist
}) => {
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior' | 'mecanica'>('exterior');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGeneralNotes(initialChecklist?.general_notes || '');

    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    } else {
      // Initialize with default items
      setItems(
        DEFAULT_ITEMS.map(def => ({
          ...def,
          status: 'OK',
          notes: ''
        }))
      );
    }
  }, [initialChecklist, initialItems, isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = (key: string, status: ChecklistItem['status']) => {
    setItems(prev =>
      prev.map(item => (item.item_key === key ? { ...item, status } : item))
    );
  };

  const handleNotesChange = (key: string, notes: string) => {
    setItems(prev =>
      prev.map(item => (item.item_key === key ? { ...item, notes } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(generalNotes, items);
      onClose();
    } catch (err) {
      console.error('Error saving checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentTabItems = items.filter(i => i.category === activeTab);
  const avariasCount = items.filter(i => i.status === 'Com avaria').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Checklist de Entrada — <span className="text-cyan-400">{workOrderNumber}</span>
              </h2>
              <p className="text-xs text-slate-400">{vehicleInfo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPrintChecklist && (
              <button
                type="button"
                onClick={onPrintChecklist}
                className="p-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Imprimir Checklist</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('exterior')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'exterior'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              1. Exterior ({items.filter(i => i.category === 'exterior').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interior')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'interior'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              2. Interior ({items.filter(i => i.category === 'interior').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mecanica')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'mecanica'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              3. Mecânica / Elétrica ({items.filter(i => i.category === 'mecanica').length})
            </button>
          </div>

          {avariasCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold whitespace-nowrap flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {avariasCount} {avariasCount === 1 ? 'avaria apontada' : 'avarias apontadas'}
            </span>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Inspection Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTabItems.map(item => (
              <div
                key={item.item_key}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.status === 'Com avaria'
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-100">{item.label}</span>
                  {item.status === 'Com avaria' && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Avaria
                    </span>
                  )}
                </div>

                {/* Status Options */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.item_key, 'OK')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                      item.status === 'OK'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" /> OK
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.item_key, 'Com avaria')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                      item.status === 'Com avaria'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" /> Avaria
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.item_key, 'Não verificado')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                      item.status === 'Não verificado'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <HelpCircle className="w-3 h-3" /> N/V
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.item_key, 'Não possui')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                      item.status === 'Não possui'
                        ? 'bg-slate-700/60 text-slate-300 border border-slate-600'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <MinusCircle className="w-3 h-3" /> N/P
                  </button>
                </div>

                {/* Optional Note for this item */}
                <input
                  type="text"
                  value={item.notes || ''}
                  onChange={e => handleNotesChange(item.item_key, e.target.value)}
                  placeholder="Observação individual deste item..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all"
                />
              </div>
            ))}
          </div>

          {/* General Entry Notes */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> Observações da Entrada do Veículo
            </label>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
              placeholder="Descreva detalhes adicionais encontrados no momento da chegada (ex: riscos, amassados gerais, pertences deixados no interior)..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Salvando...' : 'Salvar Checklist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
