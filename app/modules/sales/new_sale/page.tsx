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
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  Workflow,
  Construction,
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
  const [client, setClient] = useState({ id: 1, name: 'CLIENTE VARIOS', documentType: '0', documentNumber: '-' });
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
    return (
      c.names.toLowerCase().includes(normalized) ||
      c.documentNumber?.toLowerCase().includes(normalized)
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
  }) : '';

  /* Tokens del tema (--background/--foreground) + color-scheme para <select> nativos */
  const headerControlClass =
    'w-full bg-background/50 text-foreground border border-border hover:border-accent/40 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none cursor-pointer shadow-sm';
  const headerInputClass =
    'w-full bg-background/50 text-foreground border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-lg px-3 py-1.5 text-xs font-black outline-none transition-all shadow-sm';
  const headerLabelClass =
    'text-[8px] text-foreground/30 font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1';
  const optionClass = 'bg-background text-foreground font-bold py-1';

  return (
    <div className="flex w-full max-w-full min-w-0 min-h-0 flex-1 flex-col bg-background font-sans text-foreground selection:bg-accent/20 selection:text-accent-foreground overflow-hidden h-[calc(100dvh-9.5rem)] max-h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-10rem)] sm:max-h-[calc(100dvh-10rem)]">
      {/* 1. Header POS Industrial - High Density Grid */}
      <header className="bg-card border-b border-border shadow-md px-3 sm:px-4 py-2 relative z-30 shrink-0 min-w-0">
        <div className="w-full max-w-full mx-auto min-w-0 flex flex-col gap-2">
          {/* Top Row: Brand & Status */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 pb-2 border-b border-border/40 min-w-0">
            <div className="flex items-center gap-3 sm:gap-4 group shrink-0 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20 transition-all rotate-3 group-hover:rotate-0 shrink-0">
                <Construction className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-black tracking-tighter leading-none truncate">BRADLEY POS</span>
                <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-accent mt-0.5 opacity-80 italic truncate">Gestión de Punto de Venta Ferretero</span>
              </div>
            </div>

            <div className="flex justify-center lg:flex-1 lg:min-w-0 px-2 sm:px-4 py-1.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-full border border-border/50 max-w-full">
              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap min-w-0">
                <div className="flex flex-col items-center min-w-0">
                  <span className="text-[7px] font-black opacity-30 tracking-widest leading-none mb-1 text-center">OPERADOR ACTIVO</span>
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full justify-center">
                    <User className="w-3 h-3 text-accent shrink-0" />
                    <span className="text-[10px] font-black uppercase text-foreground/80 truncate max-w-[10rem] sm:max-w-[14rem]">{loggedUserName || 'CARGANDO...'}</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-border/40 shrink-0 hidden sm:block" />
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[7px] font-black opacity-30 tracking-widest leading-none mb-1 text-center">ESTADO TERMINAL</span>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                    <span className="text-[9px] font-black tracking-widest uppercase whitespace-nowrap">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 shrink-0">
               <div className="flex flex-col text-right">
                  <span className="text-[7px] font-black opacity-30 uppercase tracking-widest leading-none mb-1">Código Op</span>
                  <span className="text-lg font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    #{String(code).padStart(4, '0')}
                  </span>
               </div>
            </div>
          </div>

          {/* Bottom Row: encaja al ancho (sin w-screen); apilado en móvil, 2 cols en md, 4 en xl */}
          <div className="grid grid-cols-12 gap-3 items-stretch w-full max-w-full min-w-0">
            {/* Fiscal Config */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3 flex flex-wrap gap-2 min-w-0">
              <div className="flex-1 min-w-[8rem]">
                <label className={headerLabelClass}>TIPO DOCUMENTO</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className={`${headerControlClass} max-w-full`}>
                  <option value="03" className={optionClass}>BOLETA DE VENTA</option>
                  <option value="01" className={optionClass}>FACTURA ELECTRÓNICA</option>
                  <option value="00" className={optionClass}>RECIBO / TICKET POS</option>
                </select>
              </div>
              <div className="w-20">
                <label className={headerLabelClass}>SERIE</label>
                <input value={serial} onChange={(e) => setSerial(e.target.value.toUpperCase())} className={headerInputClass} maxLength={4} />
              </div>
              <div className="w-24">
                <label className={headerLabelClass}>CORRELA.</label>
                <input type="number" value={correlative} onChange={(e) => setCorrelative(parseInt(e.target.value) || 0)} className={headerInputClass} />
              </div>
            </div>

            {/* Client Context Header */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3 min-w-0 md:border-l md:border-border/40 md:pl-3 xl:border-l xl:pl-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
              <label className={headerLabelClass}>CLIENTE SELECCIONADO (F2)</label>
              <div className="flex gap-2 min-w-0">
                 <button type="button" onClick={() => setIsClientModalOpen(true)} className="flex-1 min-w-0 h-9 bg-background/50 border border-border px-3 rounded-lg flex items-center justify-between group hover:border-accent transition-all overflow-hidden text-left shadow-sm max-w-full">
                   <div className="flex items-center gap-2 truncate">
                     <span className="text-[11px] font-black uppercase text-accent truncate">{client.name}</span>
                   </div>
                   <div className="text-[9px] font-black opacity-30 group-hover:text-accent transition-colors shrink-0">{client.documentNumber}</div>
                 </button>
              </div>
            </div>

            {/* Sale Config Header */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3 min-w-0 md:border-l md:border-border/40 md:pl-3 xl:border-l xl:pl-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
              <label className={headerLabelClass}>TIPO DE OPERACIÓN</label>
              <select value={operationType} onChange={(e) => setOperationType(e.target.value)} className={`${headerControlClass} max-w-full`}>
                {OPERATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className={optionClass}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status Header */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3 min-w-0 md:border-l md:border-border/40 md:pl-3 xl:border-l xl:pl-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
              <label className={headerLabelClass}>ESTADO DE VENTA</label>
              <select value={saleStatus} onChange={(e) => setSaleStatus(e.target.value)} className={`${headerControlClass} max-w-full`}>
                {SALE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className={optionClass}>{opt.label.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Actions Bar - Master POS Controls restored */}
      <nav className="bg-card/40 backdrop-blur-md px-2 sm:px-4 py-2 border-b border-border/50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0 min-w-0 max-w-full">
        <div className="flex flex-wrap gap-2 min-w-0">
          <button 
            type="button" 
            onClick={() => setIsProductModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white px-4 sm:px-8 py-2.5 rounded-xl font-black shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <PackageSearch className="w-5 h-5 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="text-xs sm:text-sm uppercase tracking-wide whitespace-nowrap">Buscar (F4)</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsClientModalOpen(true)}
            className="bg-background hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-border px-3 sm:px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-xs opacity-80 hover:opacity-100 shrink-0"
          >
            <User className="w-4 h-4 text-accent shrink-0" />
            <span className="whitespace-nowrap truncate max-w-[10rem] sm:max-w-none">Cliente (F2)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <button 
            type="button" 
            onClick={openCustomerDisplay}
            title="Sincronizar Ventana de Cliente"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-4 sm:px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 text-xs group shrink-0"
          >
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform shrink-0" />
            <span className="tracking-tight uppercase hidden min-[380px]:inline">Display cliente</span>
            <span className="tracking-tight uppercase min-[380px]:hidden">Display</span>
          </button>
          
          <div className="h-6 w-px bg-border/50 mx-1" />
          
          <button 
            type="button" 
            onClick={clearDisplay}
            title="Limpiar Pantalla Secundaria"
            className="bg-background text-foreground/45 hover:text-red-500 border border-border px-3 py-2.5 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 3. Main Sales Area - Fullscreen Grid Logic */}
      <main className="flex-1 overflow-hidden p-2 sm:p-3 pt-0 flex flex-col min-w-0 max-w-full">
        {/* Table Container - Takes available space */}
        <div className="flex-1 bg-card rounded-xl border border-border shadow-xl overflow-hidden flex flex-col mb-2 min-w-0 max-w-full">
          <div className="flex-1 overflow-auto custom-scrollbar min-w-0">
            <table className="w-full min-w-0 max-w-full table-fixed text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 backdrop-blur-md bg-background/90 supports-[backdrop-filter]:bg-background/75 border-b border-border">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-center border-b border-border w-10">#</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-center border-b border-border w-24">SKU</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 border-b border-border">Descripción Material</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-center border-b border-border w-24">Cant.</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-right border-b border-border w-32">P. Unit.</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-right border-b border-border w-32">Subtotal</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-center border-b border-border w-16">Monitor</th>
                  <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/65 text-center border-b border-border w-16">Elim.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {cart.map((item, index) => (
                  <tr key={`${item.id}-${item.tariffId}`} className="group hover:bg-accent/5 transition-colors">
                    <td className="px-3 py-1.5 text-xs opacity-40 font-mono text-center">{String(index + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-border/50">{item.code}</span>
                    </td>
                    <td className="px-3 py-1.5 min-w-0 max-w-[1px]">
                      <div className="text-[13px] font-black tracking-tight leading-tight truncate" title={item.name}>{item.name}</div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="inline-flex items-center bg-background/50 rounded-lg border border-border p-0.5">
                        <button onClick={() => { const nc = [...cart]; if(nc[index].quantity > 0) nc[index].quantity -= 1; setCart(nc); }} className="w-5 h-5 flex items-center justify-center hover:bg-accent hover:text-white rounded text-xs transition-colors">-</button>
                        <input type="number" step="0.01" value={item.quantity} onChange={(e) => { const nc = [...cart]; nc[index].quantity = parseFloat(e.target.value) || 0; setCart(nc); }} className="w-10 bg-transparent text-center font-black text-xs outline-none" />
                        <button onClick={() => { const nc = [...cart]; nc[index].quantity += 1; setCart(nc); }} className="w-5 h-5 flex items-center justify-center hover:bg-accent hover:text-white rounded text-xs transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] opacity-30">S/</span>
                        <input type="number" step="0.01" value={item.price} onChange={(e) => { const nc = [...cart]; nc[index].price = parseFloat(e.target.value) || 0; setCart(nc); }} className="w-16 bg-background border border-border rounded px-1.5 py-0.5 text-right font-black text-xs outline-none transition-all focus:ring-1 focus:ring-accent" />
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => sendToDisplay(item)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${displayedProductId === item.id ? 'bg-emerald-500 text-white shadow-emerald-500/30 rotate-12 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-foreground/40 hover:bg-orange-500 hover:text-white'}`} title="Enviar a Display">
                        <Monitor className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => setCart(cart.filter((_, i) => i !== index))} className="w-7 h-7 text-foreground/20 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <div className="flex flex-col items-center opacity-15">
                        <PackageSearch className="w-14 h-14 mb-3" />
                        <span className="text-lg font-black uppercase tracking-widest">Esperando Materiales (F4)</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Footer Liquidación - Static and prominent */}
        <footer className="bg-card border-t border-accent/30 px-3 sm:px-6 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.35)] relative z-50 shrink-0 min-w-0 max-w-full">
          <div className="w-full max-w-full mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between min-w-0">
            <div className="flex flex-wrap gap-6 sm:gap-10 items-center min-w-0">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase opacity-30 tracking-widest leading-none mb-1">Items Lista</span>
                <span className="text-xl font-black leading-none">{cart.length}</span>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase opacity-30 tracking-widest leading-none mb-1 text-accent">Sincronización POS</span>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Clock3 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-black">{mounted ? `${formattedDate} ${formattedTime}` : '...'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 min-w-0 w-full lg:w-auto">
              <div className="text-right sm:text-right min-w-0 flex-1">
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] block mb-0.5">Total liquidar (IGV incl.)</span>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-foreground font-mono leading-none break-all sm:break-normal">
                  <span className="text-base sm:text-lg opacity-20 mr-1 font-bold">S/</span>
                  {calculateTotal().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={handleSaveSale} 
                disabled={saveLoading || cart.length === 0}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-lg sm:text-xl font-black shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shrink-0 w-full sm:w-auto"
              >
                {saveLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>GUARDAR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* Product Search Modal */}
      {/* Modals - Industrial Re-design */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)}
        title="Buscador Maestro de Materiales"
        width="max-w-5xl"
      >
        <div className="flex flex-col gap-6 p-2" style={{ colorScheme: formColorScheme }}>
            <div className="relative group">
              <Search className="w-6 h-6 text-accent absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:scale-110 transition-transform pointer-events-none z-10" />
              <input 
                  ref={productSearchInputRef}
                  type="text" 
                  placeholder="Escanee código de barras o escriba nombre del material (ej: Cemento, Tubo PVC)..."
                  className="w-full pl-16 pr-6 py-5 bg-background text-foreground border-2 border-border rounded-2xl focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/20 outline-none text-xl font-bold shadow-sm transition-all placeholder:text-foreground/45 dark:placeholder:text-foreground/35"
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

            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {productsLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                        <div className="text-foreground/50 font-bold uppercase tracking-widest text-xs">Consultando inventario…</div>
                    </div>
                ) : filteredProducts?.length > 0 ? (
                    filteredProducts.map((p: any, idx: number) => (
                        <button 
                            key={p.id} 
                            type="button"
                            data-product-highlight={idx}
                            onClick={() => addToCart(p)}
                            className={`flex items-center gap-6 p-4 rounded-2xl border-2 transition-all text-left group relative overflow-hidden active:scale-[0.98] ${
                              idx === productHighlightIndex
                                ? 'border-accent bg-orange-50 dark:bg-orange-950/45 ring-2 ring-accent/40 shadow-md'
                                : 'border-border hover:border-accent bg-card hover:bg-orange-50/70 dark:hover:bg-orange-950/30'
                            }`}
                        >
                            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden flex items-center justify-center p-2 border-2 border-border bg-background dark:bg-zinc-900/90 ring-1 ring-border/60 group-hover:border-accent/50 dark:group-hover:border-accent/40 transition-colors">
                               {p.imageUrl ? (
                                   <img src={`${getApiBaseUrl()}${p.imageUrl}`} alt="" className="w-full h-full object-contain bg-white/80 dark:bg-zinc-950/50 group-hover:scale-110 transition-transform duration-500" />
                               ) : (
                                   <PackageSearch className="w-10 h-10 text-foreground/35 dark:text-foreground/45" />
                               )}
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-xl font-black text-foreground group-hover:text-accent tracking-tight leading-tight">{p.name}</div>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="bg-slate-800 dark:bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-widest">{p.code || 'SKU-NONE'}</span>
                                  <span className="text-xs text-foreground/50 font-bold flex items-center gap-1 uppercase">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    Disponible en Almacén
                                  </span>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end pr-4">
                                <div className="text-[10px] text-foreground/50 font-black uppercase tracking-widest mb-1">Precio con IGV</div>
                                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                  <span className="text-lg mr-1 opacity-50 font-bold">S/</span>
                                  {p.tariffs?.[0]?.priceWithIgv?.toFixed(2) || '0.00'}
                                </div>
                                <div className={`text-xs mt-1 font-black px-2 py-0.5 rounded ${p.productStores?.[0]?.stock > 5 ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/50' : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 border border-red-200/80 dark:border-red-800/50'}`}>
                                  STOCK: {p.productStores?.[0]?.stock || 0} UNI
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 opacity-40 gap-4 text-foreground">
                        <AlertCircle className="w-16 h-16" />
                        <div className="text-xl font-black uppercase tracking-[0.2em]">Material no encontrado</div>
                    </div>
                )}
            </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)}
        title="Base de Datos de Clientes"
        width="max-w-3xl"
      >
        <div className="flex flex-col gap-6 p-2" style={{ colorScheme: formColorScheme }}>
          <div className="relative group">
            <User className="w-6 h-6 text-foreground/45 dark:text-foreground/50 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors pointer-events-none z-10" />
            <input
              ref={clientSearchInputRef}
              type="text"
              placeholder="Buscar por RUC, DNI o nombres..."
              className="w-full pl-16 pr-6 py-4 bg-background text-foreground border-2 border-border rounded-2xl outline-none font-bold focus:border-accent focus:ring-4 focus:ring-accent/15 focus:bg-card placeholder:text-foreground/40 dark:placeholder:text-foreground/35 shadow-sm transition-all"
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

          <div className="rounded-3xl border border-border overflow-hidden shadow-inner bg-card">
            <div className="grid grid-cols-12 bg-border/25 dark:bg-background/80 border-b border-border p-4 text-[10px] uppercase font-black tracking-widest text-foreground/80 dark:text-foreground/85">
              <div className="col-span-3">Documento</div>
              <div className="col-span-9">Nombres / Razón Social</div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {clientsLoading ? (
                <div className="p-10 text-center animate-pulse text-foreground/45 font-bold">Accediendo a registros…</div>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    data-client-highlight={idx}
                    onClick={() => selectClient(c)}
                    className={`w-full grid grid-cols-12 items-center p-4 text-left transition-all active:scale-[0.99] group ${
                      idx === clientHighlightIndex
                        ? 'bg-card shadow-md ring-2 ring-inset ring-accent/50'
                        : 'hover:bg-card hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50'
                    }`}
                  >
                    <div className="col-span-3 flex flex-col">
                      <span className="text-[10px] font-black text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/70 border border-orange-200/80 dark:border-orange-800/50 w-fit px-1.5 rounded mb-1">
                        {DOCUMENT_TYPE_LABELS[c.documentType] || c.documentType}
                      </span>
                      <span className="font-mono font-bold text-foreground/70">{c.documentNumber || '-'}</span>
                    </div>
                    <div className="col-span-8">
                      <div className="text-foreground font-black tracking-tight group-hover:text-accent transition-colors">{c.names}</div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-12 text-center text-foreground/40 font-bold italic">No se encontraron registros de clientes</div>
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
