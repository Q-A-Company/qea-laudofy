import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type UploadProgress = {
  uploaded: number;
  total: number;
};

/** Sobe todos os arquivos pro Storage, cria as linhas em property_photos e
 * dispara a classificação assíncrona no backend. Não bloqueia por foto: os
 * uploads rodam em sequência simples (suficiente pro volume de ~15 corretores;
 * pode virar paralelo com limite depois se o volume de fotos por leva crescer). */
export async function uploadPropertyPhotos(
  propertyId: string,
  files: File[],
  onProgress?: (p: UploadProgress) => void,
): Promise<{ batchId: string }> {
  const { data: batch, error: batchError } = await supabase
    .from("photo_upload_batches")
    .insert({ property_id: propertyId, total_photos: files.length, status: "processando" })
    .select("id")
    .single();

  if (batchError || !batch) {
    throw new Error(batchError?.message ?? "Falha ao criar lote de upload");
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${propertyId}/photos/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-files")
      .upload(storagePath, file, { contentType: file.type });
    if (uploadError) {
      throw new Error(`Falha ao enviar ${file.name}: ${uploadError.message}`);
    }

    const { error: insertError } = await supabase.from("property_photos").insert({
      property_id: propertyId,
      batch_id: batch.id,
      storage_path: storagePath,
      original_filename: file.name,
      upload_order: i,
      processing_status: "aguardando",
    });
    if (insertError) {
      throw new Error(`Falha ao registrar ${file.name}: ${insertError.message}`);
    }

    onProgress?.({ uploaded: i + 1, total: files.length });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch(`${API_URL}/photo-batches/${batch.id}/classify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Fotos enviadas, mas falhou ao iniciar a classificação automática.");
  }

  return { batchId: batch.id };
}
