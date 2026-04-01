"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  Store, 
  MapPin, 
  Phone, 
  Hash, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Building2,
  Globe,
  Plus,
  Search,
  MoreVertical,
  Filter,
  Navigation
} from "lucide-react";
import Autocomplete from "@/app/components/Autocomplete";
import Modal from "@/app/components/Modal";

const DISTRICTS_QUERY = gql`
  query Districts {
    districts {
      id
      description
    }
  }
`;

const SUBSIDIARIES_QUERY = gql`
  query GetSubsidiaries {
    subsidiaries {
      id
      name
      serial
      address
      phone
      districtName
    }
  }
`;

const CREATE_SUBSIDIARY_MUTATION = gql`
  mutation CreateSubsidiary(
    $name: String!
    $serial: String!
    $address: String
    $phone: String
    $districtId: String
  ) {
    createSubsidiary(
      name: $name
      serial: $serial
      address: $address
      phone: $phone
      districtId: $districtId
    ) {
      success
      message
    }
  }
`;

interface District {
  id: string;
  description: string;
}

interface Subsidiary {
  id: string;
  name: string;
  serial: string;
  address: string | null;
  phone: string | null;
  districtName: string | null;
}

interface DistrictsData {
  districts: District[];
}

interface SubsidiariesData {
  subsidiaries: Subsidiary[];
}

interface CreateSubsidiaryData {
  createSubsidiary: {
    success: boolean;
    message: string;
  };
}

export default function SubsidiariesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    serial: "",
    address: "",
    phone: "",
    districtId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: districtsData } = useQuery<DistrictsData>(DISTRICTS_QUERY);
  const { data: subsidiariesData, loading: loadingSubs, refetch: refetchSubs } = useQuery<SubsidiariesData>(SUBSIDIARIES_QUERY);
  
  const districts = districtsData?.districts ?? [];
  const subsidiaries = subsidiariesData?.subsidiaries ?? [];

  const [createSubsidiary, { loading: creating }] = useMutation<CreateSubsidiaryData>(CREATE_SUBSIDIARY_MUTATION, {
    onCompleted: (data) => {
      if (data?.createSubsidiary?.success) {
        setSuccess(data.createSubsidiary.message);
        setFormData({
          name: "",
          serial: "",
          address: "",
          phone: "",
          districtId: "",
        });
        refetchSubs();
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess("");
        }, 1500);
      } else {
        setError(data?.createSubsidiary?.message || "Error al registrar la sucursal");
      }
    },
    onError: (err) => {
      setError(err.message || "Error de conexión con el servidor");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.serial) {
      setError("El nombre y la serie son campos obligatorios");
      return;
    }

    await createSubsidiary({
      variables: {
        name: formData.name,
        serial: formData.serial,
        address: formData.address || null,
        phone: formData.phone || null,
        districtId: formData.districtId || null,
      },
    });
  };

  const filteredSubs = subsidiaries.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 transition-colors duration-300 -mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Gestión de <span className="text-orange-600">Sucursales</span>
          </h1>
          <p className="text-foreground/60 text-base max-w-2xl font-medium">
            Registra y administra las diferentes sedes de tu cadena de ferreterías Bradley.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-600/20 hover:bg-orange-500 hover:shadow-orange-600/30 active:scale-[0.98] transition-all group shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Nueva Sucursal
        </button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, serie o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm shadow-sm"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-4 bg-card border border-border rounded-2xl text-foreground/60 font-bold text-sm hover:bg-foreground/5 transition-colors">
          <Filter className="w-5 h-5" />
          Ver Estadísticas
        </button>
      </div>

      {/* Subsidiaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingSubs ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border rounded-[2.5rem] animate-pulse" />
          ))
        ) : filteredSubs.length > 0 ? (
          filteredSubs.map((sub) => (
            <div key={sub.id} className="group relative bg-card border border-border rounded-[2.5rem] p-8 hover:border-orange-600/30 hover:shadow-2xl hover:shadow-orange-600/5 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <button className="p-2 rounded-xl text-foreground/20 hover:text-foreground hover:bg-foreground/5 transition-all">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20 group-hover:rotate-6 transition-transform">
                    <Store className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-foreground leading-tight">{sub.name}</span>
                    <span className="text-[13px] font-black text-orange-600 uppercase tracking-widest">{sub.serial}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-lg bg-foreground/5">
                      <Navigation className="w-3.5 h-3.5 text-foreground/40" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-foreground/70">{sub.address || "Sin dirección"}</span>
                      <span className="text-[12px] font-bold text-foreground/30 uppercase tracking-wide">{sub.districtName || "Desconocido"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-lg bg-foreground/5">
                      <Phone className="w-3.5 h-3.5 text-foreground/40" />
                    </div>
                    <span className="text-[14px] font-bold text-foreground/60">{sub.phone || "Sin teléfono"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-tighter">Operativa</span>
                   </div>
                   <button className="text-[13px] font-black text-orange-600 flex items-center gap-1 group/btn hover:translate-x-1 transition-transform">
                      DETALLES
                      <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-3 py-20 bg-card border border-border rounded-[2.5rem] flex flex-col items-center justify-center gap-4 opacity-20">
             <Building2 className="w-20 h-20" />
             <p className="font-bold text-xl">No hay sucursales registradas</p>
          </div>
        )}
      </div>

      {/* Modal de Registro */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nueva Sucursal"
      >
        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          <input type="text" style={{ display: 'none' }} name="fake-username" />
          <input type="password" style={{ display: 'none' }} name="fake-password" />
          
          <section className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 rounded-xl bg-background border border-border">
                <Store className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Identificación de la Sede</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Nombre de la Sucursal</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="off"
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    readOnly
                    placeholder="Ej. Sede Central Sur"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Serie / Código Fiscal</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="serial"
                    required
                    maxLength={4}
                    value={formData.serial}
                    onChange={handleChange}
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    readOnly
                    autoComplete="off"
                    placeholder="Ej. F001"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 rounded-xl bg-background border border-border">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Ubicación y Contacto</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Dirección Física</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-5 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    readOnly
                    autoComplete="off"
                    placeholder="Av. Paseo de la República 123, Miraflores"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Autocomplete
                  label="Distrito"
                  placeholder="Seleccionar Distrito"
                  options={districts.map(d => ({ id: String(d.id), label: d.description || String(d.id) }))}
                  value={formData.districtId}
                  onChange={(val) => {
                    setFormData({ ...formData, districtId: val.toString() });
                    setError("");
                  }}
                  icon={<Globe className="w-5 h-5" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Teléfono de Contacto</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    readOnly
                    autoComplete="off"
                    placeholder="+51 01 2345678"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Mensajes de estado */}
          {(error || success) && (
            <div className={`flex items-center gap-4 p-5 rounded-3xl font-bold text-sm border animate-in slide-in-from-top-2 duration-300 ${
              error 
                ? 'bg-red-500/5 text-red-600 border-red-500/10' 
                : 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10'
            }`}>
              <div className={`p-2 rounded-xl ${error ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                {error ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              </div>
              <p>{error || success}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-4 bg-foreground/5 text-foreground/60 rounded-2xl font-bold text-sm hover:bg-foreground/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>Crear Nueva Sucursal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
