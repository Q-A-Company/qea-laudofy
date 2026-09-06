-- Gap encontrado ao implementar a geração do laudo: a ficha original tem um
-- checkbox "Agendar: Sim/Não" separado da observação de agendamento, que não
-- tinha coluna própria no schema (só capturamos o texto da observação).
alter table properties add column agendamento_necessario boolean not null default false;
