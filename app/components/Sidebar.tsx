'use client';

import React, { useState, useEffect } from 'react';
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
  Landmark,
  ScrollText,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

type CollapsedSubmenuFlyout = { label: string; top: number; left: number };

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  /** Flyout contraído: portal + fixed (el contenedor scroll del sidebar cortaba cualquier submenu con position:absolute + left-full). */
  const [mounted, setMounted] = useState(false);
  const [collapsedFlyout, setCollapsedFlyout] = useState<CollapsedSubmenuFlyout | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setCollapsedFlyout(null);
  }, [pathname]);

  useEffect(() => {
    if (!isCollapsed) setCollapsedFlyout(null);
  }, [isCollapsed]);

  useEffect(() => {
    if (collapsedFlyout === null) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (
        t.closest('[data-sidebar-submenu-root]') ||
        t.closest('[data-sidebar-submenu-flyout]')
      ) {
        return;
      }
      setCollapsedFlyout(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [collapsedFlyout]);
  
  const [isProductsOpen, setIsProductsOpen] = useState(pathname.startsWith('/modules/products') || pathname.startsWith('/modules/kardex'));
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(pathname.startsWith('/modules/logistics'));
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(pathname.startsWith('/modules/purchases') || pathname.startsWith('/modules/suppliers'));
  const [isCashOpen, setIsCashOpen] = useState(pathname.startsWith('/modules/cash/pos_cash'));
  const [isFinanceOpen, setIsFinanceOpen] = useState(pathname.startsWith('/modules/cash') && !pathname.startsWith('/modules/cash/pos_cash') || pathname.startsWith('/modules/cashflow'));
  const [isConfigOpen, setIsConfigOpen] = useState(
    pathname.startsWith('/modules/users') ||
      pathname.startsWith('/modules/subsidiary') ||
      pathname.startsWith('/modules/config')
  );
  const [isPosOpen, setIsPosOpen] = useState(pathname.startsWith('/modules/sales/new_sale') || pathname.startsWith('/modules/sales/display') || pathname.startsWith('/modules/sales/sales_list'));

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { 
      label: 'Ventas', 
      icon: Monitor, 
      isSubmenu: true,
      isOpen: isPosOpen,
      toggle: () => setIsPosOpen(!isPosOpen),
      subItems: [
        { label: 'Nueva Venta', icon: Plus, href: '/modules/sales/new_sale' },
        { label: 'Monitor', icon: Monitor, href: '/modules/sales/display' },
        { label: 'Historial', icon: History, href: '/modules/sales/sales_list' },

      ]
    },
    { 
      label: 'Caja POS', 
      icon: Calculator, 
      isSubmenu: true,
      isOpen: isCashOpen,
      toggle: () => setIsCashOpen(!isCashOpen),
      subItems: [
        { label: 'Cobrar', icon: ShoppingBag, href: '/modules/cash/pos_cash' },
      ]
    },
    { 
      label: 'Finanzas', 
      icon: Landmark, 
      isSubmenu: true,
      isOpen: isFinanceOpen,
      toggle: () => setIsFinanceOpen(!isFinanceOpen),
      subItems: [
        { label: 'Cajas', icon: Landmark, href: '/modules/cash' },
        { label: 'Flujo', icon: BarChart3, href: '/modules/cashflow' },
      ]
    },

    { 
      label: 'Inventario', 
      icon: Package, 
      isSubmenu: true,
      isOpen: isProductsOpen,
      toggle: () => setIsProductsOpen(!isProductsOpen),
      subItems: [
        { label: 'Catálogo', icon: List, href: '/modules/products' },
        { label: 'Categorías', icon: Tags, href: '/modules/products/categories' },
        { label: 'Clases', icon: Layers, href: '/modules/products/classes' },
        { label: 'Kardex', icon: ClipboardList, href: '/modules/kardex' },
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
    { 
      label: 'Compras', 
      icon: ShoppingBag, 
      isSubmenu: true,
      isOpen: isPurchasesOpen,
      toggle: () => setIsPurchasesOpen(!isPurchasesOpen),
      subItems: [
        { label: 'Registro', icon: Plus, href: '/modules/purchases' },
        { label: 'Proveedores', icon: Briefcase, href: '/modules/suppliers' },
        { label: 'Reporte', icon: BarChart3, href: '/modules/purchases/report' },
      ]
    },
    { label: 'Clientes', icon: Users, href: '/modules/clients' },
    { 
      label: 'Config', 
      icon: Settings, 
      isSubmenu: true,
      isOpen: isConfigOpen,
      toggle: () => setIsConfigOpen(!isConfigOpen),
      subItems: [
        { label: 'Panel', icon: LayoutGrid, href: '/modules/config' },
        { label: 'Sucursales', icon: Store, href: '/modules/subsidiary' },
        { label: 'Series de comprobantes', icon: ScrollText, href: '/modules/config/series' },
        { label: 'Usuarios', icon: UserPlus, href: '/modules/users' },
      ]
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 sm:hidden" 
          onClick={onToggle}
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 h-screen border-r border-border bg-card/60 backdrop-blur-2xl transition-all duration-300 ease-in-out ${
        isCollapsed 
          ? '-translate-x-full sm:translate-x-0 sm:w-20' 
          : 'translate-x-0 w-64 shadow-2xl sm:shadow-none'
      }`}>
      <div className={`h-full flex flex-col ${isCollapsed ? 'px-2' : 'px-4'} py-6 overflow-y-auto no-scrollbar`}>
        
        {/* Brand Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} mb-10 transition-all duration-300`}>
          <div className="relative group">
            <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/20 transform transition-all duration-500 group-hover:rotate-6 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
              <Construction className={isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} />
            </div>
            {!isCollapsed && (
              <div className="absolute -inset-1 bg-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}
          </div>
          
          {!isCollapsed && (
            <div className="ml-3 flex flex-col overflow-hidden whitespace-nowrap opacity-100 transition-all duration-500">
              <span className="text-xl font-black tracking-tighter text-foreground leading-none">
                BRADLEY
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-600/80 mt-1">
                Ferretería Prof
              </span>
            </div>
          )}
        </div>
        
        {/* Main Navigation */}
        <nav className="flex-1 space-y-1.5 self-center w-full">
          {menuItems.map((item) => {
            const isAnySubActive = item.subItems?.some(sub => pathname === sub.href);
            const isActive = pathname === item.href;
            const isSelected = isActive || isAnySubActive;

            if (item.isSubmenu) {
              const flyoutOpen = isCollapsed && collapsedFlyout?.label === item.label;
              return (
                <div
                  key={item.label}
                  data-sidebar-submenu-root
                  className="w-full relative"
                >
                  <button
                    type="button"
                    aria-expanded={isCollapsed ? flyoutOpen : item.isOpen}
                    onClick={(e) => {
                      if (!isCollapsed) {
                        item.toggle();
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCollapsedFlyout((prev) => {
                        if (prev?.label === item.label) return null;
                        return {
                          label: item.label,
                          top: rect.top,
                          left: rect.right + 8,
                        };
                      });
                    }}
                    className={`w-full flex items-center transition-all duration-200 group/item relative ${
                      isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2.5'
                    } rounded-xl text-sm font-semibold ${
                      isSelected 
                        ? 'text-orange-600 bg-orange-600/5' 
                        : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                    }`}
                  >
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                      <item.icon className={`transition-transform duration-300 group-hover/item:scale-110 ${
                        isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                      } ${isSelected ? 'text-orange-600' : 'text-foreground/40'}`} />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </div>
                    
                    {!isCollapsed && (
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${item.isOpen ? 'rotate-180' : ''} ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                    )}

                    {/* Active Indicator Bar */}
                    {isSelected && isCollapsed && (
                      <div className="absolute left-0 w-1 h-6 bg-orange-600 rounded-r-full shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                    )}
                  </button>
                  
                  {/* Submenu rendering */}
                  {!isCollapsed && item.isOpen && (
                    <div className="mt-1 space-y-1 ml-4 border-l border-border/50 pl-2">
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href as string}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                              isSubActive 
                                ? 'text-orange-600 bg-orange-600/5 shadow-sm' 
                                : 'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5'
                            }`}
                          >
                            <sub.icon className={`w-3.5 h-3.5 ${isSubActive ? 'text-orange-600' : 'text-foreground/20'}`} />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {mounted &&
                    flyoutOpen &&
                    collapsedFlyout &&
                    createPortal(
                      <div
                        data-sidebar-submenu-flyout
                        className="w-48 bg-card border border-border/50 rounded-xl shadow-xl z-[110] py-2 animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 duration-200"
                        style={{
                          position: 'fixed',
                          top: collapsedFlyout.top,
                          left: collapsedFlyout.left,
                        }}
                      >
                        <div className="px-4 mb-2">
                          <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1 px-2">
                          {item.subItems?.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href as string}
                                onClick={() => setCollapsedFlyout(null)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                  isSubActive
                                    ? 'text-orange-600 bg-orange-600/5'
                                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                                }`}
                              >
                                <sub.icon
                                  className={`w-4 h-4 ${isSubActive ? 'text-orange-600' : 'text-foreground/40'}`}
                                />
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              );
            }

            return (
              <div key={item.href} className="w-full relative group/sidebarItem">
                <Link
                  href={item.href as string}
                  className={`flex items-center group/item transition-all duration-200 relative ${
                    isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5 gap-3'
                  } rounded-xl text-sm font-semibold ${
                    isActive 
                      ? 'text-orange-600 bg-orange-600/5' 
                      : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  <item.icon className={`transition-transform duration-300 group-hover/item:scale-110 ${
                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                  } ${isActive ? 'text-orange-600' : 'text-foreground/40'}`} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  
                  {/* Active Indicator Bar */}
                  {isActive && isCollapsed && (
                    <div className="absolute left-0 w-1 h-6 bg-orange-600 rounded-r-full shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                  )}
                </Link>

                {/* Tooltip for collapsed sidebar */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-card border border-border/50 rounded-lg shadow-xl opacity-0 invisible group-hover/sidebarItem:opacity-100 group-hover/sidebarItem:visible transition-all duration-200 z-[100] whitespace-nowrap">
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className={`mt-auto pt-6 border-t border-border/50 ${isCollapsed ? 'flex justify-center' : 'px-2'}`}>
          <div className="relative group/help w-full flex justify-center">
            <Link
              href="/help"
              className={`flex items-center transition-all duration-200 ${
                isCollapsed ? 'p-2' : 'gap-3 px-3 py-2 w-full'
              } rounded-xl text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5`}
            >
              <HelpCircle className={`transition-colors group-hover/help:text-orange-600/70 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
              {!isCollapsed && <span className="text-sm font-semibold">Ayuda</span>}
            </Link>
            
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-card border border-border/50 rounded-lg shadow-xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200 z-[100] whitespace-nowrap">
                <span className="text-sm font-semibold text-foreground">Ayuda</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
