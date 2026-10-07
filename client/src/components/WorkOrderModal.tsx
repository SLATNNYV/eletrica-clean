import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardList,
  User,
  Car,
  Trash2,
  CheckSquare,
  Wrench,
  Package,
  Check
} from 'lucide-react';
import type { WorkOrder, Client, Vehicle, ServiceCatalog, WorkOrderService, WorkOrderPart, OSStatus, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/formatters';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workOrderData: any) => Promise<void>;
  onOpenChecklistModal?: (workOrderId?: number) => void;
  clients: Client[];
  vehicles: Vehicle[];
  servicesCatalog: ServiceCatalog[];
  editingWorkOrder?: WorkOrder | null;
  onQuickAddClient?: () => void;
  onQuickAddVehicle?: () => void;
}

const OS_STATUSES: OSStatus[] = [
  'Aguardando avaliação',
  'Aguardando aprovação',
  'Aprovado',
  'Em execução',
  'Aguardando peça',
  'Concluído',
  'Entregue',
  'Cancelado'
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'PIX',
  'Dinheiro',
  'Débito',
  'Crédito',
  'Outro'
];

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onOpenChecklistModal,
  clients,
  vehicles,
  servicesCatalog,
  editingWorkOrder,
  onQuickAddClient,
  onQuickAddVehicle
}) => {
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [mileage, setMileage] = useState<number>(0);
  const [reportedProblem, setReportedProblem] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<OSStatus>('Aguardando avaliação');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [discount, setDiscount] = useState<number>(0);

  // Line items
  const [services, setServices] = useState<WorkOrderService[]>([]);
  const [parts, setParts] = useState<WorkOrderPart[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtered vehicles belonging to selected client
  const clientVehicles = vehicles.filter(v => v.client_id === selectedClientId);

  useEffect(() => {
    if (editingWorkOrder) {
      setSelectedClientId(editingWorkOrder.client_id);
      setSelectedVehicleId(editingWorkOrder.vehicle_id);
      setMileage(editingWorkOrder.mileage || 0);
      setReportedProblem(editingWorkOrder.reported_problem || '');
      setNotes(editingWorkOrder.notes || '');
      setStatus(editingWorkOrder.status);
      setPaymentMethod(editingWorkOrder.payment_method || 'PIX');
      setDiscount(editingWorkOrder.discount || 0);
      setServices(editingWorkOrder.services || []);
      setParts(editingWorkOrder.parts || []);
    } else {
      const firstClient = clients[0]?.id || 0;
      setSelectedClientId(firstClient);
      const firstClientVehicles = vehicles.filter(v => v.client_id === firstClient);
      setSelectedVehicleId(firstClientVehicles[0]?.id || 0);
      setMileage(0);
      setReportedProblem('');
      setNotes('');
      setStatus('Aguardando avaliação');
      setPaymentMethod('PIX');
      setDiscount(0);
      setServices([]);
      setParts([]);
    }
    setError(null);
  }, [editingWorkOrder, isOpen, clients, vehicles]);

  // Update selected vehicle if client changes
  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
    const related = vehicles.filter(v => v.client_id === clientId);
    if (related.length > 0) {
      setSelectedVehicleId(related[0].id);
      setMileage(related[0].mileage || 0);
    } else {
      setSelectedVehicleId(0);
      setMileage(0);
    }
  };

  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    const found = vehicles.find(v => v.id === vehicleId);
    if (found) {
      setMileage(found.mileage || 0);
    }
  };

  // Add catalog service
  const handleAddCatalogService = (catalogId: number) => {
    if (!catalogId) return;
    const cat = servicesCatalog.find(s => s.id === catalogId);
    if (!cat) return;

    setServices(prev => [
      ...prev,
      {
        service_catalog_id: cat.id,
        name: cat.name,
        description: cat.description || '',
        quantity: 1,
        unit_price: cat.default_price,
        discount: 0,
        total_price: cat.default_price
      }
    ]);
  };

  // Add manual service
  const handleAddManualService = () => {
    setServices(prev => [
      ...prev,
      {
        service_catalog_id: null,
        name: 'Serviço Personalizado',
        description: '',
        quantity: 1,
        unit_price: 100.0,
        discount: 0,
        total_price: 100.0
      }
    ]);
  };

  // Update service line item
  const handleUpdateService = (index: number, field: keyof WorkOrderService, val: any) => {
    setServices(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      const qty = item.quantity || 1;
      const uPrice = item.unit_price || 0;
      const disc = item.discount || 0;
      item.total_price = (qty * uPrice) - disc;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  // Add part line item
  const handleAddPart = () => {
    setParts(prev => [
      ...prev,
      {
        description: 'Nova Peça / Componente',
        quantity: 1,
        unit_price: 50.0,
        total_price: 50.0
      }
    ]);
  };

  const handleUpdatePart = (index: number, field: keyof WorkOrderPart, val: any) => {
    setParts(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      const qty = item.quantity || 1;
      const uPrice = item.unit_price || 0;
      item.total_price = qty * uPrice;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemovePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  // Totals calculation
  const servicesTotal = services.reduce((acc, s) => acc + (s.total_price || 0), 0);
  const partsTotal = parts.reduce((acc, p) => acc + (p.total_price || 0), 0);
  const finalTotal = Math.max(0, servicesTotal + partsTotal - discount);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Por favor selecione um cliente.');
      return;
    }
    if (!selectedVehicleId) {
      setError('Por favor selecione um veículo para a OS.');
      return;
    }
    if (!reportedProblem.trim()) {
      setError('O problema relatado é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        id: editingWorkOrder?.id,
        client_id: selectedClientId,
        vehicle_id: selectedVehicleId,
        mileage,
        reported_problem: reportedProblem,
        notes,
        status,
        payment_method: paymentMethod,
        discount,
        services,
        parts
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar Ordem de Serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingWorkOrder ? `Editar ${editingWorkOrder.os_number}` : 'Nova Ordem de Serviço'}
              </h2>
              <p className="text-xs text-slate-400">Abertura e orçamento da Ordem de Serviço</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Top Info: Client & Vehicle Selection */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Cliente <span className="text-cyan-400">*</span>
                  </label>
                  {onQuickAddClient && (
                    <button
                      type="button"
                      onClick={onQuickAddClient}
                      className="text-xs text-cyan-400 hover:underline font-medium"
                    >
                      + Novo Cliente
                    </button>
                  )}
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    required
                    value={selectedClientId}
                    onChange={e => handleClientSelect(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
                  >
                    <option value={0} disabled>Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Veículo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Veículo <span className="text-cyan-400">*</span>
                  </label>
                  {onQuickAddVehicle && (
                    <button
                      type="button"
                      onClick={onQuickAddVehicle}
                      className="text-xs text-cyan-400 hover:underline font-medium"
                    >
                      + Novo Veículo
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    required
                    disabled={!selectedClientId || clientVehicles.length === 0}
                    value={selectedVehicleId}
                    onChange={e => handleVehicleSelect(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all disabled:opacity-50"
                  >
                    {clientVehicles.length === 0 ? (
                      <option value={0}>Nenhum veículo cadastrado para este cliente</option>
                    ) : (
                      clientVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} ({v.year}) - Placa: {v.plate}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Mileage & Status & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Quilometragem no Ato
                </label>
                <input
                  type="number"
                  min={0}
                  value={mileage}
                  onChange={e => setMileage(Number(e.target.value))}
                  placeholder="Ex: 125400"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Status da OS
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as OSStatus)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-semibold focus:border-cyan-500 focus:outline-none text-sm transition-all"
                >
                  {OS_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none text-sm transition-all"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reported Problem & Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Problema / Solicitação Relatada pelo Cliente <span className="text-cyan-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reportedProblem}
              onChange={e => setReportedProblem(e.target.value)}
              placeholder="Ex: Luz da bateria acesa no painel, veículo falha ao dar partida pela manhã..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none text-sm transition-all resize-none"
            />
          </div>

          {/* SECTION 1: SERVIÇOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Serviços Realizados / Planejados
              </h3>
              <div className="flex items-center gap-2">
                <select
                  onChange={e => {
                    handleAddCatalogService(Number(e.target.value));
                    e.target.value = '';
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">+ Selecionar do Catálogo...</option>
                  {servicesCatalog.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.default_price)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddManualService}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-slate-700 transition-colors"
                >
                  + Manual
                </button>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Nenhum serviço adicionado ainda. Escolha no catálogo acima ou adicione manualmente.
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((srv, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={srv.name}
                        onChange={e => handleUpdateService(idx, 'name', e.target.value)}
                        placeholder="Nome do serviço"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={srv.quantity}
                        onChange={e => handleUpdateService(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-center font-mono focus:border-cyan-500 focus:outline-none"
                        title="Quantidade"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={srv.unit_price}
                        onChange={e => handleUpdateService(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-right font-mono focus:border-cyan-500 focus:outline-none"
                        title="Valor unitário"
                      />
                    </div>
                    <div className="sm:col-span-2 text-right font-mono font-bold text-slate-200">
                      {formatCurrency(srv.total_price)}
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MATERIAIS / PEÇAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Package className="w-4 h-4" /> Peças e Materiais Utilizados
              </h3>
              <button
                type="button"
                onClick={handleAddPart}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 border border-slate-700 transition-colors"
              >
                + Adicionar Peça
              </button>
            </div>

            {parts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Nenhuma peça ou material registrado nesta OS.
              </div>
            ) : (
              <div className="space-y-2">
                {parts.map((pt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={pt.description}
                        onChange={e => handleUpdatePart(idx, 'description', e.target.value)}
                        placeholder="Descrição da peça (ex: Regulador Bosch 14V)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={pt.quantity}
                        onChange={e => handleUpdatePart(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-center font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={pt.unit_price}
                        onChange={e => handleUpdatePart(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-right font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 text-right font-mono font-bold text-slate-200">
                      {formatCurrency(pt.total_price)}
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: CHECKLIST LINK & FINANCIAL TOTALS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            {/* Checklist Button */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4" /> Checklist de Entrada do Veículo
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Registre as condições do veículo no momento em que ele deu entrada na oficina (avarias pré-existentes, nível de combustível, bateria).
                </p>
              </div>
              {onOpenChecklistModal && editingWorkOrder?.id && (
                <button
                  type="button"
                  onClick={() => onOpenChecklistModal(editingWorkOrder.id)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <CheckSquare className="w-4 h-4" /> Preencher / Ver Checklist de Entrada
                </button>
              )}
            </div>

            {/* Totals Summary */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Total de Serviços:</span>
                <span className="font-mono text-slate-200">{formatCurrency(servicesTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Total de Peças:</span>
                <span className="font-mono text-slate-200">{formatCurrency(partsTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span>Desconto (R$):</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right font-mono text-cyan-400 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                <span>VALOR TOTAL DA OS:</span>
                <span className="text-emerald-400 font-mono text-lg">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Salvando...' : 'Salvar Ordem de Serviço'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
