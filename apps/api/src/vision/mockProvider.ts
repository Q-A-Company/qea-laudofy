import type { VisionClassificationInput, VisionClassificationResult, VisionProvider } from "./types.js";

/**
 * Classificador falso pra testar o pipeline (upload -> fila -> revisão) sem
 * gastar crédito de API enquanto não temos uma ANTHROPIC_API_KEY configurada.
 * Escolhe uma categoria aleatória plausível dentre as disponíveis, com
 * confiança também aleatória (às vezes baixa, de propósito, pra exercitar o
 * destaque de "revisão prioritária" na UI).
 */
export class MockVisionProvider implements VisionProvider {
  async classify(input: VisionClassificationInput): Promise<VisionClassificationResult> {
    // pequeno delay simulando latência de rede, pra fila/progresso serem visíveis na UI
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));

    const category =
      input.availableCategories[
        Math.floor(Math.random() * input.availableCategories.length)
      ] ?? "sala";
    const confidence = Math.round((0.4 + Math.random() * 0.6) * 100) / 100;

    return {
      category,
      confidence,
      raw: { provider: "mock", note: "resultado simulado, sem chamada de IA real" },
    };
  }
}
