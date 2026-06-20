import { Timestamp } from 'firebase/firestore';

export interface Vale {
  id: string;
  numero: string;
  legajo: string;
  empleado: string;
  monto: number;
  fechaPago: string;
  fechaGeneracion: Timestamp;
  estado: 'pendiente' | 'firmado' | 'confirmado' | 'descontado';
  mesDescuento?: string;
}

export interface ValeCreateInput {
  legajo: string;
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
  legajo: string;
  empleado: string;
  monto: number;
  fechaPago: string;
  error?: string;
}
