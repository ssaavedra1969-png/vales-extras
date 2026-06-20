'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';

export default function ExtrasPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
        <Gift className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">EXTRAS</h1>
        <p className="text-muted-foreground">
          Módulo de gestión de horas extras. Próximamente recibirás las reglas y condiciones para esta sección.
        </p>
      </div>
    </div>
  );
}
