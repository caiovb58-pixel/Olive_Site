import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNewPatient } from "@/contexts/NewPatientContext";

const GOALS = [
  "Emagrecimento",
  "Hipertrofia",
  "Reeducação alimentar",
  "Performance esportiva",
  "Saúde geral",
  "Diabetes tipo 2",
  "Vegetariana / vegana",
  "Gestação",
  "Outro",
];

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  half?: boolean;
};

const fields: Field[] = [
  { name: "full_name", label: "Nome completo", placeholder: "Ex: Marina Costa", required: true },
  { name: "email", label: "E-mail", type: "email", placeholder: "paciente@email.com", half: true },
  { name: "phone", label: "Telefone", placeholder: "(11) 99999-0000", half: true },
  { name: "age", label: "Idade", type: "number", placeholder: "30", half: true },
  { name: "height_cm", label: "Altura (cm)", type: "number", placeholder: "165", half: true },
  { name: "weight_kg", label: "Peso atual (kg)", type: "number", placeholder: "70.5", half: true },
  { name: "target_calories", label: "Meta calórica (kcal)", type: "number", placeholder: "1800", half: true },
  { name: "next_appointment", label: "Próxima consulta", type: "datetime-local", half: true },
  { name: "adherence", label: "Adesão inicial (%)", type: "number", placeholder: "0", half: true },
];

export function NewPatientModal() {
  const { isOpen, close } = useNewPatient();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Record<string, string>>({ adherence: "0" });
  const [sex, setSex] = useState<"" | "M" | "F" | "outro">("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm({ adherence: "0" });
    setSex("");
    setGoal("");
    setNotes("");
    setError(null);
  }

  function handleClose() {
    reset();
    close();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("patients").insert({
        nutritionist_id: user.id,
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        age: form.age ? parseInt(form.age) : null,
        sex: sex || null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        goal: goal || null,
        target_calories: form.target_calories ? parseInt(form.target_calories) : null,
        notes: notes || null,
        next_appointment: form.next_appointment || null,
        adherence: form.adherence ? parseInt(form.adherence) : 0,
        status: "active",
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar paciente");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Novo paciente</h2>
              <p className="text-xs text-muted-foreground">Preencha os dados da ficha clínica</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
                <label className="block text-sm font-medium mb-1.5">
                  {f.label}
                  {f.required && <span className="text-destructive ml-1">*</span>}
                </label>
                <input
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                  min={f.type === "number" ? "0" : undefined}
                  step={f.name === "weight_kg" || f.name === "height_cm" ? "0.1" : undefined}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-1.5">Sexo</label>
              <div className="flex gap-2">
                {(["M", "F", "outro"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                      sex === s
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s === "M" ? "Masculino" : s === "F" ? "Feminino" : "Outro"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select
                value={form.status ?? "active"}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary transition-colors"
              >
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Objetivo principal</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      goal === g
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]"
                        : "bg-secondary text-muted-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Observações clínicas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alergias, restrições, condições de saúde relevantes..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary resize-none transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
