/**
 * Core type definitions for Personal Finance Management (Control de Finanzas Personales MXN)
 */

export type PaymentMethod = 
  | 'Efectivo'
  | 'Tarjeta de Débito'
  | 'Tarjeta de Crédito'
  | 'Transferencia SPEI'
  | 'Vales de Despensa'
  | 'Otro';

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color or hex
  icon: string; // Lucide icon key
  active: boolean;
  isDefault?: boolean;
  description?: string;
}

export interface Income {
  id: string;
  date: string; // YYYY-MM-DD
  concept: string;
  amount: number;
  quincenaId: string; // e.g. "2026-10-Q2"
  year: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  establishment: string; // Establecimiento / Comercio
  description: string;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
  ticketNumber?: string; // Folio de comprobante / ticket
  receiptImage?: string; // Base64 data URL
  receiptName?: string;
  quincenaId: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface RealSaving {
  id: string;
  date: string;
  concept: string;
  amount: number;
  destination: string; // e.g. "Cetesdirecto", "Cajita Nu", "BBVA Ahorros", "Fondo Emergencia"
  quincenaId: string;
  year: number;
  notes?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  color: string;
}

export interface QuincenaInfo {
  id: string; // "2026-10-Q1" or "2026-10-Q2"
  year: number;
  month: number; // 1-12
  monthName: string; // "Octubre", etc.
  quincenaNumber: 1 | 2;
  label: string; // "1ª Quincena de Octubre 2026"
  shortLabel: string; // "1Q Oct 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface FilterState {
  searchQuery: string;
  quincenaId: string; // 'all' or specific id
  year: number | 'all';
  categoryId: string; // 'all' or specific id
  establishment: string; // 'all' or specific
  paymentMethod: string; // 'all' or specific
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  type: 'all' | 'income' | 'expense' | 'savings';
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number; // Income - Expense
  totalRealSavings: number;
  savingsRate: number; // (netBalance / totalIncome) * 100 or realSavings / income
  expenseByCategory: {
    category: Category;
    amount: number;
    percentage: number;
    count: number;
  }[];
  expenseByPaymentMethod: {
    method: PaymentMethod;
    amount: number;
    percentage: number;
  }[];
  topEstablishments: {
    name: string;
    amount: number;
    count: number;
  }[];
}
