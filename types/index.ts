import { Timestamp } from 'firebase/firestore';

export interface Vale {
  id: string;
  numero: string;
  empleado: string;
  monto: number;
  fechaPago: string;
  fechaGeneracion: Timestamp;
  estado: 'pendiente' | 'firmado' | 'descontado';
  mesDescuento?: string;
}

export interface ValeCreateInput {
  empleado: string;
  monto: number;
  fechaPago: string;
}

export interface Contador {
  id: string;
  ultimoNumero: number;
}

export interface ConfigEmpresa {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  cuit: string;
  conceptoVale: string;
}

export interface LogEntry {
  timestamp: Timestamp;
  tipo: 'error' | 'info' | 'warning';
  mensaje: string;
  datos?: unknown;
}

export interface ExcelRow {
  empleado: string;
  monto: number;
  fechaPago: string;
  error?: string;
}
