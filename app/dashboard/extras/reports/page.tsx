'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Copy, Clock, User } from 'lucide-react';
import { ExtraEmployee, WeeklyTimesheet } from '@/types/extras';
import { getAllEmployees, getWeeklyTimesheetsForEmployee } from '@/lib/extras/firestore';
import { formatDateISO, formatDecimalToHours, DAY_LABELS } from '@/lib/extras/timeUtils';

export default function ReportsPage() {
  const [empleados, setEmpleados] = useState<ExtraEmployee[]>([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>([]);
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

  const generarReporte = async () => {
    if (!empleadoId) {
      toast({ title: 'Seleccioná un empleado', variant: 'default' });
      return;
    }
    setCargandoReporte(true);
    try {
      const [year, month] = mes.split('-').map(Number);
      const data = await getWeeklyTimesheetsForEmployee(empleadoId, year, month);
      setTimesheets(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudo generar el reporte', variant: 'destructive' });
    } finally {
      setCargandoReporte(false);
    }
  };

  useEffect(() => {
    if (empleadoId) generarReporte();
  }, [empleadoId, mes]);

  const totalMes = timesheets.reduce((sum, t) => sum + t.weekTotalOvertime, 0);

  const copiarAlPortapapeles = () => {
    const text = timesheets
      .map((t) => {
        const weekStr = formatDateISO(t.weekStartDate.toDate());
        return `${weekStr}: ${formatDecimalToHours(t.weekTotalOvertime)}`;
      })
      .join('\n');
    navigator.clipboard.writeText(`Total: ${formatDecimalToHours(totalMes)}\n${text}`);
    toast({ title: 'Copiado', description: 'Datos copiados al portapapeles', variant: 'success' });
  };

  const exportarCSV = () => {
    const rows = timesheets.map((t) => {
      const weekStr = formatDateISO(t.weekStartDate.toDate());
      return `${weekStr},${t.weekTotalOvertime.toFixed(2)}`;
    });
    rows.unshift('Semana,Horas Extras');
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extras_${mes}.csv`;
    a.click();
    toast({ title: 'CSV exportado', description: `extras_${mes}.csv`, variant: 'success' });
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar...</option>
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {meses.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {empleadoId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg">
                  {empleados.find((e) => e.id === empleadoId)?.name}
                </CardTitle>
                <CardDescription>
                  {meses.find((m) => m.value === mes)?.label}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copiarAlPortapapeles} disabled={timesheets.length === 0}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={exportarCSV} disabled={timesheets.length === 0}>
                  <Download className="h-4 w-4 mr-1" /> CSV
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
                  <p className="text-sm text-muted-foreground">Total de horas extras del mes</p>
                  <p className="text-3xl font-bold text-accent">{formatDecimalToHours(totalMes)}</p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semana</TableHead>
                        <TableHead>Lun</TableHead>
                        <TableHead>Mar</TableHead>
                        <TableHead>Mié</TableHead>
                        <TableHead>Jue</TableHead>
                        <TableHead>Vie</TableHead>
                        <TableHead>Sáb</TableHead>
                        <TableHead>Dom</TableHead>
                        <TableHead className="text-right">Total Extra</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheets.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-xs">
                            {formatDateISO(t.weekStartDate.toDate())}
                          </TableCell>
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <TableCell key={day} className="text-xs">
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
      )}
    </div>
  );
}
