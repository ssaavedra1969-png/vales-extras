'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Gift, ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 overflow-hidden bg-gradient-to-b from-[#0B1120] to-[#1E293B]">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none bg-grid" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/8 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-[200px]" />

      <div className="relative z-10 text-center space-y-3 mb-10 animate-fade-up">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-accent">
            <Sparkles className="h-3 w-3" /> RRHH
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] tracking-tight">
          FALPAT SRL
        </h1>
        <p className="text-[#94A3B8] font-light text-lg max-w-md mx-auto">
          Seleccioná el módulo al que querés acceder
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="animate-fade-up [animation-delay:100ms]">
          <Card
            className="glass-card rounded-2xl border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_70px_-15px_rgba(245,166,35,0.35)] hover:border-accent/40 group"
            onClick={() => router.push('/dashboard/cargar')}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center border border-accent/20 shrink-0">
                  <FileText className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">VALES</CardTitle>
                  <CardDescription className="text-[#CBD5E1]">
                    Gestión de vales de pago
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                Cargá, gestioná y realizá el seguimiento de vales de pago para empleados.
              </p>
              <Button className="w-full gap-2 bg-gradient-to-r from-accent to-amber-500 hover:from-accent hover:to-amber-400 text-primary font-semibold shadow-lg shadow-accent/20 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-accent/30">
                Ingresar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-up [animation-delay:300ms]">
          <Card
            className="glass-card rounded-2xl border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_70px_-15px_rgba(59,130,246,0.35)] hover:border-blue-400/40 group"
            onClick={() => router.push('/dashboard/extras')}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400/20 to-blue-400/5 rounded-2xl flex items-center justify-center border border-blue-400/20 shrink-0">
                  <Gift className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">EXTRAS</CardTitle>
                  <CardDescription className="text-[#CBD5E1]">
                    Gestión de horas extras
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                Gestión y liquidación de horas extras del personal.
              </p>
              <Button className="w-full gap-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-blue-400/20 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-blue-400/30">
                Ingresar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
