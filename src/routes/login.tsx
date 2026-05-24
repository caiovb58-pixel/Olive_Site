import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Olive Diet" }] }),
  component: Login,
});

const SPECIALTIES = [
  "Nutrição clínica",
  "Nutrição esportiva",
  "Nutrição infantil",
  "Nutrição oncológica",
  "Nutrição materno-infantil",
  "Nutrição geral",
];

function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [fullName, setFullName] = useState("");
  const [crn, setCrn] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (tab === "signup" && password !== confirmPw) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);

    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, crn, specialty, phone },
          },
        });
        if (error) throw error;

        if (data.user) {
          await supabase
            .from("profiles")
            .update({ full_name: fullName, phone, specialty })
            .eq("user_id", data.user.id);
        }

        if (data.session) {
          navigate({ to: "/" });
        } else {
          setSuccess(
            "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de entrar."
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos.");
      } else if (msg.includes("User already registered")) {
        setError("Este e-mail já está cadastrado. Faça login.");
      } else if (msg.includes("Password should be at least")) {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[image:var(--gradient-soft)]">
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-[image:var(--gradient-primary)] text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display font-bold text-xl">Olive Diet</p>
            <p className="text-[10px] uppercase tracking-widest text-white/70">Healthtech</p>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight font-display">
            Gestão clínica<br />para nutricionistas<br />modernos.
          </h2>
          <p className="text-white/80 text-lg">
            Acompanhe pacientes, planos alimentares e evolução em uma plataforma intuitiva e segura.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "2.400+", label: "Pacientes gerenciados" },
              { value: "98%", label: "Satisfação dos usuários" },
              { value: "40h", label: "Economizadas por mês" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/50 text-xs">© 2025 Olive Diet. Todos os direitos reservados.</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)]">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <p className="font-display font-bold text-xl">Olive Diet</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-md)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">
                {tab === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tab === "login"
                  ? "Entre na sua conta para continuar"
                  : "Dados do profissional de nutrição"}
              </p>
            </div>

            <div className="mb-6 flex rounded-xl bg-secondary p-1">
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); clearMessages(); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${tab === t ? "bg-card shadow-[var(--shadow-sm)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "login" ? "Entrar" : "Cadastrar"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "signup" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Nome completo <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dra. Renata Lima"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">CRN</label>
                      <input
                        type="text"
                        value={crn}
                        onChange={(e) => setCrn(e.target.value)}
                        placeholder="CRN-3 12345"
                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Telefone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Especialidade</label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary appearance-none"
                    >
                      <option value="">Selecione uma especialidade</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <hr className="border-border" />
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  E-mail <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Senha <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                    minLength={6}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-11 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {tab === "signup" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Confirmar senha <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repita a senha"
                    minLength={6}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl bg-primary-soft border border-primary/20 px-4 py-3 text-sm text-primary">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-xl bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {tab === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
