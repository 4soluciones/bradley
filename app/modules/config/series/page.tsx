"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Hash,
  HelpCircle,
  Plus,
  ScrollText,
  Search,
  Store,
} from "lucide-react";
import Autocomplete from "@/app/components/Autocomplete";
import Modal from "@/app/components/Modal";

/** Alineado con DOCUMENT_TYPE_CHOICES en apps/operations/models.py */
const DOCUMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "01", label: "Factura" },
  { value: "03", label: "Boleta" },
  { value: "07", label: "Nota de crédito" },
  { value: "08", label: "Nota de débito" },
  { value: "09", label: "Guía de remisión remitente" },
  { value: "31", label: "Guía de remisión transportista" },
  { value: "NE", label: "Nota de entrada (interno)" },
  { value: "NS", label: "Nota de salida (interno)" },
  { value: "00", label: "Venta interna" },
];

const SUBSIDIARIES_QUERY = gql`
  query SeriesSubsidiaries {
    subsidiaries {
      id
      name
      serial
    }
  }
`;

const SERIAL_ASSIGNED_LIST = gql`
  query SerialAssignedList {
    serialAssignedList {
      id
      subsidiaryId
      subsidiaryName
      documentType
      documentTypeLabel
      serial
    }
  }
`;

const CREATE_SERIAL_ASSIGNED = gql`
  mutation CreateSerialAssigned(
    $subsidiaryId: Int
    $documentType: String!
    $serial: String
  ) {
    createSerialAssigned(
      subsidiaryId: $subsidiaryId
      documentType: $documentType
      serial: $serial
    ) {
      success
      message
      id
    }
  }
`;

interface SubsidiaryOpt {
  id: string;
  name: string;
  serial: string;
}

interface SerialAssignedRow {
  id: number;
  subsidiaryId: number | null;
  subsidiaryName: string | null;
  documentType: string;
  documentTypeLabel: string;
  serial: string | null;
}

interface SubsidiariesData {
  subsidiaries: SubsidiaryOpt[];
}

interface SerialListData {
  serialAssignedList: SerialAssignedRow[];
}

interface CreateSerialData {
  createSerialAssigned: {
    success: boolean;
    message: string;
    id: number | null;
  };
}

