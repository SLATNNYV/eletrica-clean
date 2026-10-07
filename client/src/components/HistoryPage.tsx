import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Printer,
  CheckSquare
} from 'lucide-react';
import type { WorkOrder } from '../types';
import { formatCurrency, formatDate, getStatusBadgeStyle, formatPlate } from '../utils/formatters';

interface HistoryPageProps {
  onOpenWorkOrder: (woId: number) => void;
  onOpenChecklistModal: (woId: number) => void;
  onPrintWorkOrder: (wo: WorkOrder) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onOpenWorkOrder,
  onOpenChecklistModal,
  onPrintWorkOrder
}) => {
  const [history, setHistory] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState('');
  const [plateFilter, setPlateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (plateFilter) params.append('plate', plateFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, plateFilter, startDate, endDate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Histórico Completo de Serviços
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Consulta permanente do acervo de ordens de serviço, clientes, reparos e checklists
        </p>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* General Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar cliente, veículo, serviço..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs transition-all"
            />
          </div>

          {/* Placa Filter */}
          <div>
            <input
              type="text"
              value={plateFilter}
              onChange={e => setPlateFilter(e.target.value.toUpperCase())}
              placeholder="Placa do Veículo"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 font-mono uppercase placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs transition-all"
            />
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none text-xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Consultando histórico de registros...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhum registro encontrado no histórico com esses filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">OS Nº</th>
                  <th className="py-3 px-4">Data Entrada</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Veículo / Placa</th>
                  <th className="py-3 px-4">Problema Relatado</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {history.map(wo => (
                  <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {wo.os_number}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(wo.entry_date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {wo.client_name}
                      <span className="block text-[11px] font-normal text-slate-400">{wo.client_phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      {wo.vehicle_brand} {wo.vehicle_model}
                      <span className="block font-mono text-[11px] text-cyan-300 font-bold uppercase">{formatPlate(wo.vehicle_plate || '')}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {wo.reported_problem}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold inline-block ${getStatusBadgeStyle(wo.status)}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(wo.final_total)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenWorkOrder(wo.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                          title="Ver Detalhes da OS"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenChecklistModal(wo.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                          title="Ver Checklist"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPrintWorkOrder(wo)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Imprimir OS"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
