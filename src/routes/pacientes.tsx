import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Loader2,
  UserX,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNewPatient } from "@/contexts/NewPatientContext";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — Olive Diet" }] }),
  component: Pacientes,
});

type Patient = Tables<"patients">;
type StatusFilter = "todos" | "active" | "paused";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function statusLabel(status: string) {
  if (status === "active") return "Ativo";
  if (status === "paused") return "Pausado";
  return "Inativo";
}

function Pacientes() {
  const { open } = useNewPatient();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: patients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const { error } = await supabase.from("patients").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });

  const deletePatient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setMenuOpen(null);
    },
  });

  const filtered = patients.filter((p) => {
    const matchQ =
      p.full_name.toLowerCase().includes(q.toLowerCase()) ||
      (p.goal ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(q.toLowerCase());
    const matchStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchQ && matchStatus;
  });

  const activeCount = patients.filter((p) => p.status === "active").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6" onClick={() => setMenuOpen(null)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Carregando..."
              : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} cadastrado${patients.length !== 1 ? "s" : ""} · ${activeCount} ativo${activeCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={open}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Novo paciente
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, objetivo ou e-mail..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters); }}
          className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:bg-secondary"}`}
        >
          <Filter className="h-4 w-4" /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <p className="w-full text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
          {(["todos", "active", "paused"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s === "todos" ? "Todos" : s === "active" ? "Ativos" : "Pausados"}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Erro ao carregar pacientes: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && patients.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <UserX className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Nenhum paciente ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro paciente para começar.</p>
          <button
            onClick={open}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Cadastrar primeiro paciente
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && patients.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum paciente encontrado para "{q}".
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const isActive = p.status === "active";
            const initials = getInitials(p.full_name);

            return (
              <article
                key={p.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-base font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{p.full_name}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-primary-soft text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.age ? `${p.age} anos` : ""}
                      {p.age && p.goal ? " · " : ""}
                      {p.goal ?? "Sem objetivo definido"}
                    </p>
                  </div>
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === p.id && (
                      <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-card shadow-[var(--shadow-md)] py-1 text-sm">
                        <button
                          onClick={() => { toggleStatus.mutate({ id: p.id, currentStatus: p.status }); setMenuOpen(null); }}
                          className="w-full px-4 py-2 text-left hover:bg-secondary transition-colors"
                        >
                          {isActive ? "Pausar paciente" : "Reativar paciente"}
                        </button>
                        <hr className="border-border my-1" />
                        <button
                          onClick={() => {
                            if (confirm(`Remover ${p.full_name}?`)) deletePatient.mutate(p.id);
                          }}
                          className="w-full px-4 py-2 text-left text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Excluir paciente
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </a>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {p.phone}
                    </a>
                  )}
                  {p.next_appointment && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      Próxima: {formatDate(p.next_appointment)}
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Peso</p>
                    <p className="mt-1 text-sm font-semibold">
                      {p.weight_kg ? `${p.weight_kg} kg` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Adesão</p>
                    <p className="mt-1 text-sm font-semibold">{p.adherence}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Meta</p>
                    <p className="mt-1 text-sm font-semibold">
                      {p.target_calories ? `${p.target_calories} kcal` : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all"
                    style={{ width: `${p.adherence}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
