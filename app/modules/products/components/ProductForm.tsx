"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Camera, Plus, AlertCircle, CheckCircle2, Boxes } from "lucide-react";
import { useToast } from "@/app/components/ToastContext";
import Modal from "@/app/components/Modal";
import { Tariff, Product, UnitsData, WarehousesData, ProductCategoriesData, ProductClassesData } from "../types";
import { getProductImageUrl } from "../utils";
import { 
  CREATE_PRODUCT_MUTATION, 
  UPDATE_PRODUCT_MUTATION, 
  SET_STOCK_MUTATION, 
  UNITS_QUERY, 
  WAREHOUSES_QUERY, 
  PRODUCT_STORES_QUERY,
  PRODUCT_CATEGORIES_QUERY,
  PRODUCT_CLASSES_QUERY
} from "../graphql";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  productData: Product | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

export default function ProductForm({ isOpen, onClose, productData, onSuccess, readOnly = false }: ProductFormProps) {
  const isEdit = !!productData;
  const { success: showSuccess, danger } = useToast();
  const [activeTab, setActiveTab] = useState("precios_venta");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    code: "",
    barcode: "",
    stockMin: "0",
    stockMax: "0",
    activeType: "01",
    ean: "",
    weight: "0",
    typeAffectation: "10",
    subsidiaryId: "",
    measurements: "",
    length: "0",
    height: "0",
    width: "0",
    available: true,
    observation: "-",
    imagePreview: null as string | null,
    tariffs: [] as Tariff[],
    productStores: [] as { warehouseId: string; stock: string }[],
    productCategoryId: "",
    productClassId: "",
  });

  // Queries
  const { data: unitsData } = useQuery<UnitsData>(UNITS_QUERY);
  const { data: warehousesData } = useQuery<WarehousesData>(WAREHOUSES_QUERY);
  const { data: categoriesData } = useQuery<ProductCategoriesData>(PRODUCT_CATEGORIES_QUERY);
  const { data: classesData } = useQuery<ProductClassesData>(PRODUCT_CLASSES_QUERY);
  const { data: productStoresData } = useQuery(PRODUCT_STORES_QUERY, {
    variables: { productId: productData ? parseInt(productData.id) : null },
    skip: !productData || !isOpen
  });

  // Load Edit Data
  useEffect(() => {
    if (productData && isOpen) {
      setFormData({
        id: productData.id,
        name: productData.name,
        code: productData.code || "",
        barcode: productData.barcode || "",
        stockMin: productData.stockMin.toString(),
        stockMax: productData.stockMax.toString(),
        activeType: productData.activeType,
        ean: productData.ean || "",
        weight: productData.weightInKilograms.toString(),
        typeAffectation: productData.typeAffectation,
        available: productData.available,
        observation: productData.observation || "-",
        subsidiaryId: productData.subsidiaryId?.toString() || "",
        measurements: productData.measurements || "",
        length: productData.length.toString(),
        height: productData.height.toString(),
        width: productData.width.toString(),
        imagePreview: getProductImageUrl(productData.imageUrl) || null,
        tariffs: productData.tariffs.map(t => ({ ...t, name: t.name || "", unitId: t.unitId || "" })),
        productStores: [],
        productCategoryId: productData.productCategoryId?.toString() || "",
        productClassId: productData.productClassId?.toString() || "",
      });
      setActiveTab("precios_venta");
    } else if (!productData && isOpen) {
      setFormData({
        id: "", name: "", code: "", barcode: "", stockMin: "0", stockMax: "0", activeType: "01",
        ean: "", weight: "0", typeAffectation: "10", subsidiaryId: "",
        measurements: "", length: "0", height: "0", width: "0", available: true,
        observation: "-", imagePreview: null, tariffs: [], productStores: [] as { warehouseId: string; stock: string }[],
        productCategoryId: "", productClassId: "",
      });
      setActiveTab("precios_venta");
    }
  }, [productData, isOpen]);

  useEffect(() => {
    const stores = productStoresData?.productStores ?? productStoresData?.product_stores;
    if (isEdit && formData.id && stores && formData.productStores.length === 0) {
      setFormData(prev => ({
        ...prev,
        productStores: stores.map((ps: any) => ({
          warehouseId: (ps.warehouse_id ?? ps.warehouseId)?.toString() ?? "",
          stock: String(ps.stock ?? 0)
        }))
      }));
    }
  }, [productStoresData, isEdit, formData.id]);

  // Mutations
  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT_MUTATION);
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT_MUTATION);
  const [setStock] = useMutation(SET_STOCK_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
  };

  const addTariff = (typePrice: number = 3) => {
    const newTariff: Tariff = { 
      name: "", 
      unitId: "", 
      typePrice, 
      priceWithIgv: 0, 
      priceWithoutIgv: 0, 
      quantityMinimum: 1 
    };
    setFormData({ ...formData, tariffs: [...formData.tariffs, newTariff] });
  };

  const updateTariff = (index: number, field: keyof Tariff, value: any) => {
    const newTariffs = [...formData.tariffs];
    const item = { ...newTariffs[index] };
    
    if (field === 'priceWithoutIgv') {
      const val = value === "" ? 0 : parseFloat(value);
      item.priceWithoutIgv = val;
      item.priceWithIgv = parseFloat((val * 1.18).toFixed(4));
    } else if (field === 'priceWithIgv') {
      const val = value === "" ? 0 : parseFloat(value);
      item.priceWithIgv = val;
      item.priceWithoutIgv = parseFloat((val / 1.18).toFixed(4));
    } else if (field === 'quantityMinimum') {
      item.quantityMinimum = value === "" ? 0 : parseFloat(value);
    } else {
      (item as any)[field] = value;
    }
    
    newTariffs[index] = item;
    setFormData({ ...formData, tariffs: newTariffs });
  };

  const removeTariff = (index: number) => {
    setFormData({ ...formData, tariffs: formData.tariffs.filter((_, i) => i !== index) });
  };

  const addProductStore = () => {
    setFormData({ ...formData, productStores: [...formData.productStores, { warehouseId: "", stock: "0" }] });
  };

  const updateProductStore = (index: number, field: "warehouseId" | "stock", value: string) => {
    const newPS = [...formData.productStores];
    newPS[index] = { ...newPS[index], [field]: value };
    setFormData({ ...formData, productStores: newPS });
  };

  const removeProductStore = (index: number) => {
    setFormData({ ...formData, productStores: formData.productStores.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.trim().length === 0) {
      danger("El nombre del producto es obligatorio.");
      return;
    }
    if (formData.tariffs.length === 0) {
      danger("Debe agregar al menos una tarifa de precio.");
      return;
    }
    if (formData.tariffs.some(t => !t.unitId || t.unitId === "")) {
      danger("Todas las tarifas deben tener una unidad seleccionada.");
      return;
    }

    const variables = {
      name: formData.name,
      code: formData.code,
      barcode: formData.barcode,
      stockMin: parseInt(formData.stockMin) || 0,
      stockMax: parseInt(formData.stockMax) || 0,
      activeType: formData.activeType,
      ean: formData.ean,
      weight: parseFloat(formData.weight) || 0,
      typeAffectation: formData.typeAffectation,
      subsidiaryId: formData.subsidiaryId ? parseInt(formData.subsidiaryId) : null,
      measurements: formData.measurements,
      imageBase64: formData.imagePreview || null,
      length: parseFloat(formData.length) || 0,
      height: parseFloat(formData.height) || 0,
      width: parseFloat(formData.width) || 0,
      available: formData.available,
      observation: formData.observation,
      productCategoryId: formData.productCategoryId ? parseInt(formData.productCategoryId) : null,
      productClassId: formData.productClassId ? parseInt(formData.productClassId) : null,
      tariffs: formData.tariffs.map(t => ({
        name: t.name || "",
        unitId: parseInt(t.unitId.toString()),
        typePrice: Number(t.typePrice),
        priceWithIgv: parseFloat(t.priceWithIgv.toString()) || 0,
        priceWithoutIgv: parseFloat(t.priceWithoutIgv.toString()) || 0,
        quantityMinimum: parseFloat(t.quantityMinimum.toString()) || 1
      }))
    };

    let productId: number | undefined;
    try {
      if (isEdit) {
        const res = await updateProduct({ variables: { ...variables, id: parseInt(formData.id) } });
        if (!res.data?.updateProduct?.success) throw new Error(res.data?.updateProduct?.message);
        showSuccess(res.data.updateProduct.message);
        productId = parseInt(formData.id);
      } else {
        const res = await createProduct({ variables });
        if (!res.data?.createProduct?.success) throw new Error(res.data?.createProduct?.message);
        showSuccess(res.data.createProduct.message);
        productId = res.data.createProduct.id;
      }
    } catch (e: any) {
      danger(e.message || "Ocurrió un error al guardar el producto.");
      return;
    }

    if (productId && formData.productStores.length > 0) {
      for (const ps of formData.productStores) {
        if (ps.warehouseId) {
          try {
            const res = await setStock({
              variables: { productId, warehouseId: parseInt(ps.warehouseId), stock: parseFloat(ps.stock) || 0 }
            });
            const stockRes = res.data?.setStock ?? res.data?.set_stock;
            if (stockRes?.success === false) {
              throw new Error(stockRes.message || "Error al guardar stock");
            }
          } catch (err: any) {
            danger(err.message || "Error al guardar existencias en almacén.");
            return;
          }
        }
      }
    }

    onSuccess();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const mainPrice = formData.tariffs.length > 0 ? formData.tariffs[0].priceWithIgv : null;

  const modalTitle = readOnly ? "Ver Producto" : isEdit ? "Editar Producto" : "Nuevo Producto";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} width="max-w-5xl">
      <form onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit} className="space-y-4 text-[13px]">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 space-y-2">
            <div onClick={readOnly ? undefined : () => fileInputRef.current?.click()} className={`aspect-square bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden relative group ${!readOnly ? "cursor-pointer hover:border-orange-600/30 transition-all" : ""}`}>
              {formData.imagePreview ? <img src={formData.imagePreview} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-foreground/10" />}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setFormData({ ...formData, imagePreview: reader.result as string });
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </div>

          <div className="col-span-9 space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-foreground/40 uppercase text-[10px] tracking-widest pl-1">Descripción</label>
              <input name="name" required value={formData.name} onChange={handleChange} disabled={readOnly} readOnly={readOnly} autoComplete="off" className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg font-bold" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-foreground/40 uppercase text-[10px] tracking-widest pl-1">Notas</label>
              <textarea name="observation" rows={2} value={formData.observation} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg resize-none" />
            </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground/40 uppercase text-[10px] tracking-widest pl-1">Código</label>
                  <input name="code" value={formData.code} onChange={handleChange} disabled={readOnly} readOnly={readOnly} className="w-full px-3 py-1.5 bg-foreground/[0.02] border border-border rounded-md" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground/40 uppercase text-[10px] tracking-widest pl-1">Medidas</label>
                  <input name="measurements" value={formData.measurements} onChange={handleChange} disabled={readOnly} readOnly={readOnly} className="w-full px-3 py-1.5 bg-foreground/[0.02] border border-border rounded-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 bg-foreground/[0.02] p-3 border border-border rounded-xl">
           <div className="flex items-end gap-2 pr-6 border-r border-border/50">
              <label className="font-black text-foreground/20 uppercase text-[9px] translate-y-[-10px]">Precio S/</label>
              <span className="text-4xl font-black text-foreground leading-none">{mainPrice ? Number(mainPrice).toFixed(2) : '0.00'}</span>
           </div>
           <div className="flex items-center gap-4 flex-1">
              {['length', 'height', 'width', 'weight'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <label className="font-bold text-foreground/40 text-[10px] uppercase">{f}:</label>
                  <input type="number" name={f} value={(formData as any)[f]} onChange={handleChange} className="w-16 px-2 py-1 bg-card border border-border rounded text-right font-bold" />
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-0">
          <div className="flex border-b border-border">
            {['caracteristicas', 'precios_compra', 'precios_venta', 'almacenes'].map(t => (
              <button key={t} type="button" onClick={() => setActiveTab(t)} className={`px-6 py-2 border-t border-l border-r rounded-t-lg font-bold text-[11px] capitalize transition-all -mb-[1px] ${activeTab === t ? 'bg-card border-border text-orange-600' : 'bg-foreground/[0.03] text-foreground/40'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="bg-card border-b border-l border-r border-border p-4 rounded-b-xl min-h-[200px]">
            {(activeTab === "precios_compra" || activeTab === "precios_venta") ? (
              <div className="space-y-3">
                 <div className="grid grid-cols-12 gap-2 bg-foreground/5 p-2 rounded text-[10px] font-black uppercase text-foreground/40">
                    <div className="col-span-2">Nombre</div>
                    <div className="col-span-2">Unidad</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2">P. sin IGV</div>
                    <div className="col-span-2">P. con IGV</div>
                    <div className="col-span-1">Cant. mín</div>
                    <div className="col-span-1">Acción</div>
                 </div>
                 <div className="space-y-2">
                    {formData.tariffs.map((t, i) => {
                      const isPurchase = activeTab === "precios_compra" && (t.typePrice === 1 || t.typePrice === 2);
                      const isSales = activeTab === "precios_venta" && (t.typePrice === 3 || t.typePrice === 4 || t.typePrice === 0);
                      
                      if (!isPurchase && !isSales) return null;

                      return (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <input placeholder="Ej: Venta unidad" className="col-span-2 p-1.5 bg-foreground/[0.02] border border-border rounded text-[11px]" value={t.name || ""} onChange={(e) => updateTariff(i, 'name', e.target.value)} />
                          <select className="col-span-2 p-1.5 bg-foreground/[0.02] border border-border rounded" value={t.unitId} onChange={(e) => updateTariff(i, 'unitId', e.target.value)}>
                            <option value="">Seleccionar</option>
                            {unitsData?.units.map((u: any) => <option key={u.id} value={u.id}>{u.shortName} - {u.description || ""}</option>)}
                          </select>
                          <select className="col-span-2 p-1.5 bg-foreground/[0.02] border border-border rounded text-[11px]" value={t.typePrice} onChange={(e) => updateTariff(i, 'typePrice', parseInt(e.target.value))}>
                            {activeTab === "precios_compra" ? (
                              <>
                                <option value={1}>Costo compra unit.</option>
                                <option value={2}>Costo compra mayor</option>
                              </>
                            ) : (
                              <>
                                <option value={3}>Precio venta unit.</option>
                                <option value={4}>Precio venta mayor</option>
                                <option value={0}>No aplica</option>
                              </>
                            )}
                          </select>
                          <input type="number" step="0.0001" placeholder="0" className="col-span-2 p-1.5 bg-foreground/[0.02] border border-border rounded text-right" value={t.priceWithoutIgv || ""} onChange={(e) => updateTariff(i, 'priceWithoutIgv', e.target.value)} />
                          <input type="number" step="0.0001" placeholder="0" className="col-span-2 p-1.5 bg-foreground/[0.02] border border-border rounded text-right" value={t.priceWithIgv || ""} onChange={(e) => updateTariff(i, 'priceWithIgv', e.target.value)} />
                          <input type="number" className="col-span-1 p-1.5 bg-foreground/[0.02] border border-border rounded text-right" value={t.quantityMinimum} onChange={(e) => updateTariff(i, 'quantityMinimum', e.target.value)} />
                          {!readOnly && <button type="button" onClick={() => removeTariff(i)} className="col-span-1 text-red-500 font-bold hover:underline text-xs">Eliminar</button>}
                        </div>
                      );
                    })}
                    {!readOnly && (
                    <button type="button" onClick={() => addTariff(activeTab === "precios_compra" ? 1 : 3)} className="w-full py-2 border-2 border-dashed border-border rounded-xl text-foreground/40 font-bold hover:border-orange-600/30 hover:text-orange-600 transition-all flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Agregar {activeTab === "precios_compra" ? 'Costo de Compra' : 'Tarifa de Venta'}
                    </button>
                    )}
                 </div>
              </div>
            ) : activeTab === "almacenes" ? (
              <div className="space-y-3">
                <p className="text-[11px] text-foreground/50 font-bold">Stock por almacén (enlace producto-almacén)</p>
                <div className="grid grid-cols-12 gap-2 bg-foreground/5 p-2 rounded text-[10px] font-black uppercase text-foreground/40">
                  <div className="col-span-5">Almacén</div>
                  <div className="col-span-4">Stock</div>
                  <div className="col-span-3">Acción</div>
                </div>
                <div className="space-y-2">
                  {formData.productStores.map((ps, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select className="col-span-5 p-1.5 bg-foreground/[0.02] border border-border rounded" value={ps.warehouseId} onChange={(e) => updateProductStore(i, 'warehouseId', e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {warehousesData?.warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <input type="number" className="col-span-4 p-1.5 bg-foreground/[0.02] border border-border rounded text-right" value={ps.stock} onChange={(e) => updateProductStore(i, 'stock', e.target.value)} />
                      {!readOnly && <button type="button" onClick={() => removeProductStore(i)} className="col-span-3 text-red-500 font-bold hover:underline text-left">Eliminar</button>}
                    </div>
                  ))}
                  {!readOnly && (
                  <button type="button" onClick={addProductStore} className="w-full py-2 border-2 border-dashed border-border rounded-xl text-foreground/40 font-bold hover:border-orange-600/30 hover:text-orange-600 transition-all flex items-center justify-center gap-2">
                    <Boxes className="w-4 h-4" /> Agregar existencias en almacén
                  </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-foreground/50 font-bold">Campos opcionales del producto</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Código</label>
                    <input name="code" value={formData.code} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Cód. Barras</label>
                    <input name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">EAN</label>
                    <input name="ean" value={formData.ean} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Stock Mín</label>
                    <input type="number" name="stockMin" value={formData.stockMin} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Stock Máx</label>
                    <input type="number" name="stockMax" value={formData.stockMax} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Tipo Activo</label>
                    <select name="activeType" value={formData.activeType} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg">
                      <option value="01">PRODUCTO</option>
                      <option value="02">REGALO</option>
                      <option value="03">SERVICIO</option>
                      <option value="NA">NO APLICA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Tipo Afectación</label>
                    <select name="typeAffectation" value={formData.typeAffectation} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg">
                      <option value="10">OP. GRAVADAS</option>
                      <option value="20">OP. EXONERADAS</option>
                      <option value="30">OP. INAFECTAS</option>
                      <option value="15">OP. GRATUITAS</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Categoría</label>
                    <select name="productCategoryId" value={formData.productCategoryId} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg">
                      <option value="">Seleccionar Categoría</option>
                      {categoriesData?.productCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground/40 uppercase text-[10px] pl-1">Clase</label>
                    <select name="productClassId" value={formData.productClassId} onChange={handleChange} className="w-full px-3 py-2 bg-foreground/[0.02] border border-border rounded-lg">
                      <option value="">Seleccionar Clase</option>
                      {classesData?.productClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
           <button type="button" onClick={onClose} className="px-6 py-2 bg-foreground/5 text-foreground/60 rounded-lg font-bold">
             {readOnly ? "Cerrar" : "Cancelar"}
           </button>
           {!readOnly && (
             <button type="submit" disabled={creating || updating} className="px-8 py-2 bg-orange-600 text-white rounded-lg font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all">
               {isEdit ? "Guardar Cambios" : "Completar Registro"}
             </button>
           )}
        </div>
      </form>
    </Modal>
  );
}
