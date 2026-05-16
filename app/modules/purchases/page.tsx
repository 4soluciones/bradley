"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { createPortal } from "react-dom";
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
    $operationStatus: String
    $operationAction: String
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
      operationStatus: $operationStatus
      operationAction: $operationAction
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
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [wayPayOpen, setWayPayOpen] = useState(false);
  const wayPayTriggerRef = useRef<HTMLDivElement>(null);
  const wayPayButtonRef = useRef<HTMLButtonElement>(null);
  const wayPayMenuRef = useRef<HTMLDivElement>(null);
  const [wayPayMenuStyle, setWayPayMenuStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!wayPayOpen) {
      setWayPayMenuStyle(null);
      return;
    }
    const position = () => {
      const el = wayPayButtonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      setWayPayMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + gap,
        maxHeight: Math.min(208, Math.max(80, rect.top - gap - 4)),
        zIndex: 9998
      });
    };
    position();
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [wayPayOpen]);

  useEffect(() => {
    if (!wayPayOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      const inTrigger = wayPayTriggerRef.current?.contains(t);
      const inMenu = wayPayMenuRef.current?.contains(t);
      if (!inTrigger && !inMenu) setWayPayOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [wayPayOpen]);

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
    setMissingFields([]);
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
    setMissingFields([]);

    const missing = [];
    if (!formData.supplierId) missing.push("supplierId");
    if (!formData.subsidiaryId) missing.push("subsidiaryId");
    if (!formData.warehouseId) missing.push("warehouseId");
    if (!formData.userId) missing.push("userId");
    if (!formData.cashId) missing.push("cashId");

    if (missing.length > 0) {
      setMissingFields(missing);
      const labels: Record<string, string> = {
        supplierId: "Proveedor",
        subsidiaryId: "Sucursal",
        warehouseId: "Almacén",
        userId: "Responsable",
        cashId: "Caja/Banco"
      };
      const missingLabels = missing.map(m => labels[m]).join(", ");
      setError(`Error Detectado: Faltan campos obligatorios: ${missingLabels}.`);
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
      operationType: "0501",
      operationStatus: "02",
      operationAction: "E",
      userId: parseInt(formData.userId),
      supplierId: parseInt(formData.supplierId),
      subsidiaryId: parseInt(formData.subsidiaryId),
      warehouseId: parseInt(formData.warehouseId),
      wayPay: parseInt(formData.wayPay),
      cashId: parseInt(formData.cashId),
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
  };  return (
    <div className="h-[calc(100vh-2rem)] w-full flex flex-col gap-3 font-sans text-foreground overflow-hidden animate-in fade-in duration-500">
      
      {/* 1. TOP HEADER - Compact & Professional */}
      <header className="bg-card border border-border border-b-2 border-b-orange-600 rounded-xl shadow-md p-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-inner">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex flex-wrap items-center gap-x-2">
                Registro de Compras
              </span>
              <Link href="/modules/purchases/report" className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0">
                <FileSearch className="w-3 h-3" /> EXAMINAR HISTORIAL
              </Link>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6 divide-x divide-border">
           <div className="px-4 text-right">
              <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest leading-tight">Tipo de Cambio</p>
              <p className="text-sm font-black text-foreground italic">S/ {formData.purchaseExchangeRate.toFixed(3)}</p>
           </div>
           <div className="px-4 flex flex-col items-end">
              <p className="text-[9px] font-black text-orange-600 uppercase tracking-[.2em] leading-tight">Monto Total</p>
              <p className="text-2xl font-black text-foreground tracking-tighter">
                <span className="text-orange-600 mr-1">{formData.currencyType === 'PEN' ? 'S/' : '$'}</span>
                {totals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
           </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden" autoComplete="off">
        
        {/* 2. HEADER INFO BAR - Two columns compact */}
        <div className="grid grid-cols-12 gap-3 shrink-0 px-1">
          {/* Section 1: General Data */}
          <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-3 shadow-sm grid grid-cols-12 gap-3 relative mt-2">
            <div className="absolute -top-2.5 left-4 px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg leading-none shadow-md z-10 border border-orange-700">
              I. INFORMACIÓN DEL PROVEEDOR / SEDE
            </div>
            
            <div className="col-span-12 sm:col-span-2 space-y-1 min-w-0">
              <label className="text-[9px] font-bold text-foreground/50 uppercase ml-1">Comprobante</label>
              <div className="relative max-w-full">
                <select name="documentType" value={formData.documentType} onChange={handleHeaderChange} className="w-full max-w-[9.5rem] sm:max-w-none h-9 pl-2 pr-7 bg-background border border-border rounded-lg text-[11px] font-black text-foreground appearance-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all outline-none">
                  <option value="01">01 - FACTURA</option>
                  <option value="03">03 - BOLETA</option>
                  <option value="NA">-- NO APLICA --</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
              </div>
            </div>

            <div className="col-span-12 sm:col-span-3 grid grid-cols-2 gap-2 min-w-0">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-foreground/50 uppercase ml-1">Serie</label>
                <input type="text" name="serial" value={formData.serial} onChange={handleHeaderChange} placeholder="F001" className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 outline-none uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-foreground/50 uppercase ml-1">Corr.</label>
                <input type="number" name="correlative" value={formData.correlative || ""} onChange={handleHeaderChange} placeholder="1" className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 outline-none" />
              </div>
            </div>

            <div className="col-span-12 sm:col-span-7 space-y-1 min-w-0">
              <Autocomplete
                label="Proveedor *"
                options={resourcesData?.suppliers.map(s => ({ id: s.id, label: `${s.names} (${s.documentNumber})` })) || []}
                value={formData.supplierId}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, supplierId: String(val) }));
                  setMissingFields(prev => prev.filter(f => f !== 'supplierId'));
                }}
                placeholder="RUC o Razón Social..."
                icon={<Truck className="w-3.5 h-3.5 text-orange-600" />}
                error={missingFields.includes('supplierId')}
                compact
              />
            </div>

            <div className="col-span-12 sm:col-span-3 space-y-1 min-w-0">
               <Autocomplete
                  label="Sucursal *"
                  options={resourcesData?.subsidiaries.map(s => ({ id: s.id, label: s.name })) || []}
                  value={formData.subsidiaryId}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, subsidiaryId: String(val), warehouseId: "" }));
                    setMissingFields(prev => prev.filter(f => f !== 'subsidiaryId'));
                  }}
                  placeholder="Sede..."
                  icon={<Construction className="w-3.5 h-3.5 text-foreground/55" />}
                  error={missingFields.includes('subsidiaryId')}
                  compact
               />
            </div>                       

            <div className="col-span-12 sm:col-span-3 space-y-1 min-w-0">
              <Autocomplete
                label="Almacén de Destino *"
                options={filteredWarehouses.map(w => ({ id: w.id, label: w.name }))}
                value={formData.warehouseId}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, warehouseId: String(val) }));
                  setMissingFields(prev => prev.filter(f => f !== 'warehouseId'));
                }}
                placeholder="Sede / Almacén..."
                icon={<WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />}
                disabled={!formData.subsidiaryId}
                error={missingFields.includes('warehouseId')}
                compact
              />
            </div>

            <div className="col-span-12 sm:col-span-3 min-w-0 flex flex-col gap-1.5">
              <label className="flex items-center min-h-[14px] text-[9px] font-black uppercase tracking-widest ml-1 text-foreground/50 leading-none">
                Responsable
              </label>
              <div className="relative">
                <select 
                  name="userId" 
                  value={formData.userId} 
                  onChange={(e) => {
                    handleHeaderChange(e);
                    setMissingFields(prev => prev.filter(f => f !== 'userId'));
                  }} 
                  className={`m-0 w-full h-9 pl-8 pr-3 bg-background border rounded-lg text-xs font-black text-foreground appearance-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all outline-none ${missingFields.includes('userId') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border'}`}
                >
                  <option value="">Seleccione...</option>
                  {resourcesData?.users.map(u => <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>)}
                </select>
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
              </div>
            </div>

            <div className="col-span-12 sm:col-span-3 min-w-0 flex flex-col gap-1.5">
              <label className="block text-[9px] font-black uppercase tracking-widest ml-1 text-foreground/50 leading-none flex items-center gap-1 min-h-[14px]">
                <DollarSign className="w-3 h-3 shrink-0" aria-hidden />
                Moneda
              </label>
              <div className="flex bg-foreground/[0.06] dark:bg-foreground/[0.08] rounded-lg p-0.5 border border-border h-9 items-stretch">
                <button type="button" onClick={() => setFormData(p => ({...p, currencyType: 'PEN'}))} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all leading-none ${formData.currencyType === 'PEN' ? 'bg-card shadow-sm text-orange-600 ring-1 ring-border' : 'text-foreground/45 hover:text-foreground/70'}`}>SOLES</button>
                <button type="button" onClick={() => setFormData(p => ({...p, currencyType: 'USD'}))} className={`flex-1 py-1 text-[10px] font-black rounded-md transition-all leading-none ${formData.currencyType === 'USD' ? 'bg-card shadow-sm text-orange-600 ring-1 ring-border' : 'text-foreground/45 hover:text-foreground/70'}`}>USD</button>
              </div>
            </div> 
          </div>

          {/* Section 2: Dates & Params */}
          <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-3 shadow-sm grid grid-cols-2 gap-3 relative mt-2">
            <div className="absolute -top-2.5 left-4 px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg leading-none shadow-md z-10 border border-orange-700">
              II. CRONOLOGÍA INDUSTRIAL
            </div>

            <div className="min-w-0 flex flex-col gap-1.5">
              <label className="flex items-center gap-1 min-h-[14px] text-[9px] font-black uppercase tracking-widest text-foreground/50 leading-none ml-1">
                <Calendar className="w-3 h-3 shrink-0" aria-hidden />
                Emisión
              </label>
              <input
                type="date"
                name="emitDate"
                value={formData.emitDate}
                onChange={handleHeaderChange}
                className="m-0 w-full min-w-0 h-9 px-3 bg-background border border-border rounded-lg text-[11px] font-black text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 outline-none"
              />
            </div>
            <div className="min-w-0 flex flex-col gap-1.5">
              <label className="flex items-center gap-1 min-h-[14px] text-[9px] font-black uppercase tracking-widest text-foreground/50 leading-none ml-1">
                <Clock className="w-3 h-3 shrink-0" aria-hidden />
                Vencimiento
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleHeaderChange}
                className="m-0 w-full min-w-0 h-9 px-3 bg-background border border-border rounded-lg text-[11px] font-black text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 outline-none"
              />
            </div>
            <div className="col-span-2 min-w-0 flex flex-col gap-1.5">
              <label className="flex items-center min-h-[14px] text-[9px] font-black uppercase tracking-widest text-foreground/50 leading-none ml-1">
                Observación
              </label>
              <input
                type="text"
                name="observation"
                value={formData.observation}
                onChange={handleHeaderChange}
                className="m-0 w-full h-9 px-3 bg-background border border-border rounded-lg text-[11px] font-black text-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 outline-none"
                placeholder="Notas del documento..."
              />
            </div>
          </div>  
        </div>

        {/* 3. MAIN TABLE AREA - Full height stretching */}
        <div className="flex-1 min-h-0 max-h-[min(50vh,calc(100vh-15rem))] bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mx-1">
          <div className="px-3 py-2 bg-background border-b border-border flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/15 rounded-lg text-orange-600 dark:text-orange-500">
                  <PackageSearch className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/65">Detalle de Artículos de Ferretería</h3>
             </div>
             <button type="button" onClick={() => addDetail()} className="px-3 py-1.5 bg-foreground text-background rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-1.5 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Nueva Línea
             </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar relative">
             <table className="w-full border-collapse table-fixed min-w-[800px]">
                <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
                   <tr>
                      <th className="w-32 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-left border-r border-border">Código</th>
                      <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-left border-r border-border">Descripción del Producto</th>
                      <th className="w-24 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-center border-r border-border">Cantidad</th>
                      <th className="w-32 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-right border-r border-border">P. Unitario</th>
                      <th className="w-24 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-right border-r border-border">Dscto</th>
                      <th className="w-32 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-right border-r border-border">Monto Total</th>
                      <th className="w-16 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/50 text-center">Opt</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {details.map((item, idx) => (
                      <tr key={item.id} className={`group hover:bg-orange-500/10 dark:hover:bg-orange-500/15 transition-colors border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-card' : 'bg-foreground/[0.03]'}`}>
                         <td className="px-3 py-0 border-r border-border">
                            <div className="text-[9px] font-black text-foreground/45 font-mono tracking-tighter uppercase">{item.productCode || '---'}</div>
                         </td>
                         <td className="px-1 py-0 border-r border-border">
                            <Autocomplete
                               options={productsData?.products.map(p => ({ id: String(p.id), label: p.code ? `[${p.code}] ${p.name}` : p.name })) || []}
                               value={item.productId}
                               onChange={(val) => selectProductForDetail(item.id, val)}
                               placeholder="Escanee o busque producto..."
                               hideLabel
                               isGrid
                               minSearchLength={3}
                               compact
                            />
                         </td>
                         <td className="px-1 py-0 border-r border-border">
                            <input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => updateDetail(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                              className="w-full h-7 bg-transparent text-[10px] font-black text-center text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1 transition-all" 
                            />
                         </td>
                         <td className="px-1 py-0 border-r border-border">
                            <div className="relative flex items-center pr-1">
                               <span className="text-[8px] text-foreground/30 font-black absolute left-2">{formData.currencyType === 'PEN' ? 'S/' : '$'}</span>
                               <input 
                                 type="number" 
                                 step="0.01" 
                                 value={item.unitPrice} 
                                 onChange={(e) => updateDetail(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                                 className="w-full h-7 bg-transparent text-[10px] font-black text-right text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-orange-500 rounded pl-6 transition-all" 
                               />
                            </div>
                         </td>
                         <td className="px-1 py-0 border-r border-border">
                            <input 
                              type="number" 
                              step="0.01" 
                              value={item.discount} 
                              onChange={(e) => updateDetail(item.id, 'discount', parseFloat(e.target.value) || 0)} 
                              className="w-full h-7 bg-transparent text-[10px] font-black text-right text-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1 transition-all" 
                            />
                         </td>
                         <td className="px-3 py-0 border-r border-border bg-foreground/[0.04]">
                            <div className="text-[10px] font-black text-right text-foreground font-mono tracking-tighter">
                              {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                         </td>
                         <td className="px-1 py-0 flex items-center justify-center gap-1">
                            <button type="button" onClick={() => removeDetail(item.id)} className="p-1 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded transition-all">
                               <Trash2 className="w-3 h-3" />
                            </button>
                         </td>
                      </tr>
                   ))}
                   {/* Ghost Row for easy add */}
                   <tr className="border-t-2 border-border">
                      <td colSpan={7} className="p-0">
                         <button type="button" onClick={() => addDetail()} className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-foreground/45 hover:text-orange-600 hover:bg-orange-500/10 transition-all uppercase tracking-widest group">
                            <Plus className="w-3 h-3 group-hover:scale-125 transition-transform" /> Click aquí para añadir otro item
                         </button>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>
        </div>

        {/* 4. FOOTER & SETTLEMENT - Compact bar */}
        <div className="bg-card text-foreground rounded-xl p-3 shadow-lg border border-border border-t-4 border-t-orange-600 shrink-0 grid grid-cols-12 gap-4 mx-1">
           
           {/* Payment Method Section */}
           <div className="col-span-12 lg:col-span-5 flex items-center gap-4 border-r border-border pr-4 relative overflow-visible">
              <div className="flex-1 space-y-1 min-w-0" ref={wayPayTriggerRef}>
                 <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Método de Pago</label>
                 <div className="relative">
                   <button
                     ref={wayPayButtonRef}
                     type="button"
                     onClick={() => setWayPayOpen((o) => !o)}
                     className="w-full h-9 bg-background border border-border rounded-lg text-xs font-black text-foreground px-3 pr-8 text-left focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 outline-none flex items-center gap-2"
                   >
                     <span className="truncate">
                       {resourcesData?.wayPays.find((wp) => String(wp.id) === String(formData.wayPay))?.label ?? "Seleccione..."}
                     </span>
                   </button>
                   <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none transition-transform ${wayPayOpen ? "-rotate-180" : ""}`} />
                   {wayPayOpen && wayPayMenuStyle && typeof document !== "undefined" && createPortal(
                     <div
                       ref={wayPayMenuRef}
                       style={wayPayMenuStyle}
                       className="overflow-y-auto custom-scrollbar rounded-lg border border-border bg-card shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-150"
                     >
                       {resourcesData?.wayPays.map((wp) => (
                         <button
                           key={wp.id}
                           type="button"
                           onClick={() => {
                             setFormData((prev) => ({ ...prev, wayPay: String(wp.id) }));
                             setWayPayOpen(false);
                           }}
                           className={`w-full px-3 py-2 text-left text-[11px] font-black uppercase tracking-tight transition-colors ${
                             String(formData.wayPay) === String(wp.id)
                               ? "bg-orange-600 text-white"
                               : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                           }`}
                         >
                           {wp.label}
                         </button>
                       ))}
                     </div>,
                     document.body
                   )}
                 </div>
              </div>
              <div className="flex-[2] space-y-1 min-w-0">
                 <Autocomplete
                   label="Caja o Banco de Origen"
                   options={filteredCashes.map(c => ({ id: c.id, label: `${c.name} (${c.currencyDescription})` }))}
                   value={formData.cashId}
                   onChange={(val) => {
                     setFormData(prev => ({ ...prev, cashId: String(val) }));
                     setMissingFields(prev => prev.filter(f => f !== 'cashId'));
                   }}
                   placeholder="Canal de fondos..."
                   icon={<Hash className="w-3.5 h-3.5 text-orange-500" />}
                   disabled={!formData.subsidiaryId}
                   error={missingFields.includes('cashId')}
                   compact
                   dropdownPlacement="top"
                 />
              </div>
              
              {formData.wayPay === "9" && (
                <div className="flex flex-col gap-1 items-center">
                  <label className="text-[8px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-tighter">Cronograma</label>
                  <button type="button" onClick={addQuota} className="h-8 w-8 bg-orange-600 hover:bg-orange-500 text-white rounded-lg flex items-center justify-center transition-all shadow-lg shadow-orange-900/40">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Float Quotas List when active */}
              {formData.wayPay === "9" && quotas.length > 0 && (
                <div className="absolute bottom-full left-0 w-64 bg-card border border-border rounded-xl shadow-2xl p-2 mb-2 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-[9px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">Cuotas Recogidas</span>
                      <span className="text-[10px] text-muted-foreground font-bold">{quotas.length} items</span>
                   </div>
                   <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 px-1">
                      {quotas.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-border group/qu">
                           <span className="text-[9px] font-black text-muted-foreground w-4">{i+1}</span>
                           <input type="date" value={q.paymentDate} onChange={(e) => {
                             const nq = [...quotas]; nq[i].paymentDate = e.target.value; setQuotas(nq);
                           }} className="bg-transparent border-none text-[10px] font-black text-foreground focus:ring-0 p-0 w-24" />
                           <input type="number" value={q.total} onChange={(e) => {
                             const nq = [...quotas]; nq[i].total = parseFloat(e.target.value) || 0; setQuotas(nq);
                           }} className="bg-transparent border-none text-[10px] font-black text-orange-600 dark:text-orange-500 text-right focus:ring-0 p-0 flex-1 min-w-0" />
                           <button type="button" onClick={() => setQuotas(quotas.filter((_, idx)=>idx!==i))} className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover/qu:opacity-100 transition-opacity">
                             <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Totals Summary */}
           <div className="col-span-12 lg:col-span-4 flex items-center justify-around gap-2 px-2 border-r border-border text-foreground font-mono">
              <div className="text-center">
                 <p className="text-[8px] font-black text-muted-foreground uppercase">Subtotal</p>
                 <p className="text-[10px] font-bold">{(totals.totalTaxed).toFixed(2)}</p>
              </div>
              <div className="text-center">
                 <p className="text-[8px] font-black text-muted-foreground uppercase">IGV 18%</p>
                 <p className="text-[10px] font-bold">{(totals.totalIgv).toFixed(2)}</p>
              </div>
              <div className="text-center bg-muted/50 px-3 py-1 rounded-lg border border-border">
                 <p className="text-[8px] font-black text-orange-600 dark:text-orange-500 uppercase">Total Neto</p>
                 <p className="text-lg font-black text-orange-600 dark:text-orange-500 tracking-tighter">
                   {formData.currencyType === 'PEN' ? 'S/' : '$'} {totals.totalAmount.toFixed(2)}
                 </p>
              </div>
           </div>

           {/* Actions */}
           <div className="col-span-12 lg:col-span-3 flex items-center justify-end gap-3">
              <button type="button" onClick={resetForm} className="h-9 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-all">
                BORRAR
              </button>
              <button type="submit" disabled={creating} className="h-10 px-6 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-900/40 flex items-center gap-2 transform active:scale-95 transition-all disabled:opacity-50">
                 {creating ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>PROCESAR COMPRA <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
           </div>
        </div>

        {/* 5. FLOATING MESSAGES */}
        {(error || success) && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 shadow-2xl border-l-4 ${
            error ? 'bg-white border-red-500' : 'bg-white border-emerald-500'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="pr-4">
              <p className="text-[9px] font-black uppercase text-slate-400">{error ? 'Error Detectado' : 'Registro Exitoso'}</p>
              <p className="text-xs font-black text-slate-800">{error || success}</p>
            </div>
            <button onClick={() => {setError(""); setSuccess("");}} className="text-slate-300 hover:text-slate-500"><Plus className="w-4 h-4 rotate-45" /></button>
          </div>
        )}
      </form>

      {/* Internal Scroll Style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

    </div>
  );
}
