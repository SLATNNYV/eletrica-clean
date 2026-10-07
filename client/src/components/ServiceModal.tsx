import React, { useState, useEffect } from 'react';
import { X, Wrench, DollarSign, Clock, Check } from 'lucide-react';
import type { ServiceCatalog } from '../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: Partial<ServiceCatalog>) => Promise<void>;
  editingService?: ServiceCatalog | null;
}

const SERVICE_CATEGORIES = [
  'Diagnóstico elétrico',
  'Bateria',
  'Alternador',
  'Motor de partida',
  'Iluminação',
  'Sistema de carga',
  'Sistema de partida',
  'Injeção eletrônica',
  'Instalação de acessórios',
  'Som automotivo',
  'Alarmes',
  'Outros'
];

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingService
}) => {
  const [formData, setFormData] = useState<Partial<ServiceCatalog>>({
    name: '',
    category: 'Diagnóstico elétrico',
    description: '',
    default_price: 100.0,
    estimated_time: '1 hora',
    active: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingService) {
      setFormData({ ...editingService });
    } else {
      setFormData({
        name: '',
        category: 'Diagnóstico elétrico',
        description: '',
        default_price: 100.0,
        estimated_time: '1 hora',
        active: 1
      });
    }
    setError(null);
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.category) {
      setError('Nome do serviço e categoria são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
              </h2>
              <p className="text-xs text-slate-400">Gerencie a tabela de preços e descrição do serviço</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Nome do Serviço */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome do Serviço <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Teste de Alternador e Regulagem de Voltagem"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Categoria <span className="text-cyan-400">*</span>
            </label>
            <select
              value={formData.category || 'Diagnóstico elétrico'}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
            >
              {SERVICE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Valor Padrão & Tempo Estimado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Valor Padrão (R$)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.default_price || 0}
                  onChange={e => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tempo Estimado
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.estimated_time || ''}
                  onChange={e => setFormData({ ...formData, estimated_time: e.target.value })}
                  placeholder="Ex: 1 hora, 45 min"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Descrição do Serviço
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o procedimento e o que está incluso no serviço..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all resize-none"
            />
          </div>

          {/* Ativo / Inativo */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="service-active"
              checked={formData.active === 1}
              onChange={e => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="service-active" className="text-sm font-medium text-slate-300 cursor-pointer">
              Serviço Ativo no Catálogo
            </label>
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Salvando...' : 'Salvar Serviço'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
