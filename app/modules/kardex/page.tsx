"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { ClipboardList, Search, Package, Factory, Building2, Play } from "lucide-react";
import { KARDEX_LIST_QUERY } from "./graphql";
import { PRODUCTS_QUERY, WAREHOUSES_QUERY, SUBSIDIARIES_QUERY } from "../products/graphql";
import type { ProductsData, WarehousesData, SubsidiariesData } from "../products/types";

interface KardexEntry {
  id: string;
  operation: string;
  typeDocument: string;
  typeOperation: string;
  quantity: number;
  priceUnit: number;
  priceTotal: number;
  remainingQuantity: number;
  remainingPrice: number;
  remainingPriceTotal: number;
  createAt: string;
  productName: string;
  warehouseName: string;
  documentSerialCorrelative: string | null;
}

interface KardexData {
  kardexList: KardexEntry[];
}

export default function KardexPage() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useState<{ productId: number | null, warehouseId: number | null }>({ productId: null, warehouseId: null });

  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: productsData } = useQuery<ProductsData>(PRODUCTS_QUERY);
  const { data: warehousesData } = useQuery<WarehousesData>(WAREHOUSES_QUERY);
  const { data: subsidiariesData } = useQuery<SubsidiariesData>(SUBSIDIARIES_QUERY);

  const { data: kardexData, loading, refetch } = useQuery<KardexData>(KARDEX_LIST_QUERY, {
    variables: { 
      productId: searchParams.productId,
      warehouseId: searchParams.warehouseId 
    },
    skip: !searchParams.productId || !searchParams.warehouseId,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
    );
  }, [productsData, productSearch]);

  const filteredWarehouses = useMemo(() => {
    if (!warehousesData) return [];
    if (!selectedSubsidiaryId) return warehousesData.warehouses;
    return warehousesData.warehouses.filter(w => w.subsidiaryId === selectedSubsidiaryId);
  }, [warehousesData, selectedSubsidiaryId]);

  const handleSearch = () => {
    if (searchParams.productId === selectedProductId && searchParams.warehouseId === selectedWarehouseId) {
      refetch();
    } else {
      setSearchParams({
        productId: selectedProductId,
        warehouseId: selectedWarehouseId
      });
    }
  };

  const formatPeriod = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const splitSerialCorrelative = (serialCorrelative: string | null) => {
    if (!serialCorrelative) return { serie: "", numero: "" };
    const parts = serialCorrelative.split("-");
    if (parts.length > 1) {
      return { serie: parts[0], numero: parts.slice(1).join("-") };
    }
    return { serie: "", numero: serialCorrelative };
  };

  const initialInventories = kardexData?.kardexList?.filter(k => k.operation === 'C') || [];
  const purchases = kardexData?.kardexList?.filter(k => k.operation === 'E') || [];
  const finalInventory = kardexData?.kardexList && kardexData.kardexList.length > 0 ? kardexData.kardexList[kardexData.kardexList.length - 1] : null;

  const hasInitial = initialInventories.length > 0;
  const initialQty = initialInventories.reduce((acc, curr) => acc + curr.remainingQuantity, 0);
  const initialVal = initialInventories.reduce((acc, curr) => acc + curr.remainingPriceTotal, 0);
  const purchasesQty = purchases.reduce((acc, curr) => acc + curr.quantity, 0);
  const purchasesVal = purchases.reduce((acc, curr) => acc + curr.priceTotal, 0);
  const finalQty = finalInventory ? finalInventory.remainingQuantity : 0;
  const finalVal = finalInventory ? finalInventory.remainingPriceTotal : 0;
  
  const costOfSalesQty = initialQty + purchasesQty - finalQty;
  const costOfSalesVal = initialVal + purchasesVal - finalVal;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500 text-sm overflow-hidden">
      {/* Header Compacto & Filtros */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#0f2a3f] p-2 rounded-xl">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
              Kardex <span className="text-[#0f2a3f] dark:text-blue-400">Sunat</span>
            </h1>
            <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-wider">Formato 13.1 - Registro de Inventario Permanente Valorizado</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Product Autocomplete */}
          <div className="relative flex-1 min-w-[300px]" ref={dropdownRef}>
            <div className="flex items-center gap-2 bg-foreground/[0.03] border border-border rounded-xl px-3 py-2 w-full focus-within:border-[#0f2a3f] transition-colors">
              <Search className="w-4 h-4 text-foreground/40 shrink-0" />
              <input
                type="text"
                placeholder="BUSCAR PRODUCTO..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductDropdownOpen(true);
                  if (selectedProductId) setSelectedProductId(null);
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground focus:ring-0 uppercase placeholder:text-foreground/30"
              />
            </div>
            {isProductDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredProducts.length > 0 ? filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    className="px-4 py-2 hover:bg-foreground/[0.05] cursor-pointer text-xs font-bold uppercase border-b border-border/50 last:border-0"
                    onClick={() => {
                      setSelectedProductId(parseInt(p.id));
                      setProductSearch(`${p.code || "S/C"} - ${p.name}`);
                      setIsProductDropdownOpen(false);
                    }}
                  >
                    {p.code || "S/C"} - {p.name}
                  </div>
                )) : (
                  <div className="px-4 py-3 text-xs font-bold text-foreground/50 uppercase text-center">
                    No se encontraron productos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subsidiary Filter */}
          <div className="flex items-center gap-2 bg-foreground/[0.03] border border-border rounded-xl px-3 py-2 w-[220px]">
            <Building2 className="w-4 h-4 text-foreground/40 shrink-0" />
            <select
              value={selectedSubsidiaryId || ""}
              onChange={(e) => {
                setSelectedSubsidiaryId(e.target.value ? parseInt(e.target.value) : null);
                setSelectedWarehouseId(null);
              }}
              className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground focus:ring-0 uppercase cursor-pointer"
            >
              <option value="">SELECCIONAR SEDE</option>
              {subsidiariesData?.subsidiaries.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-2 bg-foreground/[0.03] border border-border rounded-xl px-3 py-2 w-[220px]">
            <Factory className="w-4 h-4 text-foreground/40 shrink-0" />
            <select
              value={selectedWarehouseId || ""}
              onChange={(e) => setSelectedWarehouseId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-transparent border-none outline-none text-xs font-bold text-foreground focus:ring-0 uppercase cursor-pointer disabled:opacity-50"
              disabled={!selectedSubsidiaryId}
            >
              <option value="">SELECCIONAR ALMACÉN</option>
              {filteredWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!selectedProductId || !selectedWarehouseId || loading}
            className="flex items-center gap-2 bg-[#0f2a3f] hover:bg-[#0f2a3f]/90 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            Buscar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {!searchParams.productId || !searchParams.warehouseId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-foreground/30">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <span className="font-black text-lg tracking-tight uppercase">Esperando Búsqueda</span>
            <span className="text-xs font-bold uppercase tracking-wider mt-2">
              Seleccione producto, sede, almacén y presione buscar
            </span>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-foreground/30 animate-pulse">
            <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
            <span className="font-black text-xs uppercase tracking-widest">Generando Kardex...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead className="sticky top-0 z-20">
                  {/* Top Header Row */}
                  <tr>
                    <th colSpan={6} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-[#0f2a3f] border border-white/10 text-center">
                      DOCUMENTO DE TRASLADO, COMPROBANTE DE PAGO, DOCUMENTO INTERNO O SIMILAR
                    </th>
                    <th colSpan={3} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-[#0f2a3f] border border-white/10 text-center">
                      ENTRADAS
                    </th>
                    <th colSpan={3} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-[#0f2a3f] border border-white/10 text-center">
                      SALIDAS
                    </th>
                    <th colSpan={3} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-[#0f2a3f] border border-white/10 text-center">
                      SALDO
                    </th>
                  </tr>
                  {/* Sub Header Row */}
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">PERIODO</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">FECHA</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">TIPO</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">SERIE</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">NUMERO</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">TIPO DE OPERACION</th>
                    
                    {/* ENTRADAS */}
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">CANTIDAD</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">COSTO UNITARIO</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">COSTO TOTAL</th>
                    
                    {/* SALIDAS */}
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">CANTIDAD</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">COSTO UNITARIO</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">COSTO TOTAL</th>
                    
                    {/* SALDO */}
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">CANTIDAD</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">COSTO UNITARIO</th>
                    <th className="px-3 py-2 text-[10px] font-black uppercase text-white bg-[#0f2a3f] border border-white/10 text-center">COSTO TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexData?.kardexList && kardexData.kardexList.length > 0 ? (
                    kardexData.kardexList.map((entry, idx) => {
                      const { serie, numero } = splitSerialCorrelative(entry.documentSerialCorrelative);
                      const isInitial = entry.operation === 'C';
                      const isInput = entry.operation === 'E';
                      const isOutput = entry.operation === 'S';

                      return (
                        <tr key={entry.id} className="hover:bg-foreground/[0.02] transition-colors border-b border-border/50">
                          {/* Info Documento */}
                          <td className="px-3 py-2 text-[11px] font-mono text-center text-foreground/80">{formatPeriod(entry.createAt)}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-center text-foreground/80">{formatDateOnly(entry.createAt)}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-center text-foreground/80">{entry.typeDocument || '00'}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-center text-foreground/80">{isInitial ? '' : serie}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-center text-foreground/80">{isInitial ? '' : numero}</td>
                          <td className="px-3 py-2 text-[11px] font-mono text-center text-foreground/80">{entry.typeOperation || '16'}</td>
                          
                          {/* Entradas */}
                          <td className="px-3 py-2 text-[11px] font-mono text-right text-foreground/80 bg-foreground/[0.01]">
                            {isInput ? entry.quantity.toFixed(2) : '-'}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-right text-foreground/80 bg-foreground/[0.01]">
                            {isInput ? entry.priceUnit.toFixed(4) : '-'}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-right text-foreground/80 bg-foreground/[0.01]">
                            {isInput ? entry.priceTotal.toFixed(2) : '-'}
                          </td>

                          {/* Salidas */}
                          <td className="px-3 py-2 text-[11px] font-mono text-right text-foreground/80">
                            {isOutput ? entry.quantity.toFixed(2) : '-'}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-right text-foreground/80">
                            {isOutput ? entry.priceUnit.toFixed(4) : '-'}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-right text-foreground/80">
                            {isOutput ? entry.priceTotal.toFixed(2) : '-'}
                          </td>

                          {/* Saldo */}
                          <td className="px-3 py-2 text-[11px] font-mono text-right font-bold text-foreground bg-foreground/[0.03]">
                            {entry.remainingQuantity.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-right font-bold text-foreground bg-foreground/[0.03]">
                            {entry.remainingPrice.toFixed(4)}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-right font-bold text-foreground bg-foreground/[0.03]">
                            {entry.remainingPriceTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={15} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-foreground/30">
                          <ClipboardList className="w-10 h-10 mb-2 opacity-20" />
                          <span className="font-black text-[10px] uppercase tracking-widest">No hay movimientos en este periodo</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Bottom Summary Section */}
              {kardexData?.kardexList && kardexData.kardexList.length > 0 && (
                <div className="flex justify-end p-6 border-t border-border mt-auto">
                  <div className="w-[450px] border border-border rounded-lg overflow-hidden bg-card shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="bg-foreground/[0.03] border-b border-border p-3 text-left text-xs font-black uppercase text-foreground/60"></th>
                          <th className="bg-foreground/[0.03] border-b border-l border-border p-3 text-right text-xs font-black uppercase text-foreground/80">UNIDADES</th>
                          <th className="bg-foreground/[0.03] border-b border-l border-border p-3 text-right text-xs font-black uppercase text-foreground/80">VALORIZADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50 hover:bg-foreground/[0.01]">
                          <td className="p-3 text-xs font-bold text-foreground/70">Inventario Inicial</td>
                          <td className="p-3 text-right font-mono text-[13px] border-l border-border/50">{hasInitial ? initialQty.toFixed(2) : '-'}</td>
                          <td className="p-3 text-right font-mono text-[13px] border-l border-border/50">{hasInitial ? initialVal.toFixed(2) : '-'}</td>
                        </tr>
                        <tr className="border-b border-border/50 hover:bg-foreground/[0.01]">
                          <td className="p-3 text-xs font-bold text-foreground/70">(+) Compras</td>
                          <td className="p-3 text-right font-mono text-[13px] border-l border-border/50">{purchasesQty.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-[13px] border-l border-border/50">{purchasesVal.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-border hover:bg-foreground/[0.01]">
                          <td className="p-3 text-xs font-bold text-foreground/70">(-) Inventario Final</td>
                          <td className="p-3 text-right font-mono text-[13px] border-l border-border/50">{finalQty.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-[13px] border-l border-border/50">{finalVal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-xs font-black uppercase text-foreground bg-yellow-400 dark:bg-yellow-500 text-black">(=) Costo de Venta</td>
                          <td className="p-3 text-right font-mono text-[13px] font-black border-l border-border/50 bg-yellow-400 dark:bg-yellow-500 text-black">{costOfSalesQty.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-[13px] font-black border-l border-border/50 bg-[#0f2a3f] text-white dark:bg-blue-600">{costOfSalesVal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--border);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--foreground) 22%, transparent);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: color-mix(in srgb, var(--accent) 55%, var(--foreground));
        }
      `}</style>
    </div>
  );
}
