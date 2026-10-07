import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Printer,
  CheckSquare,
  Filter,
  Trash2
} from 'lucide-react';
import type { WorkOrder, OSStatus } from '../types';
import { formatCurrency, formatDate, getStatusBadgeStyle } from '../utils/formatters';

interface WorkOrdersPageProps {
  onNewWorkOrder: () => void;
  onEditWorkOrder: (workOrder: WorkOrder) => void;
  onOpenChecklistModal: (workOrderId: number) => void;
  onPrintWorkOrder: (workOrder: WorkOrder) => void;
  onPrintChecklist: (workOrderId: number) => void;
}

const OS_STATUS_OPTIONS: (OSStatus | 'Todos')[] = [
  'Todos',
  'Aguardando avaliação',
  'Aguardando aprovação',
  'Aprovado',
  'Em execução',
  'Aguardando peça',
  'Concluído',
  'Entregue',
  'Cancelado'
];

export const WorkOrdersPage: React.FC<WorkOrdersPageProps> = ({
  onNewWorkOrder,
  onEditWorkOrder,
  onOpenChecklistModal,
  onPrintWorkOrder
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OSStatus | 'Todos'>('Todos');
  const [loading, setLoading] = useState(true);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      let url = `/api/work-orders?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'Todos') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [search, statusFilter]);

  const handleArchiveOS = async (id: number) => {
    if (!window.confirm('Deseja realmente arquivar esta Ordem de Serviço? Ela continuará preservada no histórico.')) return;
    try {
      const res = await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkOrders();
      }
    } catch (err) {
      console.error('Error archiving OS:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Ordens de Serviço
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Abertura, acompanhamento de status, peças, serviços e faturamento
          </p>
        </div>
        <button
          onClick={onNewWorkOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por Nº OS, cliente, placa ou problema..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs transition-all"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
          {OS_STATUS_OPTIONS.map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Carregando Ordens de Serviço...
          </div>
        ) : workOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhuma Ordem de Serviço encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">OS Nº</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Veículo / Placa</th>
                  <th className="py-3 px-4">Data Entrada</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {workOrders.map(wo => (
                  <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {wo.os_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {wo.client_name}
                      <span className="block text-[11px] font-normal text-slate-400">{wo.client_phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      {wo.vehicle_brand} {wo.vehicle_model}
                      <span className="block font-mono text-[11px] text-cyan-300 font-bold uppercase">{wo.vehicle_plate}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(wo.entry_date)}
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditWorkOrder(wo)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                          title="Editar OS"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenChecklistModal(wo.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                          title="Checklist de Entrada"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPrintWorkOrder(wo)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Imprimir OS / Gerar PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleArchiveOS(wo.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Arquivar OS"
                        >
                          <Trash2 className="w-4 h-4" />
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
