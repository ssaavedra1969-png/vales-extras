'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Gift, ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 overflow-hidden animate-bg">
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none bg-grid" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/8 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/8 rounded-full blur-[150px] animate-float [animation-delay:-10s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[200px] animate-float [animation-delay:-5s]" />

      <div className="relative z-10 text-center space-y-4 mb-12 animate-deploy">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="neon-badge inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-full text-accent">
            <Sparkles className="h-3 w-3" /> RRHH <span className="text-white/30 mx-1">•</span> FALPAT SRL
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] tracking-tight leading-tight">
          Panel de Administración
        </h1>
        <p className="text-[#94A3B8] font-light text-lg max-w-md mx-auto tracking-widest animate-caret inline-block">
          Seleccioná el módulo al que querés acceder
        </p>
      </div>

      <div className="divider-luxury mb-10">
        <div className="dot" />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="animate-deploy [animation-delay:200ms]">
          <Card
            className="glass-card glass-card-vales cursor-pointer"
            onClick={() => router.push('/dashboard/cargar')}
          >
            <div className="card-glow absolute inset-0 transition-all duration-500 rounded-[24px] pointer-events-none" />
            <CardHeader>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <FileText className="h-14 w-14 text-accent glow-icon" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">VALES</CardTitle>
                  <CardDescription className="text-[#CBD5E1] text-base leading-relaxed">
                    Gestión de vales de pago
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Cargá, gestioná y realizá el seguimiento de vales de pago para empleados.
              </p>
              <Button className="w-full gap-2 text-sm bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-500 hover:via-indigo-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02]">
                Acceder <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="animate-deploy [animation-delay:400ms]">
          <Card
            className="glass-card glass-card-extras cursor-pointer"
            onClick={() => router.push('/dashboard/extras')}
          >
            <div className="card-glow absolute inset-0 transition-all duration-500 rounded-[24px] pointer-events-none" />
            <CardHeader>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <Gift className="h-14 w-14 text-blue-400 glow-icon-blue" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">EXTRAS</CardTitle>
                  <CardDescription className="text-[#CBD5E1] text-base leading-relaxed">
                    Gestión de horas extras
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Gestión y liquidación de horas extras del personal.
              </p>
              <Button className="w-full gap-2 text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:from-amber-500 hover:via-orange-400 hover:to-yellow-500 text-primary font-semibold shadow-lg shadow-amber-500/25 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/35 hover:scale-[1.02]">
                Acceder <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
