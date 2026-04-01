"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Plus, 
  Search, 
  Landmark, 
  Wallet, 
  Building2, 
  CreditCard, 
  CircleDollarSign, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical,
  Filter,
  ArrowRight,
  ChevronDown,
  Pencil,
  Construction,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import Modal from "@/app/components/Modal";

// --- GraphQL Operations ---

const CASHES_QUERY = gql`
  query GetCashes {
    cashes {
      id
      name
      accountNumber
      accountType
      currencyType
      currencyDescription
      subsidiaryId
      isEnabled
    }
  }
`;

const SUBSIDIARIES_QUERY = gql`
  query GetSubsidiaries {
    subsidiaries {
      id
      name
    }
  }
`;

const CREATE_CASH_MUTATION = gql`
  mutation CreateCash(
    $name: String!
    $accountType: String!
    $currencyType: String!
    $accountNumber: String
    $subsidiaryId: Int
  ) {
    createCash(
      name: $name
      accountType: $accountType
      currencyType: $currencyType
      accountNumber: $accountNumber
      subsidiaryId: $subsidiaryId
    ) {
      success
      message
    }
  }
`;

const UPDATE_CASH_MUTATION = gql`
  mutation UpdateCash(
    $id: Int!
    $name: String!
    $accountType: String!
    $currencyType: String!
    $accountNumber: String
    $isEnabled: Boolean!
  ) {
    updateCash(
      id: $id
      name: $name
      accountType: $accountType
      currencyType: $currencyType
      accountNumber: $accountNumber
      isEnabled: $isEnabled
    ) {
      success
      message
    }
  }
`;

// --- Interfaces ---

interface Cash {
  id: number;
  name: string;
  accountNumber: string | null;
  accountType: string;
  currencyType: string;
  currencyDescription: string;
  subsidiaryId: number | null;
  isEnabled: boolean;
}

interface Subsidiary {
  id: number;
  name: string;
}

interface CashesData {
  cashes: Cash[];
}

interface SubsidiariesData {
  subsidiaries: Subsidiary[];
}

interface MutationResponse {
  success: boolean;
  message: string;
}

interface CreateCashData {
  createCash: MutationResponse;
}

interface UpdateCashData {
  updateCash: MutationResponse;
}

const ACCOUNT_TYPES = [
  { id: 'C', label: 'CAJA' },
  { id: 'B', label: 'BANCO' },
  { id: 'CC', label: 'CUENTA POR COBRAR' },
  { id: 'CP', label: 'CUENTA POR PAGAR' },
];

const CURRENCY_TYPES = [
  { id: 'PEN', label: 'SOLES (S/.)' },
  { id: 'USD', label: 'DÓLARES ($)' },
];

