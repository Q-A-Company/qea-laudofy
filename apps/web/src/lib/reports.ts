import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type ReportSummary = {
  id: string;
  generatedAt: string;
  docxUrl: string | null;
  pdfUrl: string | null;
  pdfAvailable?: boolean;
};

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token}` };
}

export async function generateReport(propertyId: string): Promise<ReportSummary> {
  const res = await fetch(`${API_URL}/properties/${propertyId}/reports`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Falha ao gerar o laudo");
  }
  return res.json();
}

export async function listReports(propertyId: string): Promise<ReportSummary[]> {
  const res = await fetch(`${API_URL}/properties/${propertyId}/reports`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Falha ao carregar laudos gerados");
  return res.json();
}

export async function deleteReport(reportId: string): Promise<void> {
  const res = await fetch(`${API_URL}/reports/${reportId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Falha ao excluir o laudo");
  }
}
