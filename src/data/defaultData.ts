import { Category, Expense, Income, RealSaving, SavingsGoal } from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-alimentacion',
    name: 'Alimentación',
    color: '#10b981', // Emerald
    icon: 'Utensils',
    active: true,
    isDefault: true,
    description: 'Supermercado, despensa, abarrotes y restaurantes'
  },
  {
    id: 'cat-vivienda',
    name: 'Vivienda',
    color: '#0284c7', // Sky
    icon: 'Home',
    active: true,
    isDefault: true,
    description: 'Renta, hipoteca, mantenimiento y mejoras del hogar'
  },
  {
    id: 'cat-transporte',
    name: 'Transporte',
    color: '#f59e0b', // Amber
    icon: 'Car',
    active: true,
    isDefault: true,
    description: 'Gasolina, transporte público, casetas, Uber y afinación'
  },
  {
    id: 'cat-salud',
    name: 'Salud',
    color: '#ef4444', // Red
    icon: 'HeartPulse',
    active: true,
    isDefault: true,
    description: 'Medicamentos, consultas médicas, dentista y farmacia'
  },
  {
    id: 'cat-educacion',
    name: 'Educación',
    color: '#8b5cf6', // Violet
    icon: 'GraduationCap',
    active: true,
    isDefault: true,
    description: 'Colegiaturas, cursos, útiles escolares y libros'
  },
  {
    id: 'cat-entretenimiento',
    name: 'Entretenimiento',
    color: '#ec4899', // Pink
    icon: 'Film',
    active: true,
    isDefault: true,
    description: 'Cine, conciertos, streaming (Netflix/Spotify) y salidas'
  },
  {
    id: 'cat-ropa',
    name: 'Ropa',
    color: '#06b6d4', // Cyan
    icon: 'Shirt',
    active: true,
    isDefault: true,
    description: 'Prendas de vestir, calzado y accesorios'
  },
  {
    id: 'cat-servicios',
    name: 'Servicios',
    color: '#6366f1', // Indigo
    icon: 'Zap',
    active: true,
    isDefault: true,
    description: 'Luz (CFE), Agua, Gas, Internet y telefonía celular'
  },
  {
    id: 'cat-deudas',
    name: 'Deudas',
    color: '#e11d48', // Rose
    icon: 'CreditCard',
    active: true,
    isDefault: true,
    description: 'Tarjetas de crédito, préstamos bancarios y pagos fijos'
  },
  {
    id: 'cat-otros',
    name: 'Otros',
    color: '#64748b', // Slate
    icon: 'HelpCircle',
    active: true,
    isDefault: true,
    description: 'Gastos extraordinarios o no clasificados'
  }
];

