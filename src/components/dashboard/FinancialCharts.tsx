import React, { useState } from 'react';
import { Category, FinancialSummary, QuincenaInfo } from '../../types/finance';
import { formatMXN } from '../../utils/quincena';
import { CategoryIcon } from '../common/CategoryIcon';

interface CategoryDonutChartProps {
  summary: FinancialSummary;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ summary }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categoriesData = summary.expenseByCategory;
  const total = summary.totalExpense;

  if (total === 0 || categoriesData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <p className="text-sm font-medium text-slate-600">No hay gastos registrados en esta quincena</p>
        <p className="text-xs text-slate-400 mt-1">Registra tus gastos diarios para ver la distribución por categorías.</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 220;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {categoriesData.map((item) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percentage;
            const isHovered = hoveredCategory === item.category.id;

            return (
              <circle
                key={item.category.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.category.color || '#64748b'}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(item.category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Gasto Total</span>
          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
            {formatMXN(total, false)}
          </span>
          <span className="text-2xs text-slate-500 font-mono">MXN</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2 max-h-60 overflow-y-auto pr-1">
        {categoriesData.map((item) => {
          const isHovered = hoveredCategory === item.category.id;
          return (
            <div
              key={item.category.id}
              onMouseEnter={() => setHoveredCategory(item.category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: item.category.color }}
                />
                <CategoryIcon name={item.category.icon} size={14} className="text-slate-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{item.category.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                <span className="text-slate-500">{item.percentage.toFixed(1)}%</span>
                <span className="font-semibold text-slate-900">{formatMXN(item.amount, false)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface QuincenalComparisonBarChartProps {
  year: number;
  currentQuincenaId: string;
  onSelectQuincena: (quincenaId: string) => void;
  getQuincenaSummary: (quincenaId: string) => FinancialSummary;
  quincenas: QuincenaInfo[];
}

export const QuincenalComparisonBarChart: React.FC<QuincenalComparisonBarChartProps> = ({
  currentQuincenaId,
  onSelectQuincena,
  getQuincenaSummary,
  quincenas
}) => {
  const [hoveredQuincena, setHoveredQuincena] = useState<string | null>(null);

  // Pre-calculate data for each quincena
  const data = quincenas.map((q) => {
    const sum = getQuincenaSummary(q.id);
    return {
      quincena: q,
      income: sum.totalIncome,
      expense: sum.totalExpense,
      balance: sum.netBalance
    };
  });

  const maxVal = Math.max(
    1000,
    ...data.map((d) => Math.max(d.income, d.expense))
  );

  return (
    <div className="w-full">
      {/* Chart container with horizontal scroll on small devices */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[700px] h-56 flex items-end gap-2 pt-6 px-2 border-b border-slate-200">
          {data.map((item) => {
            const isCurrent = item.quincena.id === currentQuincenaId;
            const isHovered = hoveredQuincena === item.quincena.id;
            const incomeHeight = maxVal > 0 ? (item.income / maxVal) * 160 : 0;
            const expenseHeight = maxVal > 0 ? (item.expense / maxVal) * 160 : 0;

            return (
              <div
                key={item.quincena.id}
                onClick={() => onSelectQuincena(item.quincena.id)}
                onMouseEnter={() => setHoveredQuincena(item.quincena.id)}
                onMouseLeave={() => setHoveredQuincena(null)}
                className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all ${
                  isCurrent ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-slate-900 text-white text-2xs rounded-lg py-1 px-2.5 shadow-lg whitespace-nowrap pointer-events-none">
                    <p className="font-semibold">{item.quincena.label}</p>
                    <p className="text-emerald-400 font-mono">Ingreso: {formatMXN(item.income)}</p>
                    <p className="text-rose-400 font-mono">Gasto: {formatMXN(item.expense)}</p>
                    <p className="text-slate-300 font-mono">Balance: {formatMXN(item.balance)}</p>
                  </div>
                )}

                {/* Bars side by side */}
                <div className="w-full flex items-end justify-center gap-1 h-[160px]">
                  {/* Income bar */}
                  <div
                    style={{ height: `${Math.max(incomeHeight, 2)}px` }}
                    className={`w-2.5 rounded-t-sm transition-all duration-300 ${
                      item.income > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-200'
                    }`}
                    title={`Ingreso: ${formatMXN(item.income)}`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${Math.max(expenseHeight, 2)}px` }}
                    className={`w-2.5 rounded-t-sm transition-all duration-300 ${
                      item.expense > 0 ? 'bg-rose-500 group-hover:bg-rose-600' : 'bg-slate-200'
                    }`}
                    title={`Gasto: ${formatMXN(item.expense)}`}
                  />
                </div>

                {/* Quincena label */}
                <div className="w-full text-center mt-2">
                  <span
                    className={`block text-2xs truncate ${
                      isCurrent
                        ? 'font-bold text-emerald-700 bg-emerald-50 rounded px-1'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.quincena.shortLabel.split(' ')[0]} {item.quincena.shortLabel.split(' ')[1]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-500" />
          <span>Ingresos Quincenales</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-rose-500" />
          <span>Gastos Quincenales</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-700" />
          <span className="text-slate-500">Quincena activa en vista</span>
        </div>
      </div>
    </div>
  );
};
