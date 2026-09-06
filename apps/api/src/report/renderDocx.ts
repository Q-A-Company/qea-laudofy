import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// apps/api/src/report/ -> ../../../.. -> raiz do monorepo
const PROJECT_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));
const RENDER_SCRIPT = join(PROJECT_ROOT, "templates/laudo/scripts/render_report.py");

/** Chama o script Python (docxtpl) como subprocesso pra gerar o .docx do
 * laudo. Mantido em Python porque o docxtpl tem suporte nativo a RichText
 * (necessário pro aviso de locação em vermelho) - ver README para o porquê
 * dessa decisão de arquitetura. */
export async function renderDocx(ctx: Record<string, string>): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), "laudo-"));
  const outputPath = join(tmpDir, "laudo.docx");

  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("python3", [RENDER_SCRIPT, outputPath]);
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`render_report.py saiu com código ${code}: ${stderr}`));
      });
      proc.stdin.write(JSON.stringify(ctx));
      proc.stdin.end();
    });

    return await readFile(outputPath);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
