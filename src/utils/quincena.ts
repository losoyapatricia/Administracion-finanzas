import { QuincenaInfo } from '../types/finance';

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTH_NAMES_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Gets the last day of a given month in a specific year.
 */
export function getLastDayOfMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/**
 * Given a date string (YYYY-MM-DD) or Date object, determines which quincena it belongs to.
 * 1st Quincena: days 1 to 15
 * 2nd Quincena: days 16 to end of month
 */
export function getQuincenaFromDate(dateInput: string | Date): QuincenaInfo {
  const d = typeof dateInput === 'string' ? new Date(`${dateInput}T12:00:00`) : dateInput;
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  const quincenaNumber: 1 | 2 = day <= 15 ? 1 : 2;

  return buildQuincenaInfo(year, month, quincenaNumber);
}

/**
 * Builds the QuincenaInfo object for a given year, month (1-12), and quincena number (1 or 2).
 */
export function buildQuincenaInfo(year: number, month: number, quincenaNumber: 1 | 2): QuincenaInfo {
  const monthIndex0 = month - 1;
  const monthName = MONTH_NAMES_ES[monthIndex0] || `Mes ${month}`;
  const shortMonth = MONTH_NAMES_SHORT_ES[monthIndex0] || `M${month}`;
  const monthStr = String(month).padStart(2, '0');
  const id = `${year}-${monthStr}-Q${quincenaNumber}`;
  const label = `${quincenaNumber}ª Quincena de ${monthName} ${year}`;
  const shortLabel = `${quincenaNumber}Q ${shortMonth} ${year}`;

  const lastDay = getLastDayOfMonth(year, monthIndex0);
  const startDate = quincenaNumber === 1 
    ? `${year}-${monthStr}-01` 
    : `${year}-${monthStr}-16`;
  const endDate = quincenaNumber === 1 
    ? `${year}-${monthStr}-15` 
    : `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  return {
    id,
    year,
    month,
    monthName,
    quincenaNumber,
    label,
    shortLabel,
    startDate,
    endDate
  };
}

/**
 * Generates a chronological list of Quincenas for a range of years (e.g. 2025 - 2027).
 */
export function generateQuincenasForYear(year: number): QuincenaInfo[] {
  const list: QuincenaInfo[] = [];
  for (let m = 1; m <= 12; m++) {
    list.push(buildQuincenaInfo(year, m, 1));
    list.push(buildQuincenaInfo(year, m, 2));
  }
  return list;
}

/**
 * Gets previous and next quincena info.
 */
export function getAdjacentQuincenas(quincenaId: string): { prev: QuincenaInfo; next: QuincenaInfo } {
  const parts = quincenaId.split('-'); // ["2026", "10", "Q2"]
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const qNum = parts[2] === 'Q2' ? 2 : 1;

  // Previous
  let prevYear = year;
  let prevMonth = month;
  let prevQ: 1 | 2 = 1;
  if (qNum === 2) {
    prevQ = 1;
  } else {
    prevQ = 2;
    prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = year - 1;
    }
  }

  // Next
  let nextYear = year;
  let nextMonth = month;
  let nextQ: 1 | 2 = 2;
  if (qNum === 1) {
    nextQ = 2;
  } else {
    nextQ = 1;
    nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
  }

  return {
    prev: buildQuincenaInfo(prevYear, prevMonth, prevQ),
    next: buildQuincenaInfo(nextYear, nextMonth, nextQ)
  };
}

/**
 * Formats currency in Mexican Pesos (MXN).
 * Example: formatMXN(1250.5) => "$1,250.50 MXN"
 */
export function formatMXN(amount: number, showCurrencyCode: boolean = true): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showCurrencyCode ? `${formatted} MXN` : formatted;
}

/**
 * Formats a date string (YYYY-MM-DD) into Spanish format.
 * Example: "2026-10-23" => "23 de octubre de 2026"
 */
export function formatDateES(dateString: string, short: boolean = false): string {
  if (!dateString) return '';
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  const d = parseInt(dayStr, 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateString;

  if (short) {
    return `${d} ${MONTH_NAMES_SHORT_ES[m]} ${y}`;
  }
  return `${d} de ${MONTH_NAMES_ES[m]} de ${y}`;
}

/**
 * Get current date formatted as YYYY-MM-DD
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Resizes and compresses an image file to a base64 JPEG data URL suitable for local storage
 */
export async function compressReceiptImage(file: File, maxDimension: number = 1000, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed jpeg data url
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
