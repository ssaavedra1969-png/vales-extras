'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import ValeTemplate from '@/components/vale/ValeTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, FileDown, Pencil, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { Vale, ConfigEmpresa } from '@/types';
import { collection, query, orderBy, getDocs, where, Timestamp, QueryConstraint } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { updateValeEstado, deleteVale, confirmarVale } from '@/lib/firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'pendiente': return <Badge variant="warning">Pendiente</Badge>;
    case 'firmado': return <Badge variant="success">Firmado</Badge>;
    default: return <Badge>{estado}</Badge>;
  }
};

export default function ValesPage() {
  const [vales, setVales] = useState<Vale[]>([]);
  const [cargando, setCargando] = useState(true);
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [valeEditando, setValeEditando] = useState<Vale | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('pendiente');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [eliminarId, setEliminarId] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const [confirmando, setConfirmando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null);

  const { toast } = useToast();

  const cargarVales = useCallback(async () => {
    setCargando(true);
    try {
      const constraints: QueryConstraint[] = [orderBy('numero', 'desc')];

      if (filterEstado !== 'todos') {
        constraints.push(where('estado', '==', filterEstado));
      }

      if (searchEmpleado) {
        constraints.push(
          where('empleado', '>=', searchEmpleado),
          where('empleado', '<=', searchEmpleado + '\uf8ff')
        );
      }

      const q = query(collection(getDb(), 'vales'), ...constraints);
      const snapshot = await getDocs(q);
      const valesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vale));
      setVales(valesData);
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

  const abrirEdicion = (vale: Vale) => {
    setValeEditando(vale);
    setNuevoEstado(vale.estado);
    setDialogOpen(true);
  };

  const confirmarCambioEstado = async () => {
    if (!valeEditando) return;
    setCambiandoEstado(true);
    try {
      await updateValeEstado(
        valeEditando.id,
        nuevoEstado as 'pendiente' | 'firmado'
      );
      setVales((prev) =>
        prev.map((v) =>
          v.id === valeEditando.id
            ? { ...v, estado: nuevoEstado as 'pendiente' | 'firmado' }
            : v
        )
      );
      toast({
        title: 'Estado actualizado',
        description: `Vale ${valeEditando.numero} marcado como "${nuevoEstado}"`,
        variant: 'success',
      });
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    } finally {
      setCambiandoEstado(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminarId) return;
    setEliminando(true);
    try {
      await deleteVale(eliminarId);
      setVales((prev) => prev.filter((v) => v.id !== eliminarId));
      setSeleccionados((prev) => { const n = new Set(prev); n.delete(eliminarId); return n; });
      toast({ title: 'Vale eliminado', description: 'Se eliminó correctamente', variant: 'success' });
      setEliminarId(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    } finally {
      setEliminando(false);
    }
  };

  const confirmarSeleccionados = async () => {
    if (seleccionados.size === 0) {
      toast({ title: 'Sin selección', description: 'Selecciona al menos un vale', variant: 'default' });
      return;
    }
    setConfirmando(true);
    let ok = 0;
    for (const id of seleccionados) {
      try {
        await confirmarVale(id);
        ok++;
      } catch (e) {
        console.error(`Error al confirmar vale ${id}:`, e);
      }
    }
    toast({
      title: 'Vales confirmados',
      description: `${ok} vales enviados a Gestión de Descuentos`,
      variant: 'success',
    });
    setSeleccionados(new Set());
    cargarVales();
    setConfirmando(false);
  };

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">VALES</h1>
        <p className="text-muted-foreground">Gestiona los vales pendientes y firmados</p>
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg">Vales</CardTitle>
              <CardDescription>
                {vales.length} vales - {seleccionados.size} seleccionados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={confirmarSeleccionados}
                disabled={confirmando || seleccionados.size === 0}
              >
                {confirmando ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirmando...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar seleccionados</>
                )}
              </Button>
            </div>
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
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={vales.length > 0 && seleccionados.size === vales.length}
                        onCheckedChange={toggleTodos}
                      />
                    </TableHead>
                    <TableHead>N° Vale</TableHead>
                    <TableHead>Legajo</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vales.map((vale) => (
                    <TableRow
                      key={vale.id}
                      className={seleccionados.has(vale.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={seleccionados.has(vale.id)}
                          onCheckedChange={() => toggleSeleccion(vale.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{vale.numero}</TableCell>
                      <TableCell className="font-mono text-xs">{vale.legajo}</TableCell>
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
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirEdicion(vale)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEliminarId(vale.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await confirmarVale(vale.id);
                                toast({
                                  title: 'Vale confirmado',
                                  description: `${vale.numero} enviado a Gestión de Descuentos`,
                                  variant: 'success',
                                });
                                cargarVales();
                              } catch {
                                toast({ title: 'Error', description: 'No se pudo confirmar', variant: 'destructive' });
                              }
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar estado del vale</DialogTitle>
            <DialogDescription>
              Vale: {valeEditando?.numero} - {valeEditando?.empleado}
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

      <Dialog open={eliminarId !== null} onOpenChange={(open) => !open && setEliminarId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar vale</DialogTitle>
            <DialogDescription>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
