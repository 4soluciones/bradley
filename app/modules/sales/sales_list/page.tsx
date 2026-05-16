"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { 
  Search, 
  History, 
  Calendar, 
  FileText, 
  SearchIcon,
  Filter,
  ShoppingCart,
  Clock,
  User,
  MoreVertical,
  ChevronDown,
  ArrowRight,
  Printer,
  Eye,
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

// --- GraphQL Operations ---

const SALES_HISTORY_QUERY = gql`
  query GetSalesHistory($action: String!, $startDate: String, $endDate: String) {
    operations(action: $action, startDate: $startDate, endDate: $endDate) {
      id
      operationDate
      emitTime
      totalTaxed
      totalIgv
      totalAmount
      operationStatus
      serial
      correlative
      documentType
      currencyType
      client {
        id
        names
        documentNumber
      }
    }
  }
`;

// --- Interfaces ---

interface Client {
  id: number;
  names: string;
  documentNumber: string;
}

interface SaleOperation {
  id: number;
  operationDate: string | null;
  emitTime: string | null;
  totalTaxed: number;
  totalIgv: number;
  totalAmount: number;
  operationStatus: string;
  serial: string | null;
  correlative: number | null;
  documentType: string;
  currencyType: string;
  client: Client | null;
}

interface SalesHistoryData {
  operations: SaleOperation[];
}

const STATUS_MAP = {
  '01': { label: 'REGISTRADO', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  '02': { label: 'AUTORIZADO', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  '07': { label: 'ANULADO', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  'NA': { label: 'NO APLICA', color: 'text-foreground/20', bg: 'bg-foreground/5', border: 'border-border' },
};

export default function SalesHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, loading, refetch } = useQuery<SalesHistoryData>(SALES_HISTORY_QUERY, {
    variables: { 
      action: 'S',
      startDate: startDate || null,
      endDate: endDate || null
    }
  });

  const sales = data?.operations ?? [];

  const filteredSales = sales.filter(sale => {
    const searchMatch = 
      (sale.serial?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       sale.correlative?.toString().includes(searchTerm) ||
       sale.client?.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
       sale.client?.documentNumber.includes(searchTerm));
    
    const statusMatch = filterStatus === "all" || sale.operationStatus === filterStatus;
    
    return searchMatch && statusMatch;
  });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-700">
      {/* Compact Header for Ferretería */}
      <div className="bg-card border border-border rounded-xl px-5 py-3 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase">
              Historial de <span className="text-emerald-600">Ventas</span>
            </h1>
            <p className="text-[8px] font-bold text-foreground/40 uppercase tracking-[0.1em]">
              Registro de Operaciones
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Filters */}
          <div className="flex items-center gap-2 bg-foreground/5 p-1 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3 h-3 text-foreground/30" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[10px] font-bold outline-none uppercase"
              />
            </div>
            <div className="w-[1px] h-4 bg-border"></div>
            <div className="flex items-center gap-1.5 px-2">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[10px] font-bold outline-none uppercase"
              />
            </div>
          </div>

          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-foreground/5 border border-transparent rounded-lg text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600/30 transition-all"
            />
          </div>
          
          <div className="flex bg-foreground/5 p-1 rounded-lg border border-border/50">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-[9px] font-black uppercase px-2 py-1 outline-none cursor-pointer"
            >
              <option value="all">TODOS</option>
              <option value="01">REGISTRADO</option>
              <option value="02">AUTORIZADO</option>
              <option value="07">ANULADO</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="p-1.5 bg-foreground/5 text-foreground/40 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Industrial Grid Content */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <tr>
                <th className="w-[12%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40">Operación</th>
                <th className="w-[15%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40">Fecha / Hora</th>
                <th className="w-[20%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40">Cliente</th>
                <th className="w-[10%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Subtotal</th>
                <th className="w-[10%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">IGV</th>
                <th className="w-[12%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Total</th>
                <th className="w-[12%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Status</th>
                <th className="w-[8%] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 bg-foreground/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const status = STATUS_MAP[sale.operationStatus as keyof typeof STATUS_MAP] || STATUS_MAP['NA'];
                  return (
                    <tr 
                      key={sale.id} 
                      className="group hover:bg-foreground/[0.01] transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-emerald-600"
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground group-hover:text-emerald-600 transition-colors uppercase">
                            VENTA
                          </span>
                          <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter">
                            {sale.serial || '---'}-{sale.correlative?.toString().padStart(6, '0') || '000000'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-foreground font-mono">
                             {sale.operationDate}
                           </span>
                           <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/30">
                             <Clock className="w-2 h-2" />
                             {sale.emitTime || '--:--'}
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground uppercase truncate">
                            {sale.client?.names || 'CLIENTE EVENTUAL'}
                          </span>
                          <span className="text-[10px] font-bold text-foreground/20 font-mono tracking-widest">
                            {sale.client?.documentNumber || '---------'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-xs font-bold text-foreground/60 font-mono">
                          {sale.totalTaxed.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-xs font-bold text-foreground/60 font-mono">
                          {sale.totalIgv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-sm font-black text-emerald-600 font-mono">
                          {sale.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center">
                          <div className={`px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}>
                             <div className={`w-1 h-1 rounded-full ${status.color.replace('text', 'bg')}`}></div>
                             <span className="text-[9px] font-black tracking-widest uppercase">{status.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 rounded-md bg-foreground/5 text-foreground/30 hover:bg-emerald-600 hover:text-white transition-all">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="p-1 rounded-md bg-foreground/5 text-foreground/30 hover:bg-blue-600 hover:text-white transition-all">
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <ShoppingCart className="w-10 h-10" />
                      <p className="font-black text-[9px] uppercase tracking-widest">Sin registros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Area Bar */}
        <div className="px-4 py-1.5 border-t border-border bg-foreground/[0.02] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <p className="text-[7px] font-black text-foreground/30 uppercase tracking-widest">
              Registros: {filteredSales.length}
            </p>
            <div className="w-[1px] h-3 bg-border"></div>
            <p className="text-[7px] font-black text-foreground/30 uppercase tracking-widest">
              Total PEN: {filteredSales.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[7px] font-black text-foreground/20 uppercase tracking-[0.2em]">Bradley Hardware System</p>
        </div>
      </div>
    </div>
  );
}
