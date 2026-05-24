import { createFileRoute } from "@tanstack/react-router";
import {
  Search, Plus, Coffee, Sun, Moon, Apple, Trash2, Loader2, ChevronDown, CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/plano-alimentar")({
  head: () => ({ meta: [{ title: "Plano Alimentar — Olive Diet" }] }),
  component: PlanoAlimentar,
});

type Patient = Tables<"patients">;

type MealItem = {
  id: string;
  food_id: string;
  name: string;
  quantity_g: number;
  energy_kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
};

type Meal = {
  id: string;
  title: string;
  time: string;
  items: MealItem[];
};

type Food = {
  id: string;
  name: string;
  category: string;
  energy_kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  fiber_g: number;
};

const DEFAULT_MEALS: Meal[] = [
  { id: "cafe", title: "Café da manhã", time: "07:30", items: [] },
  { id: "lanche_manha", title: "Lanche da manhã", time: "10:00", items: [] },
  { id: "almoco", title: "Almoço", time: "12:30", items: [] },
  { id: "lanche_tarde", title: "Lanche da tarde", time: "16:00", items: [] },
  { id: "jantar", title: "Jantar", time: "20:00", items: [] },
];

const MEAL_ICONS: Record<string, typeof Coffee> = {
  cafe: Coffee,
  lanche_manha: Apple,
  almoco: Sun,
  lanche_tarde: Apple,
  jantar: Moon,
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

function PlanoAlimentar() {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);
  const [planId, setPlanId] = useState<string | null>(null);
  const [foodQ, setFoodQ] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);

  const { data: patients = [], isLoading: pLoading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("status", "active").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  useEffect(() => {
    if (!selectedPatientId) { setMeals(DEFAULT_MEALS); setPlanId(null); return; }
    (async () => {
      const { data } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data && data.meals) {
        const rawMeals = data.meals as unknown as Meal[];
        setMeals(rawMeals.length ? rawMeals : DEFAULT_MEALS);
        setPlanId(data.id);
      } else {
        setMeals(DEFAULT_MEALS);
        setPlanId(null);
      }
    })();
  }, [selectedPatientId]);

  const { data: foods = [], isFetching: foodsFetching } = useQuery<Food[]>({
    queryKey: ["foods", foodQ],
    queryFn: async () => {
      if (!foodQ.trim()) return [];
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${foodQ}%`)
        .order("name")
        .limit(15);
      if (error) throw error;
      return data;
    },
    enabled: foodQ.length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedPatientId) throw new Error("Selecione um paciente");
      if (planId) {
        const { error } = await supabase.from("meal_plans").update({ meals: meals as unknown as Record<string, unknown>[] }).eq("id", planId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("meal_plans").insert({
          patient_id: selectedPatientId,
          nutritionist_id: user.id,
          meals: meals as unknown as Record<string, unknown>[],
        }).select().single();
        if (error) throw error;
        setPlanId(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal_plans"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function addFoodToMeal(food: Food, mealId: string) {
    const quantity = qty[food.id] ?? 100;
    const factor = quantity / 100;
    const item: MealItem = {
      id: generateId(),
      food_id: food.id,
      name: food.name,
      quantity_g: quantity,
      energy_kcal: Math.round(food.energy_kcal * factor),
      protein_g: parseFloat((food.protein_g * factor).toFixed(1)),
      carb_g: parseFloat((food.carb_g * factor).toFixed(1)),
      fat_g: parseFloat((food.fat_g * factor).toFixed(1)),
    };
    setMeals((prev) =>
      prev.map((m) => m.id === mealId ? { ...m, items: [...m.items, item] } : m)
    );
    setAddingTo(null);
    setFoodQ("");
  }

  function removeItem(mealId: string, itemId: string) {
    setMeals((prev) =>
      prev.map((m) => m.id === mealId ? { ...m, items: m.items.filter((i) => i.id !== itemId) } : m)
    );
  }

  const allItems = meals.flatMap((m) => m.items);
  const totals = allItems.reduce(
    (a, i) => ({ kcal: a.kcal + i.energy_kcal, c: a.c + i.carb_g, p: a.p + i.protein_g, g: a.g + i.fat_g }),
    { kcal: 0, c: 0, p: 0, g: 0 }
  );
  const target = selectedPatient?.target_calories ?? 2000;

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plano alimentar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedPatient
              ? `${selectedPatient.full_name} · ${selectedPatient.goal ?? "sem objetivo definido"} · meta ${target} kcal`
              : "Selecione um paciente para editar o plano"}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedPatient && (
            <>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="h-10 rounded-xl bg-[image:var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] hover:opacity-95 flex items-center gap-2"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
                {saved ? "Salvo!" : "Salvar plano"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 relative">
        <button
          onClick={() => setPatientOpen(!patientOpen)}
          className={`flex h-12 w-full max-w-sm items-center justify-between rounded-xl border px-4 text-sm font-medium transition-colors ${
            selectedPatient ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <span>
            {pLoading ? "Carregando pacientes..." : selectedPatient ? selectedPatient.full_name : "Selecionar paciente..."}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
        {patientOpen && (
          <div className="absolute left-0 top-14 z-20 w-full max-w-sm rounded-xl border border-border bg-card shadow-[var(--shadow-md)] max-h-64 overflow-y-auto">
            {patients.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum paciente ativo encontrado.</p>
            ) : (
              patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPatientId(p.id); setPatientOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-secondary transition-colors ${
                    selectedPatientId === p.id ? "bg-primary-soft text-primary" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {p.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.goal ?? "—"} · {p.target_calories ? `${p.target_calories} kcal` : "meta não definida"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!selectedPatient ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Salad className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Selecione um paciente</h3>
          <p className="mt-1 text-sm text-muted-foreground">Escolha o paciente acima para visualizar e editar o plano alimentar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {meals.map((meal) => {
              const Icon = MEAL_ICONS[meal.id] ?? Coffee;
              const mealKcal = meal.items.reduce((a, i) => a + i.energy_kcal, 0);
              return (
                <section key={meal.id} className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
                  <header className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{meal.title}</h3>
                        <p className="text-xs text-muted-foreground">{meal.time} · {mealKcal} kcal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAddingTo(addingTo === meal.id ? null : meal.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        addingTo === meal.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-background hover:border-primary hover:text-primary"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar alimento
                    </button>
                  </header>

                  {addingTo === meal.id && (
                    <div className="border-b border-border bg-secondary/30 px-6 py-4">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          autoFocus
                          value={foodQ}
                          onChange={(e) => setFoodQ(e.target.value)}
                          placeholder="Buscar alimento TACO (ex: arroz, frango...)"
                          className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      {foodsFetching && <p className="mt-2 text-xs text-muted-foreground">Buscando...</p>}
                      {foods.length > 0 && (
                        <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-card">
                          {foods.map((f) => (
                            <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{f.name}</p>
                                <p className="text-xs text-muted-foreground">{f.energy_kcal} kcal · P:{f.protein_g}g C:{f.carb_g}g G:{f.fat_g}g <span className="text-[10px]">/100g</span></p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="number"
                                  min="1"
                                  value={qty[f.id] ?? 100}
                                  onChange={(e) => setQty((q) => ({ ...q, [f.id]: parseInt(e.target.value) || 100 }))}
                                  className="h-8 w-16 rounded-lg border border-border bg-background text-center text-sm outline-none focus:border-primary"
                                />
                                <span className="text-xs text-muted-foreground">g</span>
                                <button
                                  onClick={() => addFoodToMeal(f, meal.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {foodQ.length >= 2 && !foodsFetching && foods.length === 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">Nenhum alimento encontrado para "{foodQ}".</p>
                      )}
                    </div>
                  )}

                  <div className="divide-y divide-border">
                    {meal.items.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-muted-foreground italic">Nenhum alimento adicionado.</p>
                    ) : (
                      meal.items.map((it) => (
                        <div key={it.id} className="grid grid-cols-12 items-center gap-3 px-6 py-3 text-sm hover:bg-secondary/30">
                          <div className="col-span-5 font-medium">{it.name}</div>
                          <div className="col-span-2 text-muted-foreground">{it.quantity_g}g</div>
                          <div className="col-span-1 text-right font-semibold">{it.energy_kcal}</div>
                          <div className="col-span-1 text-right text-muted-foreground text-xs">{it.carb_g}c</div>
                          <div className="col-span-1 text-right text-muted-foreground text-xs">{it.protein_g}p</div>
                          <div className="col-span-1 text-right text-muted-foreground text-xs">{it.fat_g}g</div>
                          <div className="col-span-1 text-right">
                            <button onClick={() => removeItem(meal.id, it.id)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="text-sm font-semibold text-muted-foreground">Resumo nutricional</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-4xl font-bold tracking-tight">{totals.kcal}</p>
                <p className="text-sm text-muted-foreground">/ {target} kcal</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${Math.min(100, (totals.kcal / target) * 100)}%` }} />
              </div>
              <div className="mt-6 space-y-4">
                <Macro label="Carboidratos" grams={Math.round(totals.c)} target={Math.round(target * 0.5 / 4)} color="oklch(0.58 0.13 155)" />
                <Macro label="Proteínas" grams={Math.round(totals.p)} target={Math.round(target * 0.25 / 4)} color="oklch(0.72 0.15 160)" />
                <Macro label="Gorduras" grams={Math.round(totals.g)} target={Math.round(target * 0.25 / 9)} color="oklch(0.82 0.10 145)" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="text-sm font-semibold mb-3">Buscar alimentos TACO</h3>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={foodQ}
                  onChange={(e) => setFoodQ(e.target.value)}
                  placeholder="Ex: aveia, salmão, arroz..."
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {foodQ.length < 2 ? "Digite ao menos 2 letras para buscar" : foodsFetching ? "Buscando..." : `${foods.length} resultado(s)`}
              </p>
              {!addingTo && foods.length > 0 && (
                <ul className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
                  {foods.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-secondary">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-xs">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">{f.energy_kcal} kcal · {f.protein_g}g prot</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!addingTo && foods.length === 0 && foodQ.length >= 2 && !foodsFetching && (
                <p className="mt-2 text-xs text-muted-foreground">Nenhum resultado.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Macro({ label, grams, target, color }: { label: string; grams: number; target: number; color: string }) {
  const pct = Math.min(100, Math.round((grams / Math.max(1, target)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{grams}g <span className="text-xs">/ {target}g</span></span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Salad({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21h10" /><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
      <path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1" />
      <path d="m13 12 4-4" /><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2" />
    </svg>
  );
}
