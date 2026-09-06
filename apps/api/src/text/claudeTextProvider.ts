import Anthropic from "@anthropic-ai/sdk";
import type { MarketingDescriptionInput, TextGenerationProvider } from "./types.js";

/**
 * Gera a descrição de marketing via Claude, usando SÓ características
 * marcadas (tipo, cômodos, comodidades) - nunca endereço, valor, dados do
 * proprietário ou qualquer outro campo factual/técnico do laudo. Isso é
 * proposital: a IA nunca deve inventar/alterar dados factuais, só lapidar a
 * descrição comercial a partir do que já foi marcado no formulário.
 * NUNCA testada contra a API de verdade ainda (sem ANTHROPIC_API_KEY no
 * momento em que foi escrita).
 */
export class ClaudeTextProvider implements TextGenerationProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-haiku-4-5-20251001") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateMarketingDescription(input: MarketingDescriptionInput): Promise<string> {
    const amenidades = [
      ...Object.entries(input.caracteristicasImovel),
      ...Object.entries(input.caracteristicasCondominio),
    ]
      .filter(([k, v]) => v && k !== "fotos_imovel" && k !== "fotos_cond")
      .map(([k]) => k.replace(/_/g, " "));

    const fatos = {
      tipo: input.tipoImovel.join("/"),
      bairro: input.bairro,
      quartos: input.quartos,
      suites: input.suites,
      banheiros: input.banheiros,
      vagas: input.vagas,
      area_construida_m2: input.areaConstruida,
      comodidades: amenidades,
    };

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content:
            "Escreva uma descrição de marketing curta (3-4 frases) e atrativa para um anúncio " +
            "imobiliário, em português do Brasil, usando SOMENTE os fatos abaixo. Não invente " +
            "nenhum dado (endereço, preço, nome de condomínio etc.) que não esteja listado aqui. " +
            "Responda só com o texto da descrição, sem título nem comentários.\n\n" +
            JSON.stringify(fatos, null, 2),
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text.trim() : "";
  }
}
