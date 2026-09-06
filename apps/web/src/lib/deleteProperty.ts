import { supabase } from "./supabaseClient";

/** Exclui o imóvel inteiro: fotos, lotes de upload e laudos são removidos
 * em cascata no banco (FK ON DELETE CASCADE), mas os ARQUIVOS no storage
 * (fotos e laudos gerados) precisam ser limpos manualmente antes. */
export async function deleteProperty(propertyId: string): Promise<void> {
  const [{ data: photoFiles }, { data: reportFiles }] = await Promise.all([
    supabase.storage.from("property-files").list(`${propertyId}/photos`),
    supabase.storage.from("property-files").list(`${propertyId}/reports`),
  ]);

  const paths = [
    ...(photoFiles ?? []).map((f) => `${propertyId}/photos/${f.name}`),
    ...(reportFiles ?? []).map((f) => `${propertyId}/reports/${f.name}`),
  ];
  if (paths.length) {
    await supabase.storage.from("property-files").remove(paths);
  }

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw new Error(error.message);
}
