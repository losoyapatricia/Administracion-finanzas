import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAuth } from './AuthContext';
import { 
  Category, 
  Expense, 
  FilterState, 
  FinancialSummary, 
  Income, 
  QuincenaInfo, 
  RealSaving, 
  SavingsGoal 
} from '../types/finance';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_EXPENSES, 
  INITIAL_GOALS, 
  INITIAL_INCOMES, 
  INITIAL_SAVINGS 
} from '../data/defaultData';
import { 
  buildQuincenaInfo, 
  getAdjacentQuincenas, 
  getCurrentDateString, 
  getQuincenaFromDate 
} from '../utils/quincena';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface FinanceContextType {
  // Data
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  realSavings: RealSaving[];
  savingsGoals: SavingsGoal[];
  isCloudSync: boolean;
  
  // Navigation & Active View
  activeTab: 'dashboard' | 'incomes' | 'expenses' | 'categories' | 'savings' | 'reports' | 'search';
  setActiveTab: (tab: 'dashboard' | 'incomes' | 'expenses' | 'categories' | 'savings' | 'reports' | 'search') => void;
  
  currentQuincena: QuincenaInfo;
  setCurrentQuincena: (q: QuincenaInfo) => void;
  setCurrentQuincenaById: (id: string) => void;
  goToPreviousQuincena: () => void;
  goToNextQuincena: () => void;
  goToCurrentDateQuincena: () => void;

  // Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // CRUD Incomes
  addIncome: (income: Omit<Income, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // CRUD Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  batchAddExpenses: (expensesList: Omit<Expense, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // CRUD Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  toggleCategoryActive: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // CRUD Real Savings
  addRealSaving: (saving: Omit<RealSaving, 'id' | 'quincenaId' | 'year' | 'createdAt'>) => Promise<void>;
  updateRealSaving: (id: string, updates: Partial<RealSaving>) => Promise<void>;
  deleteRealSaving: (id: string) => Promise<void>;

  // CRUD Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  // Calculations
  currentSummary: FinancialSummary;
  getQuincenaSummary: (quincenaId: string) => FinancialSummary;
  getAnnualSummary: (year: number) => FinancialSummary;
  getCategoryById: (id: string) => Category | undefined;

  // Utilities & Export
  exportToCSV: (type?: 'all' | 'incomes' | 'expenses') => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonString: string) => boolean;
  resetToDemoData: () => void;
  syncLocalToCloud: () => Promise<void>;

  // Toast
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INCOMES: 'fq_incomes_v1',
  EXPENSES: 'fq_expenses_v1',
  CATEGORIES: 'fq_categories_v1',
  SAVINGS: 'fq_savings_v1',
  GOALS: 'fq_goals_v1',
};

