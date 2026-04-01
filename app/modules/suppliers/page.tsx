"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Plus, 
  Search, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Globe, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical,
  Filter,
  User,
  ArrowRight,
  ChevronDown,
  Pencil
} from "lucide-react";
import Modal from "@/app/components/Modal";
import Autocomplete from "@/app/components/Autocomplete";

// --- GraphQL Operations ---

const DISTRICTS_QUERY = gql`
  query Districts {
    districts {
      id
      description
    }
  }
`;

const SUPPLIERS_QUERY = gql`
  query GetSuppliers {
    suppliers {
      id
      code
      documentType
      documentNumber
      names
      phone
      email
      address
      districtId
      districtName
      observation
    }
  }
`;

const CREATE_SUPPLIER_MUTATION = gql`
  mutation CreateSupplier(
    $documentType: String!
    $documentNumber: String!
    $names: String!
    $address: String!
    $code: String
    $phone: String
    $email: String
    $country: String
    $districtId: String
    $observation: String
  ) {
    createSupplier(
      documentType: $documentType
      documentNumber: $documentNumber
      names: $names
      address: $address
      code: $code
      phone: $phone
      email: $email
      country: $country
      districtId: $districtId
      observation: $observation
    ) {
      success
      message
    }
  }
`;

const UPDATE_SUPPLIER_MUTATION = gql`
  mutation UpdateSupplier(
    $id: ID!
    $documentType: String!
    $documentNumber: String!
    $names: String!
    $address: String!
    $code: String
    $phone: String
    $email: String
    $country: String
    $districtId: String
    $observation: String
  ) {
    updateSupplier(
      id: $id
      documentType: $documentType
      documentNumber: $documentNumber
      names: $names
      address: $address
      code: $code
      phone: $phone
      email: $email
      country: $country
      districtId: $districtId
      observation: $observation
    ) {
      success
      message
    }
  }
`;

// --- Interfaces ---

interface District {
  id: string;
  description: string;
}

interface Supplier {
  id: string;
  code: string | null;
  documentType: string;
  documentNumber: string;
  names: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  districtId: string | null;
  districtName: string | null;
  observation: string | null;
}

interface DistrictsData {
  districts: District[];
}

interface SuppliersData {
  suppliers: Supplier[];
}

interface MutationResponse {
  success: boolean;
  message: string;
}

interface CreateSupplierData {
  createSupplier: MutationResponse;
}

interface UpdateSupplierData {
  updateSupplier: MutationResponse;
}

const DOCUMENT_TYPES = [
  { id: '1', label: 'DNI' },
  { id: '6', label: 'RUC' },
  { id: '4', label: 'CARNET DE EXTRANJERÍA' },
  { id: '7', label: 'PASAPORTE' },
  { id: '0', label: 'SIN DOCUMENTO' },
];