export default function SeriesComprobantesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [documentType, setDocumentType] = useState("01");
  const [serial, setSerial] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: subData } = useQuery<SubsidiariesData>(SUBSIDIARIES_QUERY);
  const {
    data: listData,
    loading: loadingList,
    refetch: refetchList,
  } = useQuery<SerialListData>(SERIAL_ASSIGNED_LIST);

  const subsidiaries = subData?.subsidiaries ?? [];
  const assignedRaw = listData?.serialAssignedList;

  const [createSerialAssigned, { loading: creating }] = useMutation<CreateSerialData>(
    CREATE_SERIAL_ASSIGNED,
    {
      onCompleted: (data) => {
        if (data?.createSerialAssigned?.success) {
          setSuccess(data.createSerialAssigned.message);
          setSubsidiaryId("");
          setDocumentType("01");
          setSerial("");
          void refetchList();
          setTimeout(() => {
            setIsModalOpen(false);
            setSuccess("");
          }, 1400);
        } else {
          setError(data?.createSerialAssigned?.message ?? "No se pudo guardar la serie.");
        }
      },
      onError: (err) => {
        setError(err.message || "Error de conexión con el servidor");
      },
    }
  );

  const filtered = useMemo(() => {
    const rows = assignedRaw ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.subsidiaryName ?? "").toLowerCase().includes(q) ||
        (r.serial ?? "").toLowerCase().includes(q) ||
        r.documentTypeLabel.toLowerCase().includes(q) ||
        r.documentType.toLowerCase().includes(q)
    );
  }, [assignedRaw, searchTerm]);

  const totalCount = assignedRaw?.length ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const sid = subsidiaryId.trim();
    const serialNorm = serial.trim().toUpperCase().slice(0, 6);

    await createSerialAssigned({
      variables: {
        subsidiaryId: sid ? Number(sid) : null,
        documentType,
        serial: serialNorm || null,
      },
    });
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 transition-colors duration-300 -mt-2">
      <nav className="text-sm font-semibold text-foreground/50">
        <Link
          href="/modules/config"
          className="text-orange-600 hover:text-orange-500 hover:underline"
        >
          Configuración
        </Link>
        <span className="mx-2 text-foreground/30">/</span>
        <span className="text-foreground/70">Series de comprobantes</span>
      </nav>

      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-orange-500/[0.06] p-8 sm:p-10 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">
              <ScrollText className="h-3.5 w-3.5" />
              Configuración fiscal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Series de <span className="text-orange-600">comprobantes</span>
            </h1>
            <p className="text-foreground/65 text-base font-medium leading-relaxed">
              Asigna la serie electrónica o correlativo por sucursal y tipo de documento (factura,
              boleta, notas, guías). Ideal para operar varias tiendas de ferretería y cumplir con
              SUNAT sin mezclar series entre sedes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setError("");
              setSuccess("");
            }}
            className="relative flex shrink-0 items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-600/25 transition-all hover:bg-orange-500 hover:shadow-orange-600/35 active:scale-[0.98] group"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Nueva serie
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/30" />
          <input
            type="search"
            placeholder="Buscar por sucursal, tipo o serie (ej. F001)…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-sm font-medium text-foreground shadow-sm placeholder:text-foreground/35 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-foreground/[0.02] px-4 py-3 text-sm text-foreground/55">
          <HelpCircle className="h-5 w-5 shrink-0 text-orange-600/70" />
          <span className="font-semibold">
            {totalCount === 1
              ? "1 serie registrada"
              : `${totalCount} series registradas`}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-border bg-foreground/[0.02] px-4 py-3 text-[11px] font-black uppercase tracking-wider text-foreground/45 sm:px-6">
          <span className="min-w-0">Sucursal</span>
          <span className="hidden sm:block w-40">Tipo</span>
          <span className="w-24 text-center">Serie</span>
          <span className="w-10" />
        </div>

        {loadingList ? (
          <div className="space-y-2 p-4 sm:p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-foreground/[0.04]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <FileText className="h-14 w-14 text-foreground/15" />
            <p className="text-lg font-bold text-foreground/45">
              {searchTerm ? "Sin resultados para la búsqueda" : "Aún no hay series asignadas"}
            </p>
            <p className="max-w-md text-sm text-foreground/40">
              Registra la primera serie desde el botón <strong className="text-foreground/60">Nueva serie</strong>.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-orange-500/[0.03] sm:grid-cols-[1fr_auto_auto] sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md shadow-orange-600/20">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      {r.subsidiaryName ?? "Todas las sucursales"}
                    </p>
                    <p className="text-xs font-semibold text-foreground/40">
                      {r.subsidiaryId != null ? `ID sucursal ${r.subsidiaryId}` : "Sin sede fija"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="inline-flex max-w-full items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground/80">
                    <span className="truncate">{r.documentTypeLabel}</span>
                    <span className="ml-1.5 shrink-0 rounded bg-foreground/10 px-1 font-mono text-[10px] text-foreground/50">
                      {r.documentType}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-mono text-sm font-black tracking-widest text-orange-600 sm:text-right sm:min-w-[5.5rem]">
                    {r.serial ?? "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar serie de comprobante"
      >
        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          <input type="text" name="fake" className="hidden" readOnly aria-hidden />

          <section className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-xl border border-border bg-background p-2">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Sede y documento</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Autocomplete
                  label="Sucursal (opcional)"
                  placeholder="Seleccionar tienda / sede"
                  options={subsidiaries.map((s) => ({
                    id: String(s.id),
                    label: `${s.name}`,
                  }))}
                  value={subsidiaryId}
                  onChange={(val) => {
                    setSubsidiaryId(val.toString());
                    setError("");
                  }}
                  icon={<Store className="h-5 w-5" />}
                />
                <p className="mt-2 text-xs font-medium text-foreground/45">
                  Si no eliges sucursal, la fila quedará sin sede fija (útil solo en casos
                  excepcionales).
                </p>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.15em] text-foreground/40">
                  Tipo de comprobante
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/25" />
                  <select
                    value={documentType}
                    onChange={(e) => {
                      setDocumentType(e.target.value);
                      setError("");
                    }}
                    className="w-full appearance-none rounded-2xl border border-border bg-foreground/[0.01] py-4 pl-12 pr-10 text-sm font-bold text-foreground focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/10"
                  >
                    {DOCUMENT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30">
                    ▾
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-black uppercase tracking-[0.15em] text-foreground/40">
                  Serie (máx. 6 caracteres)
                </label>
                <div className="group relative">
                  <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/20 transition-colors group-focus-within:text-orange-600" />
                  <input
                    type="text"
                    name="serial"
                    maxLength={6}
                    value={serial}
                    onChange={(e) => {
                      setSerial(e.target.value.toUpperCase());
                      setError("");
                    }}
                    onFocus={(e) => e.target.removeAttribute("readonly")}
                    readOnly
                    placeholder="Ej. F001"
                    className="w-full rounded-2xl border border-border bg-foreground/[0.01] py-4 pl-12 pr-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground placeholder:text-foreground/30 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>
              </div>
            </div>
          </section>

          {(error || success) && (
            <div
              className={`flex items-center gap-4 rounded-3xl border p-5 text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
                error
                  ? "border-red-500/10 bg-red-500/5 text-red-600"
                  : "border-emerald-500/10 bg-emerald-500/5 text-emerald-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 ${error ? "bg-red-500/10" : "bg-emerald-500/10"}`}
              >
                {error ? (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                )}
              </div>
              <p>{error || success}</p>
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-2xl bg-foreground/5 px-8 py-4 text-sm font-bold text-foreground/60 transition-all hover:bg-foreground/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-orange-600/30 transition-all hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 group"
            >
              {creating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Guardando…
                </>
              ) : (
                <>
                  Guardar serie
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
