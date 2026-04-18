"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useToast } from "@/app/components/ToastContext";
import { Edit, Plus, Layers, Search, CheckCircle2, XCircle } from "lucide-react";
import { 
  PRODUCT_CLASSES_QUERY, 
  CREATE_CLASS_MUTATION, 
  UPDATE_CLASS_MUTATION 
} from "../graphql";
import type { 
  ProductClassesData, 
  ProductClass,
  CreateClassData, 
  UpdateClassData 
} from "../types";

export default function ClassesPage() {
  const { success, danger } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", isEnabled: true });

  const { data: classesData, loading, refetch } = useQuery<ProductClassesData>(PRODUCT_CLASSES_QUERY);

  const [createClass, { loading: creating }] = useMutation<CreateClassData>(CREATE_CLASS_MUTATION, {
    onCompleted: () => {
      refetch();
      setFormData({ id: "", name: "", isEnabled: true });
      success("Clase creada con éxito");
    }
  });

  const [updateClass, { loading: updating }] = useMutation<UpdateClassData>(UPDATE_CLASS_MUTATION, {
    onCompleted: () => {
      refetch();
      setFormData({ id: "", name: "", isEnabled: true });
      setIsEdit(false);
      success("Clase actualizada con éxito");
    }
  });

  const filteredClasses = classesData?.productClasses.filter(c => 
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
        const res = await updateClass({
          variables: { id: parseInt(formData.id), name: formData.name, isEnabled: formData.isEnabled },
        });
        if (!res.data?.updateProductClass?.success) throw new Error(res.data?.updateProductClass?.message);
      } else {
        const res = await createClass({
          variables: { name: formData.name, isEnabled: formData.isEnabled },
        });
        if (!res.data?.createProductClass?.success) throw new Error(res.data?.createProductClass?.message);
      }
    } catch (e: any) {
      danger(e.message || "Error al guardar la clase.");
    }
  };

  const handleEdit = (cls: ProductClass) => {
    setFormData({ id: cls.id, name: cls.name, isEnabled: cls.isEnabled });
    setIsEdit(true);
  };

  const cancelEdit = () => {
    setFormData({ id: "", name: "", isEnabled: true });
    setIsEdit(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500 text-sm overflow-hidden">
      {/* Header Compacto */}
      <div className="flex items-center justify-between bg-card border border-border p-4 py-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600/10 p-2 rounded-xl">
            <Layers className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
              Clases de <span className="text-orange-600">Productos</span>
            </h1>
            <p className="text-foreground/50 text-[10px] font-bold uppercase tracking-wider">Gestión técnica del catálogo</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-foreground/[0.03] border border-border rounded-xl px-3 py-1.5 w-64">
          <Search className="w-4 h-4 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Buscar clase..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-bold placeholder:text-foreground/30 uppercase"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Formulario Compacto */}
        <div className="lg:col-span-1 h-full overflow-y-auto pr-1 custom-scrollbar">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm h-fit">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40 mb-4 flex items-center gap-2">
              <div className="w-1 h-3 bg-orange-600 rounded-full" />
              {isEdit ? "Editar Registro" : "Nuevo Registro"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 pl-1">
                  Nombre de la Clase
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-3 py-2.5 bg-foreground/[0.02] border border-border rounded-xl focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all font-bold text-xs outline-none uppercase placeholder:normal-case" 
                  placeholder="Ej. GRIFERIA Y TUBERIA"
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-foreground/[0.02] border border-border rounded-xl">
                <input 
                  type="checkbox" 
                  id="isEnabled" 
                  checked={formData.isEnabled} 
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })} 
                  className="w-4 h-4 rounded border-border text-orange-600 focus:ring-orange-600 transition-all cursor-pointer" 
                />
                <label htmlFor="isEnabled" className="text-xs font-bold text-foreground/70 cursor-pointer select-none uppercase">
                  Estado Activo
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={creating || updating} 
                  className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isEdit ? <Edit className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {isEdit ? "Actualizar" : "Guardar Clase"}
                </button>
                {isEdit && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="w-full px-4 py-2.5 bg-foreground/5 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-xl font-bold text-[10px] uppercase transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Listado con Scroll Interno */}
        <div className="lg:col-span-3 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-full">
          <div className="grid grid-cols-12 gap-4 p-3 px-4 border-b border-border bg-foreground/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
            <div className="col-span-8">Nombre de la Clase</div>
            <div className="col-span-3 text-center">Estado</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-foreground/30 animate-pulse">
                <Layers className="w-12 h-12 mb-2 opacity-20" />
                <span className="font-black text-[10px] uppercase tracking-widest">Cargando catálogo...</span>
              </div>
            ) : filteredClasses.length > 0 ? (
              filteredClasses.map((cls) => (
                <div key={cls.id} className="grid grid-cols-12 gap-4 p-2.5 px-4 items-center hover:bg-orange-600/[0.02] transition-colors group">
                  <div className="col-span-8 font-bold text-xs text-foreground uppercase tracking-tight">
                    {cls.name}
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${cls.isEnabled ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {cls.isEnabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {cls.isEnabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleEdit(cls)}
                      className="p-2 rounded-lg bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white transition-all transform hover:scale-105"
                      title="Editar Registro"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-12 text-foreground/30">
                <Search className="w-12 h-12 mb-2 opacity-20" />
                <span className="font-black text-[10px] uppercase tracking-widest text-center max-w-[200px]">
                  {searchTerm ? "No hay coincidencias para la búsqueda" : "El catálogo de clases está vacío"}
                </span>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border bg-foreground/[0.01] flex justify-between items-center px-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
              Total: {filteredClasses.length} Registros
            </span>
          </div>
        </div>
      </div>
    </div>

  );
}
