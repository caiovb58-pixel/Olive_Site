import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, Lock, CreditCard, Palette, Loader2, Save, CheckCircle, Sun, Moon, Monitor,
  Shield, Mail, Smartphone, CreditCard as BillingIcon, Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useThemeContext } from "@/contexts/ThemeContext";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Olive Diet" }] }),
  component: Configuracoes,
});

type Section = "notif" | "seg" | "plan" | "aparencia" | null;

const SPECIALTIES = [
  "Nutrição clínica", "Nutrição esportiva", "Nutrição infantil",
  "Nutrição oncológica", "Nutrição materno-infantil", "Nutrição geral",
];

function Configuracoes() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useThemeContext();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return {
        full_name: data?.full_name ?? "",
        phone: data?.phone ?? "",
        specialty: data?.specialty ?? "",
        email: user.email ?? "",
        crn: (user.user_metadata?.crn as string | undefined) ?? "",
      };
    },
  });

  const [form, setForm] = useState({ full_name: "", phone: "", specialty: "", crn: "" });
  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name, phone: profile.phone, specialty: profile.specialty, crn: profile.crn });
  }, [profile]);

  // Notifications state
  const [notif, setNotif] = useState({
    consultas: true, aderencia: true, novos: false, semanal: true,
  });

  // Security
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      await Promise.all([
        supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, specialty: form.specialty }).eq("user_id", user.id),
        supabase.auth.updateUser({ data: { full_name: form.full_name, crn: form.crn } }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  async function handleChangePassword() {
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: "err", text: "As senhas não conferem." }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ type: "err", text: "A nova senha deve ter ao menos 6 caracteres." }); return; }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (error) { setPwMsg({ type: "err", text: error.message }); return; }
    setPwMsg({ type: "ok", text: "Senha alterada com sucesso!" });
    setPwForm({ current: "", next: "", confirm: "" });
  }

  const sections = [
    { id: "notif" as Section, icon: Bell, title: "Notificações", desc: "Lembretes de consulta e alertas de pacientes." },
    { id: "seg" as Section, icon: Lock, title: "Segurança", desc: "Alterar senha e autenticação." },
    { id: "plan" as Section, icon: CreditCard, title: "Plano e cobrança", desc: "Olive Diet Pro · próxima renovação 14/06." },
    { id: "aparencia" as Section, icon: Palette, title: "Aparência", desc: `Tema atual: ${theme === "light" ? "Claro" : "Escuro"}.` },
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Personalize sua conta e preferências da plataforma.</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-xl font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (form.full_name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("") || "?")}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{form.full_name || "—"}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}{form.crn ? ` · ${form.crn}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="flex items-center gap-1.5 text-sm font-medium text-primary"><CheckCircle className="h-4 w-4" /> Salvo!</span>}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || isLoading}
              className="h-10 rounded-xl bg-[image:var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60 flex items-center gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar perfil
            </button>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nome completo" value={form.full_name} onChange={(v) => setForm(f => ({ ...f, full_name: v }))} placeholder="Dra. Renata Lima" disabled={isLoading} />
          <Field label="E-mail" value={profile?.email ?? ""} onChange={() => {}} disabled hint="Não é possível alterar o e-mail aqui." />
          <Field label="CRN" value={form.crn} onChange={(v) => setForm(f => ({ ...f, crn: v }))} placeholder="CRN-3 12345" disabled={isLoading} />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm(f => ({ ...f, phone: v }))} placeholder="(11) 98765-4321" disabled={isLoading} />
          <div className="md:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Especialidade</label>
            <select
              value={form.specialty}
              onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary disabled:opacity-60 appearance-none"
            >
              <option value="">Selecione uma especialidade</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Other sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)] overflow-hidden">
              <button
                onClick={() => setActiveSection(isActive ? null : s.id)}
                className="group flex w-full items-start gap-4 p-5 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isActive ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <span className={`text-muted-foreground transition-transform ${isActive ? "rotate-90" : ""}`}>→</span>
              </button>

              {isActive && s.id === "aparencia" && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                  <p className="text-sm font-medium">Tema da interface</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "light", icon: Sun, label: "Claro" },
                      { value: "dark", icon: Moon, label: "Escuro" },
                      { value: "system", icon: Monitor, label: "Sistema" },
                    ] as const).map(({ value, icon: TIcon, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          if (value === "system") {
                            const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                            setTheme(sys);
                          } else {
                            setTheme(value);
                          }
                        }}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                          (value === "system" ? false : theme === value)
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <TIcon className="h-5 w-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isActive && s.id === "notif" && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-3">
                  {[
                    { key: "consultas" as const, icon: Bell, label: "Lembretes de consultas", desc: "Notificar 1h antes de cada consulta" },
                    { key: "aderencia" as const, icon: Zap, label: "Alertas de aderência", desc: "Alertar quando adesão cair abaixo de 70%" },
                    { key: "novos" as const, icon: Mail, label: "Confirmações de cadastro", desc: "E-mail quando um paciente é cadastrado" },
                    { key: "semanal" as const, icon: Smartphone, label: "Relatório semanal", desc: "Resumo semanal de todos os pacientes" },
                  ].map(({ key, icon: NIcon, label, desc }) => (
                    <div key={key} className="flex items-start gap-3">
                      <NIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotif(n => ({ ...n, [key]: !n[key] }))}
                        className={`relative h-6 w-11 rounded-full transition-colors ${notif[key] ? "bg-primary" : "bg-secondary"}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notif[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isActive && s.id === "seg" && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Shield className="h-4 w-4" />
                    <span>Alterar senha da conta</span>
                  </div>
                  {[
                    { key: "next", label: "Nova senha", placeholder: "Mínimo 6 caracteres" },
                    { key: "confirm", label: "Confirmar nova senha", placeholder: "Repita a nova senha" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                      <input
                        type="password"
                        placeholder={placeholder}
                        value={pwForm[key as keyof typeof pwForm]}
                        onChange={(e) => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  {pwMsg && (
                    <p className={`text-sm rounded-xl px-3 py-2 ${pwMsg.type === "ok" ? "bg-primary-soft text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {pwMsg.text}
                    </p>
                  )}
                  <button
                    onClick={handleChangePassword}
                    className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-95"
                  >
                    Alterar senha
                  </button>
                </div>
              )}

              {isActive && s.id === "plan" && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                  <div className="rounded-xl bg-primary-soft border border-primary/20 p-4">
                    <div className="flex items-center gap-2">
                      <BillingIcon className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-primary">Olive Diet Pro</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Acesso ilimitado a pacientes, planos e histórico clínico.</p>
                    <p className="mt-3 text-xs text-muted-foreground">Próxima renovação: <strong>14 de junho de 2025</strong></p>
                  </div>
                  <div className="space-y-2 text-sm">
                    {["Pacientes ilimitados", "Tabela TACO completa", "Exportação de relatórios", "Suporte prioritário"].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button className="h-10 w-full rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    Gerenciar assinatura
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}
