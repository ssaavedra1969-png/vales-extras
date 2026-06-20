'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileText,
  Percent,
  Archive,
  Settings,
  Gift,
  LayoutDashboard,
  Users,
  BarChart3,
} from 'lucide-react';

const menuGroups = [
  {
    label: 'VALES',
    items: [
      { href: '/dashboard/cargar', label: 'Cargar Excel', icon: Upload },
      { href: '/dashboard/vales', label: 'VALES', icon: FileText },
      { href: '/dashboard/descuentos', label: 'Gestión de Descuentos', icon: Percent },
      { href: '/dashboard/historial', label: 'Historial', icon: Archive },
    ],
  },
  {
    label: 'EXTRAS',
    items: [
      { href: '/dashboard/extras', label: 'Carga Horaria', icon: Gift },
      { href: '/dashboard/extras/employees', label: 'Empleados', icon: Users },
      { href: '/dashboard/extras/reports', label: 'Reportes', icon: BarChart3 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-primary text-primary-foreground">
      <div className="p-6">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">ADMINISTRACION</h2>
              <p className="text-xs text-primary-foreground/60">
                FALPAT SRL
              </p>
            </div>
          </div>
        </Link>
      </div>

      <Separator className="bg-primary-foreground/10" />

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-primary-foreground/40 uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10',
                        isActive &&
                          'bg-primary-foreground/15 text-primary-foreground font-medium'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 space-y-1 border-t border-primary-foreground/10">
        <Link href="/dashboard/configuracion">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10',
              pathname === '/dashboard/configuracion' &&
                'bg-primary-foreground/15 text-primary-foreground font-medium'
            )}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
        </Link>
      </div>
    </aside>
  );
}
