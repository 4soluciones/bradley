'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ClipboardList, 
  Settings,
  HelpCircle,
  Truck,
  Construction,
  UserPlus,
  Store,
  ChevronDown,
  Briefcase,
  Monitor,
  Calculator,
  History,
  List,
  Tags,
  Warehouse,
  ShoppingBag,
  Layers,
  Plus, 
  BarChart3,
  Landmark
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  
  const [isProductsOpen, setIsProductsOpen] = useState(pathname.startsWith('/modules/products'));
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(pathname.startsWith('/modules/logistics'));
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(pathname.startsWith('/modules/purchases'));
  const [isCashOpen, setIsCashOpen] = useState(pathname.startsWith('/modules/cash/pos_cash'));
  const [isFinanceOpen, setIsFinanceOpen] = useState(pathname.startsWith('/modules/cash') && !pathname.startsWith('/modules/cash/pos_cash') || pathname.startsWith('/modules/cashflow'));
  const [isConfigOpen, setIsConfigOpen] = useState(pathname.startsWith('/modules/users') || pathname.startsWith('/modules/subsidiary'));
  const [isPosOpen, setIsPosOpen] = useState(pathname.startsWith('/modules/sales/new_sale') || pathname.startsWith('/modules/sales/display'));

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { 
      label: 'Punto de venta', 
      icon: Monitor, 
      isSubmenu: true,
      isOpen: isPosOpen,
      toggle: () => setIsPosOpen(!isPosOpen),
      subItems: [
        { label: 'Nueva Venta', icon: Plus, href: '/modules/sales/new_sale' },
        { label: 'Pantalla Cliente', icon: Monitor, href: '/modules/sales/display' },
      ]
    },
    { 
      label: 'Caja', 
      icon: Calculator, 
      isSubmenu: true,
      isOpen: isCashOpen,
      toggle: () => setIsCashOpen(!isCashOpen),
      subItems: [
        { label: 'Cobrar Venta', icon: ShoppingBag, href: '/modules/cash/pos_cash' },
      ]
    },
    { 
      label: 'Gestión Financiera', 
      icon: Landmark, 
      isSubmenu: true,
      isOpen: isFinanceOpen,
      toggle: () => setIsFinanceOpen(!isFinanceOpen),
      subItems: [
        { label: 'Gestión de Cajas', icon: Landmark, href: '/modules/cash' },
        { label: 'Flujo de Caja', icon: BarChart3, href: '/modules/cashflow' },
      ]
    },
    { label: 'Historial de ventas', icon: History, href: '/sales-history' },
    { 
      label: 'Productos', 
      icon: Package, 
      isSubmenu: true,
      isOpen: isProductsOpen,
      toggle: () => setIsProductsOpen(!isProductsOpen),
      subItems: [
        { label: 'Catálogo', icon: List, href: '/modules/products' },
        { label: 'Categorías', icon: Tags, href: '/modules/products/categories' },
        { label: 'Clases', icon: Layers, href: '/modules/products/classes' },
      ]
    },
    { 
      label: 'Logística', 
      icon: Truck, 
      isSubmenu: true,
      isOpen: isLogisticsOpen,
      toggle: () => setIsLogisticsOpen(!isLogisticsOpen),
      subItems: [
        { label: 'Almacenes', icon: Warehouse, href: '/modules/logistics/warehouses' },
      ]
    },
    { label: 'Proveedores', icon: Briefcase, href: '/modules/suppliers' },
    { 
      label: 'Compras', 
      icon: ShoppingBag, 
      isSubmenu: true,
      isOpen: isPurchasesOpen,
      toggle: () => setIsPurchasesOpen(!isPurchasesOpen),
      subItems: [
        { label: 'Registro', icon: Plus, href: '/modules/purchases' },
        { label: 'Reporte', icon: BarChart3, href: '/modules/purchases/report' },
      ]
    },
    { label: 'Clientes', icon: Users, href: '/modules/clients' },
    { label: 'Reportes', icon: ClipboardList, href: '/reports' },
    { 
      label: 'Configuración', 
      icon: Settings, 
      isSubmenu: true,
      isOpen: isConfigOpen,
      toggle: () => setIsConfigOpen(!isConfigOpen),
      subItems: [
        { label: 'Sucursales', icon: Store, href: '/modules/subsidiary' },
        { label: 'Usuarios', icon: UserPlus, href: '/modules/users' },
      ]
    },
  ];

  const bottomItems = [
    { label: 'Ayuda', icon: HelpCircle, href: '/help' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full transition-all duration-300 sm:translate-x-0 border-r border-border bg-card/50 backdrop-blur-xl group">
      <div className="h-full px-6 py-8 overflow-y-auto flex flex-col">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-4 px-2 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <Construction className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-foreground leading-none">
              BRADLEY
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-600 mt-1">
              Ferretería
            </span>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            if (item.isSubmenu) {
              const isAnySubActive = item.subItems?.some(sub => pathname === sub.href);
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={item.toggle}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group/item ${
                      isAnySubActive 
                        ? 'text-foreground bg-foreground/5' 
                        : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-orange-600/60 transition-all duration-300" />
                      {item.label}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${item.isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${item.isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-4 space-y-1 mt-1">
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href as string}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                              isSubActive 
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                                : 'text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70'
                            }`}
                          >
                            <sub.icon className={`w-4 h-4 ${isSubActive ? 'text-white' : 'text-orange-600/40'}`} />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href as string}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group/item ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20 translate-x-1' 
                    : 'text-foreground/50 hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-all duration-300 group-hover/item:scale-110 ${isActive ? 'text-white' : 'text-orange-600/60 group-hover/item:text-orange-600'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="pt-8 mt-8 border-t border-border space-y-2">
           {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-all duration-300 group/item"
              >
                <item.icon className="w-5 h-5 text-foreground/30 group-hover/item:text-foreground/70 transition-colors duration-300" />
                {item.label}
              </Link>
           ))}
        </div>

        {/* Upgrade Card / Tip */}
        <div className="mt-8 bg-orange-600 p-6 rounded-[2rem] text-white relative overflow-hidden group/card shadow-2xl shadow-orange-600/20">
           <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover/card:bg-white/20 transition-colors" />
           <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Tip del día</p>
           <p className="text-sm font-medium leading-relaxed">
             Optimiza tu inventario usando el modo de escaneo rápido.
           </p>
        </div>
      </div>
    </aside>
  );
}
