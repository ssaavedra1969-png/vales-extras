'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Loader2, Save, X, Clock } from 'lucide-react';
import { ExtraEmployee } from '@/types/extras';
import { getAllEmployees, createEmployee, updateEmployee, deactivateEmployee } from '@/lib/extras/firestore';
import { DAY_LABELS_FULL } from '@/lib/extras/timeUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const emptyForm = {
  name: '',
  scheduledStart: '08:00',
  scheduledEnd: '17:00',
  workingDays: [...DEFAULT_DAYS],
};

export default function EmployeesPage() {
  const [empleados, setEmpleados] = useState<ExtraEmployee[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getAllEmployees();
      setEmpleados(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los empleados', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const abrirEditar = (emp: ExtraEmployee) => {
    setEditando(emp.id);
    setForm({
      name: emp.name,
      scheduledStart: emp.scheduledStart,
      scheduledEnd: emp.scheduledEnd,
      workingDays: [...emp.workingDays],
    });
    setDialogOpen(true);
  };

  const guardar = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }
    if (form.workingDays.length === 0) {
      toast({ title: 'Error', description: 'Seleccioná al menos un día laboral', variant: 'destructive' });
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        await updateEmployee(editando, form);
        toast({ title: 'Empleado actualizado', variant: 'success' });
      } else {
        await createEmployee({ ...form, active: true });
        toast({ title: 'Empleado creado', variant: 'success' });
      }
      setDialogOpen(false);
      cargar();
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (id: string, name: string) => {
    try {
      await deactivateEmployee(id);
      toast({ title: 'Empleado desactivado', description: name, variant: 'success' });
      cargar();
    } catch {
      toast({ title: 'Error', description: 'No se pudo desactivar', variant: 'destructive' });
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Empleados</h1>
        <p className="text-muted-foreground">Gestión de empleados y sus horarios base</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lista de empleados</CardTitle>
            <Button onClick={abrirNuevo}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo empleado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : empleados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay empleados registrados</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Días laborales</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados.map((emp) => (
                    <TableRow key={emp.id} className={!emp.active ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {emp.scheduledStart} - {emp.scheduledEnd}
                      </TableCell>
                      <TableCell className="text-xs">
                        {emp.workingDays.map((d) => DAY_LABELS_FULL[d]).join(', ')}
                      </TableCell>
                      <TableCell>
                        {emp.active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => abrirEditar(emp)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {emp.active && (
                            <Button variant="ghost" size="sm" onClick={() => desactivar(emp.id, emp.name)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
            <DialogDescription>
              Configurá el horario base y los días laborales
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre del empleado"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Entrada programada</Label>
                <Input
                  id="start"
                  type="time"
                  value={form.scheduledStart}
                  onChange={(e) => setForm((p) => ({ ...p, scheduledStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Salida programada</Label>
                <Input
                  id="end"
                  type="time"
                  value={form.scheduledEnd}
                  onChange={(e) => setForm((p) => ({ ...p, scheduledEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Días laborales</Label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.workingDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    {DAY_LABELS_FULL[day]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : <><Save className="h-4 w-4 mr-2" /> Guardar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
