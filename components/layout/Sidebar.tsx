'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  History,
  Percent,
  Settings,
  FileText,
} from 'lucide-react';

const menuItems = [
  {
    href: '/dashboard/cargar',
    label: 'Cargar Excel',
    icon: Upload,
  },
  {
    href: '/dashboard/historial',
    label: 'Historial',
    icon: History,
  },
  {
    href: '/dashboard/descuentos',
    label: 'Gestión de Descuentos',
    icon: Percent,
  },
  {
    href: '/dashboard/configuracion',
    label: 'Configuración',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-primary text-primary-foreground">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">FALPAT SRL</h2>
            <p className="text-xs text-primary-foreground/60">
              Sistema de Vales
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-primary-foreground/10" />

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
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
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <p className="text-xs text-primary-foreground/40 text-center">
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
