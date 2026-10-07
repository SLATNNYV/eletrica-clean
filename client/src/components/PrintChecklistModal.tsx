import React from 'react';
import { X, Printer } from 'lucide-react';
import type { WorkOrder, ChecklistItem } from '../types';
import { formatDateTime } from '../utils/formatters';

interface PrintChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  checklistItems: ChecklistItem[];
  generalNotes?: string;
}

export const PrintChecklistModal: React.FC<PrintChecklistModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  checklistItems,
  generalNotes
}) => {
  if (!isOpen || !workOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const exteriorItems = checklistItems.filter(i => i.category === 'exterior');
  const interiorItems = checklistItems.filter(i => i.category === 'interior');
  const mecanicaItems = checklistItems.filter(i => i.category === 'mecanica');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print-backdrop">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Impressão de Checklist</h2>
              <p className="text-xs text-slate-400">Inspeção da {workOrder.os_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Imprimir / PDF</span>
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
          <div className="border-b-2 border-slate-900 pb-3 mb-3 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                ELÉTRICA CLEAN
              </h1>
              <p className="text-xs font-bold text-slate-700">TERMO DE CHECKLIST E VISTORIA DE ENTRADA</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300 rounded inline-block">
                {workOrder.os_number}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">Data: {formatDateTime(workOrder.entry_date)}</p>
            </div>
          </div>

          {/* Client & Vehicle */}
          <div className="border border-slate-300 rounded p-2.5 mb-3 bg-slate-50 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p><strong>Cliente:</strong> {workOrder.client_name}</p>
              <p><strong>Telefone:</strong> {workOrder.client_phone}</p>
            </div>
            <div>
              <p><strong>Veículo:</strong> {workOrder.vehicle_brand} {workOrder.vehicle_model} ({workOrder.vehicle_year})</p>
              <p><strong>Placa:</strong> <span className="font-mono font-bold">{workOrder.vehicle_plate}</span> | <strong>KM:</strong> {workOrder.mileage}</p>
            </div>
          </div>

          {/* Render Checklist Table */}
          <div className="space-y-3 mb-4">
            {/* Exterior Table */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 p-1 border border-slate-300">
                1. INSPEÇÃO EXTERIOR
              </h3>
              <table className="print-table w-full text-left border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300">
                    <th className="p-1 border-r border-slate-300">Item</th>
                    <th className="p-1 border-r border-slate-300 w-24 text-center">Status</th>
                    <th className="p-1">Observações da Avaria</th>
                  </tr>
                </thead>
                <tbody>
                  {exteriorItems.map(i => (
                    <tr key={i.item_key} className="border-b border-slate-200">
                      <td className="p-1 border-r border-slate-300 font-semibold">{i.label}</td>
                      <td className={`p-1 border-r border-slate-300 text-center font-bold ${i.status === 'Com avaria' ? 'text-red-600' : ''}`}>
                        {i.status}
                      </td>
                      <td className="p-1">{i.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interior Table */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 p-1 border border-slate-300">
                2. INSPEÇÃO INTERIOR
              </h3>
              <table className="print-table w-full text-left border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300">
                    <th className="p-1 border-r border-slate-300">Item</th>
                    <th className="p-1 border-r border-slate-300 w-24 text-center">Status</th>
                    <th className="p-1">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {interiorItems.map(i => (
                    <tr key={i.item_key} className="border-b border-slate-200">
                      <td className="p-1 border-r border-slate-300 font-semibold">{i.label}</td>
                      <td className={`p-1 border-r border-slate-300 text-center font-bold ${i.status === 'Com avaria' ? 'text-red-600' : ''}`}>
                        {i.status}
                      </td>
                      <td className="p-1">{i.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mecânica Table */}
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 p-1 border border-slate-300">
                3. MECÂNICA / ELÉTRICA
              </h3>
              <table className="print-table w-full text-left border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300">
                    <th className="p-1 border-r border-slate-300">Item</th>
                    <th className="p-1 border-r border-slate-300 w-24 text-center">Status</th>
                    <th className="p-1">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {mecanicaItems.map(i => (
                    <tr key={i.item_key} className="border-b border-slate-200">
                      <td className="p-1 border-r border-slate-300 font-semibold">{i.label}</td>
                      <td className={`p-1 border-r border-slate-300 text-center font-bold ${i.status === 'Com avaria' ? 'text-red-600' : ''}`}>
                        {i.status}
                      </td>
                      <td className="p-1">{i.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {generalNotes && (
            <div className="border border-slate-300 rounded p-2 mb-4 bg-slate-50 text-xs">
              <strong className="block text-slate-700">OBSERVAÇÕES GERAIS DE ENTRADA:</strong>
              <p className="text-slate-800">{generalNotes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed border-slate-400">
            <div className="text-center">
              <div className="border-b border-slate-900 mb-1"></div>
              <p className="font-bold text-slate-800">Elétrica Clean (Vistoriador)</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-900 mb-1"></div>
              <p className="font-bold text-slate-800">{workOrder.client_name || 'Cliente'}</p>
              <p className="text-[10px] text-slate-500">Declaro estar ciente das avarias apontadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
