import { ClaudeTextProvider } from "./claudeTextProvider.js";
import { MockTextProvider } from "./mockProvider.js";
import type { TextGenerationProvider } from "./types.js";

export type { MarketingDescriptionInput, TextGenerationProvider } from "./types.js";

/** Mesmo padrão do provedor de visão: sem ANTHROPIC_API_KEY, usa mock. */
export function createTextProvider(): TextGenerationProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new ClaudeTextProvider(apiKey, process.env.ANTHROPIC_TEXT_MODEL);
  }
  return new MockTextProvider();
}
