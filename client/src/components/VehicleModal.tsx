import React, { useState, useEffect } from 'react';
import { X, Car, User, Gauge, Fuel, Check } from 'lucide-react';
import type { Vehicle, Client } from '../types';
import { formatPlate } from '../utils/formatters';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleData: Partial<Vehicle>) => Promise<void>;
  clients: Client[];
  editingVehicle?: Vehicle | null;
  defaultClientId?: number;
}

const COMMON_BRANDS = [
  'Chevrolet', 'Volkswagen', 'Fiat', 'Ford', 'Toyota',
  'Honda', 'Hyundai', 'Renault', 'Nissan', 'Jeep',
  'Peugeot', 'Citroën', 'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Outra'
];

const FUEL_LEVELS = ['Reserva', '1/4', '1/2', '3/4', 'Cheio'];

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clients,
  editingVehicle,
  defaultClientId
}) => {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    client_id: defaultClientId || (clients[0]?.id || 0),
    brand: 'Chevrolet',
    model: '',
    year: new Date().getFullYear().toString(),
    color: 'Preto',
    plate: '',
    mileage: 0,
    fuel_level: '1/2',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingVehicle) {
      setFormData({ ...editingVehicle });
    } else {
      setFormData({
        client_id: defaultClientId || (clients[0]?.id || 0),
        brand: 'Chevrolet',
        model: '',
        year: new Date().getFullYear().toString(),
        color: 'Cinza',
        plate: '',
        mileage: 0,
        fuel_level: '1/2',
        notes: ''
      });
    }
    setError(null);
  }, [editingVehicle, isOpen, defaultClientId, clients]);

  if (!isOpen) return null;

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setFormData(prev => ({ ...prev, plate: formatPlate(raw) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.brand || !formData.model?.trim() || !formData.plate?.trim()) {
      setError('Cliente, marca, modelo e placa são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar veículo');
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
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              <p className="text-xs text-slate-400">Cadastre as especificações do automóvel</p>
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

          {/* Cliente Proprietário */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Cliente Proprietário <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                required
                value={formData.client_id || ''}
                onChange={e => setFormData({ ...formData, client_id: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
              >
                <option value="" disabled>Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marca e Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Marca <span className="text-cyan-400">*</span>
              </label>
              <select
                value={formData.brand || 'Chevrolet'}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
              >
                {COMMON_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Modelo <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.model || ''}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Astra, Gol, Civic"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Placa & Ano */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Placa <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={formData.plate || ''}
                onChange={handlePlateChange}
                placeholder="ABC1D23"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 font-mono font-bold tracking-wider placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm uppercase transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Ano
              </label>
              <input
                type="text"
                value={formData.year || ''}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                placeholder="Ex: 2007"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Cor
              </label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ex: Cinza"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Quilometragem e Nível de Combustível */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Quilometragem (km)
              </label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min={0}
                  value={formData.mileage || 0}
                  onChange={e => setFormData({ ...formData, mileage: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nível de Combustível
              </label>
              <div className="relative">
                <Fuel className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={formData.fuel_level || '1/2'}
                  onChange={e => setFormData({ ...formData, fuel_level: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
                >
                  {FUEL_LEVELS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Observações do Veículo
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalhes particulares do veículo..."
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Salvando...' : 'Salvar Veículo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
