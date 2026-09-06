import type { FastifyReply, FastifyRequest } from "fastify";
import { supabaseAdmin } from "./supabaseAdmin.js";

export type AuthedRequest = FastifyRequest & {
  userId?: string;
};

/** Valida o JWT do Supabase Auth enviado no header Authorization. Não decide
 * permissões por si só - cada rota checa o que precisar (dono do imóvel, admin etc). */
export async function requireAuth(req: AuthedRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token) {
    reply.code(401).send({ error: "Token de autenticação ausente" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    reply.code(401).send({ error: "Token inválido" });
    return;
  }

  req.userId = data.user.id;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

export async function canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("properties")
    .select("broker_id")
    .eq("id", propertyId)
    .single();
  if (!data) return false;
  if (data.broker_id === userId) return true;
  return isAdmin(userId);
}
