import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Income } from '../../types/finance';
import { formatMXN, formatDateES, generateQuincenasForYear } from '../../utils/quincena';
import { IncomeModal } from '../modals/IncomeModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar,
  Wallet,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const IncomesView: React.FC = () => {
  const { incomes, deleteIncome, exportToCSV } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Income | null>(null);

  // Local filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuincena, setSelectedQuincena] = useState<string>('all');

  // Filtered incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchConcept = item.concept.toLowerCase().includes(query);
        const matchNotes = (item.notes || '').toLowerCase().includes(query);
        if (!matchConcept && !matchNotes) return false;
      }
      if (selectedYear !== 'all' && item.year !== selectedYear) return false;
      if (selectedQuincena !== 'all' && item.quincenaId !== selectedQuincena) return false;
      return true;
    });
  }, [incomes, searchQuery, selectedYear, selectedQuincena]);

  // Group by Quincena
  const groupedIncomes = useMemo(() => {
    const groups: { [qId: string]: Income[] } = {};
    filteredIncomes.forEach((inc) => {
      if (!groups[inc.quincenaId]) {
        groups[inc.quincenaId] = [];
      }
      groups[inc.quincenaId].push(inc);
    });

    // Sort descending by date/id
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredIncomes]);

  const totalIncomesFiltered = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalCount = filteredIncomes.length;
  const averageIncome = totalCount > 0 ? totalIncomesFiltered / totalCount : 0;

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteIncome(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Registro de Ingresos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Captura tus ingresos de nómina, bonos y proyectos con agrupación quincenal automática.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCSV('incomes')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => {
              setIncomeToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ingreso</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Ingresos Filtrados</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {formatMXN(totalIncomesFiltered, false)}
          </p>
          <span className="text-2xs text-slate-500 font-mono">MXN</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Movimientos Registrados</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalCount}
          </p>
          <span className="text-2xs text-slate-500">depósitos / transferencias</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Promedio por Registro</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatMXN(averageIncome, false)}
          </p>
          <span className="text-2xs text-slate-500 font-mono">MXN promedio</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por concepto o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Year Filter */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Año:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Todos los años</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedYear !== 'all' || selectedQuincena !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedYear('all');
              setSelectedQuincena('all');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium whitespace-nowrap px-2 py-1"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Incomes Grouped by Quincena */}
      {groupedIncomes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <p className="text-sm font-semibold text-slate-800">No se encontraron ingresos con los filtros seleccionados.</p>
          <p className="text-xs text-slate-500 mt-1">Registra nuevos ingresos para visualizarlos aquí.</p>
          <button
            onClick={() => {
              setIncomeToEdit(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            Registrar Ingreso
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedIncomes.map(([qId, items]) => {
            const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
            const parts = qId.split('-');
            const qNum = parts[2] === 'Q2' ? '2ª Quincena' : '1ª Quincena';
            const year = parts[0];

            return (
              <div key={qId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                {/* Quincena Group Header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900">
                      {qNum} ({qId})
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      · {items.length} registro{items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Subtotal Quincena:</span>
                    <span className="text-sm font-bold font-mono text-emerald-700 tabular-nums">
                      {formatMXN(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-5">Fecha</th>
                        <th className="py-2.5 px-5">Concepto</th>
                        <th className="py-2.5 px-5">Notas / Referencia</th>
                        <th className="py-2.5 px-5 text-right">Monto</th>
                        <th className="py-2.5 px-5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((inc) => (
                        <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-5 font-mono text-slate-600 whitespace-nowrap">
                            {formatDateES(inc.date, true)}
                          </td>
                          <td className="py-3 px-5 font-semibold text-slate-900">
                            {inc.concept}
                          </td>
                          <td className="py-3 px-5 text-slate-500 max-w-xs truncate">
                            {inc.notes || '—'}
                          </td>
                          <td className="py-3 px-5 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                            +{formatMXN(inc.amount, false)}
                          </td>
                          <td className="py-3 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setIncomeToEdit(inc);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                                title="Editar ingreso"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setItemToDelete(inc)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Eliminar ingreso"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIncomeToEdit(null);
        }}
        incomeToEdit={incomeToEdit}
      />

      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Confirmar eliminación de ingreso"
        message={`¿Estás seguro de que deseas eliminar "${itemToDelete?.concept}" por monto de ${formatMXN(itemToDelete?.amount || 0)}?`}
        confirmText="Sí, eliminar ingreso"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
