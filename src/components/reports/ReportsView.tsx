import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  formatMXN, 
  formatDateES, 
  generateQuincenasForYear,
  MONTH_NAMES_ES 
} from '../../utils/quincena';
import { CategoryIcon } from '../common/CategoryIcon';
import { ExcelImportModal } from '../modals/ExcelImportModal';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  CreditCard,
  Building,
  Award,
  Layers,
  BarChart3
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    incomes, 
    expenses, 
    realSavings, 
    categories, 
    exportToCSV, 
    exportBackupJSON, 
    importBackupJSON, 
    resetToDemoData,
    currentQuincena 
  } = useFinance();

  // Period mode for analysis
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState<'quincena' | 'month' | 'year' | 'all'>('quincena');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1-12
  const [selectedQuincenaId, setSelectedQuincenaId] = useState<string>(currentQuincena.id);

  // Filter movements according to chosen period
  const { filteredIncomes, filteredExpenses, periodTitle } = useMemo(() => {
    let incs = incomes;
    let exps = expenses;
    let title = '';

    if (periodType === 'quincena') {
      incs = incomes.filter((i) => i.quincenaId === selectedQuincenaId);
      exps = expenses.filter((e) => e.quincenaId === selectedQuincenaId);
      const parts = selectedQuincenaId.split('-');
      title = `${parts[2] === 'Q2' ? '2ª Quincena' : '1ª Quincena'} de ${MONTH_NAMES_ES[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    } else if (periodType === 'month') {
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      incs = incomes.filter((i) => i.date.startsWith(monthPrefix));
      exps = expenses.filter((e) => e.date.startsWith(monthPrefix));
      title = `Mes Completo: ${MONTH_NAMES_ES[selectedMonth - 1]} ${selectedYear}`;
    } else if (periodType === 'year') {
      incs = incomes.filter((i) => i.year === selectedYear);
      exps = expenses.filter((e) => e.year === selectedYear);
      title = `Ejercicio Fiscal Completo: Año ${selectedYear}`;
    } else {
      title = 'Todo el Historial Registrado';
    }

    return { filteredIncomes: incs, filteredExpenses: exps, periodTitle: title };
  }, [incomes, expenses, periodType, selectedYear, selectedMonth, selectedQuincenaId]);

  // Aggregated calculations
  const totalIncome = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpense = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const isSurplus = netBalance >= 0;

  // Average quincenal spending calculation
  // Distinct quincenas with expenses
  const distinctQuincenas = useMemo(() => {
    const set = new Set(expenses.map((e) => e.quincenaId));
    return set.size;
  }, [expenses]);

  const allTimeExpensesSum = expenses.reduce((a, b) => a + b.amount, 0);
  const averageQuincenalExpense = distinctQuincenas > 0 ? allTimeExpensesSum / distinctQuincenas : 0;
  const averageMonthlyExpense = averageQuincenalExpense * 2;

  // Category breakdown
  const categoryRanking = useMemo(() => {
    const map: { [id: string]: { amount: number; count: number } } = {};
    filteredExpenses.forEach((e) => {
      if (!map[e.categoryId]) map[e.categoryId] = { amount: 0, count: 0 };
      map[e.categoryId].amount += e.amount;
      map[e.categoryId].count += 1;
    });

    return Object.entries(map)
      .map(([catId, data]) => {
        const cat = categories.find((c) => c.id === catId) || {
          id: catId,
          name: 'General',
          color: '#64748b',
          icon: 'Tag',
          active: true
        };
        const percentage = totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0;
        return {
          category: cat,
          amount: data.amount,
          percentage,
          count: data.count
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, categories, totalExpense]);

  // Payment method breakdown
  const paymentRanking = useMemo(() => {
    const map: { [pm: string]: number } = {};
    filteredExpenses.forEach((e) => {
      map[e.paymentMethod] = (map[e.paymentMethod] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpense]);

  // Establishments ranking
  const establishmentsRanking = useMemo(() => {
    const map: { [name: string]: { amount: number; count: number } } = {};
    filteredExpenses.forEach((e) => {
      const name = e.establishment.trim();
      if (!map[name]) map[name] = { amount: 0, count: 0 };
      map[name].amount += e.amount;
      map[name].count += 1;
    });
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredExpenses]);

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  // Import JSON handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importBackupJSON(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reportes Analíticos y Exportación
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analiza tus patrones de gasto por quincena, mes o año y descarga informes en Excel, CSV o PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Subir archivo de Excel (.xlsx, .xls) o CSV con gastos"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Subir Excel</span>
          </button>
          <button
            onClick={() => exportToCSV('all')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Descargar datos en formato CSV para Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Imprimir o guardar como documento PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter / Period Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Periodo a Analizar:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setPeriodType('quincena')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  periodType === 'quincena' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Por Quincena
              </button>
              <button
                onClick={() => setPeriodType('month')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  periodType === 'month' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Por Mes
              </button>
              <button
                onClick={() => setPeriodType('year')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  periodType === 'year' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Por Año
              </button>
              <button
                onClick={() => setPeriodType('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  periodType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Todo el Historial
              </button>
            </div>
          </div>

          {/* Conditional Dropdowns depending on PeriodType */}
          <div className="flex items-center gap-2">
            {periodType === 'quincena' && (
              <select
                value={selectedQuincenaId}
                onChange={(e) => setSelectedQuincenaId(e.target.value)}
                aria-label="Seleccionar quincena para reporte"
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/20"
              >
                {generateQuincenasForYear(2026).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            )}

            {periodType === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  aria-label="Seleccionar mes para reporte"
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {MONTH_NAMES_ES.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  aria-label="Seleccionar año del mes para reporte"
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            )}

            {periodType === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                aria-label="Seleccionar año fiscal para reporte"
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={2025}>Año 2025</option>
                <option value={2026}>Año 2026</option>
                <option value={2027}>Año 2027</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* PRINT REPORT WRAPPER: Formatted for clean printing to PDF or standard screen view */}
      <div className="print-container space-y-6">
        {/* Printable Letterhead (shown on print & screen) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
            <div>
              <span className="text-2xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
                Reporte Financiero Personal · Moneda: MXN
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {periodTitle}
              </h2>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-500 font-mono">
              <p>Fecha de emisión: {formatDateES(new Date().toISOString().slice(0, 10))}</p>
              <p>Generado por FinanZas Quincenal</p>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
            <div>
              <span className="text-2xs text-slate-500 uppercase font-semibold block">Total Ingresos</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-700 font-mono tabular-nums">
                +{formatMXN(totalIncome, false)}
              </span>
              <span className="text-2xs text-slate-400 block mt-0.5">{filteredIncomes.length} movimientos</span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 uppercase font-semibold block">Total Gastos</span>
              <span className="text-lg sm:text-xl font-bold text-rose-600 font-mono tabular-nums">
                -{formatMXN(totalExpense, false)}
              </span>
              <span className="text-2xs text-slate-400 block mt-0.5">{filteredExpenses.length} compras</span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 uppercase font-semibold block">Balance Neto</span>
              <span className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${isSurplus ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatMXN(netBalance, false)}
              </span>
              <span className={`text-2xs font-semibold block mt-0.5 ${isSurplus ? 'text-emerald-700' : 'text-rose-600'}`}>
                {isSurplus ? 'Superávit generado' : 'Déficit / Sobreconsumo'}
              </span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 uppercase font-semibold block">Gasto Quincenal Promedio</span>
              <span className="text-lg sm:text-xl font-bold text-slate-800 font-mono tabular-nums">
                {formatMXN(averageQuincenalExpense, false)}
              </span>
              <span className="text-2xs text-slate-400 block mt-0.5 font-mono">
                ~{formatMXN(averageMonthlyExpense, false)} mensual
              </span>
            </div>
          </div>
        </div>

        {/* Top Spending Categories Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Categorías con Mayor Gasto en el Periodo
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total periodo: {formatMXN(totalExpense)}
            </span>
          </div>

          {categoryRanking.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-500">
              No hay compras registradas en este periodo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Categoría</th>
                    <th className="py-2.5 px-4">Porcentaje</th>
                    <th className="py-2.5 px-4 text-center">No. Gastos</th>
                    <th className="py-2.5 px-4 text-right">Total Gastado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryRanking.map((item, index) => (
                    <tr key={item.category.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 w-8">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.category.color }}
                          />
                          <CategoryIcon name={item.category.icon} size={15} color={item.category.color} />
                          <span className="font-semibold text-slate-900">{item.category.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.category.color || '#10b981'
                              }}
                            />
                          </div>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {item.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatMXN(item.amount, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Two-column analysis: Payment Methods & Top Establishments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Distribución por Método de Pago
              </h3>
            </div>
            {paymentRanking.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Sin gastos registrados.</p>
            ) : (
              <div className="space-y-3">
                {paymentRanking.map((pm) => (
                  <div key={pm.method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{pm.method}</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatMXN(pm.amount)} ({pm.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Establishments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <Building className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Principales Comercios y Servicios
              </h3>
            </div>
            {establishmentsRanking.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Sin comercios registrados.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {establishmentsRanking.map((est, i) => (
                  <div key={est.name} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-slate-400 text-2xs w-4">{i + 1}.</span>
                      <span className="font-medium text-slate-800 truncate">{est.name}</span>
                      <span className="text-2xs text-slate-400">({est.count} compras)</span>
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

        {/* Detailed Transactions in Period */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Detalle Completo de Operaciones del Periodo
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {filteredExpenses.length + filteredIncomes.length} movimientos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Concepto / Establecimiento</th>
                  <th className="py-2.5 px-4">Categoría / Método</th>
                  <th className="py-2.5 px-4 text-right">Monto (MXN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Incomes */}
                {filteredIncomes.map((inc) => (
                  <tr key={inc.id} className="bg-emerald-50/30">
                    <td className="py-2.5 px-4 font-semibold text-emerald-700 whitespace-nowrap">
                      + Ingreso
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateES(inc.date, true)}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {inc.concept}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      Nómina / Abono
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      +{formatMXN(inc.amount, false)}
                    </td>
                  </tr>
                ))}

                {/* Expenses */}
                {filteredExpenses.map((exp) => {
                  const cat = categories.find((c) => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id}>
                      <td className="py-2.5 px-4 font-semibold text-rose-600 whitespace-nowrap">
                        - Gasto
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDateES(exp.date, true)}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {exp.establishment} · <span className="text-slate-500 font-normal">{exp.description}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {cat?.name || 'General'} · {exp.paymentMethod}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        -{formatMXN(exp.amount, false)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Backup and Data Management Card (no-print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs no-print space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Respaldo y Seguridad de Datos Locales
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tus datos se guardan de forma persistente en tu navegador. Puedes generar una copia de seguridad o restaurarla en cualquier momento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Subir Excel (.xlsx / .csv)</span>
          </button>

          <button
            onClick={exportBackupJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Descargar Copia JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restaurar Copia JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={resetToDemoData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar a Datos Demo</span>
          </button>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
};
