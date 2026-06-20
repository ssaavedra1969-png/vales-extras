'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Calendar, Clock, BadgeCheck } from 'lucide-react';
import { ExtraEmployee, WeeklyTimesheet, ExtraDay } from '@/types/extras';
import { getActiveEmployees, getWeeklyTimesheet, saveWeeklyTimesheet, addAuditLog } from '@/lib/extras/firestore';
import { getWeekStartDate, getWeekEndDate, DAYS_OF_WEEK, DAY_LABELS, DAY_LABELS_FULL, formatDateISO, formatDecimalToHours } from '@/lib/extras/timeUtils';
import { calculateWeekOvertime, calculateDailyOvertime } from '@/lib/extras/overtimeCalculator';
import { Timestamp } from 'firebase/firestore';

type DayData = {
  actualStart: string;
  actualEnd: string;
};

type EmployeeDayData = Record<string, DayData>;

export default function ExtrasPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStartDate());
  const [employees, setEmployees] = useState<ExtraEmployee[]>([]);
  const [entries, setEntries] = useState<Record<string, EmployeeDayData>>({});
  const [savedWeeks, setSavedWeeks] = useState<Record<string, boolean>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [calculando, setCalculando] = useState<Record<string, ExtraDay>>({});
  const { toast } = useToast();

  const weekEnd = getWeekEndDate(weekStart);
  const weekLabel = `Semana ${formatDateISO(weekStart)} al ${formatDateISO(weekEnd)}`;

  const cargarSemana = useCallback(async () => {
    setCargando(true);
    try {
      const emps = await getActiveEmployees();
      setEmployees(emps);

      const initEntries: Record<string, EmployeeDayData> = {};
      const initSaved: Record<string, boolean> = {};
      const initCalc: Record<string, ExtraDay> = {};

      for (const emp of emps) {
        initEntries[emp.id] = {};
        for (const day of emp.workingDays) {
          initEntries[emp.id][day] = { actualStart: emp.scheduledStart, actualEnd: emp.scheduledEnd };
        }
        initCalc[emp.id] = { actualStart: '', actualEnd: '', scheduledStart: emp.scheduledStart, scheduledEnd: emp.scheduledEnd, overtimeHours: 0, regularHours: 0, totalHours: 0 };

        const existing = await getWeeklyTimesheet(emp.id, weekStart);
        if (existing) {
          initSaved[emp.id] = true;
          for (const day of emp.workingDays) {
            if (existing.days[day]) {
              initEntries[emp.id][day] = {
                actualStart: existing.days[day].actualStart,
                actualEnd: existing.days[day].actualEnd,
              };
            }
          }
        }
      }

      setEntries(initEntries);
      setSavedWeeks(initSaved);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  }, [weekStart, toast]);

  useEffect(() => {
    cargarSemana();
  }, [weekStart]);

  const updateEntry = (empId: string, day: string, field: 'actualStart' | 'actualEnd', value: string) => {
    setEntries((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [day]: { ...prev[empId]?.[day], [field]: value },
      },
    }));
    setSavedWeeks((prev) => ({ ...prev, [empId]: false }));
  };

  const previewOvertime = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return null;

    const days: Record<string, { scheduledStart: string; scheduledEnd: string; actualStart: string; actualEnd: string }> = {};
    let totalPreview = 0;

    for (const day of emp.workingDays) {
      const entry = entries[empId]?.[day];
      days[day] = {
        scheduledStart: emp.scheduledStart,
        scheduledEnd: emp.scheduledEnd,
        actualStart: entry?.actualStart || '',
        actualEnd: entry?.actualEnd || '',
      };
      const result = calculateDailyOvertime(
        emp.scheduledStart,
        emp.scheduledEnd,
        entry?.actualStart || '',
        entry?.actualEnd || ''
      );
      totalPreview += result.overtimeHours;
    }

    return Math.round(totalPreview * 100) / 100;
  };

  const guardarSemana = async () => {
    setGuardando(true);
    let ok = 0;

    for (const emp of employees) {
      const days: Record<string, { scheduledStart: string; scheduledEnd: string; actualStart: string; actualEnd: string }> = {};
      for (const day of emp.workingDays) {
        const entry = entries[emp.id]?.[day];
        days[day] = {
          scheduledStart: emp.scheduledStart,
          scheduledEnd: emp.scheduledEnd,
          actualStart: entry?.actualStart || '',
          actualEnd: entry?.actualEnd || '',
        };
      }

      const calculated = calculateWeekOvertime(days);

      const existingVersion = savedWeeks[emp.id] ? 1 : 0;
      const lastVersion = existingVersion;

      try {
        await saveWeeklyTimesheet({
          weekStartDate: Timestamp.fromDate(weekStart),
          weekEndDate: Timestamp.fromDate(weekEnd),
          employeeId: emp.id,
          employeeName: emp.name,
          days: calculated.days,
          weekTotalOvertime: calculated.weekTotalOvertime,
          version: lastVersion + 1,
        });

        await addAuditLog({
          action: existingVersion > 0 ? 'UPDATE_WEEKLY' : 'CREATE_WEEKLY',
          employeeId: emp.id,
          weekStart: Timestamp.fromDate(weekStart),
          performedBy: 'admin',
        });

        ok++;
      } catch (e) {
        console.error(`Error guardando ${emp.name}:`, e);
      }
    }

    toast({
      title: 'Semana guardada',
      description: `${ok} de ${employees.length} empleados guardados correctamente`,
      variant: 'success',
    });

    cargarSemana();
    setGuardando(false);
  };

  const cambiarSemana = (offset: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset * 7);
    setWeekStart(d);
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-white">Carga Horaria Semanal</h1>
        <p className="text-[#B0B0D0]">Ingresá las horas reales trabajadas para calcular extras</p>
      </div>

      <div className="animate-fadeInUp stagger-1">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Seleccionar semana</CardTitle>
            <CardDescription className="text-[#B0B0D0]">{weekLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="outline" size="sm" onClick={() => cambiarSemana(-1)} className="bg-white/5 border-white/10 text-[#B0B0D0] hover:bg-white/10 hover:text-white rounded-xl">
                ← Semana anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getWeekStartDate(new Date()))} className="bg-white/5 border-white/10 text-[#B0B0D0] hover:bg-white/10 hover:text-white rounded-xl">
                Semana actual
              </Button>
              <Button variant="outline" size="sm" onClick={() => cambiarSemana(1)} className="bg-white/5 border-white/10 text-[#B0B0D0] hover:bg-white/10 hover:text-white rounded-xl">
                Semana siguiente →
              </Button>
              <Button variant="default" size="sm" onClick={cargarSemana} disabled={cargando} className="btn-nebula text-sm !py-1.5 !px-4">
                <Calendar className="h-4 w-4 mr-1" /> Cargar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fadeInUp stagger-2">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-white text-lg">Planilla semanal</CardTitle>
                <CardDescription className="text-[#6B6B8A]">
                  {employees.length} empleados activos
                </CardDescription>
              </div>
              <Button
                variant="default"
                onClick={guardarSemana}
                disabled={guardando || employees.length === 0}
                className="btn-nebula text-sm !py-2 !px-6"
              >
                {guardando ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> GUARDAR SEMANA</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {cargando ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#6C3CE1]" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#B0B0D0]">No hay empleados activos</p>
                <p className="text-sm text-[#6B6B8A]">Agregá empleados desde la sección Empleados</p>
              </div>
            ) : (
              <div className="min-w-[900px] border border-white/5 rounded-xl overflow-hidden">
                <Table className="table-nebula">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Empleado</TableHead>
                      <TableHead className="w-28">Programado</TableHead>
                      {DAYS_OF_WEEK.map((day, idx) => {
                        const dayDate = new Date(weekStart);
                        dayDate.setDate(dayDate.getDate() + idx);
                        return (
                          <TableHead key={day} className="text-center min-w-[130px]">
                            <div className="text-xs font-bold text-white uppercase">{DAY_LABELS[day]}</div>
                            <div className="text-[10px] text-[#6C3CE1] font-mono mt-0.5">
                              {String(dayDate.getDate()).padStart(2, '0')}/{String(dayDate.getMonth() + 1).padStart(2, '0')}
                            </div>
                          </TableHead>
                        );
                      })}
                      <TableHead className="w-20 text-center">Total Extra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const totalExtra = previewOvertime(emp.id);

                      return (
                        <TableRow key={emp.id} className={savedWeeks[emp.id] ? 'bg-[#00E676]/5' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              {savedWeeks[emp.id] && <BadgeCheck className="h-3.5 w-3.5 text-[#00E676] shrink-0" />}
                              <span className="truncate text-white">{emp.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono whitespace-nowrap text-[#B0B0D0]">
                            <Clock className="h-3 w-3 inline mr-1 text-[#6B6B8A]" />
                            {emp.scheduledStart} - {emp.scheduledEnd}
                          </TableCell>
                          {DAYS_OF_WEEK.map((day) => {
                            const isWorkingDay = emp.workingDays.includes(day);
                            const entry = entries[emp.id]?.[day];

                            if (!isWorkingDay) {
                              return <TableCell key={day} className="text-[#6B6B8A] text-xs text-center">—</TableCell>;
                            }

                            const result = calculateDailyOvertime(
                              emp.scheduledStart,
                              emp.scheduledEnd,
                              entry?.actualStart || '',
                              entry?.actualEnd || ''
                            );

                            return (
                              <TableCell key={day} className="p-1">
                                <div className="flex flex-col gap-0.5 items-center">
                                  <div className="flex gap-0.5">
                                    <Input
                                      placeholder="Entrada"
                                      value={entry?.actualStart || ''}
                                      onChange={(e) => updateEntry(emp.id, day, 'actualStart', e.target.value)}
                                      className="h-7 text-xs w-[58px] px-1 input-nebula"
                                    />
                                    <Input
                                      placeholder="Salida"
                                      value={entry?.actualEnd || ''}
                                      onChange={(e) => updateEntry(emp.id, day, 'actualEnd', e.target.value)}
                                      className="h-7 text-xs w-[58px] px-1 input-nebula"
                                    />
                                  </div>
                                  {result.totalHours > 0 && (
                                    <div className="flex gap-1 text-[10px]">
                                      <span className="text-[#6B6B8A]">{formatDecimalToHours(result.totalHours)}h</span>
                                      {result.overtimeHours > 0 && (
                                        <span className="text-[#00D4FF] font-semibold">+{formatDecimalToHours(result.overtimeHours)}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-semibold">
                            {totalExtra !== null && totalExtra > 0 ? (
                              <span className="text-[#00D4FF]">{formatDecimalToHours(totalExtra)}</span>
                            ) : (
                              <span className="text-[#6B6B8A] text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
