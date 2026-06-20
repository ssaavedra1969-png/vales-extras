'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Gift, ArrowRight } from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">ADMINISTRACION de FALPAT SRL</h1>
        <p className="text-muted-foreground max-w-md">
          Seleccioná el módulo al que querés acceder
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-accent group"
          onClick={() => router.push('/dashboard/cargar')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">VALES</CardTitle>
                <CardDescription>Gestión de vales de pago</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cargá, gestioná y realizá el seguimiento de vales de pago para empleados.
            </p>
            <Button variant="default" className="w-full gap-2 group-hover:bg-accent group-hover:text-primary transition-colors">
              Ingresar <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-accent group opacity-80"
          onClick={() => router.push('/dashboard/extras')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">EXTRAS</CardTitle>
                <CardDescription>Gestión de horas extras</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestión y liquidación de horas extras del personal.
            </p>
            <Button variant="outline" className="w-full gap-2">
              Ingresar <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
