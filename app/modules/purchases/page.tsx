"use client";

import React, { useState, useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Plus, 
  ShoppingCart, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  User, 
  Truck, 
  Warehouse as WarehouseIcon,
  Trash2,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Construction,
  Info,
  ArrowRight,
  PackageSearch,
  Hash,
  FileSearch
} from "lucide-react";
import Link from 'next/link';
import Autocomplete from "@/app/components/Autocomplete";

// --- GraphQL Operations ---

const PURCHASES_RESOURCES_QUERY = gql`
  query GetPurchasesResources {
    users {
      id
      username
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
    warehouses {
      id
      name
      subsidiaryId
    }
    wayPays {
      id
      label
    }
    cashes {
      id
      name
      currencyDescription
      subsidiaryId
    }
  }
`;

const PRODUCTS_QUERY = gql`
  query GetProducts {
    products {
      id
      name
      code
      tariffs {
        id
        name
        priceWithoutIgv
        priceWithIgv
      }
    }
  }
`;

const CREATE_PURCHASE_MUTATION = gql`
  mutation CreatePurchase(
    $documentType: String!
    $operationType: String!
    $serial: String!
    $correlative: Int!
    $currencyType: String!
    $purchaseExchangeRate: Float!
    $operationDate: String!
    $emitDate: String!
    $emitTime: String!
    $dueDate: String!
    $userId: Int!
    $supplierId: Int!
    $subsidiaryId: Int!
    $warehouseId: Int!
    $igvType: Float!
    $totalTaxed: Float!
    $totalIgv: Float!
    $totalAmount: Float!
    $observation: String
    $details: [OperationDetailInput!]!
    $wayPay: Int
    $cashId: Int
    $quotas: [QuotaInput!]
  ) {
    createPurchase(
      documentType: $documentType
      operationType: $operationType
      serial: $serial
      correlative: $correlative
      currencyType: $currencyType
      purchaseExchangeRate: $purchaseExchangeRate
      operationDate: $operationDate
      emitDate: $emitDate
      emitTime: $emitTime
      dueDate: $dueDate
      userId: $userId
      supplierId: $supplierId
      subsidiaryId: $subsidiaryId
      warehouseId: $warehouseId
      igvType: $igvType
      totalTaxed: $totalTaxed
      totalIgv: $totalIgv
      totalAmount: $totalAmount
      observation: $observation
      details: $details
      wayPay: $wayPay
      cashId: $cashId
      quotas: $quotas
    ) {
      success
      message
      id
    }
  }
`;

// --- Interfaces ---

interface ProductTariff {
  id: string;
  name: string;
  priceWithoutIgv: number;
  priceWithIgv: number;
}

interface User {
  id: string;
  username: string;
}

interface Supplier {
  id: string;
  names: string;
  documentNumber: string;
}

interface Quota {
  number: number;
  paymentDate: string;
  total: number;
}

interface Subsidiary {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
  subsidiaryId: string;
}

interface WayPay {
  id: string;
  label: string;
}

interface Cash {
  id: string;
  name: string;
  currencyDescription: string;
  subsidiaryId: string;
}

interface PurchaseDetail {
  id: string; // Internal unique ID for React
  productId: string;
  productName: string;
  productCode: string;
  tariffId: string;
  quantity: number;
  unitPrice: number; // Cost
  discount: number;
  total: number;
}

interface ResourcesData {
  users: User[];
  suppliers: Supplier[];
  subsidiaries: Subsidiary[];
  warehouses: Warehouse[];
  wayPays: WayPay[];
  cashes: Cash[];
}

interface Product {
  id: string;
  name: string;
  code: string;
  tariffs: ProductTariff[];
}

interface ProductsData {
  products: Product[];
}

interface CreatePurchaseData {
  createPurchase: {
    success: boolean;
    message: string;
    id: string;
  };
}

