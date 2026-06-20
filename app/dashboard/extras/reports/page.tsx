'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Copy, Users, User } from 'lucide-react';
import { ExtraEmployee, WeeklyTimesheet } from '@/types/extras';
import { getAllEmployees, getWeeklyTimesheetsForEmployee, getAllTimesheetsForMonth } from '@/lib/extras/firestore';
import { DAYS_OF_WEEK, DAY_LABELS, formatDateISO, formatDateArg, formatDecimalToHours } from '@/lib/extras/timeUtils';
import * as XLSX from 'xlsx';

const DAY_INDEX: Record<string, number> = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5 };

function getDayDate(weekStart: Date, dayIndex: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

function formatDDMM(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekNumber(weekStart: Date): number {
  const month = weekStart.getMonth();
  let count = 1;
  const cursor = new Date(weekStart);
  cursor.setDate(cursor.getDate() - 7);
  while (cursor.getMonth() === month) {
    count++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
}

export default function ReportsPage() {
  const [empleados, setEmpleados] = useState<ExtraEmployee[]>([]);
  const [empleadoId, setEmpleadoId] = useState('__all__');
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timesheets, setTimesheets] = useState<(WeeklyTimesheet & { employeeName: string })[]>([]);
  const [semanaKey, setSemanaKey] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllEmployees();
        setEmpleados(data.filter((e) => e.active));
      } catch {
        toast({ title: 'Error', description: 'No se pudieron cargar empleados', variant: 'destructive' });
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  useEffect(() => {
    generarReporte();
  }, [empleadoId, mes]);

  const generarReporte = async () => {
    setCargandoReporte(true);
    try {
      const [year, month] = mes.split('-').map(Number);
      if (empleadoId === '__all__') {
        const data = await getAllTimesheetsForMonth(year, month);
        setTimesheets(data);
      } else {
        const data = await getWeeklyTimesheetsForEmployee(empleadoId, year, month);
        setTimesheets(data);
      }
      setSemanaKey('');
    } catch {
      toast({ title: 'Error', description: 'No se pudo generar el reporte', variant: 'destructive' });
    } finally {
      setCargandoReporte(false);
    }
  };

  const semanas = useMemo(() => {
    const keys = new Set<string>();
    for (const t of timesheets) {
      keys.add(t.weekStartDate.toDate().toISOString());
    }
    return Array.from(keys)
      .sort()
      .map((k) => {
        const d = new Date(k);
        const end = new Date(d);
        end.setDate(end.getDate() + 5);
        return { key: k, start: d, end, label: `Semana ${getWeekNumber(d)} — ${formatDateArg(d)} al ${formatDateArg(end)}` };
      });
  }, [timesheets]);

  const displayed = useMemo(() => {
    if (!semanaKey) return timesheets;
    return timesheets.filter((t) => t.weekStartDate.toDate().toISOString() === semanaKey);
  }, [timesheets, semanaKey]);

  const totalGeneral = displayed.reduce((s, t) => s + t.weekTotalOvertime, 0);

  const empleadoSeleccionado = empleados.find((e) => e.id === empleadoId);
  const empleadoNombre = empleadoId === '__all__' ? 'Todos los empleados' : (empleadoSeleccionado?.name ?? '—');

  const semanaActual = semanas.find((s) => s.key === semanaKey);

  const exportarExcel = () => {
    const periodo = `${mes.split('-')[1]}/${mes.split('-')[0]}`;

    const wb = XLSX.utils.book_new();
    const EMPRESA = 'FALPAT SRL';
    const DIRECCION = 'Administración - Reporte de Horas Extras';
    const encabezado: (string | number)[][] = [
      [EMPRESA],
      [DIRECCION],
      [],
      [`Período: ${periodo}`],
      [`Generado: ${new Date().toLocaleDateString('es-AR')}`],
    ];
    if (semanaActual) {
      encabezado.push([`${semanaActual.label}`]);
    }
    encabezado.push([]);

    const selected = displayed;
    const daysOfWeek = DAYS_OF_WEEK;
    const dayHeaders = daysOfWeek.map((d) => {
      if (!semanaKey || !selected.length) return DAY_LABELS[d];
      const ws = selected[0].weekStartDate.toDate();
      const date = getDayDate(ws, DAY_INDEX[d]);
      return `${DAY_LABELS[d]}\n${formatDDMM(date)}`;
    });
    const headers = ['Empleado', 'Semana', ...dayHeaders, 'Total Extra'];

    const bodyRows: (string | number)[][] = [];
    for (const t of selected) {
      const ws = t.weekStartDate.toDate();
      const weekStr = `${getWeekNumber(ws)} - ${formatDateArg(ws)} al ${formatDateArg(getDayDate(ws, 5))}`;
      const row: (string | number)[] = [
        empleadoId === '__all__' ? t.employeeName : '',
        weekStr,
      ];
      for (const day of daysOfWeek) {
        row.push(t.days[day]?.overtimeHours ?? 0);
      }
      row.push(t.weekTotalOvertime);
      bodyRows.push(row);
    }

    const wsData = [
      ...encabezado,
      headers,
      ...bodyRows,
      [],
      ['TOTAL', '', '', '', '', '', '', '', formatDecimalToHours(totalGeneral)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 28 },
      { wch: 24 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Horas Extras');
    const sufijo = semanaKey ? semanaActual!.label.replace(/[^a-zA-Z0-9]/g, '_') : 'completo';
    const filename = `extras_${mes}_${empleadoId === '__all__' ? sufijo : empleadoNombre?.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast({ title: 'Excel exportado', description: filename, variant: 'success' });
  };

  const copiarAlPortapapeles = () => {
    const lines = displayed.map((t) => {
      const ws = t.weekStartDate.toDate();
      const weekStr = `${getWeekNumber(ws)} - ${formatDateArg(ws)}`;
      const name = empleadoId === '__all__' ? `${t.employeeName} - ` : '';
      return `${name}${weekStr}: ${formatDecimalToHours(t.weekTotalOvertime)}`;
    });
    const prefix = `Total: ${formatDecimalToHours(totalGeneral)}\n\n`;
    navigator.clipboard.writeText(prefix + lines.join('\n'));
    toast({ title: 'Copiado', description: 'Datos copiados al portapapeles', variant: 'success' });
  };

  const meses = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    meses.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    });
  }

  return (
    <div className="space-y-6 relative z-10">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-white">📊 Reporte Horas Extras</h1>
        <p className="text-[#B0B0D0]">Consultá las horas extras por semana y empleado</p>
      </div>

      <div className="animate-fadeInUp stagger-1">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔍 Filtros</CardTitle>
            <CardDescription className="text-[#B0B0D0]">Seleccioná empleado, mes y semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-64">
                <label className="text-xs text-[#6B6B8A] mb-1 block">Empleado</label>
                <select
                  value={empleadoId}
                  onChange={(e) => setEmpleadoId(e.target.value)}
                  className="input-nebula"
                >
                  <option value="__all__">Todos los empleados</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="text-xs text-[#6B6B8A] mb-1 block">Mes</label>
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="input-nebula"
                >
                  {meses.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              {semanas.length > 0 && (
                <div className="w-72">
                  <label className="text-xs text-[#6B6B8A] mb-1 block">Semana</label>
                  <select
                    value={semanaKey}
                    onChange={(e) => setSemanaKey(e.target.value)}
                    className="input-nebula"
                  >
                    <option value="">Todas las semanas</option>
                    {semanas.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fadeInUp stagger-2">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  {empleadoId === '__all__' ? <><Users className="h-4 w-4 text-[#6C3CE1]" /> Todos los empleados</> : <><User className="h-4 w-4 text-[#6C3CE1]" /> {empleadoNombre}</>}
                  {semanaActual && <span className="text-sm font-normal text-[#6B6B8A]">— {semanaActual.label}</span>}
                </CardTitle>
                <CardDescription className="text-[#B0B0D0]">
                  {meses.find((m) => m.value === mes)?.label} — {displayed.length} registro{displayed.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button onClick={copiarAlPortapapeles} disabled={displayed.length === 0} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center gap-1">
                  <Copy className="h-4 w-4" /> Copiar
                </button>
                <button onClick={exportarExcel} disabled={displayed.length === 0} className="btn-nebula">
                  <Download className="h-4 w-4 mr-1" /> Excel
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cargandoReporte ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#6C3CE1]" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-8 text-[#6B6B8A]">
                <span className="text-4xl block mb-3">📭</span>
                <p>No hay registros para este período</p>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-gradient-to-r from-[#6C3CE1]/10 to-[#00D4FF]/10 rounded-xl border border-[#6C3CE1]/20">
                  <p className="text-sm text-[#B0B0D0]">
                    {semanaKey ? 'Total de horas extras de la semana' : 'Total general de horas extras'}
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#6C3CE1] to-[#00D4FF] bg-clip-text text-transparent">
                    {formatDecimalToHours(totalGeneral)}
                  </p>
                </div>

                <div className="border border-white/10 rounded-xl overflow-x-auto table-nebula">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {empleadoId === '__all__' && <TableHead>Empleado</TableHead>}
                        <TableHead>Semana</TableHead>
                        {DAYS_OF_WEEK.map((day) => {
                          const label = DAY_LABELS[day];
                          let dateStr = '';
                          if (displayed.length > 0) {
                            const ws = displayed[0].weekStartDate.toDate();
                            const dayDate = getDayDate(ws, DAY_INDEX[day]);
                            dateStr = formatDDMM(dayDate);
                          }
                          return (
                            <TableHead key={day} className="text-center">
                              <div className="text-xs">{label}</div>
                              {dateStr && <div className="text-[10px] text-[#6B6B8A] font-normal">{dateStr}</div>}
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-right">Total Extra</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayed.map((t) => {
                        const ws = t.weekStartDate.toDate();
                        const end = getDayDate(ws, 5);
                        return (
                          <TableRow key={t.id} className="border-t border-white/5">
                            {empleadoId === '__all__' && (
                              <TableCell className="font-medium text-xs text-white">{t.employeeName}</TableCell>
                            )}
                            <TableCell className="font-mono text-xs text-[#B0B0D0]">
                              <span className="text-[#6C3CE1] font-semibold">S{getWeekNumber(ws)}</span> {formatDateArg(ws)} — {formatDateArg(end)}
                            </TableCell>
                            {DAYS_OF_WEEK.map((day) => (
                              <TableCell key={day} className="text-xs text-center text-[#B0B0D0]">
                                {t.days[day]?.overtimeHours > 0
                                  ? <span className="text-[#00D4FF] font-mono">{formatDecimalToHours(t.days[day].overtimeHours)}</span>
                                  : '—'}
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-semibold text-[#00D4FF] font-mono">
                              {formatDecimalToHours(t.weekTotalOvertime)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
