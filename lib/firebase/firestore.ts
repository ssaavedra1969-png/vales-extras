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
import { getDb } from './config';
import { Vale, Contador, ConfigEmpresa } from '@/types';

const VALES_COLLECTION = 'vales';
const VALES_CONFIRMADOS_COLLECTION = 'vales_confirmados';
const VALES_HISTORIAL_COLLECTION = 'vales_historial';
const CONTADORES_COLLECTION = 'contadores';
const LOGS_COLLECTION = 'logs';
const CONFIG_COLLECTION = 'config';

export async function getNextValeNumber(): Promise<string> {
  const counterRef = doc(getDb(), CONTADORES_COLLECTION, 'vale_counter');

  return await runTransaction(getDb(), async (transaction) => {
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

    return `${year}${month} - ${correlativo}`;
  });
}

export async function createVale(
  valeData: Omit<Vale, 'id' | 'fechaGeneracion'>
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), VALES_COLLECTION), {
    ...valeData,
    fechaGeneracion: Timestamp.now(),
  });
  return docRef.id;
}

export async function getVales(options?: {
  estado?: string;
  coleccion?: string;
  empleado?: string;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<{ vales: Vale[]; total: number; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const coleccion = options?.coleccion || VALES_COLLECTION;
  const pageSize = options?.pageSize || 50;
  const constraints = [];

  if (options?.estado && options.estado !== 'todos') {
    constraints.push(where('estado', '==', options.estado));
  }

  if (options?.empleado) {
    constraints.push(
      where('empleado', '>=', options.empleado),
      where('empleado', '<=', options.empleado + '\uf8ff')
    );
  }

  constraints.push(orderBy('numero', 'desc'));

  if (options?.lastDoc) {
    constraints.push(startAfter(options.lastDoc));
  }
  constraints.push(limit(pageSize));

  const q = query(collection(getDb(), coleccion), ...constraints);
  const snapshot = await getDocs(q);
  const vales: Vale[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Vale[];

  const totalSnapshot = await getDocs(collection(getDb(), coleccion));
  const total = totalSnapshot.size;

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { vales, total, lastDoc: lastVisible as QueryDocumentSnapshot<DocumentData> | null };
}

export async function getValeById(id: string, coleccion: string = VALES_COLLECTION): Promise<Vale | null> {
  const docRef = doc(getDb(), coleccion, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Vale;
}

export async function updateValeEstado(
  id: string,
  estado: 'pendiente' | 'firmado' | 'confirmado' | 'descontado',
  coleccion: string = VALES_COLLECTION,
  mesDescuento?: string
): Promise<void> {
  const docRef = doc(getDb(), coleccion, id);
  const updateData: Record<string, unknown> = { estado };
  if (mesDescuento) updateData.mesDescuento = mesDescuento;
  await updateDoc(docRef, updateData);
}

export async function deleteVale(id: string, coleccion: string = VALES_COLLECTION): Promise<void> {
  await deleteDoc(doc(getDb(), coleccion, id));
}

export async function confirmarVale(id: string): Promise<void> {
  const db = getDb();
  const sourceRef = doc(db, VALES_COLLECTION, id);
  const sourceDoc = await getDoc(sourceRef);
  if (!sourceDoc.exists()) throw new Error('Vale no encontrado');

  const data = sourceDoc.data();

  await addDoc(collection(db, VALES_CONFIRMADOS_COLLECTION), {
    ...data,
    estado: 'confirmado',
  });

  await deleteDoc(sourceRef);
}

export async function descontarVale(id: string, mesDescuento: string): Promise<void> {
  const db = getDb();
  const sourceRef = doc(db, VALES_CONFIRMADOS_COLLECTION, id);
  const sourceDoc = await getDoc(sourceRef);
  if (!sourceDoc.exists()) throw new Error('Vale no encontrado');

  const data = sourceDoc.data();

  await addDoc(collection(db, VALES_HISTORIAL_COLLECTION), {
    ...data,
    estado: 'descontado',
    mesDescuento,
  });

  await deleteDoc(sourceRef);
}

export async function getValesByMes(
  mes: string,
  coleccion: string = VALES_CONFIRMADOS_COLLECTION
): Promise<Vale[]> {
  const q = query(
    collection(getDb(), coleccion),
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
  const docRef = doc(getDb(), CONFIG_COLLECTION, 'empresa');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as ConfigEmpresa;
}

export async function saveConfigEmpresa(config: ConfigEmpresa): Promise<void> {
  const docRef = doc(getDb(), CONFIG_COLLECTION, 'empresa');
  await updateDoc(docRef, { ...config });
}

export async function initConfigEmpresa(config: ConfigEmpresa): Promise<void> {
  const docRef = doc(getDb(), CONFIG_COLLECTION, 'empresa');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await addDoc(collection(getDb(), CONFIG_COLLECTION), { ...config });
  }
}

export async function addLog(
  tipo: 'error' | 'info' | 'warning',
  mensaje: string,
  datos?: unknown
): Promise<void> {
  await addDoc(collection(getDb(), LOGS_COLLECTION), {
    timestamp: Timestamp.now(),
    tipo,
    mensaje,
    datos: datos || null,
  });
}
