'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

function MobileNav() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const isActive = (href: string) => pathname === href;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-[#0A0A1A] border-r border-white/5">
        <div className="py-6">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-4 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6C3CE1] to-[#00D4FF] rounded-xl flex items-center justify-center shadow-lg">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-bold text-lg text-white">FALPAT SRL</h2>
            </div>
          </Link>
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#6B6B8A] hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al menú principal
          </a>
          <nav className="space-y-1">
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase px-4 mb-1 mt-4 tracking-wider">VALES</p>
            {[
              { href: '/dashboard/cargar', label: 'Cargar Excel' },
              { href: '/dashboard/vales', label: 'VALES' },
              { href: '/dashboard/descuentos', label: 'Gestión de Descuentos' },
              { href: '/dashboard/historial', label: 'Historial' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-[#6C3CE1]/20 to-transparent text-white font-medium border-l-2 border-[#6C3CE1]'
                    : 'text-[#B0B0D0] hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </a>
            ))}
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase px-4 mb-1 mt-4 tracking-wider">EXTRAS</p>
            {[
              { href: '/dashboard/extras', label: 'Carga Horaria' },
              { href: '/dashboard/extras/employees', label: 'Empleados' },
              { href: '/dashboard/extras/reports', label: 'Reportes' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-[#6C3CE1]/20 to-transparent text-white font-medium border-l-2 border-[#6C3CE1]'
                    : 'text-[#B0B0D0] hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-white/5 pt-2 mt-4">
              {[
                { href: '/dashboard/configuracion', label: 'Configuración' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-[#6C3CE1]/20 to-transparent text-white font-medium border-l-2 border-[#6C3CE1]'
                      : 'text-[#B0B0D0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/5 bg-[#0A0A1A]/80 backdrop-blur-xl px-4 sm:px-6">
      <MobileNav />

      <div className="hidden md:flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B6B8A] hover:text-white" title="Volver al menú principal">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-7 h-7 bg-gradient-to-br from-[#6C3CE1] to-[#00D4FF] rounded-lg flex items-center justify-center shadow-lg shadow-[#6C3CE1]/20">
          <LayoutDashboard className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-semibold text-sm text-white">FALPAT SRL</span>
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="text-[#B0B0D0] hover:text-white hover:bg-white/10"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Cambiar tema</span>
      </Button>
    </header>
  );
}
