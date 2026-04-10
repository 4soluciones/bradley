'use client';

import { useState, useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { useQuery, useMutation } from '@apollo/client/react';
import { PRODUCTS_QUERY, WAREHOUSES_QUERY } from '../../products/graphql';
import { ProductsData } from '../../products/types';
import { getApiBaseUrl } from '@/app/lib/config';
import Modal from '@/app/components/Modal';
import { gql } from '@apollo/client';
import {
  Monitor,
  Search,
  Trash2,
  User,
  PackageSearch,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Construction,
  MapPin,
} from 'lucide-react';

const SALE_STATUS_OPTIONS = [
  { value: 'registrado', label: 'Registrado' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'pendiente', label: 'Pendiente' },
] as const;

/** Códigos enviados al API; venta interna (0101) por defecto. */
const OPERATION_TYPE_OPTIONS = [
  { value: '0101', label: 'Venta interna' },
  { value: '0102', label: 'Operaciones no domiciliadas' },
  { value: '0200', label: 'Exportación de bienes' },
] as const;

type ScreenWithExtended = Screen & { 
  isExtended?: boolean;
  availLeft?: number;
  availTop?: number;
};

const CUSTOMER_DISPLAY_WINDOW_NAME = 'bradley_customer_display';

const CREATE_SALE_MUTATION = gql`
  mutation CreateSale(
    $documentType: String!,
    $operationType: String!,
    $serial: String!,
    $correlative: Int!,
    $currencyType: String!,
    $saleExchangeRate: Float!,
    $operationDate: String!,
    $emitDate: String!,
    $emitTime: String!,
    $userId: Int!,
    $clientId: Int!,
    $subsidiaryId: Int!,
    $warehouseId: Int!,
    $igvType: Float!,
    $totalTaxed: Float!,
    $totalIgv: Float!,
    $totalAmount: Float!,
    $observation: String,
    $details: [OperationDetailInput!]!,
    $wayPay: Int!,
    $cashId: Int,
    $code: Int
  ) {
    createSale(
      documentType: $documentType,
      operationType: $operationType,
      serial: $serial,
      correlative: $correlative,
      currencyType: $currencyType,
      saleExchangeRate: $saleExchangeRate,
      operationDate: $operationDate,
      emitDate: $emitDate,
      emitTime: $emitTime,
      userId: $userId,
      clientId: $clientId,
      subsidiaryId: $subsidiaryId,
      warehouseId: $warehouseId,
      igvType: $igvType,
      totalTaxed: $totalTaxed,
      totalIgv: $totalIgv,
      totalAmount: $totalAmount,
      observation: $observation,
      details: $details,
      wayPay: $wayPay,
      cashId: $cashId,
      code: $code
    ) {
      success
      message
      id
    }
  }
`;

interface CartItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  tariffId: number;
  typeAffectation: string;
  subsidiaryId: number | null;
}

const IGV_MULTIPLIER = 1.18;

function buildSaleDetailInput(item: CartItem) {
  const qty = item.quantity;
  const unitPrice = item.price;
  const lineTotal = unitPrice * qty;
  const typeAff = item.typeAffectation || '10';

  if (typeAff === '10') {
    const totalValue = lineTotal / IGV_MULTIPLIER;
    const totalIgv = lineTotal - totalValue;
    return {
      productTariffId: item.tariffId,
      typeAffectation: typeAff,
      quantity: qty,
      unitValue: unitPrice / IGV_MULTIPLIER,
      unitPrice,
      discountPercentage: 0,
      igvPercentage: 18,
      totalDiscount: 0,
      totalValue,
      totalIgv,
      totalAmount: lineTotal,
      totalToPay: lineTotal,
      description: item.name,
    };
  }

  return {
    productTariffId: item.tariffId,
    typeAffectation: typeAff,
    quantity: qty,
    unitValue: unitPrice,
    unitPrice,
    discountPercentage: 0,
    igvPercentage: 0,
    totalDiscount: 0,
    totalValue: lineTotal,
    totalIgv: 0,
    totalAmount: lineTotal,
    totalToPay: lineTotal,
    description: item.name,
  };
}

interface WarehousesQueryData {
  warehouses: { id: string; name: string; subsidiaryId: number | null }[];
}

