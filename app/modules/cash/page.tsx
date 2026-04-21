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
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-700">
      {/* Compact Industrial Header */}
      <div className="bg-card border border-border rounded-xl px-6 py-4 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">
              Gestión de <span className="text-orange-600">Cajas y Bancos</span>
            </h1>
            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
              Control de activos y flujo monetario
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar caja o cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-transparent rounded-lg text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600/30 transition-all"
            />
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData(initialFormState);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-black text-[10px] shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Caja
          </button>
        </div>
      </div>

      {/* Main Content Area - Constrained and Scrollable */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <tr>
                <th className="w-[35%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Entidad / Caja</th>
                <th className="w-[20%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Tipo / Moneda</th>
                <th className="w-[25%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40">Identificador</th>
                <th className="w-[20%] px-4 py-3 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 overflow-y-auto">
              {loadingCashes ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-4 py-4">
                      <div className="h-8 bg-foreground/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredCashes.length > 0 ? (
                filteredCashes.map((cash) => (
                  <tr 
                    key={cash.id} 
                    onDoubleClick={() => openEditModal(cash)}
                    className="group hover:bg-foreground/[0.01] transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-orange-600"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          cash.accountType === 'B' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'
                        }`}>
                          {cash.accountType === 'B' ? <Building2 className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-black text-foreground truncate group-hover:text-orange-600 transition-colors uppercase">
                            {cash.name}
                          </span>
                          <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-tighter">
                            {ACCOUNT_TYPES.find(t => t.id === cash.accountType)?.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-foreground/70 flex items-center gap-1">
                          <CircleDollarSign className="w-3 h-3 text-orange-600/60" />
                          {cash.currencyType}
                        </span>
                        <span className="text-[8px] font-bold text-foreground/30 truncate">
                          {cash.currencyDescription}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black text-foreground/80 bg-foreground/5 px-2 py-0.5 rounded w-fit border border-border/50">
                          {cash.accountNumber || "N/A"}
                        </span>
                        <span className="text-[8px] font-bold text-foreground/20 uppercase mt-0.5 pl-1 italic">Nº Cuenta</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter border ${
                          cash.isEnabled 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                            : 'bg-red-500/10 border-red-500/20 text-red-600'
                        }`}>
                          {cash.isEnabled ? 'ACTIVA' : 'INACTIVA'}
                        </div>
                        <button 
                          onClick={() => openEditModal(cash)}
                          className="p-1.5 rounded-md bg-foreground/5 text-foreground/30 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Construction className="w-8 h-8" />
                      <p className="font-black text-[10px] uppercase tracking-widest">Sin registros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info/stats */}
        <div className="px-4 py-2 border-t border-border bg-foreground/[0.02] flex justify-between items-center shrink-0">
          <p className="text-[8px] font-bold text-foreground/30 uppercase tracking-[0.2em]">
            Total registros: {filteredCashes.length}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[8px] font-bold text-foreground/40 uppercase">Habilitadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-[8px] font-bold text-foreground/40 uppercase">Bloqueadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Registry/Edit Modal - Redesigned */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? "Edición Técnica de Caja" : "Nueva Caja de Operaciones"}
      >
        <div className="p-1">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Nombre Comercial de la Caja *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-600/10 rounded flex items-center justify-center">
                    <Wallet className="w-2.5 h-2.5 text-orange-600" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: CAJA MOSTRADOR 01"
                    className="w-full pl-9 pr-4 py-2.5 bg-foreground/[0.03] border border-border rounded-lg text-[11px] font-black placeholder:text-foreground/20 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Tipo de Activo *</label>
                <div className="relative">
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full pl-3 pr-10 py-2.5 bg-foreground/[0.03] border border-border rounded-lg text-[11px] font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  >
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Divisa *</label>
                <div className="relative">
                  <select
                    name="currencyType"
                    value={formData.currencyType}
                    onChange={handleChange}
                    className="w-full pl-3 pr-10 py-2.5 bg-foreground/[0.03] border border-border rounded-lg text-[11px] font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  >
                    {CURRENCY_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Número de Cuenta</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground/5 rounded flex items-center justify-center">
                    <CreditCard className="w-2.5 h-2.5 text-foreground/40" />
                  </div>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Opcional..."
                    className="w-full pl-9 pr-4 py-2.5 bg-foreground/[0.03] border border-border rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                  />
                </div>
              </div>

              {!isEditing ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Sucursal Asignada</label>
                  <div className="relative">
                    <select
                      name="subsidiaryId"
                      value={formData.subsidiaryId}
                      onChange={handleChange}
                      className="w-full pl-3 pr-10 py-2.5 bg-foreground/[0.03] border border-border rounded-lg text-[11px] font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                    >
                      <option value="">Seleccione...</option>
                      {subsidiaries.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1">Operatividad</label>
                  <button 
                    type="button"
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                      isEnabled 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
                        : 'bg-red-500/5 border-red-500/20 text-red-600'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tighter">{isEnabled ? 'HABILITADA' : 'DESHABILITADA'}</span>
                    {isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            {(error || success) && (
              <div className={`p-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-bottom-1 duration-300 border ${
                error ? 'bg-red-500/5 border-red-500/10 text-red-600' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'
              }`}>
                {error ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <p className="text-[10px] font-bold uppercase tracking-tight leading-tight">{error || success}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-lg text-[10px] font-black text-foreground/40 hover:bg-foreground/5 transition-all uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || updating}
                className="flex-[2] py-2.5 bg-orange-600 text-white rounded-lg font-black text-[10px] shadow-lg shadow-orange-600/10 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
              >
                {(creating || updating) ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isEditing ? "Guardar Cambios" : "Confirmar Registro"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
