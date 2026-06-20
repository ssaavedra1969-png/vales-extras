import { Timestamp } from 'firebase/firestore';

export interface ExtraEmployee {
  id: string;
  name: string;
  active: boolean;
  scheduledStart: string;
  scheduledEnd: string;
  workingDays: string[];
  createdAt: Timestamp;
}

export interface ExtraDay {
  actualStart: string;
  actualEnd: string;
  scheduledStart: string;
  scheduledEnd: string;
  overtimeHours: number;
  regularHours: number;
  totalHours: number;
}

export interface WeeklyTimesheet {
  id: string;
  weekStartDate: Timestamp;
  weekEndDate: Timestamp;
  employeeId: string;
  employeeName: string;
  days: Record<string, ExtraDay>;
  weekTotalOvertime: number;
  calculatedAt: Timestamp;
  version: number;
}

export interface OvertimeSummary {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  totalOvertime: number;
  weeks: {
    weekStart: string;
    overtime: number;
  }[];
  updatedAt: Timestamp;
}

export interface AuditLog {
  id: string;
  action: 'CREATE_WEEKLY' | 'UPDATE_WEEKLY' | 'DELETE_WEEKLY';
  employeeId: string;
  weekStart: Timestamp;
  changes?: Record<string, unknown>;
  performedBy: string;
  timestamp: Timestamp;
}
