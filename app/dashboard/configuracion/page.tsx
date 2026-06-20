'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2, Building2 } from 'lucide-react';
import { ConfigEmpresa } from '@/types';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigEmpresa>({
    nombre: 'FALPAT SRL',
    direccion: '',
    telefono: '',
    email: '',
    cuit: '',
    conceptoVale: 'Adelanto de sueldo / Vale de pago',
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({
          ...prev,
          ...data,
          nombre: data.nombre || 'FALPAT SRL',
        }));
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setCargando(false);
    }
  };

  const guardarConfig = async () => {
    setGuardando(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Error al guardar');

      toast({
        title: 'Configuración guardada',
        description: 'Los datos de la empresa se actualizaron correctamente',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleChange = (field: keyof ConfigEmpresa, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3CE1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl relative z-10">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-white">⚙️ Configuración</h1>
        <p className="text-[#B0B0D0]">Datos de la empresa para los vales</p>
      </div>

      <div className="animate-fadeInUp stagger-1">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#6C3CE1] to-[#00D4FF]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">🏢 Datos de la empresa</CardTitle>
                <CardDescription className="text-[#B0B0D0]">
                  Estos datos aparecerán en los vales de pago generados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-white">Nombre de la empresa</Label>
                <input
                  id="nombre"
                  value={config.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="FALPAT SRL"
                  className="input-nebula"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuit" className="text-white">CUIT</Label>
                <input
                  id="cuit"
                  value={config.cuit}
                  onChange={(e) => handleChange('cuit', e.target.value)}
                  placeholder="00-00000000-0"
                  className="input-nebula"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion" className="text-white">Dirección</Label>
              <input
                id="direccion"
                value={config.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Dirección de la empresa"
                className="input-nebula"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-white">Teléfono</Label>
                <input
                  id="telefono"
                  value={config.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="(000) 000-0000"
                  className="input-nebula"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <input
                  id="email"
                  type="email"
                  value={config.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@falpat.com"
                  className="input-nebula"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conceptoVale" className="text-white">Concepto del vale</Label>
              <input
                id="conceptoVale"
                value={config.conceptoVale}
                onChange={(e) => handleChange('conceptoVale', e.target.value)}
                placeholder="Adelanto de sueldo / Vale de pago"
                className="input-nebula"
              />
            </div>

            <div className="pt-4">
              <button onClick={guardarConfig} disabled={guardando} className="btn-nebula">
                {guardando ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Guardar configuración</>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
