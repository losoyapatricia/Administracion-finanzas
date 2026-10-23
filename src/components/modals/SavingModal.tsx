import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { RealSaving } from '../../types/finance';
import { getCurrentDateString, getQuincenaFromDate } from '../../utils/quincena';
import { X, PiggyBank, Landmark } from 'lucide-react';

interface SavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  savingToEdit?: RealSaving | null;
}

const COMMON_DESTINATIONS = [
  'Cetesdirecto (Bonddia / Cetes)',
  'Cajita Nu / Sofipo con rendimiento',
  'Cuenta de Ahorro BBVA / Banorte',
  'Fondo de Emergencia en Efectivo',
  'Afore Aportación Voluntaria',
  'Fondo de Inversión',
  'Otro destino de ahorro'
];

export const SavingModal: React.FC<SavingModalProps> = ({
  isOpen,
  onClose,
  savingToEdit
}) => {
  const { addRealSaving, updateRealSaving } = useFinance();

  const [date, setDate] = useState(getCurrentDateString());
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState(COMMON_DESTINATIONS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (savingToEdit) {
      setDate(savingToEdit.date);
      setConcept(savingToEdit.concept);
      setAmount(savingToEdit.amount.toString());
      setDestination(savingToEdit.destination);
      setNotes(savingToEdit.notes || '');
    } else {
      setDate(getCurrentDateString());
      setConcept('');
      setAmount('');
      setDestination(COMMON_DESTINATIONS[0]);
      setNotes('');
    }
    setError('');
  }, [savingToEdit, isOpen]);

  if (!isOpen) return null;

  const targetQuincena = getQuincenaFromDate(date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!concept.trim()) {
      setError('Por favor indica el concepto o meta de este ahorro.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto ahorrado debe ser mayor a cero.');
      return;
    }

    if (savingToEdit) {
      updateRealSaving(savingToEdit.id, {
        date,
        concept: concept.trim(),
        amount: parsedAmount,
        destination,
        notes: notes.trim()
      });
    } else {
      addRealSaving({
        date,
        concept: concept.trim(),
        amount: parsedAmount,
        destination,
        notes: notes.trim()
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {savingToEdit ? 'Editar Ahorro Real' : 'Registrar Apartado / Ahorro Real'}
              </h3>
              <p className="text-xs text-slate-500">
                Quincena: <span className="font-semibold text-slate-700">{targetQuincena.shortLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Concepto del Ahorro *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Apartado quincenal a Cetes, Ahorro para seguro, Fondo personal"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto Aportado (MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Depósito *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cuenta o Destino del Ahorro *
            </label>
            <div className="relative">
              <input
                type="text"
                list="destinations-list"
                required
                placeholder="Selecciona o escribe el destino"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <datalist id="destinations-list">
                {COMMON_DESTINATIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas adicionales (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Tasa de interés pactada, folio de traspaso, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {savingToEdit ? 'Guardar Cambios' : 'Registrar Ahorro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
