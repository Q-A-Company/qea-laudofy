import type { Database } from "@qea-laudofy/shared";

type Property = Database["public"]["Tables"]["properties"]["Row"];

const CHECK = "☒";
const UNCHECK = "☐";

function simNao(value: boolean | null | undefined): [string, string] {
  return value ? [CHECK, UNCHECK] : [UNCHECK, CHECK];
}

function includesChecked<T extends string>(arr: T[] | null | undefined, value: T): [string, string] {
  return simNao((arr ?? []).includes(value));
}

function jsonBool(obj: unknown, key: string): boolean {
  if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
    return Boolean((obj as Record<string, unknown>)[key]);
  }
  return false;
}

function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number | null | undefined): string {
  return n === null || n === undefined ? "" : String(n);
}

function fmtText(s: string | null | undefined): string {
  return s ?? "";
}

const MESES = [
  "",
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
];

function fmtDataEntrega(p: Property): string {
  switch (p.data_entrega_tipo) {
    case "a_combinar":
      return "A combinar";
    case "imediata":
      return "Imediata";
    case "data": {
      if (!p.data_entrega_ano) return "-";
      if (p.data_entrega_mes) return `${MESES[p.data_entrega_mes]}/${p.data_entrega_ano}`;
      return String(p.data_entrega_ano);
    }
    default:
      return "-";
  }
}

