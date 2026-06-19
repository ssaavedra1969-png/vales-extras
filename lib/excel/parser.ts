import * as XLSX from 'xlsx';
import { ExcelRow } from '@/types';
import { format, parse } from 'date-fns';

export function parseExcelFile(buffer: ArrayBuffer): {
  filasValidas: ExcelRow[];
  filasInvalidas: ExcelRow[];
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(
    worksheet,
    { header: 1 }
  );

  const filasValidas: ExcelRow[] = [];
  const filasInvalidas: ExcelRow[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 3) continue;

    const empleado = String(row[0] || '').trim();
    const montoRaw = row[1];
    const fechaRaw = row[2];

    const errores: string[] = [];

    if (!empleado) {
      errores.push('Nombre de empleado vacío');
    }

    let monto = 0;
    if (montoRaw === undefined || montoRaw === null || montoRaw === '') {
      errores.push('Monto vacío');
    } else {
      monto = parseFloat(String(montoRaw).replace(',', '.'));
      if (isNaN(monto) || monto <= 0) {
        errores.push('Monto inválido o negativo');
      }
    }

    let fechaPago = '';
    if (!fechaRaw || fechaRaw === '') {
      errores.push('Fecha vacía');
    } else {
      const fechaStr = String(fechaRaw).trim();
      const parsedDate = parse(fechaStr, 'dd/MM/yyyy', new Date());
      if (isNaN(parsedDate.getTime())) {
        errores.push('Formato de fecha inválido (debe ser dd/mm/yyyy)');
      } else {
        fechaPago = format(parsedDate, 'dd/MM/yyyy');
      }
    }

    const rowData: ExcelRow = {
      empleado,
      monto,
      fechaPago,
    };

    if (errores.length > 0) {
      rowData.error = errores.join('; ');
      filasInvalidas.push(rowData);
    } else {
      filasValidas.push(rowData);
    }
  }

  return { filasValidas, filasInvalidas };
}
