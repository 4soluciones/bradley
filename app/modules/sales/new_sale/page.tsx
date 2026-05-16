'use client';

import { useState, useEffect, useLayoutEffect, useRef, useMemo, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { useQuery, useMutation } from '@apollo/client/react';
import { PRODUCTS_QUERY, WAREHOUSES_QUERY } from '../../products/graphql';
import { ProductsData } from '../../products/types';
import { getApiBaseUrl } from '@/app/lib/config';
import Modal from '@/app/components/Modal';
import { useToast } from '@/app/components/ToastContext';
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
  Hash,
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

const USER_SUBSIDIARY_ID_QUERY = gql`
  query UserSubsidiaryId($userId: Int!) {
    userSubsidiaryId(userId: $userId)
  }
`;

const SERIAL_ASSIGNED_FOR_SALE_QUERY = gql`
  query SerialAssignedForSale($subsidiaryId: Int!, $documentType: String!) {
    serialAssignedForSale(subsidiaryId: $subsidiaryId, documentType: $documentType) {
      id
      serial
      documentType
    }
  }
`;

const SALE_NEXT_CORRELATIVE_QUERY = gql`
  query SaleNextCorrelative($subsidiaryId: Int!, $documentType: String!, $serial: String!) {
    saleNextCorrelative(subsidiaryId: $subsidiaryId, documentType: $documentType, serial: $serial)
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

/** Stock total en almacenes (GraphQL devuelve un array `productStores`). */
function totalProductStoreStock(product: { productStores?: { stock?: unknown }[] | null }): number {
  const rows = product.productStores;
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  return rows.reduce((acc, row) => {
    const raw = row?.stock;
    if (raw == null || raw === '') return acc;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

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

interface UserSubsidiaryIdData {
  userSubsidiaryId: number | null;
}

interface SerialAssignedForSaleRow {
  id: number;
  serial: string | null;
  documentType: string;
}

interface SerialAssignedForSaleData {
  serialAssignedForSale: SerialAssignedForSaleRow[];
}

interface SaleNextCorrelativeData {
  saleNextCorrelative: number;
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
  const { warning: toastWarning } = useToast();
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
  const productModalQtyRef = useRef<HTMLInputElement>(null);
  const clientSearchInputRef = useRef<HTMLInputElement>(null);
  const customerDisplayWindowRef = useRef<Window | null>(null);
  const pendingDisplayProductRef = useRef<CartItem | null>(null);
  const [productHighlightIndex, setProductHighlightIndex] = useState(0);
  const [productModalQtyInput, setProductModalQtyInput] = useState('1');
  const [clientHighlightIndex, setClientHighlightIndex] = useState(0);
  /** Edición P.U. en carrito: borrador en foco para no forzar toFixed mientras se escribe. */
  const [puEditingKey, setPuEditingKey] = useState<string | null>(null);
  const [puDraft, setPuDraft] = useState('');

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
  const [serial, setSerial] = useState('');
  const [correlative, setCorrelative] = useState(1);
  const [code, setCode] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('bradley_pos_code');
      const n = savedCode ? parseInt(savedCode, 10) : 1;
      if (Number.isFinite(n) && n >= 1) {
        setCode(n);
      }
    }
  }, []);

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

  const { data: userSubData, loading: userSubLoading } = useQuery<UserSubsidiaryIdData>(
    USER_SUBSIDIARY_ID_QUERY,
    {
      variables: { userId: loggedUserId! },
      skip: loggedUserId == null,
      fetchPolicy: 'cache-first',
    }
  );

  const userSubsidiaryId = userSubData?.userSubsidiaryId ?? null;

  const { data: serialsData, loading: serialsLoading, refetch: refetchSerials } =
    useQuery<SerialAssignedForSaleData>(SERIAL_ASSIGNED_FOR_SALE_QUERY, {
      variables: {
        subsidiaryId: userSubsidiaryId ?? 0,
        documentType,
      },
      skip: userSubsidiaryId == null,
      fetchPolicy: 'network-only',
    });

  const seriesOptions = useMemo(
    () =>
      (serialsData?.serialAssignedForSale ?? [])
        .map((r) => (r.serial ?? '').trim())
        .filter((s): s is string => Boolean(s)),
    [serialsData]
  );

  const { data: corrData, loading: corrLoading, refetch: refetchNextCorrelative } =
    useQuery<SaleNextCorrelativeData>(SALE_NEXT_CORRELATIVE_QUERY, {
      variables: {
        subsidiaryId: userSubsidiaryId ?? 0,
        documentType,
        serial: serial.trim(),
      },
      skip: userSubsidiaryId == null || !serial.trim(),
      fetchPolicy: 'network-only',
    });

  useLayoutEffect(() => {
    if (userSubsidiaryId == null) {
      if (!userSubLoading) {
        setSerial('');
        setCorrelative(1);
      }
      return;
    }
    if (serialsLoading) return;
    if (!seriesOptions.length) {
      setSerial('');
      setCorrelative(1);
      return;
    }
    setSerial((prev) => {
      const p = prev.trim();
      if (p && seriesOptions.includes(p)) return p;
      return seriesOptions[0];
    });
  }, [userSubsidiaryId, documentType, seriesOptions, serialsLoading, userSubLoading]);

  useEffect(() => {
    if (userSubsidiaryId == null || !serial.trim()) return;
    if (corrLoading) return;
    const n = corrData?.saleNextCorrelative;
    if (typeof n === 'number' && Number.isFinite(n)) {
      setCorrelative(n);
    }
  }, [userSubsidiaryId, serial, documentType, corrData, corrLoading]);

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
                quantity: pending.quantity,
                total: (pending.price * pending.quantity).toFixed(2),
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
      setProductModalQtyInput('1');
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

  const addToCart = (product: any, qtyOverride?: number) => {
    const tariff = product.tariffs?.find((t: any) => t.typePrice === 3 || t.typePrice === '3') || product.tariffs?.[0]; // Default to selling price or first tariff
    if (!tariff) return;

    const tariffId = parseInt(tariff.id, 10);
    const stockNum = totalProductStoreStock(product);
    const stockFloor = Math.max(0, Math.floor(stockNum + 1e-9));

    const requestedQty = (() => {
      if (qtyOverride !== undefined && qtyOverride !== null) {
        return Math.max(1, Math.floor(Number(qtyOverride)) || 1);
      }
      const trimmed = productModalQtyInput.trim();
      if (trimmed === '') {
        toastWarning('Indique la cantidad a agregar.', 3800);
        return null;
      }
      const n = parseInt(trimmed, 10);
      if (!Number.isFinite(n) || n < 1) {
        toastWarning('Cantidad no válida. Ingrese un número entero mayor a cero.', 3800);
        return null;
      }
      return n;
    })();
    if (requestedQty === null) return;

    const sameLine = cart.find((item) => item.id === product.id && item.tariffId === tariffId);
    const inCartQty = sameLine?.quantity ?? 0;

    const allowedMore = Math.max(0, stockFloor - inCartQty);
    if (requestedQty > allowedMore) {
      if (allowedMore >= 1) {
        toastWarning(
          `Stock insuficiente: pediste ${requestedQty} u. y solo hay ${allowedMore} disponible(s) (total en almacén: ${stockFloor}). Reduzca la cantidad para agregar.`,
          4200
        );
      } else {
        toastWarning(
          'No hay stock suficiente: no quedan unidades disponibles de este producto.',
          3800
        );
      }
      return;
    }

    const addQty = requestedQty;

    if (addQty < 1) return;

    const lineHolder: { current: CartItem | null } = { current: null };

    flushSync(() => {
      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === product.id && item.tariffId === tariffId);
        if (existingIndex >= 0) {
          const nextQty = prev[existingIndex].quantity + addQty;
          lineHolder.current = { ...prev[existingIndex], quantity: nextQty };
          return prev.map((item, index) =>
            index === existingIndex ? { ...item, quantity: nextQty } : item
          );
        }
        const newItem: CartItem = {
          id: product.id,
          code: product.code || 'N/A',
          name: product.name,
          quantity: addQty,
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
    setProductModalQtyInput('1');

    const lineForDisplay = lineHolder.current;
    if (lineForDisplay) {
      syncPickerProductToCustomerDisplay(lineForDisplay);
    }
  };

  const confirmAddHighlightedProduct = () => {
    if (productsLoading || filteredProducts.length === 0) return;
    const p = filteredProducts[productHighlightIndex];
    if (!p) return;
    if (totalProductStoreStock(p) <= 0) return;
    addToCart(p);
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
            quantity: item.quantity,
            total: (item.price * item.quantity).toFixed(2),
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
    if (
      userSubsidiaryId != null &&
      saleSubsidiaryId != null &&
      userSubsidiaryId !== saleSubsidiaryId
    ) {
      setSaveError(
        'La sede de los productos no coincide con la sucursal asignada a su usuario.'
      );
      return;
    }
    if (userSubsidiaryId != null) {
      if (!seriesOptions.length) {
        setSaveError(
          'No hay series para su sucursal y este tipo de documento. Configúrelas en Config → Series de comprobantes.'
        );
        return;
      }
      if (!serial.trim() || !seriesOptions.includes(serial.trim())) {
        setSaveError('Seleccione una serie de comprobante.');
        return;
      }
    } else if (!serial?.trim()) {
      setSaveError('Indique la serie del comprobante.');
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
        const capturedUserSub = userSubsidiaryId;
        const capturedDoc = documentType;
        const capturedSerial = serial;
        incrementCode();
        setCart([]);
        if (capturedUserSub != null && capturedSerial.trim()) {
          try {
            await refetchNextCorrelative({
              subsidiaryId: capturedUserSub,
              documentType: capturedDoc,
              serial: capturedSerial.trim(),
            });
            void refetchSerials();
          } catch {
            /* el siguiente correlativo se recalcula al volver a cargar series */
          }
        }
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
    clearDisplay();
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

  return (
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
        <div className="px-5 py-2.5 flex items-center justify-between gap-4 text-[15px] font-bold uppercase whitespace-nowrap bg-card">
          <div className="flex items-center gap-4">
            {/* COLETA */}
            <div className="flex items-center gap-2 bg-muted text-foreground/60 px-3 py-1.5 rounded-md border border-border/50 text-lg leading-none">
              <span className="opacity-40 text-base font-black">#</span>
              <span className="font-black tabular-nums tracking-tight">{String(code).padStart(4, '0')}</span>
            </div>
            
            <div className="h-5 w-px bg-border/60" />
            
            {/* TIPO DOCUMENTO */}
            <div className="flex items-center gap-2 group">
              <span className="text-foreground/30 font-black text-[15px]">DOCUMENTO:</span>
              <select 
                value={documentType} 
                onChange={(e) => setDocumentType(e.target.value)} 
                className="bg-background border border-border rounded-md px-2.5 py-1.5 text-[15px] font-black focus:border-accent outline-none appearance-none cursor-pointer hover:border-accent/40 transition-colors min-h-[2.125rem]"
              >
                <option value="03">BOLETA ELECTRÓNICA</option>
                <option value="01">FACTURA ELECTRÓNICA</option>
                <option value="00">NOTA DE VENTA</option>
              </select>
            </div>

            <div className="h-5 w-px bg-border/60" />

            {/* SERIE Y CORRELATIVO */}
            <div className="flex items-center gap-2">
              <span className="text-foreground/30 font-black text-[15px]">SERIE:</span>
              <div className="flex items-center gap-1">
                {userSubsidiaryId != null && seriesOptions.length > 0 ? (
                  <select
                    key={`ser-${userSubsidiaryId}-${documentType}`}
                    value={serial}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    className="min-w-[4.5rem] max-w-[8rem] bg-background border border-border rounded-md px-2.5 py-1.5 text-center text-[15px] font-black text-indigo-600 focus:border-indigo-400 outline-none transition-all cursor-pointer min-h-[2.125rem]"
                    title="Serie asignada en Config (por sucursal y tipo de documento)"
                  >
                    {seriesOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={serial}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    placeholder={userSubLoading ? '…' : 'SERIE'}
                    disabled={userSubLoading}
                    className="w-16 sm:w-[4.75rem] bg-background border border-border rounded-md px-2.5 py-1.5 text-center text-[15px] font-black text-indigo-600 focus:border-indigo-400 outline-none transition-all min-h-[2.125rem]"
                    maxLength={6}
                  />
                )}
                <span className="opacity-20 text-[15px]">-</span>
                {userSubsidiaryId != null && serial.trim() && seriesOptions.includes(serial.trim()) ? (
                  <span
                    className="min-w-[5.75rem] rounded-md border border-border bg-background px-2.5 py-1.5 text-center font-mono text-[15px] font-black tabular-nums tracking-tight text-indigo-600 leading-none"
                    title="Correlativo (se guarda como número entero)"
                  >
                    {String(correlative).padStart(6, '0')}
                  </span>
                ) : (
                  <input
                    type="number"
                    value={correlative}
                    onChange={(e) => setCorrelative(parseInt(e.target.value, 10) || 0)}
                    className="w-[5.5rem] bg-background border border-border rounded-md px-2.5 py-1.5 text-center text-[15px] font-black text-indigo-600 focus:border-indigo-400 outline-none transition-all min-h-[2.125rem]"
                  />
                )}
              </div>
            </div>

            <div className="h-5 w-px bg-border/60" />

            {/* TIPO OPERACIÓN */}
            <div className="hidden xl:flex items-center gap-2">
              <span className="text-foreground/30 font-black text-[15px]">OPERACIÓN:</span>
              <span className="font-black text-foreground/70 text-[15px] max-w-[14rem] truncate">
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
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-44 min-w-[11rem] text-right">P.U. (INC IGV)</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-36 text-right">Total</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-b border-border w-28 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {cart.length > 0 ? (
                  cart.map((item, index) => (
                    <tr key={`${item.id}-${item.tariffId}`} className="group hover:bg-accent/5 transition-colors">
                      <td className="px-5 py-1.5 font-mono text-[11px]">
                        <span className="bg-muted px-2 py-1 rounded text-foreground/60 border border-border/40 font-black">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-5 py-1.5">
                        <div className="text-[13px] font-black tracking-tight leading-none" title={item.name}>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-5 py-1.5">
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
                      <td className="px-5 py-1.5 text-right w-44 min-w-[11rem]">
                        <div className="flex items-center justify-end gap-1.5 font-bold text-[13px]">
                          <span className="opacity-30 shrink-0">S/</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={
                              puEditingKey === `${item.id}-${item.tariffId}`
                                ? puDraft
                                : Number(item.price ?? 0).toFixed(4)
                            }
                            onFocus={() => {
                              const k = `${item.id}-${item.tariffId}`;
                              setPuEditingKey(k);
                              setPuDraft(String(item.price ?? 0));
                            }}
                            onBlur={() => {
                              const rowKey = `${item.id}-${item.tariffId}`;
                              if (puEditingKey !== rowKey) return;
                              const trimmed = puDraft.trim().replace(',', '.');
                              const raw = parseFloat(trimmed);
                              setCart((prev) => {
                                const nc = [...prev];
                                const row = nc[index];
                                if (!row || `${row.id}-${row.tariffId}` !== rowKey) return prev;
                                if (Number.isFinite(raw)) {
                                  row.price = Math.round(raw * 10000) / 10000;
                                }
                                return nc;
                              });
                              setPuEditingKey(null);
                            }}
                            onChange={(e) => {
                              const k = `${item.id}-${item.tariffId}`;
                              if (puEditingKey === k) setPuDraft(e.target.value);
                            }}
                            className="min-w-[8.75rem] w-32 max-w-[10rem] bg-background/50 border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-black text-[13px] tabular-nums tracking-tight focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-1.5 text-right">
                        <div className="text-[14px] font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                           S/ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-5 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => sendProductPayloadToDisplaySocket(item)}
                            title="Ver en segunda pantalla"
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${displayedProductId === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-muted text-foreground/30 hover:bg-indigo-600 hover:text-white'}`}
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCart(cart.filter((_, i) => i !== index));
                              clearDisplay();
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted text-foreground/30 hover:bg-red-500 hover:text-white transition-all active:scale-90"
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


      {/* Modal buscar producto — ferretería */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Buscar producto"
        width="max-w-3xl"
        titleClassName="text-base font-black tracking-tight text-white uppercase drop-shadow-sm"
        headerClassName="border-0 bg-gradient-to-r from-orange-600 via-orange-600 to-amber-700 px-5 py-3.5"
        bodyClassName="p-0"
      >
        <div className="flex flex-col" style={{ colorScheme: formColorScheme }}>
          <div className="border-b border-border/70 bg-gradient-to-b from-muted/50 to-background px-4 py-3 sm:px-5 sm:py-4 space-y-3">
            <p className="text-[11px] sm:text-xs font-medium text-foreground/55 leading-relaxed">
              <span className="font-black text-orange-700 dark:text-orange-400">Bradley</span> — busque
              por código o nombre. Use{' '}
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] font-bold">
                ↑↓
              </kbd>{' '}
              para resaltar,{' '}
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] font-bold">
                Tab
              </kbd>{' '}
              para la cantidad y{' '}
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] font-bold">
                Enter
              </kbd>{' '}
              para agregar a la venta.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative flex-1 min-w-0 group">
                <Search className="w-4 h-4 text-orange-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-90" />
                <input
                  ref={productSearchInputRef}
                  type="text"
                  placeholder="Código, nombre o referencia…"
                  className="w-full pl-10 pr-3 py-2.5 bg-background text-foreground border border-border rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-sm font-semibold shadow-sm placeholder:text-foreground/40 transition-shadow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !e.shiftKey) {
                      if (!productsLoading && filteredProducts.length > 0) {
                        e.preventDefault();
                        productModalQtyRef.current?.focus();
                        productModalQtyRef.current?.select();
                      }
                      return;
                    }
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
                      confirmAddHighlightedProduct();
                    }
                  }}
                />
              </div>

              <div className="flex items-end gap-2 shrink-0 sm:pb-px">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="product-modal-qty"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-foreground/45"
                  >
                    <Hash className="w-3 h-3 text-orange-600/80" />
                    Cantidad
                  </label>
                  <input
                    id="product-modal-qty"
                    ref={productModalQtyRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="1"
                    className="w-[5.5rem] rounded-xl border border-border bg-background py-2.5 text-center text-sm font-black text-foreground tabular-nums shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-shadow placeholder:text-foreground/25"
                    value={productModalQtyInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setProductModalQtyInput(digits);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmAddHighlightedProduct();
                        return;
                      }
                      if (e.key === 'Tab' && e.shiftKey) {
                        e.preventDefault();
                        productSearchInputRef.current?.focus();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 py-3 sm:px-4 sm:py-4">
            <div className="grid grid-cols-1 gap-2 max-h-[min(52vh,26rem)] overflow-y-auto pr-1 custom-scrollbar">
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20">
                  <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  <span className="text-xs font-bold text-foreground/50 uppercase tracking-wide">
                    Cargando catálogo…
                  </span>
                </div>
              ) : filteredProducts?.length > 0 ? (
                filteredProducts.map((p: any, idx: number) => {
                  const stock = totalProductStoreStock(p);
                  const isOutOfStock = stock <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      tabIndex={-1}
                      disabled={isOutOfStock}
                      data-product-highlight={idx}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`flex w-full items-stretch gap-3 rounded-2xl border p-3 text-left shadow-sm transition-all active:scale-[0.995] ${
                        isOutOfStock
                          ? 'border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20 opacity-65 cursor-not-allowed'
                          : idx === productHighlightIndex
                            ? 'border-orange-400 bg-orange-50/90 ring-2 ring-orange-500/35 dark:bg-orange-950/50 dark:border-orange-600'
                            : 'border-border/80 bg-card hover:border-orange-300/70 hover:bg-orange-50/30 dark:hover:bg-orange-950/20'
                      }`}
                    >
                      <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center border border-border/80 bg-background">
                        {p.imageUrl ? (
                          <img
                            src={`${getApiBaseUrl()}${p.imageUrl}`}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <PackageSearch className="w-6 h-6 text-foreground/30" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                        <span
                          className={`text-sm font-bold leading-snug line-clamp-2 ${
                            isOutOfStock
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-foreground'
                          }`}
                        >
                          {p.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-slate-700">
                            {p.code || '—'}
                          </span>
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            Stock {stock}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-center border-l border-border/50 pl-3 text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-foreground/40">
                          P. unit. IGV
                        </span>
                        <span
                          className={`font-mono text-lg font-black tabular-nums ${
                            isOutOfStock
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          S/ {(p.tariffs?.find((t: any) => t.typePrice === 3 || t.typePrice === '3') || p.tariffs?.[0])?.priceWithIgv?.toFixed(2) ?? '0.00'}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-14 text-foreground/45">
                  <Construction className="h-10 w-10 opacity-50" />
                  <span className="text-sm font-black uppercase tracking-wide">
                    Sin coincidencias
                  </span>
                  <span className="max-w-xs text-center text-xs font-medium text-foreground/40">
                    Pruebe otro término o verifique el código en su catálogo de ferretería.
                  </span>
                </div>
              )}
            </div>
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
