import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  User, Settings, LogOut, Camera, Loader2, CheckCircle, Sun, Moon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useThemeContext } from "@/contexts/ThemeContext";

const SPECIALTIES = [
  "Nutrição clínica", "Nutrição esportiva", "Nutrição infantil",
  "Nutrição oncológica", "Nutrição materno-infantil", "Nutrição geral",
];

export function ProfileMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggle } = useThemeContext();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return {
        full_name: data?.full_name ?? "",
        phone: data?.phone ?? "",
        specialty: data?.specialty ?? "",
        avatar_url: data?.avatar_url ?? null,
        email: user.email ?? "",
        crn: (user.user_metadata?.crn as string | undefined) ?? "",
        user_id: user.id,
      };
    },
  });

  const [form, setForm] = useState({ full_name: "", phone: "", specialty: "", crn: "" });
  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name, phone: profile.phone, specialty: profile.specialty, crn: profile.crn });
  }, [profile]);

  const [uploading, setUploading] = useState(false);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.user_id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", profile.user_id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      console.error("Avatar upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await Promise.all([
        supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, specialty: form.specialty }).eq("user_id", user.id),
        supabase.auth.updateUser({ data: { full_name: form.full_name, crn: form.crn } }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const initials = (profile?.full_name ?? "")
    .split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("") || "?";

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-sm font-bold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-90 transition-opacity overflow-hidden"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-border bg-card shadow-[var(--shadow-lg)] py-1 text-sm">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-semibold truncate">{profile?.full_name || "Nutricionista"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); setEditOpen(true); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" /> Meu perfil
            </button>
            <button
              onClick={() => { setOpen(false); navigate({ to: "/configuracoes" }); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" /> Configurações
            </button>
            <button
              onClick={() => { toggle(); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              {theme === "dark" ? "Tema claro" : "Tema escuro"}
            </button>
            <hr className="border-border my-1" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        )}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-[var(--shadow-lg)] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-semibold text-lg">Meu perfil</h2>
              <button onClick={() => setEditOpen(false)} className="rounded-lg p-2 hover:bg-secondary transition-colors text-muted-foreground">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-2xl font-bold text-primary-foreground overflow-hidden shadow-[var(--shadow-glow)]">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                    ) : initials}
                  </div>
                  <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-90">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">Clique no ícone para alterar a foto</p>
              </div>

              <div className="space-y-4">
                <ProfileField label="Nome completo" value={form.full_name} onChange={(v) => setForm(f => ({ ...f, full_name: v }))} placeholder="Dra. Renata Lima" />
                <ProfileField label="E-mail" value={profile?.email ?? ""} onChange={() => {}} disabled hint="Não é possível alterar o e-mail" />
                <ProfileField label="CRN" value={form.crn} onChange={(v) => setForm(f => ({ ...f, crn: v }))} placeholder="CRN-3 12345" />
                <ProfileField label="Telefone" value={form.phone} onChange={(v) => setForm(f => ({ ...f, phone: v }))} placeholder="(11) 99999-0000" />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Especialidade</label>
                  <select
                    value={form.specialty}
                    onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary appearance-none"
                  >
                    <option value="">Selecione</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-6 flex gap-3">
              <button onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
                {saved ? "Salvo!" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileField({ label, value, onChange, placeholder, disabled, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
