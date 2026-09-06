import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATE_BINARIES = ["soffice", "libreoffice"];

/** Converte um .docx em .pdf via LibreOffice headless. Retorna null (em vez
 * de lançar erro) quando o binário não está instalado - a imagem Docker de
 * produção precisa ter LibreOffice; em dev local sem ele, o laudo ainda fica
 * disponível em DOCX, só o PDF fica indisponível até o binário existir. */
export async function convertToPdf(docxBuffer: Buffer): Promise<Buffer | null> {
  const tmpDir = await mkdtemp(join(tmpdir(), "laudo-pdf-"));
  const docxPath = join(tmpDir, "laudo.docx");
  const pdfPath = join(tmpDir, "laudo.pdf");

  try {
    await writeFile(docxPath, docxBuffer);

    for (const binary of CANDIDATE_BINARIES) {
      const ok = await tryConvert(binary, docxPath, tmpDir);
      if (ok) {
        return await readFile(pdfPath);
      }
    }
    return null;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

function tryConvert(binary: string, docxPath: string, outDir: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(binary, ["--headless", "--convert-to", "pdf", "--outdir", outDir, docxPath]);
    proc.on("error", () => resolve(false)); // binário não encontrado (ENOENT)
    proc.on("close", (code) => resolve(code === 0));
  });
}
