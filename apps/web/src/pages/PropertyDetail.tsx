import type { Database } from "@qea-laudofy/shared";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarketingDescription } from "../components/MarketingDescription";
import { PhotoReview } from "../components/PhotoReview";
import { PhotoUpload } from "../components/PhotoUpload";
import { ReportSection } from "../components/ReportSection";
import { supabase } from "../lib/supabaseClient";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type Photo = Database["public"]["Tables"]["property_photos"]["Row"];
type Category = Database["public"]["Tables"]["photo_categories"]["Row"];

const ACTIVE_STATUSES = new Set(["aguardando", "processando"]);

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Imóvel</h1>
        <Link to="/dashboard" className="text-sm text-slate-600 hover:underline">
          Voltar
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!property && !error && <p className="text-slate-500">Carregando...</p>}

        {property && (
          <>
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-slate-900">
                {property.endereco}
              </h2>
              <p className="mb-4 text-sm text-slate-500">
                Status: {property.status} · Cadastrado em{" "}
                {new Date(property.created_at).toLocaleDateString("pt-BR")}
              </p>
              <MarketingDescription
                propertyId={property.id}
                initialText={property.descricao_marketing_ia}
              />
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Fotos</h3>
              <PhotoUpload propertyId={property.id} onUploaded={loadPhotos} />
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <PhotoReview photos={photos} categories={categories} onChanged={loadPhotos} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <ReportSection propertyId={property.id} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