export default function CashPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCashId, setSelectedCashId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialFormState = {
    name: "",
    accountType: "C",
    currencyType: "PEN",
    accountNumber: "",
    subsidiaryId: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isEnabled, setIsEnabled] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: cashesData, loading: loadingCashes, refetch: refetchCashes } = useQuery<CashesData>(CASHES_QUERY);
  const { data: subsidiariesData } = useQuery<SubsidiariesData>(SUBSIDIARIES_QUERY);
  
  const cashes = cashesData?.cashes ?? [];
  const subsidiaries = subsidiariesData?.subsidiaries ?? [];

  const [createCash, { loading: creating }] = useMutation<CreateCashData>(CREATE_CASH_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.createCash);
    },
    onError: (err) => setError(err.message),
  });

  const [updateCash, { loading: updating }] = useMutation<UpdateCashData>(UPDATE_CASH_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.updateCash);
    },
    onError: (err) => setError(err.message),
  });

  const handleMutationCompleted = (response?: MutationResponse) => {
    if (response?.success) {
      setSuccess(response.message);
      setFormData(initialFormState);
      refetchCashes();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } else {
      setError(response?.message || "Error en la operación");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedCashId(null);
    setFormData(initialFormState);
    setError("");
    setSuccess("");
  };

  const openEditModal = (cash: Cash) => {
    setIsEditing(true);
    setSelectedCashId(cash.id);
    setIsEnabled(cash.isEnabled);
    setFormData({
      name: cash.name,
      accountType: cash.accountType,
      currencyType: cash.currencyType,
      accountNumber: cash.accountNumber || "",
      subsidiaryId: cash.subsidiaryId?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isEditing && selectedCashId) {
      await updateCash({
        variables: {
          id: selectedCashId,
          name: formData.name,
          accountType: formData.accountType,
          currencyType: formData.currencyType,
          accountNumber: formData.accountNumber || null,
          isEnabled: isEnabled,
        },
      });
    } else {
      await createCash({
        variables: {
          ...formData,
          subsidiaryId: formData.subsidiaryId ? parseInt(formData.subsidiaryId) : null,
          accountNumber: formData.accountNumber || null,
        },
      });
    }
  };

  const filteredCashes = cashes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.accountNumber && c.accountNumber.includes(searchTerm))
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
              <Landmark className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></span>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  MAESTRO DE <span className="text-orange-600">CAJAS Y BANCOS</span>
                </h1>
              </div>
              <p className="text-foreground/50 dark:text-slate-400 text-[10px] uppercase tracking-[0.3em] ml-1">
                CONTROL DE ACTIVOS Y FLUJO MONETARIO
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
            NUEVA CAJA
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
            placeholder="Filtrar por nombre de caja o número de cuenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid Display */}
      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02]">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Entidad / Caja</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Tipo / Moneda</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Identificador</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 text-center">Estado / Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingCashes ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8">
                      <div className="h-12 bg-foreground/5 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredCashes.length > 0 ? (
                filteredCashes.map((cash) => (
                  <tr 
                    key={cash.id} 
                    onDoubleClick={() => openEditModal(cash)}
                    className="group hover:bg-foreground/[0.01] transition-all duration-300 cursor-pointer"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-card border-2 border-border flex items-center justify-center text-foreground/40 transition-all group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600">
                            {cash.accountType === 'B' ? <Building2 className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                          </div>
                          {cash.isEnabled && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-lg flex items-center justify-center shadow-lg">
                              <ShieldCheck className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground leading-tight group-hover:text-orange-600 transition-colors">
                            {cash.name}
                          </span>
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mt-0.5">
                            {ACCOUNT_TYPES.find(t => t.id === cash.accountType)?.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2">
                           <CircleDollarSign className="w-3.5 h-3.5 text-orange-600/60" />
                           <span className="text-[11px] font-black text-foreground/70 uppercase">
                             {cash.currencyDescription}
                           </span>
                         </div>
                         <span className="text-[10px] font-bold text-foreground/30 px-2 py-0.5 bg-foreground/5 rounded-md w-fit">
                           {cash.currencyType}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-black text-foreground/80 border-b border-dashed border-border pb-0.5 inline-block w-fit">
                          {cash.accountNumber || "SIN NÚMERO"}
                        </span>
                        <span className="text-[9px] font-bold text-foreground/20 uppercase">Referencia de Cuenta</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cash.isEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${cash.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                           <span className="text-[9px] font-black uppercase tracking-widest">{cash.isEnabled ? 'ACTIVA' : 'INACTIVA'}</span>
                         </div>
                        <button 
                          onClick={() => openEditModal(cash)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-card text-foreground/30 border border-border hover:bg-orange-600 hover:text-white hover:border-orange-600 active:scale-90 transition-all shadow-sm"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2rem] bg-foreground/5 flex items-center justify-center text-foreground/20 border-4 border-dashed border-foreground/10">
                        <Construction className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-[13px] uppercase tracking-[0.2em] text-foreground/40">No se encontraron cajas registradas</p>
                        <p className="text-[11px] font-bold text-foreground/20">Cree una nueva caja para comenzar a operar</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registry/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? "Configuración Técnica de Caja" : "Alta de Nueva Caja / Cuenta"}
      >
        <form onSubmit={handleSubmit} className="p-2 space-y-8" autoComplete="off">
          
          <div className="relative bg-foreground/[0.02] rounded-3xl p-6 border border-border">
            <div className="absolute -top-3 left-6 px-3 bg-card border border-border rounded-full">
              <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">Identificación Comercial</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Nombre Descriptivo *</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Caja Principal - Turno Mañana"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Tipo de Activo *</label>
                <div className="relative">
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                  >
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Moneda de Operación *</label>
                <div className="relative">
                  <select
                    name="currencyType"
                    value={formData.currencyType}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                  >
                    {CURRENCY_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Nº de Cuenta / Identificador</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Opcional..."
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Sucursal Asignada</label>
                  <div className="relative">
                    <select
                      name="subsidiaryId"
                      value={formData.subsidiaryId}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione sucursal...</option>
                      {subsidiaries.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="space-y-4 pt-4 border-t border-border md:col-span-2">
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <p className="text-[11px] font-black text-foreground uppercase tracking-tight">Estado de la Caja</p>
                       <p className="text-[10px] font-medium text-foreground/40 italic">Las cajas inactivas no aparecerán en el Punto de Venta.</p>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setIsEnabled(!isEnabled)}
                       className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}
                     >
                       {isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                       <span className="text-[10px] font-black uppercase tracking-widest">{isEnabled ? 'HABILITADA' : 'DESHABILITADA'}</span>
                     </button>
                   </div>
                </div>
              )}
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
                  PROCESANDO...
                </>
              ) : (
                <>
                  {isEditing ? "ACTUALIZAR CONFIGURACIÓN" : "SISTEMATIZAR CAJA"}
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
