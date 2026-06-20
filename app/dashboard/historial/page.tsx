'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import ValeTemplate from '@/components/vale/ValeTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, FileDown, Loader2 } from 'lucide-react';
import { Vale, ConfigEmpresa } from '@/types';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'descontado': return <Badge variant="default">Descontado</Badge>;
    default: return <Badge>{estado}</Badge>;
  }
};

export default function HistorialPage() {
  const [vales, setVales] = useState<Vale[]>([]);
  const [cargando, setCargando] = useState(true);
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null);
  const { toast } = useToast();

  const cargarVales = useCallback(async () => {
    setCargando(true);
    try {
      const constraints = [];
      if (searchEmpleado) {
        constraints.push(
          where('empleado', '>=', searchEmpleado),
          where('empleado', '<=', searchEmpleado + '\uf8ff')
        );
      }
      constraints.push(orderBy('numero', 'desc'));

      const q = query(collection(getDb(), 'vales_historial'), ...constraints);
      const snapshot = await getDocs(q);
      const valesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vale));
      setVales(valesData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los vales', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  }, [searchEmpleado, toast]);

  useEffect(() => {
    cargarVales();
  }, []);

  const buscar = () => cargarVales();

  const generarPDF = async (vale: Vale) => {
    setGenerandoPdf(vale.id);
    try {
      const configRes = await fetch('/api/config');
      const config: ConfigEmpresa = await configRes.json();

      if (!vale.fechaGeneracion) {
        vale.fechaGeneracion = new Timestamp(Math.floor(Date.now() / 1000), 0);
      }

      const pdfBlob = await pdf(<ValeTemplate vale={vale} config={config} />).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch {
      toast({ title: 'Error', description: 'No se pudo generar el PDF', variant: 'destructive' });
    } finally {
      setGenerandoPdf(null);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-white">📚 Historial</h1>
        <p className="text-[#B0B0D0]">Archivo de vales descontados</p>
      </div>

      <div className="animate-fadeInUp stagger-1">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <CardTitle className="text-white text-lg">🔍 Filtros</CardTitle>
            <CardDescription className="text-[#B0B0D0]">Buscá por empleado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-[#6B6B8A] mb-1 block">Buscar empleado</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B8A]" />
                  <input
                    placeholder="Nombre del empleado..."
                    value={searchEmpleado}
                    onChange={(e) => setSearchEmpleado(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscar()}
                    className="input-nebula pl-9"
                  />
                </div>
              </div>
              <button onClick={buscar} className="btn-nebula">
                <Search className="h-4 w-4 mr-2" /> Buscar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fadeInUp stagger-2">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">📄 Vales descontados</CardTitle>
              <span className="text-sm text-[#6B6B8A]">{vales.length} registros</span>
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
                <p>No se encontraron vales en el historial</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden table-nebula">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Vale</TableHead>
                      <TableHead>Legajo</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha de pago</TableHead>
                      <TableHead>Mes descuento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vales.map((vale) => (
                      <TableRow key={vale.id} className="border-t border-white/5">
                        <TableCell className="font-mono text-xs text-[#B0B0D0]">{vale.numero}</TableCell>
                        <TableCell className="font-mono text-xs text-[#B0B0D0]">{vale.legajo}</TableCell>
                        <TableCell className="font-medium text-white">{vale.empleado}</TableCell>
                        <TableCell className="text-[#00D4FF] font-mono">
                          ${vale.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-[#B0B0D0]">{vale.fechaPago}</TableCell>
                        <TableCell className="text-[#B0B0D0]">{vale.mesDescuento || '-'}</TableCell>
                        <TableCell>{estadoBadge(vale.estado)}</TableCell>
                        <TableCell className="text-right">
                          <button
                            className="bg-white/5 hover:bg-white/10 text-white rounded-lg p-2 transition-all"
                            onClick={() => generarPDF(vale)}
                            disabled={generandoPdf === vale.id}
                            title="Descargar PDF"
                          >
                            {generandoPdf === vale.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
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
