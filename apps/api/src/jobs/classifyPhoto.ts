import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { ClassifyPhotoJobData } from "../lib/queue.js";
import { createVisionProvider } from "../vision/index.js";

const visionProvider = createVisionProvider();

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export async function classifyPhotoJob(data: ClassifyPhotoJobData) {
  const { photoId } = data;

  const { data: photo, error: photoError } = await supabaseAdmin
    .from("property_photos")
    .select("id, property_id, storage_path, original_filename, batch_id")
    .eq("id", photoId)
    .single();

  if (photoError || !photo) {
    throw new Error(`Foto ${photoId} não encontrada: ${photoError?.message}`);
  }

  await supabaseAdmin
    .from("property_photos")
    .update({ processing_status: "processando" })
    .eq("id", photoId);

  try {
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from("photo_categories")
      .select("key")
      .eq("active", true);
    if (categoriesError) throw new Error(categoriesError.message);

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("property-files")
      .download(photo.storage_path);
    if (downloadError || !fileData) {
      throw new Error(`Falha ao baixar foto do storage: ${downloadError?.message}`);
    }

    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("suites, suite_master_index")
      .eq("id", photo.property_id)
      .single();

    const imageBuffer = Buffer.from(await fileData.arrayBuffer());
    const result = await visionProvider.classify({
      imageBuffer,
      mimeType: guessMimeType(photo.original_filename ?? photo.storage_path),
      availableCategories: categories.map((c) => c.key),
      propertyContext: property
        ? { suites: property.suites, suiteMasterIndex: property.suite_master_index }
        : undefined,
    });

    await supabaseAdmin
      .from("property_photos")
      .update({
        ai_suggested_category: result.category,
        ai_confidence: result.confidence,
        ai_raw_response: result.raw as never,
        processing_status: "concluido",
      })
      .eq("id", photoId);
  } catch (err) {
    await supabaseAdmin
      .from("property_photos")
      .update({
        processing_status: "erro",
        error_message: err instanceof Error ? err.message : String(err),
      })
      .eq("id", photoId);
    throw err;
  } finally {
    if (photo.batch_id) {
      await bumpBatchProgress(photo.batch_id);
    }
  }
}

async function bumpBatchProgress(batchId: string) {
  const { data: batch } = await supabaseAdmin
    .from("photo_upload_batches")
    .select("total_photos, processed_photos")
    .eq("id", batchId)
    .single();
  if (!batch) return;

  const processed = batch.processed_photos + 1;
  const done = processed >= batch.total_photos;

  await supabaseAdmin
    .from("photo_upload_batches")
    .update({
      processed_photos: processed,
      status: done ? "concluido" : "processando",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", batchId);
}
