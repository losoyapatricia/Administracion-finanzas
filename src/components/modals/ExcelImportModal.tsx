import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useFinance } from '../../context/FinanceContext';
import { Expense, PaymentMethod } from '../../types/finance';
import { formatMXN, formatDateES, getQuincenaFromDate } from '../../utils/quincena';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  date: string;
  establishment: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethod;
  ticketNumber?: string;
  quincenaLabel: string;
  isValid: boolean;
  validationError?: string;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  'Tarjeta de Débito',
  'Tarjeta de Crédito',
  'Efectivo',
  'Transferencia SPEI',
  'Vales de Despensa',
  'Otro'
];

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { categories, batchAddExpenses } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  // Column Mappings
  const [colDate, setColDate] = useState('');
  const [colEst, setColEst] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colAmount, setColAmount] = useState('');
  const [colCategory, setColCategory] = useState('');
  const [colPayment, setColPayment] = useState('');
  const [colTicket, setColTicket] = useState('');

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');

  if (!isOpen) return null;

  // Helper to parse dates from Excel serial or string
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    // If it's a number (Excel serial timestamp)
    if (typeof val === 'number') {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    // If it's Date object
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // String processing
    const str = String(val).trim();
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split('-');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3];
      return `${y}-${m}-${d}`;
    }
    // Fallback try Date.parse
    const timestamp = Date.parse(str);
    if (!isNaN(timestamp)) {
      const dObj = new Date(timestamp);
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const d = String(dObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  // Helper to parse numbers
  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return Math.abs(val);
    if (!val) return 0;
    const cleanStr = String(val).replace(/[$€,\sMXN]/gi, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : Math.abs(num);
  };

  // Match category
  const matchCategory = (catNameInput: any): { id: string; name: string } => {
    if (!catNameInput) {
      const otros = categories.find((c) => c.name.toLowerCase() === 'otros') || categories[0];
      return { id: otros.id, name: otros.name };
    }
    const cleanInput = String(catNameInput).trim().toLowerCase();
    const matched = categories.find(
      (c) => c.name.toLowerCase() === cleanInput || cleanInput.includes(c.name.toLowerCase())
    );
    if (matched) {
      return { id: matched.id, name: matched.name };
    }
    const otros = categories.find((c) => c.name.toLowerCase() === 'otros') || categories[0];
    return { id: otros.id, name: otros.name };
  };

  // Match payment method
  const matchPaymentMethod = (input: any): PaymentMethod => {
    if (!input) return 'Tarjeta de Débito';
    const str = String(input).trim().toLowerCase();
    if (str.includes('efectivo') || str.includes('cash')) return 'Efectivo';
    if (str.includes('crédito') || str.includes('credito') || str.includes('credit')) return 'Tarjeta de Crédito';
    if (str.includes('débito') || str.includes('debito') || str.includes('debit')) return 'Tarjeta de Débito';
    if (str.includes('spei') || str.includes('transf')) return 'Transferencia SPEI';
    if (str.includes('vale') || str.includes('despensa')) return 'Vales de Despensa';
    return 'Tarjeta de Débito';
  };

  // Process uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          alert('El archivo no contiene filas de datos.');
          setIsProcessing(false);
          return;
        }

        const headers = Object.keys(data[0]);
        setRawHeaders(headers);
        setRawRows(data);

        // Auto-detect columns
        let dCol = headers.find((h) => /fecha|date|dia/i.test(h)) || '';
        let eCol = headers.find((h) => /establecimiento|comercio|tienda|lugar|proveedor|merchant/i.test(h)) || '';
        let descCol = headers.find((h) => /descripcion|concepto|detalle|compra|notas/i.test(h)) || '';
        let aCol = headers.find((h) => /monto|importe|cantidad|cargo|precio|total|gasto|amount/i.test(h)) || '';
        let cCol = headers.find((h) => /categoria|rubro|tipo/i.test(h)) || '';
        let pCol = headers.find((h) => /metodo|forma|cuenta/i.test(h)) || '';
        let tCol = headers.find((h) => /ticket|folio|factura|recibo|ref/i.test(h)) || '';

        // If establishment wasn't found, try first text column or concept
        if (!eCol && descCol) {
          eCol = descCol;
        } else if (!eCol && headers.length > 1) {
          eCol = headers[1];
        }

        // If description wasn't found, fallback to establishment or concept
        if (!descCol) {
          descCol = eCol || headers[0];
        }

        setColDate(dCol || headers[0]);
        setColEst(eCol || (headers[1] || headers[0]));
        setColDesc(descCol || (headers[2] || headers[0]));
        setColAmount(aCol || headers[headers.length - 1]);
        setColCategory(cCol);
        setColPayment(pCol);
        setColTicket(tCol);

        setStep('map');
      } catch (err) {
        console.error(err);
        alert('Ocurrió un error al procesar el archivo. Verifica que sea un Excel (.xlsx, .xls) o CSV válido.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Convert raw rows using active mappings
  const handleProceedToPreview = () => {
    const list: ParsedRow[] = rawRows.map((row) => {
      const rawDate = row[colDate];
      const parsedDate = parseExcelDate(rawDate);
      const est = String(row[colEst] || 'Comercio').trim();
      const desc = String(row[colDesc] || est || 'Compra registrada').trim();
      const amt = parseAmount(row[colAmount]);
      const cat = matchCategory(colCategory ? row[colCategory] : '');
      const pm = matchPaymentMethod(colPayment ? row[colPayment] : '');
      const ticket = colTicket ? String(row[colTicket]).trim() : '';

      let isValid = true;
      let error = '';

      if (!parsedDate) {
        isValid = false;
        error = 'Fecha no válida';
      } else if (amt <= 0) {
        isValid = false;
        error = 'Monto debe ser mayor a 0';
      }

      let qLabel = 'Sin quincena';
      if (parsedDate) {
        try {
          const qInfo = getQuincenaFromDate(parsedDate);
          qLabel = qInfo.shortLabel;
        } catch (e) {
          isValid = false;
          error = 'Error en quincena';
        }
      }

      return {
        date: parsedDate,
        establishment: est || 'Comercio no especificado',
        description: desc || est,
        amount: amt,
        categoryId: cat.id,
        categoryName: cat.name,
        paymentMethod: pm,
        ticketNumber: ticket || undefined,
        quincenaLabel: qLabel,
        isValid,
        validationError: error
      };
    });

    setParsedRows(list);
    setStep('preview');
  };

  // Confirm and import
  const handleConfirmImport = () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      alert('No hay registros válidos para importar.');
      return;
    }

    const expensesToSave: Omit<Expense, 'id' | 'quincenaId' | 'year' | 'createdAt' | 'updatedAt'>[] = validItems.map((r) => ({
      date: r.date,
      establishment: r.establishment,
      description: r.description,
      amount: r.amount,
      categoryId: r.categoryId,
      paymentMethod: r.paymentMethod,
      ticketNumber: r.ticketNumber
    }));

    batchAddExpenses(expensesToSave);
    onClose();
  };

  // Download sample template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        FECHA: '2026-10-05',
        ESTABLECIMIENTO: 'Walmart Supercenter',
        DESCRIPCION: 'Despensa quincenal completa',
        MONTO: 1850.50,
        CATEGORIA: 'Alimentación',
        METODO_PAGO: 'Tarjeta de Débito',
        TICKET: 'WMT-98102'
      },
      {
        FECHA: '2026-10-08',
        ESTABLECIMIENTO: 'Gasolinera Pemex',
        DESCRIPCION: 'Tanque lleno Magna',
        MONTO: 950.00,
        CATEGORIA: 'Transporte',
        METODO_PAGO: 'Tarjeta de Crédito',
        TICKET: 'PMX-4421'
      },
      {
        FECHA: '2026-10-18',
        ESTABLECIMIENTO: 'CFE Suministrador',
        DESCRIPCION: 'Recibo bimestral luz',
        MONTO: 620.00,
        CATEGORIA: 'Servicios',
        METODO_PAGO: 'Transferencia SPEI',
        TICKET: 'CFE-0912'
      },
      {
        FECHA: '2026-10-22',
        ESTABLECIMIENTO: 'Farmacias Benavides',
        DESCRIPCION: 'Medicamentos y analgésicos',
        MONTO: 340.00,
        CATEGORIA: 'Salud',
        METODO_PAGO: 'Efectivo',
        TICKET: 'FB-1902'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
    XLSX.writeFile(wb, 'Plantilla_Importar_Gastos_Finanzas.xlsx');
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const totalAmountValid = parsedRows.filter((r) => r.isValid).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Subir y Registrar Gastos desde Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                Importa tus gastos masivamente asignando automáticamente su quincena y categoría.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Arrastra tu archivo aquí o selecciona desde tu equipo
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  Formatos compatibles: libros de Microsoft Excel (<strong>.xlsx, .xls</strong>) o archivos de valores separados por coma (<strong>.csv</strong>).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-upload-input"
                />
                <label
                  htmlFor="excel-file-upload-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Seleccionar Archivo de Excel</span>
                </label>
              </div>

              {/* Sample Template Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">¿No tienes un formato listo?</h5>
                    <p className="text-2xs text-slate-500">
                      Descarga nuestra plantilla de Excel con columnas listas y ejemplos de gastos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap self-end sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Descargar Plantilla (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'map' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Archivo cargado: <span className="font-mono">{fileName}</span>
                  </p>
                  <p className="text-2xs text-emerald-800">
                    Se detectaron {rawRows.length} filas. Revisa o confirma las columnas detectadas.
                  </p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna de Fecha *
                  </label>
                  <select
                    value={colDate}
                    onChange={(e) => setColDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna de Monto / Importe (MXN) *
                  </label>
                  <select
                    value={colAmount}
                    onChange={(e) => setColAmount(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna de Establecimiento / Comercio *
                  </label>
                  <select
                    value={colEst}
                    onChange={(e) => setColEst(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna de Descripción / Detalle
                  </label>
                  <select
                    value={colDesc}
                    onChange={(e) => setColDesc(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna de Categoría (opcional)
                  </label>
                  <select
                    value={colCategory}
                    onChange={(e) => setColCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- No incluir (Asignar a "Otros") --</option>
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Columna de Método de Pago (opcional)
                  </label>
                  <select
                    value={colPayment}
                    onChange={(e) => setColPayment(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- No incluir (Asignar a Débito) --</option>
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continuar a Vista Previa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-2xs text-slate-500 uppercase font-semibold">Total Registros</span>
                  <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{parsedRows.length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-2xs text-emerald-700 uppercase font-semibold">Filas Válidas a Importar</span>
                  <p className="text-lg font-bold text-emerald-800 font-mono mt-0.5">{validCount}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-2xs text-slate-500 uppercase font-semibold">Suma Total a Importar</span>
                  <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{formatMXN(totalAmountValid, false)}</p>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hay {invalidCount} fila(s) con fechas inválidas o montos en cero que serán omitidas.
                  </span>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-2xs">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Estado</th>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Establecimiento</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3">Categoría</th>
                      <th className="py-2 px-3">Quincena</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-rose-600 font-semibold" title={row.validationError}>
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">{row.date || '—'}</td>
                        <td className="py-2 px-3 font-semibold truncate max-w-[120px]">{row.establishment}</td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[140px]">{row.description}</td>
                        <td className="py-2 px-3">{row.categoryName}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.quincenaLabel}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatMXN(row.amount, false)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-2xs text-slate-400 text-center font-mono">
                  Mostrando las primeras 50 filas de {parsedRows.length}. Todas las filas válidas serán importadas.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step === 'preview' ? (
            <button
              type="button"
              onClick={() => setStep('map')}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              ← Volver a Asignar Columnas
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validCount === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Importar {validCount} Gastos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
