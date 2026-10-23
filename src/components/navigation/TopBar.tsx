import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Cloud, LogOut, User as UserIcon } from 'lucide-react';

interface TopBarProps {
  onOpenQuickAdd: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenQuickAdd }) => {
  const { activeTab, setActiveTab } = useFinance();
  const { currentUser, isAuthenticating, loginWithGoogle, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single element, one line */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-emerald-700 transition-colors text-left"
        >
          FinanZas Quincenal
        </button>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'incomes'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'expenses'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'savings'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Ahorro
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'reports'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Reportes
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'categories'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Categorías
          </button>
        </nav>

        {/* Zone 3: 1 primary action + Auth State */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-xs text-slate-700 cursor-pointer"
                title={`Conectado como ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Usuario'}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <Cloud className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">
                      {currentUser.displayName || 'Usuario de Firebase'}
                    </p>
                    <p className="text-2xs text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-2xs text-emerald-700 font-medium">
                      <Cloud className="w-3 h-3" />
                      <span>Sincronización Firestore Activa</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              disabled={isAuthenticating}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAuthenticating ? 'Conectando...' : 'Conectar Firebase'}</span>
            </button>
          )}

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar</span>
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden flex items-center justify-between overflow-x-auto px-4 py-2.5 border-t border-slate-100 bg-slate-50 gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('incomes')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'incomes' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'expenses' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          Gastos
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'savings' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          Ahorro
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'reports' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          Reportes
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'categories' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          Categorías
        </button>
        {!currentUser && (
          <button
            onClick={() => loginWithGoogle()}
            disabled={isAuthenticating}
            className="px-2.5 py-1.5 rounded-md whitespace-nowrap bg-emerald-50 text-emerald-800 font-semibold disabled:opacity-60"
          >
            {isAuthenticating ? '...' : 'Login'}
          </button>
        )}
      </div>
    </header>
  );
};
