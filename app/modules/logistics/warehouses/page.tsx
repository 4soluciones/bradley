"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useToast } from "@/app/components/ToastContext";
import { Edit, Plus, Warehouse as WarehouseIcon, Search, MapPin, Tag } from "lucide-react";
import { 
  WAREHOUSES_QUERY, 
  CREATE_WAREHOUSE_MUTATION, 
  UPDATE_WAREHOUSE_MUTATION,
  SUBSIDIARIES_QUERY
} from "../../products/graphql";
import type { 
  WarehousesData, 
  CreateWarehouseData, 
  UpdateWarehouseData,
  SubsidiariesData,
  Warehouse
} from "../../products/types";

export default function WarehousesPage() {
  const { success, danger } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", category: "01", subsidiaryId: "" });

  const { data: warehousesData, loading, refetch } = useQuery<WarehousesData>(WAREHOUSES_QUERY);
  const { data: subsidiariesData } = useQuery<SubsidiariesData>(SUBSIDIARIES_QUERY);

  const [createWarehouse, { loading: creating }] = useMutation<CreateWarehouseData>(CREATE_WAREHOUSE_MUTATION, {
    onCompleted: () => {
      refetch();
      setFormData({ id: "", name: "", category: "01", subsidiaryId: "" });
      success("Almacén creado con éxito");
    }
  });

  const [updateWarehouse, { loading: updating }] = useMutation<UpdateWarehouseData>(UPDATE_WAREHOUSE_MUTATION, {
    onCompleted: () => {
      refetch();
      setFormData({ id: "", name: "", category: "01", subsidiaryId: "" });
      setIsEdit(false);
      success("Almacén actualizado con éxito");
    }
  });

  const filteredWarehouses = warehousesData?.warehouses.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim().length === 0) {
      danger("El nombre es obligatorio.");
      return;
    }

    try {
      if (isEdit && formData.id) {
        const res = await updateWarehouse({
          variables: { 
            id: parseInt(formData.id), 
            name: formData.name, 
            category: formData.category,
            subsidiaryId: formData.subsidiaryId ? parseInt(formData.subsidiaryId) : null
          },
        });
        if (!res.data?.updateWarehouse?.success) throw new Error(res.data?.updateWarehouse?.message);
      } else {
        const res = await createWarehouse({
          variables: { 
            name: formData.name, 
            category: formData.category,
            subsidiaryId: formData.subsidiaryId ? parseInt(formData.subsidiaryId) : null
          },
        });
        if (!res.data?.createWarehouse?.success) throw new Error(res.data?.createWarehouse?.message);
      }
    } catch (e: any) {
      danger(e.message || "Error al guardar el almacén.");
    }
  };

  const handleEdit = (wh: Warehouse) => {
    setFormData({ 
      id: wh.id, 
      name: wh.name, 
      category: wh.category,
      subsidiaryId: wh.subsidiaryId ? wh.subsidiaryId.toString() : ""
    });
    setIsEdit(true);
  };

  const cancelEdit = () => {
    setFormData({ id: "", name: "", category: "01", subsidiaryId: "" });
    setIsEdit(false);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <WarehouseIcon className="w-7 h-7 text-orange-600" />
            Gestión de <span className="text-orange-600">Almacenes</span>
          </h1>
          <p className="text-foreground/50 text-xs font-medium">Administra los almacenes de logística y ventas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm sticky top-6">
            <h2 className="text-base font-bold text-foreground mb-4">
              {isEdit ? "Editar Almacén" : "Nuevo Almacén"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 pl-1">
                  Nombre del Almacén
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-4 py-3 bg-foreground/[0.02] border border-border rounded-xl focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all font-semibold text-sm outline-none" 
                  placeholder="Ej. Almacén Principal"
                  required 
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 pl-1">
                  Categoría
                </label>
                <div className="relative">
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-border rounded-xl focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all font-semibold text-sm outline-none appearance-none cursor-pointer" 
                  >
                    <option value="01">VENTA</option>
                    <option value="02">VEHÍCULO</option>
                    <option value="03">RESERVA</option>
                    <option value="NA">NO APLICA</option>
                  </select>
                  <Tag className="w-4 h-4 text-foreground/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 pl-1">
                  Sucursal Asignada
                </label>
                <div className="relative">
                  <select 
                    value={formData.subsidiaryId} 
                    onChange={(e) => setFormData({ ...formData, subsidiaryId: e.target.value })} 
                    className="w-full px-4 py-3 bg-foreground/[0.02] border border-border rounded-xl focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-all font-semibold text-sm outline-none appearance-none cursor-pointer" 
                  >
                    <option value="">Sin sucursal</option>
                    {subsidiariesData?.subsidiaries.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-foreground/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={creating || updating} 
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-500 hover:shadow-orange-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  {isEdit ? "Actualizar" : "Guardar Almacén"}
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
              placeholder="Buscar almacenes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm font-semibold placeholder:text-foreground/30"
            />
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-foreground/[0.02] text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              <div className="col-span-5">Nombre</div>
              <div className="col-span-3 text-center">Categoría</div>
              <div className="col-span-3 text-center">Sucursal</div>
              <div className="col-span-1 text-center">Acción</div>
            </div>

            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-foreground/40 font-semibold text-sm animate-pulse">
                  Cargando almacenes...
                </div>
              ) : filteredWarehouses.length > 0 ? (
                filteredWarehouses.map((wh) => (
                  <div key={wh.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-foreground/[0.01] transition-colors group">
                    <div className="col-span-5 font-bold text-sm text-foreground">
                      {wh.name}
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-foreground/5 text-foreground/70 tracking-wider">
                        {wh.category === "01" ? "VENTA" : wh.category === "02" ? "VEHÍCULO" : wh.category === "03" ? "RESERVA" : "N/A"}
                      </span>
                    </div>
                    <div className="col-span-3 flex justify-center text-xs font-semibold text-foreground/60 w-full truncate">
                      {wh.subsidiaryId !== null ? (subsidiariesData?.subsidiaries.find(s => s.id === String(wh.subsidiaryId))?.name || 'Desconocida') : '-'}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleEdit(wh)}
                        className="p-2 rounded-xl bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Editar Almacén"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-foreground/40 font-semibold text-sm">
                  {searchTerm ? "No se encontraron almacenes que coincidan con la búsqueda." : "Aún no hay almacenes creados."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
