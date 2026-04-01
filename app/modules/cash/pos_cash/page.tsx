'use client';

import { useState, useEffect, useRef } from 'react';
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
  ShoppingBag,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  History
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
  mutation PayOperation($operationId: Int!, $cashId: Int!, $wayPay: Int!, $userId: Int!) {
    payOperation(operationId: $operationId, cashId: $cashId, wayPay: $wayPay, user_id: $userId) {
      success
      message
    }
  }
`;

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

// --- Components & Page ---

export default function PosCashPage() {
  const [searchCode, setSearchCode] = useState('');
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [selectedCash, setSelectedCash] = useState<number | null>(null);
  const [selectedWayPay, setSelectedWayPay] = useState<number>(1); // Default Efectivo
  const [userId, setUserId] = useState<number | null>(null);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: opsData, loading: loadingOps, refetch: refetchOps } = useQuery<OperationsData>(GET_PENDING_OPERATIONS, {
    variables: { status: '01' } // REGISTRADO
  });
  const { data: cashData } = useQuery<CashesData>(GET_CASHES);
  const { data: waysData } = useQuery<WayPaysData>(GET_WAYPAYS);
  const [payOperation] = useMutation<PayOperationResponse>(PAY_OPERATION_MUTATION);

  useEffect(() => {
    // Focus search on mount
    searchInputRef.current?.focus();
    
    // Get current user
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const uid = payload?.user_id ?? payload?.userId;
            if (uid) setUserId(Number(uid));
        } catch (e) { console.error(e); }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');
    
    if (!searchCode) return;

    const op = opsData?.operations.find((o) => 
      o.code?.toString() === searchCode || 
      `${o.serial}-${o.correlative}` === searchCode
    );

    if (op) {
      setSelectedOp(op);
    } else {
      setPayError('No se encontró ninguna operación pendiente con ese código.');
      setSelectedOp(null);
    }
  };

  const handlePayment = async () => {
    setPayError('');
    setPaySuccess('');
    
    if (!selectedOp || !selectedCash || !userId) {
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
          userId: userId
        }
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
    } catch (e: any) {
      setPayError(e.message || 'Error al procesar el pago');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header - Industrial Style */}
      <div className="bg-[#0f172a] text-white py-6 shadow-2xl relative overflow-hidden border-b-4 border-orange-600">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="w-full mx-auto px-3 sm:px-4 md:px-5 lg:px-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">CAJA DE COBROS</h1>
              <p className="text-[10px] text-orange-400 font-extrabold uppercase tracking-[0.2em]">Módulo de Atención Rápida - Ferretería</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase">Pendientes de Cobro</p>
                <p className="text-xl font-bold text-orange-500">{opsData?.operations?.length || 0} Tickets</p>
             </div>
             <button className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-all text-slate-400 hover:text-white border border-slate-700">
                <History className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column - Search and Selection */}
        <div className="lg:col-span-12">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Buscar Ticket (Código / Serie-Correlativo)</label>
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                            <input 
                                ref={searchInputRef}
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="Escanear ticket o ingresar código..."
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-800 focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="bg-[#0f172a] text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        BUSCAR
                    </button>
                </form>
            </div>
        </div>

        {/* Selected Operation Detail */}
        {selectedOp && (
          <div className="lg:col-span-8 min-w-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden h-full flex flex-col">
                <div className="bg-slate-900 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                            <Layers className="w-5 h-5 text-orange-500" />
                        </div>
                        <h2 className="text-white font-black tracking-tight uppercase">Detalle de la Operación</h2>
                    </div>
                    <span className="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest">
                        CÓDIGO: {selectedOp.code}
                    </span>
                </div>
                
                <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 flex flex-col flex-1 min-h-0">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 border-b border-slate-100 pb-6 sm:pb-8 shrink-0">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cliente</p>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-500" />
                                <p className="font-bold text-slate-800">{selectedOp.client?.names || 'VARIOS'}</p>
                            </div>
                            <p className="text-xs text-slate-400 font-mono ml-6">{selectedOp.client?.documentNumber || '-'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fecha y Comprobante</p>
                            <p className="font-bold text-slate-800">{selectedOp.serial}-{selectedOp.correlative}</p>
                            <p className="text-xs text-slate-400 flex items-center justify-end gap-1 font-bold">
                                <Calendar className="w-3 h-3" />
                                {selectedOp.operationDate}
                            </p>
                        </div>
                    </div>

                    {/* Items List — tabla compacta, descripción en una sola línea */}
                    <div className="flex flex-col min-h-0 flex-1 space-y-0">
                        <div
                            className="grid grid-cols-[minmax(0,1fr)_3rem_4.5rem_5.25rem] gap-x-2 sm:gap-x-3 md:grid-cols-[minmax(0,1fr)_3.25rem_5rem_6rem] md:gap-x-4 items-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-t-2xl text-[10px] text-slate-500 font-black uppercase tracking-widest shrink-0"
                            aria-hidden
                        >
                            <span className="min-w-0 pl-1">Producto</span>
                            <span className="text-right tabular-nums">Cant.</span>
                            <span className="text-right tabular-nums">P. unit</span>
                            <span className="text-right tabular-nums pr-1">Importe</span>
                        </div>
                        <div className="border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden bg-slate-50/40 flex-1 min-h-[12rem] max-h-[min(52vh,28rem)] flex flex-col">
                            <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent]">
                                {selectedOp.details.map((d: any) => (
                                    <div
                                        key={d.id}
                                        className="group grid grid-cols-[minmax(0,1fr)_3rem_4.5rem_5.25rem] gap-x-2 sm:gap-x-3 md:grid-cols-[minmax(0,1fr)_3.25rem_5rem_6rem] md:gap-x-4 items-center px-3 py-3 sm:py-3.5 border-b border-slate-100 last:border-b-0 bg-white hover:bg-orange-50/40 transition-colors"
                                    >
                                        <div className="min-w-0 flex items-center gap-2 sm:gap-2.5 pr-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.45)] shrink-0" aria-hidden />
                                            <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent] overscroll-x-contain">
                                                <p
                                                    className="whitespace-nowrap font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-tight leading-none py-0.5"
                                                    title={d.description}
                                                >
                                                    {d.description}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-right text-xs font-black text-slate-700 tabular-nums shrink-0">{d.quantity}</span>
                                        <span className="text-right text-[11px] sm:text-xs font-mono font-bold text-slate-600 tabular-nums shrink-0">S/ {d.unitPrice.toFixed(2)}</span>
                                        <span className="text-right text-xs sm:text-sm font-black text-indigo-700 font-mono tabular-nums shrink-0 pr-0.5">S/ {d.totalAmount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-orange-50 p-6 rounded-[2rem] border-2 border-orange-200 border-dashed flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-orange-600 font-black text-xs uppercase tracking-widest">Importe Total a Pagar</span>
                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Moneda: {selectedOp.currencyType === 'PEN' ? 'Soles' : 'Dólares'}</span>
                        </div>
                        <div className="text-4xl font-black text-[#0f172a] font-mono tracking-tighter">
                            S/ {selectedOp.totalAmount.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Right Column - Payment Form */}
        {selectedOp && (
          <div className="lg:col-span-4 min-w-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-8 sticky top-8">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                            <Building2 className="w-4 h-4 text-orange-500" />
                            Seleccionar Caja Destino
                        </label>
                        <div className="relative group">
                            <select 
                                value={selectedCash || ''}
                                onChange={(e) => setSelectedCash(parseInt(e.target.value))}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-black focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">--- Seleccionar Caja ---</option>
                                {cashData?.cashes.filter((c:any) => c.isEnabled).map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.currencyType})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-600 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                            <CircleDollarSign className="w-4 h-4 text-orange-500" />
                            Método de Pago
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {waysData?.wayPays.map((w: any) => (
                                <button 
                                    key={w.id}
                                    onClick={() => setSelectedWayPay(w.id)}
                                    className={`px-4 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                        selectedWayPay === w.id 
                                        ? 'bg-orange-50 border-orange-600 text-orange-900' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedWayPay === w.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tight leading-none text-left">{w.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 space-y-4">
                    {payError && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-pulse">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-xs font-bold">{payError}</p>
                        </div>
                    )}
                    {paySuccess && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-xs font-bold">{paySuccess}</p>
                        </div>
                    )}

                    <button 
                        onClick={handlePayment}
                        disabled={payLoading || !selectedCash}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:opacity-50 text-white py-6 rounded-3xl text-2xl font-black shadow-2xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 group"
                    >
                        {payLoading ? (
                             <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>COBRAR S/ {selectedOp.totalAmount.toFixed(2)}</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">Al confirmar, se registrará el ingreso en el flujo de caja.</p>
                </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedOp && !loadingOps && (
            <div className="lg:col-span-12 py-32 flex flex-col items-center justify-center text-slate-300 gap-6">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
                    <ShoppingBag className="w-16 h-16" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-400">Esperando Código de Ticket</h3>
                    <p className="text-slate-400 font-bold max-w-sm">Ingrese el código generado en el punto de venta para procesar el cobro rápidamente.</p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
