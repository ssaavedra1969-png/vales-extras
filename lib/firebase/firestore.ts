import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { Vale, Contador, ConfigEmpresa } from '@/types';

const VALES_COLLECTION = 'vales';
const CONTADORES_COLLECTION = 'contadores';
const LOGS_COLLECTION = 'logs';
const CONFIG_COLLECTION = 'config';

export async function getNextValeNumber(): Promise<string> {
  const counterRef = doc(db, CONTADORES_COLLECTION, 'vale_counter');

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let ultimoNumero = 0;

    if (!counterDoc.exists()) {
      transaction.set(counterRef, { ultimoNumero: 0 });
    } else {
      ultimoNumero = counterDoc.data().ultimoNumero;
    }

    const nuevoNumero = ultimoNumero + 1;
    transaction.update(counterRef, { ultimoNumero: nuevoNumero });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const correlativo = String(nuevoNumero).padStart(5, '0');

    return `FALPAT-${year}-${month}-${correlativo}`;
  });
}

export async function createVale(
  valeData: Omit<Vale, 'id' | 'fechaGeneracion'>
): Promise<string> {
  const docRef = await addDoc(collection(db, VALES_COLLECTION), {
    ...valeData,
    fechaGeneracion: Timestamp.now(),
  });
  return docRef.id;
}

export async function getVales(options?: {
  estado?: string;
  empleado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<{ vales: Vale[]; total: number; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const pageSize = options?.pageSize || 20;
  let q = query(collection(db, VALES_COLLECTION), orderBy('numero', 'desc'));

  if (options?.estado && options.estado !== 'todos') {
    q = query(q, where('estado', '==', options.estado));
  }

  if (options?.empleado) {
    q = query(
      q,
      where('empleado', '>=', options.empleado),
      where('empleado', '<=', options.empleado + '\uf8ff')
    );
  }

  if (options?.lastDoc) {
    q = query(q, startAfter(options.lastDoc), limit(pageSize));
  } else {
    q = query(q, limit(pageSize));
  }

  const snapshot = await getDocs(q);
  const vales: Vale[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Vale[];

  const totalSnapshot = await getDocs(collection(db, VALES_COLLECTION));
  const total = totalSnapshot.size;

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { vales, total, lastDoc: lastVisible as QueryDocumentSnapshot<DocumentData> | null };
}

export async function getValeById(id: string): Promise<Vale | null> {
  const docRef = doc(db, VALES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Vale;
}

export async function updateValeEstado(
  id: string,
  estado: 'pendiente' | 'firmado' | 'descontado',
  mesDescuento?: string
): Promise<void> {
  const docRef = doc(db, VALES_COLLECTION, id);
  const updateData: Record<string, unknown> = { estado };
  if (mesDescuento) updateData.mesDescuento = mesDescuento;
  await updateDoc(docRef, updateData);
}

export async function deleteVale(id: string): Promise<void> {
  await deleteDoc(doc(db, VALES_COLLECTION, id));
}

export async function getValesByMes(
  mes: string,
  estado: string = 'firmado'
): Promise<Vale[]> {
  const q = query(
    collection(db, VALES_COLLECTION),
    where('estado', '==', estado),
    orderBy('numero', 'asc')
  );
  const snapshot = await getDocs(q);
  const vales: Vale[] = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Vale))
    .filter((vale) => {
      const fecha = vale.fechaPago.split('/');
      const mesVale = `${fecha[2]}-${fecha[1]}`;
      return mesVale === mes;
    });
  return vales;
}

export async function getConfigEmpresa(): Promise<ConfigEmpresa | null> {
  const docRef = doc(db, CONFIG_COLLECTION, 'empresa');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as ConfigEmpresa;
}

export async function saveConfigEmpresa(config: ConfigEmpresa): Promise<void> {
  const docRef = doc(db, CONFIG_COLLECTION, 'empresa');
  await updateDoc(docRef, { ...config });
}

export async function initConfigEmpresa(config: ConfigEmpresa): Promise<void> {
  const docRef = doc(db, CONFIG_COLLECTION, 'empresa');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await addDoc(collection(db, CONFIG_COLLECTION), { ...config });
  }
}

export async function addLog(
  tipo: 'error' | 'info' | 'warning',
  mensaje: string,
  datos?: unknown
): Promise<void> {
  await addDoc(collection(db, LOGS_COLLECTION), {
    timestamp: Timestamp.now(),
    tipo,
    mensaje,
    datos: datos || null,
  });
}
