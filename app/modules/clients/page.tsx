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
    <div className="w-full h-[calc(100vh-180px)] md:h-[calc(100vh-130px)] flex flex-col gap-4 animate-in fade-in duration-500 pt-2 overflow-hidden">
      {/* Search & Action Bar - Very Compact */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-card border border-border p-2.5 rounded-2xl shadow-sm shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
            <Construction className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-[13px] font-black tracking-tight leading-none uppercase">
              Maestro <span className="text-orange-600">Clientes</span>
            </h1>
            <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest mt-0.5">Ferretería Industrial</p>
          </div>
        </div>

        <div className="flex-1 w-full relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 group-focus-within:text-orange-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por Nombre, DNI o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-foreground/[0.03] border border-border rounded-xl text-[11px] font-bold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl text-[10px] font-black text-foreground/60 hover:bg-foreground/5 transition-colors uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            Filtros
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData(initialFormState);
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Main List Container with Internal Scroll */}
      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <tr>
                <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/40 bg-foreground/[0.02]">Cliente / Razón Social</th>
                <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/40 bg-foreground/[0.02]">Documento</th>
                <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/40 bg-foreground/[0.02]">Ubicación & Contacto</th>
                <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground/40 bg-foreground/[0.02] text-center w-[100px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loadingClients ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-4 py-2.5">
                      <div className="h-8 bg-foreground/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    onDoubleClick={() => openEditModal(client)}
                    className="group hover:bg-orange-600/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:bg-orange-600 group-hover:text-white transition-all">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-foreground leading-tight">{client.names}</span>
                          <span className="text-[8px] font-bold text-orange-600 uppercase tracking-tighter">CLIENTE INDUSTRIAL</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-foreground/30 uppercase leading-none mb-0.5">
                          {DOCUMENT_TYPES.find(t => t.id === client.documentType)?.label || 'DNI'}
                        </span>
                        <span className="text-[10px] font-black text-foreground/80">{client.documentNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-foreground/60">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="text-[10px] font-medium truncate max-w-[180px]">{client.address || "S/D"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-black text-foreground/30 uppercase tracking-widest">{client.districtName || "LIMA"}</span>
                          {client.phone && (
                            <span className="flex items-center gap-1 text-[8px] font-bold text-orange-600/60 font-mono">
                              <Phone className="w-2 h-2" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => openEditModal(client)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-card text-foreground/30 border border-border hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button className="w-6 h-6 flex items-center justify-center rounded-lg bg-card text-foreground/30 border border-border hover:bg-foreground/5 transition-all">
                          <MoreVertical className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Wrench className="w-8 h-8 text-foreground/10 mx-auto mb-2" />
                    <p className="font-black text-[10px] uppercase tracking-widest text-foreground/30">Sin registros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Compact Footer Status */}
        <div className="px-4 py-1.5 bg-foreground/[0.02] border-t border-border flex items-center justify-between shrink-0">
          <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em]">Registros: {filteredClients.length}</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">Sincronizado</span>
          </div>
        </div>
      </div>

      {/* Registry/Edit Ultra-Compact Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isEditing ? "Editar Registro" : "Nuevo Cliente"}
      >
        <div className="bg-card w-full p-0">
          <form onSubmit={handleSubmit} className="p-4 space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              {/* Identidad */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Tipo Identidad</label>
                  <div className="relative">
                    <select
                      name="documentType"
                      value={formData.documentType}
                      onChange={handleChange}
                      className="w-full h-8 pl-2 pr-6 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-bold text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 appearance-none cursor-pointer"
                    >
                      {DOCUMENT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground/30 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Nº Documento *</label>
                  <input
                    type="text"
                    name="documentNumber"
                    required
                    value={formData.documentNumber}
                    onChange={handleChange}
                    placeholder="Número de DNI o RUC"
                    className="w-full h-8 px-2 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-bold text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Nombres o Razón Social *</label>
                <input
                  type="text"
                  name="names"
                  required
                  value={formData.names}
                  onChange={handleChange}
                  placeholder="NOMBRE COMPLETO"
                  className="w-full h-8 px-2 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-black text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 uppercase"
                />
              </div>

              {/* Contacto & Ubicación */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="999 999 999"
                  className="w-full h-8 px-2 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-bold text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className="w-full h-8 px-2 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-bold text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600"
                />
              </div>

              <div className="md:col-span-2 py-1">
                <Autocomplete
                  label="Distrito Sede *"
                  options={districts.map(d => ({ id: d.id, label: d.description }))}
                  value={formData.districtId}
                  onChange={(val) => setFormData({ ...formData, districtId: String(val) })}
                  placeholder="Buscar distrito..."
                  icon={<MapPin className="w-2.5 h-2.5" />}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Dirección de Entrega</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Calle, Número, Mz, Lt..."
                  className="w-full h-8 px-2 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-bold text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-black text-foreground/50 uppercase tracking-widest ml-1">Notas Técnicas</label>
                <textarea
                  name="observation"
                  value={formData.observation}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Detalles adicionales..."
                  className="w-full px-2 py-1.5 bg-foreground/[0.02] border border-border rounded-lg text-[11px] font-medium text-foreground focus:ring-2 focus:ring-orange-600/10 focus:border-orange-600 resize-none"
                />
              </div>
            </div>

            {/* Error/Success Feedbacks */}
            {(error || success) && (
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 animate-in fade-in duration-300 ${
                error ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
              }`}>
                {error ? <AlertCircle className="w-3 h-3 shrink-0" /> : <CheckCircle2 className="w-3 h-3 shrink-0" />}
                <p className="text-[9px] font-black uppercase tracking-tight">{error || success}</p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 rounded-lg text-[9px] font-black text-foreground/40 hover:text-foreground/60 transition-colors uppercase tracking-widest"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={creating || updating}
                className="px-5 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50 uppercase tracking-widest flex items-center gap-1.5"
              >
                {(creating || updating) ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {isEditing ? "Actualizar" : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
