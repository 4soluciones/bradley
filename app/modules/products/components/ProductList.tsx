"use client";

import React from "react";
import { Product } from "../types";
import { getProductImageUrl } from "../utils";
import { Package, Edit, Eye } from "lucide-react";

interface ProductListProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
}

export default function ProductList({ products, loading, onEdit, onView }: ProductListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10 bg-card border border-border rounded-xl">
        <Package className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground/50">No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] min-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm text-foreground/50 text-[10px] uppercase font-bold tracking-wider">
            <tr>
              <th className="px-3 py-2.5 border-b border-border w-14">Img</th>
              <th className="px-3 py-2.5 border-b border-border">SKU / Cód.</th>
              <th className="px-3 py-2.5 border-b border-border w-full">Nombre del Producto</th>
              <th className="px-3 py-2.5 border-b border-border text-right">Precio</th>
              <th className="px-3 py-2.5 border-b border-border text-right">Costo</th>
              <th className="px-3 py-2.5 border-b border-border text-right">Utilidad</th>
              <th className="px-3 py-2.5 border-b border-border text-right">Existencia</th>
              <th className="px-3 py-2.5 border-b border-border text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const mainPrice = product.tariffs?.find(t => t.typePrice === 3 || t.typePrice === 4 || t.typePrice === 0)?.priceWithIgv || 0;
              const mainCost = product.tariffs?.find(t => t.typePrice === 1 || t.typePrice === 2)?.priceWithIgv || 0;
              const totalStock = product.productStores?.reduce((sum, ps) => sum + (ps.stock || 0), 0) || 0;
              
              const utilityPercent = mainCost > 0 ? ((mainPrice / mainCost) - 1) * 100 : 0;

              return (
                <tr 
                  key={product.id} 
                  className="hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors group"
                >
                  <td className="px-3 py-1.5 border-b border-border/50">
                    <div className="w-9 h-9 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center">
                      {getProductImageUrl(product.imageUrl) ? (
                        <img src={getProductImageUrl(product.imageUrl)!} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-foreground/20" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50">
                    <span className="text-[10px] font-black text-orange-600/70 border border-orange-600/20 px-1.5 py-0.5 rounded bg-orange-600/5">
                      {'SKU-' + (product.code || '000')}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50">
                    <div className="font-bold text-foreground truncate max-w-[200px] md:max-w-md uppercase text-[11px]">
                      {product.name?.toUpperCase() ?? ''}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50 text-right">
                    <span className="text-[11px] font-black text-foreground/70">
                      S/ {Number(mainPrice).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50 text-right">
                    <span className="text-[11px] font-black text-foreground/70">
                      S/ {Number(mainCost).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50 text-right">
                    <span className={`text-[11px] font-black ${utilityPercent > 20 ? 'text-green-600' : utilityPercent > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      {utilityPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50 text-right">
                    <span className="text-[11px] font-black text-foreground/70">
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-border/50">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onView(product); }} 
                        className="p-1 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                        title="Ver producto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(product); }} 
                        className="p-1 rounded-lg bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white transition-all"
                        title="Editar producto"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