export default function PurchasesPage() {
  const [formData, setFormData] = useState({
    documentType: "01", // Factura by default
    operationType: "01",
    serial: "",
    correlative: 0,
    currencyType: "PEN",
    purchaseExchangeRate: 1.0,
    operationDate: new Date().toISOString().split('T')[0],
    emitDate: new Date().toISOString().split('T')[0],
    emitTime: new Date().toLocaleTimeString('en-GB'),
    dueDate: new Date().toISOString().split('T')[0],
    userId: "",
    supplierId: "",
    subsidiaryId: "",
    warehouseId: "",
    observation: "",
    wayPay: "1", // EFECTIVO by default
    cashId: "",
  });

  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [details, setDetails] = useState<PurchaseDetail[]>(() => [{
    id: Math.random().toString(36).substr(2, 9),
    productId: "",
    productName: "",
    productCode: "",
    tariffId: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    total: 0
  }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: resourcesData } = useQuery<ResourcesData>(PURCHASES_RESOURCES_QUERY);
  const { data: productsData } = useQuery<ProductsData>(PRODUCTS_QUERY);

  const [createPurchase, { loading: creating }] = useMutation<CreatePurchaseData>(CREATE_PURCHASE_MUTATION, {
    onCompleted: (data) => {
      if (data.createPurchase.success) {
        setSuccess("Compra registrada correctamente.");
        resetForm();
      } else {
        setError(data.createPurchase.message);
      }
    },
    onError: (err) => setError(err.message)
  });

  const resetForm = () => {
    setDetails([{
      id: Math.random().toString(36).substr(2, 9),
      productId: "",
      productName: "",
      productCode: "",
      tariffId: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0
    }]);
    setFormData({
      ...formData,
      serial: "",
      correlative: 0,
      supplierId: "",
      observation: "",
      wayPay: "1",
      cashId: ""
    });
    setQuotas([]);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "correlative" || name === "purchaseExchangeRate" ? parseFloat(value) || 0 : value
    }));
  };

  const addDetail = (product?: Product) => {
    const tariff = product?.tariffs[0];
    const newDetail: PurchaseDetail = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product?.id || "",
      productName: product?.name || "",
      productCode: product?.code || "",
      tariffId: tariff?.id || "",
      quantity: 1,
      unitPrice: tariff?.priceWithIgv || 0,
      discount: 0,
      total: tariff?.priceWithIgv || 0
    };
    setDetails(prev => [...prev, newDetail]);
  };

  const updateDetail = (id: string, field: keyof PurchaseDetail, value: any) => {
    setDetails(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
          updated.total = (updated.quantity * updated.unitPrice) - updated.discount;
        }
        return updated;
      }
      return d;
    }));
  };

  const selectProductForDetail = (itemId: string, productIdOrEmpty: string | number) => {
    const val = productIdOrEmpty === "" || productIdOrEmpty === null || productIdOrEmpty === undefined ? null : String(productIdOrEmpty);
    const p = val ? productsData?.products.find(x => String(x.id) === val) : undefined;
    setDetails(prev => prev.map(d => {
      if (d.id !== itemId) return d;
      if (p) {
        const t = p.tariffs?.[0];
        const unitPrice = t?.priceWithIgv ?? 0;
        const currentQty = d.quantity;
        const currentDiscount = d.discount;
        return {
          ...d,
          productId: String(p.id),
          productName: p.name,
          productCode: p.code,
          tariffId: t?.id ? String(t.id) : "",
          unitPrice,
          total: (currentQty * unitPrice) - currentDiscount
        };
      }
      return {
        ...d,
        productId: "",
        productName: "",
        productCode: "",
        tariffId: "",
        unitPrice: 0,
        total: 0
      };
    }));
  };

  const removeDetail = (id: string) => {
    setDetails(prev => {
        const filtered = prev.filter(d => d.id !== id);
        return filtered.length === 0 ? [{
            id: Math.random().toString(36).substr(2, 9),
            productId: "",
            productName: "",
            productCode: "",
            tariffId: "",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            total: 0
        }] : filtered;
    });
  };

  const totals = useMemo(() => {
    const totalAmount = details.reduce((sum, d) => sum + d.total, 0);
    const totalTaxed = totalAmount / 1.18;
    const totalIgv = totalAmount - totalTaxed;
    return { totalTaxed, totalIgv, totalAmount };
  }, [details]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.supplierId || !formData.subsidiaryId || !formData.warehouseId || !formData.userId || !formData.cashId) {
      setError("Faltan campos obligatorios en el encabezado o pago.");
      return;
    }
    const validDetails = details.filter(d => d.productId);
    if (validDetails.length === 0) {
      setError("Debe agregar al menos un producto.");
      return;
    }

    if (formData.wayPay === "9" && quotas.length === 0) {
      setError("El método Crédito requiere especificar cuotas.");
      return;
    }

    const variables = {
      ...formData,
      userId: parseInt(formData.userId),
      supplierId: parseInt(formData.supplierId),
      subsidiaryId: parseInt(formData.subsidiaryId),
      warehouseId: parseInt(formData.warehouseId),
      wayPay: parseInt(formData.wayPay),
      cashId: parseInt(formData.cashId),
      igvType: 18.0,
      totalTaxed: totals.totalTaxed,
      totalIgv: totals.totalIgv,
      totalAmount: totals.totalAmount,
      quotas: quotas.map(q => ({
        number: q.number,
        paymentDate: q.paymentDate,
        total: q.total
      })),
      details: validDetails.map(d => ({
        productTariffId: parseInt(d.tariffId),
        typeAffectation: "10",
        quantity: d.quantity,
        unitValue: d.unitPrice / 1.18,
        unitPrice: d.unitPrice,
        discountPercentage: 0,
        igvPercentage: 18,
        totalDiscount: d.discount,
        totalValue: (d.quantity * d.unitPrice / 1.18),
        totalIgv: (d.quantity * d.unitPrice) - (d.quantity * d.unitPrice / 1.18),
        totalAmount: d.total,
        totalToPay: d.total,
        description: d.productName
      }))
    };

    createPurchase({ variables });
  };

  const filteredWarehouses = useMemo(() => {
    if (!formData.subsidiaryId) return [];
    return resourcesData?.warehouses.filter((w: Warehouse) => String(w.subsidiaryId) === String(formData.subsidiaryId)) || [];
  }, [formData.subsidiaryId, resourcesData?.warehouses]);

  const filteredCashes = useMemo(() => {
    if (!formData.subsidiaryId) return [];
    return resourcesData?.cashes.filter((c: Cash) => String(c.subsidiaryId) === String(formData.subsidiaryId)) || [];
  }, [formData.subsidiaryId, resourcesData?.cashes]);

  const addQuota = () => {
    const nextNumber = quotas.length + 1;
    setQuotas([...quotas, { number: nextNumber, paymentDate: new Date().toISOString().split('T')[0], total: 0 }]);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-700">
      {/* Header Container */}
      <div className="bg-card px-8 py-8 rounded-[2.5rem] border border-border flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-600/20">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Registro de <span className="text-orange-600">Compras</span></h1>
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 ml-1">Sistema Industrial de Abastecimiento</p>
              <Link href="/modules/purchases/report" className="flex items-center gap-1.5 px-3 py-1 bg-orange-600/10 text-orange-600 text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-orange-600/20 transition-all">
                <FileSearch className="w-3 h-3" /> Ver Reporte
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Total Documento</p>
            <p className="text-3xl font-black text-orange-600">
                {formData.currencyType === 'PEN' ? 'S/' : '$'} {totals.totalAmount.toFixed(2)}
            </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        {/* Upper Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm space-y-8 relative">
             <div className="absolute -top-3 left-10 px-4 py-1.5 bg-foreground font-black text-[9px] text-background uppercase tracking-[0.2em] rounded-full">
                1. Datos Generales
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Comprobante</label>
                    <div className="relative">
                        <select name="documentType" value={formData.documentType} onChange={handleHeaderChange} className="w-full pl-4 pr-10 py-3.5 bg-foreground/[0.03] border border-border rounded-2xl text-[12px] font-bold appearance-none focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all cursor-pointer">
                            <option value="01">FACTURA</option>
                            <option value="03">BOLETA</option>
                            <option value="NA">NO APLICA</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Serie</label>
                    <input type="text" name="serial" value={formData.serial} onChange={handleHeaderChange} placeholder="F001" className="w-full px-4 py-3.5 bg-foreground/[0.03] border border-border rounded-2xl text-[12px] font-black focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Correlativo</label>
                    <input type="number" name="correlative" value={formData.correlative || ""} onChange={handleHeaderChange} placeholder="1" className="w-full px-4 py-3.5 bg-foreground/[0.03] border border-border rounded-2xl text-[12px] font-black focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600" />
                </div>
             </div>

             <div className="space-y-1.5">
                <Autocomplete
                    label="Proveedor *"
                    options={resourcesData?.suppliers.map(s => ({ id: s.id, label: `${s.names} (${s.documentNumber})` })) || []}
                    value={formData.supplierId}
                    onChange={(val) => setFormData(prev => ({ ...prev, supplierId: String(val) }))}
                    placeholder="Busque proveedor..."
                    icon={<Truck className="w-4 h-4" />}
                />
             </div>

             <div className="grid grid-cols-2 gap-6">
                <Autocomplete
                    label="Sede / Sucursal *"
                    options={resourcesData?.subsidiaries.map(s => ({ id: s.id, label: s.name })) || []}
                    value={formData.subsidiaryId}
                    onChange={(val) => setFormData(prev => ({ ...prev, subsidiaryId: String(val), warehouseId: "" }))}
                    placeholder="Seleccione sede..."
                    icon={<Construction className="w-4 h-4" />}
                />
                <Autocomplete
                    label="Almacén de Destino *"
                    options={filteredWarehouses.map(w => ({ id: w.id, label: w.name }))}
                    value={formData.warehouseId}
                    onChange={(val) => setFormData(prev => ({ ...prev, warehouseId: String(val) }))}
                    placeholder="Seleccione..."
                    icon={<WarehouseIcon className="w-4 h-4" />}
                    disabled={!formData.subsidiaryId}
                />
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Observaciones</label>
                <textarea name="observation" value={formData.observation} onChange={handleHeaderChange} rows={1} className="w-full px-4 py-3 bg-foreground/[0.03] border border-border rounded-2xl text-[12px] font-bold focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 resize-none" placeholder="..." />
             </div>
          </div>

          <div className="lg:col-span-4 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm space-y-6 relative flex flex-col">
             <div className="absolute -top-3 left-10 px-4 py-1.5 bg-foreground font-black text-[9px] text-background uppercase tracking-[0.2em] rounded-full">
                2. Fechas y Moneda
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">F. Emisión</label>
                    <input type="date" name="emitDate" value={formData.emitDate} onChange={handleHeaderChange} className="w-full px-3 py-3 bg-foreground/[0.02] border border-border rounded-xl text-[11px] font-bold" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Hora</label>
                    <input type="time" name="emitTime" value={formData.emitTime} onChange={handleHeaderChange} className="w-full px-3 py-3 bg-foreground/[0.02] border border-border rounded-xl text-[11px] font-bold" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Contable</label>
                    <input type="date" name="operationDate" value={formData.operationDate} onChange={handleHeaderChange} className="w-full px-3 py-3 bg-foreground/[0.02] border border-border rounded-xl text-[11px] font-bold" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Vencimiento</label>
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleHeaderChange} className="w-full px-3 py-3 bg-foreground/[0.02] border border-border rounded-xl text-[11px] font-bold" />
                </div>
             </div>

             <div className="space-y-1.5">
                <Autocomplete
                    label="Responsable *"
                    options={resourcesData?.users.map(u => ({ id: u.id, label: u.username })) || []}
                    value={formData.userId}
                    onChange={(val) => setFormData(prev => ({ ...prev, userId: String(val) }))}
                    placeholder="Seleccione responsable..."
                    icon={<User className="w-4 h-4" />}
                />
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4 mt-auto">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Moneda</label>
                    <select name="currencyType" value={formData.currencyType} onChange={handleHeaderChange} className="w-full px-3 py-3 bg-foreground/[0.03] border border-border rounded-xl text-[11px] font-black appearance-none">
                        <option value="PEN">SOLES</option>
                        <option value="USD">DÓLARES</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Tipo Cambio</label>
                    <input type="number" step="0.001" name="purchaseExchangeRate" value={formData.purchaseExchangeRate} onChange={handleHeaderChange} className="w-full px-3 py-3 bg-foreground/[0.03] border border-border rounded-xl text-[11px] font-black" />
                </div>
             </div>
          </div>
        </div>

        {/* Item Detail Grid */}
        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="px-8 py-6 bg-foreground/[0.01] border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-600/10 rounded-2xl text-orange-600">
                        <PackageSearch className="w-5 h-5" />
                    </div>
                    <h3 className="text-[12px] font-black uppercase tracking-widest">3. Artículos Seleccionados</h3>
                </div>
                <button type="button" onClick={() => addDetail()} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Agregar Fila
                </button>
            </div>
            <div className="overflow-visible">
                <table className="w-full text-left border-collapse excel-grid relative z-20">
                    <thead>
                        <tr className="bg-foreground/[0.05]">
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border w-32">Cód</th>
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border">Producto</th>
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border w-28 text-center">Cant</th>
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border w-32 text-right">P. Unitario</th>
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border w-28 text-right">Dscto</th>
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border w-36 text-right">Total</th>
                            <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 border border-border w-24 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {details.map((item) => (
                            <tr key={item.id} className="group hover:bg-orange-600/[0.02]">
                                <td className="p-0 border border-border"><div className="px-4 text-[11px] font-bold text-foreground/30 text-center">{item.productCode || '---'}</div></td>
                                <td className="p-0 border border-border relative">
                                    <Autocomplete
                                        options={productsData?.products.map(p => ({ id: String(p.id), label: p.code ? `[${p.code}] ${p.name}` : p.name })) || []}
                                        value={item.productId}
                                        onChange={(val) => selectProductForDetail(item.id, val)}
                                        placeholder="Buscar producto (min. 3 letras)..."
                                        hideLabel
                                        isGrid
                                        minSearchLength={3}
                                    />
                                </td>
                                <td className="p-0 border border-border">
                                    <input type="number" value={item.quantity} onChange={(e) => updateDetail(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-4 py-4 text-[12px] font-black text-center focus:bg-white focus:ring-0 outline-none" />
                                </td>
                                <td className="p-0 border border-border">
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-[10px] text-foreground/20 font-black tracking-widest">{formData.currencyType === 'PEN' ? 'S/' : '$'}</span>
                                        <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateDetail(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full pl-10 pr-4 py-4 text-[12px] font-black text-right focus:bg-white focus:ring-0 outline-none" />
                                    </div>
                                </td>
                                <td className="p-0 border border-border">
                                    <input type="number" step="0.01" value={item.discount} onChange={(e) => updateDetail(item.id, 'discount', parseFloat(e.target.value) || 0)} className="w-full px-4 py-4 text-[12px] font-black text-right focus:bg-white focus:ring-0 outline-none" />
                                </td>
                                <td className="p-0 border border-border bg-foreground/[0.01]">
                                    <div className="px-6 py-4 text-[13px] font-black text-right text-foreground">{item.total.toFixed(2)}</div>
                                </td>
                                <td className="p-0 border border-border">
                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => removeDetail(item.id)} className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all text-foreground/20"><Trash2 className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => addDetail()} className="p-2 hover:bg-orange-600 hover:text-white rounded-lg transition-all text-orange-600/40"><Plus className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer: Payment & Totals */}
        <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm relative overflow-visible">
             <div className="absolute -top-3 left-10 px-4 py-1.5 bg-foreground font-black text-[9px] text-background uppercase tracking-[0.2em] rounded-full">
                4. Cierre y Pago
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-600/10 rounded-xl text-orange-600"><DollarSign className="w-5 h-5" /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Condición de Pago</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.1em] ml-1">Método</label>
                            <select name="wayPay" value={formData.wayPay} onChange={handleHeaderChange} className="w-full px-4 py-4 bg-foreground/[0.03] border border-border rounded-2xl text-[12px] font-black focus:ring-4 focus:ring-orange-600/10 transition-all appearance-none cursor-pointer">
                                {resourcesData?.wayPays.map(wp => <option key={wp.id} value={wp.id}>{wp.label}</option>)}
                            </select>
                        </div>
                        <Autocomplete
                            label="Caja o Banco"
                            options={filteredCashes.map(c => ({ id: c.id, label: `${c.name} (${c.currencyDescription})` }))}
                            value={formData.cashId}
                            onChange={(val) => setFormData(prev => ({ ...prev, cashId: String(val) }))}
                            placeholder="Seleccione..."
                            icon={<Hash className="w-4 h-4" />}
                            disabled={!formData.subsidiaryId}
                        />
                    </div>

                    {formData.wayPay === "9" && (
                        <div className="bg-foreground/[0.02] border border-border/50 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Cronograma de Cuotas</span>
                                <button type="button" onClick={addQuota} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-orange-500 transition-all flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5" /> Agregar Cuota
                                </button>
                            </div>
                            <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="border-b border-border/50">
                                        <tr>
                                            <th className="py-3 text-[9px] font-black text-foreground/30 px-2 uppercase">#</th>
                                            <th className="py-3 text-[9px] font-black text-foreground/30 uppercase">Vencimiento</th>
                                            <th className="py-3 text-[9px] font-black text-foreground/30 uppercase text-right pr-2">Importe</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {quotas.map((q, i) => (
                                            <tr key={i} className="group/q">
                                                <td className="py-3 px-2 text-[10px] font-black opacity-30">{i+1}</td>
                                                <td><input type="date" value={q.paymentDate} onChange={(e) => {
                                                    const nq = [...quotas]; nq[i].paymentDate = e.target.value; setQuotas(nq);
                                                }} className="bg-transparent border-none text-[12px] font-black focus:ring-0 p-0" /></td>
                                                <td><input type="number" value={q.total} onChange={(e) => {
                                                    const nq = [...quotas]; nq[i].total = parseFloat(e.target.value) || 0; setQuotas(nq);
                                                }} className="w-full bg-transparent border-none text-[12px] font-black text-right pr-2 focus:ring-0 p-0" /></td>
                                                <td className="text-right"><button onClick={() => setQuotas(quotas.filter((_, idx)=>idx!==i))} className="p-1 hover:text-red-500 opacity-0 group-hover/q:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end justify-center">
                    <div className="w-full max-w-md bg-foreground/[0.03] border border-border p-8 rounded-[2rem] space-y-4 shadow-sm">
                        <div className="flex justify-between items-center px-2 gap-4">
                            <span className="text-[11px] font-black text-foreground/30 uppercase tracking-[0.2em] whitespace-nowrap">Subtotal Bruto</span>
                            <span className="text-[14px] font-bold text-foreground whitespace-nowrap">{formData.currencyType === 'PEN' ? 'S/' : '$'} {totals.totalTaxed.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center px-2 gap-4">
                            <span className="text-[11px] font-black text-foreground/30 uppercase tracking-[0.2em] whitespace-nowrap">IGV Propio (18%)</span>
                            <span className="text-[14px] font-bold text-foreground whitespace-nowrap">{formData.currencyType === 'PEN' ? 'S/' : '$'} {totals.totalIgv.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-orange-600/20 my-2" />
                        <div className="flex justify-between items-center px-2 gap-4">
                            <span className="text-[12px] font-black text-orange-600 uppercase tracking-[0.3em] whitespace-nowrap">Total a Pagar</span>
                            <div className="text-right">
                                <span className="text-4xl font-black text-orange-600 whitespace-nowrap">{formData.currencyType === 'PEN' ? 'S/' : '$'} {totals.totalAmount.toFixed(2)}</span>
                                <p className="text-[9px] font-black text-orange-600/30 uppercase tracking-widest -mt-1">Moneda del Documento</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* Messaging & Actions */}
        {(error || success) && (
          <div className={`p-8 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-500 shadow-sm border ${
            error ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${error ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {error ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">{error ? 'Error de Validación' : 'Operación Finalizada'}</p>
              <p className="text-[14px] font-black uppercase tracking-tight">{error || success}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end items-center gap-6 pt-6 mb-20">
            <button type="button" onClick={resetForm} className="px-10 py-5 rounded-2xl text-[11px] font-black text-foreground/20 uppercase tracking-[0.3em] hover:text-foreground/50 transition-all">Limpiar</button>
            <button type="submit" disabled={creating} className="px-12 py-5 bg-orange-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl shadow-orange-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-4">
                {creating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Procesar Compra <ArrowRight className="w-5 h-5" /></>}
            </button>
        </div>
      </form>
    </div>
  );
}
