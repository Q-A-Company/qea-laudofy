-- Retaxonomia completa das categorias de fotos (pedido da equipe: lista nova,
-- com acentuação corrigida). Também: `final_category` deixa de ter FK fixa
-- pra `photo_categories`, porque agora o corretor pode digitar um nome de
-- ambiente livre quando a lista não cobrir o caso (`ai_suggested_category`
-- continua restrita à lista fixa, é sempre o que mandamos pra IA escolher).

-- Reseta classificações existentes (só fotos de teste até agora) que
-- apontavam pras chaves antigas - senão a FK impede substituir as categorias.
update property_photos set ai_suggested_category = null, final_category = null;

alter table property_photos drop constraint if exists property_photos_final_category_fkey;

delete from photo_categories;

insert into photo_categories (key, label, display_group, sort_order) values
  ('fachada', 'Fachada', 'fachada', 10),
  ('fachada_secundaria', 'Fachada Secundária', 'fachada', 20),
  ('garagem', 'Garagem', 'fachada', 30),
  ('area_gourmet', 'Área Gourmet', 'lazer', 40),
  ('area_lazer', 'Área de Lazer', 'lazer', 50),
  ('sauna', 'Sauna', 'lazer', 60),
  ('quintal', 'Quintal', 'social', 70),
  ('sala', 'Sala', 'social', 80),
  ('sala_jantar', 'Sala de Jantar', 'social', 90),
  ('sala_tv', 'Sala de TV', 'social', 100),
  ('area_convivencia', 'Área de Convivência', 'social', 110),
  ('cozinha', 'Cozinha', 'social', 120),
  ('area_servico', 'Área de Serviço', 'social', 130),
  ('varanda', 'Varanda', 'social', 140),
  ('quarto', 'Quarto', 'quartos', 150),
  ('suite', 'Suíte', 'quartos', 160),
  ('suite_master', 'Suíte Master', 'quartos', 170),
  ('banheiro', 'Banheiro', 'quartos', 180),
  ('banheiro_suite', 'Banheiro da Suíte', 'quartos', 190),
  ('lavabo', 'Lavabo', 'social', 200),
  ('banheiro_suite_master', 'Banheiro da Suíte Master', 'quartos', 210),
  ('closet_suite', 'Closet da Suíte', 'quartos', 220),
  ('closet_suite_master', 'Closet da Suíte Master', 'quartos', 230),
  ('piscina', 'Piscina', 'lazer', 240),
  ('churrasqueira', 'Churrasqueira', 'lazer', 250),
  ('academia', 'Academia', 'lazer', 260),
  ('hall', 'Hall', 'social', 270),
  ('hall_2_pavimento', 'Hall 2º Pavimento', 'social', 280);
