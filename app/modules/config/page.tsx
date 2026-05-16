"use client";

import Link from "next/link";
import {
  ArrowRight,
  Construction,
  LayoutGrid,
  ScrollText,
  Store,
  UserPlus,
} from "lucide-react";

const CONFIG_LINKS = [
  {
    href: "/modules/subsidiary",
    title: "Sucursales",
    description: "Tiendas, sedes y datos fiscales por ubicación.",
    icon: Store,
    accent: "from-amber-500/90 to-orange-700",
  },
  {
    href: "/modules/config/series",
    title: "Series de comprobantes",
    description: "Series por tipo de documento y sede para facturación.",
    icon: ScrollText,
    accent: "from-orange-500 to-orange-700",
  },
  {
    href: "/modules/users",
    title: "Usuarios",
    description: "Colaboradores y acceso al sistema Bradley.",
    icon: UserPlus,
    accent: "from-slate-600 to-slate-800",
  },
] as const;

export default function ConfigHomePage() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 -mt-2">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-orange-500/[0.07] p-8 sm:p-10 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-600/25">
              <LayoutGrid className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600/90">
                Bradley · Ferretería
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Panel de <span className="text-orange-600">configuración</span>
              </h1>
              <p className="max-w-2xl text-base font-medium text-foreground/65">
                Centraliza sucursales, series de comprobantes y usuarios. Elige un módulo para
                continuar.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-background/80 text-foreground/25">
            <Construction className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {CONFIG_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card p-7 shadow-sm transition-all hover:border-orange-500/35 hover:shadow-xl hover:shadow-orange-500/10"
          >
            <div
              className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-md`}
            >
              <item.icon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
            <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-foreground/55">
              {item.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-black text-orange-600">
              Abrir
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
