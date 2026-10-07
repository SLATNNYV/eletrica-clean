import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  Plus,
  Edit,
  User,
  Wrench,
  Gauge,
  Fuel,
  Eye
} from 'lucide-react';
import type { Vehicle, Client } from '../types';
import { formatPlate } from '../utils/formatters';

interface VehiclesPageProps {
  onNewVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onNewOSForVehicle: (vehicleId: number, clientId: number) => void;
  onOpenWorkOrder: (woId: number) => void;
  clients: Client[];
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({
  onNewVehicle,
  onEditVehicle,
  onNewOSForVehicle,
  onOpenWorkOrder
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<any | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search]);

  const handleSelectVehicle = async (vehicleId: number) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedVehicleDetail(data);
      }
    } catch (err) {
      console.error('Error fetching vehicle detail:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Cadastro de Veículos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Frota de veículos dos clientes e status de permanência na oficina
          </p>
        </div>
        <button
          onClick={onNewVehicle}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/20 active:scale-95 self-start sm:self-auto"
        >
          <Car className="w-4 h-4 text-slate-950" />
          <span>+ Novo Veículo</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar por placa, modelo, marca ou cliente..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all"
        />
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 animate-pulse">
            Carregando frota de veículos...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Nenhum veículo encontrado.
          </div>
        ) : (
          vehicles.map(v => (
            <div
              key={v.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group"
            >
              {/* NA OFICINA Indicator Badge */}
              {v.is_in_workshop && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1 animate-pulse">
                  <Wrench className="w-3 h-3 fill-slate-950" />
                  NA OFICINA
                </div>
              )}

              {/* Card Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-base font-black tracking-wider text-cyan-400 uppercase bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    {formatPlate(v.plate)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {v.year}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-2">
                  {v.brand} {v.model}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{v.client_name || 'Desconhecido'}</span>
                  {v.client_phone && <span className="text-slate-500">({v.client_phone})</span>}
                </p>
              </div>

              {/* Details & Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-500 font-semibold">Cor:</span>
                  <span className="font-semibold">{v.color || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">{v.fuel_level || '-'}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-slate-300">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Quilometragem: <strong className="font-mono">{v.mileage ? `${v.mileage.toLocaleString('pt-BR')} km` : '-'}</strong></span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onEditVehicle(v)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleSelectVehicle(v.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                  title="Ver Detalhes / Histórico"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => onNewOSForVehicle(v.id, v.client_id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nova OS</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vehicle Detail Popover / Modal */}
      {selectedVehicleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-cyan-400" />
                  {selectedVehicleDetail.vehicle.brand} {selectedVehicleDetail.vehicle.model}
                </h2>
                <p className="text-xs text-slate-400">
                  Placa: <strong className="font-mono text-cyan-300">{formatPlate(selectedVehicleDetail.vehicle.plate)}</strong> | Cliente: {selectedVehicleDetail.vehicle.client_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicleDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-slate-500">Ano:</span>
                  <p className="font-bold text-slate-200">{selectedVehicleDetail.vehicle.year}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cor:</span>
                  <p className="font-bold text-slate-200">{selectedVehicleDetail.vehicle.color}</p>
                </div>
                <div>
                  <span className="text-slate-500">Quilometragem:</span>
                  <p className="font-bold text-slate-200">{selectedVehicleDetail.vehicle.mileage} km</p>
                </div>
                <div>
                  <span className="text-slate-500">Combustível:</span>
                  <p className="font-bold text-slate-200">{selectedVehicleDetail.vehicle.fuel_level}</p>
                </div>
              </div>

              {/* History OS */}
              <h3 className="font-bold text-slate-300 uppercase tracking-wider text-xs pt-2">
                Histórico de Ordens de Serviço deste Veículo ({selectedVehicleDetail.history.length})
              </h3>
              {selectedVehicleDetail.history.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-slate-400">
                  Nenhum registro anterior para este veículo.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedVehicleDetail.history.map((wo: any) => (
                    <div key={wo.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-cyan-400">{wo.os_number}</span> — <span className="text-slate-300">{wo.status}</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">{wo.reported_problem}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVehicleDetail(null);
                          onOpenWorkOrder(wo.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
