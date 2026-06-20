'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Copy, Users, User } from 'lucide-react';
import { ExtraEmployee, WeeklyTimesheet } from '@/types/extras';
import { getAllEmployees, getWeeklyTimesheetsForEmployee, getAllTimesheetsForMonth } from '@/lib/extras/firestore';
import { DAYS_OF_WEEK, DAY_LABELS, formatDateISO, formatDateArg, formatDecimalToHours } from '@/lib/extras/timeUtils';
import type { ExtraDay } from '@/types/extras';

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
        return { key: k, start: d, end, label: `S${getWeekNumber(d)} — ${formatDateArg(d)} al ${formatDateArg(end)}` };
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

  const exportarExcel = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.default.Workbook();
      const ws = wb.addWorksheet('Horas Extras');

      const C = {
        purple: 'FF6C3CE1',
        white: 'FFFFFFFF',
        darkBg: 'FF1A1A3E',
        greyFill: 'FFF0F0F0',
        lightPurple: 'FFF5F0FF',
        darkText: 'FF1A1A3E',
        greyText: 'FF666666',
        red: 'FFFF0000',
        border: 'FFD0D0D0',
      };

      const f = (s: number, b = false, c?: string) => ({ name: 'Calibri', size: s, bold: b, color: c ? { argb: c } : undefined, family: 2 });
      const fl = (color: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: color } });
      const bd = (l = true, r = true, t = true, btm = true) => ({
        left: l ? { style: 'thin' as const, color: { argb: C.border } } : undefined,
        right: r ? { style: 'thin' as const, color: { argb: C.border } } : undefined,
        top: t ? { style: 'thin' as const, color: { argb: C.border } } : undefined,
        bottom: btm ? { style: 'thin' as const, color: { argb: C.border } } : undefined,
      });

      const selected = displayed;
      const daysOfWeek = DAYS_OF_WEEK;
      const periodo = `${mes.split('-')[1]}/${mes.split('-')[0]}`;
      const totalCols = semanaKey ? 8 : 9; // 8 cols when specific week, 9 when all weeks
      const dayStartCol = semanaKey ? 2 : 3;
      const totalCol = totalCols;

      // Column widths
      ws.getColumn(1).width = 32;
      for (let i = 2; i <= totalCols; i++) ws.getColumn(i).width = 16;

      let r = 1;

      // ── ROW 1: FALPAT SRL + Generado ──
      ws.mergeCells(`A${r}:B${r}`);
      const c1 = ws.getCell(`A${r}`);
      c1.value = 'FALPAT SRL';
      c1.font = f(20, true, C.white);
      c1.fill = fl(C.purple);
      c1.alignment = { horizontal: 'center', vertical: 'middle' };
      c1.border = bd(true, false, true, true);

      ws.getCell(`B${r}`).fill = fl(C.purple);
      ws.getCell(`B${r}`).border = bd(false, true, true, true);

      ws.mergeCells(`G${r}:H${r}`);
      const genCell = ws.getCell(`G${r}`);
      genCell.value = `Generado: ${new Date().toLocaleDateString('es-AR')}`;
      genCell.font = f(12, true);
      genCell.alignment = { horizontal: 'center', vertical: 'middle' };
      genCell.border = bd(false, false, false, false);

      ws.getRow(r).height = 28;
      r++;

      // ── ROW 2: subtitle ──
      ws.mergeCells(`A${r}:B${r}`);
      const c2 = ws.getCell(`A${r}`);
      c2.value = 'Administración — Reporte de Horas Extras';
      c2.font = f(12, true);
      c2.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(r).height = 16;
      r++;
      // blank row
      r++;

      // ── ROW 4: Período + Semana ──
      ws.mergeCells(`A${r}:B${r}`);
      const perCell = ws.getCell(`A${r}`);
      perCell.value = `Período: ${periodo}`;
      perCell.font = f(14, true);
      perCell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (semanaActual) {
        ws.mergeCells(`C${r}:${String.fromCharCode(64 + totalCols)}${r}`);
        const semCell = ws.getCell(`C${r}`);
        semCell.value = semanaActual.label;
        semCell.font = f(20, true);
        semCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      ws.getRow(r).height = 26;
      r++;

      // blank rows
      r += 2;

      // ── ROW 7: Column headers ──
      const headerLabels = ['Empleado'];
      if (!semanaKey) headerLabels.push('Semana');
      headerLabels.push(...daysOfWeek.map((d) => DAY_LABELS[d]), 'Total Extra');

      const headerRow = ws.getRow(r);
      headerLabels.forEach((label, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = label;
        cell.font = f(10, true, C.white);
        cell.fill = fl(C.purple);
        cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
        cell.border = bd();
      });
      r++;

      // ── ROW 8: Date values under days ──
      if (semanaKey && selected.length > 0) {
        const wsDate = selected[0].weekStartDate.toDate();
        const dateRow = ws.getRow(r);
        dateRow.getCell(1); // empty first cell
        for (let di = 0; di < daysOfWeek.length; di++) {
          const d = getDayDate(wsDate, di);
          const cell = dateRow.getCell(dayStartCol + di);
          cell.value = d;
          cell.font = f(10, true, C.white);
          cell.fill = fl(C.purple);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = bd();
          cell.numFmt = 'dd/mm';
        }
        r++;
      }

      // ── Employee rows ──
      const groups = new Map<string, typeof selected>();
      for (const t of selected) {
        const key = t.employeeId;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      }

      for (const [, rows] of groups) {
        for (const t of rows) {
          const wsDate = t.weekStartDate.toDate();
          const hasExtra = t.weekTotalOvertime > 0;
          const rowObj = ws.getRow(r);
          rowObj.height = 24;

          // Col A: Employee name
          const empCell = rowObj.getCell(1);
          empCell.value = empleadoId === '__all__' ? `👤 ${t.employeeName}` : t.employeeName;
          empCell.font = f(11, true, C.darkText);
          empCell.fill = fl(C.lightPurple);
          empCell.alignment = { vertical: 'middle' };
          empCell.border = bd();

          // Col B: Semana (only when all weeks)
          if (!semanaKey) {
            const semCell = rowObj.getCell(2);
            semCell.value = `S${getWeekNumber(wsDate)} — ${formatDateArg(wsDate)} al ${formatDateArg(getDayDate(wsDate, 5))}`;
            semCell.font = f(9, false, C.greyText);
            semCell.alignment = { vertical: 'middle' };
            semCell.border = bd();
          }

          // Day columns
          for (let di = 0; di < daysOfWeek.length; di++) {
            const day = daysOfWeek[di];
            const dayData: ExtraDay | undefined = t.days[day];
            const cell = rowObj.getCell(dayStartCol + di);
            cell.border = bd();
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

            if (dayData && (dayData.actualStart || dayData.actualEnd)) {
              const range = `${dayData.actualStart || '—'} - ${dayData.actualEnd || '—'}`;
              const hasDayExtra = dayData.overtimeHours > 0;
              if (hasDayExtra) {
                cell.value = `${range}\n${formatDecimalToHours(dayData.overtimeHours)} extra`;
                cell.font = f(10, true, C.purple);
                cell.fill = fl(C.greyFill);
              } else {
                cell.value = range;
                cell.font = f(9, false, C.darkText);
              }
            } else {
              cell.value = '—';
              cell.font = f(9, false, C.greyText);
            }
          }

          // Total Extra column
          const totalCell = rowObj.getCell(totalCol);
          totalCell.value = formatDecimalToHours(t.weekTotalOvertime);
          totalCell.font = f(10, true, hasExtra ? C.red : C.greyText);
          totalCell.alignment = { horizontal: 'left', vertical: 'middle' };
          totalCell.border = bd();

          r++;
        }
      }

      // ── Blank rows ──
      r += 2;

      // ── Total row ──
      const totalRow = ws.getRow(r);
      totalRow.height = 30;
      ws.mergeCells(`A${r}:${String.fromCharCode(64 + totalCol - 1)}${r}`);

      const totalLabel = ws.getCell(`A${r}`);
      totalLabel.value = 'TOTAL GENERAL';
      totalLabel.font = f(12, true, C.white);
      totalLabel.fill = fl(C.darkBg);
      totalLabel.alignment = { horizontal: 'left', vertical: 'middle' };
      totalLabel.border = { left: bd().left, top: bd().top, bottom: bd().bottom };

      for (let i = 2; i < totalCol; i++) {
        const midCell = ws.getCell(`${String.fromCharCode(64 + i)}${r}`);
        midCell.fill = fl(C.darkBg);
        midCell.font = f(12, true, C.white);
        midCell.border = { top: bd().top, bottom: bd().bottom };
      }

      const totalVal = ws.getCell(`${String.fromCharCode(64 + totalCol)}${r}`);
      totalVal.value = formatDecimalToHours(totalGeneral);
      totalVal.font = f(12, true, C.white);
      totalVal.fill = fl(C.darkBg);
      totalVal.alignment = { vertical: 'middle' };
      totalVal.border = bd();

      const buffer = await wb.xlsx.writeBuffer() as ArrayBuffer;
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const sufijo = semanaKey ? semanaActual!.label.replace(/[^a-zA-Z0-9]/g, '_') : 'completo';
      link.download = `extras_${mes}_${empleadoId === '__all__' ? sufijo : empleadoNombre?.replace(/\s+/g, '_')}.xlsx`;
      link.click();

      toast({ title: 'Excel exportado', description: 'Formato profesional', variant: 'success' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudo generar el Excel', variant: 'destructive' });
    }
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
                              <span className="text-[#6C3CE1] font-semibold">S{getWeekNumber(ws)}</span> — {formatDateArg(ws)} al {formatDateArg(end)}
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
