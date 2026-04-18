'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Search, User, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ isSidebarCollapsed, onToggleSidebar }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <nav className={`fixed top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300 ${isSidebarCollapsed ? 'sm:pl-20' : 'sm:pl-64'}`}>
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            {/* Toggle Button */}
            <button 
              onClick={onToggleSidebar}
              className="p-2 hover:bg-foreground/5 rounded-xl transition-colors text-foreground/60 hover:text-orange-600 hidden sm:block"
              title={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center w-80 relative group">
              <Search className="absolute left-4 h-4 w-4 text-foreground/40 group-focus-within:text-orange-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar..."
                className="w-full bg-card/50 hover:bg-card border border-border rounded-xl py-2 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all outline-none duration-200"
              />
            </div>
          </div>

          <div className="flex flex-1 md:hidden">
             <h2 className="text-sm font-black text-orange-600 tracking-tighter uppercase">Bradley</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications */}
            <button className="hidden sm:flex p-2 text-foreground/60 rounded-xl hover:bg-foreground/5 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-background" />
            </button>
            
            <ThemeToggle />
            
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            
            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-foreground leading-tight">Admin Bradley</p>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest opacity-80">Master Panel</p>
              </div>
              
              <div className="group relative">
                <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20 hover:scale-105 active:scale-95 transition-all">
                  <User className="w-4.5 h-4.5" />
                </button>
                
                {/* Minimal Dropdown Simulation */}
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="lg:hidden px-3 py-2 border-b border-border/50 mb-1">
                    <p className="text-sm font-bold text-foreground">Admin Bradley</p>
                    <p className="text-[10px] text-orange-600 font-bold uppercase">Master</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-foreground/5 rounded-xl transition-colors">
                    <User className="w-4 h-4" /> Mi Perfil
                  </button>
                  <div className="h-px bg-border my-1 mx-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
