import { useEffect, useState } from "react";
import { generateReport, listReports, type ReportSummary } from "../lib/reports";

export function ReportSection({ propertyId }: { propertyId: string }) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setReports(await listReports(propertyId));
    } catch {
      // silencioso: a lista é conveniência, o botão de gerar é o que importa
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      await generateReport(propertyId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar o laudo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Laudo</h3>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Gerando..." : "Gerar laudo"}
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {reports.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum laudo gerado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <span className="text-slate-600">
                {new Date(r.generatedAt).toLocaleString("pt-BR")}
              </span>
              <span className="flex gap-3">
                {r.docxUrl && (
                  <a href={r.docxUrl} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                    DOCX
                  </a>
                )}
                {r.pdfUrl ? (
                  <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                    PDF
                  </a>
                ) : (
                  <span className="text-slate-400" title="Conversão pra PDF indisponível neste ambiente">
                    PDF indisponível
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
