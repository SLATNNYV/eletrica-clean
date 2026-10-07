import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Car, ClipboardList, ChevronRight } from 'lucide-react';
import type { SearchResults } from '../types';
import { formatCurrency, formatPlate } from '../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (clientId: number) => void;
  onSelectVehicle: (vehicleId: number) => void;
  onSelectWorkOrder: (workOrderId: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  onSelectVehicle,
  onSelectWorkOrder
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ clients: [], vehicles: [], workOrders: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ clients: [], vehicles: [], workOrders: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], vehicles: [], workOrders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.clients.length + results.vehicles.length + results.workOrders.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar por nome, telefone, placa, modelo ou número da OS..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Buscando no banco de dados...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              Nenhum resultado encontrado para "<span className="text-slate-200">{query}</span>".
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-xs text-slate-400">
              Digite algo para pesquisar em clientes, veículos e ordens de serviço.
            </div>
          )}

          {/* Group 1: CLIENTES */}
          {results.clients.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Clientes ({results.clients.length})
              </h3>
              <div className="space-y-1.5">
                {results.clients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectClient(c.id);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between text-left transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.phone} {c.cpf ? `• CPF: ${c.cpf}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group 2: VEÍCULOS */}
          {results.vehicles.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-cyan-400" /> Veículos ({results.vehicles.length})
              </h3>
              <div className="space-y-1.5">
                {results.vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v.id);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between text-left transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {v.brand} {v.model} ({v.year}) — <span className="font-mono text-cyan-300">{formatPlate(v.plate)}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Proprietário: {v.client_name || 'Desconhecido'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group 3: ORDENS DE SERVIÇO */}
          {results.workOrders.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5 text-cyan-400" /> Ordens de Serviço ({results.workOrders.length})
              </h3>
              <div className="space-y-1.5">
                {results.workOrders.map(wo => (
                  <button
                    key={wo.id}
                    onClick={() => {
                      onSelectWorkOrder(wo.id);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between text-left transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cyan-400 font-mono">{wo.os_number}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {wo.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 truncate max-w-md">
                        {wo.client_name} • {wo.vehicle_model} ({wo.vehicle_plate}) — {wo.reported_problem}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatCurrency(wo.final_total)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
