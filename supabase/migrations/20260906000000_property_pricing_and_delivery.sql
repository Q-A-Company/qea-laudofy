-- Ajustes de negócio pedidos após revisão do formulário:
-- 1) Locação passa a ter valor próprio, além do valor do imóvel (venda).
-- 2) "Data de entrega" vira 3 opções (a combinar / imediata / data), e quando
--    é "data" o corretor só informa mês+ano ou só ano (nunca dia) - por isso
--    vira duas colunas numéricas em vez de um `date`.

alter table properties add column valor_locacao numeric(14, 2);

alter table properties drop column data_entrega;

create type data_entrega_tipo_enum as enum ('a_combinar', 'imediata', 'data');

alter table properties add column data_entrega_tipo data_entrega_tipo_enum;
alter table properties add column data_entrega_mes smallint check (data_entrega_mes between 1 and 12);
alter table properties add column data_entrega_ano smallint;

alter table properties add constraint data_entrega_regra check (
  (
    data_entrega_tipo is distinct from 'data'
    and data_entrega_mes is null
    and data_entrega_ano is null
  )
  or (
    data_entrega_tipo = 'data'
    and data_entrega_ano is not null
  )
);
