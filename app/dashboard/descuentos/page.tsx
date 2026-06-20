'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Vale } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { descontarVale } from '@/lib/firebase/firestore';
import * as XLSX from 'xlsx';

export default function DescuentosPage() {
  const [mes, setMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [vales, setVales] = useState<Vale[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(false);
  const [descontando, setDescontando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const { toast } = useToast();

  const cargarVales = async () => {
    setCargando(true);
    try {
      const snapshot = await getDocs(collection(getDb(), 'vales_confirmados'));
      const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vale));

      const filtrados = todos.filter((vale) => {
        if (!vale.fechaPago) return false;
        const partes = vale.fechaPago.split('/');
        if (partes.length !== 3) return false;
        const mesVale = `${partes[2]}-${partes[1]}`;
        return mesVale === mes;
      });

      setVales(filtrados);
      setSeleccionados(new Set());
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los vales', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVales();
  }, [mes]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === vales.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(vales.map((v) => v.id)));
    }
  };

  const descontarSeleccionados = async () => {
    if (seleccionados.size === 0) {
      toast({ title: 'Sin selección', description: 'Selecciona al menos un vale', variant: 'default' });
      return;
    }

    setDescontando(true);
    let ok = 0;

    try {
      for (const id of seleccionados) {
        try {
          await descontarVale(id, mes);
          ok++;
        } catch {
          console.error(`Error al descontar vale ${id}`);
        }
      }

      toast({
        title: 'Descuentos aplicados',
        description: `${ok} vales enviados al Historial`,
        variant: 'success',
      });

      cargarVales();
    } catch {
      toast({ title: 'Error', description: 'Error al aplicar descuentos', variant: 'destructive' });
    } finally {
      setDescontando(false);
    }
  };

  const exportarExcel = async () => {
    setExportando(true);
    try {
      const data = vales.map((vale) => ({
        Legajo: vale.legajo || '',
        Nombre: vale.empleado,
        NroVale: vale.numero,
        Monto: vale.monto,
        FechaPago: vale.fechaPago,
        MesDescuento: mes,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 10 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Descuentos');

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `descuentos_${mes}.xlsx`;
      link.click();

      toast({ title: 'Excel generado', description: `Reporte de descuentos para ${mes}`, variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Error al generar el Excel', variant: 'destructive' });
    } finally {
      setExportando(false);
    }
  };

  const meses = [];
  const ahora = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    });
  }

  return (
    <div className="space-y-6 relative z-10">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-white">💰 Gestión de Descuentos</h1>
        <p className="text-[#B0B0D0]">Seleccioná vales confirmados y marcalos como descontados</p>
      </div>

      <div className="animate-fadeInUp stagger-1">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="text-white text-lg">📅 Seleccionar período</CardTitle>
            <CardDescription className="text-[#B0B0D0]">Elegí el mes para filtrar los vales confirmados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-64">
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="input-nebula"
                >
                  {meses.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={cargarVales} disabled={cargando} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300">
                {cargando ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fadeInUp stagger-2">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-white text-lg">📋 Vales confirmados</CardTitle>
                <CardDescription className="text-[#B0B0D0]">
                  {vales.length} vales encontrados — {seleccionados.size} seleccionados
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-nebula"
                  onClick={descontarSeleccionados}
                  disabled={descontando || seleccionados.size === 0}
                >
                  {descontando ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Descontar seleccionados</>
                  )}
                </button>
                <button
                  className="bg-gradient-to-r from-[#6C3CE1]/20 to-[#00D4FF]/20 hover:from-[#6C3CE1]/40 hover:to-[#00D4FF]/40 text-white border border-white/10 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center"
                  onClick={exportarExcel}
                  disabled={exportando || vales.length === 0}
                >
                  {exportando ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exportando...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Exportar Excel</>
                  )}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#6C3CE1]" />
              </div>
            ) : vales.length === 0 ? (
              <div className="text-center py-12 text-[#6B6B8A]">
                <span className="text-4xl block mb-3">📭</span>
                <p>No hay vales confirmados para este período</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden table-nebula">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={vales.length > 0 && seleccionados.size === vales.length}
                          onCheckedChange={toggleTodos}
                          className="border-white/30"
                        />
                      </TableHead>
                      <TableHead>N° Vale</TableHead>
                      <TableHead>Legajo</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha de pago</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vales.map((vale) => (
                      <TableRow
                        key={vale.id}
                        className={`border-t border-white/5 ${seleccionados.has(vale.id) ? 'bg-[#6C3CE1]/10' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={seleccionados.has(vale.id)}
                            onCheckedChange={() => toggleSeleccion(vale.id)}
                            className="border-white/30"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[#B0B0D0]">{vale.numero}</TableCell>
                        <TableCell className="font-mono text-xs text-[#B0B0D0]">{vale.legajo}</TableCell>
                        <TableCell className="font-medium text-white">{vale.empleado}</TableCell>
                        <TableCell className="text-[#00D4FF] font-mono">${vale.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-[#B0B0D0]">{vale.fechaPago}</TableCell>
                        <TableCell><Badge variant="warning" className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Confirmado</Badge></TableCell>
                      </TableRow>
                    ))}
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
