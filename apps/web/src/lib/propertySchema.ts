import {
  BAIRRO_OPTIONS,
  DATA_ENTREGA_TIPO_OPTIONS,
  FINALIDADE_OPTIONS,
  HIDROMETRO_OPTIONS,
  PLANTA_TIPO_OPTIONS,
  POSICAO_OPTIONS,
  SOL_OPTIONS,
  TIPO_IMOVEL_COMBINAVEIS,
  type TipoImovel,
} from "@qea-laudofy/shared";
import { z } from "zod";

const CATEGORIA_OPTIONS = [
  "apartamento",
  "casa",
  "cobertura",
  "sitio",
  "terreno",
  "comercial",
] as const;

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional(),
);

const optionalText = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

// Telefone não tem validação de formato: números estrangeiros variam demais
// pra valer travar o campo (o PhoneField só formata visualmente, nunca bloqueia).

const CEP_REGEX = /^\d{5}-?\d{3}$/;

const optionalCep = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().regex(CEP_REGEX, "CEP inválido. Ex: 22640-100").optional(),
);

const optionalEmail = z
  .string()
  .email("E-mail inválido")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

export const propertyFormSchema = z
  .object({
    // Step 1 - Localização e tipo
    cantoDePedra: z.boolean().default(false),
    categoria: z.enum(CATEGORIA_OPTIONS, {
      message: "Selecione o tipo do imóvel",
    }),
    tipoComercialSubtipos: z.array(z.enum(TIPO_IMOVEL_COMBINAVEIS as [TipoImovel, ...TipoImovel[]])).default([]),
    plantaTipo: z.enum(PLANTA_TIPO_OPTIONS).optional(),
    bairro: z.enum(BAIRRO_OPTIONS).optional(),
    bairroOutro: optionalText,
    endereco: z.string().min(1, "Informe o endereço"),
    cep: optionalCep,
    localizacao: optionalText,
    condominioNome: optionalText,
    edificio: optionalText,
    posicao: z.array(z.enum(POSICAO_OPTIONS)).default([]),
    sol: z.array(z.enum(SOL_OPTIONS)).default([]),

    // Step 2 - Logística e proprietário
    imovelOcupacao: z.enum(["vazio", "ocupado"]).optional(),
    agendamentoNecessario: z.boolean().default(false),
    agendamentoObs: optionalText,
    chaveDisponivel: z.boolean().default(false),
    chaveNumero: optionalText,
    placaInstalada: z.boolean().default(false),
    placaNumero: optionalText,
    proprietarioNome: optionalText,
    proprietarioTelefones: optionalText,
    proprietarioEmail: optionalEmail,
    conjugeNome: optionalText,
    conjugeTelefone: optionalText,
    conjugeEmail: optionalEmail,

    // Step 3 - Características físicas
    quartosPlantaOriginal: optionalNumber,
    suitesPlantaOriginal: optionalNumber,
    quartos: optionalNumber,
    suites: optionalNumber,
    banheiros: optionalNumber,
    vagas: optionalNumber,
    suiteMasterIndex: optionalNumber,
    subsolo: z.boolean().default(false),
    anoConstrucao: optionalNumber,
    elevadores: optionalNumber,
    andar: optionalText, // uso livre do corretor, sem regra fixa
    unidadesPorAndar: optionalNumber,
    areaTerreno: optionalNumber,
    areaConstruida: optionalNumber,
    hidrometro: z.enum(HIDROMETRO_OPTIONS).optional(),

    // Step 4 - Valores e condições comerciais
    condominioValor: optionalNumber,
    iptuValor: optionalNumber,
    inscricaoIptu: optionalText,
    finalidade: z
      .array(z.enum(FINALIDADE_OPTIONS))
      .min(1, "Selecione ao menos uma finalidade"),
    // "Valor do imóvel": sempre presente, independente da finalidade.
    valor: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : Number(v)),
      z.number({ message: "Informe o valor do imóvel" }).positive("Valor deve ser maior que zero"),
    ),
    // Só obrigatório quando finalidade inclui "locacao" (ver superRefine abaixo).
    valorLocacao: optionalNumber,
    dataEntregaTipo: z.enum(DATA_ENTREGA_TIPO_OPTIONS).optional(),
    // Corretor só informa mês+ano ou só ano (nunca o dia) quando tipo = "data".
    dataEntregaMes: optionalNumber,
    dataEntregaAno: optionalNumber,
    permutaAceita: z.boolean().default(false),
    permutaTipoLocal: optionalText,
    motivoVenda: optionalText,
    condicoesObs: optionalText,

    // Step 5 - Características (amenidades)
    caracteristicasImovel: z.record(z.string(), z.boolean()).default({}),
    caracteristicasCondominio: z.record(z.string(), z.boolean()).default({}),

    // Step 6 - Descrição
    // Título em destaque (negrito/maiúsculo) que abre a descrição no modelo
    // real do laudo deles, seguido da frase fixa "O imóvel vem descrito da
    // seguinte forma:" (não é um campo - é texto fixo aplicado na geração).
    descricaoTitulo: optionalText,
    descricao: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.categoria === "comercial" && data.tipoComercialSubtipos.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["tipoComercialSubtipos"],
        message: "Selecione ao menos um: Comercial, Loja ou Sala",
      });
    }
    if (data.bairro === "outros" && !data.bairroOutro) {
      ctx.addIssue({
        code: "custom",
        path: ["bairroOutro"],
        message: "Informe o bairro",
      });
    }
    if (
      data.suiteMasterIndex !== undefined &&
      data.suites !== undefined &&
      data.suiteMasterIndex > data.suites
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["suiteMasterIndex"],
        message: "Não pode ser maior que o número de suítes",
      });
    }
    if (data.finalidade.includes("locacao") && data.valorLocacao === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["valorLocacao"],
        message: "Informe o valor de locação",
      });
    }
    if (data.dataEntregaTipo === "data") {
      if (data.dataEntregaAno === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["dataEntregaAno"],
          message: "Informe ao menos o ano",
        });
      }
      if (
        data.dataEntregaMes !== undefined &&
        (data.dataEntregaMes < 1 || data.dataEntregaMes > 12)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["dataEntregaMes"],
          message: "Mês inválido",
        });
      }
    }
  });

