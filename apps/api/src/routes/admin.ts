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
}
