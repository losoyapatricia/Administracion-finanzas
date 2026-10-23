import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Expense } from '../../types/finance';
import { formatMXN, formatDateES, generateQuincenasForYear } from '../../utils/quincena';
import { CategoryIcon } from '../common/CategoryIcon';
import { ExpenseModal } from '../modals/ExpenseModal';
import { ExcelImportModal } from '../modals/ExcelImportModal';
import { ReceiptViewerModal } from '../common/ReceiptViewerModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Receipt, 
  Edit3, 
  Trash2, 
  Filter, 
  FileSpreadsheet, 
  Calendar,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, categories, deleteExpense, getCategoryById, exportToCSV, currentQuincena } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Expense | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuincena, setSelectedQuincena] = useState<string>('all');
  const [hasReceiptOnly, setHasReceiptOnly] = useState(false);

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchEst = exp.establishment.toLowerCase().includes(query);
        const matchDesc = exp.description.toLowerCase().includes(query);
        const matchTicket = (exp.ticketNumber || '').toLowerCase().includes(query);
        if (!matchEst && !matchDesc && !matchTicket) return false;
      }
      if (selectedCategory !== 'all' && exp.categoryId !== selectedCategory) return false;
      if (selectedPaymentMethod !== 'all' && exp.paymentMethod !== selectedPaymentMethod) return false;
      if (selectedYear !== 'all' && exp.year !== selectedYear) return false;
      if (selectedQuincena !== 'all' && exp.quincenaId !== selectedQuincena) return false;
      if (hasReceiptOnly && !exp.receiptImage) return false;
      return true;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, selectedYear, selectedQuincena, hasReceiptOnly]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const countFiltered = filteredExpenses.length;
  const averageTicket = countFiltered > 0 ? totalFiltered / countFiltered : 0;

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteExpense(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const quincenasList = generateQuincenasForYear(2026);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Registro y Control de Gastos Diarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Captura cada compra con establecimiento, método de pago, folio y foto de comprobante.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Subir archivo de Excel (.xlsx, .xls) o CSV con gastos registrados"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Subir Excel</span>
          </button>
          <button
            onClick={() => exportToCSV('expenses')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Gastos CSV</span>
          </button>
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Gastos Filtrados</span>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {formatMXN(totalFiltered, false)}
          </p>
          <span className="text-2xs text-slate-500 font-mono">MXN gastados</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Número de Compras</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {countFiltered}
          </p>
          <span className="text-2xs text-slate-500">tickets y recibos</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Ticket Promedio</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatMXN(averageTicket, false)}
          </p>
          <span className="text-2xs text-slate-500 font-mono">MXN por compra</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por comercio (Walmart, CFE...), descripción o folio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              aria-label="Filtrar por método de pago"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Todos los métodos</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia SPEI">Transferencia SPEI</option>
              <option value="Vales de Despensa">Vales de Despensa</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              aria-label="Filtrar por año"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Todos los años</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        {/* Extra toggles: Photo only & Clear */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={hasReceiptOnly}
              onChange={(e) => setHasReceiptOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Mostrar sólo gastos con foto de comprobante adjunta</span>
          </label>

          {(searchQuery || selectedCategory !== 'all' || selectedPaymentMethod !== 'all' || selectedYear !== 'all' || hasReceiptOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPaymentMethod('all');
                setSelectedYear('all');
                setHasReceiptOnly(false);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Lista de Gastos ({filteredExpenses.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Subtotal: {formatMXN(totalFiltered)}
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-800">No se encontraron gastos con los criterios seleccionados.</p>
            <p className="text-xs text-slate-500 mt-1">Registra nuevos gastos o ajusta tus filtros.</p>
            <button
              onClick={() => {
                setExpenseToEdit(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
            >
              Registrar Gasto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Comercio / Establecimiento</th>
                  <th className="py-2.5 px-4">Descripción</th>
                  <th className="py-2.5 px-4">Categoría</th>
                  <th className="py-2.5 px-4">Método de Pago</th>
                  <th className="py-2.5 px-4">Quincena</th>
                  <th className="py-2.5 px-4 text-center">Ticket</th>
                  <th className="py-2.5 px-4 text-right">Monto</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const cat = getCategoryById(exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDateES(exp.date, true)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {exp.establishment}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          />
                          <span className="font-medium text-slate-800">{cat?.name || 'General'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-2xs">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-2xs">
                        {exp.quincenaId}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {exp.receiptImage ? (
                          <button
                            onClick={() => setViewingReceipt(exp)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-2xs font-medium transition-colors cursor-pointer"
                            title="Ver fotografía de ticket"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Ver foto</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-2xs">
                            {exp.ticketNumber ? `#${exp.ticketNumber}` : '—'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatMXN(exp.amount, false)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setExpenseToEdit(exp);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                            title="Editar compra"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(exp)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar compra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />

      <ReceiptViewerModal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        imageUrl={viewingReceipt?.receiptImage}
        establishment={viewingReceipt?.establishment || ''}
        amount={viewingReceipt?.amount || 0}
        date={viewingReceipt?.date || ''}
        ticketNumber={viewingReceipt?.ticketNumber}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Confirmar eliminación de gasto"
        message={`¿Estás seguro de eliminar el gasto en "${itemToDelete?.establishment}" por un monto de ${formatMXN(itemToDelete?.amount || 0)}?`}
        confirmText="Sí, eliminar gasto"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