// react-hook-form precisa do tipo de ENTRADA (antes do preprocess/transform do
// zod) para tipar os campos editáveis; o handleSubmit entrega o tipo de SAÍDA
// (já validado/convertido) para o onSubmit. Ver uso em PropertyForm/index.tsx.
export type PropertyFormInput = z.input<typeof propertyFormSchema>;
export type PropertyFormValues = z.output<typeof propertyFormSchema>;

export const CATEGORIA_LABELS: Record<(typeof CATEGORIA_OPTIONS)[number], string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  cobertura: "Cobertura",
  sitio: "Sítio",
  terreno: "Terreno",
  comercial: "Comercial/Loja/Sala",
};

export { CATEGORIA_OPTIONS };

/** Deriva o array `tipo_imovel` (regra do banco) a partir da categoria escolhida na UI. */
export function resolveTipoImovel(values: PropertyFormValues): TipoImovel[] {
  if (values.categoria === "comercial") {
    return values.tipoComercialSubtipos;
  }
  return [values.categoria];
}

export const STEP_FIELDS = {
  localizacao: [
    "cantoDePedra",
    "categoria",
    "tipoComercialSubtipos",
    "plantaTipo",
    "bairro",
    "bairroOutro",
    "endereco",
    "cep",
    "localizacao",
    "condominioNome",
    "edificio",
    "posicao",
    "sol",
  ],
  logistica: [
    "imovelOcupacao",
    "agendamentoNecessario",
    "agendamentoObs",
    "chaveDisponivel",
    "chaveNumero",
    "placaInstalada",
    "placaNumero",
    "proprietarioNome",
    "proprietarioTelefones",
    "proprietarioEmail",
    "conjugeNome",
    "conjugeTelefone",
    "conjugeEmail",
  ],
  caracteristicasFisicas: [
    "quartosPlantaOriginal",
    "suitesPlantaOriginal",
    "quartos",
    "suites",
    "banheiros",
    "vagas",
    "suiteMasterIndex",
    "subsolo",
    "anoConstrucao",
    "elevadores",
    "andar",
    "unidadesPorAndar",
    "areaTerreno",
    "areaConstruida",
    "hidrometro",
  ],
  comercial: [
    "condominioValor",
    "iptuValor",
    "inscricaoIptu",
    "finalidade",
    "valor",
    "valorLocacao",
    "dataEntregaTipo",
    "dataEntregaMes",
    "dataEntregaAno",
    "permutaAceita",
    "permutaTipoLocal",
    "motivoVenda",
    "condicoesObs",
  ],
  amenidades: ["caracteristicasImovel", "caracteristicasCondominio"],
  descricao: ["descricaoTitulo", "descricao"],
} as const satisfies Record<string, (keyof PropertyFormValues)[]>;

export type StepKey = keyof typeof STEP_FIELDS;

export const STEP_ORDER: StepKey[] = [
  "localizacao",
  "logistica",
  "caracteristicasFisicas",
  "comercial",
  "amenidades",
  "descricao",
];

export const STEP_LABELS: Record<StepKey, string> = {
  localizacao: "Localização",
  logistica: "Logística e proprietário",
  caracteristicasFisicas: "Características",
  comercial: "Valores e condições",
  amenidades: "Comodidades",
  descricao: "Descrição",
};
