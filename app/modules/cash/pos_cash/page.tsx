'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Building2,
  Search,
  CreditCard,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Construction,
  User,
  Calendar,
  Layers,
  ArrowRight,
  History,
  Banknote,
  Landmark,
  Smartphone,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import Modal from '@/app/components/Modal';

// --- GraphQL ---

const GET_PENDING_OPERATIONS = gql`
  query GetPendingOperations($status: String) {
    operations(status: $status) {
      id
      documentType
      operationType
      operationStatus
      serial
      correlative
      code
      currencyType
      operationDate
      emitDate
      emitTime
      totalAmount
      client {
        id
        names
        documentNumber
      }
      user {
        id
        firstName
      }
      details {
        id
        description
        quantity
        unitPrice
        totalAmount
      }
    }
  }
`;

const GET_CLIENTS = gql`
  query GetClientsForCash {
    clients {
      id
      names
      documentNumber
    }
  }
`;

const GET_CASHES = gql`
  query GetCashes {
    cashes {
      id
      name
      isEnabled
      currencyType
    }
  }
`;

const GET_WAYPAYS = gql`
  query GetWayPays {
    wayPays {
      id
      label
    }
  }
`;

const PAY_OPERATION_MUTATION = gql`
  mutation PayOperation($operationId: Int!, $cashId: Int!, $wayPay: Int!, $userId: Int!, $clientId: Int, $totalPayed: Float, $totalTurned: Float) {
    payOperation(
      operationId: $operationId
      cashId: $cashId
      wayPay: $wayPay
      userId: $userId
      clientId: $clientId
      totalPayed: $totalPayed
      totalTurned: $totalTurned
    ) {
      success
      message
    }
  }
`;

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

function WayPayIcon({ id, className }: { id: number; className?: string }) {
  const c = className ?? 'w-4 h-4';
  switch (id) {
    case 1:
      return <Banknote className={c} />;
    case 3:
      return <CreditCard className={c} />;
    case 4:
      return <Landmark className={c} />;
    case 8:
      return <Smartphone className={c} />;
    case 9:
      return <Clock className={c} />;
    case 10:
      return <MoreHorizontal className={c} />;
    default:
      return <CircleDollarSign className={c} />;
  }
}

// --- Interfaces ---

interface Client {
  id: string;
  names: string;
  documentNumber: string;
}

