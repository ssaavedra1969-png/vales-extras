'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import ValeTemplate from '@/components/vale/ValeTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, ChevronLeft, ChevronRight, FileDown, Loader2 } from 'lucide-react';
import { Vale, ConfigEmpresa } from '@/types';
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateValeEstado } from '@/lib/firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ITEMS_PER_PAGE = 20;

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'pendiente': return <Badge variant="warning">Pendiente</Badge>;
    case 'firmado': return <Badge variant="success">Firmado</Badge>;
    case 'descontado': return <Badge variant="default">Descontado</Badge>;
    default: return <Badge>{estado}</Badge>;
  }
};

export default function HistorialPage() {
  const [vales, setVales] = useState<Vale[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valeSeleccionado, setValeSeleccionado] = useState<Vale | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('pendiente');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null);
  const { toast } = useToast();

  const cargarVales = useCallback(async () => {
    setCargando(true);
    try {
      const constraints: unknown[] = [orderBy('numero', 'desc')];
      if (filterEstado !== 'todos') {
        constraints.push(where('estado', '==', filterEstado));
      }
      if (searchEmpleado) {
        constraints.push(
          where('empleado', '>=', searchEmpleado),
          where('empleado', '<=', searchEmpleado + '\uf8ff')
        );
      }

      const q = query(collection(db, 'vales'), ...constraints, limit(ITEMS_PER_PAGE));
      const snapshot = await getDocs(q);
      const valesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vale));
      setVales(valesData);
      setPagina(1);

      const countSnapshot = await getCountFromServer(collection(db, 'vales'));
      setTotal(countSnapshot.data().count);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los vales', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  }, [filterEstado, searchEmpleado, toast]);

  useEffect(() => {
    cargarVales();
  }, []);

  const buscar = () => cargarVales();

  const abrirCambioEstado = (vale: Vale) => {
    setValeSeleccionado(vale);
    setNuevoEstado(vale.estado);
    setDialogOpen(true);
  };

  const confirmarCambioEstado = async () => {
    if (!valeSeleccionado) return;
    setCambiandoEstado(true);
    try {
      const mesDescuento =
        nuevoEstado === 'descontado' ? new Date().toISOString().slice(0, 7) : undefined;
      await updateValeEstado(
        valeSeleccionado.id,
        nuevoEstado as 'pendiente' | 'firmado' | 'descontado',
        mesDescuento
      );
      setVales((prev) =>
        prev.map((v) =>
          v.id === valeSeleccionado.id
            ? { ...v, estado: nuevoEstado as 'pendiente' | 'firmado' | 'descontado', mesDescuento }
            : v
        )
      );
      toast({
        title: 'Estado actualizado',
        description: `Vale ${valeSeleccionado.numero} marcado como "${nuevoEstado}"`,
        variant: 'success',
      });
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    } finally {
      setCambiandoEstado(false);
    }
  };

  const generarPDF = async (vale: Vale) => {
    setGenerandoPdf(vale.id);
    try {
      const configRes = await fetch('/api/config');
      const config: ConfigEmpresa = await configRes.json();

      const valeData = {
        id: vale.id,
        numero: vale.numero,
        empleado: vale.empleado,
        monto: vale.monto,
        fechaPago: vale.fechaPago,
        estado: vale.estado,
      };

      const pdfBlob = await pdf(<ValeTemplate vale={valeData} config={config} />).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch {
      toast({ title: 'Error', description: 'No se pudo generar el PDF', variant: 'destructive' });
    } finally {
      setGenerandoPdf(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Vales</h1>
        <p className="text-muted-foreground">Busca, visualiza y gestiona los vales generados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Filtra por empleado o estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Buscar empleado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre del empleado..."
                  value={searchEmpleado}
                  onChange={(e) => setSearchEmpleado(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscar()}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-40">
              <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="firmado">Firmado</SelectItem>
                  <SelectItem value="descontado">Descontado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={buscar} className="gap-2">
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Resultados</CardTitle>
            <span className="text-sm text-muted-foreground">{total} vales en total</span>
          </div>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No se encontraron vales</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Vale</TableHead>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha de pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vales.map((vale) => (
                      <TableRow key={vale.id}>
                        <TableCell className="font-mono text-xs">{vale.numero}</TableCell>
                        <TableCell className="font-medium">{vale.empleado}</TableCell>
                        <TableCell>
                          ${vale.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{vale.fechaPago}</TableCell>
                        <TableCell>{estadoBadge(vale.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generarPDF(vale)}
                              disabled={generandoPdf === vale.id}
                            >
                              {generandoPdf === vale.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirCambioEstado(vale)}
                            >
                              Cambiar estado
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">Página {pagina}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagina((p) => p + 1)}
                    disabled={vales.length < ITEMS_PER_PAGE}
                  >
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado del vale</DialogTitle>
            <DialogDescription>
              Vale: {valeSeleccionado?.numero} - {valeSeleccionado?.empleado}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Nuevo estado</label>
            <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="firmado">Firmado</SelectItem>
                <SelectItem value="descontado">Descontado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmarCambioEstado} disabled={cambiandoEstado}>
              {cambiandoEstado ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