function fmtDataLaudo(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

/** Monta o contexto plano (variável -> string) esperado pelo template do
 * laudo, a partir de uma linha da tabela `properties`. Espelha o mapeamento
 * documentado em templates/laudo/scripts/build_template.py. */
export function buildReportContext(property: Property): Record<string, string> {
  const ctx: Record<string, string> = {};

  ctx.data_laudo = fmtDataLaudo(new Date());

  const [cantoPedraSim, cantoPedraNao] = simNao(property.canto_de_pedra);
  ctx.chk_canto_pedra_sim = cantoPedraSim;
  ctx.chk_canto_pedra_nao = cantoPedraNao;

  for (const tipo of ["apartamento", "casa", "cobertura", "comercial", "loja", "sala", "sitio", "terreno"] as const) {
    ctx[`chk_tipo_${tipo}`] = property.tipo_imovel.includes(tipo) ? CHECK : UNCHECK;
  }
  ctx.planta_tipo = property.planta_tipo
    ? property.planta_tipo.charAt(0).toUpperCase() + property.planta_tipo.slice(1)
    : "";

  const [bairroBT, bairroBTn] = simNao(property.bairro === "barra_da_tijuca");
  ctx.chk_bairro_barra_da_tijuca = bairroBT;
  void bairroBTn;
  ctx.chk_bairro_recreio = simNao(property.bairro === "recreio")[0];
  ctx.chk_bairro_outros = simNao(property.bairro === "outros")[0];
  ctx.bairro_outro = fmtText(property.bairro_outro);

  ctx.endereco = fmtText(property.endereco);
  ctx.cep = fmtText(property.cep);
  ctx.localizacao = fmtText(property.localizacao);
  ctx.condominio_nome = fmtText(property.condominio_nome);
  ctx.edificio = fmtText(property.edificio);

  [ctx.chk_posicao_frente] = includesChecked(property.posicao, "frente");
  [ctx.chk_posicao_fundos] = includesChecked(property.posicao, "fundos");
  [ctx.chk_posicao_lateral] = includesChecked(property.posicao, "lateral");
  [ctx.chk_sol_manha] = includesChecked(property.sol, "manha");
  [ctx.chk_sol_tarde] = includesChecked(property.sol, "tarde");

  [ctx.chk_agendar_sim, ctx.chk_agendar_nao] = simNao(property.agendamento_necessario);
  ctx.agendamento_obs = fmtText(property.agendamento_obs);
  [ctx.chk_chave_sim, ctx.chk_chave_nao] = simNao(property.chave_disponivel);
  ctx.chave_numero = fmtText(property.chave_numero);
  [ctx.chk_imovel_vazio] = simNao(property.imovel_ocupacao === "vazio");
  [ctx.chk_imovel_ocupado] = simNao(property.imovel_ocupacao === "ocupado");
  [ctx.chk_placa_sim, ctx.chk_placa_nao] = simNao(property.placa_instalada);
  ctx.placa_numero = fmtText(property.placa_numero);

  ctx.proprietario_nome = fmtText(property.proprietario_nome);
  ctx.proprietario_telefones = fmtText(property.proprietario_telefones);
  ctx.proprietario_email = fmtText(property.proprietario_email);
  ctx.conjuge_nome = fmtText(property.conjuge_nome);
  ctx.conjuge_telefone = fmtText(property.conjuge_telefone);
  ctx.conjuge_email = fmtText(property.conjuge_email);

  ctx.quartos_planta_original = fmtInt(property.quartos_planta_original);
  ctx.suites_planta_original = fmtInt(property.suites_planta_original);
  ctx.quartos = fmtInt(property.quartos);
  ctx.suites = fmtInt(property.suites);
  ctx.banheiros = fmtInt(property.banheiros);
  ctx.vagas = fmtInt(property.vagas);
  [ctx.chk_subsolo_sim, ctx.chk_subsolo_nao] = simNao(property.subsolo);
  ctx.ano_construcao = fmtInt(property.ano_construcao);
  ctx.elevadores = fmtInt(property.elevadores);
  ctx.andar = fmtText(property.andar);
  ctx.unidades_por_andar = fmtInt(property.unidades_por_andar);

  ctx.area_terreno = fmtText(property.area_terreno !== null ? fmtNumber(property.area_terreno) : "-");
  ctx.area_construida = fmtText(
    property.area_construida !== null ? `${fmtNumber(property.area_construida)} m²` : "-",
  );
  [ctx.chk_hidrometro_individual] = simNao(property.hidrometro === "individual");
  [ctx.chk_hidrometro_coletivo] = simNao(property.hidrometro === "coletivo");
  ctx.condominio_valor = fmtNumber(property.condominio_valor);
  ctx.iptu_valor = fmtNumber(property.iptu_valor);
  ctx.inscricao_iptu = fmtText(property.inscricao_iptu);

  [ctx.chk_finalidade_venda] = includesChecked(property.finalidade, "venda");
  [ctx.chk_finalidade_locacao] = includesChecked(property.finalidade, "locacao");
  ctx.valor = fmtNumber(property.valor);
  ctx.data_entrega = fmtDataEntrega(property);
  [ctx.chk_permuta_sim, ctx.chk_permuta_nao] = simNao(property.permuta_aceita);
  ctx.permuta_tipo_local = fmtText(property.permuta_tipo_local);
  ctx.condicoes_obs = fmtText(property.condicoes_obs);

  // motivo_venda é RichText no template (ver render_report.py): texto normal
  // do corretor + prefixo em vermelho quando também é pra locação.
  ctx.motivo_venda = fmtText(property.motivo_venda);
  const isLocacao = (property.finalidade ?? []).includes("locacao");
  ctx.motivo_venda_locacao_prefixo =
    isLocacao && property.valor_locacao
      ? `LOCAÇÃO: (R$ ${fmtNumber(property.valor_locacao)}) + Taxas`
      : "";

  const imovelChars = property.caracteristicas_imovel;
  for (const [field, key] of [
    ["fotos_imovel", "fotos_imovel"],
    ["sauna_imovel", "sauna"],
    ["area_gourmet_imovel", "area_gourmet"],
    ["dependencia", "dependencia"],
    ["academia_imovel", "academia"],
    ["piscina_imovel", "piscina"],
  ] as const) {
    const [sim, nao] = simNao(jsonBool(imovelChars, key));
    ctx[`chk_${field}_sim`] = sim;
    ctx[`chk_${field}_nao`] = nao;
  }

  const condChars = property.caracteristicas_condominio;
  for (const [field, key] of [
    ["fotos_cond", "fotos_cond"],
    ["playground", "playground"],
    ["area_gourmet_cond", "area_gourmet"],
    ["seguranca_24h", "seguranca_24h"],
    ["salao_festa", "salao_festa"],
    ["piscina_cond", "piscina"],
    ["campo_futebol", "campo_futebol"],
    ["quadra_esportes", "quadra_esportes"],
    ["sauna_cond", "sauna"],
    ["onibus_van", "onibus_van"],
    ["balsa_praia", "balsa_praia"],
    ["academia_cond", "academia"],
  ] as const) {
    const [sim, nao] = simNao(jsonBool(condChars, key));
    ctx[`chk_${field}_sim`] = sim;
    ctx[`chk_${field}_nao`] = nao;
  }

  // Chaves consumidas pelo render_report.py (Python) pra montar o RichText
  // do campo "Descrição" (título em negrito/maiúsculo + frase fixa + corpo
  // com rótulos em negrito automático) - não viram {{ }} simples no template.
  ctx.descricao_titulo = fmtText(property.descricao_titulo);
  ctx.descricao_corpo = fmtText(property.descricao);

  return ctx;
}
