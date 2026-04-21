"use client";

import React, { useState, useMemo } from "react";
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
  Trash2,
  Pencil,
  ArrowRight,
  ChevronDown,
  Building2,
  BadgeInfo,
  Save,
  Eraser,
  RefreshCcw,
  LayoutGrid
} from "lucide-react";
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
  { id: '4', label: 'C.E.' },
  { id: '7', label: 'PASAPORTE' },
  { id: '0', label: 'S/D' },
];

export default function SuppliersPage() {
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
    onCompleted: (data) => handleMutationCompleted(data?.createSupplier),
    onError: (err) => setError(err.message),
  });

  const [updateSupplier, { loading: updating }] = useMutation<UpdateSupplierData>(UPDATE_SUPPLIER_MUTATION, {
    onCompleted: (data) => handleMutationCompleted(data?.updateSupplier),
    onError: (err) => setError(err.message),
  });

  const handleMutationCompleted = (response?: MutationResponse) => {
    if (response?.success) {
      setSuccess(response.message);
      resetForm();
      refetchSuppliers();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(response?.message || "Error en la operación");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedSupplierId(null);
    setFormData(initialFormState);
    setError("");
  };

  const selectForEdit = (supplier: Supplier) => {
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
    setError("");
    setSuccess("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
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
        variables: { id: selectedSupplierId, ...variables },
      });
    } else {
      await createSupplier({ variables });
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.documentNumber.includes(searchTerm)
    );
  }, [suppliers, searchTerm]);

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden bg-background text-foreground animate-in fade-in duration-500">
      
      {/* --- INDUSTRIAL TOP BAR --- */}
      <div className="flex items-center justify-between bg-card p-2 px-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter leading-tight italic">
              MAESTRO DE <span className="text-orange-600">PROVEEDORES</span>
            </h1>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Panel Central de Operaciones</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group overflow-hidden rounded-lg bg-foreground/[0.03] border border-border focus-within:border-orange-600 transition-all duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600" />
            <input 
              type="text" 
              placeholder="Filtro rápido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 bg-transparent text-[11px] font-bold focus:outline-none placeholder:text-foreground/20"
            />
          </div>
          <button 
            onClick={() => refetchSuppliers()}
            className="p-2 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-lg border border-border transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-2 min-h-0">
        
        {/* --- LEFT: REGISTRATION FORM --- */}
        <div className="w-[380px] bg-card rounded-xl border border-border flex flex-col shadow-lg overflow-hidden animate-in slide-in-from-left duration-500">
          <div className="bg-orange-600 p-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <LayoutGrid className="w-4 h-4" />
              <h2 className="text-[11px] font-black uppercase tracking-widest">
                {isEditing ? 'Actualizar Ficha' : 'Nueva Ficha'}
              </h2>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="text-white/60 hover:text-white transition-colors"><Eraser className="w-4 h-4" /></button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto no-scrollbar" autoComplete="off">
            <div className="space-y-4">
              
              {/* Core Info */}
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Tipo Doc *</label>
                    <div className="relative">
                      <select
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none appearance-none cursor-pointer"
                      >
                        {DOCUMENT_TYPES.map(type => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Nº Identidad *</label>
                    <input
                      name="documentNumber"
                      required
                      value={formData.documentNumber}
                      onChange={handleChange}
                      placeholder="1234567890"
                      className="w-full px-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Razón Social / Nombre Representante *</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600" />
                    <input
                      name="names"
                      required
                      value={formData.names}
                      onChange={handleChange}
                      placeholder="Nombre comercial o social"
                      className="w-full pl-9 pr-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Cod. Interno</label>
                    <input
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="PROV-000"
                      className="w-full px-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">País</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/20" />
                      <input readOnly value="PERÚ (PE)" className="w-full pl-9 pr-3 py-2.5 bg-foreground/[0.01] border border-border rounded-lg text-[11px] font-black opacity-30 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/50" />

              {/* Location & Contact */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                   <Autocomplete
                    label="UBICACIÓN / DISTRITO *"
                    options={districts.map(d => ({ id: d.id, label: d.description }))}
                    value={formData.districtId}
                    onChange={(val) => setFormData({ ...formData, districtId: String(val) })}
                    placeholder="Elegir distrito..."
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Dirección Exacta</label>
                  <input
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Av. Las Malvinas 456..."
                    className="w-full px-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Teléfono</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600" />
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="987 654 321"
                        className="w-full pl-9 pr-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ventas@proveedor.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/50" />

              {/* Observation */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Notas / Observaciones Comerciales</label>
                <div className="relative group">
                  <BadgeInfo className="absolute left-3 top-3 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600" />
                  <textarea
                    name="observation"
                    value={formData.observation}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Condiciones de pago, horarios, etc..."
                    className="w-full pl-9 pr-3 py-2 bg-foreground/[0.03] border border-border focus:border-orange-600 rounded-lg text-[11px] font-bold focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Status Feedback */}
            {(error || success) && (
              <div className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${error ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                {error ? <Trash2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {error || success}
              </div>
            )}

            <div className="mt-auto pt-2 border-t border-border flex flex-col gap-2">
              <button
                type="submit"
                disabled={creating || updating}
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-black text-[11px] shadow-lg shadow-orange-600/20 hover:bg-orange-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-[0.2em]"
              >
                {(creating || updating) ? (
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? "ACTUALIZAR FICHA" : "REGISTRAR EN BASE"}
                  </>
                )}
              </button>
              {isEditing && (
                 <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black text-[10px] rounded-lg transition-all uppercase tracking-widest"
                >
                  CANCELAR EDICIÓN
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- RIGHT: SUPPLIER LIST --- */}
        <div className="flex-1 bg-card rounded-xl border border-border flex flex-col shadow-sm overflow-hidden min-w-0">
          <div className="bg-foreground/[0.02] border-b border-border p-2 px-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Listado Maestro de Proveedores</span>
            <span className="text-[10px] font-black bg-orange-600/10 text-orange-600 px-2 py-0.5 rounded-full">{filteredSuppliers.length} REGISTROS</span>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="w-[8%] px-4 py-2 text-[9px] font-black uppercase tracking-widest opacity-40">Cod</th>
                  <th className="w-[30%] px-4 py-2 text-[9px] font-black uppercase tracking-widest opacity-40">Razón Social</th>
                  <th className="w-[15%] px-4 py-2 text-[9px] font-black uppercase tracking-widest opacity-40">Documento</th>
                  <th className="w-[20%] px-4 py-2 text-[9px] font-black uppercase tracking-widest opacity-40">Ubicación</th>
                  <th className="w-[15%] px-4 py-2 text-[9px] font-black uppercase tracking-widest opacity-40">Contacto</th>
                  <th className="w-[12%] px-4 py-2 text-[9px] font-black uppercase tracking-widest opacity-40 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loadingSuppliers ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-foreground/5 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredSuppliers.map((supplier) => (
                  <tr 
                    key={supplier.id} 
                    onClick={() => selectForEdit(supplier)}
                    className={`group hover:bg-foreground/[0.02] cursor-pointer transition-all border-l-2 ${selectedSupplierId === supplier.id ? 'border-l-orange-600 bg-orange-600/[0.02]' : 'border-l-transparent'}`}
                  >
                    <td className="px-4 py-3 text-[10px] font-black opacity-30 tracking-tight">{supplier.code || '---'}</td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black truncate group-hover:text-orange-600 transition-colors uppercase italic">{supplier.names}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black opacity-40">{DOCUMENT_TYPES.find(t => t.id === supplier.documentType)?.label}</span>
                        <span className="text-[10px] font-bold text-foreground/70 tracking-tighter">{supplier.documentNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                        <span className="text-[10px] font-bold truncate opacity-60">{supplier.address || "---"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {supplier.phone && <span className="text-[10px] font-bold tracking-tighter flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{supplier.phone}</span>}
                        {supplier.email && <span className="text-[9px] font-bold opacity-40 truncate">{supplier.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-orange-600 hover:text-white rounded-md transition-all text-foreground/30"><Pencil className="w-3 h-3" /></button>
                        <button disabled className="p-1.5 hover:bg-red-600 hover:text-white rounded-md transition-all text-foreground/10 opacity-30 cursor-not-allowed"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
