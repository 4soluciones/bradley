"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Calendar, 
  Wallet, 
  FileText, 
  CircleDollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  ArrowRight,
  ChevronDown,
  Construction,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Pencil,
  MoreVertical
} from "lucide-react";
import Modal from "@/app/components/Modal";

// --- GraphQL Operations ---

const CASHFLOWS_QUERY = gql`
  query GetCashFlows {
    cashFlows {
      id
      cashId
      total
      currency
      description
      status
      transactionDate
      transactionType
      wayPay
      createdAt
    }
  }
`;

const CASHES_QUERY = gql`
  query GetCashes {
    cashes {
      id
      name
      currencyType
    }
  }
`;

const WAYPAYS_QUERY = gql`
  query GetWayPays {
    wayPays {
      id
      label
    }
  }
`;

const CREATE_CASHFLOW_MUTATION = gql`
  mutation CreateCashFlow(
    $cashId: Int!
    $total: Float!
    $transactionType: String!
    $wayPay: Int!
    $description: String
    $currency: String
  ) {
    createCashFlow(
      cashId: $cashId
      total: $total
      transactionType: $transactionType
      wayPay: $wayPay
      description: $description
      currency: $currency
    ) {
      success
      message
    }
  }
`;

const UPDATE_CASHFLOW_MUTATION = gql`
  mutation UpdateCashFlow(
    $id: Int!
    $total: Float!
    $transactionType: String!
    $wayPay: Int!
    $description: String
  ) {
    updateCashFlow(
      id: $id
      total: $total
      transactionType: $transactionType
      wayPay: $wayPay
      description: $description
    ) {
      success
      message
    }
  }
`;

// --- Interfaces ---

interface CashFlow {
  id: number;
  cashId: number | null;
  total: number;
  currency: string;
  description: string | null;
  status: string | null;
  transactionDate: string | null;
  transactionType: string;
  wayPay: number;
  createdAt: string;
}

interface Cash {
  id: number;
  name: string;
  currencyType: string;
}

interface WayPay {
  id: number;
  label: string;
}

interface CashFlowsData {
  cashFlows: CashFlow[];
}

interface CashesData {
  cashes: Cash[];
}

interface WayPaysData {
  wayPays: WayPay[];
}

interface MutationResponse {
  success: boolean;
  message: string;
}

interface CreateCashFlowData {
  createCashFlow: MutationResponse;
}

interface UpdateCashFlowData {
  updateCashFlow: MutationResponse;
}

const TRANSACTION_TYPES = [
  { id: 'E', label: 'ENTRADA', icon: ArrowUpRight, color: 'text-emerald-500' },
  { id: 'S', label: 'SALIDA', icon: ArrowDownLeft, color: 'text-red-500' },
  { id: 'D', label: 'DEPÓSITO', icon: ArrowUpRight, color: 'text-blue-500' },
  { id: 'R', label: 'RETIRO', icon: ArrowDownLeft, color: 'text-orange-500' },
];

