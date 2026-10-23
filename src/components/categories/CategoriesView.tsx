import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/finance';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatMXN } from '../../utils/quincena';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  Check, 
  X, 
  Tag, 
  ShieldAlert, 
  Info,
  DollarSign
} from 'lucide-react';

const AVAILABLE_ICONS = [
  'Utensils', 'Home', 'Car', 'HeartPulse', 'GraduationCap', 'Film',
  'Shirt', 'Zap', 'CreditCard', 'HelpCircle', 'ShoppingCart', 'Coffee',
  'Smartphone', 'Plane', 'Gift', 'Briefcase', 'Activity', 'BookOpen',
  'PiggyBank', 'DollarSign', 'Shield', 'Tag'
];

const AVAILABLE_COLORS = [
  '#10b981', '#0284c7', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#6366f1', '#e11d48', '#64748b',
  '#14b8a6', '#84cc16', '#d97706', '#a855f7', '#3b82f6'
];

export const CategoriesView: React.FC = () => {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    toggleCategoryActive, 
    deleteCategory, 
    expenses 
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const openCreateModal = () => {
    setCategoryToEdit(null);
    setName('');
    setColor(AVAILABLE_COLORS[0]);
    setIcon(AVAILABLE_ICONS[0]);
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setCategoryToEdit(cat);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setDescription(cat.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: name.trim(),
        color,
        icon,
        description: description.trim()
      });
    } else {
      addCategory({
        name: name.trim(),
        color,
        icon,
        description: description.trim(),
        active: true
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Administración de Categorías
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personaliza tus clasificaciones de gasto: crea nuevas, modifica existentes o desactiva las que no uses.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
          const totalSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0);

          return (
            <div
              key={cat.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all ${
                cat.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={20} color={cat.color} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{cat.name}</h3>
                      {!cat.active && (
                        <span className="text-3xs bg-slate-200 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                          Desactivada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {cat.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleCategoryActive(cat.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      cat.active 
                        ? 'text-emerald-600 hover:bg-emerald-50' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                    }`}
                    title={cat.active ? 'Desactivar categoría' : 'Activar categoría'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar categoría"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  {catExpenses.length} registro{catExpenses.length !== 1 ? 's' : ''}
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatMXN(totalSpent)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
          <div 
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría de Gasto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mascotas, Gimnasio, Tecnología, Donaciones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Breve detalle de los gastos que incluye..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Color selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Icono Representativo
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-lg">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        icon === ic ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title={ic}
                    >
                      <CategoryIcon name={ic} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {categoryToEdit ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Eliminar categoría"
        message={`¿Deseas eliminar permanentemente la categoría "${categoryToDelete?.name}"? Asegúrate de que no tenga gastos registrados.`}
        confirmText="Sí, eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
