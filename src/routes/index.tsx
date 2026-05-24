import { createFileRoute } from "@tanstack/react-router";
import { Users, Flame, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Olive Diet" }] }),
  component: Dashboard,
});

type Patient = Tables<"patients">;

const evolutionData = [
  { d: "Sem 1", peso: 82, meta: 80 },
  { d: "Sem 2", peso: 81.2, meta: 79.5 },
  { d: "Sem 3", peso: 80.4, meta: 79 },
  { d: "Sem 4", peso: 79.6, meta: 78.5 },
  { d: "Sem 5", peso: 78.9, meta: 78 },
  { d: "Sem 6", peso: 78.1, meta: 77.5 },
  { d: "Sem 7", peso: 77.4, meta: 77 },
  { d: "Sem 8", peso: 76.8, meta: 76.5 },
];

const macroData = [
  { dia: "Seg", carbo: 220, prot: 130, gord: 60 },
  { dia: "Ter", carbo: 200, prot: 140, gord: 55 },
  { dia: "Qua", carbo: 235, prot: 125, gord: 65 },
  { dia: "Qui", carbo: 210, prot: 145, gord: 58 },
  { dia: "Sex", carbo: 245, prot: 135, gord: 62 },
  { dia: "Sáb", carbo: 260, prot: 120, gord: 70 },
  { dia: "Dom", carbo: 225, prot: 138, gord: 64 },
];

function Dashboard() {
  const { user } = useAuth();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.status === "active").length;
  const avgCalories =
    patients.length > 0
      ? Math.round(
          patients.filter((p) => p.target_calories).reduce((s, p) => s + (p.target_calories ?? 0), 0) /
            (patients.filter((p) => p.target_calories).length || 1)
        )
      : 0;
  const avgAdherence =
    patients.length > 0
      ? Math.round(patients.reduce((s, p) => s + p.adherence, 0) / patients.length)
      : 0;
  const todayAppointments = patients.filter((p) => {
    if (!p.next_appointment) return false;
    const d = new Date(p.next_appointment);
    return d >= today && d < tomorrow;
  }).length;

  const upcomingPatients = patients
    .filter((p) => p.next_appointment)
    .sort((a, b) => new Date(a.next_appointment!).getTime() - new Date(b.next_appointment!).getTime())
    .slice(0, 4);

  const firstName = ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "")
    .split(" ")[0];

  const stats = [
    {
      label: "Total de pacientes",
      value: isLoading ? "—" : totalPatients.toString(),
      delta: `${activePatients} ativos`,
      trend: "up" as const,
      icon: Users,
      hint: "cadastrados",
    },
    {
      label: "Meta calórica média",
      value: isLoading ? "—" : avgCalories > 0 ? avgCalories.toLocaleString("pt-BR") : "—",
      delta: "kcal/dia",
      trend: "up" as const,
      icon: Flame,
      hint: "média dos pacientes",
    },
    {
      label: "Adesão média",
      value: isLoading ? "—" : avgAdherence > 0 ? `${avgAdherence}%` : "—",
      delta: avgAdherence >= 70 ? "boa adesão" : "atenção",
      trend: avgAdherence >= 70 ? ("up" as const) : ("down" as const),
      icon: TrendingUp,
      hint: "aos planos alimentares",
    },
    {
      label: "Consultas hoje",
      value: isLoading ? "—" : todayAppointments.toString(),
      delta: "agendadas",
      trend: "up" as const,
      icon: Calendar,
      hint: "para hoje",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Olá, {firstName} 👋</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Visão geral da clínica</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe pacientes, evolução e metas em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <button className="h-10 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-secondary">Exportar</button>
          <button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:bg-primary/90">Relatório semanal</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const up = s.trend === "up";
          return (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${up ? "bg-primary-soft text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {s.delta}
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-3 text-xs text-muted-foreground/80">{s.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Evolução de peso — média dos pacientes</h3>
              <p className="text-xs text-muted-foreground">Últimas 8 semanas</p>
            </div>
            <div className="flex gap-1.5 text-xs">
              {["7D", "30D", "90D", "1A"].map((p, i) => (
                <button key={p} className={`rounded-lg px-2.5 py-1.5 font-medium ${i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="gPeso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.58 0.13 155)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="oklch(0.58 0.13 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.006 150)" vertical={false} />
              <XAxis dataKey="d" stroke="oklch(0.5 0.015 160)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.5 0.015 160)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.006 150)", boxShadow: "var(--shadow-md)" }} />
              <Area type="monotone" dataKey="peso" stroke="oklch(0.58 0.13 155)" strokeWidth={2.5} fill="url(#gPeso)" />
              <Area type="monotone" dataKey="meta" stroke="oklch(0.72 0.15 160)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-5">
            <h3 className="text-base font-semibold">Próximas consultas</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Carregando..." : `${upcomingPatients.length} agendamento${upcomingPatients.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : upcomingPatients.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma consulta agendada
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingPatients.map((p) => {
                const initials = p.full_name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
                const dateStr = p.next_appointment
                  ? new Date(p.next_appointment).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "—";
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition hover:border-primary/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.goal ?? "Consulta"}</p>
                    </div>
                    <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground whitespace-nowrap">{dateStr}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Distribuição de macros — semana</h3>
            <p className="text-xs text-muted-foreground">Carboidratos · Proteínas · Gorduras (g)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Legend color="oklch(0.58 0.13 155)" label="Carbo" />
            <Legend color="oklch(0.72 0.15 160)" label="Proteína" />
            <Legend color="oklch(0.82 0.10 145)" label="Gordura" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={macroData} barCategoryGap={20}>
            <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.92 0.006 150)" vertical={false} />
            <XAxis dataKey="dia" stroke="oklch(0.5 0.015 160)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.5 0.015 160)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.006 150)" }} />
            <Bar dataKey="carbo" stackId="a" fill="oklch(0.58 0.13 155)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="prot" stackId="a" fill="oklch(0.72 0.15 160)" />
            <Bar dataKey="gord" stackId="a" fill="oklch(0.82 0.10 145)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
