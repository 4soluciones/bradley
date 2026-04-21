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
    customNumber: "",
    cashId: "",
    total: "",
    transactionType: "E",
    wayPay: "1",
    description: "",
    currency: "PEN",
    transactionDate: new Date().toISOString().split('T')[0],
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
      customNumber: flow.id.toString(),
      cashId: flow.cashId?.toString() || "",
      total: flow.total.toString(),
      transactionType: flow.transactionType,
      wayPay: flow.wayPay.toString(),
      description: flow.description || "",
      currency: flow.currency,
      transactionDate: flow.transactionDate || flow.createdAt.split('T')[0],
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
      transactionDate: formData.transactionDate || null,
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
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-700">
      {/* Compact Industrial Header */}
      <div className="bg-card border border-border rounded-xl px-6 py-4 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">
              Flujo de <span className="text-orange-600">Caja Operativa</span>
            </h1>
            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
              Registro cronológico de movimientos
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar movimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-transparent rounded-lg text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600/30 transition-all"
            />
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                ...initialFormState,
                cashId: cashes[0]?.id?.toString() || "",
                customNumber: (flows.length > 0 ? Math.max(...flows.map(f => f.id)) + 1 : 1).toString()
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-black text-[10px] shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Main Content Area - Constrained and Scrollable */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <tr>
                <th className="w-[15%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Fecha / ID</th>
                <th className="w-[15%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Caja / Origen</th>
                <th className="w-[30%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Justificación</th>
                <th className="w-[15%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Tipo / Medio</th>
                <th className="w-[15%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-right">Monto</th>
                <th className="w-[10%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 overflow-y-auto">
              {loadingFlows ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-6 bg-foreground/5 rounded-lg w-full" />
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
                      className="group hover:bg-foreground/[0.01] transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-orange-600"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-foreground/80 font-mono italic">
                            {flow.transactionDate || flow.createdAt.split('T')[0]}
                          </span>
                          <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-tighter">TRANS-{flow.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-black text-foreground group-hover:text-orange-600 transition-colors uppercase truncate block">
                          {cashes.find(c => c.id === flow.cashId)?.name || 'Caja N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                           <FileText className="w-3 h-3 text-foreground/20 shrink-0" />
                           <span className="text-[10px] font-bold text-foreground/60 truncate italic leading-tight">
                             {flow.description || "Sin descripción"}
                           </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                           <div className={`flex items-center gap-1.5 font-black text-[9px] tracking-tight ${type?.color}`}>
                             <TypeIcon className="w-3 h-3" />
                             {type?.label}
                           </div>
                           <span className="text-[8px] font-bold text-foreground/20 uppercase mt-0.5">
                             {wayPays.find(w => w.id === flow.wayPay)?.label || 'Efectivo'}
                           </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className={`text-[12px] font-black ${flow.transactionType === 'E' || flow.transactionType === 'D' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {flow.transactionType === 'E' || flow.transactionType === 'D' ? '+' : '-'} {flow.currency} {Number(flow.total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => openEditModal(flow)}
                             className="p-1.5 rounded-md bg-foreground/5 text-foreground/30 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                           >
                             <Pencil className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Construction className="w-8 h-8" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Sin registros de flujo</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Area */}
        <div className="px-4 py-2 border-t border-border bg-foreground/[0.02] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <p className="text-[8px] font-bold text-foreground/30 uppercase tracking-[0.2em]">
              Registros cargados: {filteredFlows.length}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[8px] font-black text-foreground/40 uppercase">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-[8px] font-black text-foreground/40 uppercase">Salidas</span>
              </div>
            </div>
          </div>
          <p className="text-[9px] font-black text-orange-600/50 uppercase tracking-widest">Bradley Hardware ERP System</p>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? "Actualización de Movimiento" : "Registro de Nuevo Movimiento / Gasto"}
      >
        <div className="p-1 flex gap-4">
          <form onSubmit={handleSubmit} className="flex-1 space-y-4" autoComplete="off">
            <div className="bg-foreground/[0.02] border border-border rounded-xl p-5 space-y-5 shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
               
               {/* Top Field Group */}
               <div className="grid grid-cols-5 gap-3 relative z-10">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter">Caja / Origen</label>
                    <div className="relative">
                      <select
                        name="cashId"
                        required
                        disabled={isEditing}
                        value={formData.cashId}
                        onChange={handleChange}
                        className="w-full h-9 bg-card border border-border rounded-lg px-2 text-[10px] font-bold focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 outline-none appearance-none transition-all shadow-sm"
                      >
                        <option value=""></option>
                        {cashes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 pointer-events-none" />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter">Control Nº</label>
                    <input
                      type="text"
                      name="customNumber"
                      value={formData.customNumber}
                      onChange={handleChange}
                      className="w-full h-9 bg-card border border-border rounded-lg px-2 text-[10px] font-mono font-black text-center focus:border-orange-600 outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter">Estatus</label>
                    <div className="w-full h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 flex items-center justify-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[9px] font-black text-emerald-600 uppercase">Activo</span>
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter">Tipo Op.</label>
                    <div className="relative">
                      <select
                        name="transactionType"
                        value={formData.transactionType}
                        onChange={handleChange}
                        className="w-full h-9 bg-card border border-border rounded-lg px-2 text-[10px] font-black focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 outline-none appearance-none uppercase transition-all shadow-sm"
                      >
                        {TRANSACTION_TYPES.map(type => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 pointer-events-none" />
                    </div>
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[8px] font-black text-orange-600/60 uppercase tracking-tighter font-black">Importe Total:</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total"
                      required
                      value={formData.total}
                      onChange={handleChange}
                      className="w-full h-9 bg-card border border-border rounded-lg px-3 text-[11px] font-black text-right focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10 outline-none placeholder:text-foreground/20 transition-all shadow-sm"
                      placeholder="0.00"
                    />
                  </div>
               </div>

               {/* Comment Field */}
               <div className="space-y-1 relative z-10">
                  <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter">Justificación Detallada:</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-[11px] font-bold focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 outline-none resize-none transition-all shadow-sm placeholder:text-foreground/10"
                    placeholder="Ingrese los motivos de este movimiento de caja..."
                  />
               </div>

               {/* Bottom Group */}
               <div className="grid grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter">Operador Responsable</label>
                    <div className="h-9 bg-foreground/5 border border-border rounded-lg px-3 flex items-center gap-2 shadow-inner">
                      <div className="w-4 h-4 rounded bg-orange-600 flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[9px] font-black text-foreground/60 uppercase">Bradley Admin Interface</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-foreground/40 uppercase tracking-tighter text-right block">Fecha de Registro</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="transactionDate"
                        value={formData.transactionDate}
                        onChange={handleChange}
                        className="w-full h-9 bg-card border border-border rounded-lg px-3 text-[10px] font-black text-right focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 outline-none transition-all shadow-sm"
                      />                      
                    </div>
                  </div>
               </div>
            </div>

            {(error || success) && (
              <div className={`p-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-300 border ${
                error ? 'bg-red-500/5 border-red-500/10 text-red-600' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'
              }`}>
                {error ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <p className="text-[9px] font-black uppercase tracking-tight">{error || success}</p>
              </div>
            )}
          </form>

          {/* Action Sidebar */}
          <div className="flex flex-col gap-3 pt-6 shrink-0 w-32">
            <button
              onClick={handleSubmit}
              disabled={creating || updating}
              className="w-full flex items-center justify-center gap-2 px-3 py-4 bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 active:scale-[0.98] transition-all group disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{isEditing ? 'Actualizar' : 'Guardar'}</span>
            </button>
            <button
              onClick={closeModal}
              className="w-full flex items-center justify-center gap-2 px-3 py-4 bg-foreground/5 text-foreground/40 rounded-xl hover:bg-red-500/10 hover:text-red-600 transition-all active:scale-[0.98]"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cancelar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
