import type { FastifyInstance } from "fastify";
import { canAccessProperty, requireAuth, type AuthedRequest } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { boss, QUEUE_CLASSIFY_PHOTO } from "../lib/queue.js";

export async function photoRoutes(app: FastifyInstance) {
  app.post<{ Params: { batchId: string } }>(
    "/photo-batches/:batchId/classify",
    { preHandler: requireAuth },
    async (req: AuthedRequest & { params: { batchId: string } }, reply) => {
      const { batchId } = req.params;

      const { data: batch, error: batchError } = await supabaseAdmin
        .from("photo_upload_batches")
        .select("id, property_id")
        .eq("id", batchId)
        .single();

      if (batchError || !batch) {
        return reply.code(404).send({ error: "Lote não encontrado" });
      }

      if (!(await canAccessProperty(req.userId!, batch.property_id))) {
        return reply.code(403).send({ error: "Sem permissão sobre este imóvel" });
      }

      const { data: photos, error: photosError } = await supabaseAdmin
        .from("property_photos")
        .select("id")
        .eq("batch_id", batchId)
        .eq("processing_status", "aguardando");

      if (photosError) {
        return reply.code(500).send({ error: photosError.message });
      }

      await Promise.all(
        photos.map((p) => boss.send(QUEUE_CLASSIFY_PHOTO, { photoId: p.id })),
      );

      return reply.send({ enqueued: photos.length });
    },
  );
}
