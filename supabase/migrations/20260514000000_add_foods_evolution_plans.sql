-- ============================================================
-- Storage bucket for nutritionist avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar upload by owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatar update by owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar delete by owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- TACO Foods table (Tabela Brasileira de Composição de Alimentos)
-- All values per 100g
-- ============================================================
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  energy_kcal NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carb_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  fiber_g NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Foods readable by authenticated" ON public.foods FOR SELECT TO authenticated USING (true);

-- TACO Data (values per 100g)
INSERT INTO public.foods (name, category, energy_kcal, protein_g, carb_g, fat_g, fiber_g) VALUES
-- Cereais e derivados
('Arroz branco cozido','Cereais',128,2.5,28.1,0.2,1.6),
('Arroz integral cozido','Cereais',124,2.6,25.8,1.0,2.7),
('Aveia em flocos','Cereais',394,13.9,66.6,8.5,9.1),
('Pão francês','Cereais',300,8.0,58.6,3.1,2.3),
('Pão integral','Cereais',253,8.1,49.1,3.0,5.8),
('Macarrão cozido','Cereais',143,4.9,29.1,0.8,1.8),
('Macarrão integral cozido','Cereais',137,5.3,27.2,0.9,3.5),
('Quinoa cozida','Cereais',120,4.4,21.3,1.9,2.8),
('Tapioca (goma)','Cereais',361,0.7,88.7,0.1,1.2),
('Farinha de trigo','Cereais',361,9.8,75.1,1.4,2.3),
('Milho cozido','Cereais',86,3.2,18.7,1.0,2.3),
('Cuscuz de milho','Cereais',210,3.8,45.8,0.9,2.4),
('Granola tradicional','Cereais',400,8.5,67.0,11.0,5.0),
-- Leguminosas
('Feijão carioca cozido','Leguminosas',76,4.8,13.6,0.5,8.5),
('Feijão preto cozido','Leguminosas',77,4.5,14.0,0.5,8.4),
('Lentilha cozida','Leguminosas',93,7.8,15.5,0.7,7.9),
('Grão-de-bico cozido','Leguminosas',164,8.9,27.4,2.6,7.6),
('Ervilha cozida','Leguminosas',98,7.5,16.4,0.3,5.7),
('Soja cozida','Leguminosas',141,14.3,11.5,6.0,6.4),
('Tofu firme','Leguminosas',76,8.1,1.9,4.8,0.3),
('Tempeh','Leguminosas',193,19.0,9.4,10.8,7.0),
-- Carnes bovinas
('Carne bovina patinho cozido','Carnes',219,28.2,0,11.2,0),
('Carne bovina acém cozido','Carnes',237,26.1,0,14.5,0),
('Carne bovina alcatra grelhada','Carnes',211,29.0,0,10.0,0),
('Carne bovina filé mignon grelhado','Carnes',219,28.5,0,11.5,0),
('Carne moída refogada','Carnes',247,24.0,0,16.5,0),
-- Aves
('Frango peito grelhado','Aves',163,31.5,0,3.2,0),
('Frango coxa assada','Aves',213,26.0,0,11.2,0),
('Frango sobrecoxa cozida','Aves',229,23.0,0,14.5,0),
('Peito de peru assado','Aves',140,25.4,0,3.5,0),
-- Peixes e frutos do mar
('Atum em água escorrido','Peixes',111,23.5,0,1.2,0),
('Sardinha em óleo','Peixes',270,17.8,0,22.0,0),
('Salmão assado','Peixes',216,28.0,0,11.0,0),
('Tilápia grelhada','Peixes',128,26.0,0,2.7,0),
('Camarão cozido','Peixes',99,20.9,0,1.1,0),
('Bacalhau cozido','Peixes',149,32.0,0,1.4,0),
-- Suínos
('Carne suína lombo assado','Suínos',197,27.4,0,9.3,0),
('Linguiça suína assada','Suínos',346,15.5,0,31.1,0),
-- Ovos
('Ovo inteiro cozido','Ovos e laticínios',146,13.3,0.6,9.5,0),
('Ovo inteiro mexido','Ovos e laticínios',152,10.6,1.2,11.6,0),
('Clara de ovo cozida','Ovos e laticínios',52,10.9,0.7,0,0),
-- Leite e derivados
('Leite integral','Ovos e laticínios',61,3.2,4.7,3.3,0),
('Leite desnatado','Ovos e laticínios',36,3.5,5.0,0.1,0),
('Iogurte natural integral','Ovos e laticínios',66,3.9,4.6,3.3,0),
('Iogurte natural desnatado','Ovos e laticínios',43,4.3,6.0,0.1,0),
('Iogurte grego integral','Ovos e laticínios',115,5.5,6.0,7.5,0),
('Queijo mussarela','Ovos e laticínios',308,22.0,2.6,23.4,0),
('Queijo cottage','Ovos e laticínios',98,12.4,2.7,4.3,0),
('Queijo ricota','Ovos e laticínios',135,11.8,2.9,8.2,0),
('Queijo prato','Ovos e laticínios',358,22.4,0.9,29.4,0),
('Requeijão cremoso','Ovos e laticínios',244,8.5,3.2,22.6,0),
('Whey protein (concentrado)','Proteínas',370,75.0,10.0,3.0,0),
-- Frutas
('Banana prata','Frutas',98,1.3,26.0,0.1,2.0),
('Banana nanica','Frutas',92,1.4,23.8,0.1,1.9),
('Maçã','Frutas',56,0.3,15.2,0.2,1.3),
('Laranja','Frutas',37,1.0,8.9,0.1,0.8),
('Mamão papaya','Frutas',40,0.5,10.3,0.1,1.8),
('Manga','Frutas',64,0.4,17.0,0.3,1.6),
('Abacaxi','Frutas',48,0.9,12.3,0.1,1.0),
('Uva itália','Frutas',68,0.6,17.5,0.4,0.9),
('Morango','Frutas',30,0.8,7.0,0.4,2.0),
('Melancia','Frutas',27,0.6,6.9,0.1,0.4),
('Abacate','Frutas',96,1.2,6.0,8.4,6.7),
('Maracujá','Frutas',68,2.4,13.9,0.7,1.0),
('Goiaba','Frutas',54,2.6,11.6,0.6,6.2),
('Kiwi','Frutas',61,1.1,14.7,0.5,3.0),
('Pêssego','Frutas',39,0.9,9.4,0.2,1.4),
-- Verduras e legumes
('Brócolis cozido','Verduras e legumes',34,3.6,4.6,0.4,3.0),
('Espinafre cozido','Verduras e legumes',26,2.7,3.6,0.4,2.3),
('Couve refogada','Verduras e legumes',38,2.0,5.3,0.5,2.7),
('Alface','Verduras e legumes',11,1.3,1.7,0.2,1.7),
('Tomate','Verduras e legumes',15,0.9,3.1,0.2,1.2),
('Cenoura crua','Verduras e legumes',34,1.3,7.7,0.2,3.2),
('Batata inglesa cozida','Verduras e legumes',52,1.5,12.5,0.1,1.0),
('Batata-doce cozida','Verduras e legumes',86,1.3,20.6,0.1,3.0),
('Abobrinha refogada','Verduras e legumes',15,1.3,2.3,0.2,1.2),
('Chuchu cozido','Verduras e legumes',18,0.8,3.5,0.3,1.5),
('Pepino','Verduras e legumes',10,0.8,1.6,0.2,0.5),
('Cebola refogada','Verduras e legumes',25,1.0,5.7,0.1,2.2),
('Alho','Verduras e legumes',130,5.8,29.0,0.1,1.3),
('Couve-flor cozida','Verduras e legumes',21,2.4,3.2,0.1,2.4),
('Berinjela refogada','Verduras e legumes',18,0.8,4.0,0.1,1.3),
('Beterraba cozida','Verduras e legumes',39,1.9,9.1,0.1,1.5),
('Ervilha fresca','Verduras e legumes',67,5.4,11.9,0.2,5.0),
('Aspargos cozidos','Verduras e legumes',22,2.9,3.5,0.2,1.8),
-- Oleaginosas e sementes
('Amendoim torrado','Oleaginosas',567,25.8,16.1,49.2,8.5),
('Castanha do Pará','Oleaginosas',656,14.3,15.1,63.5,7.5),
('Castanha de caju torrada','Oleaginosas',570,18.5,29.1,46.4,3.3),
('Nozes','Oleaginosas',620,15.2,10.6,59.4,5.2),
('Amêndoas','Oleaginosas',578,21.2,19.7,49.9,12.5),
('Semente de chia','Oleaginosas',490,15.6,42.1,30.7,34.4),
('Linhaça dourada','Oleaginosas',495,18.3,28.9,42.2,27.3),
('Pasta de amendoim integral','Oleaginosas',598,25.1,20.3,51.1,6.0),
-- Óleos e gorduras
('Azeite de oliva extravirgem','Gorduras',884,0,0,100,0),
('Óleo de coco','Gorduras',892,0,0,99.1,0),
('Manteiga sem sal','Gorduras',726,0.4,0,83.0,0),
('Óleo de girassol','Gorduras',884,0,0,100,0),
-- Outros
('Mel','Outros',309,0.3,84.0,0,0),
('Açúcar mascavo','Outros',354,0.5,91.0,0.1,0),
('Cacau em pó (sem açúcar)','Outros',328,19.6,57.9,13.7,33.2),
('Chocolate amargo 70%','Outros',529,9.2,42.2,38.3,11.9),
('Proteína vegetal de soja (PVT)','Proteínas',330,50.0,30.0,1.0,12.0),
('Creme de leite','Laticínios',235,2.4,3.6,23.0,0);

