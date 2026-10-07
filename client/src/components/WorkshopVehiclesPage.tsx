import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { formatElapsedTime, getStatusBadgeStyle, formatPlate } from '../utils/formatters';

interface WorkshopVehiclesPageProps {
  onOpenWorkOrder: (woId: number) => void;
}

export const WorkshopVehiclesPage: React.FC<WorkshopVehiclesPageProps> = ({
  onOpenWorkOrder
}) => {
  const [activeWorkOrders, setActiveWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkshopVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workshop-vehicles');
      if (res.ok) {
        const data = await res.json();
        setActiveWorkOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch workshop vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshopVehicles();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Veículos na Oficina
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold animate-pulse">
              {activeWorkOrders.length} {activeWorkOrders.length === 1 ? 'veículo' : 'veículos'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Painel ao vivo de veículos atualmente estacionados ou em serviço na Elétrica Clean
          </p>
        </div>

        <button
          onClick={fetchWorkshopVehicles}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          Atualizar Lista
        </button>
      </div>

      {/* Grid of Workshop Vehicle Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
          Carregando veículos na oficina...
        </div>
      ) : activeWorkOrders.length === 0 ? (
        <div className="py-16 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3 p-8">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Pátio limpo!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não há nenhum veículo pendente ou em manutenção no momento. Quando uma nova OS for aberta, o veículo aparecerá automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeWorkOrders.map(wo => (
            <div
              key={wo.id}
              onClick={() => onOpenWorkOrder(wo.id)}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Accent top stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />

              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-extrabold text-cyan-400 text-sm">
                    {wo.os_number}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getStatusBadgeStyle(wo.status)}`}>
                    {wo.status}
                  </span>
                </div>

                {/* Vehicle Title & Plate */}
                <div className="flex items-center justify-between mt-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {wo.vehicle_brand} {wo.vehicle_model}
                  </h3>
                  <span className="font-mono font-black text-cyan-300 text-xs uppercase px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                    {formatPlate(wo.vehicle_plate)}
                  </span>
                </div>

                {/* Client Name */}
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{wo.client_name} ({wo.client_phone})</span>
                </p>
              </div>

              {/* Service Info & Elapsed Time Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Serviço / Problema:
                  </span>
                  <p className="text-slate-200 font-medium line-clamp-2 mt-0.5">
                    {wo.primary_service || wo.reported_problem}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo na oficina:
                  </span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {formatElapsedTime(wo.entry_date)}
                  </span>
                </div>
              </div>

              {/* Footer Click Prompt */}
              <div className="flex items-center justify-between pt-1 text-xs text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Clique para abrir Ordem de Serviço</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
