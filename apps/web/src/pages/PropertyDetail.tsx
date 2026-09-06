import type { Database } from "@qea-laudofy/shared";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PhotoReview } from "../components/PhotoReview";
import { PhotoUpload } from "../components/PhotoUpload";
import { ReportSection } from "../components/ReportSection";
import { Card, Spinner } from "../components/ui";
import { deleteProperty } from "../lib/deleteProperty";
import { PROPERTY_STATUS_OPTIONS, PROPERTY_STATUS_LABEL } from "../lib/propertyStatus";
import { supabase } from "../lib/supabaseClient";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type Photo = Database["public"]["Tables"]["property_photos"]["Row"];
type Category = Database["public"]["Tables"]["photo_categories"]["Row"];

const ACTIVE_STATUSES = new Set(["aguardando", "processando"]);

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("property_photos")
      .select("*")
      .eq("property_id", id)
      .order("upload_order", { ascending: true });
    setPhotos(data ?? []);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProperty(data);
      });
    supabase
      .from("photo_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setCategories(data ?? []));
    loadPhotos();
  }, [id, loadPhotos]);

  // enquanto alguma foto ainda está na fila/processando, repolla a cada 2s
  useEffect(() => {
    const hasActive = photos.some((p) => ACTIVE_STATUSES.has(p.processing_status));
    if (!hasActive) return;
    const interval = setInterval(loadPhotos, 2000);
    return () => clearInterval(interval);
  }, [photos, loadPhotos]);

  async function handleStatusChange(status: Property["status"]) {
    if (!property) return;
    setSavingStatus(true);
    const { error } = await supabase.from("properties").update({ status }).eq("id", property.id);
    if (!error) setProperty({ ...property, status });
    setSavingStatus(false);
  }

  async function handleDeleteProperty() {
    if (!property) return;
    setDeleting(true);
    try {
      await deleteProperty(property.id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir o imóvel");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <AppShell>
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Imóveis
      </Link>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!property && !error && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {property && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mb-1 text-xl font-semibold tracking-tight text-text">
                {property.endereco || "(sem endereço)"}
              </h1>
              <p className="text-sm text-text-muted">
                Cadastrado em {new Date(property.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={property.status}
                disabled={savingStatus}
                onChange={(e) => handleStatusChange(e.target.value as Property["status"])}
                className="rounded-lg border border-border bg-bg-inset px-3 py-2 text-sm text-text outline-none focus:border-accent-500 disabled:opacity-50"
              >
                {PROPERTY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {PROPERTY_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>

              {confirmingDelete ? (
                <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2">
                  <span className="text-xs text-danger">Excluir o imóvel inteiro?</span>
                  <button
                    type="button"
                    onClick={handleDeleteProperty}
                    disabled={deleting}
                    className="text-xs font-semibold text-danger hover:text-danger/80 disabled:opacity-50"
                  >
                    {deleting ? "Excluindo..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-xs text-text-muted hover:text-text"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  title="Excluir imóvel"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-text-faint transition-colors hover:border-danger/40 hover:text-danger"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-text">Fotos</h2>
            <PhotoUpload propertyId={property.id} onUploaded={loadPhotos} />
          </Card>

          <Card className="p-5">
            <PhotoReview photos={photos} categories={categories} onChanged={loadPhotos} />
          </Card>

          <Card className="p-5">
            <ReportSection propertyId={property.id} />
          </Card>
        </div>
      )}
    </AppShell>
  );
}
