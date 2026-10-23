import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Expense, PaymentMethod } from '../../types/finance';
import { compressReceiptImage, getCurrentDateString, getQuincenaFromDate } from '../../utils/quincena';
import { CategoryIcon } from '../common/CategoryIcon';
import { X, Camera, ArrowDownLeft, Image, Trash2, Eye } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Tarjeta de Débito',
  'Tarjeta de Crédito',
  'Efectivo',
  'Transferencia SPEI',
  'Vales de Despensa',
  'Otro'
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit
}) => {
  const { addExpense, updateExpense, categories } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(getCurrentDateString());
  const [establishment, setEstablishment] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tarjeta de Débito');
  const [ticketNumber, setTicketNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');

  // Active categories for selection
  const activeCategories = categories.filter((c) => c.active);

  useEffect(() => {
    if (expenseToEdit) {
      setDate(expenseToEdit.date);
      setEstablishment(expenseToEdit.establishment);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount.toString());
      setCategoryId(expenseToEdit.categoryId);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setTicketNumber(expenseToEdit.ticketNumber || '');
      setReceiptImage(expenseToEdit.receiptImage);
      setReceiptName(expenseToEdit.receiptName);
    } else {
      setDate(getCurrentDateString());
      setEstablishment('');
      setDescription('');
      setAmount('');
      setCategoryId(activeCategories[0]?.id || 'cat-alimentacion');
      setPaymentMethod('Tarjeta de Débito');
      setTicketNumber('');
      setReceiptImage(undefined);
      setReceiptName(undefined);
    }
    setError('');
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const targetQuincena = getQuincenaFromDate(date);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setError('');
      const compressed = await compressReceiptImage(file, 1200, 0.75);
      setReceiptImage(compressed);
      setReceiptName(file.name);
    } catch (err) {
      console.error(err);
      setError('No se pudo procesar la imagen del comprobante. Intenta con otra foto.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setReceiptImage(undefined);
    setReceiptName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!establishment.trim()) {
      setError('Indica el establecimiento o comercio donde realizaste el gasto.');
      return;
    }

    if (!description.trim()) {
      setError('Agrega una breve descripción de la compra.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser un valor numérico positivo mayor a 0.');
      return;
    }

    if (!categoryId) {
      setError('Selecciona una categoría para clasificar el gasto.');
      return;
    }

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        date,
        establishment: establishment.trim(),
        description: description.trim(),
        amount: parsedAmount,
        categoryId,
        paymentMethod,
        ticketNumber: ticketNumber.trim() || undefined,
        receiptImage,
        receiptName
      });
    } else {
      addExpense({
        date,
        establishment: establishment.trim(),
        description: description.trim(),
        amount: parsedAmount,
        categoryId,
        paymentMethod,
        ticketNumber: ticketNumber.trim() || undefined,
        receiptImage,
        receiptName
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto no-print">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {expenseToEdit ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Establecimiento / Comercio *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Walmart, CFE, Gasolinera Pemex, Farmacia"
                value={establishment}
                onChange={(e) => setEstablishment(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto en Pesos Mexicanos (MXN) *
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
                  className="w-full pl-8 pr-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción de la Compra *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Despensa semanal, Combustible coche, Medicinas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Método de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Gasto *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Ticket / Folio (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. TKT-983120, CFE-82910"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Comprobante / Ticket Photo Attachment */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fotografía del Comprobante / Ticket
            </label>

            {receiptImage ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={receiptImage}
                  alt="Comprobante"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {receiptName || 'Ticket comprobante adjunto'}
                  </p>
                  <p className="text-2xs text-slate-500 mt-0.5">Comprobante optimizado y listo</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                  id="receipt-file-upload"
                />
                <label
                  htmlFor="receipt-file-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/30 transition-all cursor-pointer text-xs font-medium"
                >
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>{isCompressing ? 'Procesando comprobante...' : 'Tomar foto o subir comprobante de compra'}</span>
                </label>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {expenseToEdit ? 'Guardar Cambios' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
