import type { FastifyInstance } from "fastify";
import { canAccessProperty, requireAuth, type AuthedRequest } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { createTextProvider } from "../text/index.js";

const textProvider = createTextProvider();

export async function marketingRoutes(app: FastifyInstance) {
  app.post<{ Params: { propertyId: string } }>(
    "/properties/:propertyId/marketing-description",
    { preHandler: requireAuth },
    async (req: AuthedRequest & { params: { propertyId: string } }, reply) => {
      const { propertyId } = req.params;

      if (!(await canAccessProperty(req.userId!, propertyId))) {
        return reply.code(403).send({ error: "Sem permissão sobre este imóvel" });
      }

      const { data: property, error } = await supabaseAdmin
        .from("properties")
        .select(
          "tipo_imovel, bairro, quartos, suites, banheiros, vagas, area_construida, caracteristicas_imovel, caracteristicas_condominio",
        )
        .eq("id", propertyId)
        .single();
      if (error || !property) {
        return reply.code(404).send({ error: "Imóvel não encontrado" });
      }

      let texto: string;
      try {
        texto = await textProvider.generateMarketingDescription({
          tipoImovel: property.tipo_imovel,
          bairro: property.bairro,
          quartos: property.quartos,
          suites: property.suites,
          banheiros: property.banheiros,
          vagas: property.vagas,
          areaConstruida: property.area_construida,
          caracteristicasImovel: (property.caracteristicas_imovel as Record<string, boolean>) ?? {},
          caracteristicasCondominio:
            (property.caracteristicas_condominio as Record<string, boolean>) ?? {},
        });
      } catch (err) {
        req.log.error(err);
        return reply.code(500).send({ error: "Falha ao gerar a descrição" });
      }

      const { error: updateError } = await supabaseAdmin
        .from("properties")
        .update({ descricao_marketing_ia: texto })
        .eq("id", propertyId);
      if (updateError) {
        return reply.code(500).send({ error: updateError.message });
      }

      return reply.send({ descricaoMarketingIa: texto });
    },
  );
}
