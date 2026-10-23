import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { generateQuincenasForYear, formatDateES } from '../../utils/quincena';

export const PeriodSelector: React.FC = () => {
  const { 
    currentQuincena, 
    setCurrentQuincenaById, 
    goToPreviousQuincena, 
    goToNextQuincena,
    goToCurrentDateQuincena 
  } = useFinance();

  const availableYears = [2025, 2026, 2027];
  const quincenasOfYear = generateQuincenasForYear(currentQuincena.year);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs mb-6 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation buttons and Quincena title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={goToPreviousQuincena}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              title="Quincena anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextQuincena}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
              title="Siguiente quincena"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {currentQuincena.label}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Periodo: {formatDateES(currentQuincena.startDate, true)} — {formatDateES(currentQuincena.endDate, true)}
            </p>
          </div>
        </div>

        {/* Quick jumps and Quincena selector dropdown */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={goToCurrentDateQuincena}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="Ir a la quincena de hoy"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Quincena Actual</span>
          </button>

          <div className="relative">
            <select
              value={currentQuincena.id}
              onChange={(e) => setCurrentQuincenaById(e.target.value)}
              aria-label="Seleccionar periodo quincenal"
              className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              {availableYears.map((year) => (
                <optgroup key={year} label={`Año ${year}`}>
                  {generateQuincenasForYear(year).map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.shortLabel} ({q.quincenaNumber === 1 ? '1 al 15' : '16 al fin'})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
