"use client";

import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Plus } from "lucide-react";
import ProductFilter from "./components/ProductFilter";
import ProductForm from "./components/ProductForm";
import ProductList from "./components/ProductList";
import { Product } from "./types";
import { PRODUCTS_QUERY } from "./graphql";
import type { ProductsData } from "./types";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProductViewModalOpen, setIsProductViewModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const { data: productsData, loading: loadingProducts, refetch: refetchProducts } = useQuery<ProductsData>(PRODUCTS_QUERY);

  const filteredProducts =
    productsData?.products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setEditingProduct(null);
    setIsProductViewModalOpen(true);
  };

  const handleProductFormSuccess = () => {
    refetchProducts();
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 text-sm">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Lado izquierdo: Título, Nuevo Producto, Buscador */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Gestión de <span className="text-orange-600">Productos</span>
            </h1>
            <p className="text-foreground/50 text-xs font-medium">Panel centralizado de productos e inventario.</p>
          </div>

          <div className="hidden md:block w-px h-8 bg-border"></div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleNewProduct}
              className="flex items-center justify-center gap-2 px-8 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </button>
            <div className="w-full sm:w-64 xl:w-80">
              <ProductFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
          </div>
        </div>

      </div>

      {/* Listado de productos */}
      <ProductList
        products={filteredProducts}
        loading={loadingProducts}
        onEdit={handleEditProduct}
        onView={handleViewProduct}
      />

      {/* Modal: Crear/Editar Producto */}
      <ProductForm
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productData={editingProduct}
        onSuccess={handleProductFormSuccess}
      />

      {/* Modal: Ver Producto (solo lectura) */}
      <ProductForm
        isOpen={isProductViewModalOpen}
        onClose={() => {
          setIsProductViewModalOpen(false);
          setViewingProduct(null);
        }}
        productData={viewingProduct}
        onSuccess={() => {}}
        readOnly
      />
    </div>
  );
}
