"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Plus, 
  Search, 
  User, 
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
  ArrowRight,
  ChevronDown,
  Pencil,
  Wrench,
  Construction,
  ShieldCheck
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

const CLIENTS_QUERY = gql`
  query GetClients {
    clients {
      id
      documentType
      documentNumber
      names
      phone
      email
      address
      districtId
      districtName
      observation
      country
    }
  }
`;

const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient(
    $documentType: String!
    $documentNumber: String!
    $names: String!
    $districtId: String
    $address: String
    $phone: String
    $email: String
    $country: String
    $observation: String
  ) {
    createClient(
      documentType: $documentType
      documentNumber: $documentNumber
      names: $names
      districtId: $districtId
      address: $address
      phone: $phone
      email: $email
      country: $country
      observation: $observation
    ) {
      success
      message
    }
  }
`;

const UPDATE_CLIENT_MUTATION = gql`
  mutation UpdateClient(
    $id: ID!
    $documentType: String!
    $documentNumber: String!
    $names: String!
    $districtId: String
    $address: String
    $phone: String
    $email: String
    $country: String
    $observation: String
  ) {
    updateClient(
      id: $id
      documentType: $documentType
      documentNumber: $documentNumber
      names: $names
      districtId: $districtId
      address: $address
      phone: $phone
      email: $email
      country: $country
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

interface Client {
  id: string;
  documentType: string;
  documentNumber: string;
  names: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  districtId: string | null;
  districtName: string | null;
  observation: string | null;
  country: string | null;
}

interface DistrictsData {
  districts: District[];
}

interface ClientsData {
  clients: Client[];
}

interface MutationResponse {
  success: boolean;
  message: string;
}

interface CreateClientData {
  createClient: MutationResponse;
}

interface UpdateClientData {
  updateClient: MutationResponse;
}

const DOCUMENT_TYPES = [
  { id: '1', label: 'DNI' },
  { id: '6', label: 'RUC' },
  { id: '4', label: 'CARNET DE EXTRANJERÍA' },
  { id: '7', label: 'PASAPORTE' },
  { id: '0', label: 'SIN DOCUMENTO' },
];

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialFormState = {
    names: "",
    documentType: "1",
    documentNumber: "",
    districtId: "",
    address: "",
    phone: "",
    email: "",
    country: "PE",
    observation: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: districtsData } = useQuery<DistrictsData>(DISTRICTS_QUERY);
  const { data: clientsData, loading: loadingClients, refetch: refetchClients } = useQuery<ClientsData>(CLIENTS_QUERY);
  
  const districts = districtsData?.districts ?? [];
  const clients = clientsData?.clients ?? [];

  const [createClient, { loading: creating }] = useMutation<CreateClientData>(CREATE_CLIENT_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.createClient);
    },
    onError: (err) => setError(err.message),
  });

  const [updateClient, { loading: updating }] = useMutation<UpdateClientData>(UPDATE_CLIENT_MUTATION, {
    onCompleted: (data) => {
      handleMutationCompleted(data?.updateClient);
    },
    onError: (err) => setError(err.message),
  });

  const handleMutationCompleted = (response?: MutationResponse) => {
    if (response?.success) {
      setSuccess(response.message);
      setFormData(initialFormState);
      refetchClients();
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
    setSelectedClientId(null);
    setFormData(initialFormState);
    setError("");
    setSuccess("");
  };

  const openEditModal = (client: Client) => {
    setIsEditing(true);
    setSelectedClientId(client.id);
    setFormData({
      names: client.names,
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      districtId: client.districtId || "",
      address: client.address || "",
      phone: client.phone || "",
      email: client.email || "",
      country: client.country || "PE",
      observation: client.observation || "",
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
      districtId: formData.districtId || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      observation: formData.observation || null,
    };

    if (isEditing && selectedClientId) {
      await updateClient({
        variables: {
          id: selectedClientId,
          ...variables,
        },
      });
    } else {
      await createClient({
        variables,
      });
    }
  };

  const filteredClients = clients.filter(c => 
    c.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documentNumber.includes(searchTerm)
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
              <Construction className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></span>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  MAESTRO DE <span className="text-orange-600">CLIENTES</span>
                </h1>
              </div>
              <p className="text-foreground/50 dark:text-slate-400 text-[10px] uppercase tracking-[0.3em] ml-1">
                GESTIÓN TÉCNICA Y SEGUIMIENTO COMERCIAL
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
            ALTA DE CLIENTE
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
            placeholder="Filtrar por nombre, razón social o número de identificación..."
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
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Perfil</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Identificación</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40">Ubicación</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingClients ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8">
                      <div className="h-12 bg-foreground/5 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    onDoubleClick={() => openEditModal(client)}
                    className="group hover:bg-foreground/[0.01] transition-all duration-300 cursor-pointer"
                    title="Doble clic para editar"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-card border-2 border-border flex items-center justify-center text-foreground/40 transition-all group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-lg flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground leading-tight group-hover:text-orange-600 transition-colors">
                            {client.names}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-600/10 px-1.5 py-0.5 rounded-md border border-orange-600/20">
                              CLIENTE FIEL
                            </span>
                            {client.phone && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/40">
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-tighter">
                          {DOCUMENT_TYPES.find(t => t.id === client.documentType)?.label || 'DNI'}
                        </span>
                        <span className="text-[12px] font-black text-foreground/80 border-b border-dashed border-border pb-0.5 inline-block w-fit">
                          {client.documentNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1 rounded-lg bg-foreground/5">
                          <MapPin className="w-3.5 h-3.5 text-foreground/30" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground/60 max-w-[200px] truncate">
                            {client.address || "Dirección no especificada"}
                          </span>
                          <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mt-0.5">
                            {client.districtName || "SIN DISTRITO"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(client)}
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
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2rem] bg-foreground/5 flex items-center justify-center text-foreground/20 border-4 border-dashed border-foreground/10">
                        <Wrench className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-[13px] uppercase tracking-[0.2em] text-foreground/40">No se encontraron clientes</p>
                        <p className="text-[11px] font-bold text-foreground/20">Comience registrando uno nuevo en el botón superior</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registry/Edit Industrial Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? "Actualizar Registro de Cliente" : "Formulario de Alta de Cliente"}
      >
        <form onSubmit={handleSubmit} className="p-2 space-y-8" autoComplete="off">
          <input type="text" style={{ display: 'none' }} name="fake-username" />
          
          {/* Main Info Section */}
          <div className="relative bg-foreground/[0.02] rounded-3xl p-6 border border-border">
            <div className="absolute -top-3 left-6 px-3 bg-card border border-border rounded-full">
              <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">Identificación Primaria</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Tipo de Identidad *</label>
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
                    placeholder="Ingrese número..."
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Nombres / Razón Social *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="text"
                    name="names"
                    required
                    value={formData.names}
                    onChange={handleChange}
                    placeholder="Nombre completo o nombre comercial"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-black text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="relative bg-foreground/[0.02] rounded-3xl p-6 border border-border">
            <div className="absolute -top-3 left-6 px-3 bg-card border border-border rounded-full">
              <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">Geolocalización y Contacto</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="md:col-span-2">
                <Autocomplete
                  label="Distrito Sede *"
                  options={districts.map(d => ({ id: d.id, label: d.description }))}
                  value={formData.districtId}
                  onChange={(val) => setFormData({ ...formData, districtId: String(val) })}
                  placeholder="Buscar ubicación..."
                  icon={<MapPin className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Dirección Exacta</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ej. Calle Industrial 456, Interior B"
                  className="w-full px-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Número de Contacto</label>
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
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Canal de E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="cliente@ejemplo.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-[12px] font-bold text-foreground focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Cuaderno de Seguimiento / Observaciones</label>
            <textarea
              name="observation"
              value={formData.observation}
              onChange={handleChange}
              rows={3}
              placeholder="Notas técnicas o preferencias del cliente..."
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
                  {isEditing ? "ACTUALIZAR MAESTRO" : "GRABAR EN BASE"}
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
