import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { RealSaving, SavingsGoal } from '../../types/finance';
import { formatMXN, formatDateES } from '../../utils/quincena';
import { SavingModal } from '../modals/SavingModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  PiggyBank, 
  Target, 
  Plus, 
  Landmark, 
  TrendingUp, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

export const SavingsView: React.FC = () => {
  const { 
    currentSummary, 
    realSavings, 
    savingsGoals, 
    addSavingsGoal, 
    updateSavingsGoal, 
    deleteSavingsGoal, 
    deleteRealSaving,
    currentQuincena 
  } = useFinance();

  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);
  const [savingToEdit, setSavingToEdit] = useState<RealSaving | null>(null);
  const [savingToDelete, setSavingToDelete] = useState<RealSaving | null>(null);

  // Goal modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Form states for Goal
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalColor, setGoalColor] = useState('#10b981');
  const [goalError, setGoalError] = useState('');

  // Calculations
  const totalAllTimeRealSavings = realSavings.reduce((acc, s) => acc + s.amount, 0);
  const quincenaRealSavings = realSavings
    .filter((s) => s.quincenaId === currentQuincena.id)
    .reduce((acc, s) => acc + s.amount, 0);

  const openGoalModal = (goal?: SavingsGoal) => {
    if (goal) {
      setGoalToEdit(goal);
      setGoalName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setTargetDate(goal.targetDate || '');
      setGoalColor(goal.color || '#10b981');
    } else {
      setGoalToEdit(null);
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setGoalColor('#10b981');
    }
    setGoalError('');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount || '0');

    if (!goalName.trim()) {
      setGoalError('Ingresa el nombre de la meta de ahorro.');
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setGoalError('El monto meta debe ser mayor a cero.');
      return;
    }

    if (goalToEdit) {
      updateSavingsGoal(goalToEdit.id, {
        name: goalName.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || undefined,
        color: goalColor
      });
    } else {
      addSavingsGoal({
        name: goalName.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || undefined,
        color: goalColor
      });
    }

    setIsGoalModalOpen(false);
  };

  const handleDepositToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const addVal = parseFloat(depositAmount);
    if (isNaN(addVal) || addVal <= 0) return;

    updateSavingsGoal(depositGoal.id, {
      currentAmount: depositGoal.currentAmount + addVal
    });

    setDepositGoal(null);
    setDepositAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Control de Ahorro e Inversiones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compara tu balance teórico (ingresos menos gastos) contra el ahorro real apartado en tus cuentas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openGoalModal()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Nueva Meta</span>
          </button>
          <button
            onClick={() => {
              setSavingToEdit(null);
              setIsSavingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apartar Ahorro</span>
          </button>
        </div>
      </div>

      {/* KPI Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Quincena Net Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Balance Quincenal Teórico</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatMXN(currentSummary.netBalance, false)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ingresos menos gastos en {currentQuincena.shortLabel}
          </p>
        </div>

        {/* Real Savings Quincena */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Ahorro Real Apartado (Quincena)</span>
          <p className="text-2xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
            {formatMXN(quincenaRealSavings, false)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Transferido a Cetes, pagarés o cuentas de ahorro
          </p>
        </div>

        {/* Total Accumulated Real Savings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Fondo Total Acumulado</span>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {formatMXN(totalAllTimeRealSavings, false)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Suma histórica de apartados registrados
          </p>
        </div>
      </div>

      {/* Financial Health Advice Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              Estrategia Quincenal de Ahorro: "Págate a ti mismo primero"
            </h3>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              En México, apartar entre el 10% y el 20% de tu sueldo neto cada día 15 y último de mes hacia instrumentos seguros (como Cetesdirecto o cuentas con tasa de rendimiento) protege tu dinero de la inflación y evita el gasto hormiga antes de pagar otros compromisos.
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Metas de Ahorro y Objetivos
            </h2>
            <p className="text-xs text-slate-500">Monitorea el avance de tus proyectos financieros</p>
          </div>
          <button
            onClick={() => openGoalModal()}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Meta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
            const progress = goal.targetAmount > 0 
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) 
              : 0;
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: goal.color }} 
                        />
                        <h3 className="text-sm font-bold text-slate-900 truncate">{goal.name}</h3>
                      </div>
                      {goal.targetDate && (
                        <p className="text-2xs text-slate-500 mt-1 font-mono">
                          Meta: {formatDateES(goal.targetDate, true)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openGoalModal(goal)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Editar meta"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setGoalToDelete(goal)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatMXN(goal.currentAmount, false)}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        de {formatMXN(goal.targetAmount, false)} MXN
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: goal.color || '#10b981'
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-2xs text-slate-500">
                      <span className="font-semibold text-slate-700">{progress.toFixed(1)}% logrado</span>
                      {isCompleted ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ¡Meta Cumplida!
                        </span>
                      ) : (
                        <span>Faltan {formatMXN(remaining)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setDepositGoal(goal);
                      setDepositAmount('');
                    }}
                    className="w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    + Abonar a esta Meta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Savings Register Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Historial de Apartados de Ahorro Real ({realSavings.length})
            </h2>
          </div>
          <button
            onClick={() => {
              setSavingToEdit(null);
              setIsSavingModalOpen(true);
            }}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
          >
            + Registrar Depósito
          </button>
        </div>

        {realSavings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No hay registros de ahorro real aún.</p>
            <p className="text-xs text-slate-400 mt-1">Registra transferencias a tus fondos o cuentas de inversión.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Concepto del Ahorro</th>
                  <th className="py-2.5 px-4">Cuenta / Destino</th>
                  <th className="py-2.5 px-4">Quincena</th>
                  <th className="py-2.5 px-4 text-right">Monto Aportado</th>
                  <th className="py-2.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {realSavings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateES(item.date, true)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.concept}
                      {item.notes && <p className="text-2xs text-slate-400 font-normal">{item.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{item.destination}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-2xs">
                      {item.quincenaId}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 tabular-nums whitespace-nowrap">
                      +{formatMXN(item.amount, false)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSavingToEdit(item);
                            setIsSavingModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSavingToDelete(item)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Eliminar"
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
        )}
      </div>

      {/* Saving Modal */}
      <SavingModal
        isOpen={isSavingModalOpen}
        onClose={() => {
          setIsSavingModalOpen(false);
          setSavingToEdit(null);
        }}
        savingToEdit={savingToEdit}
      />

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {goalToEdit ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {goalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {goalError}
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Meta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Fondo de Emergencia, Vacaciones, Seguro Auto"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto Objetivo (MXN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="50000.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto Actual (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha Límite Estimada (opcional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {goalToEdit ? 'Guardar Cambios' : 'Crear Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit to Goal Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">
              Abonar a "{depositGoal.name}"
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Acumulado actual: {formatMXN(depositGoal.currentAmount)}
            </p>

            <form onSubmit={handleDepositToGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto a Sumar (MXN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="1000.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-3 py-1.5 text-xs text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Abonar a la Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modals */}
      <ConfirmModal
        isOpen={!!savingToDelete}
        title="Eliminar apartado de ahorro"
        message={`¿Estás seguro de eliminar el registro "${savingToDelete?.concept}" de ${formatMXN(savingToDelete?.amount || 0)}?`}
        confirmText="Sí, eliminar"
        onConfirm={() => {
          if (savingToDelete) {
            deleteRealSaving(savingToDelete.id);
            setSavingToDelete(null);
          }
        }}
        onCancel={() => setSavingToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!goalToDelete}
        title="Eliminar meta de ahorro"
        message={`¿Estás seguro de eliminar la meta "${goalToDelete?.name}"?`}
        confirmText="Sí, eliminar meta"
        onConfirm={() => {
          if (goalToDelete) {
            deleteSavingsGoal(goalToDelete.id);
            setGoalToDelete(null);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
