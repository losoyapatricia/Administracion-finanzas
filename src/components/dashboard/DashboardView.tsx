import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PeriodSelector } from '../navigation/PeriodSelector';
import { CategoryDonutChart, QuincenalComparisonBarChart } from './FinancialCharts';
import { formatMXN, formatDateES, generateQuincenasForYear } from '../../utils/quincena';
import { CategoryIcon } from '../common/CategoryIcon';
import { ReceiptViewerModal } from '../common/ReceiptViewerModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { ExpenseModal } from '../modals/ExpenseModal';
import { IncomeModal } from '../modals/IncomeModal';
import { SavingModal } from '../modals/SavingModal';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Receipt, 
  Trash2, 
  Edit3, 
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Expense, Income } from '../../types/finance';

export const DashboardView: React.FC = () => {
  const { 
    currentQuincena, 
    setCurrentQuincenaById,
    currentSummary, 
    getQuincenaSummary,
    getAnnualSummary,
    expenses, 
    incomes,
    realSavings,
    getCategoryById,
    deleteExpense,
    deleteIncome,
    setActiveTab
  } = useFinance();

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);

  // Receipt preview modal
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);

  // Delete confirm modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'expense' | 'income'; title: string } | null>(null);

  // Current quincena movements
  const quincenaExpenses = expenses.filter((e) => e.quincenaId === currentQuincena.id);
  const quincenaIncomes = incomes.filter((i) => i.quincenaId === currentQuincena.id);
  const quincenaSavings = realSavings.filter((s) => s.quincenaId === currentQuincena.id);

  // Annual summary
  const annualSummary = getAnnualSummary(currentQuincena.year);
  const allYearQuincenas = generateQuincenasForYear(currentQuincena.year);

  // Net balance status
  const isSurplus = currentSummary.netBalance >= 0;

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'expense') {
      deleteExpense(itemToDelete.id);
    } else {
      deleteIncome(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Quincena Period Selector */}
      <PeriodSelector />

      {/* Main KPI Cards: Quincenal Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incomes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos Quincena</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatMXN(currentSummary.totalIncome, false)}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{quincenaIncomes.length} movimientos</span>
              <span className="text-emerald-600 font-medium">MXN</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos Quincena</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatMXN(currentSummary.totalExpense, false)}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{quincenaExpenses.length} compras</span>
              <span className="text-rose-600 font-medium">MXN</span>
            </div>
          </div>
        </div>

        {/* Net Balance (Ahorro potencial) */}
        <div className={`border rounded-xl p-5 shadow-2xs transition-colors ${
          isSurplus 
            ? 'bg-white border-slate-200 hover:border-emerald-200' 
            : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance Quincenal</span>
            <div className={`p-2 rounded-lg ${isSurplus ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-700'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-bold font-mono tabular-nums ${isSurplus ? 'text-slate-900' : 'text-rose-700'}`}>
              {formatMXN(currentSummary.netBalance, false)}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={`font-semibold ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isSurplus ? 'Superávit / Ahorro' : 'Gasto en exceso (Déficit)'}
              </span>
              <span className="text-slate-500 font-mono">
                {currentSummary.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Real Savings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ahorro Real Apartado</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatMXN(currentSummary.totalRealSavings, false)}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{quincenaSavings.length} aportaciones</span>
              <span className="text-indigo-600 font-medium">Inversión / Banco</span>
            </div>
          </div>
        </div>
      </div>

      {/* Annual Summary Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Acumulado Anual</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">Año {currentQuincena.year}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Control de Finanzas Anual
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Suma acumulada de todas las quincenas del ejercicio fiscal actual en Pesos Mexicanos.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div>
              <span className="text-2xs text-slate-400 block uppercase">Ingresos del Año</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono tabular-nums">
                {formatMXN(annualSummary.totalIncome, false)}
              </span>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block uppercase">Gastos del Año</span>
              <span className="text-sm sm:text-base font-bold text-rose-400 font-mono tabular-nums">
                {formatMXN(annualSummary.totalExpense, false)}
              </span>
            </div>
            <div>
              <span className="text-2xs text-slate-400 block uppercase">Balance Neto Anual</span>
              <span className={`text-sm sm:text-base font-bold font-mono tabular-nums ${annualSummary.netBalance >= 0 ? 'text-white' : 'text-rose-300'}`}>
                {formatMXN(annualSummary.netBalance, false)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Expenses Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Gastos por Categoría
              </h3>
              <p className="text-xs text-slate-500">Distribución de consumo en {currentQuincena.shortLabel}</p>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Gestionar
            </button>
          </div>
          <CategoryDonutChart summary={currentSummary} />
        </div>

        {/* Quincenas Comparison Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Ingresos vs Gastos Quincenales {currentQuincena.year}
              </h3>
              <p className="text-xs text-slate-500">Haz clic en cualquier quincena para ver su detalle</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Ver Reportes
            </button>
          </div>
          <QuincenalComparisonBarChart
            year={currentQuincena.year}
            currentQuincenaId={currentQuincena.id}
            onSelectQuincena={setCurrentQuincenaById}
            getQuincenaSummary={getQuincenaSummary}
            quincenas={allYearQuincenas}
          />
        </div>
      </div>

      {/* Quick Action Floating Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones Rápidas:</span>
          <span className="text-xs text-slate-500 hidden sm:inline">Registra tus operaciones de la quincena</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Gasto</span>
          </button>
          <button
            onClick={() => {
              setIncomeToEdit(null);
              setIsIncomeModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Ingreso</span>
          </button>
          <button
            onClick={() => setIsSavingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apartar Ahorro</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Expenses Table & Incomes in Quincena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expenses List for current quincena */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Gastos Realizados en {currentQuincena.shortLabel}
              </h3>
              <p className="text-xs text-slate-500">
                {quincenaExpenses.length} compras registradas · Total: {formatMXN(currentSummary.totalExpense)}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos los gastos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {quincenaExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No hay gastos registrados en esta quincena.</p>
              <p className="text-xs text-slate-400 mt-1">Haz clic en "Registrar Gasto" para agregar tu primer ticket.</p>
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                Registrar Primer Gasto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Fecha</th>
                    <th className="py-2.5 px-4">Establecimiento & Descripción</th>
                    <th className="py-2.5 px-4">Categoría</th>
                    <th className="py-2.5 px-4">Método</th>
                    <th className="py-2.5 px-4 text-right">Monto</th>
                    <th className="py-2.5 px-4 text-center">Ticket</th>
                    <th className="py-2.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {quincenaExpenses.map((exp) => {
                    const cat = getCategoryById(exp.categoryId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {formatDateES(exp.date, true)}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{exp.establishment}</p>
                          <p className="text-2xs text-slate-500 truncate">{exp.description}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.color || '#64748b' }}
                            />
                            <span className="text-slate-700 font-medium">{cat?.name || 'General'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-2xs">
                          {exp.paymentMethod}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatMXN(exp.amount, false)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {exp.receiptImage ? (
                            <button
                              onClick={() => setViewingReceipt(exp)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Ver comprobante de compra"
                            >
                              <Receipt className="w-4 h-4 inline" />
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-400 font-mono">
                              {exp.ticketNumber ? `#${exp.ticketNumber}` : '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setExpenseToEdit(exp);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                              title="Editar gasto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({
                                  id: exp.id,
                                  type: 'expense',
                                  title: `Gasto en ${exp.establishment} (${formatMXN(exp.amount)})`
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Eliminar gasto"
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

        {/* Incomes & Real Savings Summary Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Incomes in quincena */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Ingresos Quincenales</h3>
              <button
                onClick={() => {
                  setIncomeToEdit(null);
                  setIsIncomeModalOpen(true);
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {quincenaIncomes.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No hay ingresos registrados en esta quincena.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {quincenaIncomes.map((inc) => (
                  <div key={inc.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{inc.concept}</p>
                      <p className="text-2xs text-slate-500 font-mono">{formatDateES(inc.date, true)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-emerald-700 tabular-nums">
                        +{formatMXN(inc.amount, false)}
                      </span>
                      <button
                        onClick={() => {
                          setIncomeToEdit(inc);
                          setIsIncomeModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title="Editar ingreso"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({
                            id: inc.id,
                            type: 'income',
                            title: `Ingreso: ${inc.concept} (${formatMXN(inc.amount)})`
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Eliminar ingreso"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Establishments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Top Comercios de la Quincena</h3>
            {currentSummary.topEstablishments.length === 0 ? (
              <p className="text-xs text-slate-500">Sin datos registrados.</p>
            ) : (
              <div className="space-y-2">
                {currentSummary.topEstablishments.slice(0, 5).map((est, index) => (
                  <div key={est.name} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 text-2xs font-mono text-slate-400">{index + 1}.</span>
                      <span className="font-medium text-slate-800 truncate">{est.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatMXN(est.amount, false)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setIncomeToEdit(null);
        }}
        incomeToEdit={incomeToEdit}
      />

      <SavingModal
        isOpen={isSavingModalOpen}
        onClose={() => setIsSavingModalOpen(false)}
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
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar este registro? "${itemToDelete?.title}". Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