export const INITIAL_INCOMES: Income[] = [
  {
    id: 'inc-2026-10-q1-1',
    date: '2026-10-15',
    concept: 'Sueldo quincenal neto (Nómina Banorte)',
    amount: 18500.00,
    quincenaId: '2026-10-Q1',
    year: 2026,
    notes: 'Pago regular 1ª quincena',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'inc-2026-10-q1-2',
    date: '2026-10-12',
    concept: 'Proyecto freelance - Diseño de catálogo',
    amount: 3200.00,
    quincenaId: '2026-10-Q1',
    year: 2026,
    notes: 'Transferencia cliente comercial',
    createdAt: '2026-10-12T14:30:00Z',
    updatedAt: '2026-10-12T14:30:00Z'
  },
  {
    id: 'inc-2026-10-q2-1',
    date: '2026-10-23',
    concept: 'Anticipo quincenal / Bono de productividad',
    amount: 2500.00,
    quincenaId: '2026-10-Q2',
    year: 2026,
    notes: 'Premio por cumplimiento de metas',
    createdAt: '2026-10-23T10:00:00Z',
    updatedAt: '2026-10-23T10:00:00Z'
  },
  {
    id: 'inc-2026-10-q2-2',
    date: '2026-10-31',
    concept: 'Sueldo quincenal neto (Nómina Banorte)',
    amount: 18500.00,
    quincenaId: '2026-10-Q2',
    year: 2026,
    notes: 'Pago 2ª quincena fin de mes',
    createdAt: '2026-10-23T08:00:00Z',
    updatedAt: '2026-10-23T08:00:00Z'
  },
  {
    id: 'inc-2026-09-q2-1',
    date: '2026-09-30',
    concept: 'Sueldo quincenal neto',
    amount: 18500.00,
    quincenaId: '2026-09-Q2',
    year: 2026,
    notes: 'Fin de mes septiembre',
    createdAt: '2026-09-30T09:00:00Z',
    updatedAt: '2026-09-30T09:00:00Z'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  // 1ª Quincena de Octubre 2026
  {
    id: 'exp-1',
    date: '2026-10-02',
    establishment: 'Walmart Supercenter',
    description: 'Despensa quincenal completa (alimentos, frutas, carnes)',
    amount: 2680.50,
    categoryId: 'cat-alimentacion',
    paymentMethod: 'Tarjeta de Débito',
    ticketNumber: 'WMT-892110',
    quincenaId: '2026-10-Q1',
    year: 2026,
    createdAt: '2026-10-02T18:20:00Z',
    updatedAt: '2026-10-02T18:20:00Z'
  },
  {
    id: 'exp-2',
    date: '2026-10-03',
    establishment: 'Inmobiliaria Residencial',
    description: 'Pago mensual de renta departamento',
    amount: 7500.00,
    categoryId: 'cat-vivienda',
    paymentMethod: 'Transferencia SPEI',
    ticketNumber: 'REC-OCT-2026',
    quincenaId: '2026-10-Q1',
    year: 2026,
    createdAt: '2026-10-03T11:00:00Z',
    updatedAt: '2026-10-03T11:00:00Z'
  },
  {
    id: 'exp-3',
    date: '2026-10-05',
    establishment: 'Gasolinera Pemex San Jerónimo',
    description: 'Tanque lleno Magna 45 litros',
    amount: 1080.00,
    categoryId: 'cat-transporte',
    paymentMethod: 'Tarjeta de Crédito',
    ticketNumber: 'TKT-78234',
    quincenaId: '2026-10-Q1',
    year: 2026,
    createdAt: '2026-10-05T08:15:00Z',
    updatedAt: '2026-10-05T08:15:00Z'
  },
  {
    id: 'exp-4',
    date: '2026-10-07',
    establishment: 'CFE Suministrador',
    description: 'Recibo bimestral de energía eléctrica',
    amount: 645.00,
    categoryId: 'cat-servicios',
    paymentMethod: 'Tarjeta de Débito',
    ticketNumber: 'CFE-002819',
    quincenaId: '2026-10-Q1',
    year: 2026,
    createdAt: '2026-10-07T16:45:00Z',
    updatedAt: '2026-10-07T16:45:00Z'
  },
  {
    id: 'exp-5',
    date: '2026-10-10',
    establishment: 'Farmacias Guadalajara',
    description: 'Vitaminas, analgésicos y jarabe para la tos',
    amount: 485.00,
    categoryId: 'cat-salud',
    paymentMethod: 'Efectivo',
    ticketNumber: 'FG-449102',
    quincenaId: '2026-10-Q1',
    year: 2026,
    createdAt: '2026-10-10T20:10:00Z',
    updatedAt: '2026-10-10T20:10:00Z'
  },
  {
    id: 'exp-6',
    date: '2026-10-14',
    establishment: 'Cinépolis VIP',
    description: 'Entradas para función de fin de semana y dulcería',
    amount: 490.00,
    categoryId: 'cat-entretenimiento',
    paymentMethod: 'Tarjeta de Crédito',
    ticketNumber: 'CP-90214',
    quincenaId: '2026-10-Q1',
    year: 2026,
    createdAt: '2026-10-14T21:30:00Z',
    updatedAt: '2026-10-14T21:30:00Z'
  },

  // 2ª Quincena de Octubre 2026
  {
    id: 'exp-7',
    date: '2026-10-17',
    establishment: 'Costco Wholesale',
    description: 'Compra de productos de limpieza y despensa mayoreo',
    amount: 2340.00,
    categoryId: 'cat-alimentacion',
    paymentMethod: 'Tarjeta de Crédito',
    ticketNumber: 'CST-49281',
    quincenaId: '2026-10-Q2',
    year: 2026,
    createdAt: '2026-10-17T15:20:00Z',
    updatedAt: '2026-10-17T15:20:00Z'
  },
  {
    id: 'exp-8',
    date: '2026-10-19',
    establishment: 'Gasolinera Pemex San Jerónimo',
    description: 'Recarga de gasolina semanal 35 litros',
    amount: 840.00,
    categoryId: 'cat-transporte',
    paymentMethod: 'Tarjeta de Débito',
    ticketNumber: 'TKT-81203',
    quincenaId: '2026-10-Q2',
    year: 2026,
    createdAt: '2026-10-19T08:50:00Z',
    updatedAt: '2026-10-19T08:50:00Z'
  },
  {
    id: 'exp-9',
    date: '2026-10-21',
    establishment: 'Zara México',
    description: 'Pantalón y camisa formal para el trabajo',
    amount: 1499.00,
    categoryId: 'cat-ropa',
    paymentMethod: 'Tarjeta de Crédito',
    ticketNumber: 'ZR-55421',
    quincenaId: '2026-10-Q2',
    year: 2026,
    createdAt: '2026-10-21T17:10:00Z',
    updatedAt: '2026-10-21T17:10:00Z'
  },
  {
    id: 'exp-10',
    date: '2026-10-22',
    establishment: 'Totalplay Telecomunicaciones',
    description: 'Paquete de internet fibra óptica y streaming mensual',
    amount: 699.00,
    categoryId: 'cat-servicios',
    paymentMethod: 'Tarjeta de Débito',
    ticketNumber: 'TP-1029384',
    quincenaId: '2026-10-Q2',
    year: 2026,
    createdAt: '2026-10-22T10:15:00Z',
    updatedAt: '2026-10-22T10:15:00Z'
  },
  {
    id: 'exp-11',
    date: '2026-10-23',
    establishment: 'BBVA Tarjeta Azul',
    description: 'Abono a mensualidad sin intereses equipo de cómputo',
    amount: 1850.00,
    categoryId: 'cat-deudas',
    paymentMethod: 'Transferencia SPEI',
    ticketNumber: 'BBVA-MSI-04',
    quincenaId: '2026-10-Q2',
    year: 2026,
    createdAt: '2026-10-23T09:30:00Z',
    updatedAt: '2026-10-23T09:30:00Z'
  }
];

export const INITIAL_SAVINGS: RealSaving[] = [
  {
    id: 'sav-1',
    date: '2026-10-15',
    concept: 'Apartado automático de nómina',
    amount: 3500.00,
    destination: 'Cetesdirecto (Bonddia 11.0%)',
    quincenaId: '2026-10-Q1',
    year: 2026,
    notes: 'Ahorro programado 1ª quincena',
    createdAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'sav-2',
    date: '2026-10-23',
    concept: 'Aporte de bono a Fondo de Emergencia',
    amount: 1500.00,
    destination: 'Cajita Nu (Rendimiento 13.5%)',
    quincenaId: '2026-10-Q2',
    year: 2026,
    notes: 'Ahorro directo de ingreso extra',
    createdAt: '2026-10-23T11:00:00Z'
  }
];

export const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Fondo de Emergencia (3 meses)',
    targetAmount: 45000.00,
    currentAmount: 28500.00,
    targetDate: '2026-12-31',
    category: 'Seguridad',
    color: '#10b981'
  },
  {
    id: 'goal-2',
    name: 'Seguro de Auto Cobertura Amplia',
    targetAmount: 14000.00,
    currentAmount: 9200.00,
    targetDate: '2027-02-15',
    category: 'Previsión',
    color: '#0284c7'
  },
  {
    id: 'goal-3',
    name: 'Vacaciones Fin de Año (Playa)',
    targetAmount: 18000.00,
    currentAmount: 12400.00,
    targetDate: '2026-12-20',
    category: 'Viajes',
    color: '#f59e0b'
  }
];
