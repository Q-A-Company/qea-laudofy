import Anthropic from "@anthropic-ai/sdk";
import type { VisionClassificationInput, VisionClassificationResult, VisionProvider } from "./types.js";

/**
 * Implementação real via API de visão da Claude. NUNCA testada contra a API
 * de verdade ainda (sem ANTHROPIC_API_KEY disponível no momento em que foi
 * escrita) - revisar/testar assim que a chave estiver configurada.
 */
export class ClaudeVisionProvider implements VisionProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-haiku-4-5-20251001") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async classify(input: VisionClassificationInput): Promise<VisionClassificationResult> {
    const base64 = input.imageBuffer.toString("base64");
    const categoriesList = input.availableCategories.join(", ");

    const contextHint = input.propertyContext?.suites
      ? `O imóvel tem ${input.propertyContext.suites} suíte(s)${
          input.propertyContext.suiteMasterIndex
            ? `, sendo a suíte ${input.propertyContext.suiteMasterIndex} a master`
            : ""
        }. Use isso só como contexto auxiliar, não como fato sobre esta foto específica.`
      : "";

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.mimeType as "image/jpeg" | "image/png" | "image/webp",
                data: base64,
              },
            },
            {
              type: "text",
              text:
                `Classifique esta foto de um imóvel em UMA das categorias a seguir: ${categoriesList}. ` +
                `${contextHint} ` +
                `Responda SOMENTE com um JSON no formato {"category": "<uma das categorias exatas>", "confidence": <0 a 1>}, sem nenhum texto além do JSON.`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed: { category?: string; confidence?: number } = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      // resposta fora do formato esperado - cai no fallback abaixo
    }

    const category = input.availableCategories.includes(parsed.category ?? "")
      ? (parsed.category as string)
      : input.availableCategories[0];
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;

    return { category, confidence, raw: message };
  }
}
