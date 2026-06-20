'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Gift, ArrowRight, Sparkles, ExternalLink, Truck } from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-grid z-0" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#6C3CE1]/10 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#00D4FF]/10 rounded-full blur-[150px] animate-float [animation-delay:-10s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6C3CE1]/5 rounded-full blur-[200px] animate-float [animation-delay:-5s]" />

      <div className="relative z-10 text-center space-y-4 mb-12 animate-fadeInUp">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-full border border-[#6C3CE1]/30 bg-[#6C3CE1]/10 backdrop-blur-sm shadow-[0_0_20px_rgba(108,60,225,0.3)] animate-neon-pulse text-[#6C3CE1]">
            <Sparkles className="h-3 w-3" /> RRHH <span className="text-white/20 mx-1">•</span> FALPAT SRL
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-white to-[#B0B0D0] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(108,60,225,0.2)] tracking-tight leading-tight">
          FALPAT SRL
        </h1>
        <p className="text-[#B0B0D0] font-light text-lg md:text-xl max-w-md mx-auto tracking-wide animate-fadeInUp stagger-3">
          Seleccioná el módulo al que querés acceder
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
        <div className="animate-fadeInUp stagger-1">
          <Card
            className="glass-card glass-card-vales cursor-pointer"
            onClick={() => router.push('/dashboard/cargar')}
          >
            <div className="flex flex-col items-center text-center p-8">
              <div className="text-7xl mb-4 drop-shadow-[0_0_30px_rgba(108,60,225,0.3)] group-hover:scale-110 transition-transform duration-500">
                📋
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2 tracking-tight">VALES</CardTitle>
              <CardDescription className="text-[#B0B0D0] text-base leading-relaxed mb-6">
                Gestión de vales de pago. Cargá, gestioná y realizá el seguimiento de vales de pago para empleados.
              </CardDescription>
              <Button
                className="btn-nebula"
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/cargar'); }}
              >
                Acceder <ArrowRight className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="animate-fadeInUp stagger-2">
          <Card
            className="glass-card glass-card-extras cursor-pointer"
            onClick={() => router.push('/dashboard/extras')}
          >
            <div className="flex flex-col items-center text-center p-8">
              <div className="text-7xl mb-4 drop-shadow-[0_0_30px_rgba(0,212,255,0.3)] group-hover:scale-110 transition-transform duration-500">
                ⏱️
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2 tracking-tight">EXTRAS</CardTitle>
              <CardDescription className="text-[#B0B0D0] text-base leading-relaxed mb-6">
                Gestión de horas extras. Gestión y liquidación de horas extras del personal.
              </CardDescription>
              <Button
                className="btn-nebula"
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/extras'); }}
              >
                Acceder <ArrowRight className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="animate-fadeInUp stagger-3">
          <Card
            className="glass-card glass-card-vehiculos cursor-pointer"
            onClick={() => window.open('https://herramientas-five.vercel.app/login', '_blank', 'noopener,noreferrer')}
          >
            <div className="flex flex-col items-center text-center p-8">
              <div className="text-7xl mb-4 drop-shadow-[0_0_30px_rgba(0,212,255,0.3)] group-hover:scale-110 transition-transform duration-500">
                🚛
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2 tracking-tight">VEHÍCULOS</CardTitle>
              <CardDescription className="text-[#B0B0D0] text-base leading-relaxed mb-6">
                Gestión de vehículos, herramientas y mantenimiento. Administración del parque automotor.
              </CardDescription>
              <Button
                className="btn-nebula"
                onClick={(e) => { e.stopPropagation(); window.open('https://herramientas-five.vercel.app/login', '_blank', 'noopener,noreferrer'); }}
              >
                Abrir <ExternalLink className="h-4 w-4 ml-1 inline" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
