import React from 'react';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, X } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: 'expense' | 'income' | 'saving') => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
      <div 
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">¿Qué deseas registrar?</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <button
            onClick={() => onSelectOption('expense')}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Registrar Gasto Diario</p>
              <p className="text-xs text-slate-500">Compra, servicio, ticket o comprobante</p>
            </div>
          </button>

          <button
            onClick={() => onSelectOption('income')}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Registrar Ingreso</p>
              <p className="text-xs text-slate-500">Nómina quincenal, bono o freelance</p>
            </div>
          </button>

          <button
            onClick={() => onSelectOption('saving')}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-105 transition-transform">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Apartar Ahorro Real</p>
              <p className="text-xs text-slate-500">Transferencia a Cetes, fondo o cuenta</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
