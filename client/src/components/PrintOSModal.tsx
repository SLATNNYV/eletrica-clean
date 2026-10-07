import React from 'react';
import { X, Printer } from 'lucide-react';
import type { WorkOrder } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface PrintOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
}

export const PrintOSModal: React.FC<PrintOSModalProps> = ({
  isOpen,
  onClose,
  workOrder
}) => {
  if (!isOpen || !workOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print-backdrop">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Visualização de Impressão</h2>
              <p className="text-xs text-slate-400">Documento da {workOrder.os_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 print-area text-xs leading-normal">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                ELÉTRICA CLEAN
              </h1>
              <p className="text-xs text-slate-600 font-semibold">Soluções em Elétrica & Diagnóstico Automotivo</p>
              <p className="text-xs text-slate-500 mt-1">Serviço Especializado • Manutenção • Instalações</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-slate-900 bg-slate-100 px-3 py-1 border border-slate-300 rounded inline-block">
                {workOrder.os_number}
              </div>
              <p className="text-xs text-slate-600 mt-1">Data Entrada: <strong>{formatDateTime(workOrder.entry_date)}</strong></p>
              <p className="text-xs text-slate-600">Status: <strong className="uppercase">{workOrder.status}</strong></p>
            </div>
          </div>

          {/* Client & Vehicle Info Tables */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-slate-300 rounded p-3 bg-slate-50">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-300 pb-1 mb-2">
                DADOS DO CLIENTE
              </h3>
              <p><strong>Nome:</strong> {workOrder.client_name || '-'}</p>
              <p><strong>Telefone:</strong> {workOrder.client_phone || '-'}</p>
              {workOrder.client_cpf && <p><strong>CPF:</strong> {workOrder.client_cpf}</p>}
              {workOrder.client_address && <p><strong>Endereço:</strong> {workOrder.client_address}</p>}
            </div>

            <div className="border border-slate-300 rounded p-3 bg-slate-50">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-300 pb-1 mb-2">
                DADOS DO VEÍCULO
              </h3>
              <p><strong>Marca / Modelo:</strong> {workOrder.vehicle_brand} {workOrder.vehicle_model}</p>
              <p><strong>Ano / Cor:</strong> {workOrder.vehicle_year} - {workOrder.vehicle_color}</p>
              <p><strong>Placa:</strong> <span className="font-mono font-bold uppercase">{workOrder.vehicle_plate}</span></p>
              <p><strong>Quilometragem:</strong> {workOrder.mileage ? `${workOrder.mileage.toLocaleString('pt-BR')} km` : '-'}</p>
            </div>
          </div>

          {/* Reported Problem */}
          <div className="border border-slate-300 rounded p-3 mb-4 bg-slate-50">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-300 pb-1 mb-1">
              PROBLEMA RELATADO / SOLICITAÇÃO
            </h3>
            <p className="text-slate-800 whitespace-pre-wrap">{workOrder.reported_problem}</p>
          </div>

          {/* Services Table */}
          {workOrder.services && workOrder.services.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                SERVIÇOS REALIZADOS
              </h3>
              <table className="print-table w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-2 border-r border-slate-300">Serviço</th>
                    <th className="p-2 border-r border-slate-300 text-center w-16">Qtd</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">Valor Unit.</th>
                    <th className="p-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.services.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold">{s.name}</td>
                      <td className="p-2 border-r border-slate-300 text-center">{s.quantity}</td>
                      <td className="p-2 border-r border-slate-300 text-right">{formatCurrency(s.unit_price)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(s.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Parts Table */}
          {workOrder.parts && workOrder.parts.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                PEÇAS / MATERIAIS
              </h3>
              <table className="print-table w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-2 border-r border-slate-300">Descrição da Peça</th>
                    <th className="p-2 border-r border-slate-300 text-center w-16">Qtd</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">Valor Unit.</th>
                    <th className="p-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.parts.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold">{p.description}</td>
                      <td className="p-2 border-r border-slate-300 text-center">{p.quantity}</td>
                      <td className="p-2 border-r border-slate-300 text-right">{formatCurrency(p.unit_price)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(p.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Observações */}
          {workOrder.notes && (
            <div className="border border-slate-300 rounded p-2 mb-4 bg-slate-50 text-xs">
              <strong className="block text-slate-700">OBSERVAÇÕES:</strong>
              <p className="text-slate-800">{workOrder.notes}</p>
            </div>
          )}

          {/* Financial Totals */}
          <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-end mb-8">
            <div>
              <p><strong>Forma de Pagamento:</strong> <span className="uppercase">{workOrder.payment_method}</span></p>
            </div>
            <div className="text-right space-y-1">
              <p>Total Serviços: {formatCurrency(workOrder.services_total)}</p>
              <p>Total Peças: {formatCurrency(workOrder.parts_total)}</p>
              {workOrder.discount > 0 && <p className="text-rose-600">Desconto: -{formatCurrency(workOrder.discount)}</p>}
              <p className="text-base font-black text-slate-900 pt-1 border-t border-slate-300">
                VALOR TOTAL: {formatCurrency(workOrder.final_total)}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-400">
            <div className="text-center">
              <div className="border-b border-slate-900 mb-1"></div>
              <p className="font-bold text-slate-800">Elétrica Clean</p>
              <p className="text-[10px] text-slate-500">Responsável Técnico</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-900 mb-1"></div>
              <p className="font-bold text-slate-800">{workOrder.client_name || 'Cliente'}</p>
              <p className="text-[10px] text-slate-500">Assinatura do Cliente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
