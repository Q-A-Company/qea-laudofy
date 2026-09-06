import type { Database } from "@qea-laudofy/shared";
import { resolveTipoImovel, type PropertyFormValues } from "./propertySchema";

type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];

function nullIfUndefined<T>(v: T | undefined): T | null {
  return v === undefined ? null : v;
}

/** Converte os valores do formulário (camelCase, agrupado por etapa) para o
 * formato de linha da tabela `properties` (snake_case). */
export function mapFormToPropertyInsert(
  values: PropertyFormValues,
  brokerId: string,
): Omit<PropertyInsert, "id" | "created_at" | "updated_at"> {
  return {
    broker_id: brokerId,
    created_by: brokerId,

    tipo_imovel: resolveTipoImovel(values),
    planta_tipo: nullIfUndefined(values.plantaTipo),
    bairro: nullIfUndefined(values.bairro),
    bairro_outro: nullIfUndefined(values.bairroOutro),
    endereco: values.endereco,
    cep: nullIfUndefined(values.cep),
    localizacao: nullIfUndefined(values.localizacao),
    condominio_nome: nullIfUndefined(values.condominioNome),
    edificio: nullIfUndefined(values.edificio),
    posicao: values.posicao,
    sol: values.sol,
    canto_de_pedra: values.cantoDePedra,

    imovel_ocupacao: nullIfUndefined(values.imovelOcupacao),
    agendamento_necessario: values.agendamentoNecessario,
    agendamento_obs: nullIfUndefined(values.agendamentoObs),
    chave_disponivel: values.chaveDisponivel,
    chave_numero: nullIfUndefined(values.chaveNumero),
    placa_instalada: values.placaInstalada,
    placa_numero: nullIfUndefined(values.placaNumero),

    proprietario_nome: nullIfUndefined(values.proprietarioNome),
    proprietario_telefones: nullIfUndefined(values.proprietarioTelefones),
    proprietario_email: nullIfUndefined(values.proprietarioEmail),
    conjuge_nome: nullIfUndefined(values.conjugeNome),
    conjuge_telefone: nullIfUndefined(values.conjugeTelefone),
    conjuge_email: nullIfUndefined(values.conjugeEmail),

    quartos_planta_original: nullIfUndefined(values.quartosPlantaOriginal),
    suites_planta_original: nullIfUndefined(values.suitesPlantaOriginal),
    quartos: nullIfUndefined(values.quartos),
    suites: nullIfUndefined(values.suites),
    banheiros: nullIfUndefined(values.banheiros),
    vagas: nullIfUndefined(values.vagas),
    suite_master_index: nullIfUndefined(values.suiteMasterIndex),
    subsolo: values.subsolo,
    ano_construcao: nullIfUndefined(values.anoConstrucao),
    elevadores: nullIfUndefined(values.elevadores),
    andar: nullIfUndefined(values.andar),
    unidades_por_andar: nullIfUndefined(values.unidadesPorAndar),

    area_terreno: nullIfUndefined(values.areaTerreno),
    area_construida: nullIfUndefined(values.areaConstruida),
    hidrometro: nullIfUndefined(values.hidrometro),
    condominio_valor: nullIfUndefined(values.condominioValor),
    iptu_valor: nullIfUndefined(values.iptuValor),
    inscricao_iptu: nullIfUndefined(values.inscricaoIptu),

    finalidade: values.finalidade,
    valor: values.valor,
    valor_locacao: nullIfUndefined(values.valorLocacao),
    data_entrega_tipo: nullIfUndefined(values.dataEntregaTipo),
    data_entrega_mes: nullIfUndefined(values.dataEntregaMes),
    data_entrega_ano: nullIfUndefined(values.dataEntregaAno),
    permuta_aceita: values.permutaAceita,
    permuta_tipo_local: nullIfUndefined(values.permutaTipoLocal),
    motivo_venda: nullIfUndefined(values.motivoVenda),
    condicoes_obs: nullIfUndefined(values.condicoesObs),

    caracteristicas_imovel: values.caracteristicasImovel,
    caracteristicas_condominio: values.caracteristicasCondominio,

    descricao: nullIfUndefined(values.descricao),
  };
}
