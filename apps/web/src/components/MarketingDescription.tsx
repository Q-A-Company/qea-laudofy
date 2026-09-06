import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export function MarketingDescription({
  propertyId,
  initialText,
}: {
  propertyId: string;
  initialText: string | null;
}) {
  const [text, setText] = useState(initialText ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/properties/${propertyId}/marketing-description`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (!res.ok) throw new Error("Falha ao gerar a descrição");
      const body = await res.json();
      setText(body.descricaoMarketingIa);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar a descrição");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Descrição de marketing (gerada por IA — opcional)
        </h4>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? "Gerando..." : text ? "Gerar de novo" : "Gerar descrição"}
        </button>
      </div>
      <p className="mb-2 text-xs text-violet-600">
        Usa só as características marcadas no formulário (tipo, cômodos, comodidades) — nunca
        endereço, valores ou dados do proprietário. Revise antes de usar.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {text && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded border border-violet-200 bg-white px-2 py-1 text-sm text-slate-700"
        />
      )}
    </div>
  );
}
