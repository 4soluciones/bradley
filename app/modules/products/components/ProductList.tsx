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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-foreground/[0.02] border-b border-border text-foreground/50">
            <tr>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider w-16">Img</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">SKU / Cód.</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider w-full">Nombre del Producto</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">Costo</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">P. Venta</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">Existencia</th>
              <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const mainPrice = product.tariffs?.find(t => t.typePrice === 3 || t.typePrice === 4 || t.typePrice === 0)?.priceWithIgv || 0;
              const mainCost = product.tariffs?.find(t => t.typePrice === 1 || t.typePrice === 2)?.priceWithIgv || 0;
              const totalStock = product.productStores?.reduce((sum, ps) => sum + (ps.stock || 0), 0) || 0;
              return (
                <tr 
                  key={product.id} 
                  className="hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors group"
                >
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center">
                      {getProductImageUrl(product.imageUrl) ? (
                        <img src={getProductImageUrl(product.imageUrl)!} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-foreground/20" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-xs font-black text-orange-600/70 uppercase">
                      {'SKU-' + (product.code || '000')}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-bold text-foreground truncate max-w-[200px] md:max-w-md uppercase">
                      {product.name?.toUpperCase() ?? ''}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-xs font-black text-foreground/70">
                      S/ {Number(mainCost).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-xs font-black text-foreground/70">
                      S/ {Number(mainPrice).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-xs font-black text-foreground/70">
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onView(product); }} 
                        className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                        title="Ver producto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(product); }} 
                        className="p-1.5 rounded-lg bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white transition-all"
                        title="Editar producto"
                      >
                        <Edit className="w-4 h-4" />
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
