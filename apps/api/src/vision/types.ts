export type VisionClassificationResult = {
  category: string;
  confidence: number; // 0-1
  raw: unknown; // resposta crua do provedor, guardada em ai_raw_response pra auditoria
};

export type VisionClassificationInput = {
  imageBuffer: Buffer;
  mimeType: string;
  /** Chaves válidas de photo_categories, pra restringir a resposta do modelo. */
  availableCategories: string[];
  /** Contexto opcional do imóvel que ajuda a desambiguar (ex: nº de suítes). */
  propertyContext?: {
    suites?: number | null;
    suiteMasterIndex?: number | null;
  };
};

export interface VisionProvider {
  classify(input: VisionClassificationInput): Promise<VisionClassificationResult>;
}
