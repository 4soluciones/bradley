"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useToast } from "@/app/components/ToastContext";
import { Edit, Plus, Tags, Search, CheckCircle2, XCircle } from "lucide-react";
import { 
  PRODUCT_CATEGORIES_QUERY, 
  CREATE_CATEGORY_MUTATION, 
  UPDATE_CATEGORY_MUTATION 
} from "../graphql";
import type { 
  ProductCategoriesData, 
  CreateCategoryData, 
  UpdateCategoryData 
} from "../types";

export default function CategoriesPage() {
  const { success, danger } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", isEnabled: true });

  const { data: categoriesData, loading, refetch } = useQuery<ProductCategoriesData>(PRODUCT_CATEGORIES_QUERY);

  const [createCategory, { loading: creating }] = useMutation<CreateCategoryData>(CREATE_CATEGORY_MUTATION, {
    onCompleted: () => {
      refetch();
      setFormData({ id: "", name: "", isEnabled: true });
      success("Categoría creada con éxito");
    }
  });

  const [updateCategory, { loading: updating }] = useMutation<UpdateCategoryData>(UPDATE_CATEGORY_MUTATION, {
    onCompleted: () => {
      refetch();
      setFormData({ id: "", name: "", isEnabled: true });
      setIsEdit(false);
      success("Categoría actualizada con éxito");
    }
  });

  const filteredCategories = categoriesData?.productCategories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim().length === 0) {
      danger("El nombre es obligatorio.");
      return;
    }

    try {
      if (isEdit && formData.id) {
        const res = await updateCategory({
          variables: { id: parseInt(formData.id), name: formData.name, isEnabled: formData.isEnabled },
        });
        if (!res.data?.updateProductCategory?.success) throw new Error(res.data?.updateProductCategory?.message);
      } else {
        const res = await createCategory({
          variables: { name: formData.name, isEnabled: formData.isEnabled },
        });
        if (!res.data?.createProductCategory?.success) throw new Error(res.data?.createProductCategory?.message);
      }
    } catch (e: any) {
      danger(e.message || "Error al guardar la categoría.");
    }
  };

  const handleEdit = (cat: { id: number; name: string; isEnabled: boolean }) => {
    setFormData({ id: cat.id.toString(), name: cat.name, isEnabled: cat.isEnabled });
    setIsEdit(true);
  };

  const cancelEdit = () => {
    setFormData({ id: "", name: "", isEnabled: true });
    setIsEdit(false);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Tags className="w-7 h-7 text-orange-600" />
            Gestión de <span className="text-orange-600">Categorías</span>
          </h1>
          <p className="text-foreground/50 text-xs font-medium">Administra las categorías de tu catálogo de productos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm sticky top-6">
            <h2 className="text-base font-bold text-foreground mb-4">
              {isEdit ? "Editar Categoría" : "Nueva Categoría"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 pl-1">
                  Nombre de la Categoría
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-4 py-3 bg-foreground/[0.02] border border-border rounded-xl focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all font-semibold text-sm outline-none" 
                  placeholder="Ej. Herramientas Manuales"
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-foreground/[0.02] border border-border rounded-xl">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="isEnabled" 
                    checked={formData.isEnabled} 
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })} 
                    className="w-5 h-5 rounded border-border text-orange-600 focus:ring-orange-600 transition-all cursor-pointer" 
                  />
                </div>
                <label htmlFor="isEnabled" className="font-bold text-foreground/70 cursor-pointer select-none">
                  Categoría Activa
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={creating || updating} 
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-500 hover:shadow-orange-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  {isEdit ? "Actualizar" : "Guardar Categoría"}
                </button>
                {isEdit && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-foreground/5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
            <Search className="w-5 h-5 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Buscar categorías..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm font-semibold placeholder:text-foreground/30"
            />
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-foreground/[0.02] text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              <div className="col-span-8">Nombre</div>
              <div className="col-span-3 text-center">Estado</div>
              <div className="col-span-1 text-center">Acción</div>
            </div>

            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-foreground/40 font-semibold text-sm animate-pulse">
                  Cargando categorías...
                </div>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <div key={cat.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-foreground/[0.01] transition-colors group">
                    <div className="col-span-8 font-bold text-sm text-foreground uppercase">
                      {cat.name}
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cat.isEnabled ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                        {cat.isEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {cat.isEnabled ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 rounded-xl bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Editar Categoría"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-foreground/40 font-semibold text-sm">
                  {searchTerm ? "No se encontraron categorías que coincidan con la búsqueda." : "Aún no hay categorías creadas."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
