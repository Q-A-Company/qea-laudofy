import type { FastifyInstance } from "fastify";
import { isAdmin, requireAuth, type AuthedRequest } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

async function requireAdmin(req: AuthedRequest, reply: import("fastify").FastifyReply) {
  if (!req.userId || !(await isAdmin(req.userId))) {
    reply.code(403).send({ error: "Só administradores podem fazer isso" });
  }
}

type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "corretor";
};

type UpdateUserBody = {
  name: string;
  email: string;
  role?: "admin" | "corretor";
};

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/users",
    { preHandler: [requireAuth, requireAdmin] },
    async (_req, reply) => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, name, email, role, phone, created_at")
        .order("created_at", { ascending: true });
      if (error) return reply.code(500).send({ error: error.message });
      return reply.send(data);
    },
  );

  app.post<{ Body: CreateUserBody }>(
    "/admin/users",
    { preHandler: [requireAuth, requireAdmin] },
    async (req, reply) => {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return reply.code(400).send({ error: "Nome, e-mail e senha são obrigatórios" });
      }
      if (password.length < 6) {
        return reply.code(400).send({ error: "Senha precisa ter ao menos 6 caracteres" });
      }

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (createError || !created.user) {
        return reply.code(400).send({ error: createError?.message ?? "Falha ao criar usuário" });
      }

      // o trigger on_auth_user_created já cria o profile com role='corretor';
      // só precisamos ajustar se o admin pediu explicitamente role='admin'.
      if (role === "admin") {
        await supabaseAdmin.from("profiles").update({ role: "admin" }).eq("id", created.user.id);
      }

      return reply.send({ id: created.user.id, email: created.user.email, role: role ?? "corretor" });
    },
  );

  app.patch<{ Params: { id: string }; Body: UpdateUserBody }>(
    "/admin/users/:id",
    { preHandler: [requireAuth, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const { name, email, role } = req.body;
      if (!name || !email) {
        return reply.code(400).send({ error: "Nome e e-mail são obrigatórios" });
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email,
        user_metadata: { name },
      });
      if (authError) {
        return reply.code(400).send({ error: authError.message });
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ name, email, role: role ?? "corretor" })
        .eq("id", id);
      if (profileError) {
        return reply.code(500).send({ error: profileError.message });
      }

      return reply.send({ id, name, email, role: role ?? "corretor" });
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/admin/users/:id",
    { preHandler: [requireAuth, requireAdmin] },
    async (req: AuthedRequest & { params: { id: string } }, reply) => {
      const { id } = req.params;

      if (id === req.userId) {
        return reply.code(400).send({ error: "Você não pode excluir sua própria conta" });
      }

      const { count, error: countError } = await supabaseAdmin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("broker_id", id);
      if (countError) {
        return reply.code(500).send({ error: countError.message });
      }
      if (count && count > 0) {
        return reply.code(400).send({
          error: `Esse corretor tem ${count} imóvel(is) cadastrado(s). Exclua ou reatribua os imóveis antes de remover o usuário.`,
        });
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        return reply.code(400).send({ error: error.message });
      }

      return reply.send({ deleted: true });
    },
  );
}
