import { PgBoss } from "pg-boss";

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL precisa estar definido (veja .env.example)");
}

// pg-boss usa o próprio Postgres do Supabase como fila (cria seu schema
// próprio) - dispensa Redis/infra extra, adequado pra escala pequena.
export const boss = new PgBoss({ connectionString });

// pg-boss emite 'error' em falhas transitórias de conexão (ex: o pooler do
// Supabase encerrando conexões ociosas) - sem esse handler, o Node crasha o
// processo inteiro (comportamento padrão de EventEmitter sem listener de
// erro). pg-boss reconecta sozinho; só logamos, sem derrubar o servidor.
boss.on("error", (err) => {
  console.error("pg-boss error (conexão será retomada automaticamente):", err.message);
});

export const QUEUE_CLASSIFY_PHOTO = "classify-photo";

export type ClassifyPhotoJobData = {
  photoId: string;
};
