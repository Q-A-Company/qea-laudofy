export type MarketingDescriptionInput = {
  tipoImovel: string[];
  bairro: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaConstruida: number | null;
  caracteristicasImovel: Record<string, boolean>;
  caracteristicasCondominio: Record<string, boolean>;
};

export interface TextGenerationProvider {
  generateMarketingDescription(input: MarketingDescriptionInput): Promise<string>;
}