-- ============================================================
-- Evolution Records table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evolution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  arm_cm NUMERIC,
  thigh_cm NUMERIC,
  body_fat_pct NUMERIC,
  muscle_mass_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evolution_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri view own evolution" ON public.evolution_records FOR SELECT USING (auth.uid() = nutritionist_id);
CREATE POLICY "Nutri insert own evolution" ON public.evolution_records FOR INSERT WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "Nutri update own evolution" ON public.evolution_records FOR UPDATE USING (auth.uid() = nutritionist_id);
CREATE POLICY "Nutri delete own evolution" ON public.evolution_records FOR DELETE USING (auth.uid() = nutritionist_id);
CREATE INDEX idx_evolution_patient ON public.evolution_records(patient_id, recorded_at);

-- ============================================================
-- Meal Plans table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Plano semanal',
  meals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutri view own plans" ON public.meal_plans FOR SELECT USING (auth.uid() = nutritionist_id);
CREATE POLICY "Nutri insert own plans" ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "Nutri update own plans" ON public.meal_plans FOR UPDATE USING (auth.uid() = nutritionist_id);
CREATE POLICY "Nutri delete own plans" ON public.meal_plans FOR DELETE USING (auth.uid() = nutritionist_id);

CREATE TRIGGER trg_meal_plans_updated BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