interface ClientListItem {
  id: string;
  documentType: string;
  documentNumber: string;
  names: string;
  address?: string | null;
}

interface ClientsData {
  clients: ClientListItem[];
}

interface CreateSaleResponse {
  createSale: {
    success: boolean;
    message: string;
    id?: number | null;
  };
}

const CLIENTS_QUERY = gql`
  query GetClientsForSales {
    clients {
      id
      documentType
      documentNumber
      names
      address
    }
  }
`;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  '1': 'DNI',
  '6': 'RUC',
  '4': 'C. EXTRANJERIA',
  '7': 'PASAPORTE',
  '0': 'SIN DOC',
};

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export default function NewSalePage() {
  const { resolvedTheme } = useTheme();
  const formColorScheme: CSSProperties['colorScheme'] =
    resolvedTheme === 'dark' ? 'dark' : 'light';

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [displayedProductId, setDisplayedProductId] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loggedUserName, setLoggedUserName] = useState('USUARIO');
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const clientSearchInputRef = useRef<HTMLInputElement>(null);
  const customerDisplayWindowRef = useRef<Window | null>(null);
  const pendingDisplayProductRef = useRef<CartItem | null>(null);
  const [productHighlightIndex, setProductHighlightIndex] = useState(0);
  const [clientHighlightIndex, setClientHighlightIndex] = useState(0);

  // Form State
  const [client, setClient] = useState({
    id: 1,
    name: 'CLIENTE VARIOS',
    documentType: '0',
    documentNumber: '-',
    address: '-',
  });
  const [documentType, setDocumentType] = useState('03'); // Boleta
  const [saleStatus, setSaleStatus] = useState<string>('registrado');
  const [operationType, setOperationType] = useState<string>('0101');
  const [serial, setSerial] = useState('B001');
  const [correlative, setCorrelative] = useState(1);
  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('bradley_pos_code');
      const n = savedCode ? parseInt(savedCode, 10) : 1;
      return Number.isFinite(n) && n >= 1 ? n : 1;
    }
    return 1;
  });

  const incrementCode = () => {
    const nextCode = code + 1;
    setCode(nextCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bradley_pos_code', nextCode.toString());
    }
  };

  const { data: productsData, loading: productsLoading } = useQuery<ProductsData>(PRODUCTS_QUERY);
  const { data: clientsData, loading: clientsLoading } = useQuery<ClientsData>(CLIENTS_QUERY);
  const { data: warehousesData } = useQuery<WarehousesQueryData>(WAREHOUSES_QUERY);
  const [createSale] = useMutation<CreateSaleResponse>(CREATE_SALE_MUTATION);

  const saleWarehouseId = useMemo(() => {
    if (!warehousesData?.warehouses?.length || cart.length === 0) return null;
    const subId = cart[0].subsidiaryId;
    if (subId == null) {
      const w = warehousesData.warehouses[0];
      return w ? parseInt(w.id, 10) : null;
    }
    const match = warehousesData.warehouses.find((w) => w.subsidiaryId === subId);
    return match ? parseInt(match.id, 10) : null;
  }, [warehousesData, cart]);

  const saleSubsidiaryId = useMemo(() => {
    if (!cart.length) return null;
    const fromProduct = cart[0].subsidiaryId;
    if (fromProduct != null) return fromProduct;
    if (saleWarehouseId == null || !warehousesData?.warehouses) return null;
    const w = warehousesData.warehouses.find((wh) => parseInt(wh.id, 10) === saleWarehouseId);
    return w?.subsidiaryId ?? null;
  }, [cart, saleWarehouseId, warehousesData]);

  useEffect(() => {
    const wsUrl = getApiBaseUrl().replace('http', 'ws') + '/ws/sale-display/';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      const pending = pendingDisplayProductRef.current;
      if (pending && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              type: 'show_product',
              data: {
                name: pending.name,
                price: pending.price.toString(),
                image: pending.image,
                description: `Código: ${pending.code}`,
              },
            })
          );
          pendingDisplayProductRef.current = null;
          setDisplayedProductId(pending.id);
        } catch {
          /* reintento vía sendProductPayload */
        }
      }
    };
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentDateTime(new Date());
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;
    const payload = decodeJwtPayload(accessToken);
    const userName =
      payload?.username ||
      payload?.user_name ||
      payload?.name ||
      payload?.first_name ||
      payload?.sub;
    if (userName) {
      setLoggedUserName(String(userName).toUpperCase());
    }
    const uid = payload?.user_id ?? payload?.userId;
    if (uid != null && uid !== '') {
      setLoggedUserId(Number(uid));
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F4' || event.code === 'F4') {
        event.preventDefault();
        setIsClientModalOpen(false);
        setIsProductModalOpen(true);
      }
      if (event.key === 'F2' || event.code === 'F2' || event.keyCode === 113) {
        event.preventDefault();
        setIsProductModalOpen(false);
        setIsClientModalOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (isProductModalOpen) {
      setProductHighlightIndex(0);
      setTimeout(() => productSearchInputRef.current?.focus(), 0);
    }
  }, [isProductModalOpen]);

  useEffect(() => {
    if (isClientModalOpen) {
      setClientHighlightIndex(0);
      setTimeout(() => clientSearchInputRef.current?.focus(), 0);
    }
  }, [isClientModalOpen]);

  useEffect(() => {
    if (!isProductModalOpen) return;
    setProductHighlightIndex(0);
  }, [searchTerm, isProductModalOpen]);

  useEffect(() => {
    if (!isClientModalOpen) return;
    setClientHighlightIndex(0);
  }, [clientSearchTerm, isClientModalOpen]);

  const addToCart = (product: any) => {
    const tariff = product.tariffs?.[0]; // Default to first tariff
    if (!tariff) return;

    const lineHolder: { current: CartItem | null } = { current: null };

    flushSync(() => {
      setCart((prev) => {
        const tariffId = parseInt(tariff.id, 10);
        const existingIndex = prev.findIndex((item) => item.id === product.id && item.tariffId === tariffId);
        if (existingIndex >= 0) {
          const nextQty = prev[existingIndex].quantity + 1;
          lineHolder.current = { ...prev[existingIndex], quantity: nextQty };
          return prev.map((item, index) =>
            index === existingIndex ? { ...item, quantity: nextQty } : item
          );
        }
        const newItem: CartItem = {
          id: product.id,
          code: product.code || 'N/A',
          name: product.name,
          quantity: 1,
          price: tariff.priceWithIgv,
          image: product.imageUrl,
          tariffId,
          typeAffectation: product.typeAffectation || '10',
          subsidiaryId: product.subsidiaryId ?? null,
        };
        lineHolder.current = newItem;
        return [...prev, newItem];
      });
    });

    setIsProductModalOpen(false);
    setSearchTerm('');

    const lineForDisplay = lineHolder.current;
    if (lineForDisplay) {
      syncPickerProductToCustomerDisplay(lineForDisplay);
    }
  };

  const selectClient = (c: ClientListItem) => {
    setClient({
      id: Number(c.id),
      name: c.names,
      documentType: c.documentType,
      documentNumber: c.documentNumber,
      address: (c.address && c.address.trim()) || '-',
    });
    setIsClientModalOpen(false);
    setClientSearchTerm('');
  };

  const sendProductPayloadToDisplaySocket = (item: CartItem) => {
    const ws = socket;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingDisplayProductRef.current = item;
      return;
    }
    try {
      ws.send(
        JSON.stringify({
          type: 'show_product',
          data: {
            name: item.name,
            price: item.price.toString(),
            image: item.image,
            description: `Código: ${item.code}`,
          },
        })
      );
      pendingDisplayProductRef.current = null;
      setDisplayedProductId(item.id);
    } catch {
      pendingDisplayProductRef.current = item;
    }
  };

  const sendToDisplay = (item: CartItem) => {
    sendProductPayloadToDisplaySocket(item);
  };

  /** Tras elegir producto en el buscador: muestra en display y abre la ventana si hace falta. */
  const syncPickerProductToCustomerDisplay = (item: CartItem) => {
    const w = customerDisplayWindowRef.current;
    const needsOpen = !w || w.closed;

    if (needsOpen) {
      openCustomerDisplay();
      if (!customerDisplayWindowRef.current) {
        pendingDisplayProductRef.current = item;
      }
    } else {
      try {
        w.focus();
      } catch {
        /* política del navegador */
      }
    }

    sendProductPayloadToDisplaySocket(item);
    const retryMs = [200, 550, 1200, 2400];
    retryMs.forEach((ms) => {
      window.setTimeout(() => sendProductPayloadToDisplaySocket(item), ms);
    });
  };

  const clearDisplay = () => {
    pendingDisplayProductRef.current = null;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'clear_display' }));
      setDisplayedProductId(null);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
  };

  const handleSaveSale = async () => {
    setSaveError('');
    setSaveSuccess('');
    if (cart.length === 0) {
      setSaveError('Agregue al menos un producto a la venta.');
      return;
    }
    if (loggedUserId == null) {
      setSaveError('No se identificó el usuario. Cierre sesión y vuelva a entrar.');
      return;
    }
    if (saleWarehouseId == null) {
      setSaveError('No hay almacén disponible. Configure almacenes en el módulo de productos.');
      return;
    }
    if (saleSubsidiaryId == null) {
      setSaveError('No se pudo determinar la sede de la operación.');
      return;
    }
    const firstSub = cart[0].subsidiaryId;
    const mixedSubsidiary = cart.some((i) => (i.subsidiaryId ?? null) !== (firstSub ?? null));
    if (mixedSubsidiary) {
      setSaveError('Todos los ítems deben pertenecer a la misma sede.');
      return;
    }

    const detailsInput = cart.map(buildSaleDetailInput);
    const totalTaxed = detailsInput.reduce((acc, d) => acc + d.totalValue, 0);
    const totalIgvSum = detailsInput.reduce((acc, d) => acc + d.totalIgv, 0);
    const totalAmt = detailsInput.reduce((acc, d) => acc + d.totalAmount, 0);

    const now = currentDateTime ?? new Date();
    const dateStr = now.toISOString().split('T')[0];
    const emitTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setSaveLoading(true);
    try {
      const { data } = await createSale({
        variables: {
          documentType,
          operationType,
          serial,
          correlative,
          currencyType: 'PEN',
          saleExchangeRate: 1,
          operationDate: dateStr,
          emitDate: dateStr,
          emitTime,
          userId: loggedUserId,
          clientId: client.id,
          subsidiaryId: saleSubsidiaryId,
          warehouseId: saleWarehouseId,
          igvType: 18,
          totalTaxed,
          totalIgv: totalIgvSum,
          totalAmount: totalAmt,
          observation: '',
          details: detailsInput,
          wayPay: 1,
          cashId: null,
          code: code,
        },
      });
      if (data?.createSale?.success) {
        setSaveSuccess(data.createSale.message ?? 'Venta registrada.');
        setCart([]);
        setCorrelative((c) => c + 1);
        incrementCode();
      } else {
        setSaveError(data?.createSale?.message ?? 'No se pudo registrar la venta.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error de red o servidor.';
      setSaveError(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredProducts = productsData?.products.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const filteredClients = clientsData?.clients.filter((c) => {
    const normalized = clientSearchTerm.toLowerCase().trim();
    if (!normalized) return true;
    const addr = (c.address ?? '').toLowerCase();
    return (
      c.names.toLowerCase().includes(normalized) ||
      c.documentNumber?.toLowerCase().includes(normalized) ||
      addr.includes(normalized)
    );
  }) ?? [];

  useEffect(() => {
    if (!isProductModalOpen || productsLoading) return;
    setProductHighlightIndex((i) =>
      filteredProducts.length === 0 ? 0 : Math.min(i, filteredProducts.length - 1)
    );
  }, [filteredProducts.length, isProductModalOpen, productsLoading]);

  useEffect(() => {
    if (!isClientModalOpen || clientsLoading) return;
    setClientHighlightIndex((i) =>
      filteredClients.length === 0 ? 0 : Math.min(i, filteredClients.length - 1)
    );
  }, [filteredClients.length, isClientModalOpen, clientsLoading]);

  useEffect(() => {
    if (!isProductModalOpen || productsLoading || filteredProducts.length === 0) return;
    const el = document.querySelector<HTMLElement>(
      `[data-product-highlight="${productHighlightIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [productHighlightIndex, isProductModalOpen, productsLoading, filteredProducts.length]);

  useEffect(() => {
    if (!isClientModalOpen || clientsLoading || filteredClients.length === 0) return;
    const el = document.querySelector<HTMLElement>(
      `[data-client-highlight="${clientHighlightIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [clientHighlightIndex, isClientModalOpen, clientsLoading, filteredClients.length]);

  const openCustomerDisplay = () => {
    if (typeof window === 'undefined') return;
    const displayUrl = `${window.location.origin}/modules/sales/display`;
    const width = 1280;
    const height = 720;
    const scr = window.screen as ScreenWithExtended;
    let left: number;
    let top: number;
    if (scr.isExtended === true) {
      left = (scr.availLeft ?? 0) + (scr.availWidth ?? 0);
      top = scr.availTop ?? 0;
    } else {
      left = (scr.availLeft ?? 0) + Math.max((scr.availWidth ?? 0) - width, 0);
      top = scr.availTop ?? 0;
    }
    const features = `width=${width},height=${height},left=${left},top=${top}`;
    const popup = window.open(displayUrl, CUSTOMER_DISPLAY_WINDOW_NAME, features);
    if (popup) {
      customerDisplayWindowRef.current = popup;
      try {
        popup.focus();
      } catch {
        /* focus puede estar bloqueado */
      }
    }
  };

  const formattedDate = currentDateTime ? currentDateTime.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) : '';
  const formattedTime = currentDateTime ? currentDateTime.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) : '';  return (
    <div className="flex w-full h-full min-w-0 flex-col bg-background font-sans text-foreground selection:bg-accent/20 selection:text-accent-foreground overflow-hidden border border-border rounded-xl shadow-2xl">
      {/* 1. HEADER MULTILÍNEA */}
      <header className="bg-card border-b border-border shadow-sm flex flex-col shrink-0 overflow-hidden">
        {/* LÍNEA 1: MARCA Y ESTADO */}
        <div className="px-5 py-1 flex items-center justify-between gap-4 bg-background/50">
          <div className="text-sm font-black tracking-[0.2em] text-accent flex items-center gap-2">
            <span className="bg-accent text-white px-1.5 py-0.5 rounded italic">B</span>
            BRADLEY POS
          </div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{saleStatus.toUpperCase()}</span>
          </div>
        </div>


        {/* LÍNEA SEPARADORA COMPACTA */}
        <div className="h-px w-full bg-border/40" />


        {/* LÍNEA 2: METADATOS Y CONTROLES DE PANTALLA */}
        <div className="px-5 py-2 flex items-center justify-between gap-4 text-[10px] font-bold uppercase whitespace-nowrap bg-card">
          <div className="flex items-center gap-4">
            {/* COLETA */}
            <div className="flex items-center gap-1.5 bg-muted text-foreground/60 px-2 py-1 rounded-md border border-border/50">
              <span className="opacity-40">#</span>
              <span className="font-black tabular-nums">{String(code).padStart(4, '0')}</span>
            </div>
            
            <div className="h-4 w-px bg-border/60" />
            
            {/* TIPO DOCUMENTO */}
            <div className="flex items-center gap-2 group">
              <span className="text-foreground/30 font-black">DOCUMENTO:</span>
              <select 
                value={documentType} 
                onChange={(e) => setDocumentType(e.target.value)} 
                className="bg-background border border-border rounded-md px-2 py-1 text-[10px] font-black focus:border-accent outline-none appearance-none cursor-pointer hover:border-accent/40 transition-colors"
              >
                <option value="03">BOLETA ELECTRÓNICA</option>
                <option value="01">FACTURA ELECTRÓNICA</option>
                <option value="00">NOTA DE VENTA</option>
              </select>
            </div>

            <div className="h-4 w-px bg-border/60" />

            {/* SERIE Y CORRELATIVO */}
            <div className="flex items-center gap-2">
              <span className="text-foreground/30 font-black">NÚMERO:</span>
              <div className="flex items-center gap-1">
                <input 
                  value={serial} 
                  onChange={(e) => setSerial(e.target.value.toUpperCase())} 
                  className="w-12 bg-background border border-border rounded-md px-2 py-1 text-center font-black text-indigo-600 focus:border-indigo-400 outline-none transition-all"
                  maxLength={4}
                />
                <span className="opacity-20">-</span>
                <input 
                  type="number"
                  value={correlative} 
                  onChange={(e) => setCorrelative(parseInt(e.target.value) || 0)} 
                  className="w-16 bg-background border border-border rounded-md px-2 py-1 text-center font-black text-indigo-600 focus:border-indigo-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="h-4 w-px bg-border/60" />

            {/* TIPO OPERACIÓN */}
            <div className="hidden xl:flex items-center gap-2">
              <span className="text-foreground/30 font-black">OPERACIÓN:</span>
              <span className="font-black text-foreground/70">
                {OPERATION_TYPE_OPTIONS.find(o => o.value === operationType)?.label || operationType}
              </span>
            </div>
          </div>

          {/* ICONOS PANTALLA SECUNDARIA */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openCustomerDisplay}
              title="Abrir pantalla cliente"
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white rounded-lg transition-all border border-indigo-500/20 flex items-center gap-2"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black">DISPLAY</span>
            </button>
            <button
              type="button"
              onClick={clearDisplay}
              title="Limpiar pantalla"
              className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-all border border-border hover:border-red-500/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* LÍNEA 3: ACCIONES PRINCIPALES */}
        <div className="px-4 py-2 flex items-center gap-4 bg-muted/5 border-t border-border/30">
          <button
            type="button"
            onClick={() => setIsProductModalOpen(true)}
            className="flex-1 max-w-[320px] bg-accent hover:bg-accent/90 text-white h-11 rounded-xl font-black text-sm shadow-lg shadow-accent/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-tight group"
          >
            <Search className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>F4 Buscar producto</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="flex-[2] bg-card hover:bg-accent/5 border border-border hover:border-accent/40 h-11 rounded-xl px-4 flex items-center gap-4 transition-all group shadow-sm overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
               <User className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-accent uppercase tracking-widest opacity-60">F2 Cliente</span>
                <span className="text-[9px] font-bold text-foreground/40 font-mono tracking-tight bg-muted px-1.5 rounded">{client.documentNumber}</span>
              </div>
              <div className="text-sm font-black truncate uppercase text-foreground/80 leading-none mt-1">{client.name}</div>
            </div>
            <div className="text-[10px] font-black text-accent opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">CAMBIAR CLIENTE →</div>
          </button>
        </div>
      </header>

      {/* 2. ÁREA DE TRABAJO */}
      <main className="flex-1 flex flex-col overflow-hidden p-3 min-h-0 bg-muted/10">
        
        {/* TABLA DE PRODUCTOS CON SCROLL INTERNO */}
        <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 backdrop-blur-md bg-background/90 border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-24">SKU</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border">Descripción</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-28 text-center">Cant.</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-36 text-right">P.U. (INC IGV)</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-36 text-right">Total</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-28 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {cart.length > 0 ? (
                  cart.map((item, index) => (
                    <tr key={`${item.id}-${item.tariffId}`} className="group hover:bg-accent/5 transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px]">
                        <span className="bg-muted px-2 py-1 rounded text-foreground/60 border border-border/40 font-black">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-black tracking-tight leading-none" title={item.name}>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center bg-background border border-border rounded-xl p-0.5 w-full max-w-[100px] mx-auto group-hover:border-accent/40 transition-colors">
                          <button
                            type="button"
                            onClick={() => { const nc = [...cart]; if(nc[index].quantity > 0) nc[index].quantity -= 1; setCart(nc); }}
                            className="w-7 h-7 flex items-center justify-center hover:bg-accent hover:text-white rounded-lg text-xs font-black transition-all"
                          > - </button>
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => { const nc = [...cart]; nc[index].quantity = parseFloat(e.target.value) || 0; setCart(nc); }}
                            className="w-12 bg-transparent text-center font-black text-xs outline-none tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => { const nc = [...cart]; nc[index].quantity += 1; setCart(nc); }}
                            className="w-7 h-7 flex items-center justify-center hover:bg-accent hover:text-white rounded-lg text-xs font-black transition-all"
                          > + </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-bold text-[13px]">
                          <span className="opacity-30">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => { const nc = [...cart]; nc[index].price = parseFloat(e.target.value) || 0; setCart(nc); }}
                            className="w-24 bg-background/50 border border-border rounded-lg px-2 py-1.5 text-right font-black text-[13px] focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="text-[14px] font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                           S/ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => sendProductPayloadToDisplaySocket(item)}
                            title="Ver en segunda pantalla"
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${displayedProductId === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-muted text-foreground/30 hover:bg-indigo-600 hover:text-white'}`}
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCart(cart.filter((_, i) => i !== index))}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted text-foreground/30 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-6 opacity-20">
                        <span className="text-8xl grayscale">🧾</span>
                        <div className="flex flex-col gap-2">
                           <span className="text-2xl font-black uppercase tracking-tighter">No hay productos</span>
                           <span className="text-sm font-bold">Presiona F4 para iniciar la búsqueda</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 3. FOOTER INTEGRADO (Todos los controles en la base) */}
      <footer className="bg-card border-t border-border px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-between shrink-0 relative z-30">
        {/* INFO IZQUIERDA */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase opacity-40 leading-none">Ítems</span>
               <span className="text-2xl font-black leading-none tabular-nums text-accent">{cart.length}</span>
             </div>
             <div className="h-8 w-px bg-border" />
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase opacity-40 leading-none">Hora Sistema</span>
               <span className="text-[12px] font-black tabular-nums opacity-60">
                  {mounted ? formattedTime : '…'}
               </span>
             </div>
          </div>
          
          <div className="h-10 w-px bg-border" />

          {/* TOTALES DESGLOSADOS */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase opacity-40 leading-none">Subtotal</span>
              <span className="text-[14px] font-bold font-mono">
                 S/ {(calculateTotal() / 1.18).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase opacity-40 leading-none">IGV (18%)</span>
              <span className="text-[14px] font-bold font-mono">
                 S/ {(calculateTotal() - (calculateTotal() / 1.18)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* TOTAL Y ACCIÓN DERECHA */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-accent leading-none">Total Neto</span>
             <div className="text-4xl font-black tabular-nums tracking-tighter text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
                <span className="text-base opacity-30 mr-2 font-bold italic">S/</span>
                {calculateTotal().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
          </div>

          <div className="h-14 w-px bg-border" />

          {/* MÉTODO PAGO Y BOTÓN PAGAR */}
          <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-2xl border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase opacity-40 px-1">Método</span>
              <select className="bg-background border border-border rounded-lg text-xs font-black py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer appearance-none shadow-sm">
                 <option value="1">EFECTIVO</option>
                 <option value="2">TARJETA</option>
                 <option value="3">TRANSFERENCIA</option>
                 <option value="4">YAPE/PLIN</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveSale}
              disabled={saveLoading || cart.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-white min-w-[160px] h-12 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all group"
            >
              {saveLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-[10px] font-bold opacity-60 uppercase leading-none">Confirmar</span>
                  <span className="text-xl font-black tracking-tight leading-none mt-1 uppercase">Pagar Venta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>


      {/* Modals - Industrial Re-design */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Buscar material"
        width="max-w-4xl"
        titleClassName="text-sm font-black text-foreground tracking-tight uppercase"
        bodyClassName="p-3 sm:p-4"
      >
        <div className="flex flex-col gap-3" style={{ colorScheme: formColorScheme }}>
            <div className="relative group">
              <Search className="w-4 h-4 text-accent absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-80" />
              <input
                  ref={productSearchInputRef}
                  type="text"
                  placeholder="Código o nombre…"
                  className="w-full pl-9 pr-3 py-2 bg-background text-foreground border border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none text-sm font-semibold shadow-sm placeholder:text-foreground/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (productsLoading || filteredProducts.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setProductHighlightIndex((i) =>
                        Math.min(i + 1, filteredProducts.length - 1)
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setProductHighlightIndex((i) => Math.max(i - 1, 0));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      const p = filteredProducts[productHighlightIndex];
                      if (p) addToCart(p);
                    }
                  }}
              />
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-[min(52vh,28rem)] overflow-y-auto pr-1 custom-scrollbar">
                {productsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        <div className="text-foreground/50 font-bold uppercase text-[10px]">Cargando…</div>
                    </div>
                ) : filteredProducts?.length > 0 ? (
                    filteredProducts.map((p: any, idx: number) => (
                        <button
                            key={p.id}
                            type="button"
                            data-product-highlight={idx}
                            onClick={() => addToCart(p)}
                            className={`flex items-center gap-2 sm:gap-3 p-2 rounded-lg border transition-all text-left active:scale-[0.99] ${
                              idx === productHighlightIndex
                                ? 'border-accent bg-orange-50 dark:bg-orange-950/40 ring-1 ring-accent/50'
                                : 'border-border hover:border-accent/60 bg-card'
                            }`}
                        >
                            <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center p-1 border border-border bg-background">
                               {p.imageUrl ? (
                                   <img src={`${getApiBaseUrl()}${p.imageUrl}`} alt="" className="w-full h-full object-contain" />
                               ) : (
                                   <PackageSearch className="w-5 h-5 text-foreground/35" />
                               )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="text-sm font-bold text-foreground leading-snug line-clamp-2">{p.name}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="bg-slate-800 dark:bg-slate-950 text-white text-[9px] px-1.5 py-px rounded font-mono">{p.code || '—'}</span>
                                  <span className="text-[9px] text-foreground/45 font-semibold">
                                    Stk {p.productStores?.[0]?.stock ?? 0}
                                  </span>
                                </div>
                            </div>

                            <div className="text-right shrink-0 pr-1">
                                <div className="text-[8px] text-foreground/45 font-bold uppercase">IGV</div>
                                <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                  {p.tariffs?.[0]?.priceWithIgv?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 opacity-40 gap-2 text-foreground">
                        <AlertCircle className="w-8 h-8" />
                        <div className="text-xs font-black uppercase tracking-wide">Sin resultados</div>
                    </div>
                )}
            </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Clientes"
        width="max-w-2xl"
        titleClassName="text-sm font-black text-foreground tracking-tight uppercase"
        bodyClassName="p-3 sm:p-4"
      >
        <div className="flex flex-col gap-3" style={{ colorScheme: formColorScheme }}>
          <div className="relative group">
            <User className="w-4 h-4 text-foreground/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              ref={clientSearchInputRef}
              type="text"
              placeholder="RUC, DNI, nombre o dirección…"
              className="w-full pl-9 pr-3 py-2 bg-background text-foreground border border-border rounded-lg outline-none text-sm font-semibold focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-foreground/40 shadow-sm"
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (clientsLoading || filteredClients.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setClientHighlightIndex((i) =>
                    Math.min(i + 1, filteredClients.length - 1)
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setClientHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const row = filteredClients[clientHighlightIndex];
                  if (row) selectClient(row);
                }
              }}
            />
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-12 gap-1 bg-border/20 border-b border-border px-2 py-1.5 text-[8px] uppercase font-black tracking-wide text-foreground/70">
              <div className="col-span-3">Doc</div>
              <div className="col-span-5 sm:col-span-4">Nombre</div>
              <div className="col-span-4 sm:col-span-5 hidden sm:block">Dirección</div>
            </div>
            <div className="max-h-[min(50vh,22rem)] overflow-y-auto divide-y divide-border">
              {clientsLoading ? (
                <div className="py-8 text-center animate-pulse text-foreground/45 text-xs font-bold">Cargando…</div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    data-client-highlight={idx}
                    onClick={() => selectClient(c)}
                    className={`w-full grid grid-cols-12 items-start gap-1 p-2 text-left text-[11px] transition-colors active:scale-[0.99] ${
                      idx === clientHighlightIndex
                        ? 'bg-accent/10 ring-1 ring-inset ring-accent/40'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="col-span-3 min-w-0">
                      <span className="inline-block text-[8px] font-black text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/70 px-1 rounded mb-0.5">
                        {DOCUMENT_TYPE_LABELS[c.documentType] || c.documentType}
                      </span>
                      <span className="block font-mono font-bold text-foreground/80 truncate" title={c.documentNumber || ''}>{c.documentNumber || '-'}</span>
                    </div>
                    <div className="col-span-5 sm:col-span-4 min-w-0 font-bold leading-tight line-clamp-2" title={c.names}>
                      {c.names}
                    </div>
                    <div className="col-span-4 sm:col-span-5 min-w-0 hidden sm:flex items-start gap-1 text-foreground/55 leading-tight">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                      <span className="line-clamp-2 text-[10px]" title={c.address || ''}>{c.address || '—'}</span>
                    </div>
                    <div className="col-span-12 sm:hidden text-[9px] text-foreground/45 pl-0.5 line-clamp-1">
                      {c.address || '—'}
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-foreground/40 text-xs font-medium">Sin clientes</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
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
