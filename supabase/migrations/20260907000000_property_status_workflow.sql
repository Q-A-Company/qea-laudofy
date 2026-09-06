-- Troca o status do imóvel pelo fluxo de trabalho real pedido pela equipe:
-- pendente (cadastro em andamento) -> finalizado (dados/fotos/laudo prontos)
-- -> publicado (no ar no site). Substitui o enum anterior (rascunho/ativo/
-- inativo/vendido/alugado), que nunca chegou a ser exposto na UI.

create type property_status_new as enum ('pendente', 'finalizado', 'publicado');

alter table properties add column status_new property_status_new not null default 'pendente';

update properties set status_new = case status
  when 'ativo' then 'publicado'
  when 'vendido' then 'finalizado'
  when 'alugado' then 'finalizado'
  else 'pendente'
end::property_status_new;

alter table properties drop column status;
alter table properties rename column status_new to status;

drop type property_status;
alter type property_status_new rename to property_status;
