'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  Wrench, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock,
  LayoutDashboard
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Ventas del Día', value: 'S/ 12,450.00', icon: TrendingUp, trend: '+12.5%', isUp: true },
    { label: 'Clientes Nuevos', value: '45', icon: Users, trend: '+3.2%', isUp: true },
    { label: 'Stock Bajo', value: '18 ítems', icon: Package, trend: '-2', isUp: false },
    { label: 'Órdenes Pendientes', value: '12', icon: ShoppingBag, trend: 'Normal', isUp: true },
  ];

  const recentSales = [
    { id: '1', customer: 'Juan Pérez', item: 'Martillo Truper 16oz', amount: 'S/ 45.00', status: 'Completado' },
    { id: '2', customer: 'Constructora Alfa', item: 'Cemento Sol (50 bolsas)', amount: 'S/ 1,450.00', status: 'Pendiente' },
    { id: '3', customer: 'María García', item: 'Pintura Látex Pato 1gal', amount: 'S/ 85.50', status: 'Completado' },
    { id: '4', customer: 'Carlos Ruiz', item: 'Taladro Bosch GSB 550', amount: 'S/ 249.00', status: 'Cancelado' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Panel de <span className="text-orange-600">Control</span>
          </h1>
          <p className="text-foreground/60 mt-2 text-lg">
            Bienvenido, Admin. Aquí tienes el resumen de Bradley hoy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-background/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-border">
            <Clock className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-sm font-medium">12 Mar 2026, 16:20</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative bg-card hover:bg-card/80 border border-border p-6 rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:shadow-orange-600/10 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-orange-600/10 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                <stat.icon className="w-6 h-6 text-orange-600 group-hover:text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground/50">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{stat.value}</p>
            </div>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 via-orange-600/0 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 mt-8">
        {/* Sales Chart / Main Section */}
        <div className="lg:col-span-8 bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-orange-600" />
              Movimiento Semanal
            </h2>
            <select className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-600/20">
              <option>Últimos 7 días</option>
              <option>Este mes</option>
            </select>
          </div>
          
          <div className="aspect-[16/7] w-full bg-slate-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-border flex items-center justify-center group">
            <div className="text-center">
              <Wrench className="w-12 h-12 text-foreground/10 mx-auto mb-4 group-hover:rotate-12 transition-transform duration-500" />
              <p className="text-foreground/30 font-medium italic">Gráfico de Ventas en Tiempo Real</p>
              <div className="mt-4 flex gap-2 justify-center">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <div key={i} className="w-3 bg-orange-600/20 rounded-t-full relative" style={{ height: `${h}px` }}>
                    <div className="absolute inset-0 bg-orange-600 rounded-t-full transform scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-700" style={{ transitionDelay: `${i * 100}ms` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-4 bg-card border border-border rounded-[2.5rem] p-8 flex flex-col">
          <h2 className="text-xl font-bold mb-6">Ventas Recientes</h2>
          <div className="flex-1 space-y-6">
            {recentSales.map((sale) => (
              <div key={sale.id} className="group flex items-center gap-4 p-3 hover:bg-background rounded-2xl transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600 font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  {sale.customer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{sale.customer}</p>
                  <p className="text-xs text-foreground/50 truncate">{sale.item}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{sale.amount}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    sale.status === 'Completado' ? 'text-emerald-500' : 
                    sale.status === 'Pendiente' ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {sale.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-4 bg-foreground text-background font-bold rounded-2xl hover:opacity-90 transition-opacity active:scale-[0.98]">
            Ver Todos los Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
