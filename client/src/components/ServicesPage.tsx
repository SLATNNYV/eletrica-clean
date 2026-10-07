import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { ServiceCatalog } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ServicesPageProps {
  onNewService: () => void;
  onEditService: (service: ServiceCatalog) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onNewService,
  onEditService
}) => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let url = `/api/services?search=${encodeURIComponent(search)}`;
      if (selectedCategory !== 'Todas') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search, selectedCategory]);

  const handleToggleActive = async (id: number) => {
    try {
      const res = await fetch(`/api/services/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        fetchServices();
      }
    } catch (err) {
      console.error('Error toggling service active state:', err);
    }
  };

  const categoriesList = [
    'Todas',
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Tabela de Serviços & Valores
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Catálogo de serviços automotivos oferecidos com valores padrão e tempo estimado
          </p>
        </div>
        <button
          onClick={onNewService}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ Cadastrar Serviço</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou descrição..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-xs transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Carregando tabela de serviços...
          </div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Nenhum serviço encontrado no catálogo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Nome do Serviço</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Tempo Estimado</th>
                  <th className="py-3 px-4 text-right">Valor Padrão</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {services.map(srv => (
                  <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {srv.name}
                      {srv.description && (
                        <span className="block text-[11px] font-normal text-slate-400 line-clamp-1">{srv.description}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[11px] font-medium">
                        {srv.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5 mt-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{srv.estimated_time || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(srv.default_price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(srv.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          srv.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {srv.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {srv.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onEditService(srv)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                        title="Editar Serviço"
                      >
                        <Edit className="w-4 h-4" />
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
