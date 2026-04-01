'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Search, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    // Aquí podrías llamar a la mutation de logout si es necesario
    // Por ahora simulamos el borrado del token y redirección
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <nav className="fixed top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border sm:pl-64 transition-all duration-300">
      <div className="px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative group">
            <Search className="absolute left-4 h-4 w-4 text-foreground/40 group-focus-within:text-orange-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar productos, clientes..."
              className="w-full bg-card/80 hover:bg-card border border-border rounded-2xl py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/50 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all outline-none duration-200"
            />
          </div>

          <div className="flex flex-1 md:hidden">
             <h2 className="text-sm font-bold text-orange-600 tracking-tighter uppercase">Bradley</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications */}
            <button className="hidden sm:flex p-2.5 text-foreground/60 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-600 rounded-full border-2 border-background" />
            </button>
            
            <ThemeToggle />
            
            <div className="h-8 w-px bg-border mx-1" />
            
            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground leading-tight">Admin Bradley</p>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Master</p>
              </div>
              
              <div className="group relative">
                <button className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-600/10 hover:scale-105 active:scale-95 transition-all">
                  <User className="w-5 h-5" />
                </button>
                
                {/* Minimal Dropdown Simulation */}
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-colors">
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