export default function CashFlowPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialFormState = {
    cashId: "",
    total: "",
    transactionType: "E",
    wayPay: "1",
    description: "",
    currency: "PEN",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: flowsData, loading: loadingFlows, refetch: refetchFlows } = useQuery<CashFlowsData>(CASHFLOWS_QUERY);
  const { data: cashesData } = useQuery<CashesData>(CASHES_QUERY);
  const { data: wayPaysData } = useQuery<WayPaysData>(WAYPAYS_QUERY);
  
  const flows = flowsData?.cashFlows ?? [];
  const cashes = cashesData?.cashes ?? [];
  const wayPays = wayPaysData?.wayPays ?? [];

  const [createCashFlow, { loading: creating }] = useMutation<CreateCashFlowData>(CREATE_CASHFLOW_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.createCashFlow);
    },
    onError: (err) => setError(err.message),
  });

  const [updateCashFlow, { loading: updating }] = useMutation<UpdateCashFlowData>(UPDATE_CASHFLOW_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.updateCashFlow);
    },
    onError: (err) => setError(err.message),
  });

  const handleMutationCompleted = (response?: MutationResponse) => {
    if (response?.success) {
      setSuccess(response.message);
      setFormData(initialFormState);
      refetchFlows();
      setTimeout(() => closeModal(), 1500);
    } else {
      setError(response?.message || "Error en la operación");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedFlowId(null);
    setFormData(initialFormState);
    setError("");
    setSuccess("");
  };

  const openEditModal = (flow: CashFlow) => {
    setIsEditing(true);
    setSelectedFlowId(flow.id);
    setFormData({
      cashId: flow.cashId?.toString() || "",
      total: flow.total.toString(),
      transactionType: flow.transactionType,
      wayPay: flow.wayPay.toString(),
      description: flow.description || "",
      currency: flow.currency,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const variables = {
      total: parseFloat(formData.total),
      transactionType: formData.transactionType,
      wayPay: parseInt(formData.wayPay),
      description: formData.description || null,
    };

    if (isEditing && selectedFlowId) {
      await updateCashFlow({
        variables: {
          id: selectedFlowId,
          ...variables,
        },
      });
    } else {
      if (!formData.cashId) {
        setError("Debe seleccionar una caja");
        return;
      }
      await createCashFlow({
        variables: {
          cashId: parseInt(formData.cashId),
          currency: formData.currency,
          ...variables,
        },
      });
    }
  };

  const filteredFlows = flows.filter(f => 
    f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-700 -mt-2">
      {/* Premium Industrial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card px-8 py-8 shadow-sm border border-border group transition-all duration-500">
        <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/10 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-foreground/5 dark:bg-slate-500/5 rounded-full blur-2xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-orange-600 items-center justify-center text-white shadow-[0_0_30px_rgba(234,88,12,0.2)] animate-pulse-slow">
              <History className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></span>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  FLUJO DE <span className="text-orange-600">CAJA OPERATIVA</span>
                </h1>
              </div>
              <p className="text-foreground/50 dark:text-slate-400 text-[10px] uppercase tracking-[0.3em] ml-1">
                REGISTRO CRONOLÓGICO DE MOVIMIENTOS Y TRANSACCIONES
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData(initialFormState);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-orange-600 text-white rounded-2xl font-black text-[11px] shadow-xl shadow-orange-600/20 hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all group shrink-0 uppercase tracking-widest"
          >
            <div className="w-5 h-5 rounded-lg bg-white/20 text-white flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
              <Plus className="w-3.5 h-3.5" />
            </div>
            REGISTRAR MOVIMIENTO
          </button>
        </div>
      </div>

      {/* Advanced Search Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-12 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-foreground/40 group-focus-within:text-orange-600 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Filtrar por descripción o tipo de movimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List Display */}
      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02]">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Fecha / Referencia</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Caja / Origen</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Descripción Detallada</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Tipo / Medio</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 text-right">Monto Operado</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingFlows ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-12 bg-foreground/5 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredFlows.length > 0 ? (
                filteredFlows.map((flow) => {
                  const type = TRANSACTION_TYPES.find(t => t.id === flow.transactionType);
                  const TypeIcon = type?.icon || History;
                  
                  return (
                    <tr 
                      key={flow.id} 
                      onDoubleClick={() => openEditModal(flow)}
                      className="group hover:bg-foreground/[0.01] transition-all duration-300 cursor-pointer"
                    >
                      <td className="px-6 py-6 font-mono">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5 text-foreground/30" />
                             <span className="text-[11px] font-black text-foreground/80">
                               {flow.transactionDate || flow.createdAt.split('T')[0]}
                             </span>
                          </div>
                          <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-tighter">Nº TRANS: {flow.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground leading-tight group-hover:text-orange-600 transition-colors">
                            {cashes.find(c => c.id === flow.cashId)?.name || 'Caja Desconocida'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-start gap-2.5">
                           <div className="mt-0.5 p-1 rounded-lg bg-orange-600/10">
                              <FileText className="w-3.5 h-3.5 text-orange-600" />
                           </div>
                           <span className="text-[11px] font-bold text-foreground/60 max-w-[300px] leading-relaxed italic">
                             {flow.description || "Sin descripción adicional registrada"}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                           <div className={`flex items-center gap-2 font-black text-[10px] tracking-widest ${type?.color}`}>
                             <TypeIcon className="w-3.5 h-3.5" />
                             {type?.label}
                           </div>
                           <span className="text-[10px] font-bold text-foreground/30 px-2 py-0.5 bg-foreground/5 rounded-md w-fit uppercase">
                             {wayPays.find(w => w.id === flow.wayPay)?.label || 'Efectivo'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-[15px] font-black ${flow.transactionType === 'E' || flow.transactionType === 'D' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {flow.transactionType === 'E' || flow.transactionType === 'D' ? '+' : '-'} {flow.currency} {Number(flow.total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[9px] font-black text-foreground/20 uppercase">Validado</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => openEditModal(flow)}
                             className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground/30 border border-border hover:bg-orange-600 hover:text-white hover:border-orange-600 active:scale-90 transition-all shadow-sm"
                           >
                             <Pencil className="w-4 h-4" />
                           </button>
                           <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground/30 border border-border hover:bg-foreground/5 active:scale-90 transition-all shadow-sm">
                             <MoreVertical className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2rem] bg-foreground/5 flex items-center justify-center text-foreground/20 border-4 border-dashed border-foreground/10">
                        <Construction className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-[13px] uppercase tracking-[0.2em] text-foreground/40">Historial de movimientos vacío</p>
                        <p className="text-[11px] font-bold text-foreground/20">Aún no se han registrado entradas o salidas de dinero</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? "Actualizar Movimiento de Caja" : "Registro de Movimiento de Caja"}
      >
        <form onSubmit={handleSubmit} className="p-2 space-y-8" autoComplete="off">
          
          <div className="relative bg-foreground/[0.02] rounded-3xl p-6 border border-border">
            <div className="absolute -top-3 left-6 px-3 bg-card border border-border rounded-full">
              <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">Detalles de la Operación</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Seleccionar Caja Destino / Origen *</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <select
                    name="cashId"
                    required
                    disabled={isEditing}
                    value={formData.cashId}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Seleccione caja operativa...</option>
                    {cashes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.currencyType})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Tipo de Transacción *</label>
                <div className="relative">
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                  >
                    {TRANSACTION_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Medio de Pago / Abono *</label>
                <div className="relative">
                  <select
                    name="wayPay"
                    value={formData.wayPay}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                  >
                    {wayPays.map(wp => (
                      <option key={wp.id} value={wp.id}>{wp.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Importe Total *</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="number"
                    step="0.01"
                    name="total"
                    required
                    value={formData.total}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Divisa Operada *</label>
                <div className="relative">
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    disabled={isEditing}
                    className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="PEN">SOLES (S/.)</option>
                    <option value="USD">DÓLARES ($)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Justificación / Motivo del Movimiento</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ej. Pago de servicios básicos, Venta manual, etc..."
                  className="w-full p-4 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 resize-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded-[1.5rem] flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-400 ${
              error ? 'bg-red-500/10 border border-red-500/20 text-red-600' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${error ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
              <p className="text-[12px] font-black uppercase tracking-tight leading-4">{error || success}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-4 rounded-2xl text-[11px] font-black text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5 transition-all uppercase tracking-[0.2em]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || updating}
              className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-[11px] shadow-xl shadow-orange-600/20 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-[0.2em] flex items-center gap-3"
            >
              {(creating || updating) ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  SISTEMATIZANDO...
                </>
              ) : (
                <>
                  {isEditing ? "ACTUALIZAR REGISTRO" : "CONFIRMAR OPERACIÓN"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
