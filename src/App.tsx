/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { TopBar } from './components/navigation/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { IncomesView } from './components/incomes/IncomesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CategoriesView } from './components/categories/CategoriesView';
import { SavingsView } from './components/savings/SavingsView';
import { ReportsView } from './components/reports/ReportsView';
import { ToastContainer } from './components/common/ToastContainer';
import { QuickAddModal } from './components/modals/QuickAddModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { IncomeModal } from './components/modals/IncomeModal';
import { SavingModal } from './components/modals/SavingModal';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  // Quick action modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);

  const handleSelectQuickOption = (type: 'expense' | 'income' | 'saving') => {
    setIsQuickAddOpen(false);
    if (type === 'expense') {
      setIsExpenseModalOpen(true);
    } else if (type === 'income') {
      setIsIncomeModalOpen(true);
    } else if (type === 'saving') {
      setIsSavingModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/20">
      {/* Top Bar Contract (Wordmark Brand, Nav Links, 1 Primary Action) */}
      <TopBar onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Main Viewport Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'incomes' && <IncomesView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'savings' && <SavingsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'categories' && <CategoriesView />}
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">FinanZas Quincenal</span>
            <span>·</span>
            <span>Control de Finanzas Personales en Pesos Mexicanos (MXN)</span>
          </div>
          <div className="flex items-center gap-4 text-2xs">
            <button
              onClick={() => setActiveTab('reports')}
              className="hover:text-slate-900 transition-colors"
            >
              Exportación & Respaldos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className="hover:text-slate-900 transition-colors"
            >
              Categorías
            </button>
            <button
              onClick={() => setActiveTab('savings')}
              className="hover:text-slate-900 transition-colors"
            >
              Metas de Ahorro
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Notifications */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectOption={handleSelectQuickOption}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
      />

      <SavingModal
        isOpen={isSavingModalOpen}
        onClose={() => setIsSavingModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainAppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
