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
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { ExtraEmployee, WeeklyTimesheet, OvertimeSummary, AuditLog } from '@/types/extras';

const EXTRA_EMPLOYEES = 'extra_employees';
const EXTRA_TIMESHEETS = 'extra_weeklyTimesheets';
const EXTRA_SUMMARY = 'extra_overtimeSummary';
const EXTRA_AUDIT = 'extra_auditLogs';

export async function getActiveEmployees(): Promise<ExtraEmployee[]> {
  const q = query(
    collection(getDb(), EXTRA_EMPLOYEES),
    where('active', '==', true),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ExtraEmployee));
}

export async function getAllEmployees(): Promise<ExtraEmployee[]> {
  const q = query(collection(getDb(), EXTRA_EMPLOYEES), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ExtraEmployee));
}

export async function createEmployee(
  data: Omit<ExtraEmployee, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), EXTRA_EMPLOYEES), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateEmployee(
  id: string,
  data: Partial<Omit<ExtraEmployee, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(getDb(), EXTRA_EMPLOYEES, id);
  await updateDoc(docRef, data);
}

export async function deactivateEmployee(id: string): Promise<void> {
  const docRef = doc(getDb(), EXTRA_EMPLOYEES, id);
  await updateDoc(docRef, { active: false });
}

export async function getWeeklyTimesheet(
  employeeId: string,
  weekStart: Date
): Promise<WeeklyTimesheet | null> {
  const start = Timestamp.fromDate(weekStart);
  const q = query(
    collection(getDb(), EXTRA_TIMESHEETS),
    where('employeeId', '==', employeeId),
    where('weekStartDate', '==', start),
    orderBy('version', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WeeklyTimesheet;
}

export async function getWeeklyTimesheetsForEmployee(
  employeeId: string,
  year: number,
  month: number
): Promise<WeeklyTimesheet[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const q = query(
    collection(getDb(), EXTRA_TIMESHEETS),
    where('employeeId', '==', employeeId),
    where('weekStartDate', '>=', Timestamp.fromDate(monthStart)),
    where('weekStartDate', '<=', Timestamp.fromDate(monthEnd)),
    orderBy('weekStartDate', 'desc')
  );

  const snapshot = await getDocs(q);

  const versions = new Map<string, WeeklyTimesheet>();
  for (const docSnap of snapshot.docs) {
    const data = { id: docSnap.id, ...docSnap.data() } as WeeklyTimesheet;
    const weekKey = data.weekStartDate.toMillis().toString();
    if (!versions.has(weekKey) || (versions.get(weekKey)?.version ?? 0) < data.version) {
      versions.set(weekKey, data);
    }
  }

  return Array.from(versions.values());
}

export async function saveWeeklyTimesheet(
  data: Omit<WeeklyTimesheet, 'id' | 'calculatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), EXTRA_TIMESHEETS), {
    ...data,
    calculatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getOvertimeSummary(
  employeeId: string,
  year: number,
  month: string
): Promise<OvertimeSummary | null> {
  const q = query(
    collection(getDb(), EXTRA_SUMMARY),
    where('employeeId', '==', employeeId),
    where('year', '==', year),
    where('month', '==', month),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as OvertimeSummary;
}

export async function saveOvertimeSummary(
  data: Omit<OvertimeSummary, 'id' | 'updatedAt'>
): Promise<string> {
  const existing = await getOvertimeSummary(data.employeeId, data.year, data.month);
  if (existing) {
    const ref = doc(getDb(), EXTRA_SUMMARY, existing.id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
    return existing.id;
  }
  const docRef = await addDoc(collection(getDb(), EXTRA_SUMMARY), {
    ...data,
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function addAuditLog(
  data: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<string> {
  const docRef = await addDoc(collection(getDb(), EXTRA_AUDIT), {
    ...data,
    timestamp: Timestamp.now(),
  });
  return docRef.id;
}
