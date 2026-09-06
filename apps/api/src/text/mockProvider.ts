import type { MarketingDescriptionInput, TextGenerationProvider } from "./types.js";

// fotos_imovel/fotos_cond só indicam se existem fotos - não são comodidades
const NON_AMENITY_KEYS = new Set(["fotos_imovel", "fotos_cond"]);

const AMENITY_LABELS: Record<string, string> = {
  piscina: "piscina",
  area_gourmet: "área gourmet",
  academia: "academia",
  sauna: "sauna",
  dependencia: "dependência",
  seguranca_24h: "segurança 24h",
  salao_festa: "salão de festas",
  playground: "playground",
  quadra_esportes: "quadra de esportes",
  campo_futebol: "campo de futebol",
};

/** Descrição simples baseada em template, sem IA real - útil pra testar o
 * fluxo (e a UI) sem gastar crédito de API enquanto não há ANTHROPIC_API_KEY. */
export class MockTextProvider implements TextGenerationProvider {
  async generateMarketingDescription(input: MarketingDescriptionInput): Promise<string> {
    const partes: string[] = [];

    const tipo = input.tipoImovel[0] ?? "imóvel";
    partes.push(`Excelente ${tipo}`);
    if (input.bairro) partes.push(`localizado em ${input.bairro.replace(/_/g, " ")}`);

    const comodos: string[] = [];
    if (input.quartos) comodos.push(`${input.quartos} quarto(s)`);
    if (input.suites) comodos.push(`${input.suites} suíte(s)`);
    if (input.banheiros) comodos.push(`${input.banheiros} banheiro(s)`);
    if (input.vagas) comodos.push(`${input.vagas} vaga(s) de garagem`);
    if (comodos.length) partes.push(`com ${comodos.join(", ")}`);

    if (input.areaConstruida) partes.push(`${input.areaConstruida}m² de área construída`);

    const amenidades = [
      ...Object.entries(input.caracteristicasImovel),
      ...Object.entries(input.caracteristicasCondominio),
    ]
      .filter(([k, v]) => v && !NON_AMENITY_KEYS.has(k))
      .map(([k]) => AMENITY_LABELS[k] ?? k.replace(/_/g, " "));

    let texto = partes.join(", ") + ".";
    if (amenidades.length) {
      texto += ` Conta com ${[...new Set(amenidades)].join(", ")}.`;
    }
    texto += " Agende sua visita!";

    return texto;
  }
}