const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: '',
  quincenaId: 'all',
  year: 'all',
  categoryId: 'all',
  establishment: 'all',
  paymentMethod: 'all',
  type: 'all'
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [currentQuincena, setCurrentQuincena] = useState<QuincenaInfo>(() => {
    return getQuincenaFromDate(getCurrentDateString());
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'incomes' | 'expenses' | 'categories' | 'savings' | 'reports' | 'search'>('dashboard');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Persistent States
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_CATEGORIES;
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCOMES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_INCOMES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EXPENSES;
  });

  const [realSavings, setRealSavings] = useState<RealSaving[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SAVINGS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_GOALS;
  });

  // Sync to LocalStorage for offline resilience
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }, [categories, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    }
  }, [incomes, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }
  }, [expenses, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(realSavings));
    }
  }, [realSavings, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(savingsGoals));
    }
  }, [savingsGoals, currentUser]);

  // Toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Firestore Real-Time Sync when currentUser is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const uid = currentUser.uid;

    // 1. Incomes listener
    const incPath = `users/${uid}/incomes`;
    const unsubIncomes = onSnapshot(
      collection(db, 'users', uid, 'incomes'),
      (snapshot) => {
        const cloudIncomes: Income[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id
        }));
        setIncomes(cloudIncomes);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, incPath);
      }
    );

    // 2. Expenses listener
    const expPath = `users/${uid}/expenses`;
    const unsubExpenses = onSnapshot(
      collection(db, 'users', uid, 'expenses'),
      (snapshot) => {
        const cloudExpenses: Expense[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id
        }));
        setExpenses(cloudExpenses);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, expPath);
      }
    );

    // 3. Categories listener
    const catPath = `users/${uid}/categories`;
    const unsubCategories = onSnapshot(
      collection(db, 'users', uid, 'categories'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Initialize default categories in Firestore if cloud user has none
          const batch = writeBatch(db);
          DEFAULT_CATEGORIES.forEach((cat) => {
            const catRef = doc(db, 'users', uid, 'categories', cat.id);
            batch.set(catRef, { ...cat, userId: uid });
          });
          try {
            await batch.commit();
          } catch (e) {
            console.error('Error seeding default categories:', e);
          }
        } else {
          const cloudCats: Category[] = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as any),
            id: docSnap.id
          }));
          setCategories(cloudCats);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, catPath);
      }
    );

    // 4. Real Savings listener
    const savPath = `users/${uid}/savings`;
    const unsubSavings = onSnapshot(
      collection(db, 'users', uid, 'savings'),
      (snapshot) => {
        const cloudSavings: RealSaving[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id
        }));
        setRealSavings(cloudSavings);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, savPath);
      }
    );

    // 5. Goals listener
    const goalPath = `users/${uid}/goals`;
    const unsubGoals = onSnapshot(
      collection(db, 'users', uid, 'goals'),
      (snapshot) => {
        const cloudGoals: SavingsGoal[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id
        }));
        setSavingsGoals(cloudGoals);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, goalPath);
      }
    );

    showToast(`Conectado a Firebase Firestore como ${currentUser.email || 'usuario'}`, 'info');

    return () => {
      unsubIncomes();
      unsubExpenses();
      unsubCategories();
      unsubSavings();
      unsubGoals();
    };
  }, [currentUser]);

  // Quincena Navigation
  const setCurrentQuincenaById = (id: string) => {
    const parts = id.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const qNum = parts[2] === 'Q2' ? 2 : 1;
      setCurrentQuincena(buildQuincenaInfo(year, month, qNum));
    }
  };

  const goToPreviousQuincena = () => {
    const { prev } = getAdjacentQuincenas(currentQuincena.id);
    setCurrentQuincena(prev);
  };

  const goToNextQuincena = () => {
    const { next } = getAdjacentQuincenas(currentQuincena.id);
    setCurrentQuincena(next);
  };

  const goToCurrentDateQuincena = () => {
    setCurrentQuincena(getQuincenaFromDate(getCurrentDateString()));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
  };

  // CRUD Incomes
  const addIncome = async (incomeData: Omit<Income, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>) => {
    const qInfo = getQuincenaFromDate(incomeData.date);
    const nowIso = new Date().toISOString();
    const id = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newIncome: Income = {
      ...incomeData,
      id,
      quincenaId: qInfo.id,
      year: qInfo.year,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/incomes/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'incomes', id), {
          ...newIncome,
          userId: currentUser.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setIncomes((prev) => [newIncome, ...prev]);
    }

    showToast(`Ingreso de $${newIncome.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN registrado.`);
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/incomes/${id}`;
      try {
        const item = incomes.find((i) => i.id === id);
        const updatedDate = updates.date ?? item?.date ?? getCurrentDateString();
        const qInfo = getQuincenaFromDate(updatedDate);
        await updateDoc(doc(db, 'users', currentUser.uid, 'incomes', id), {
          ...updates,
          quincenaId: qInfo.id,
          year: qInfo.year,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setIncomes((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedDate = updates.date ?? item.date;
            const qInfo = getQuincenaFromDate(updatedDate);
            return {
              ...item,
              ...updates,
              quincenaId: qInfo.id,
              year: qInfo.year,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        })
      );
    }
    showToast('Ingreso actualizado correctamente.');
  };

  const deleteIncome = async (id: string) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/incomes/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'incomes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setIncomes((prev) => prev.filter((item) => item.id !== id));
    }
    showToast('Ingreso eliminado.', 'info');
  };

  // CRUD Expenses
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>) => {
    const qInfo = getQuincenaFromDate(expenseData.date);
    const nowIso = new Date().toISOString();
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: Expense = {
      ...expenseData,
      id,
      quincenaId: qInfo.id,
      year: qInfo.year,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/expenses/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'expenses', id), {
          ...newExpense,
          userId: currentUser.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setExpenses((prev) => [newExpense, ...prev]);
    }

    showToast(`Gasto en ${newExpense.establishment} de $${newExpense.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN guardado.`);
  };

  const batchAddExpenses = async (expensesList: Omit<Expense, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>[]): Promise<number> => {
    if (!expensesList.length) return 0;
    const nowIso = new Date().toISOString();

    if (currentUser) {
      const path = `users/${currentUser.uid}/expenses`;
      try {
        const batch = writeBatch(db);
        expensesList.forEach((item, index) => {
          const qInfo = getQuincenaFromDate(item.date);
          const id = `exp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
          const docRef = doc(db, 'users', currentUser.uid, 'expenses', id);
          batch.set(docRef, {
            ...item,
            id,
            userId: currentUser.uid,
            quincenaId: qInfo.id,
            year: qInfo.year,
            createdAt: nowIso,
            updatedAt: nowIso
          });
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      const newItems: Expense[] = expensesList.map((item, index) => {
        const qInfo = getQuincenaFromDate(item.date);
        return {
          ...item,
          id: `exp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          quincenaId: qInfo.id,
          year: qInfo.year,
          createdAt: nowIso,
          updatedAt: nowIso
        };
      });
      setExpenses((prev) => [...newItems, ...prev]);
    }

    showToast(`Se importaron exitosamente ${expensesList.length} gastos a Firestore.`);
    return expensesList.length;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/expenses/${id}`;
      try {
        const item = expenses.find((e) => e.id === id);
        const updatedDate = updates.date ?? item?.date ?? getCurrentDateString();
        const qInfo = getQuincenaFromDate(updatedDate);
        await updateDoc(doc(db, 'users', currentUser.uid, 'expenses', id), {
          ...updates,
          quincenaId: qInfo.id,
          year: qInfo.year,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setExpenses((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedDate = updates.date ?? item.date;
            const qInfo = getQuincenaFromDate(updatedDate);
            return {
              ...item,
              ...updates,
              quincenaId: qInfo.id,
              year: qInfo.year,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        })
      );
    }
    showToast('Gasto actualizado.');
  };

  const deleteExpense = async (id: string) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/expenses/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'expenses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    }
    showToast('Gasto eliminado.', 'info');
  };

  // CRUD Categories
  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCategory: Category = {
      ...categoryData,
      id
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', id), {
          ...newCategory,
          userId: currentUser.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setCategories((prev) => [...prev, newCategory]);
    }

    showToast(`Categoría "${newCategory.name}" guardada.`);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${id}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'categories', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setCategories((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    }
    showToast('Categoría actualizada.');
  };

  const toggleCategoryActive = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const newActive = !cat.active;

    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${id}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'categories', id), { active: newActive });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setCategories((prev) =>
        prev.map((item) => (item.id === id ? { ...item, active: newActive } : item))
      );
    }

    showToast(`Categoría "${cat.name}" ${newActive ? 'activada' : 'desactivada'}.`, 'info');
  };

  const deleteCategory = async (id: string) => {
    const isUsed = expenses.some((e) => e.categoryId === id);
    if (isUsed) {
      showToast('No se puede eliminar la categoría porque tiene gastos asociados. Puedes desactivarla.', 'error');
      return;
    }

    if (currentUser) {
      const path = `users/${currentUser.uid}/categories/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'categories', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setCategories((prev) => prev.filter((item) => item.id !== id));
    }
    showToast('Categoría eliminada.', 'info');
  };

  // CRUD Real Savings
  const addRealSaving = async (savingData: Omit<RealSaving, 'id' | 'quincenaId' | 'year' | 'createdAt'>) => {
    const qInfo = getQuincenaFromDate(savingData.date);
    const id = `sav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSaving: RealSaving = {
      ...savingData,
      id,
      quincenaId: qInfo.id,
      year: qInfo.year,
      createdAt: new Date().toISOString()
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/savings/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'savings', id), {
          ...newSaving,
          userId: currentUser.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setRealSavings((prev) => [newSaving, ...prev]);
    }

    showToast(`Ahorro real de $${newSaving.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN registrado.`);
  };

  const updateRealSaving = async (id: string, updates: Partial<RealSaving>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/savings/${id}`;
      try {
        const item = realSavings.find((s) => s.id === id);
        const updatedDate = updates.date ?? item?.date ?? getCurrentDateString();
        const qInfo = getQuincenaFromDate(updatedDate);
        await updateDoc(doc(db, 'users', currentUser.uid, 'savings', id), {
          ...updates,
          quincenaId: qInfo.id,
          year: qInfo.year
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setRealSavings((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedDate = updates.date ?? item.date;
            const qInfo = getQuincenaFromDate(updatedDate);
            return {
              ...item,
              ...updates,
              quincenaId: qInfo.id,
              year: qInfo.year
            };
          }
          return item;
        })
      );
    }
    showToast('Registro de ahorro actualizado.');
  };

  const deleteRealSaving = async (id: string) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/savings/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'savings', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setRealSavings((prev) => prev.filter((item) => item.id !== id));
    }
    showToast('Registro de ahorro eliminado.', 'info');
  };

  // CRUD Goals
  const addSavingsGoal = async (goalData: Omit<SavingsGoal, 'id'>) => {
    const id = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newGoal: SavingsGoal = {
      ...goalData,
      id
    };

    if (currentUser) {
      const path = `users/${currentUser.uid}/goals/${id}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'goals', id), {
          ...newGoal,
          userId: currentUser.uid
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setSavingsGoals((prev) => [...prev, newGoal]);
    }
    showToast(`Meta de ahorro "${newGoal.name}" creada.`);
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/goals/${id}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'goals', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setSavingsGoals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    }
    showToast('Meta de ahorro actualizada.');
  };

  const deleteSavingsGoal = async (id: string) => {
    if (currentUser) {
      const path = `users/${currentUser.uid}/goals/${id}`;
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'goals', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setSavingsGoals((prev) => prev.filter((item) => item.id !== id));
    }
    showToast('Meta de ahorro eliminada.', 'info');
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find((c) => c.id === id);
  };

  // Sync all local demo/user data into Firebase Firestore
  const syncLocalToCloud = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      // Incomes
      incomes.forEach((inc) => {
        const ref = doc(db, 'users', currentUser.uid, 'incomes', inc.id);
        batch.set(ref, { ...inc, userId: currentUser.uid });
      });
      // Expenses
      expenses.forEach((exp) => {
        const ref = doc(db, 'users', currentUser.uid, 'expenses', exp.id);
        batch.set(ref, { ...exp, userId: currentUser.uid });
      });
      // Categories
      categories.forEach((cat) => {
        const ref = doc(db, 'users', currentUser.uid, 'categories', cat.id);
        batch.set(ref, { ...cat, userId: currentUser.uid });
      });
      // Savings
      realSavings.forEach((sav) => {
        const ref = doc(db, 'users', currentUser.uid, 'savings', sav.id);
        batch.set(ref, { ...sav, userId: currentUser.uid });
      });
      // Goals
      savingsGoals.forEach((goal) => {
        const ref = doc(db, 'users', currentUser.uid, 'goals', goal.id);
        batch.set(ref, { ...goal, userId: currentUser.uid });
      });

      await batch.commit();
      showToast('Datos sincronizados correctamente con Firebase Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  // Financial Summaries Calculation
  const calculateSummary = (filteredIncomes: Income[], filteredExpenses: Expense[], filteredSavings: RealSaving[]): FinancialSummary => {
    const totalIncome = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netBalance = totalIncome - totalExpense;
    const totalRealSavings = filteredSavings.reduce((acc, curr) => acc + curr.amount, 0);
    const savingsRate = totalIncome > 0 ? ((netBalance) / totalIncome) * 100 : 0;

    // Group expenses by category
    const categoryMap: { [catId: string]: { amount: number; count: number } } = {};
    filteredExpenses.forEach((exp) => {
      if (!categoryMap[exp.categoryId]) {
        categoryMap[exp.categoryId] = { amount: 0, count: 0 };
      }
      categoryMap[exp.categoryId].amount += exp.amount;
      categoryMap[exp.categoryId].count += 1;
    });

    const expenseByCategory = Object.entries(categoryMap)
      .map(([catId, data]) => {
        const cat = categories.find((c) => c.id === catId) || {
          id: catId,
          name: 'Sin categoría',
          color: '#64748b',
          icon: 'HelpCircle',
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

    // Group expenses by payment method
    const paymentMap: { [method: string]: number } = {};
    filteredExpenses.forEach((exp) => {
      paymentMap[exp.paymentMethod] = (paymentMap[exp.paymentMethod] || 0) + exp.amount;
    });

    const expenseByPaymentMethod = Object.entries(paymentMap)
      .map(([method, amount]) => ({
        method: method as any,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Group by establishments
    const estMap: { [name: string]: { amount: number; count: number } } = {};
    filteredExpenses.forEach((exp) => {
      const cleanName = exp.establishment.trim();
      if (!estMap[cleanName]) {
        estMap[cleanName] = { amount: 0, count: 0 };
      }
      estMap[cleanName].amount += exp.amount;
      estMap[cleanName].count += 1;
    });

    const topEstablishments = Object.entries(estMap)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return {
      totalIncome,
      totalExpense,
      netBalance,
      totalRealSavings,
      savingsRate,
      expenseByCategory,
      expenseByPaymentMethod,
      topEstablishments
    };
  };

  // Current quincena summary
  const currentSummary = useMemo(() => {
    const qIncomes = incomes.filter((i) => i.quincenaId === currentQuincena.id);
    const qExpenses = expenses.filter((e) => e.quincenaId === currentQuincena.id);
    const qSavings = realSavings.filter((s) => s.quincenaId === currentQuincena.id);
    return calculateSummary(qIncomes, qExpenses, qSavings);
  }, [incomes, expenses, realSavings, currentQuincena.id, categories]);

  const getQuincenaSummary = (quincenaId: string) => {
    const qIncomes = incomes.filter((i) => i.quincenaId === quincenaId);
    const qExpenses = expenses.filter((e) => e.quincenaId === quincenaId);
    const qSavings = realSavings.filter((s) => s.quincenaId === quincenaId);
    return calculateSummary(qIncomes, qExpenses, qSavings);
  };

  const getAnnualSummary = (year: number) => {
    const yIncomes = incomes.filter((i) => i.year === year);
    const yExpenses = expenses.filter((e) => e.year === year);
    const ySavings = realSavings.filter((s) => s.year === year);
    return calculateSummary(yIncomes, yExpenses, ySavings);
  };

  // Export to CSV formatted for Excel
  const exportToCSV = (type: 'all' | 'incomes' | 'expenses' = 'all') => {
    let rows: string[][] = [];

    if (type === 'all' || type === 'incomes') {
      rows.push(['TIPO', 'FECHA', 'CONCEPTO / ESTABLECIMIENTO', 'CATEGORIA', 'METODO DE PAGO', 'MONTO (MXN)', 'QUINCENA', 'FOLIO TICKET', 'NOTAS']);
      incomes.forEach((i) => {
        rows.push([
          'INGRESO',
          i.date,
          `"${i.concept.replace(/"/g, '""')}"`,
          'Ingreso',
          'N/A',
          i.amount.toFixed(2),
          i.quincenaId,
          'N/A',
          `"${(i.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    }

    if (type === 'all' || type === 'expenses') {
      if (type === 'expenses') {
        rows.push(['TIPO', 'FECHA', 'ESTABLECIMIENTO', 'DESCRIPCION', 'CATEGORIA', 'METODO DE PAGO', 'MONTO (MXN)', 'QUINCENA', 'FOLIO TICKET']);
      }
      expenses.forEach((e) => {
        const cat = getCategoryById(e.categoryId);
        rows.push([
          'GASTO',
          e.date,
          `"${e.establishment.replace(/"/g, '""')}"`,
          `"${(cat?.name || 'General').replace(/"/g, '""')}"`,
          e.paymentMethod,
          e.amount.toFixed(2),
          e.quincenaId,
          `"${(e.ticketNumber || '').replace(/"/g, '""')}"`,
          `"${e.description.replace(/"/g, '""')}"`
        ]);
      });
    }

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Finanzas_Quincenal_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte CSV descargado con éxito.');
  };

  // Export full JSON Backup
  const exportBackupJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      incomes,
      expenses,
      categories,
      realSavings,
      savingsGoals
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FinanZas_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Copia de seguridad descargada.');
  };

  // Import JSON Backup
  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.incomes && Array.isArray(data.incomes)) setIncomes(data.incomes);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.realSavings && Array.isArray(data.realSavings)) setRealSavings(data.realSavings);
      if (data.savingsGoals && Array.isArray(data.savingsGoals)) setSavingsGoals(data.savingsGoals);
      showToast('Copia de seguridad restaurada con éxito.');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error al importar archivo. Verifica el formato JSON.', 'error');
      return false;
    }
  };

  // Reset to Demo
  const resetToDemoData = () => {
    setIncomes(INITIAL_INCOMES);
    setExpenses(INITIAL_EXPENSES);
    setCategories(DEFAULT_CATEGORIES);
    setRealSavings(INITIAL_SAVINGS);
    setSavingsGoals(INITIAL_GOALS);
    showToast('Datos reiniciados a los valores de ejemplo.', 'info');
  };

  return (
    <FinanceContext.Provider
      value={{
        incomes,
        expenses,
        categories,
        realSavings,
        savingsGoals,
        isCloudSync: !!currentUser,
        activeTab,
        setActiveTab,
        currentQuincena,
        setCurrentQuincena,
        setCurrentQuincenaById,
        goToPreviousQuincena,
        goToNextQuincena,
        goToCurrentDateQuincena,
        filters,
        setFilters,
        resetFilters,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        batchAddExpenses,
        updateExpense,
        deleteExpense,
        addCategory,
        updateCategory,
        toggleCategoryActive,
        deleteCategory,
        addRealSaving,
        updateRealSaving,
        deleteRealSaving,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        currentSummary,
        getQuincenaSummary,
        getAnnualSummary,
        getCategoryById,
        exportToCSV,
        exportBackupJSON,
        importBackupJSON,
        resetToDemoData,
        syncLocalToCloud,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
