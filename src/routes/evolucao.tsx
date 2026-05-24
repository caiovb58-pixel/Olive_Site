import { createFileRoute } from "@tanstack/react-router";
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Loader2, TrendingDown, TrendingUp, Minus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/evolucao")({
  head: () => ({ meta: [{ title: "Evolução — Olive Diet" }] }),
  component: Evolucao,
});

type Patient = Tables<"patients">;

type EvolutionRecord = {
  id: string;
  patient_id: string;
  recorded_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
};

function fmt(n: number | null | undefined, unit = "") {
  if (n == null) return "—";
  return `${n}${unit}`;
}

function ptDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function Evolucao() {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientOpen, setPatientOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Record<string, string>>({
    recorded_at: new Date().toISOString().slice(0, 10),
  });

  const { data: patients = [], isLoading: pLoading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("status", "active").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const { data: records = [], isLoading: rLoading } = useQuery<EvolutionRecord[]>({
    queryKey: ["evolution", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const { data, error } = await supabase
        .from("evolution_records")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  const addRecord = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedPatientId) throw new Error("Selecione um paciente");
      const { error } = await supabase.from("evolution_records").insert({
        patient_id: selectedPatientId,
        nutritionist_id: user.id,
        recorded_at: newRecord.recorded_at || new Date().toISOString().slice(0, 10),
        weight_kg: newRecord.weight_kg ? parseFloat(newRecord.weight_kg) : null,
        waist_cm: newRecord.waist_cm ? parseFloat(newRecord.waist_cm) : null,
        hip_cm: newRecord.hip_cm ? parseFloat(newRecord.hip_cm) : null,
        arm_cm: newRecord.arm_cm ? parseFloat(newRecord.arm_cm) : null,
        thigh_cm: newRecord.thigh_cm ? parseFloat(newRecord.thigh_cm) : null,
        body_fat_pct: newRecord.body_fat_pct ? parseFloat(newRecord.body_fat_pct) : null,
        muscle_mass_kg: newRecord.muscle_mass_kg ? parseFloat(newRecord.muscle_mass_kg) : null,
        notes: newRecord.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evolution", selectedPatientId] });
      setAddOpen(false);
      setNewRecord({ recorded_at: new Date().toISOString().slice(0, 10) });
    },
  });

  const first = records[0];
  const last = records[records.length - 1];

  const weightChange = first?.weight_kg != null && last?.weight_kg != null
    ? (last.weight_kg - first.weight_kg)
    : null;

  const weightData = records
    .filter((r) => r.weight_kg != null)
    .map((r) => ({ date: ptDate(r.recorded_at), peso: r.weight_kg }));

  const weightDomain = weightData.length > 1
    ? [Math.floor(Math.min(...weightData.map((d) => d.peso!)) - 1), Math.ceil(Math.max(...weightData.map((d) => d.peso!)) + 1)]
    : undefined;

  const measures = [
    { label: "Cintura", key: "waist_cm", unit: "cm" },
    { label: "Quadril", key: "hip_cm", unit: "cm" },
    { label: "Braço", key: "arm_cm", unit: "cm" },
    { label: "Coxa", key: "thigh_cm", unit: "cm" },
  ] as const;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evolução do paciente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedPatient
              ? `${records.length} registro${records.length !== 1 ? "s" : ""} de acompanhamento`
              : "Selecione um paciente para visualizar a evolução"}
          </p>
        </div>
        {selectedPatient && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Adicionar medição
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setPatientOpen(!patientOpen)}
          className={`flex h-12 w-full max-w-sm items-center justify-between rounded-xl border px-4 text-sm font-medium transition-colors ${
            selectedPatient ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <span>{pLoading ? "Carregando..." : selectedPatient ? selectedPatient.full_name : "Selecionar paciente..."}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        {patientOpen && (
          <div className="absolute left-0 top-14 z-20 w-full max-w-sm rounded-xl border border-border bg-card shadow-[var(--shadow-md)] max-h-64 overflow-y-auto">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPatientId(p.id); setPatientOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-secondary transition-colors ${selectedPatientId === p.id ? "bg-primary-soft text-primary" : ""}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {p.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.goal ?? "—"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedPatient ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Selecione um paciente</h3>
          <p className="mt-1 text-sm text-muted-foreground">Escolha o paciente acima para visualizar a evolução clínica.</p>
        </div>
      ) : rLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h3 className="text-lg font-semibold">Nenhuma medição registrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">Adicione a primeira medição para começar o acompanhamento.</p>
          <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Adicionar primeira medição
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KPI label="Peso inicial" value={fmt(first?.weight_kg, " kg")} />
            <KPI label="Peso atual" value={fmt(last?.weight_kg, " kg")} highlight />
            <KPI
              label="Variação de peso"
              value={weightChange != null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "—"}
              trend={weightChange != null ? (weightChange < 0 ? "down" : weightChange > 0 ? "up" : "flat") : undefined}
            />
            <KPI label="Registros" value={`${records.length}`} delta={`primeiro: ${ptDate(first?.recorded_at ?? "")}`} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="font-semibold">Curva de peso</h3>
              <p className="text-xs text-muted-foreground">{records.length} ponto(s) de acompanhamento</p>
              {weightData.length < 2 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Adicione ao menos 2 registros para exibir o gráfico.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280} className="mt-4">
                  <LineChart data={weightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.006 150)" vertical={false} />
                    <XAxis dataKey="date" stroke="oklch(0.5 0.015 160)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.5 0.015 160)" fontSize={11} tickLine={false} axisLine={false} domain={weightDomain} />
                    <Tooltip
                      formatter={(v: number) => [`${v} kg`, "Peso"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.006 150)", background: "var(--card)" }}
                    />
                    <Line type="monotone" dataKey="peso" stroke="oklch(0.58 0.13 155)" strokeWidth={3} dot={{ r: 5, fill: "oklch(0.58 0.13 155)" }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="font-semibold">Últimas medidas</h3>
              <p className="text-xs text-muted-foreground">{last ? ptDate(last.recorded_at) : "—"}</p>
              <div className="mt-5 space-y-4">
                {measures.map((m) => {
                  const firstVal = first?.[m.key] as number | null;
                  const lastVal = last?.[m.key] as number | null;
                  const diff = firstVal != null && lastVal != null ? lastVal - firstVal : null;
                  return (
                    <div key={m.key} className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{lastVal != null ? lastVal : "—"}</p>
                        {lastVal != null && <p className="text-xs text-muted-foreground">{m.unit}</p>}
                        {firstVal != null && firstVal !== lastVal && (
                          <p className="text-xs text-muted-foreground line-through">{firstVal}</p>
                        )}
                      </div>
                      {diff != null && (
                        <p className={`mt-1 text-xs font-semibold ${diff < 0 ? "text-primary" : diff > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)} {m.unit}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-semibold">Histórico de medições</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["Data", "Peso (kg)", "Cintura", "Quadril", "Braço", "Coxa", "% Gordura", "Observações"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...records].reverse().map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{ptDate(r.recorded_at)}</td>
                      <td className="px-4 py-3">{fmt(r.weight_kg)}</td>
                      <td className="px-4 py-3">{fmt(r.waist_cm, " cm")}</td>
                      <td className="px-4 py-3">{fmt(r.hip_cm, " cm")}</td>
                      <td className="px-4 py-3">{fmt(r.arm_cm, " cm")}</td>
                      <td className="px-4 py-3">{fmt(r.thigh_cm, " cm")}</td>
                      <td className="px-4 py-3">{fmt(r.body_fat_pct, "%")}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-[var(--shadow-lg)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold">Nova medição — {selectedPatient?.full_name}</h2>
              <button onClick={() => setAddOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { key: "recorded_at", label: "Data", type: "date", full: true },
                { key: "weight_kg", label: "Peso (kg)", type: "number", placeholder: "75.0" },
                { key: "body_fat_pct", label: "% Gordura", type: "number", placeholder: "25.0" },
                { key: "muscle_mass_kg", label: "Massa magra (kg)", type: "number", placeholder: "55.0" },
                { key: "waist_cm", label: "Cintura (cm)", type: "number", placeholder: "82" },
                { key: "hip_cm", label: "Quadril (cm)", type: "number", placeholder: "100" },
                { key: "arm_cm", label: "Braço (cm)", type: "number", placeholder: "30" },
                { key: "thigh_cm", label: "Coxa (cm)", type: "number", placeholder: "58" },
                { key: "notes", label: "Observações", type: "text", placeholder: "Sem edemas, boa disposição...", full: true },
              ].map(({ key, label, type, placeholder, full }) => (
                <div key={key} className={full ? "col-span-2" : ""}>
                  <label className="block text-sm font-medium mb-1.5">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={newRecord[key] ?? ""}
                    onChange={(e) => setNewRecord((r) => ({ ...r, [key]: e.target.value }))}
                    step={type === "number" ? "0.1" : undefined}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            {addRecord.isError && (
              <p className="mx-6 mb-4 rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {(addRecord.error as Error).message}
              </p>
            )}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setAddOpen(false)} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancelar</button>
              <button
                onClick={() => addRecord.mutate()}
                disabled={addRecord.isPending}
                className="flex-1 h-10 rounded-xl bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {addRecord.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar medição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, delta, highlight, trend }: {
  label: string; value: string; delta?: string; highlight?: boolean;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-[var(--shadow-sm)] ${highlight ? "border-primary/40 bg-primary-soft/40" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend === "down" && <TrendingDown className="h-4 w-4 text-primary" />}
        {trend === "up" && <TrendingUp className="h-4 w-4 text-destructive" />}
        {trend === "flat" && <Minus className="h-4 w-4 text-muted-foreground" />}
      </div>
      {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
    </div>
  );
}