interface OperationDetail {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface Operation {
  id: string;
  documentType: string;
  operationType: string;
  operationStatus: string;
  serial: string;
  correlative: number;
  code: number;
  currencyType: string;
  operationDate: string;
  emitDate: string;
  emitTime: string;
  totalAmount: number;
  client: Client;
  user: {
    id: string;
    firstName: string;
  };
  details: OperationDetail[];
}

interface OperationsData {
  operations: Operation[];
}

interface Cash {
  id: string;
  name: string;
  isEnabled: boolean;
  currencyType: string;
}

interface CashesData {
  cashes: Cash[];
}

interface WayPay {
  id: number;
  label: string;
}

interface WayPaysData {
  wayPays: WayPay[];
}

interface PayOperationResponse {
  payOperation: {
    success: boolean;
    message: string;
  };
}

// --- Page ---

export default function PosCashPage() {
  const { resolvedTheme } = useTheme();
  const formColorScheme: CSSProperties['colorScheme'] =
    resolvedTheme === 'dark' ? 'dark' : 'light';

  const [searchCode, setSearchCode] = useState('');
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [selectedCash, setSelectedCash] = useState<number | null>(null);
  const [selectedWayPay, setSelectedWayPay] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const [amountPaid, setAmountPaid] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<{ id: string; names: string; documentNumber: string } | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const clientSearchInputRef = useRef<HTMLInputElement>(null);

  const { data: opsData, loading: loadingOps, refetch: refetchOps } = useQuery<OperationsData>(GET_PENDING_OPERATIONS, {
    variables: { status: '01' },
  });
  const { data: cashData } = useQuery<CashesData>(GET_CASHES);
  const { data: waysData } = useQuery<WayPaysData>(GET_WAYPAYS);
  const { data: clientsData } = useQuery<{ clients: Client[] }>(GET_CLIENTS);
  const [payOperation] = useMutation<PayOperationResponse>(PAY_OPERATION_MUTATION);

  /** Etiquetas e IDs de método de pago vienen del backend (WAY_PAY_CHOICES → query wayPays). */
  useEffect(() => {
    const list = waysData?.wayPays;
    if (!list?.length) return;
    setSelectedWayPay((prev) => {
      if (prev != null && list.some((w) => w.id === prev)) return prev;
      const prefer = list.find((w) => w.id === 1);
      return prefer?.id ?? list[0]!.id;
    });
  }, [waysData?.wayPays]);

  useEffect(() => {
    if (opsData?.operations) {
      console.log('OPERACIONES PENDIENTES:', opsData.operations);
    }
  }, [opsData]);

  useEffect(() => {
    searchInputRef.current?.focus();

    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = decodeJwtPayload(token);
      const uid = payload?.user_id ?? payload?.userId;
      if (uid != null && uid !== '') setUserId(Number(uid));
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!searchCode) return;

    const op = opsData?.operations.find(
      (o) => o.code?.toString() === searchCode || `${o.serial}-${o.correlative}` === searchCode
    );

    if (op) {
      setSelectedOp(op);
      setSelectedClient(op.client);
      setAmountPaid('');
    } else {
      setPayError('No se encontró ninguna operación pendiente con ese código.');
      setSelectedOp(null);
      setSelectedClient(null);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(false);
    setClientSearchTerm('');
  };

  const calculateChange = () => {
    if (!selectedOp || !amountPaid) return 0;
    const paid = parseFloat(amountPaid);
    if (isNaN(paid)) return 0;
    return Math.max(0, paid - selectedOp.totalAmount);
  };

  const handlePayment = async () => {
    setPayError('');
    setPaySuccess('');

    if (!selectedOp || !selectedCash || !userId || selectedWayPay == null) {
      setPayError('Faltan datos para procesar el pago.');
      return;
    }

    setPayLoading(true);
    try {
      const { data } = await payOperation({
        variables: {
          operationId: parseInt(selectedOp.id),
          cashId: selectedCash,
          wayPay: selectedWayPay,
          userId: userId,
          clientId: selectedClient ? parseInt(selectedClient.id) : null,
          totalPayed: amountPaid ? parseFloat(amountPaid) : selectedOp.totalAmount,
          totalTurned: calculateChange(),
        },
      });

      if (data?.payOperation.success) {
        setPaySuccess('¡Pago registrado con éxito!');
        setSelectedOp(null);
        setSearchCode('');
        refetchOps();
        searchInputRef.current?.focus();
      } else {
        setPayError(data?.payOperation.message || 'Error al procesar el pago');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al procesar el pago';
      setPayError(msg);
    } finally {
      setPayLoading(false);
    }
  };

  const controlClass =
    'w-full bg-background/50 text-foreground border border-border rounded-md px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm';
  const cardClass = 'bg-card rounded-lg border border-border shadow-sm';
  /** Solo panel izquierdo: lista de productos. max-h suaviza móvil/tablet. */
  const leftLinesScrollClass =
    'h-[430px] max-h-[65dvh] shrink-0 overflow-y-auto overflow-x-hidden custom-scrollbar';

  return (
    <div
      className="flex w-full max-w-full min-w-0 flex-1 flex-col bg-background font-sans text-foreground selection:bg-accent/20 selection:text-accent-foreground min-h-0"
      style={{ colorScheme: formColorScheme }}
    >
      <header className="bg-card border-b border-border px-2 py-1 relative z-10 shrink-0 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white shrink-0">
              <Construction className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black tracking-tight uppercase truncate leading-none">Caja de cobros</span>
            <span className="text-[9px] font-bold text-accent tabular-nums hidden sm:inline">
              · {opsData?.operations?.length ?? 0} pend.
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-accent tabular-nums sm:hidden">{opsData?.operations?.length ?? 0}</span>
            <button
              type="button"
              className="p-1 rounded-md border border-border bg-background/50 text-foreground/65 hover:bg-accent/10 hover:text-foreground transition-colors"
              aria-label="Historial"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Buscador: una sola línea, baja altura */}
      <div className="shrink-0 px-2 py-1.5 border-b border-border/60 bg-background/80">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full min-w-0"
          style={{ colorScheme: formColorScheme }}
        >
          <label htmlFor="pos-cash-search" className="sr-only">
            Buscar ticket por código o serie-correlativo
          </label>
          <div className="relative flex-1 min-w-0 group">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 group-focus-within:text-accent pointer-events-none" />
            <input
              id="pos-cash-search"
              ref={searchInputRef}
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Código o serie-correlativo…"
              className="w-full h-8 pl-8 pr-2 py-0 bg-card text-foreground border border-border rounded-md text-xs font-semibold focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none placeholder:text-foreground/40"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 h-8 px-3 rounded-md bg-accent hover:bg-accent/90 text-white text-xs font-black uppercase tracking-wide shadow-sm transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-2 py-2 gap-2">
        {selectedOp ? (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-2 lg:gap-0 lg:divide-x lg:divide-border lg:items-stretch">
            {/* IZQUIERDA ~70% */}
            <div className="min-w-0 min-h-0 flex flex-col lg:h-full lg:min-h-0 lg:pr-2 animate-in fade-in duration-300">
              <div className={`${cardClass} flex flex-col min-h-0 flex-1 overflow-hidden lg:h-full`}>
                <div className="px-2 py-1.5 flex flex-wrap items-center justify-between gap-1.5 border-b border-border bg-background/40 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
                    <h2 className="text-foreground font-black uppercase text-[10px] tracking-tight truncate">Detalle</h2>
                  </div>
                  <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded border border-indigo-300/80 dark:border-indigo-700 bg-indigo-100/90 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 font-black tabular-nums shrink-0 leading-tight">
                    {selectedOp.serial}-{selectedOp.correlative} · Cód. {selectedOp.code}
                  </span>
                </div>

                <div className="p-2 flex flex-col gap-2 min-h-0 flex-1">
                  {/* Cliente + vendedor + fecha: una fila */}
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] leading-tight border-b border-border/80 pb-2 shrink-0">
                    <div className="flex min-w-0 flex-1 basis-full sm:basis-0 items-center gap-2">
                      <span className="font-black text-foreground/50 uppercase text-[9px] shrink-0">Cliente:</span>
                      <span
                        className="font-bold text-foreground truncate min-w-0 flex-1"
                        title={selectedClient?.names || 'VARIOS'}
                      >
                        {selectedClient?.names || 'VARIOS'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsClientModalOpen(true)}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-border bg-background font-black uppercase text-foreground/60 hover:bg-accent hover:text-white hover:border-accent shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                    <span className="hidden sm:inline text-foreground/35 shrink-0">|</span>
                    <span className="font-black text-foreground/50 uppercase text-[9px] shrink-0">Doc:</span>
                    <span
                      className="text-[10px] font-mono font-bold text-foreground/70 truncate max-w-[9rem] sm:max-w-[11rem]"
                      title={selectedClient?.documentNumber || '—'}
                    >
                      {selectedClient?.documentNumber || '—'}
                    </span>
                    <span className="hidden sm:inline text-foreground/35 shrink-0">|</span>
                    <span className="font-black text-foreground/50 uppercase text-[9px] shrink-0 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 opacity-70" />
                      Fecha:
                    </span>
                    <span className="font-bold text-foreground tabular-nums shrink-0">{selectedOp.operationDate}</span>
                    <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto">
                      <span className="font-black text-foreground/50 uppercase text-[9px]">Vendedor:</span>
                      <span className="font-bold text-foreground uppercase truncate max-w-[10rem] sm:max-w-[14rem]">
                        {selectedOp.user?.firstName || 'SISTEMA'}
                      </span>
                    </div>
                  </div>

                  {/* Tabla compacta: solo este bloque con scroll (altura moderada) */}
                  <div className="shrink-0 flex flex-col border border-border rounded-md overflow-hidden bg-background/20">
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_2.25rem_3.5rem_4rem] gap-x-1 items-center px-1.5 py-0.5 bg-background/80 border-b border-border text-[9px] text-foreground/55 font-black uppercase shrink-0"
                      aria-hidden
                    >
                      <span className="min-w-0 pl-0.5 truncate">Producto</span>
                      <span className="text-right">Cant</span>
                      <span className="text-right">P.u.</span>
                      <span className="text-right pr-0.5">Imp.</span>
                    </div>
                    <div
                      className={`${leftLinesScrollClass} bg-card`}
                      role="region"
                      aria-label="Líneas del ticket"
                    >
                      {selectedOp.details.map((d: OperationDetail) => (
                        <div
                          key={d.id}
                          className="grid grid-cols-[minmax(0,1fr)_2.25rem_3.5rem_4rem] gap-x-1 items-center px-1.5 py-0.5 border-b border-border/40 last:border-b-0 hover:bg-accent/[0.06]"
                        >
                          <p
                            className="min-w-0 truncate text-[10px] font-semibold text-foreground uppercase leading-tight"
                            title={d.description}
                          >
                            {d.description}
                          </p>
                          <span className="text-right text-[10px] font-bold text-foreground/85 tabular-nums">{d.quantity}</span>
                          <span className="text-right text-[9px] font-mono text-foreground/70 tabular-nums">{d.unitPrice.toFixed(2)}</span>
                          <span className="text-right text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums pr-0.5">
                            {d.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-accent/10 px-2 py-1.5 rounded-md border border-accent/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <span className="text-[9px] font-black text-accent uppercase tracking-wide">
                      Total {selectedOp.currencyType === 'PEN' ? 'S/' : 'US$'}
                    </span>
                    <span className="text-lg font-black text-foreground font-mono tabular-nums leading-none">
                      {selectedOp.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DERECHA ~30% — misma altura de tarjeta que izquierda (grid stretch + flex-1) */}
            <div className="min-w-0 min-h-0 flex flex-col lg:h-full lg:min-h-0 lg:pl-2 animate-in fade-in duration-300">
              <div
                className={`${cardClass} flex flex-col min-h-0 w-full lg:h-full lg:flex-1`}
                style={{ colorScheme: formColorScheme }}
              >
                <div className="min-h-[min(430px,65dvh)] lg:min-h-0 lg:flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 space-y-2 bg-card">
                  <div>
                    <label className="flex items-center gap-1 text-[9px] font-black text-foreground/45 uppercase mb-1">
                      <Building2 className="w-3 h-3 text-accent" />
                      Caja
                    </label>
                    <div className="relative group">
                      <select
                        value={selectedCash || ''}
                        onChange={(e) => setSelectedCash(parseInt(e.target.value, 10))}
                        className={`${controlClass} appearance-none cursor-pointer pr-8 py-1.5 text-xs`}
                      >
                        <option value="" className="bg-card text-foreground">
                          — Elegir —
                        </option>
                        {cashData?.cashes
                          .filter((c: Cash) => c.isEnabled)
                          .map((c: Cash) => (
                            <option key={c.id} value={c.id} className="bg-card text-foreground">
                              {c.name} ({c.currencyType})
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-[9px] font-black text-foreground/45 uppercase mb-1">
                      <CircleDollarSign className="w-3 h-3 text-accent" />
                      Pago
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {waysData?.wayPays.map((w: WayPay) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWayPay(w.id)}
                          className={`px-2 py-1.5 rounded-md border text-left transition-all flex items-center gap-1.5 min-h-0 ${
                            selectedWayPay === w.id
                              ? 'bg-accent/15 border-accent ring-1 ring-accent/30'
                              : 'bg-background/50 border-border text-foreground/60 hover:border-accent/40'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              selectedWayPay === w.id ? 'bg-accent text-white' : 'bg-card border border-border text-foreground/45'
                            }`}
                          >
                            <WayPayIcon id={w.id} className="w-3 h-3" />
                          </div>
                          <span className="text-[8px] font-black uppercase leading-tight line-clamp-2">{w.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monto + vuelto en una fila */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 border-t border-border">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-black text-foreground/55 uppercase shrink-0">Monto:</span>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-foreground/40">S/</span>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          placeholder="0.00"
                          className="h-7 w-[6.5rem] pl-6 pr-1.5 bg-card border border-border rounded-md text-xs font-black text-foreground focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-foreground/55 uppercase">Vuelto:</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        S/ {calculateChange().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cobrar fijo abajo del panel derecho */}
                <div className="shrink-0 sticky bottom-0 z-20 border-t border-border bg-card p-2 pt-1.5 shadow-[0_-6px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-6px_16px_-4px_rgba(0,0,0,0.35)] space-y-1.5">
                  {payError && (
                    <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-[10px] font-bold leading-tight">{payError}</p>
                    </div>
                  )}
                  {paySuccess && (
                    <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-[10px] font-bold leading-tight">{paySuccess}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={payLoading || !selectedCash || selectedWayPay == null}
                    className="w-full h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {payLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="tabular-nums">COBRAR S/ {selectedOp.totalAmount.toFixed(2)}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                  <p className="text-[8px] text-foreground/40 text-center font-bold uppercase tracking-tight leading-tight">
                    Registra ingreso en caja
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : loadingOps ? (
          <div className="flex-1 flex items-center justify-center py-16 text-foreground/40 text-xs font-bold uppercase tracking-wide">
            Cargando pendientes…
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-foreground/25 gap-3 py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-border bg-card">
              <Construction className="w-7 h-7 text-foreground/30" />
            </div>
            <div className="text-center max-w-sm px-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/40">Esperando ticket</h3>
              <p className="text-xs text-foreground/35 font-semibold mt-1">Busque por código arriba.</p>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Seleccionar cliente"
        width="max-w-2xl"
        titleClassName="text-sm font-black text-foreground tracking-tight uppercase"
        bodyClassName="p-3 sm:p-4"
      >
        <div className="flex flex-col gap-3" style={{ colorScheme: formColorScheme }}>
          <div className="relative group">
            <Search className="w-4 h-4 text-accent absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-80" />
            <input
              ref={clientSearchInputRef}
              type="text"
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              placeholder="Nombre o documento…"
              className="w-full pl-9 pr-3 py-2 bg-background text-foreground border border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none text-sm font-semibold shadow-sm placeholder:text-foreground/40"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {clientsData?.clients
              .filter(
                (c) =>
                  c.names.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                  c.documentNumber?.toLowerCase().includes(clientSearchTerm.toLowerCase())
              )
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleClientSelect(c)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-card rounded-lg flex items-center justify-center text-foreground/40 group-hover:text-accent border border-border shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-foreground text-sm uppercase truncate">{c.names}</p>
                      <p className="text-xs text-foreground/50 font-mono">{c.documentNumber || 'Sin documento'}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground/30 group-hover:text-accent shrink-0" />
                </button>
              ))}
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
