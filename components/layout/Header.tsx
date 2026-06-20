'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, FileText } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

function MobileNav() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const isActive = (href: string) => pathname === href;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="py-6">
          <div className="flex items-center gap-3 px-4 mb-6">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold text-lg">ADMINISTRACION - FALPAT SRL</h2>
          </div>
          <nav className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-1 mt-4">VALES</p>
            {[
              { href: '/dashboard/cargar', label: 'Cargar Excel' },
              { href: '/dashboard/vales', label: 'VALES' },
              { href: '/dashboard/descuentos', label: 'Gestión de Descuentos' },
              { href: '/dashboard/historial', label: 'Historial' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </a>
            ))}
            <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-1 mt-4">EXTRAS</p>
            {[
              { href: '/dashboard/extras', label: 'EXTRAS' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t pt-2 mt-4">
              {[
                { href: '/dashboard/configuracion', label: 'Configuración' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted'
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <MobileNav />

      <div className="hidden md:flex items-center gap-2">
        <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="font-semibold text-sm">FALPAT SRL</span>
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Cambiar tema</span>
      </Button>
    </header>
  );
}
