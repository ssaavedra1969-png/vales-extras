import { calculateDuration, parseTimeToDecimal } from './timeUtils';
import { ExtraDay } from '@/types/extras';

export function calculateDailyOvertime(
  scheduledStart: string,
  scheduledEnd: string,
  actualStart: string,
  actualEnd: string
): { overtimeHours: number; regularHours: number; totalHours: number } {
  if (!actualStart || !actualEnd) {
    return { overtimeHours: 0, regularHours: 0, totalHours: 0 };
  }

  const scheduledDuration = calculateDuration(scheduledStart, scheduledEnd);
  const actualDuration = calculateDuration(actualStart, actualEnd);

  if (actualDuration <= 0) {
    return { overtimeHours: 0, regularHours: 0, totalHours: 0 };
  }

  const overtimeHours = Math.max(0, actualDuration - scheduledDuration);
  const regularHours = Math.min(actualDuration, scheduledDuration);

  return {
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    totalHours: Math.round(actualDuration * 100) / 100,
  };
}

export function calculateWeekOvertime(
  days: Record<string, { scheduledStart: string; scheduledEnd: string; actualStart: string; actualEnd: string }>
): {
  days: Record<string, ExtraDay>;
  weekTotalOvertime: number;
} {
  let weekTotalOvertime = 0;
  const resultDays: Record<string, ExtraDay> = {};

  for (const [dayKey, dayData] of Object.entries(days)) {
    const result = calculateDailyOvertime(
      dayData.scheduledStart,
      dayData.scheduledEnd,
      dayData.actualStart,
      dayData.actualEnd
    );

    resultDays[dayKey] = {
      actualStart: dayData.actualStart,
      actualEnd: dayData.actualEnd,
      scheduledStart: dayData.scheduledStart,
      scheduledEnd: dayData.scheduledEnd,
      ...result,
    };

    weekTotalOvertime += result.overtimeHours;
  }

  return {
    days: resultDays,
    weekTotalOvertime: Math.round(weekTotalOvertime * 100) / 100,
  };
}
