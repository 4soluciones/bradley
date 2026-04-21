"use client";

import React, { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { 
  FileSearch, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Package, 
  User, 
  ArrowRight,
  Download,
  Search,
  ChevronRight,
  Truck,
  Building2,
  DollarSign,
  BarChart3,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Autocomplete from "@/app/components/Autocomplete";

// --- GraphQL Operations ---

const GET_PURCHASES_REPORT = gql`
  query GetPurchasesReport($type: String, $action: String, $startDate: String, $endDate: String) {
    operations(type: $type, action: $action, startDate: $startDate, endDate: $endDate) {
      id
      documentType
      operationType
      operationStatus
      serial
      correlative
      currencyType
      totalAmount
      emitDate
      supplierNames
      supplierDocumentNumber
      subsidiaryName
      warehouseName
    }
    suppliers {
      id
      names
      documentNumber
    }
    subsidiaries {
      id
      name
    }
  }
`;

// --- Interfaces ---

interface Operation {
  id: string;
  documentType: string;
  operationType: string;
  operationStatus: string;
  serial: string;
  correlative: number;
  currencyType: string;
  totalAmount: number;
  emitDate: string;
  supplierNames: string;
  supplierDocumentNumber: string;
  subsidiaryName: string;
  warehouseName: string;
}

interface Supplier {
  id: string;
  names: string;
  documentNumber: string;
}

interface Subsidiary {
  id: string;
  name: string;
}

interface ReportData {
  operations: Operation[];
  suppliers: Supplier[];
  subsidiaries: Subsidiary[];
}

export default function PurchasesReportPage() {
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    subsidiaryId: "",
    search: ""
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, loading, error } = useQuery<ReportData>(GET_PURCHASES_REPORT, {
    variables: { 
      type: "0501",
      action: "E",
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate
    }
  });

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const filteredOperations = useMemo(() => {
    if (!data?.operations) return [];
    
    return data.operations.filter((op: Operation) => {
      const supplierMatch = !appliedFilters.supplierId || (op.supplierNames?.toLowerCase().includes(
        data.suppliers.find((s: Supplier) => s.id === appliedFilters.supplierId)?.names.toLowerCase() || ""
      ) ?? false);

      const subsidiaryMatch = !appliedFilters.subsidiaryId || (op.subsidiaryName === 
        data.subsidiaries.find((s: Subsidiary) => s.id === appliedFilters.subsidiaryId)?.name
      );

      const searchMatch = !appliedFilters.search || 
        op.serial?.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        op.correlative?.toString().includes(appliedFilters.search) ||
        op.supplierNames?.toLowerCase().includes(appliedFilters.search.toLowerCase());

      return supplierMatch && subsidiaryMatch && searchMatch;
    });
  }, [data, appliedFilters]);


  if (loading) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">Cargando Reporte...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Slim Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-foreground">Reporte de <span className="text-orange-600">Compras</span></h1>
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">Análisis Operacional Bradley</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end px-4 border-r border-border">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Total Operaciones</span>
            <span className="text-sm font-black">{filteredOperations.length}</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Horizontal Filters Bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Fecha Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
                <input 
                  type="date" 
                  value={filters.startDate} 
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} 
                  className="w-full pl-9 pr-3 h-9 bg-foreground/[0.02] border border-border/50 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Fecha Fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
                <input 
                  type="date" 
                  value={filters.endDate} 
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} 
                  className="w-full pl-9 pr-3 h-9 bg-foreground/[0.02] border border-border/50 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none" 
                />
              </div>
            </div>

            <div className="w-60">
              <Autocomplete
                label="Proveedor"
                compact
                options={data?.suppliers.map((s: Supplier) => ({ id: s.id, label: s.names })) || []}
                value={filters.supplierId}
                onChange={(val) => setFilters(prev => ({ ...prev, supplierId: String(val) }))}
                placeholder="Todos"
                icon={<Truck className="w-3.5 h-3.5" />}
              />
            </div>

            <div className="w-44">
              <Autocomplete
                label="Sede"
                compact
                options={data?.subsidiaries.map((s: Subsidiary) => ({ id: s.id, label: s.name })) || []}
                value={filters.subsidiaryId}
                onChange={(val) => setFilters(prev => ({ ...prev, subsidiaryId: String(val) }))}
                placeholder="Todas"
                icon={<Building2 className="w-3.5 h-3.5" />}
              />
            </div>

            <button 
              onClick={handleSearch} 
              className="px-6 h-9 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar Reporte
            </button>

            <button 
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const resetVal = { startDate: today, endDate: today, supplierId: "", subsidiaryId: "", search: "" };
                setFilters(resetVal);
                setAppliedFilters(resetVal);
              }} 
              className="px-4 h-9 bg-foreground/[0.03] hover:bg-red-500/10 hover:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-red-500/20"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                Limpiar
              </div>
            </button>
          </div>
        </div>

        {/* Results Container - Table with internal scroll */}
        <div className="flex-1 flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-foreground/[0.01]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-600/10 rounded-lg flex items-center justify-center text-orange-600">
                <FileSearch className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">Registros Detallados</h3>
            </div>

            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
               <input 
                type="text" 
                placeholder="Buscar por serie, correlativo..." 
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 bg-foreground/[0.03] border border-border/50 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none"
               />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-10 bg-card border-b border-border/50 shadow-sm">
                <tr className="bg-foreground/[0.03]">
                  <th className="w-24 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50">Fecha</th>
                  <th className="w-36 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50">Documento</th>
                  <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50">Proveedor</th>
                  <th className="w-48 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50">Sede</th>
                  <th className="w-40 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50">Almacén</th>
                  <th className="w-28 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredOperations.length > 0 ? filteredOperations.map((op: Operation) => (
                  <tr key={op.id} className="group hover:bg-orange-600/[0.03] transition-colors">
                    <td className="px-4 py-1.5">
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black">{op.emitDate}</span>
                          <span className="text-[7px] font-bold text-foreground/30 uppercase tracking-tighter">Registrado</span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-[8px] font-black border ${
                          op.documentType === '01' 
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}>
                          {op.documentType === '01' ? 'FT' : 'BV'}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-[10px] font-black text-foreground truncate">{op.serial}-{op.correlative}</span>
                          <span className="text-[7px] font-black text-foreground/30 uppercase tracking-widest">{op.documentType === '01' ? 'Factura' : 'Boleta'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex flex-col truncate">
                          <span className="text-[9px] font-black uppercase tracking-tight text-foreground/80 truncate leading-tight">{op.supplierNames || '---'}</span>
                          <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-tighter leading-tight">{op.supplierDocumentNumber || '---'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5">
                       <span className="text-[9px] font-black bg-foreground/[0.05] border border-border/50 px-2 py-0.5 rounded uppercase text-foreground/60">{op.subsidiaryName || '---'}</span>
                    </td>
                    <td className="px-4 py-1.5">
                       <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-tighter truncate block">{op.warehouseName || '---'}</span>
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <div className="flex flex-col items-end">
                          <span className="text-[11px] font-black text-foreground font-mono">{op.currencyType === 'PEN' ? 'S/' : '$'} {op.totalAmount.toFixed(2)}</span>
                          <span className="text-[7px] font-black text-emerald-600/70 uppercase tracking-tighter">Liquidado</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className="w-12 h-12 bg-foreground/[0.02] rounded-2xl flex items-center justify-center text-foreground/10 border border-border/50">
                            <Package className="w-6 h-6" />
                         </div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-foreground/20">Sin Resultados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-border/50 bg-foreground/[0.01] flex items-center justify-between">
              <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">
                Mostrando <span className="text-foreground/60">{filteredOperations.length}</span> registros
              </p>
              <div className="flex items-center gap-2">
                 <button disabled className="w-7 h-7 flex items-center justify-center border border-border/50 rounded-lg opacity-30">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                 </button>
                 <span className="text-[10px] font-black w-6 text-center">1</span>
                 <button disabled className="w-7 h-7 flex items-center justify-center border border-border/50 rounded-lg opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                 </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
