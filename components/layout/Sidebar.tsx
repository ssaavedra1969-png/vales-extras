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
    <aside className="hidden md:flex md:w-64 flex-col bg-[#0A0A1A]/95 border-r border-white/5">
      <div className="p-6">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6C3CE1] to-[#00D4FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C3CE1]/20">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-white">FALPAT SRL</h2>
              <p className="text-xs text-[#6B6B8A]">Administración</p>
            </div>
          </div>
        </Link>
      </div>

      <Separator className="bg-white/5" />

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'bg-gradient-to-r from-[#6C3CE1]/20 to-transparent text-white font-medium border-l-2 border-[#6C3CE1]'
                          : 'text-[#B0B0D0] hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[#6C3CE1]')} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 space-y-1 border-t border-white/5">
        <Link href="/dashboard/configuracion">
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer',
              pathname === '/dashboard/configuracion'
                ? 'bg-gradient-to-r from-[#6C3CE1]/20 to-transparent text-white font-medium border-l-2 border-[#6C3CE1]'
                : 'text-[#B0B0D0] hover:text-white hover:bg-white/5'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Configuración
          </div>
        </Link>
      </div>
    </aside>
  );
}
