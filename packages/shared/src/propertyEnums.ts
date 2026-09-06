// Espelha os enums definidos em supabase/migrations/20260905000000_init_schema.sql.
// Mantidos aqui como fonte única de labels compartilhada entre apps/web e apps/api.

export const TIPO_IMOVEL_OPTIONS = [
  "apartamento",
  "casa",
  "cobertura",
  "comercial",
  "loja",
  "sala",
  "sitio",
  "terreno",
] as const;
export type TipoImovel = (typeof TIPO_IMOVEL_OPTIONS)[number];

// Regra de negócio (também aplicada via CHECK constraint no banco): um imóvel
// tem exatamente 1 tipo, EXCETO quando combina comercial/loja/sala.
export const TIPO_IMOVEL_COMBINAVEIS: TipoImovel[] = ["comercial", "loja", "sala"];

export const TIPO_IMOVEL_LABELS: Record<TipoImovel, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  cobertura: "Cobertura",
  comercial: "Comercial",
  loja: "Loja",
  sala: "Sala",
  sitio: "Sítio",
  terreno: "Terreno",
};

export const PLANTA_TIPO_OPTIONS = ["linear", "duplex", "triplex", "quadriplex"] as const;
export type PlantaTipo = (typeof PLANTA_TIPO_OPTIONS)[number];
export const PLANTA_TIPO_LABELS: Record<PlantaTipo, string> = {
  linear: "Linear",
  duplex: "Duplex",
  triplex: "Triplex",
  quadriplex: "Quadriplex",
};

export const BAIRRO_OPTIONS = ["barra_da_tijuca", "recreio", "outros"] as const;
export type Bairro = (typeof BAIRRO_OPTIONS)[number];
export const BAIRRO_LABELS: Record<Bairro, string> = {
  barra_da_tijuca: "Barra da Tijuca",
  recreio: "Recreio",
  outros: "Outros",
};

export const POSICAO_OPTIONS = ["frente", "fundos", "lateral"] as const;
export type Posicao = (typeof POSICAO_OPTIONS)[number];
export const POSICAO_LABELS: Record<Posicao, string> = {
  frente: "Frente",
  fundos: "Fundos",
  lateral: "Lateral",
};

export const SOL_OPTIONS = ["manha", "tarde"] as const;
export type Sol = (typeof SOL_OPTIONS)[number];
export const SOL_LABELS: Record<Sol, string> = {
  manha: "Manhã",
  tarde: "Tarde",
};

export const IMOVEL_OCUPACAO_OPTIONS = ["vazio", "ocupado"] as const;
export type ImovelOcupacao = (typeof IMOVEL_OCUPACAO_OPTIONS)[number];
export const IMOVEL_OCUPACAO_LABELS: Record<ImovelOcupacao, string> = {
  vazio: "Vazio",
  ocupado: "Ocupado",
};

export const HIDROMETRO_OPTIONS = ["individual", "coletivo"] as const;
export type Hidrometro = (typeof HIDROMETRO_OPTIONS)[number];
export const HIDROMETRO_LABELS: Record<Hidrometro, string> = {
  individual: "Individual",
  coletivo: "Coletivo",
};

export const FINALIDADE_OPTIONS = ["venda", "locacao"] as const;
export type Finalidade = (typeof FINALIDADE_OPTIONS)[number];
export const FINALIDADE_LABELS: Record<Finalidade, string> = {
  venda: "Venda",
  locacao: "Locação",
};

export const DATA_ENTREGA_TIPO_OPTIONS = ["a_combinar", "imediata", "data"] as const;
export type DataEntregaTipo = (typeof DATA_ENTREGA_TIPO_OPTIONS)[number];
export const DATA_ENTREGA_TIPO_LABELS: Record<DataEntregaTipo, string> = {
  a_combinar: "A combinar",
  imediata: "Imediata",
  data: "Data",
};

export const CARACTERISTICAS_IMOVEL_OPTIONS = [
  "fotos_imovel",
  "dependencia",
  "sauna",
  "academia",
  "area_gourmet",
  "piscina",
] as const;
export const CARACTERISTICAS_IMOVEL_LABELS: Record<
  (typeof CARACTERISTICAS_IMOVEL_OPTIONS)[number],
  string
> = {
  fotos_imovel: "Fotos do imóvel",
  dependencia: "Dependência",
  sauna: "Sauna",
  academia: "Academia",
  area_gourmet: "Área Gourmet",
  piscina: "Piscina",
};

export const CARACTERISTICAS_CONDOMINIO_OPTIONS = [
  "fotos_cond",
  "seguranca_24h",
  "campo_futebol",
  "onibus_van",
  "playground",
  "salao_festa",
  "quadra_esportes",
  "balsa_praia",
  "area_gourmet",
  "piscina",
  "sauna",
  "academia",
] as const;
export const CARACTERISTICAS_CONDOMINIO_LABELS: Record<
  (typeof CARACTERISTICAS_CONDOMINIO_OPTIONS)[number],
  string
> = {
  fotos_cond: "Fotos do condomínio",
  seguranca_24h: "Segurança 24h",
  campo_futebol: "Campo de futebol",
  onibus_van: "Ônibus/Van",
  playground: "Playground",
  salao_festa: "Salão de festa",
  quadra_esportes: "Quadra de esportes",
  balsa_praia: "Balsa para praia",
  area_gourmet: "Área Gourmet",
  piscina: "Piscina",
  sauna: "Sauna",
  academia: "Academia",
};