export default function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialFormState = {
    names: "",
    documentType: "6",
    documentNumber: "",
    address: "",
    code: "",
    phone: "",
    email: "",
    country: "PE",
    districtId: "",
    observation: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: districtsData } = useQuery<DistrictsData>(DISTRICTS_QUERY);
  const { data: suppliersData, loading: loadingSuppliers, refetch: refetchSuppliers } = useQuery<SuppliersData>(SUPPLIERS_QUERY);
  
  const districts = districtsData?.districts ?? [];
  const suppliers = suppliersData?.suppliers ?? [];

  const [createSupplier, { loading: creating }] = useMutation<CreateSupplierData>(CREATE_SUPPLIER_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.createSupplier);
    },
    onError: (err) => setError(err.message),
  });

  const [updateSupplier, { loading: updating }] = useMutation<UpdateSupplierData>(UPDATE_SUPPLIER_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.updateSupplier);
    },
    onError: (err) => setError(err.message),
  });

  const handleMutationCompleted = (response?: MutationResponse) => {
    if (response?.success) {
      setSuccess(response.message);
      setFormData(initialFormState);
      refetchSuppliers();
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
    setSelectedSupplierId(null);
    setFormData(initialFormState);
    setError("");
    setSuccess("");
  };

  const openEditModal = (supplier: Supplier) => {
    setIsEditing(true);
    setSelectedSupplierId(supplier.id);
    setFormData({
      names: supplier.names,
      documentType: supplier.documentType,
      documentNumber: supplier.documentNumber,
      address: supplier.address || "",
      code: supplier.code || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      country: "PE",
      districtId: supplier.districtId || "",
      observation: supplier.observation || "",
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
      ...formData,
      code: formData.code || null,
      phone: formData.phone || null,
      email: formData.email || null,
      districtId: formData.districtId || null,
      observation: formData.observation || null,
    };

    if (isEditing && selectedSupplierId) {
      await updateSupplier({
        variables: {
          id: selectedSupplierId,
          ...variables,
        },
      });
    } else {
      await createSupplier({
        variables,
      });
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.documentNumber.includes(searchTerm)
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 transition-colors duration-300 -mt-2">
      {/* Premium Industrial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card px-8 py-8 shadow-sm border border-border group transition-all duration-500">
        <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/10 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -m-8 w-48 h-48 bg-foreground/5 dark:bg-slate-500/5 rounded-full blur-2xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-orange-600 items-center justify-center text-white shadow-[0_0_30px_rgba(234,88,12,0.2)] animate-pulse-slow">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></span>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 decoration-orange-600">
                  MAESTRO DE <span className="text-orange-600">PROVEEDORES</span>
                </h1>
              </div>
              <p className="text-foreground/50 dark:text-slate-400 text-[10px] uppercase tracking-[0.3em] ml-1">
                Administración centralizada de socios comerciales
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
            REGISTRAR PROVEEDOR
          </button>
        </div>
      </div>

      {/* Advanced Search Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-10 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-foreground/40 group-focus-within:text-orange-600 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre, código o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all shadow-sm"
          />
        </div>
        <div className="md:col-span-2">
          <button className="w-full h-full flex items-center justify-center gap-2 px-4 py-4 bg-card border border-border rounded-2xl text-foreground/60 font-black text-[11px] hover:bg-foreground/5 transition-colors uppercase tracking-[0.1em]">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Grid Display (Innovative Table) */}
      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02]">
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Proveedor</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Identificación</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Ubicación</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Contacto</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingSuppliers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6">
                      <div className="h-8 bg-foreground/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="group hover:bg-foreground/[0.01] transition-all duration-300 cursor-pointer">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-card border-2 border-border flex items-center justify-center text-foreground/40 transition-all group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600">
                            <Briefcase className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground leading-tight group-hover:text-orange-600 transition-colors">
                            {supplier.names}
                          </span>
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-0.5">
                            Socio Comercial
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="px-2 py-0.5 bg-foreground/5 rounded-md border border-border/50 w-fit">
                          <span className="text-[11px] font-black text-foreground/60">
                            {DOCUMENT_TYPES.find(t => t.id === supplier.documentType)?.label || 'DNI'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-foreground/40">{supplier.documentNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-foreground/60">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-orange-600/60" />
                          <span className="text-[12px] font-bold truncate max-w-[180px]">{supplier.address || "Sin dirección"}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-foreground/30 ml-4.5">{supplier.districtName || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/50">
                            <Phone className="w-3 h-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/50">
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(supplier)}
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Briefcase className="w-12 h-12" />
                      <p className="font-black text-sm uppercase tracking-widest">Sin registros encontrados</p>
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
        title={isEditing ? "Actualizar Proveedor" : "Registrar Nuevo Proveedor"}
      >
        <form onSubmit={handleSubmit} className="p-2 space-y-8" autoComplete="off">
          <input type="text" style={{ display: 'none' }} name="fake-username" />
          <input type="password" style={{ display: 'none' }} name="fake-password" />
          
          {/* Corporate Info Section */}
          <div className="relative bg-foreground/[0.02] rounded-3xl p-6 border border-border">
            <div className="absolute -top-3 left-6 px-3 bg-card border border-border rounded-full">
              <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">Identificación Corporativa</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Razón Social / Nombre Completo *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="names"
                    required
                    value={formData.names}
                    onChange={handleChange}
                    placeholder="Ej. Distribuidora Metálica S.A.C."
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Tipo de Documento *</label>
                <div className="relative">
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                  >
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Nº Documento *</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="documentNumber"
                    required
                    value={formData.documentNumber}
                    onChange={handleChange}
                    placeholder="DNI o RUC"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Código Interno</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Ej. PRV-001"
                  className="w-full px-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">País de Origen</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    className="w-full pl-11 pr-4 py-3.5 bg-foreground/[0.03] border border-border rounded-2xl text-[12px] font-bold text-foreground/50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Contact Section */}
          <div className="relative bg-foreground/[0.02] rounded-3xl p-6 border border-border">
            <div className="absolute -top-3 left-6 px-3 bg-card border border-border rounded-full">
              <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">Geolocalización y Contacto</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2">
                <Autocomplete
                  label="Distrito Fiscal *"
                  options={districts.map(d => ({ id: d.id, label: d.description }))}
                  value={formData.districtId}
                  onChange={(val) => setFormData({ ...formData, districtId: String(val) })}
                  placeholder="Buscar ubicación..."
                  icon={<MapPin className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Dirección de Sede</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ej. Av. Industrial 123"
                  className="w-full px-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Teléfono Directo</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="999 999 999"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contacto@proveedor.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Notas Comerciales / Observaciones</label>
            <textarea
              name="observation"
              value={formData.observation}
              onChange={handleChange}
              rows={3}
              placeholder="Notas generales o acuerdos con el proveedor..."
              className="w-full p-4 bg-foreground/[0.02] border border-border rounded-[1.5rem] text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 resize-none shadow-sm"
            />
          </div>

          {/* Alert Handlers */}
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
              Interrumpir
            </button>
            <button
              type="submit"
              disabled={creating || updating}
              className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black text-[11px] shadow-xl shadow-orange-600/20 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-[0.2em] flex items-center gap-3"
            >
              {(creating || updating) ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  SINCRONIZANDO...
                </>
              ) : (
                <>
                  {isEditing ? "ACTUALIZAR PROVEEDOR" : "GRABAR EN BASE"}
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
