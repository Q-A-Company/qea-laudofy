import { ClaudeVisionProvider } from "./claudeProvider.js";
import { MockVisionProvider } from "./mockProvider.js";
import type { VisionProvider } from "./types.js";

export type { VisionClassificationInput, VisionClassificationResult, VisionProvider } from "./types.js";

/** Troca mock -> Claude real é só isto: definir ANTHROPIC_API_KEY no .env. */
export function createVisionProvider(): VisionProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new ClaudeVisionProvider(apiKey, process.env.ANTHROPIC_VISION_MODEL);
  }
  return new MockVisionProvider();
}
