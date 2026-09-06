-- Remove a descrição de marketing por IA (a equipe decidiu não usar mais) e
-- adiciona o título em destaque que antecede a descrição no modelo real de
-- laudo deles (frase em negrito/maiúsculo + "O imóvel vem descrito da
-- seguinte forma:" fixo + corpo do texto).
alter table properties drop column if exists descricao_marketing_ia;
alter table properties add column descricao_titulo text;
