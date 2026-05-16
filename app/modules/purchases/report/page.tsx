"use client";

import React, { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Calendar,
  Filter,
  Package,
  Download,
  Search,
  ChevronRight,
  Truck,
  Building2,
  BarChart3,
  Eye,
  Hammer,
  FileText,
} from "lucide-react";
import Autocomplete from "@/app/components/Autocomplete";
import Modal from "@/app/components/Modal";

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

const GET_OPERATION_PURCHASE_DETAIL = gql`
  query GetOperationPurchaseDetail($operationId: Int!) {
    operation(operationId: $operationId) {
      id
      documentType
      operationStatus
      serial
      correlative
      emitDate
      currencyType
      totalAmount
      totalTaxed
      totalIgv
      supplierNames
      supplierDocumentNumber
      subsidiaryName
      warehouseName
      observation
      details {
        id
        productName
        productCode
        unitSymbol
        quantity
        unitPrice
        totalAmount
        description
      }
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

interface OperationDetailRow {
  id: string;
  productName?: string | null;
  productCode?: string | null;
  unitSymbol?: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  description?: string | null;
}

interface OperationDetailQueryData {
  operation: {
    id: number;
    documentType: string;
    operationStatus: string;
    serial?: string | null;
    correlative?: number | null;
    emitDate?: string | null;
    currencyType: string;
    totalAmount: number;
    totalTaxed: number;
    totalIgv: number;
    supplierNames?: string | null;
    supplierDocumentNumber?: string | null;
    subsidiaryName?: string | null;
    warehouseName?: string | null;
    observation?: string | null;
    details: OperationDetailRow[];
  } | null;
}

function formatMoney(amount: number, currency: string, decimals: number = 2) {
  const sym = currency === "PEN" ? "S/" : currency === "USD" ? "$" : `${currency} `;
  return `${sym}${amount.toLocaleString("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatQty(q: number) {
  return q.toLocaleString("es-PE", { maximumFractionDigits: 6 });
}

export default function PurchasesReportPage() {
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    supplierId: "",
    subsidiaryId: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [detailOperation, setDetailOperation] = useState<Operation | null>(null);

  const { data, loading } = useQuery<ReportData>(GET_PURCHASES_REPORT, {
    variables: {
      type: "0501",
      action: "E",
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
    },
  });

  const operationIdForDetail = detailOperation ? parseInt(String(detailOperation.id), 10) : 0;

  const { data: detailData, loading: detailLoading, error: detailError } = useQuery<OperationDetailQueryData>(
    GET_OPERATION_PURCHASE_DETAIL,
    {
      variables: { operationId: operationIdForDetail },
      skip: !detailOperation || !Number.isFinite(operationIdForDetail) || operationIdForDetail <= 0,
    }
  );

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const supplierAutocompleteOptions = useMemo(
    () =>
      data?.suppliers.map((s: Supplier) => ({
        id: s.id,
        label: s.documentNumber ? `${s.names} · ${s.documentNumber}` : s.names,
      })) ?? [],
    [data?.suppliers]
  );

  const filteredOperations = useMemo(() => {
    if (!data?.operations) return [];

    return data.operations.filter((op: Operation) => {
      const supplierMatch =
        !appliedFilters.supplierId ||
        (op.supplierNames?.toLowerCase().includes(
          data.suppliers.find((s: Supplier) => s.id === appliedFilters.supplierId)?.names.toLowerCase() || ""
        ) ??
          false);

      const subsidiaryMatch =
        !appliedFilters.subsidiaryId ||
        op.subsidiaryName === data.subsidiaries.find((s: Subsidiary) => s.id === appliedFilters.subsidiaryId)?.name;

      return supplierMatch && subsidiaryMatch;
    });
  }, [data, appliedFilters]);

  const opFull = detailData?.operation;

  if (loading)
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">Cargando Reporte...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-foreground">
              Reporte de <span className="text-orange-600">Compras</span>
            </h1>
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none">
              Análisis Operacional Bradley
            </p>
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
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">
                Fecha Inicio
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full pl-9 pr-3 h-9 bg-foreground/[0.02] border border-border/50 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">
                Fecha Fin
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full pl-9 pr-3 h-9 bg-foreground/[0.02] border border-border/50 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 transition-all outline-none"
                />
              </div>
            </div>

            <div className="w-full min-w-0 sm:min-w-[18rem] md:min-w-[26rem] lg:min-w-[32rem] md:flex-[1.25] md:max-w-3xl">
              <Autocomplete
                label="Proveedor"
                compact
                options={supplierAutocompleteOptions}
                value={filters.supplierId}
                onChange={(val) => setFilters((prev) => ({ ...prev, supplierId: String(val) }))}
                placeholder="Buscar por nombre o documento…"
                icon={<Truck className="w-3.5 h-3.5" />}
              />
            </div>

            <div className="w-44">
              <Autocomplete
                label="Sede"
                compact
                options={data?.subsidiaries.map((s: Subsidiary) => ({ id: s.id, label: s.name })) || []}
                value={filters.subsidiaryId}
                onChange={(val) => setFilters((prev) => ({ ...prev, subsidiaryId: String(val) }))}
                placeholder="Todas"
                icon={<Building2 className="w-3.5 h-3.5" />}
              />
            </div>

            <button
              onClick={handleSearch}
              className="min-w-[10.5rem] px-8 h-9 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar Reporte
            </button>

            <button
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                const resetVal = { startDate: today, endDate: today, supplierId: "", subsidiaryId: "" };
                setFilters(resetVal);
                setAppliedFilters(resetVal);
              }}
              className="min-w-[9.5rem] px-8 h-9 bg-foreground/[0.03] hover:bg-red-500/10 hover:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-red-500/20"
            >
              <div className="flex items-center justify-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                Limpiar
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-10 bg-card border-b border-border/50 shadow-sm">
                <tr className="bg-stone-100/80 dark:bg-stone-900/40">
                  <th className="w-[8.5rem] min-w-[8.5rem] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Fecha
                  </th>
                  <th className="w-44 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Documento
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Proveedor
                  </th>
                  <th className="w-52 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Sede
                  </th>
                  <th className="w-44 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                    Almacén
                  </th>
                  <th className="w-32 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50 text-right">
                    Total
                  </th>
                  <th className="w-24 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground/50 text-center">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredOperations.length > 0 ? (
                  filteredOperations.map((op: Operation) => (
                    <tr key={op.id} className="group hover:bg-orange-600/[0.04] transition-colors">
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="text-xs font-black tabular-nums">{op.emitDate}</span>
                          <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-tighter">
                            Registrado
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-foreground truncate">
                            {op.serial}-{op.correlative}
                          </span>
                          <span className="text-[9px] font-black text-foreground/35 uppercase tracking-widest">
                            {op.documentType === "01" ? "Factura" : "Boleta"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col truncate min-w-0">
                          <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80 truncate leading-snug">
                            {op.supplierNames || "---"}
                          </span>
                          <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-tighter leading-snug">
                            {op.supplierDocumentNumber || "---"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <span className="text-[11px] font-black bg-foreground/[0.05] border border-border/50 px-2 py-0.5 rounded-md uppercase text-foreground/60">
                          {op.subsidiaryName || "---"}
                        </span>
                      </td>
                      <td className="px-4 py-2 align-top">
                        <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-tighter truncate block">
                          {op.warehouseName || "---"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right align-top">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-foreground font-mono">
                            {op.currencyType === "PEN" ? "S/" : "$"} {op.totalAmount.toFixed(2)}
                          </span>
                          <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-tighter">
                            Liquidado
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center align-top">
                        <button
                          type="button"
                          onClick={() => setDetailOperation(op)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-orange-600/25 bg-orange-600/10 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-orange-700 hover:bg-orange-600 hover:text-white transition-colors"
                          title="Ver detalle de la compra"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
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

          <div className="px-5 py-3 border-t border-border/50 bg-foreground/[0.01] flex items-center justify-between shrink-0">
            <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">
              Mostrando <span className="text-foreground/60">{filteredOperations.length}</span> registros
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center border border-border/50 rounded-lg opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
              <span className="text-[10px] font-black w-6 text-center">1</span>
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center border border-border/50 rounded-lg opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!detailOperation}
        onClose={() => setDetailOperation(null)}
        title=""
        width="max-w-6xl"
        headerClassName="hidden"
        bodyClassName="p-0"
      >
        {detailOperation && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Cabecera estilo ferretería / almacén */}
            <div className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-100 px-5 py-5 sm:px-7 sm:py-6 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 dark:border-stone-800">
              <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-stone-300/40 dark:border-stone-600/30" />
              <div className="pointer-events-none absolute right-24 top-6 opacity-[0.07] dark:opacity-[0.12]">
                <Hammer className="h-28 w-28 text-stone-900 dark:text-stone-100" strokeWidth={1} />
              </div>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-300/80 bg-white/90 text-amber-800 shadow-sm dark:border-stone-600 dark:bg-stone-800/90 dark:text-amber-500">
                    <Hammer className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                      Bradley · Detalle de compra
                    </p>
                    <h2 className="mt-1 font-black tracking-tight text-stone-900 dark:text-stone-100 text-lg sm:text-xl">
                      {detailOperation.serial}-{detailOperation.correlative}
                      <span className="ml-2 text-sm font-bold text-stone-500 dark:text-stone-400">
                        {detailOperation.documentType === "01" ? "Factura" : "Boleta"}
                      </span>
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
                      {detailOperation.supplierNames}
                      {detailOperation.supplierDocumentNumber
                        ? ` · RUC/DNI ${detailOperation.supplierDocumentNumber}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300/70 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-300">
                    <FileText className="h-3.5 w-3.5" />
                    {detailOperation.emitDate}
                  </span>
                  <span className="inline-flex items-center rounded-lg border border-amber-700/25 bg-amber-900/[0.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    {detailOperation.operationStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 sm:px-6 sm:py-5">
              {detailLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/35">
                    Cargando ítems de la compra…
                  </p>
                </div>
              )}

              {!detailLoading && detailError && (
                <p className="py-12 text-center text-sm font-semibold text-red-600 dark:text-red-400">
                  {detailError.message}
                </p>
              )}

              {!detailLoading && !detailError && !opFull && (
                <p className="py-12 text-center text-sm font-semibold text-foreground/50">
                  No se pudo cargar el detalle de esta operación.
                </p>
              )}

              {!detailLoading && !detailError && opFull && (
                <>
                  <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="min-w-0 rounded-xl border border-border/60 bg-foreground/[0.02] px-3 py-2.5 sm:col-span-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Sede</p>
                      <p
                        className="mt-0.5 text-sm font-bold text-foreground truncate"
                        title={opFull.subsidiaryName || undefined}
                      >
                        {opFull.subsidiaryName || "—"}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-border/60 bg-foreground/[0.02] px-3 py-2.5 sm:col-span-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Almacén</p>
                      <p
                        className="mt-0.5 text-sm font-bold text-foreground truncate"
                        title={opFull.warehouseName || undefined}
                      >
                        {opFull.warehouseName || "—"}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-border/60 bg-foreground/[0.02] px-3 py-2.5 sm:col-span-8">
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Observación</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground whitespace-pre-wrap break-words">
                        {opFull.observation || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/55">
                      Materiales y suministros
                    </h3>
                    <span className="text-[10px] font-bold text-foreground/40">
                      {opFull.details?.length ?? 0} ítem{(opFull.details?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-stone-200/90 dark:border-stone-700/80">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-400">
                          <th className="w-10 px-2 py-2.5 text-center">#</th>
                          <th className="w-24 px-2 py-2.5">Código</th>
                          <th className="px-3 py-2.5">Descripción</th>
                          <th className="w-14 px-2 py-2.5 text-center">Ud.</th>
                          <th className="w-24 px-2 py-2.5 text-right">Cant.</th>
                          <th className="w-36 px-2 py-2.5 text-right">P. unit.</th>
                          <th className="w-32 px-3 py-2.5 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {(opFull.details ?? []).map((row, idx) => (
                          <tr
                            key={row.id}
                            className="bg-white/80 odd:bg-stone-50/90 dark:bg-stone-950/40 dark:odd:bg-stone-900/35"
                          >
                            <td className="px-2 py-2.5 text-center text-xs font-bold tabular-nums text-foreground/45">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-2.5 font-mono text-xs font-bold text-foreground/70">
                              {row.productCode || "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-foreground leading-snug">
                                {row.productName || row.description || "Sin descripción"}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-center text-xs font-bold text-foreground/60">
                              {row.unitSymbol || "—"}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-xs font-bold tabular-nums">
                              {formatQty(row.quantity)}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-xs font-semibold tabular-nums text-foreground/80">
                              {formatMoney(row.unitPrice, opFull.currencyType, 4)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-sm font-black text-foreground">
                              {formatMoney(row.totalAmount, opFull.currencyType)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-end sm:justify-end">
                    <div className="flex flex-col items-stretch gap-1.5 rounded-xl border border-border/60 bg-foreground/[0.02] px-4 py-3 sm:min-w-[220px]">
                      <div className="flex justify-between text-[11px] font-bold text-foreground/55">
                        <span>Op. gravada</span>
                        <span className="font-mono">{formatMoney(opFull.totalTaxed, opFull.currencyType)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-foreground/55">
                        <span>IGV</span>
                        <span className="font-mono">{formatMoney(opFull.totalIgv, opFull.currencyType)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-black text-foreground">
                        <span>TOTAL</span>
                        <span className="font-mono text-base text-amber-800 dark:text-amber-500">
                          {formatMoney(opFull.totalAmount, opFull.currencyType)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-border/60 bg-foreground/[0.02] px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setDetailOperation(null)}
                className="rounded-xl border border-stone-300 bg-white px-5 py-2 text-xs font-black uppercase tracking-widest text-stone-700 shadow-sm transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
