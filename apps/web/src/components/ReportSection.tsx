import { Download, FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteReport, generateReport, listReports, type ReportSummary } from "../lib/reports";
import { Button, EmptyState } from "./ui";

export function ReportSection({ propertyId }: { propertyId: string }) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(reportId: string) {
    setDeletingId(reportId);
    setError(null);
    try {
      await deleteReport(reportId);
      setConfirmingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir o laudo");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Laudo</h2>
        <Button onClick={handleGenerate} loading={loading} size="sm">
          {!loading && "Gerar laudo"}
        </Button>
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum laudo gerado ainda" />
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm"
            >
              <span className="text-text-muted">
                {new Date(r.generatedAt).toLocaleString("pt-BR")}
              </span>

              {confirmingId === r.id ? (
                <span className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">Excluir este laudo?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-50"
                  >
                    {deletingId === r.id ? "Excluindo..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-text-muted hover:text-text"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-4">
                  {r.docxUrl && (
                    <a
                      href={r.docxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-accent-300 hover:text-accent-100"
                    >
                      <Download className="size-3.5" strokeWidth={2} />
                      DOCX
                    </a>
                  )}
                  {r.pdfUrl ? (
                    <a
                      href={r.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-accent-300 hover:text-accent-100"
                    >
                      <Download className="size-3.5" strokeWidth={2} />
                      PDF
                    </a>
                  ) : (
                    <span className="text-text-faint" title="Conversão pra PDF indisponível neste ambiente">
                      PDF indisponível
                    </span>
                  )}
                  <button
                    type="button"
                    title="Excluir laudo"
                    onClick={() => setConfirmingId(r.id)}
                    className="text-text-faint transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-4" strokeWidth={2} />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
