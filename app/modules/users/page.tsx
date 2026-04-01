"use client";

import React, { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { 
  UserPlus, 
  User, 
  Lock, 
  FileText, 
  BadgeInfo, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Building2,
  ArrowRight,
  ShieldCheck,
  UserCircle,
  Search,
  MoreVertical,
  MailIcon,
  PhoneIcon,
  Filter
} from "lucide-react";
import Modal from "@/app/components/Modal";

const SUBSIDIARIES_QUERY = gql`
  query Subsidiaries {
    subsidiaries {
      id
      name
    }
  }
`;

const USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      firstName
      username
      document
      email
      phone
      subsidiaryName
    }
  }
`;

const REGISTER_USER_MUTATION = gql`
  mutation RegisterUser(
    $name: String!
    $document: String!
    $username: String!
    $password: String!
    $email: String
    $phone: String
    $subsidiaryId: Int
  ) {
    registerUser(
      name: $name
      document: $document
      username: $username
      password: $password
      email: $email
      phone: $phone
      subsidiaryId: $subsidiaryId
    ) {
      success
      message
    }
  }
`;

interface Subsidiary {
  id: string;
  name: string;
}

interface UserListItem {
  id: string;
  firstName: string | null;
  username: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  subsidiaryName: string | null;
}

interface UsersData {
  users: UserListItem[];
}

interface SubsidiariesData {
  subsidiaries: Subsidiary[];
}

interface RegisterUserData {
  registerUser: {
    success: boolean;
    message: string;
  };
}

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    subsidiaryId: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: subsidiariesData } = useQuery<SubsidiariesData>(SUBSIDIARIES_QUERY);
  const { data: usersData, loading: loadingUsers, refetch: refetchUsers } = useQuery<UsersData>(USERS_QUERY);
  
  const subsidiaries = subsidiariesData?.subsidiaries ?? [];
  const users = usersData?.users ?? [];

  const [registerUser, { loading: registering }] = useMutation<RegisterUserData>(REGISTER_USER_MUTATION, {
    onCompleted: (data) => {
      if (data?.registerUser?.success) {
        setSuccess(data.registerUser.message);
        setFormData({
          name: "",
          document: "",
          username: "",
          password: "",
          email: "",
          phone: "",
          subsidiaryId: "",
        });
        refetchUsers();
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess("");
        }, 1500);
      } else {
        setError(data?.registerUser?.message || "Error al registrar el usuario");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    await registerUser({
      variables: {
        name: formData.name,
        document: formData.document,
        username: formData.username,
        password: formData.password,
        email: formData.email || null,
        phone: formData.phone || null,
        subsidiaryId: formData.subsidiaryId ? parseInt(formData.subsidiaryId) : null,
      },
    });
  };

  const filteredUsers = users.filter(user => 
    (user.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.document || "").includes(searchTerm)
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 transition-colors duration-300 -mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Gestión de <span className="text-orange-600">Usuarios</span>
          </h1>
          <p className="text-foreground/60 text-base max-w-2xl font-medium">
            Administra los accesos y perfiles de los colaboradores registrados en el sistema.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-600/20 hover:bg-orange-500 hover:shadow-orange-600/30 active:scale-[0.98] transition-all group shrink-0"
        >
          <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Nuevo Colaborador
        </button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, usuario o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm shadow-sm"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-4 bg-card border border-border rounded-2xl text-foreground/60 font-bold text-sm hover:bg-foreground/5 transition-colors">
          <Filter className="w-5 h-5" />
          Filtros Avanzados
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02]">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-foreground/40">Colaborador</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-foreground/40">Usuario</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-foreground/40">Sucursal</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-foreground/40">Contacto</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-foreground/40 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-10 bg-foreground/5 rounded-xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-foreground/[0.01] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-600 font-bold text-lg shadow-inner">
                          {user.firstName?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-foreground leading-tight group-hover:text-orange-600 transition-colors">
                            {user.firstName || "Usuario sin nombre"}
                          </span>
                          <span className="text-[13px] font-medium text-foreground/40">{user.document || "Sin documento"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-foreground/5 rounded-full border border-border">
                          <span className="text-[13px] font-bold text-foreground/60">{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-foreground/60">
                        <Building2 className="w-4 h-4 text-orange-600/60" />
                        <span className="text-[14px] font-semibold">{user.subsidiaryName || "Global / Sin Asignar"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        {user.email && (
                          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground/50 hover:text-foreground transition-colors cursor-pointer">
                            <MailIcon className="w-3.5 h-3.5" />
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground/50 hover:text-foreground transition-colors cursor-pointer">
                            <PhoneIcon className="w-3.5 h-3.5" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button className="p-2.5 rounded-xl border border-border/60 hover:border-orange-600/30 hover:bg-orange-600/5 transition-all text-foreground/30 hover:text-orange-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <UserCircle className="w-16 h-16" />
                      <p className="font-bold text-lg">No se encontraron colaboradores</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-8 py-6 border-t border-border flex items-center justify-between">
          <p className="text-[13px] font-bold text-foreground/40 uppercase tracking-widest">
            Mostrando {filteredUsers.length} registros
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl border border-border text-foreground/40 font-bold text-[13px] hover:bg-foreground/5 transition-all">Anterior</button>
            <button className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-[13px] shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition-all">1</button>
            <button className="px-4 py-2 rounded-xl border border-border text-foreground/40 font-bold text-[13px] hover:bg-foreground/5 transition-all">Siguiente</button>
          </div>
        </div>
      </div>

      {/* Modal de Registro */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nuevo Colaborador"
      >
        <form onSubmit={handleRegister} className="space-y-8">
          <section className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 rounded-xl bg-background border border-border">
                <BadgeInfo className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Información Personal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Nombre Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Alexander Pierce"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Documento de Identidad</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="document"
                    required
                    value={formData.document}
                    onChange={handleChange}
                    placeholder="Doc #12345678"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Teléfono / Celular</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+51 987 654 321"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 rounded-xl bg-background border border-border">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Acceso y Sucursal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Sucursal Asignada</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <select
                    name="subsidiaryId"
                    value={formData.subsidiaryId}
                    onChange={handleChange}
                    className="w-full pl-12 pr-10 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar Sucursal</option>
                    {subsidiaries.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Nombre de Usuario</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="usuario_acceso"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-foreground/40 uppercase tracking-[0.15em] ml-1">Contraseña Provisoria</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-orange-600 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-foreground/[0.01] border border-border rounded-2xl text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm font-bold tracking-widest"
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
              disabled={registering}
              className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {registering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Finalizar Registro</span>
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
