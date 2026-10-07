import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Car,
  ClipboardList,
  DollarSign,
  Edit,
  Plus,
  Eye,
  ChevronRight,
  User
} from 'lucide-react';
import type { Client, Vehicle, WorkOrder } from '../types';
import { formatCurrency, formatDate, getStatusBadgeStyle } from '../utils/formatters';

interface ClientsPageProps {
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
  onAddVehicleForClient: (clientId: number) => void;
  onNewOSForClient: (clientId: number) => void;
  onOpenWorkOrder: (woId: number) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  onNewClient,
  onEditClient,
  onAddVehicleForClient,
  onNewOSForClient,
  onOpenWorkOrder
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Client Detail View State
  const [clientDetail, setClientDetail] = useState<{
    client: Client;
    vehicles: Vehicle[];
    workOrders: WorkOrder[];
    totalSpent: number;
  } | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (data.length > 0 && !selectedClientId) {
          setSelectedClientId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/clients/${selectedClientId}`);
        if (res.ok) {
          const data = await res.json();
          setClientDetail(data);
        }
      } catch (err) {
        console.error('Failed to fetch client detail:', err);
      }
    };
    fetchDetail();
  }, [selectedClientId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Cadastro de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gerencie os proprietários dos veículos e histórico de gastos
          </p>
        </div>
        <button
          onClick={onNewClient}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20 active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, telefone ou CPF..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
        />
      </div>

      {/* Split View Layout: Left Client List, Right Client Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Client List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col max-h-[75vh]">
          <div className="px-2 pb-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>CLIENTE ({clients.length})</span>
            <span>TOTAL GASTO</span>
          </div>

          <div className="overflow-y-auto space-y-2 pt-3 flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Carregando clientes...
              </div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum cliente encontrado.
              </div>
            ) : (
              clients.map(c => {
                const isSelected = selectedClientId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-md'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{c.vehicle_count || 0} veículo(s)</span>
                        {c.cpf && <span>• CPF: {c.cpf}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        {formatCurrency(c.total_spent)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed View of Selected Client */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col space-y-6">
          {!clientDetail ? (
            <div className="py-20 text-center text-xs text-slate-400">
              Selecione um cliente da lista à esquerda para visualizar seu perfil completo.
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    {clientDetail.client.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cliente desde {formatDate(clientDetail.client.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditClient(clientDetail.client)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => onNewOSForClient(clientDetail.client.id)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Abrir OS</span>
                  </button>
                </div>
              </div>

              {/* Personal Details & Financial Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <span><strong>Telefone:</strong> {clientDetail.client.phone}</span>
                  </div>
                  {clientDetail.client.whatsapp && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span><strong>WhatsApp:</strong> {clientDetail.client.whatsapp}</span>
                    </div>
                  )}
                  {clientDetail.client.cpf && (
                    <div className="text-slate-300">
                      <strong>CPF:</strong> {clientDetail.client.cpf}
                    </div>
                  )}
                  {clientDetail.client.email && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span><strong>E-mail:</strong> {clientDetail.client.email}</span>
                    </div>
                  )}
                  {clientDetail.client.address && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span><strong>Endereço:</strong> {clientDetail.client.address}</span>
                    </div>
                  )}
                  {clientDetail.client.notes && (
                    <div className="text-slate-400 pt-1 border-t border-slate-800">
                      <strong>Obs:</strong> {clientDetail.client.notes}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Total Gasto na Oficina
                  </span>
                  <p className="text-3xl font-black text-emerald-400 font-mono my-2">
                    {formatCurrency(clientDetail.totalSpent)}
                  </p>
                  <p className="text-[11px] text-slate-400">Total acumulado em serviços e peças finalizados</p>
                </div>
              </div>

              {/* Registered Vehicles Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Car className="w-4 h-4" /> Veículos Cadastrados ({clientDetail.vehicles.length})
                  </h3>
                  <button
                    onClick={() => onAddVehicleForClient(clientDetail.client.id)}
                    className="text-xs text-cyan-400 hover:underline font-bold flex items-center gap-1"
                  >
                    + Adicionar Veículo
                  </button>
                </div>

                {clientDetail.vehicles.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    Nenhum veículo cadastrado para este cliente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clientDetail.vehicles.map(v => (
                      <div key={v.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 text-sm">{v.brand} {v.model} ({v.year})</span>
                          <span className="font-mono font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {v.plate}
                          </span>
                        </div>
                        <p className="text-slate-400">Cor: {v.color} • KM: {v.mileage ? v.mileage.toLocaleString('pt-BR') : '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Orders History for this Client */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-cyan-400" /> Histórico de Ordens de Serviço ({clientDetail.workOrders.length})
                </h3>

                {clientDetail.workOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    Nenhuma ordem de serviço anterior.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {clientDetail.workOrders.map(wo => (
                      <div key={wo.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-400">{wo.os_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(wo.status)}`}>
                              {wo.status}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1 font-semibold">{wo.vehicle_model} ({wo.vehicle_plate})</p>
                          <p className="text-slate-400 text-[11px] truncate max-w-xs">{wo.reported_problem}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="font-mono font-bold text-emerald-400 block">{formatCurrency(wo.final_total)}</span>
                            <span className="text-[10px] text-slate-400">{formatDate(wo.entry_date)}</span>
                          </div>
                          <button
                            onClick={() => onOpenWorkOrder(wo.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                            title="Ver OS"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
