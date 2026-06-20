'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Copy, Users, User } from 'lucide-react';
import { ExtraEmployee, WeeklyTimesheet } from '@/types/extras';
import { getAllEmployees, getWeeklyTimesheetsForEmployee, getAllTimesheetsForMonth } from '@/lib/extras/firestore';
import { DAYS_OF_WEEK, DAY_LABELS, formatDateISO, formatDecimalToHours } from '@/lib/extras/timeUtils';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [empleados, setEmpleados] = useState<ExtraEmployee[]>([]);
  const [empleadoId, setEmpleadoId] = useState('__all__');
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timesheets, setTimesheets] = useState<(WeeklyTimesheet & { employeeName: string })[]>([]);
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
    } catch {
      toast({ title: 'Error', description: 'No se pudo generar el reporte', variant: 'destructive' });
    } finally {
      setCargandoReporte(false);
    }
  };

  const empleadoSeleccionado = empleados.find((e) => e.id === empleadoId);
  const empleadoNombre = empleadoId === '__all__' ? 'Todos los empleados' : (empleadoSeleccionado?.name ?? '—');

  const totalesPorEmpleado = React.useMemo(() => {
    const map = new Map<string, { name: string; total: number; semanas: number }>();
    for (const t of timesheets) {
      const key = t.employeeId;
      if (!map.has(key)) {
        map.set(key, { name: t.employeeName, total: 0, semanas: 0 });
      }
      const entry = map.get(key)!;
      entry.total += t.weekTotalOvertime;
      entry.semanas++;
    }
    return Array.from(map.values());
  }, [timesheets]);

  const totalGeneral = timesheets.reduce((s, t) => s + t.weekTotalOvertime, 0);

  const exportarExcel = () => {
    const [year, month] = mes.split('-').map(Number);
    const periodo = `${String(month).padStart(2, '0')}/${year}`;

    const wb = XLSX.utils.book_new();

    const EMPRESA = 'FALPAT SRL';
    const DIRECCION = 'Administración - Reporte de Horas Extras';
    const encabezado = [
      [EMPRESA],
      [DIRECCION],
      [],
      [`Período: ${periodo}`],
      [`Generado: ${new Date().toLocaleDateString('es-AR')}`],
      [],
    ];

    const dias = DAYS_OF_WEEK.map((d) => DAY_LABELS[d]);
    const headers = ['Empleado', 'Semana', ...dias, 'Total Extra'];

    const bodyRows: (string | number)[][] = [];
    for (const t of timesheets) {
      const weekStr = formatDateISO(t.weekStartDate.toDate());
      const row: (string | number)[] = [
        empleadoId === '__all__' ? t.employeeName : '',
        weekStr,
      ];
      for (const day of DAYS_OF_WEEK) {
        row.push(t.days[day]?.overtimeHours ?? 0);
      }
      row.push(t.weekTotalOvertime);
      bodyRows.push(row);
    }

    const totalRow: (string | number)[] = ['', 'Total por empleado', ...dias.map(() => ''), ''];
    const wsData = [
      ...encabezado,
      headers,
      ...bodyRows,
      [],
    ];

    if (empleadoId === '__all__') {
      for (const emp of totalesPorEmpleado) {
        totalRow[1] = `${emp.name}: ${formatDecimalToHours(emp.total)} (${emp.semanas} semanas)`;
      }
      wsData.push(['TOTAL GENERAL', '', '', '', '', '', '', formatDecimalToHours(totalGeneral)]);
    } else {
      wsData.push(['TOTAL', '', '', '', '', '', '', formatDecimalToHours(totalGeneral)]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Horas Extras');
    const filename = `extras_${mes}_${empleadoId === '__all__' ? 'completo' : empleadoNombre?.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast({ title: 'Excel exportado', description: filename, variant: 'success' });
  };

  const copiarAlPortapapeles = () => {
    const lines = timesheets.map((t) => {
      const weekStr = formatDateISO(t.weekStartDate.toDate());
      const name = empleadoId === '__all__' ? `${t.employeeName} - ` : '';
      return `${name}${weekStr}: ${formatDecimalToHours(t.weekTotalOvertime)}`;
    });
    const prefix = empleadoId === '__all__' ? `TOTAL GENERAL: ${formatDecimalToHours(totalGeneral)}\n\n` : `Total: ${formatDecimalToHours(totalGeneral)}\n`;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen Mensual</h1>
        <p className="text-muted-foreground">Consultá las horas extras acumuladas por empleado</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Seleccioná empleado y mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-64">
              <label className="text-xs text-muted-foreground mb-1 block">Empleado</label>
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="__all__">Todos los empleados</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1 block">Mes</label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {meses.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg">
                {empleadoId === '__all__' ? (
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Todos los empleados</span>
                ) : (
                  <span className="flex items-center gap-2"><User className="h-4 w-4" /> {empleadoNombre}</span>
                )}
              </CardTitle>
              <CardDescription>
                {meses.find((m) => m.value === mes)?.label}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copiarAlPortapapeles} disabled={timesheets.length === 0}>
                <Copy className="h-4 w-4 mr-1" /> Copiar
              </Button>
              <Button variant="default" size="sm" onClick={exportarExcel} disabled={timesheets.length === 0}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cargandoReporte ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay registros para este período</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  {empleadoId === '__all__' ? 'Total general de horas extras del mes' : 'Total de horas extras del mes'}
                </p>
                <p className="text-3xl font-bold text-accent">{formatDecimalToHours(totalGeneral)}</p>
              </div>

              {empleadoId === '__all__' && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">DESGLOSE POR EMPLEADO</p>
                  <div className="space-y-1">
                    {totalesPorEmpleado.map((emp) => (
                      <div key={emp.name} className="flex justify-between text-sm">
                        <span>{emp.name}</span>
                        <span className="font-semibold text-accent">{formatDecimalToHours(emp.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {empleadoId === '__all__' && <TableHead>Empleado</TableHead>}
                      <TableHead>Semana</TableHead>
                      {DAYS_OF_WEEK.map((day) => (
                        <TableHead key={day} className="text-center">{DAY_LABELS[day]}</TableHead>
                      ))}
                      <TableHead className="text-right">Total Extra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((t) => (
                      <TableRow key={t.id}>
                        {empleadoId === '__all__' && (
                          <TableCell className="font-medium text-xs">{t.employeeName}</TableCell>
                        )}
                        <TableCell className="font-mono text-xs">
                          {formatDateISO(t.weekStartDate.toDate())}
                        </TableCell>
                        {DAYS_OF_WEEK.map((day) => (
                          <TableCell key={day} className="text-xs text-center">
                            {t.days[day]?.overtimeHours > 0
                              ? formatDecimalToHours(t.days[day].overtimeHours)
                              : '—'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold text-accent">
                          {formatDecimalToHours(t.weekTotalOvertime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
