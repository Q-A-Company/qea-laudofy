import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { canAccessProperty, requireAuth, type AuthedRequest } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { buildReportContext } from "../report/buildContext.js";
import { convertToPdf } from "../report/convertToPdf.js";
import { renderDocx } from "../report/renderDocx.js";

const TEMPLATE_VERSION = "ficha_imovel.template.docx@2026-09-06";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function reportRoutes(app: FastifyInstance) {
  app.post<{ Params: { propertyId: string } }>(
    "/properties/:propertyId/reports",
    { preHandler: requireAuth },
    async (req: AuthedRequest & { params: { propertyId: string } }, reply) => {
      const { propertyId } = req.params;

      if (!(await canAccessProperty(req.userId!, propertyId))) {
        return reply.code(403).send({ error: "Sem permissão sobre este imóvel" });
      }

      const { data: property, error: propertyError } = await supabaseAdmin
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();
      if (propertyError || !property) {
        return reply.code(404).send({ error: "Imóvel não encontrado" });
      }

      let docxBuffer: Buffer;
      try {
        const ctx = buildReportContext(property);
        docxBuffer = await renderDocx(ctx);
      } catch (err) {
        req.log.error(err);
        return reply.code(500).send({ error: "Falha ao gerar o documento do laudo" });
      }

      const reportId = randomUUID();
      const docxPath = `${propertyId}/reports/${reportId}.docx`;
      const { error: docxUploadError } = await supabaseAdmin.storage
        .from("property-files")
        .upload(docxPath, docxBuffer, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      if (docxUploadError) {
        return reply.code(500).send({ error: `Falha ao salvar o laudo: ${docxUploadError.message}` });
      }

      let pdfPath: string | null = null;
      const pdfBuffer = await convertToPdf(docxBuffer);
      if (pdfBuffer) {
        pdfPath = `${propertyId}/reports/${reportId}.pdf`;
        const { error: pdfUploadError } = await supabaseAdmin.storage
          .from("property-files")
          .upload(pdfPath, pdfBuffer, { contentType: "application/pdf" });
        if (pdfUploadError) {
          req.log.warn(`Falha ao salvar PDF (docx ainda disponível): ${pdfUploadError.message}`);
          pdfPath = null;
        }
      }

      const { data: report, error: insertError } = await supabaseAdmin
        .from("reports")
        .insert({
          id: reportId,
          property_id: propertyId,
          generated_by: req.userId!,
          template_version: TEMPLATE_VERSION,
          docx_storage_path: docxPath,
          pdf_storage_path: pdfPath,
        })
        .select("*")
        .single();
      if (insertError || !report) {
        return reply.code(500).send({ error: "Laudo gerado, mas falhou ao registrar no banco" });
      }

      return reply.send({
        id: report.id,
        generatedAt: report.generated_at,
        docxUrl: await signedUrl(docxPath),
        pdfUrl: pdfPath ? await signedUrl(pdfPath) : null,
        pdfAvailable: pdfPath !== null,
      });
    },
  );

  app.get<{ Params: { propertyId: string } }>(
    "/properties/:propertyId/reports",
    { preHandler: requireAuth },
    async (req: AuthedRequest & { params: { propertyId: string } }, reply) => {
      const { propertyId } = req.params;
      if (!(await canAccessProperty(req.userId!, propertyId))) {
        return reply.code(403).send({ error: "Sem permissão sobre este imóvel" });
      }

      const { data: reports, error } = await supabaseAdmin
        .from("reports")
        .select("*")
        .eq("property_id", propertyId)
        .order("generated_at", { ascending: false });
      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      const withUrls = await Promise.all(
        reports.map(async (r) => ({
          id: r.id,
          generatedAt: r.generated_at,
          docxUrl: await signedUrl(r.docx_storage_path),
          pdfUrl: r.pdf_storage_path ? await signedUrl(r.pdf_storage_path) : null,
        })),
      );

      return reply.send(withUrls);
    },
  );
}

async function signedUrl(path: string): Promise<string | null> {
  const { data } = await supabaseAdmin.storage
    .from("property-files")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}
