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
  query GetPurchasesReport($type: String) {
    operations(type: $type) {
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
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    subsidiaryId: "",
    search: ""
  });

  const { data, loading, error } = useQuery<ReportData>(GET_PURCHASES_REPORT, {
    variables: { type: "01" } // Assuming 01 is purchase related based on previous edits
  });

  const filteredOperations = useMemo(() => {
    if (!data?.operations) return [];
    
    return data.operations.filter((op: Operation) => {
      const date = op.emitDate;
      const dateMatch = (!filters.startDate || date >= filters.startDate) && 
                       (!filters.endDate || date <= filters.endDate);
      
      const supplierMatch = !filters.supplierId || (op.supplierNames?.toLowerCase().includes(
        data.suppliers.find((s: Supplier) => s.id === filters.supplierId)?.names.toLowerCase() || ""
      ) ?? false);

      const searchMatch = !filters.search || 
        op.serial?.toLowerCase().includes(filters.search.toLowerCase()) ||
        op.correlative?.toString().includes(filters.search) ||
        op.supplierNames?.toLowerCase().includes(filters.search.toLowerCase());

      return dateMatch && supplierMatch && searchMatch;
    });
  }, [data, filters]);


  if (loading) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">Cargando Reporte...</p>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Widget */}
      <div className="bg-card px-10 py-10 rounded-[3rem] border border-border flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl shadow-orange-600/5 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-orange-600 flex items-center justify-center text-white shadow-2xl shadow-orange-600/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <BarChart3 className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-orange-600/10 text-orange-600 text-[9px] font-black uppercase tracking-widest rounded-full">Inteligencia de Negocio</span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Reporte de <span className="text-orange-600">Compras</span></h1>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/30 ml-1">Análisis Industrial Bradley</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
           <button className="flex flex-col items-end group">
                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Exportar Datos</p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase">Excel / PDF</span>
                    <Download className="w-4 h-4 text-orange-600" />
                </div>
           </button>
        </div>
      </div>


      {/* Main Content: Filters + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-transparent opacity-50" />
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-orange-600" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Filtros Maestros</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Fecha Inicio</label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none" />
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-full pl-11 pr-4 py-3.5 bg-foreground/[0.02] border border-border rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Fecha Fin</label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none" />
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-full pl-11 pr-4 py-3.5 bg-foreground/[0.02] border border-border rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all" />
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <Autocomplete
                label="Filtrar por Proveedor"
                options={data?.suppliers.map((s: Supplier) => ({ id: s.id, label: s.names })) || []}
                value={filters.supplierId}
                onChange={(val) => setFilters(prev => ({ ...prev, supplierId: String(val) }))}
                placeholder="Todos los proveedores"
                icon={<Truck className="w-4 h-4" />}
              />

              <Autocomplete
                label="Filtrar por Sede"
                options={data?.subsidiaries.map((s: Subsidiary) => ({ id: s.id, label: s.name })) || []}
                value={filters.subsidiaryId}
                onChange={(val) => setFilters(prev => ({ ...prev, subsidiaryId: String(val) }))}
                placeholder="Todas las sedes"
                icon={<Building2 className="w-4 h-4" />}
              />
            </div>

            <button onClick={() => setFilters({ startDate: "", endDate: "", supplierId: "", subsidiaryId: "", search: "" })} className="w-full py-4 bg-foreground/[0.03] hover:bg-red-500/10 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all">
                Reiniciar Filtros
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="xl:col-span-9 space-y-6">
          <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
            <div className="px-10 py-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 bg-foreground/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-600/10 rounded-2xl text-orange-600">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase tracking-widest">Listado de Operaciones</h3>
                    <p className="text-[10px] font-medium text-foreground/30">{filteredOperations.length} registros encontrados</p>
                  </div>
                </div>

                <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none" />
                   <input 
                    type="text" 
                    placeholder="Buscar por serie, correlativo o proveedor..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3.5 bg-foreground/[0.03] border border-border rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all"
                   />
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-foreground/[0.05]">
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border">Fecha</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border">Documento</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border">Proveedor</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border">Sede</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border text-right">Total</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredOperations.length > 0 ? filteredOperations.map((op: Operation) => (
                    <tr key={op.id} className="group hover:bg-orange-600/[0.02] transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                            <span className="text-[12px] font-black">{op.emitDate}</span>
                            <span className="text-[9px] font-medium text-foreground/30 uppercase tracking-tighter">Registrado</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${op.documentType === '01' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                            {op.documentType === '01' ? 'FT' : 'BV'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-foreground">{op.serial}-{op.correlative}</span>
                            <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">{op.documentType === '01' ? 'Factura' : 'Boleta'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">{op.supplierNames || '---'}</span>
                            <span className="text-[10px] font-medium text-foreground/30">{op.supplierDocumentNumber || '---'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-black bg-foreground/5 px-2.5 py-1 rounded-lg uppercase text-foreground/50">{op.subsidiaryName || 'Principal'}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                            <span className="text-[14px] font-black text-foreground">{op.currencyType === 'PEN' ? 'S/' : '$'} {op.totalAmount.toFixed(2)}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Pagado full</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <button className="p-2 hover:bg-orange-600 hover:text-white rounded-xl transition-all text-foreground/10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                           <div className="w-16 h-16 bg-foreground/[0.03] rounded-full flex items-center justify-center text-foreground/10">
                              <Package className="w-8 h-8" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">No se encontraron operaciones con los filtros actuales</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="mt-auto px-10 py-6 border-t border-border flex items-center justify-between">
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em]">Mostrando {filteredOperations.length} de {filteredOperations.length} resultados</p>
                <div className="flex items-center gap-2">
                   <button disabled className="px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase opacity-30">Anterior</button>
                   <button className="px-4 py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase">1</button>
                   <button disabled className="px-4 py-2 border border-border rounded-xl text-[10px] font-black uppercase opacity-30">Siguiente</button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
