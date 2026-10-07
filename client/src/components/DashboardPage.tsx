import React from 'react';
import {
  Wrench,
  Clock,
  CheckCircle,
  Car,
  DollarSign,
  UserPlus,
  CarFront,
  ClipboardPlus,
  WrenchIcon,
  TrendingUp,
  ArrowRight,
  Eye
} from 'lucide-react';
import type { DashboardMetrics } from '../types';
import { formatCurrency, getStatusBadgeStyle, formatDate } from '../utils/formatters';

interface DashboardPageProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onNewClient: () => void;
  onNewVehicle: () => void;
  onNewWorkOrder: () => void;
  onNewService: () => void;
  onOpenWorkOrder: (woId: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  loading,
  onNewClient,
  onNewVehicle,
  onNewWorkOrder,
  onNewService,
  onOpenWorkOrder,
  onNavigateTab
}) => {
  if (loading || !metrics) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Painel Geral — <span className="text-cyan-400">Elétrica Clean</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visão consolidada das operações da oficina, veículos e faturamento
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNewClient}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>Novo Cliente</span>
          </button>
          <button
            onClick={onNewVehicle}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <CarFront className="w-4 h-4 text-cyan-400" />
            <span>Novo Veículo</span>
          </button>
          <button
            onClick={onNewService}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Novo Serviço</span>
          </button>
          <button
            onClick={onNewWorkOrder}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <ClipboardPlus className="w-4 h-4 text-slate-950" />
            <span>Nova Ordem de Serviço</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total OS em Aberto */}
        <div
          onClick={() => onNavigateTab('work-orders')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              OS em Aberto
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-mono">{metrics.totalOpen}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Serviços não entregues</span>
          </p>
        </div>

        {/* Serviços em Andamento */}
        <div
          onClick={() => onNavigateTab('workshop')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Em Execução
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <WrenchIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-cyan-400 mt-3 font-mono">{metrics.inProgress}</p>
          <p className="text-xs text-slate-400 mt-1">Sendo reparados agora</p>
        </div>

        {/* Veículos na Oficina */}
        <div
          onClick={() => onNavigateTab('workshop')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Veículos na Oficina
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-mono">{metrics.inShopVehicles}</p>
          <p className="text-xs text-slate-400 mt-1">Aguardando ou em serviço</p>
        </div>

        {/* Concluídos */}
        <div
          onClick={() => onNavigateTab('work-orders')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Concluídos
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-3 font-mono">{metrics.completed}</p>
          <p className="text-xs text-slate-400 mt-1">Prontos para retirada</p>
        </div>
      </div>

      {/* Financial Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Faturamento do Dia */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Faturamento do Dia
            </span>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
              {formatCurrency(metrics.todayRevenue)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total recebido hoje em OS finalizadas</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

        {/* Faturamento do Mês */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Faturamento do Mês
            </span>
            <p className="text-3xl font-black text-cyan-400 mt-2 font-mono">
              {formatCurrency(metrics.monthRevenue)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Acumulado do mês vigente</p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Recent Work Orders Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Ordens de Serviço Recentes
            </h2>
            <p className="text-xs text-slate-400">Últimas ordens abertas na Elétrica Clean</p>
          </div>
          <button
            onClick={() => onNavigateTab('work-orders')}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Ver todas as OS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {metrics.recentWorkOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhuma Ordem de Serviço registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Nº OS</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Veículo / Placa</th>
                  <th className="py-3 px-4">Entrada</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {metrics.recentWorkOrders.map((wo) => (
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenWorkOrder(wo.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Ver / Editar OS"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </button>
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
